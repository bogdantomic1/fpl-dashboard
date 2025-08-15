/* tests/test-dataset-strengths.ts */
import fs from 'fs';
import path from 'path';

type Team = {
  id: number;
  name: string;
  short_name: string;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
};

function loadTeams(): Team[] {
  const p = path.resolve(__dirname, 'data', 'teams.sample.json');
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw) as Team[];
}

function linNormToBucket10(val: number, min: number, max: number) {
  if (max === min) return 5;
  const z = (val - min) / (max - min); // 0..1
  return Math.max(1, Math.min(10, Math.round(1 + z * 9))); // 1..10
}

function main() {
  const teams = loadTeams();

  // Venue-averaged base indices
  const rows = teams.map((t) => {
    const att = (t.strength_attack_home + t.strength_attack_away) / 2;
    const def = (t.strength_defence_home + t.strength_defence_away) / 2;
    const ovr = (t.strength_overall_home + t.strength_overall_away) / 2;
    return { id: t.id, name: t.name, short: t.short_name, att, def, ovr };
  });

  // For bucket mapping, stronger => higher bucket (10 best)
  const minAtt = Math.min(...rows.map((r) => r.att));
  const maxAtt = Math.max(...rows.map((r) => r.att));
  const minDef = Math.min(...rows.map((r) => r.def));
  const maxDef = Math.max(...rows.map((r) => r.def));
  const minOvr = Math.min(...rows.map((r) => r.ovr));
  const maxOvr = Math.max(...rows.map((r) => r.ovr));

  // Bucketed strengths + positions by overall (descending)
  const enriched = rows.map((r) => ({
    ...r,
    att10: linNormToBucket10(r.att, minAtt, maxAtt),
    def10: linNormToBucket10(r.def, minDef, maxDef),
    ovr10: linNormToBucket10(r.ovr, minOvr, maxOvr),
  }));

  const table = enriched
    .slice()
    .sort((a, b) => b.ovr - a.ovr || b.att - a.att || b.def - a.def)
    .map((r, i) => ({ pos: i + 1, ...r }));

  // --- Logs you asked for ---
  console.log('=== League table by OVR (1 = strongest) ===');
  table.forEach((r) => {
    console.log(
      `${r.pos.toString().padStart(2, ' ')}. ${r.short.padEnd(3, ' ')}  ` +
        `OVR=${r.ovr.toFixed(1)} att=${r.att.toFixed(1)} def=${r.def.toFixed(1)}  ` +
        `→ buckets: att-${r.att10} def-${r.def10} ovr-${r.ovr10}`
    );
  });

  console.log('\n=== Per-team compact line (for your /fixtures UI) ===');
  enriched
    .sort((a, b) => b.ovr10 - a.ovr10 || b.att10 - a.att10 || b.def10 - a.def10)
    .forEach((r) => {
      console.log(`${r.short} att-${r.att10} def-${r.def10} ovr-${r.ovr10}`);
    });

  // JSON summary (if you want to assert in automated tests)
  const summary = enriched.reduce(
    (acc, r) => {
      acc[r.short] = { att10: r.att10, def10: r.def10, ovr10: r.ovr10 };
      return acc;
    },
    {} as Record<string, { att10: number; def10: number; ovr10: number }>
  );

  fs.writeFileSync(
    path.resolve(__dirname, 'data', 'teams.sample.summary.json'),
    JSON.stringify({ table, summary }, null, 2),
    'utf8'
  );
  console.log('\nWrote tests/data/teams.sample.summary.json');
}

main();
