// lib/fpl/difficulty.ts
import type { Fixture, Team, Player } from '@/types/fpl';

/** ====== TUNING KNOBS ====== */
// final raw score (old player-centric API) = wOverall*overallStrengthRatio + wAttDef*attDefRatio + wForm*formRatio
export const DIFF_WEIGHTS = {
  wOverall: 0.35, // venue-correct overall strength ratio
  wAttDef: 0.5, // position-aware attack/defence ratio
  wForm: 0.15, // PPG form ratio
};

// tiny away nudge (applied after the blend)
export const HOME_AWAY = { awayFactor: 0.0 };

// how many finished matches to compute PPG form
export const ROLLING_N = 5;

/** 10-step palette (index 0..9) for integer color mapping if you need it */
export const difficultyColors = [
  '#006400',
  '#0F5800',
  '#1E4D00',
  '#2E4200',
  '#3D3700',
  '#4D2C00',
  '#5C2100',
  '#6C1600',
  '#7B0B00',
  '#8B0000',
];

/** ====== FORM HELPERS ====== */
export function getTeamForm(
  teamId: number,
  fixtures: Fixture[],
  n: number = ROLLING_N
): number {
  const finished = fixtures
    .filter((f) => f.finished && (f.team_h === teamId || f.team_a === teamId))
    .sort(
      (a, b) =>
        Date.parse(b.kickoff_time || '0') - Date.parse(a.kickoff_time || '0')
    )
    .slice(0, n);

  if (finished.length === 0) return 0;

  const total = finished.reduce((sum, f) => {
    let pts = 0;
    if (f.team_h === teamId) {
      if ((f.team_h_score ?? 0) > (f.team_a_score ?? 0)) pts = 3;
      else if ((f.team_h_score ?? 0) === (f.team_a_score ?? 0)) pts = 1;
    } else {
      if ((f.team_a_score ?? 0) > (f.team_h_score ?? 0)) pts = 3;
      else if ((f.team_a_score ?? 0) === (f.team_h_score ?? 0)) pts = 1;
    }
    return sum + pts;
  }, 0);

  return total / finished.length;
}

export function buildFormMap(
  teams: Team[],
  fixtures: Fixture[],
  n: number = ROLLING_N
): Record<number, number> {
  const map: Record<number, number> = {};
  teams.forEach((t) => (map[t.id] = getTeamForm(t.id, fixtures, n)));
  return map;
}

/** Simple helpers */
function safeDiv(a: number, b: number) {
  const bb = Math.max(Math.abs(b), 0.0001);
  return a / bb;
}
function minMaxScale(values: number[], lo = 1, hi = 10) {
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const d = mx - mn || 1;
  return (x: number) => lo + ((x - mn) / d) * (hi - lo);
}

/** ====== NEW: Team strength tables (venue-aware, 1..10) ======
 * We DO NOT invent new “ratings”; we blend the provided FPL strengths + form:
 *  - ATT_base  = 0.70*strength_attack_(H/A) + 0.30*strength_overall_(H/A)
 *  - DEF_base  = 0.70*strength_defence_(H/A) + 0.30*strength_overall_(H/A)
 *  - OVR_base  = 0.40*overall_(H/A) + 0.30*ATT_base + 0.30*DEF_base
 *  - FORM_adj  = 1 + clamp((PPG - leagueAvgPPG)/3, -0.15, +0.15)   // ±15% max
 *  - Final     = base * FORM_adj
 * Then we min–max **across all teams** separately for H and A to 1..10.
 */
export type VenueStrength = { att: number; def: number; ovr: number };
export type StrengthTable = Record<
  number,
  { H: VenueStrength; A: VenueStrength }
>;

export function buildVenueStrengthTable(
  teams: Team[],
  fixtures: Fixture[]
): StrengthTable {
  const form = buildFormMap(teams, fixtures, ROLLING_N);
  const leagueAvgPPG =
    teams.reduce((s, t) => s + (form[t.id] ?? 0), 0) /
    Math.max(1, teams.length);

  // raw bases before scaling
  type Row = {
    id: number;
    H: { att: number; def: number; ovr: number; adj: number };
    A: { att: number; def: number; ovr: number; adj: number };
  };
  const rows: Row[] = teams.map((t) => {
    const oH = t.strength_overall_home ?? 0,
      oA = t.strength_overall_away ?? 0;
    const aH = t.strength_attack_home ?? 0,
      aA = t.strength_attack_away ?? 0;
    const dH = t.strength_defence_home ?? 0,
      dA = t.strength_defence_away ?? 0;
    const attH = 0.7 * aH + 0.3 * oH;
    const attA = 0.7 * aA + 0.3 * oA;
    const defH = 0.7 * dH + 0.3 * oH;
    const defA = 0.7 * dA + 0.3 * oA;
    const ovrH = 0.4 * oH + 0.3 * attH + 0.3 * defH;
    const ovrA = 0.4 * oA + 0.3 * attA + 0.3 * defA;
    const ppg = form[t.id] ?? 0;
    const formAdj = clamp(
      1 + clamp((ppg - leagueAvgPPG) / 3, -0.15, 0.15),
      0.75,
      1.25
    );
    return {
      id: t.id,
      H: {
        att: attH * formAdj,
        def: defH * formAdj,
        ovr: ovrH * formAdj,
        adj: formAdj,
      },
      A: {
        att: attA * formAdj,
        def: defA * formAdj,
        ovr: ovrA * formAdj,
        adj: formAdj,
      },
    };
  });

  // scale to 1..10 per venue & metric
  const scale = (vals: number[]) => minMaxScale(vals, 1, 10);
  const sH_att = scale(rows.map((r) => r.H.att));
  const sH_def = scale(rows.map((r) => r.H.def));
  const sH_ovr = scale(rows.map((r) => r.H.ovr));
  const sA_att = scale(rows.map((r) => r.A.att));
  const sA_def = scale(rows.map((r) => r.A.def));
  const sA_ovr = scale(rows.map((r) => r.A.ovr));

  const out: StrengthTable = {};
  rows.forEach((r) => {
    out[r.id] = {
      H: {
        att: round2(sH_att(r.H.att)),
        def: round2(sH_def(r.H.def)),
        ovr: round2(sH_ovr(r.H.ovr)),
      },
      A: {
        att: round2(sA_att(r.A.att)),
        def: round2(sA_def(r.A.def)),
        ovr: round2(sA_ovr(r.A.ovr)),
      },
    };
  });

  // DEBUG: log a compact view
  // console.table(Object.entries(out).map(([id, v]) => ({ id, H_att: v.H.att, H_def: v.H.def, H_ovr: v.H.ovr, A_att: v.A.att, A_def: v.A.def, A_ovr: v.A.ovr })));
  return out;
}

/** From *team T* perspective vs *opponent O* in a given venue,
 * the difficulty triplet (1..10, higher = harder) is just the
 * opponent’s venue‑appropriate strengths:
 *   - attacking difficulty  = O.def (hard to attack against)
 *   - defensive difficulty  = O.att (hard to defend against)
 *   - overall difficulty    = 0.5*O.ovr + 0.25*O.att + 0.25*O.def
 * Return values with a debug block you can surface in logs or tests.
 */
export function fixtureTripletDifficulty(args: {
  strengths: StrengthTable;
  myTeamId: number;
  oppTeamId: number;
  venue: 'H' | 'A'; // venue for *my* team
}) {
  const { strengths, myTeamId, oppTeamId, venue } = args;
  const opp = strengths[oppTeamId]?.[venue === 'H' ? 'A' : 'H']; // opponent is away if I'm home, and vice versa
  if (!opp)
    return { att: 5, def: 5, ovr: 5, debug: { note: 'missing strengths' } };

  const att = opp.def; // how tough to attack (their defence)
  const def = opp.att; // how tough to defend (their attack)
  const ovr = round2(0.5 * opp.ovr + 0.25 * opp.att + 0.25 * opp.def);

  return {
    att: round2(att),
    def: round2(def),
    ovr,
    debug: { oppVenueRow: opp, myTeamId, oppTeamId, venue },
  };
}

/** ====== OLD (kept for backward compatibility): player-centric 1..10 map */
export function computeDifficultyMap(params: {
  selectedPlayer: Player;
  fixtures: Fixture[];
  teams: Team[];
  weights?: Partial<typeof DIFF_WEIGHTS>;
  awayBoost?: number; // overrides HOME_AWAY.awayFactor if passed
}): Record<number, number> {
  const { selectedPlayer, fixtures, teams } = params;

  const wOverall = params.weights?.wOverall ?? DIFF_WEIGHTS.wOverall;
  const wAttDef = params.weights?.wAttDef ?? DIFF_WEIGHTS.wAttDef;
  const wForm = params.weights?.wForm ?? DIFF_WEIGHTS.wForm;
  const awayFactor = params.awayBoost ?? HOME_AWAY.awayFactor;

  const teamMap = new Map<number, Team>(teams.map((t) => [t.id, t]));
  const formMap = buildFormMap(teams, fixtures, ROLLING_N);

  const myTeamId = selectedPlayer.team;
  const myPos = selectedPlayer.element_type; // 1 GKP, 2 DEF, 3 MID, 4 FWD

  const myFixtures = fixtures.filter(
    (f) => f.team_h === myTeamId || f.team_a === myTeamId
  );

  const raws = myFixtures.map((f) => {
    const isHome = f.team_h === myTeamId;
    const oppId = isHome ? f.team_a : f.team_h;

    const opp = teamMap.get(oppId)!;
    const me = teamMap.get(myTeamId)!;

    // Use provided strengths only (venue-aware)
    const oppOverall = isHome
      ? (opp.strength_overall_home ?? 1)
      : (opp.strength_overall_away ?? 1);
    const myOverall = isHome
      ? (me.strength_overall_away ?? 1)
      : (me.strength_overall_home ?? 1);
    const overallRatio = safeDiv(oppOverall, myOverall); // >1 tougher

    const oppAttack = isHome
      ? (opp.strength_attack_home ?? 1)
      : (opp.strength_attack_away ?? 1);
    const oppDef = isHome
      ? (opp.strength_defence_home ?? 1)
      : (opp.strength_defence_away ?? 1);
    const myAttack = isHome
      ? (me.strength_attack_away ?? 1)
      : (me.strength_attack_home ?? 1);
    const myDef = isHome
      ? (me.strength_defence_away ?? 1)
      : (me.strength_defence_home ?? 1);

    let attDefRatio: number;
    if (myPos === 1 || myPos === 2) attDefRatio = safeDiv(oppAttack, myDef);
    else attDefRatio = safeDiv(oppDef, myAttack);

    const myPPG = formMap[myTeamId] ?? 0.0001;
    const oppPPG = formMap[oppId] ?? 0.0001;
    const formRatio = safeDiv(oppPPG, myPPG);

    let raw =
      wOverall * overallRatio + wAttDef * attDefRatio + wForm * formRatio;
    if (!isHome && awayFactor) raw *= 1 + awayFactor;

    return { id: f.id, raw };
  });

  if (raws.length === 0) return {};
  const vals = raws.map((r) => r.raw);
  const mn = Math.min(...vals),
    mx = Math.max(...vals);
  const norm = (x: number) => (mx === mn ? 0.5 : (x - mn) / (mx - mn));
  const out: Record<number, number> = {};
  raws.forEach(({ id, raw }) => (out[id] = round2(1 + norm(raw) * 9)));
  return out;
}

/** utils */
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
