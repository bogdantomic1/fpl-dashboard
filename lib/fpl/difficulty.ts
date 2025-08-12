// lib/fpl/difficulty.ts
import type { Fixture, Team, Player } from '@/types/fpl';

/** ====== TUNING KNOBS ====== */
// final raw score = wOverall*overallStrengthRatio + wAttDef*attDefRatio + wForm*formRatio
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

/** ====== MAIN: use only provided strengths + form + att/def ratio ====== */
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

  // only fixtures for this player's team
  const myFixtures = fixtures.filter(
    (f) => f.team_h === myTeamId || f.team_a === myTeamId
  );

  const raws = myFixtures.map((f) => {
    const isHome = f.team_h === myTeamId;
    const oppId = isHome ? f.team_a : f.team_h;

    const opp = teamMap.get(oppId)!;
    const me = teamMap.get(myTeamId)!;

    // NOTE (your clarification): treat these as supplied "strength ratings" and don't derive our own.
    // Venue-correct overall strengths (opponent vs my team)
    const oppOverall = isHome //oppOverall
      ? (opp.strength_overall_home ?? 1)
      : (opp.strength_overall_away ?? 1);
    const myOverall = isHome
      ? (me.strength_overall_away ?? 1)
      : (me.strength_overall_home ?? 1);
    const overallRatio = safeDiv(oppOverall, myOverall); // >1 tougher

    // Position-aware attack/defence ratio using provided strength_attack/strength_defence
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
    if (myPos === 1 || myPos === 2) {
      // GK/DEF find it hard when opp attack big vs my defence
      attDefRatio = safeDiv(oppAttack, myDef);
    } else {
      // MID/FWD find it hard when opp defence big vs my attack
      attDefRatio = safeDiv(oppDef, myAttack);
    }

    // PPG form ratio (opp vs me)
    const myPPG = formMap[myTeamId] ?? 0.0001;
    const oppPPG = formMap[oppId] ?? 0.0001;
    const formRatio = safeDiv(oppPPG, myPPG);

    // Blend
    let raw =
      wOverall * overallRatio + wAttDef * attDefRatio + wForm * formRatio;

    // Away nudge
    if (!isHome && awayFactor) raw *= 1 + awayFactor;

    return {
      id: f.id,
      raw,
      teamId: oppId,
      kickoff: f.kickoff_time,
      isHome,
      opponent: opp.name,
      overallRatio,
      attDefRatio,
      formRatio,
      myPPG,
      oppPPG,
      myPos,
      myTeamId,
      myTeam: me.name,
      myOverall,
      oppOverall,
      myAttack,
      myDef,
      oppAttack,
      oppDef,
      isHome,
    };
  });

  console.log(raws);

  if (raws.length === 0) return {};

  // Normalize to 1..10 (continuous) with 2 decimals, across THIS player's fixtures
  const vals = raws.map((r) => r.raw);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const norm = (x: number) => (max === min ? 0.5 : (x - min) / (max - min));

  const out: Record<number, number> = {};
  raws.forEach(({ id, raw }) => {
    const cont = 1 + norm(raw) * 9;
    out[id] = parseFloat(cont.toFixed(2));
  });
  return out;
}

/** guard for division */
function safeDiv(a: number, b: number) {
  const bb = Math.max(Math.abs(b), 0.0001);
  return a / bb;
}
