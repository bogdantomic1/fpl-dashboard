'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Lock, Unlock } from 'lucide-react';

type Player = {
  id: number;
  web_name: string;
  now_cost: number; // tenths of a million
  team: number;
  element_type: number; // 1 GKP, 2 DEF, 3 MID, 4 FWD
  [k: string]: any;
};

type Team = {
  id: number;
  name: string;
  short_name: string;
};

type DataResp = {
  elements: Player[];
  teams: Team[];
  total_players: number;
  element_types: any[];
};

const posName = (elType: number) =>
  elType === 1 ? 'GKP' : elType === 2 ? 'DEF' : elType === 3 ? 'MID' : 'FWD';

const formations: Array<{ def: number; mid: number; fwd: number }> = [
  { def: 3, mid: 4, fwd: 3 },
  { def: 3, mid: 5, fwd: 2 },
  { def: 4, mid: 4, fwd: 2 },
  { def: 4, mid: 3, fwd: 3 },
  { def: 5, mid: 3, fwd: 2 },
  { def: 5, mid: 4, fwd: 1 },
];

type ChosenState = {
  ids: number[];
  weights: Record<number, number>;
  locks: Record<number, boolean>;
};

type Squad = {
  ids: number[];
  score: number;
  totalCost: number;
  breakdown: { gk: number[]; def: number[]; mid: number[]; fwd: number[] };
};

const STORAGE_KEY = 'squad_builder_selection_v1';

export default function SquadBuilderPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // left table filters
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [posFilter, setPosFilter] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(15);
  const [search, setSearch] = useState('');

  // paging
  const pageSize = 10;
  const [page, setPage] = useState(1);

  // bench / budget
  const [benchValue, setBenchValue] = useState<number>(15);
  const budgetXI = useMemo(() => Math.max(0, 100 - benchValue), [benchValue]);

  // right side: chosen players + per-player weight + lock
  const [chosen, setChosen] = useState<ChosenState>({
    ids: [],
    weights: {},
    locks: {},
  });

  // results
  const [results, setResults] = useState<Squad[]>([]);
  const [resultIdx, setResultIdx] = useState(0);

  // load from API
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/data', {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });
        const data: DataResp = await res.json();
        setPlayers(data.elements);
        setTeams(data.teams);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: ChosenState & { benchValue?: number } = JSON.parse(raw);
        setChosen({
          ids: Array.isArray(saved.ids) ? saved.ids : [],
          weights: saved.weights ?? {},
          locks: saved.locks ?? {},
        });
        if (typeof saved.benchValue === 'number')
          setBenchValue(saved.benchValue);
      }
    } catch {}
  }, []);

  // persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...chosen, benchValue })
      );
    } catch {}
  }, [chosen, benchValue]);

  const teamMap = useMemo(() => {
    const m: Record<number, Team> = {};
    teams.forEach((t) => (m[t.id] = t));
    return m;
  }, [teams]);

  // ---- table filtering ----
  const filtered = useMemo(() => {
    return players
      .filter((p) =>
        teamFilter === 'all' ? true : p.team === Number(teamFilter)
      )
      .filter((p) =>
        posFilter === 'all' ? true : p.element_type === Number(posFilter)
      )
      .filter((p) => p.now_cost / 10 <= maxPrice)
      .filter((p) =>
        search
          ? p.web_name.toLowerCase().includes(search.toLowerCase()) ||
            (teamMap[p.team]?.name ?? '')
              .toLowerCase()
              .includes(search.toLowerCase())
          : true
      );
  }, [players, teamFilter, posFilter, maxPrice, search, teamMap]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPage = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [teamFilter, posFilter, maxPrice, search]);

  // chosen derived
  const chosenPlayers = useMemo(
    () =>
      chosen.ids
        .map((id) => players.find((p) => p.id === id))
        .filter(Boolean) as Player[],
    [chosen.ids, players]
  );

  const posCounts = useMemo(() => {
    const c = { gk: 0, def: 0, mid: 0, fwd: 0, total: 0 };
    for (const p of chosenPlayers) {
      c.total++;
      if (p.element_type === 1) c.gk++;
      else if (p.element_type === 2) c.def++;
      else if (p.element_type === 3) c.mid++;
      else if (p.element_type === 4) c.fwd++;
    }
    return c;
  }, [chosenPlayers]);

  const toggleChoose = (id: number) => {
    setChosen((prev) => {
      const exists = prev.ids.includes(id);
      const ids = exists ? prev.ids.filter((x) => x !== id) : [...prev.ids, id];
      const weights = { ...prev.weights };
      const locks = { ...prev.locks };
      if (!exists && weights[id] == null) weights[id] = 1;
      if (exists) {
        delete weights[id];
        delete locks[id];
      }
      return { ids, weights, locks };
    });
  };

  const setWeight = (id: number, w: number) => {
    setChosen((prev) => ({ ...prev, weights: { ...prev.weights, [id]: w } }));
  };

  const toggleLock = (id: number) => {
    setChosen((prev) => ({
      ...prev,
      locks: { ...prev.locks, [id]: !prev.locks[id] },
    }));
  };

  // ---- solver (respects locks) ----
  function makeSquadsTop3(
    pool: Player[],
    weights: Record<number, number>,
    maxBudget: number,
    locks: Record<number, boolean>
  ): Squad[] {
    const teamLimit = 3;

    const poolByPos = {
      gk: pool.filter((p) => p.element_type === 1),
      def: pool.filter((p) => p.element_type === 2),
      mid: pool.filter((p) => p.element_type === 3),
      fwd: pool.filter((p) => p.element_type === 4),
    };

    // locks
    const locked = pool.filter((p) => locks[p.id]);

    // quick checks: at least 1 GK lock if all GKs locked etc. (we’ll just let feasibility prune)
    const ratio = (p: Player) =>
      (weights[p.id] ?? 0) / Math.max(0.1, p.now_cost / 10);
    Object.values(poolByPos).forEach((arr) =>
      arr.sort((a, b) => ratio(b) - ratio(a))
    );

    // try formations, ensure locked players can fit
    const candidates: Squad[] = [];

    for (const form of formations) {
      // start with locked
      const startIds = new Set<number>();
      let cost = 0;
      const byTeam: Record<number, number> = {};
      const breakdown = {
        gk: [] as number[],
        def: [] as number[],
        mid: [] as number[],
        fwd: [] as number[],
      };

      let need = { gk: 1, def: form.def, mid: form.mid, fwd: form.fwd };

      let feasible = true;
      for (const p of locked) {
        const key =
          p.element_type === 1
            ? 'gk'
            : p.element_type === 2
              ? 'def'
              : p.element_type === 3
                ? 'mid'
                : 'fwd';
        if (need[key] <= 0) {
          feasible = false;
          break;
        }
        // team cap
        const tc = byTeam[p.team] ?? 0;
        if (tc >= teamLimit) {
          feasible = false;
          break;
        }
        const newCost = cost + p.now_cost / 10;
        if (newCost > maxBudget) {
          feasible = false;
          break;
        }
        // take
        startIds.add(p.id);
        cost = newCost;
        byTeam[p.team] = tc + 1;
        breakdown[key].push(p.id);
        need[key] -= 1;
      }
      if (!feasible) continue;

      // fill remaining by value/constraints
      const fill = (
        list: Player[],
        count: number,
        key: keyof typeof breakdown
      ) => {
        for (const p of list) {
          if (count <= 0) break;
          if (startIds.has(p.id)) continue;
          const tc = byTeam[p.team] ?? 0;
          if (tc >= teamLimit) continue;
          const newCost = cost + p.now_cost / 10;
          if (newCost > maxBudget) continue;
          // take
          startIds.add(p.id);
          cost = newCost;
          byTeam[p.team] = tc + 1;
          breakdown[key].push(p.id);
          count -= 1;
        }
        return count === 0;
      };

      const okG = fill(poolByPos.gk, need.gk, 'gk');
      const okD = fill(poolByPos.def, need.def, 'def');
      const okM = fill(poolByPos.mid, need.mid, 'mid');
      const okF = fill(poolByPos.fwd, need.fwd, 'fwd');
      if (!(okG && okD && okM && okF)) continue;

      const ids = Array.from(startIds);
      const score = ids.reduce((acc, id) => acc + (weights[id] ?? 0), 0);

      candidates.push({
        ids,
        score,
        totalCost: cost,
        breakdown,
      });
    }

    // de-dup & top 3
    const uniq = new Map<string, Squad>();
    for (const s of candidates) {
      const key = s.ids
        .slice()
        .sort((a, b) => a - b)
        .join('-');
      const old = uniq.get(key);
      if (!old || s.score > old.score) uniq.set(key, s);
    }
    return [...uniq.values()].sort((a, b) => b.score - a.score).slice(0, 3);
  }

  const canCompute =
    chosenPlayers.length >= 14 &&
    chosenPlayers.filter((p) => p.element_type === 1).length >= 1 &&
    chosenPlayers.filter((p) => p.element_type === 2).length >= 5 &&
    chosenPlayers.filter((p) => p.element_type === 3).length >= 5 &&
    chosenPlayers.filter((p) => p.element_type === 4).length >= 3;

  const compute = () => {
    if (!canCompute) return;
    const squads = makeSquadsTop3(
      chosenPlayers,
      chosen.weights,
      budgetXI,
      chosen.locks
    );
    setResults(squads);
    setResultIdx(0);
  };

  const currentResult = results[resultIdx];

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Squad Builder</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT (2/3): Players table */}
        <section className="lg:col-span-2">
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4 mb-3">
            <div className="w-40">
              <label className="text-xs font-medium">Team filter</label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-36">
              <label className="text-xs font-medium">Position</label>
              <Select value={posFilter} onValueChange={setPosFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">GKP</SelectItem>
                  <SelectItem value="2">DEF</SelectItem>
                  <SelectItem value="3">MID</SelectItem>
                  <SelectItem value="4">FWD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-56">
              <label className="text-xs font-medium">
                Max price: {maxPrice.toFixed(1)}m
              </label>
              <Slider
                min={0}
                max={15}
                step={0.5}
                value={[maxPrice]}
                onValueChange={([v]) => setMaxPrice(v)}
              />
            </div>

            <div className="w-56">
              <label className="text-xs font-medium">Search</label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or team…"
              />
            </div>

            <div className="w-40">
              <label className="text-xs font-medium">Bench value (m)</label>
              <Input
                type="number"
                step="0.5"
                value={benchValue}
                onChange={(e) =>
                  setBenchValue(parseFloat(e.target.value || '0'))
                }
              />
              <div className="text-xs text-muted-foreground mt-1">
                XI budget: {budgetXI.toFixed(1)}m
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Pos</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading…</TableCell>
                  </TableRow>
                ) : currentPage.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>No players</TableCell>
                  </TableRow>
                ) : (
                  currentPage.map((p) => {
                    const checked = chosen.ids.includes(p.id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleChoose(p.id)}
                          />
                        </TableCell>
                        <TableCell>{p.web_name}</TableCell>
                        <TableCell>{teamMap[p.team]?.name ?? ''}</TableCell>
                        <TableCell>{posName(p.element_type)}</TableCell>
                        <TableCell className="text-right">
                          {(p.now_cost / 10).toFixed(1)}m
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between p-3">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <div className="text-sm">
                Page {page} / {totalPages}
              </div>
              <Button
                variant="secondary"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </section>

        {/* RIGHT (1/3): Chosen list with weights & locks */}
        <aside className="lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">
              Selected Players ({chosenPlayers.length})
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setChosen({ ids: [], weights: {}, locks: {} })}
            >
              Clear
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-2 max-h-[70vh] overflow-y-auto">
            {chosenPlayers.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2">
                No players selected.
              </div>
            ) : (
              <div className="space-y-2">
                {chosenPlayers.map((p) => {
                  const w = chosen.weights[p.id] ?? 1;
                  const locked = !!chosen.locks[p.id];
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-md border bg-background p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {p.web_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {teamMap[p.team]?.short_name ?? ''} •{' '}
                          {posName(p.element_type)} •{' '}
                          {(p.now_cost / 10).toFixed(1)}m
                        </div>
                      </div>
                      <div className="w-24">
                        <Input
                          className="h-8"
                          type="number"
                          step="0.1"
                          value={w}
                          onChange={(e) =>
                            setWeight(p.id, parseFloat(e.target.value || '0'))
                          }
                        />
                      </div>
                      <Button
                        variant={locked ? 'default' : 'secondary'}
                        size="icon"
                        className="h-8 w-8"
                        title={locked ? 'Unlock' : 'Lock'}
                        onClick={() => toggleLock(p.id)}
                      >
                        {locked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Remove"
                        onClick={() => toggleChoose(p.id)}
                      >
                        ×
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            Need ≥14 total (≥1 GKP, ≥5 DEF, ≥5 MID, ≥3 FWD). XI budget ={' '}
            {budgetXI.toFixed(1)}m.
          </div>

          <div className="mt-2">
            <Button onClick={compute} disabled={!canCompute}>
              Compute best XI
            </Button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-4 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Best XIs (Top {results.length})
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setResultIdx((i) => Math.max(0, i - 1))}
                    disabled={resultIdx === 0}
                  >
                    Prev
                  </Button>
                  <div className="text-xs">
                    {resultIdx + 1} of {results.length}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setResultIdx((i) => Math.min(results.length - 1, i + 1))
                    }
                    disabled={resultIdx === results.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>

              <div className="mt-2 text-sm">
                Score:{' '}
                <span className="font-semibold">
                  {results[resultIdx].score.toFixed(2)}
                </span>{' '}
                — Cost:{' '}
                <span className="font-semibold">
                  {results[resultIdx].totalCost.toFixed(1)}m
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {(['gk', 'def', 'mid', 'fwd'] as const).map((k) => (
                  <div key={k} className="rounded-md border p-2">
                    <div className="text-xs font-semibold mb-1">
                      {k.toUpperCase()}
                    </div>
                    <ul className="space-y-1 text-sm">
                      {results[resultIdx].breakdown[k].map((pid) => {
                        const p = players.find((x) => x.id === pid)!;
                        return (
                          <li
                            key={pid}
                            className="flex items-center justify-between"
                          >
                            <span>{p.web_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {teamMap[p.team]?.short_name ?? ''} ·{' '}
                              {(p.now_cost / 10).toFixed(1)}m
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                Locks are forced into the XI; solver respects ≤3 per team,
                formation rules, and budget.
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
