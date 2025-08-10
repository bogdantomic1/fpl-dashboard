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
};

type Fixture = {
  id: number;
  event: number | null; // 1..38 or null
  team_h: number;
  team_a: number;
  team_h_difficulty: number; // 1..5
  team_a_difficulty: number; // 1..5
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
  kickoff_time: string | null;
};

type CellItem = {
  oppShort: string;
  venue: 'H' | 'A';
  diff10: number; // 1..10 (for upcoming only)
  finished: boolean;
  scoreText?: string; // e.g. "1–2"
};

type Grid = Record<number, Record<number, CellItem[]>>; // teamId -> gw -> items[]

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
const fiveToTen = (x: number) => clamp(Math.round(x * 2), 1, 10);

export default function FixturesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll container + refs to each GW header cell
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

  // Determine the "next gameweek": earliest event with an upcoming/unfinished match
  const nextGW = useMemo(() => {
    const now = Date.now();
    const candidateEvents = fixtures
      .filter((f: Fixture) => f.event != null && !f.finished)
      .filter((f) =>
        f.kickoff_time ? Date.parse(f.kickoff_time) >= now : true
      )
      .map((f) => f.event as number);

    if (candidateEvents.length === 0) {
      const anyEvents = fixtures
        .filter((f) => f.event != null)
        .map((f) => f.event as number);
      if (anyEvents.length === 0) return 1;
      return Math.min(38, Math.max(1, Math.min(...anyEvents)));
    }
    return Math.min(...candidateEvents);
  }, [fixtures]);

  // Build grid with doubles/blanks + finished score handling
  const grid: Grid = useMemo(() => {
    if (!teams.length) return {};
    const base: Grid = {};
    teams.forEach((t) => {
      base[t.id] = {};
      for (let gw = 1; gw <= 38; gw++) base[t.id][gw] = [];
    });

    fixtures.forEach((f: Fixture) => {
      if (!f.event) return;
      const gw = f.event;

      // Home row
      const oppA = teamMap[f.team_a];
      if (oppA) {
        const finished = !!f.finished;
        const labelScore = finished
          ? `${f.team_h_score ?? 0}–${f.team_a_score ?? 0}`
          : undefined;

        base[f.team_h][gw].push({
          oppShort: oppA.short_name,
          venue: 'H',
          diff10: finished ? 0 : fiveToTen(f.team_h_difficulty),
          finished,
          scoreText: labelScore,
        });
      }

      // Away row
      const oppH = teamMap[f.team_h];
      if (oppH) {
        const finished = !!f.finished;
        const labelScore = finished
          ? `${f.team_a_score ?? 0}–${f.team_h_score ?? 0}`
          : undefined;

        base[f.team_a][gw].push({
          oppShort: oppH.short_name,
          venue: 'A',
          diff10: finished ? 0 : fiveToTen(f.team_a_difficulty),
          finished,
          scoreText: labelScore,
        });
      }
    });

    return base;
  }, [teams, fixtures, teamMap]);

  // NEW: rank teams by TOTAL difficulty of their next 4 upcoming matches from nextGW (counts doubles)
  const nextFourRanks = useMemo(() => {
    if (!teams.length) return [];
    // For each team, build a flat list of its upcoming fixtures from nextGW onward (unfinished only)
    const rows = teams.map((t) => {
      const upcoming: { gw: number; label: string; diff10: number }[] = [];

      for (let gw = nextGW; gw <= 38; gw++) {
        const cells = grid[t.id]?.[gw] ?? [];
        // In case of doubles, we’ll have 2+ items — push all unfinished ones
        cells.forEach((it) => {
          if (!it.finished) {
            upcoming.push({
              gw,
              label: `${it.oppShort} (${it.venue})`,
              diff10: it.diff10,
            });
          }
        });
        if (upcoming.length >= 4) break;
      }

      const slice4 = upcoming.slice(0, 4);
      const total = slice4.reduce((s, x) => s + x.diff10, 0);
      return {
        teamId: t.id,
        team: t.name,
        items: slice4, // up to 4 entries
        total,
      };
    });

    // Sort easiest first (lowest total)
    rows.sort((a, b) => a.total - b.total || a.team.localeCompare(b.team));
    return rows;
  }, [teams, grid, nextGW]);

  // After header cells exist, scroll so nextGW header is placed at the left edge
  const scrollRefCurrent = scrollRef.current; // to satisfy deps
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
          Finished fixtures show scores without color. Next GW highlighted.
        </span>
        <span className="ml-auto text-muted-foreground">
          Next GW: <b>GW{nextGW}</b>
        </span>
      </div>

      {/* NEW: Ranking by total difficulty of next 4 */}
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
                            backgroundColor: difficultyColors[it.diff10 - 1],
                          }}
                          title={`GW${it.gw} • Difficulty ${it.diff10}/10`}
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
                      if (el) {
                        headerRefs.current[gw] = el;
                      }
                    }}
                    className={`text-center min-w-[90px] ${
                      isNext
                        ? 'bg-accent/40 border-b-2 border-accent font-semibold'
                        : ''
                    }`}
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
                    const items = grid[t.id]?.[gw] ?? [];
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

                    return (
                      <TableCell
                        key={gw}
                        className={`${isNext ? 'bg-accent/10' : ''} p-1`}
                      >
                        <div className="flex flex-col gap-1">
                          {items.map((it, k) => {
                            const baseCls =
                              'rounded px-1.5 py-1 text-[11px] text-center leading-tight';
                            if (it.finished) {
                              return (
                                <div
                                  key={k}
                                  className={`${baseCls} bg-muted text-foreground`}
                                  title="Finished"
                                >
                                  {it.scoreText} {it.oppShort} ({it.venue})
                                </div>
                              );
                            }
                            return (
                              <div
                                key={k}
                                className={`${baseCls} text-white`}
                                style={{
                                  backgroundColor:
                                    difficultyColors[it.diff10 - 1],
                                }}
                                title={`Difficulty ${it.diff10}/10`}
                              >
                                {it.oppShort} ({it.venue})
                              </div>
                            );
                          })}
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
