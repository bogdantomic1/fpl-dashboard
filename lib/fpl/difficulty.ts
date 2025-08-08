import type { Fixture, Team, Player } from '@/types/fpl';

/** Weights & knobs (tweak here, not in page.tsx) */
export const DIFF_WEIGHTS = {
  wStrength: 0.7, // blend weight on strength ratio
  wForm: 0.3, // blend weight on form ratio
};
export const HOME_AWAY = {
  // keep 0 here for now; you can re‑enable tiny nudges later
  awayFactor: 0.0, // e.g. 0.05 = +5% harder when away (applied after raw)
};

/** Your 10-step palette (index 0..9) */
export const difficultyColors = [
  '#006400', // 1
  '#0F5800', // 2
  '#1E4D00', // 3
  '#2E4200', // 4
  '#3D3700', // 5
  '#4D2C00', // 6
  '#5C2100', // 7
  '#6C1600', // 8
  '#7B0B00', // 9
  '#8B0000', // 10
];

/** Points-per-game form over last N finished fixtures */
export function getTeamForm(
  teamId: number,
  fixtures: Fixture[],
  n: number = 5
): number {
  const finished = fixtures
    .filter((f) => f.finished && (f.team_h === teamId || f.team_a === teamId))
    .sort((a, b) => Date.parse(b.kickoff_time) - Date.parse(a.kickoff_time))
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

/** Helper: map teamId -> form */
export function buildFormMap(
  teams: Team[],
  fixtures: Fixture[],
  n: number = 5
): Record<number, number> {
  const map: Record<number, number> = {};
  teams.forEach((t) => (map[t.id] = getTeamForm(t.id, fixtures, n)));
  return map;
}

/**
 * Pure difficulty computation.
 * Returns { [fixtureId]: difficulty(1..10 with 2 decimals) } for the selected player's fixtures.
 */
export function computeDifficultyMap(params: {
  selectedPlayer: Player;
  fixtures: Fixture[];
  teams: Team[];
  weights?: Partial<typeof DIFF_WEIGHTS>;
  awayBoost?: number; // overrides HOME_AWAY.awayFactor if passed
}): Record<number, number> {
  const { selectedPlayer, fixtures, teams } = params;
  const wStrength = params.weights?.wStrength ?? DIFF_WEIGHTS.wStrength;
  const wForm = params.weights?.wForm ?? DIFF_WEIGHTS.wForm;
  const awayFactor = params.awayBoost ?? HOME_AWAY.awayFactor;

  const teamMap = new Map<number, Team>(teams.map((t) => [t.id, t]));
  const formMap = buildFormMap(teams, fixtures, 5);

  const myTeamId = selectedPlayer.team;

  // only fixtures for this player's team
  const playerFixtures = fixtures.filter(
    (f) => f.team_h === myTeamId || f.team_a === myTeamId
  );

  // gather raw scores
  const raws = playerFixtures.map((f) => {
    const isHome = f.team_h === myTeamId;
    const oppId = isHome ? f.team_a : f.team_h;

    const opp = teamMap.get(oppId)!;
    const sel = teamMap.get(myTeamId)!;

    // venue strengths
    const oppStr = isHome
      ? (opp.strength_overall_away ?? 1)
      : (opp.strength_overall_home ?? 1);
    const selStr = isHome
      ? (sel.strength_overall_home ?? 1)
      : (sel.strength_overall_away ?? 1);

    const oppForm = formMap[oppId] ?? 0;
    const selForm = formMap[myTeamId] ?? 0;

    const ratioStr = oppStr / selStr;
    const ratioForm = selForm > 0 ? oppForm / selForm : 1;

    let raw = wStrength * ratioStr + wForm * ratioForm;

    // optional: small nudge if away
    if (!isHome && awayFactor) {
      raw = raw * (1 + awayFactor);
    }
    return { id: f.id, raw };
  });

  if (raws.length === 0) return {};

  // normalize across the batch -> 1..10 with 2 decimals
  const vals = raws.map((r) => r.raw);
  const min = Math.min(...vals);
  const max = Math.max(...vals);

  const normalize = (x: number) =>
    max === min ? 0.5 : (x - min) / (max - min);
  const result: Record<number, number> = {};
  raws.forEach(({ id, raw }) => {
    const cont = 1 + normalize(raw) * 9;
    result[id] = parseFloat(cont.toFixed(2));
  });
  return result;
}
