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
import {
  buildVenueStrengthTable,
  fixtureTripletDifficulty,
} from '@/lib/fpl/difficulty';

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
  event: number | null; // 1..38 or null
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
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

  // triplet difficulties (1..10, higher = harder) for this team vs opponent
  att?: number;
  def?: number;
  ovr?: number;

  // rank color helpers
  rank?: number; // 1..20 (1 easiest)
  color10?: number; // 1..10 mapped from rank
};

type Grid = Record<number, Record<number, CellItem[]>>;

const difficultyColors = [
  // 1–6: Green shades
  '#0a7d33',
  '#137a31',
  '#1c742f',
  '#256c2d',
  '#2e622b',
  '#375629',

  // 7–14: Gray shades
  '#444444',
  '#4f4f4f',
  '#5a5a5a',
  '#656565',
  '#707070',
  '#7b7b7b',
  '#868686',
  '#919191',

  // 15–20: Red shades
  '#922a09',
  '#9b2207',
  '#a31803',
  '#b01200',
  '#bb0a00',
  '#c30000',
];

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
// 1..20 → 1..10 buckets for coloring
const rankTo10 = (rank: number) => clamp(Math.ceil(rank / 2), 1, 10);

export default function FixturesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  // build once whenever teams/fixtures change
  const strengths = useMemo(
    () => buildVenueStrengthTable(teams, fixtures),
    [teams, fixtures]
  );

  // sticky header & autoscroll
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

  // Next GW (first unfinished in future)
  const nextGW = useMemo(() => {
    const now = Date.now();
    const upcoming = fixtures
      .filter((f) => f.event != null && !f.finished)
      .filter((f) =>
        f.kickoff_time ? Date.parse(f.kickoff_time) >= now : true
      )
      .map((f) => f.event as number);
    if (upcoming.length) return Math.min(...upcoming);
    const any = fixtures
      .filter((f) => f.event != null)
      .map((f) => f.event as number);
    return any.length ? Math.min(...any) : 1;
  }, [fixtures]);

  /** STEP 1: base grid with computed ATT/DEF/OVR via strengths table */
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

      // HOME row (my team = home)
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
          const trip = fixtureTripletDifficulty({
            strengths,
            myTeamId: home.id,
            oppTeamId: away.id,
            venue: 'H',
          });
          item.att = trip.att;
          item.def = trip.def;
          item.ovr = trip.ovr;
        }
        base[home.id][gw].push(item);
      }

      // AWAY row (my team = away)
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
          const trip = fixtureTripletDifficulty({
            strengths,
            myTeamId: away.id,
            oppTeamId: home.id,
            venue: 'A',
          });
          item.att = trip.att;
          item.def = trip.def;
          item.ovr = trip.ovr;
        }
        base[away.id][gw].push(item);
      }
    });

    return base;
  }, [teams, fixtures, strengths, teamMap]);

  /**
   * STEP 2: per‑GW ranking across league by average OVR (doubles averaged).
   * Lower OVR = easier ⇒ rank ascending (1..20).
   * Color index = rank mapped to 1..10 (two ranks per color step).
   */
  const gridRanked: Grid = useMemo(() => {
    // copy structure
    const out: Grid = JSON.parse(JSON.stringify(gridBase));

    for (let gw = 1; gw <= 38; gw++) {
      const rows: { teamId: number; avgOvr: number }[] = [];

      teams.forEach((t) => {
        const items = (gridBase[t.id]?.[gw] ?? []).filter(
          (x) => !x.finished && x.ovr != null
        );
        if (!items.length) return;
        const avgOvr =
          items.reduce((s, x) => s + (x.ovr as number), 0) / items.length;
        rows.push({ teamId: t.id, avgOvr });
      });

      // rank easiest first
      rows.sort((a, b) => a.avgOvr - b.avgOvr || a.teamId - b.teamId);
      const rankMap: Record<number, number> = {};
      rows.forEach((r, i) => (rankMap[r.teamId] = i + 1));

      // write rank + color helper back on each unfinished item
      teams.forEach((t) => {
        const bucket = out[t.id]?.[gw];
        if (!bucket) return;
        const r = rankMap[t.id];
        if (!r) return; // no unfinished fixtures for that team in this GW
        const c10 = r; //rankTo10(r)
        bucket.forEach((it) => {
          if (it.finished) return;
          it.rank = r;
          it.color10 = c10;
        });
      });
    }

    return out;
  }, [gridBase, teams]);

  // Ranking table: total of next 4 (use rank→color10 numbers for the mini chips)
  const nextFourRanks = useMemo(() => {
    if (!teams.length) return [];
    const rows = teams.map((t) => {
      const upcoming: { gw: number; label: string; color10: number }[] = [];
      for (let gw = nextGW; gw <= 38; gw++) {
        const cells = gridRanked[t.id]?.[gw] ?? [];
        cells.forEach((it) => {
          if (!it.finished && it.color10 != null) {
            upcoming.push({
              gw,
              label: `${it.oppShort} (${it.venue})`,
              color10: it.color10!,
            });
          }
        });
        if (upcoming.length >= 4) break;
      }
      const slice4 = upcoming.slice(0, 4);
      const total = slice4.reduce((s, x) => s + x.color10, 0);
      return { teamId: t.id, team: t.name, items: slice4, total };
    });
    rows.sort((a, b) => a.total - b.total || a.team.localeCompare(b.team));
    return rows;
  }, [teams, gridRanked, nextGW]);

  // autoscroll to next GW header
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
            style={{ background: difficultyColors[19] }}
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
                            backgroundColor: difficultyColors[it.color10 - 1],
                          }}
                          title={`GW${it.gw} • color ${it.color10}/10 (rank‑mapped)`}
                        >
                          GW{it.gw}: {it.label} {it.color10}
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

                    // doubles: average triplets for display & use team rank color
                    const rank = items[0].rank!;
                    const colorIdx = (items[0].color10 ?? rankTo10(rank)) - 1;

                    const attAvg = round2(
                      items.reduce((s, x) => s + (x.att ?? 0), 0) / items.length
                    );
                    const defAvg = round2(
                      items.reduce((s, x) => s + (x.def ?? 0), 0) / items.length
                    );
                    const ovrAvg = round2(
                      items.reduce((s, x) => s + (x.ovr ?? 0), 0) / items.length
                    );

                    const first = items[0];
                    const more = items.length - 1;

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
                            title="Attacking difficulty (1..10, higher=harder)"
                          >
                            {attAvg.toFixed(2)}
                          </div>
                          <div
                            className="rounded bg-muted px-1 py-[2px]"
                            title="Defensive difficulty (1..10, higher=harder)"
                          >
                            {defAvg.toFixed(2)}
                          </div>
                          <div
                            className="rounded bg-muted px-1 py-[2px]"
                            title="Overall difficulty (1..10, higher=harder)"
                          >
                            {ovrAvg.toFixed(2)}
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
