'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Team = { id: number; name: string; short_name: string };
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

type GwInfo = {
  diff5: number; // this team’s difficulty for the GW (1..5; blank=6)
  oppId: number | null; // opponent team id (or null/blank)
  oppShort: string; // opponent short
  venue: 'H' | 'A' | '-'; // venue
  oppDiff5: number; // opponent’s difficulty value in that GW toward this team (1..5; blank=6)
};

type PerGwRow = {
  gw: number;
  starters: {
    teamId: number;
    name: string;
    info: GwInfo;
    gap: number;
    color: 'green' | 'yellow' | 'blue';
  }[];
  bench: { teamId: number; name: string; info: GwInfo; gap: number }[];
};

type RankedCombo = {
  teamIds: number[];
  teamNames: string[];
  total: number; // lower = better (we compute 5 - gap per starter)
  perGW: PerGwRow[];
};

type ScoringMode = 'difficulty' | 'gap';

const MAX_COMBOS = 200_000; // safety cap
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export default function RotationPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState<ScoringMode>('difficulty');
  // Controls
  const [numWeeks, setNumWeeks] = useState(6); // window length W
  const [poolSize, setPoolSize] = useState(2); // N
  const [starters, setStarters] = useState(1); // S (<=N)
  const [limit, setLimit] = useState(25); // show top K

  const [results, setResults] = useState<RankedCombo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  // Determine next GW
  const nextGW = useMemo(() => {
    const now = Date.now();
    const upcoming = fixtures
      .filter((f) => f.event != null && !f.finished)
      .filter((f) =>
        f.kickoff_time ? Date.parse(f.kickoff_time) >= now : true
      )
      .map((f) => f.event as number);
    if (upcoming.length > 0) return Math.min(...upcoming);
    const any = fixtures
      .filter((f) => f.event != null)
      .map((f) => f.event as number);
    return any.length ? Math.min(...any) : 1;
  }, [fixtures]);

  /**
   * Per team per GW, take the *easiest* (min diff) fixture.
   * Blank => diff5=6, oppDiff5=6, opp='–', venue='-'.
   */
  const bestGwInfo: Record<number, Record<number, GwInfo>> = useMemo(() => {
    const base: Record<number, Record<number, GwInfo>> = {};
    teams.forEach((t) => {
      base[t.id] = {};
      for (let gw = 1; gw <= 38; gw++) {
        base[t.id][gw] = {
          diff5: 6,
          oppId: null,
          oppShort: '–',
          venue: '-',
          oppDiff5: 6,
        };
      }
    });

    fixtures.forEach((f) => {
      if (!f.event) return;
      const gw = f.event;

      // Home row
      const dH = f.team_a_difficulty ?? 5;
      const currH = base[f.team_h][gw];
      if (dH < currH.diff5) {
        const opp = teamMap[f.team_a];
        base[f.team_h][gw] = {
          diff5: dH,
          oppId: f.team_a,
          oppShort: opp ? opp.short_name : '???',
          venue: 'H',
          oppDiff5: f.team_h_difficulty ?? 5,
        };
      }

      // Away row
      const dA = f.team_h_difficulty ?? 5;
      const currA = base[f.team_a][gw];
      if (dA < currA.diff5) {
        const opp = teamMap[f.team_h];
        base[f.team_a][gw] = {
          diff5: dA,
          oppId: f.team_h,
          oppShort: opp ? opp.short_name : '???',
          venue: 'A',
          oppDiff5: f.team_a_difficulty ?? 5,
        };
      }
    });

    return base;
  }, [teams, fixtures, teamMap]);

  // combos generator with cap
  function* combinations(arr: number[], k: number, capObj: { left: number }) {
    const n = arr.length;
    if (k > n || k <= 0) return;
    const idx = Array.from({ length: k }, (_, i) => i);
    const build = () => idx.map((i) => arr[i]);
    while (true) {
      if (capObj.left-- <= 0) return;
      yield build();
      let i = k - 1;
      while (i >= 0 && idx[i] === i + n - k) i--;
      if (i < 0) return;
      idx[i]++;
      for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
    }
  }

  // Classification as requested
  const classify = (
    my: number,
    opp: number
  ): { ok: true; tag: 'green' | 'yellow' | 'blue' } | { ok: false } => {
    // blanks not allowed here (handled earlier via diff5=6)
    const gap = my - opp;
    if (gap >= 2) return { ok: true, tag: 'green' }; // big gap (you rated much harder than opp → choose)
    if (gap === 1) return { ok: true, tag: 'yellow' }; // slight edge
    if (my === 2 && opp === 2) return { ok: true, tag: 'blue' }; // 2v2 special case accepted
    return { ok: false }; // reject (e.g., 3v3, 4v4, 5v5, 3v4, 4v3, gap 0 except 2v2, gap 2, etc.)
  };

  // Color chips
  const colorClass = (tag: 'green' | 'yellow' | 'blue') =>
    tag === 'green'
      ? 'bg-emerald-600 text-white'
      : tag === 'yellow'
        ? 'bg-amber-500 text-white'
        : 'bg-blue-600 text-white';

  const doCompute = () => {
    setError(null);
    setResults(null);

    const N = clamp(poolSize, 1, 8);
    const S = clamp(starters, 1, N);
    const W = clamp(numWeeks, 1, 38);
    const startGw = clamp(nextGW, 1, 38);
    const endGw = clamp(startGw + W - 1, 1, 38);

    if (teams.length === 0) {
      setError('No teams loaded.');
      return;
    }
    if (N > teams.length) {
      setError('Pool size cannot exceed number of teams.');
      return;
    }

    const teamIds = teams
      .map((t) => t.id)
      .sort((a, b) => teamMap[a].name.localeCompare(teamMap[b].name));
    const capObj = { left: MAX_COMBOS };

    setBusy(true);

    setTimeout(() => {
      const ranked: RankedCombo[] = [];

      for (const combo of combinations(teamIds, N, capObj)) {
        let okCombo = true;
        let totalScore = 0;
        const perGW: PerGwRow[] = [];

        for (let gw = startGw; gw <= endGw; gw++) {
          // Build info for this combo at this GW
          const infos = combo.map((tid) => {
            const info = bestGwInfo[tid][gw];
            return {
              teamId: tid,
              name: teamMap[tid]?.short_name ?? String(tid),
              info,
              gap: info.diff5 - info.oppDiff5,
            };
          });

          // Reject any with blanks among potential starters? We’ll just classify and only pick acceptable.
          const acceptable = infos
            .filter((x) => x.info.diff5 <= 5 && x.info.oppDiff5 <= 5) // no blanks
            .map((x) => {
              const cls = classify(x.info.diff5, x.info.oppDiff5);
              return { ...x, cls };
            })
            .filter((x) => x.cls.ok) as Array<
            (typeof infos)[number] & {
              cls: { ok: true; tag: 'green' | 'yellow' | 'blue' };
            }
          >;

          if (scoring === 'difficulty') {
            // Priority: green (by larger gap), then yellow (gap=1), then blue (2v2)
            acceptable.sort((a, b) => {
              const priority = (t: 'green' | 'yellow' | 'blue') =>
                t === 'green' ? 3 : t === 'yellow' ? 2 : 1;
              const pa = priority(a.cls.tag);
              const pb = priority(b.cls.tag);
              if (pa !== pb) return pb - pa;
              // tie-break by bigger gap then easier myDiff
              if (a.gap !== b.gap) return b.gap - a.gap;
              return a.info.diff5 - b.info.diff5;
            });
          } else {
            acceptable.sort(
              (a, b) => b.gap - a.gap || a.info.diff5 - b.info.diff5
            );
          }
          // Sort by difficulty (myDiff) then gap

          if (acceptable.length < S) {
            okCombo = false;
            break;
          }

          const startersThisGw = acceptable.slice(0, S).map((s) => ({
            teamId: s.teamId,
            name: s.name,
            info: s.info,
            gap: s.gap,
            color: s.cls.tag,
          }));

          // Everyone else (including non-acceptable) goes to bench display (grey)
          const acceptableIds = new Set(acceptable.map((x) => x.teamId));
          const bench = infos
            .filter(
              (x) => !new Set(startersThisGw.map((s) => s.teamId)).has(x.teamId)
            )
            .map((b) => ({
              teamId: b.teamId,
              name: b.name,
              info: b.info,
              gap: b.gap,
            }));

          // Score this GW (lower = better):
          // - 'difficulty': sum of the starters' my team difficulty (diff5)
          // - 'gap': existing method (sum of 5 - gap)
          if (scoring === 'difficulty') {
            totalScore += startersThisGw.reduce((s, r) => s + r.info.oppDiff5, 0);
          } else {
            totalScore += startersThisGw.reduce((s, r) => s + r.gap, 0);
          }

          perGW.push({ gw, starters: startersThisGw, bench });
        }

        if (!okCombo) continue;

        ranked.push({
          teamIds: combo,
          teamNames: combo.map((id) => teamMap[id].name),
          total: totalScore,
          perGW,
        });
      }

      if (ranked.length === 0) {
        setError(
          capObj.left <= 0
            ? `Too many combinations. Try reducing pool size (N) or weeks.`
            : `No acceptable rotations met your gap rules every week.`
        );
        setBusy(false);
        return;
      }

      if (scoring === 'difficulty') {
        ranked.sort(
        (a, b) =>
          a.total - b.total ||
          a.teamNames.join(',').localeCompare(b.teamNames.join(','))
      );
      }
      else{

        ranked.sort(
        (a, b) =>
          b.total - a.total ||
          a.teamNames.join(',').localeCompare(b.teamNames.join(','))
      );

      }

      
      setResults(ranked.slice(0, limit));
      setBusy(false);
    }, 0);
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <label className="text-xs text-muted-foreground">Start GW</label>
          <Input value={`GW${nextGW}`} readOnly className="h-9" />
        </div>
        <div className="w-32">
          <label className="text-xs text-muted-foreground">Gameweeks (W)</label>
          <Input
            type="number"
            min={1}
            max={38}
            value={numWeeks}
            onChange={(e) => setNumWeeks(Number(e.target.value || 1))}
            className="h-9"
          />
        </div>
        <div className="w-40">
          <label className="text-xs text-muted-foreground">Pool size (N)</label>
          <Input
            type="number"
            min={1}
            max={8}
            value={poolSize}
            onChange={(e) => setPoolSize(Number(e.target.value || 1))}
            className="h-9"
          />
        </div>
        <div className="w-40">
          <label className="text-xs text-muted-foreground">
            Starters per GW (S)
          </label>
          <Input
            type="number"
            min={1}
            max={poolSize}
            value={starters}
            onChange={(e) => setStarters(Number(e.target.value || 1))}
            className="h-9"
          />
        </div>
        <div className="w-40">
          <label className="text-xs text-muted-foreground">Show Top</label>
          <Select
            value={String(limit)}
            onValueChange={(v) => setLimit(Number(v))}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((v) => (
                <SelectItem key={v} value={String(v)}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <label className="text-xs text-muted-foreground">Score by</label>
          <Select
            value={scoring}
            onValueChange={(v) => setScoring(v as ScoringMode)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="difficulty">Team difficulty (sum)</SelectItem>
              <SelectItem value="gap">Gap (sum of 5 − gap)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={doCompute} disabled={busy || starters > poolSize}>
          {busy ? 'Computing…' : 'Find Rotations'}
        </Button>
        {starters > poolSize && (
          <span className="text-xs text-red-600">
            Starters (S) cannot exceed Pool (N)
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {results && (
        <div className="rounded-lg border overflow-hidden">
          <Table className="min-w-[1150px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Teams (N={poolSize})</TableHead>
                <TableHead>Per‑GW Starters / Bench (S={starters})</TableHead>
                <TableHead className="text-right">
                  Total (
                  {scoring === 'difficulty'
                    ? 'sum of team difficulty'
                    : 'sum of (5 − gap)'}
                  ; lower = better)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row, idx) => (
                <TableRow key={row.teamIds.join('-')}>
                  <TableCell className="text-center">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.teamIds.map((id) => (
                        <span
                          key={id}
                          className="rounded bg-muted px-2 py-0.5 text-xs"
                        >
                          {teamMap[id]?.short_name ?? id}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {row.perGW.map((g) => (
                        <div
                          key={g.gw}
                          className="rounded border px-2 py-1 text-xs min-w-[260px]"
                        >
                          <div className="font-medium mb-1">GW{g.gw}</div>

                          {/* Starters (colored by rule) */}
                          <div className="flex flex-col gap-1">
                            {g.starters.map((s, i) => {
                              const cls =
                                s.color === 'green'
                                  ? colorClass('green')
                                  : s.color === 'yellow'
                                    ? colorClass('yellow')
                                    : colorClass('blue');
                              return (
                                <span
                                  key={`st-${i}`}
                                  className={`rounded px-1.5 py-0.5 ${cls}`}
                                  title={`gap=${s.gap} • my=${s.info.diff5} vs opp=${s.info.oppDiff5} • scoring=${scoring}`}
                                >
                                  {/* e.g. TOT 5 → (A) vs BUR 1  | gap +4 */}
                                  {s.name} {s.info.diff5} &rarr; ({s.info.venue}
                                  ) vs {s.info.oppShort} {s.info.oppDiff5}{' '}
                                  &nbsp;•&nbsp; gap{' '}
                                  {s.gap > 0 ? `+${s.gap}` : s.gap}
                                </span>
                              );
                            })}
                          </div>

                          {/* Bench (grey) */}
                          {g.bench.length > 0 && (
                            <div className="mt-1 flex flex-col gap-1">
                              {g.bench.map((b, i) => (
                                <span
                                  key={`bn-${i}`}
                                  className="rounded px-1.5 py-0.5 bg-muted text-foreground"
                                  title={`bench • my=${b.info.diff5} vs opp=${b.info.oppDiff5}`}
                                >
                                  {b.name} {b.info.diff5} &rarr; ({b.info.venue}
                                  ) vs {b.info.oppShort} {b.info.oppDiff5}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.total}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-3 text-xs text-muted-foreground">
            We classify starters by <b>gap = myDiff − oppDiff</b>: green (≥3),
            yellow (=1), blue (2v2 only). Only rotations with at least S
            acceptable starters every GW are shown. Lower total = better (sum of
            5−gap for starters).
          </div>
        </div>
      )}
    </div>
  );
}
