'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

type Fixture = {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number; // not used for calc now (we compute our own)
  team_a_difficulty: number;
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
  kickoff_time: string | null;
};

type CellItem = {
  oppShort: string;
  venue: 'H' | 'A';
  finished: boolean;
  scoreText?: string;

  // New absolute difficulty pieces:
  attRaw?: number; // lower is easier
  defRaw?: number; // lower is easier
  ovRaw?: number; // lower is easier (α·1/xGFp + β·xGAp)

  // After per-GW ranking:
  rank?: number; // 1..20 (1 easiest)
  att10?: number; // display helper (1..10) from rank
  def10?: number;
  ov10?: number;
};

type Grid = Record<number, Record<number, CellItem[]>>;

const difficultyColors = [
  '#0a7d33',
  '#1b7a2f',
  '#2c742a',
  '#3d6c25',
  '#4e6220',
  '#5f561b',
  '#704915',
  '#813a0f',
  '#922a09',
  '#a31803',
];

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
const rankTo10 = (rank: number) => clamp(Math.ceil(rank / 2), 1, 10); // 1..20 → 1..10

// bounded exp(log ratio)
function boundedRatio(a: number, b: number, L = 0.7) {
  const la = Math.log(Math.max(1, a));
  const lb = Math.log(Math.max(1, b));
  const z = clamp(la - lb, -L, L);
  return Math.exp(z);
}

export default function FixturesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const headerRefs = useRef<Record<number, HTMLTableCellElement | null>>({});

  useEffect(() => {
    (async () => {
      try {
        const [dataRes, fixRes] = await Promise.all([
          fetch('/api/data', { headers: { 'Cache-Control': 'no-cache' } }),
          fetch('/api/fixtures', { headers: { 'Cache-Control': 'no-cache' } }),
        ]);
        const data = await dataRes.json();
        const fix = await fixRes.json();
        setTeams(data.teams);
        setFixtures(fix);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const teamMap = useMemo(() => {
    const m: Record<number, Team> = {};
    teams.forEach((t) => (m[t.id] = t));
    return m;
  }, [teams]);

  // const nextGW = useMemo(() => {
  //   const now = Date.now();
  //   const candidates = fixtures
  //     .filter((f) => f.event != null && !f.finished)
  //     .filter((f) =>
  //       f.kickoff_time ? Date.parse(f.kickoff_time) >= now : true
  //     )
  //     .map((f) => f.event as number);
  //   if (!candidates.length) {
  //     const any = fixtures
  //       .filter((f) => f.event != null)
  //       .map((f) => f.event as number);
  //     return any.length ? Math.min(...any) : 1;
  //   }
  //   return Math.min(...candidates);
  // }, [fixtures]);

  // STEP 1: build base grid & compute raw difficulties per match (unfinished only)
  const gridBase: Grid = useMemo(() => {
    if (!teams.length) return {};
    const base: Grid = {};
    teams.forEach((t) => {
      base[t.id] = {};
      for (let gw = 1; gw <= 38; gw++) base[t.id][gw] = [];
    });

    fixtures.forEach((f) => {
      if (!f.event) return;
      const gw = f.event;
      const home = teamMap[f.team_h];
      const away = teamMap[f.team_a];
      if (!home || !away) return;

      // HOME row
      {
        const finished = !!f.finished;
        const item: CellItem = {
          oppShort: away.short_name,
          venue: 'H',
          finished,
          scoreText: finished
            ? `${f.team_h_score ?? 0}–${f.team_a_score ?? 0}`
            : undefined,
        };

        if (!finished) {
          // xGF proxy (home trying to score) = boundedRatio(home.att_home, away.def_away)
          const xGFp = boundedRatio(
            home.strength_attack_home ?? 1,
            away.strength_defence_away ?? 1
          );
          // xGA proxy (home likely to concede) = boundedRatio(away.att_away, home.def_home)
          const xGAp = boundedRatio(
            away.strength_attack_away ?? 1,
            home.strength_defence_home ?? 1
          );

          const alpha = 0.45,
            beta = 0.55;
          const attRaw = 1 / xGFp; // harder if we can’t create
          const defRaw = xGAp; // harder if likely to concede
          const ovRaw = alpha * attRaw + beta * defRaw;

          item.attRaw = attRaw;
          item.defRaw = defRaw;
          item.ovRaw = ovRaw;
        }

        base[f.team_h][gw].push(item);
      }

      // AWAY row
      {
        const finished = !!f.finished;
        const item: CellItem = {
          oppShort: home.short_name,
          venue: 'A',
          finished,
          scoreText: finished
            ? `${f.team_a_score ?? 0}–${f.team_h_score ?? 0}`
            : undefined,
        };

        if (!finished) {
          const xGFp = boundedRatio(
            away.strength_attack_away ?? 1,
            home.strength_defence_home ?? 1
          );
          const xGAp = boundedRatio(
            home.strength_attack_home ?? 1,
            away.strength_defence_away ?? 1
          );

          const alpha = 0.45,
            beta = 0.55;
          const attRaw = 1 / xGFp;
          const defRaw = xGAp;
          const ovRaw = alpha * attRaw + beta * defRaw;

          item.attRaw = attRaw;
          item.defRaw = defRaw;
          item.ovRaw = ovRaw;
        }

        base[f.team_a][gw].push(item);
      }
    });

    return base;
  }, [teams, fixtures, teamMap]);

  // STEP 2: per-GW ranking (absolute across the league). Handle doubles by averaging raws first.
  const gridRanked: Grid = useMemo(() => {
    // For each GW, compute average attRaw/defRaw/ovRaw per team, then rank ovRaw (1..20).
    const out: Grid = JSON.parse(JSON.stringify(gridBase)); // shallow copy structure
    for (let gw = 1; gw <= 38; gw++) {
      const rows: { teamId: number; att: number; def: number; ov: number }[] =
        [];

      teams.forEach((t) => {
        const items = (gridBase[t.id]?.[gw] ?? []).filter(
          (x) => !x.finished && x.ovRaw != null
        );
        if (!items.length) return;

        const att =
          items.reduce((s, x) => s + (x.attRaw as number), 0) / items.length;
        const def =
          items.reduce((s, x) => s + (x.defRaw as number), 0) / items.length;
        const ov =
          items.reduce((s, x) => s + (x.ovRaw as number), 0) / items.length;

        rows.push({ teamId: t.id, att, def, ov });
      });

      // lower raw = easier → rank ascending
      rows.sort((a, b) => a.ov - b.ov || a.teamId - b.teamId);
      const rankMap: Record<number, number> = {};
      rows.forEach((r, i) => (rankMap[r.teamId] = i + 1));

      // write back ranks & 10-scale color helper (by rank)
      teams.forEach((t) => {
        const bucket = out[t.id]?.[gw];
        if (!bucket) return;
        const r = rankMap[t.id];
        if (!r) return; // no unfinished fixtures for that team in this GW

        // Use rank->10 mapping for display
        const ov10 = rankTo10(r);

        // derive att/def on 10-scale with same rank color (or you can build separate ranks if you want)
        // Here, we keep att10/def10 from their own raws but mapped by team’s OV rank color for consistency.
        bucket.forEach((it) => {
          if (it.finished) return;
          it.rank = r;
          it.ov10 = ov10;
          // Optional: if you want separate att/def ranks, compute them similarly; for now use ov10 color.
          it.att10 = ov10;
          it.def10 = ov10;
        });
      });
    }
    return out;
  }, [gridBase, teams]);

  // Ranking by next 4 using new ov10 (rank-based color)
  const nextGW = useMemo(() => {
    const now = Date.now();
    const candidates = fixtures
      .filter((f) => f.event != null && !f.finished)
      .filter((f) =>
        f.kickoff_time ? Date.parse(f.kickoff_time) >= now : true
      )
      .map((f) => f.event as number);
    if (!candidates.length) {
      const any = fixtures
        .filter((f) => f.event != null)
        .map((f) => f.event as number);
      return any.length ? Math.min(...any) : 1;
    }
    return Math.min(...candidates);
  }, [fixtures]);

  const nextFourRanks = useMemo(() => {
    if (!teams.length) return [];
    const rows = teams.map((t) => {
      const upcoming: { gw: number; label: string; diff10: number }[] = [];
      for (let gw = nextGW; gw <= 38; gw++) {
        const cells = gridRanked[t.id]?.[gw] ?? [];
        cells.forEach((it) => {
          if (!it.finished && it.ov10 != null) {
            upcoming.push({
              gw,
              label: `${it.oppShort} (${it.venue})`,
              diff10: it.ov10!,
            });
          }
        });
        if (upcoming.length >= 4) break;
      }
      const slice4 = upcoming.slice(0, 4);
      const total = slice4.reduce((s, x) => s + x.diff10, 0);
      return { teamId: t.id, team: t.name, items: slice4, total };
    });
    rows.sort((a, b) => a.total - b.total || a.team.localeCompare(b.team));
    return rows;
  }, [teams, gridRanked, nextGW]);

  // Auto-scroll to next GW
  const scrollRefCurrent = scrollRef.current;
  useEffect(() => {
    const scroller = scrollRef.current;
    const headerCell = headerRefs.current[nextGW];
    if (!scroller || !headerCell) return;
    const offsetLeft = headerCell.offsetLeft - 180;
    scroller.scrollTo({
      left: Math.max(0, offsetLeft - 8),
      behavior: 'smooth',
    });
  }, [nextGW, teams.length, scrollRefCurrent]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading fixtures…</div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Legend / Next GW */}
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-medium">Legend:</span>
        <span className="inline-flex items-center gap-1">
          <span
            className="h-3 w-4 rounded"
            style={{ background: difficultyColors[0] }}
          />{' '}
          1 (easiest)
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="h-3 w-4 rounded"
            style={{ background: difficultyColors[9] }}
          />{' '}
          10 (hardest)
        </span>
        <span className="text-muted-foreground">
          Finished fixtures show scores. Next GW highlighted.
        </span>
        <span className="ml-auto text-muted-foreground">
          Next GW: <b>GW{nextGW}</b>
        </span>
      </div>

      {/* Ranking by total difficulty of next 4 */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Next 4 (labels)</TableHead>
              <TableHead className="text-right">Total Difficulty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nextFourRanks.map((row, idx) => (
              <TableRow key={row.teamId}>
                <TableCell className="text-center">{idx + 1}</TableCell>
                <TableCell>{row.team}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {row.items.length === 0 ? (
                      <span className="text-muted-foreground text-sm">
                        No upcoming fixtures
                      </span>
                    ) : (
                      row.items.map((it, i) => (
                        <span
                          key={i}
                          className="rounded px-1.5 py-0.5 text-[11px] text-white"
                          style={{
                            backgroundColor:
                              difficultyColors[rankTo10(it.diff10) - 1],
                          }}
                          title={`GW${it.gw} • Difficulty ${it.diff10}/10 (rank-mapped)`}
                        >
                          GW{it.gw}: {it.label} {it.diff10}
                        </span>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.total}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Fixtures Grid */}
      <div ref={scrollRef} className="overflow-auto rounded-lg border">
        <Table className="min-w-[1200px]">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-background min-w-[180px]">
                Team
              </TableHead>
              {Array.from({ length: 38 }).map((_, i) => {
                const gw = i + 1;
                const isNext = gw === nextGW;
                return (
                  <TableHead
                    key={gw}
                    ref={(el) => {
                      if (el) headerRefs.current[gw] = el;
                    }}
                    className={`text-center min-w-[120px] ${isNext ? 'bg-accent/40 border-b-2 border-accent font-semibold' : ''}`}
                    title={isNext ? 'Next Gameweek' : undefined}
                  >
                    GW{gw}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {teams
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="sticky left-0 z-10 bg-background font-medium min-w-[180px]">
                    {t.name}
                  </TableCell>

                  {Array.from({ length: 38 }).map((_, idx) => {
                    const gw = idx + 1;
                    const items = gridRanked[t.id]?.[gw] ?? [];
                    const isNext = gw === nextGW;

                    if (items.length === 0) {
                      return (
                        <TableCell
                          key={gw}
                          className={`text-center text-muted-foreground ${isNext ? 'bg-accent/10' : ''}`}
                        >
                          –
                        </TableCell>
                      );
                    }

                    const allFinished = items.every((it) => it.finished);
                    if (allFinished) {
                      return (
                        <TableCell
                          key={gw}
                          className={`${isNext ? 'bg-accent/10' : ''} p-1`}
                        >
                          <div className="flex flex-col gap-1">
                            {items.map((it, k) => (
                              <div
                                key={k}
                                className="rounded px-1.5 py-1 text-[11px] text-center bg-muted"
                              >
                                {it.scoreText} {it.oppShort} ({it.venue})
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      );
                    }

                    // If doubles, we used averaged raws for ranking; display first label + +n
                    const first = items[0];
                    const more = items.length - 1;
                    const rank = items[0].rank!;
                    const colorIdx = rankTo10(rank) - 1;

                    // Averages shown under the colored chip (att/def/overall are RAW-based, but color is by rank)
                    const attAvg = round2(
                      items.reduce((s, x) => s + (x.attRaw ?? 0), 0) /
                        items.length
                    );
                    const defAvg = round2(
                      items.reduce((s, x) => s + (x.defRaw ?? 0), 0) /
                        items.length
                    );
                    const ovAvg = round2(
                      items.reduce((s, x) => s + (x.ovRaw ?? 0), 0) /
                        items.length
                    );

                    return (
                      <TableCell
                        key={gw}
                        className={`${isNext ? 'bg-accent/10' : ''} p-1`}
                      >
                        <div
                          className="rounded px-1.5 py-1 text-[11px] text-center text-white"
                          style={{
                            backgroundColor: difficultyColors[colorIdx],
                          }}
                          title={`GW rank ${rank} (1 easiest • 20 hardest)`}
                        >
                          {first?.oppShort} ({first?.venue})
                          {more > 0 ? ` +${more}` : ''} {rank}
                        </div>
                        <div className="mt-1 grid grid-cols-3 gap-1 text-[10px] leading-tight text-center">
                          <div
                            className="rounded bg-muted px-1 py-[2px]"
                            title="Attacking raw (lower = easier)"
                          >
                            {attAvg.toFixed(2)}
                          </div>
                          <div
                            className="rounded bg-muted px-1 py-[2px]"
                            title="Defensive raw (lower = easier)"
                          >
                            {defAvg.toFixed(2)}
                          </div>
                          <div
                            className="rounded bg-muted px-1 py-[2px]"
                            title="Overall raw (lower = easier)"
                          >
                            {ovAvg.toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
