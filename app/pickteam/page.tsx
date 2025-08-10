'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import './retro.css';

type Player = {
  id: number;
  web_name: string;
  now_cost: number;
  team: number;
  element_type: 1 | 2 | 3 | 4;
};

type Team = { id: number; name: string; short_name: string };
type Fixture = {
  id: number;
  finished: boolean;
  kickoff_time: string | null;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  team_h_difficulty: number;
  team_a_difficulty: number;
};

const POS_LABEL: Record<1 | 2 | 3 | 4, 'GKP' | 'DEF' | 'MID' | 'FWD'> = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

type SlotType = 'GKP' | 'DEF' | 'MID' | 'FWD' | 'BENCH_GKP' | 'BENCH_ANY';
type Slot = { id: string; type: SlotType; playerId: number | null };

const formations: Record<string, { DEF: number; MID: number; FWD: number }> = {
  '4-4-2': { DEF: 4, MID: 4, FWD: 2 },
  '3-4-3': { DEF: 3, MID: 4, FWD: 3 },
  '3-5-2': { DEF: 3, MID: 5, FWD: 2 },
  '4-3-3': { DEF: 4, MID: 3, FWD: 3 },
  '5-4-1': { DEF: 5, MID: 4, FWD: 1 },
  '5-3-2': { DEF: 5, MID: 3, FWD: 2 },
};

const STORAGE_KEY = 'retro_pickteam_v3';

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

const jerseyImageMap: Record<number, { gk?: string; out?: string }> = {
  1: { gk: '/arsenal_gk.webp', out: '/arsenal.webp' },
  6: { gk: '/spurs_gk.webp', out: '/spurs.webp' },
};
const defaultJersey = '/jersey.webp';

export default function PickTeamPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);

  const [formation, setFormation] = useState<keyof typeof formations>('4-4-2');
  const [slots, setSlots] = useState<Slot[]>([]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<'all' | string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/data', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      setPlayers(data.elements);
      setTeams(data.teams);
    })().catch(console.error);
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/fixtures', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data: Fixture[] = await res.json();
      setFixtures(data);
    })().catch(console.error);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { formation: string; slots: Slot[] };
      if (parsed.formation && formations[parsed.formation])
        setFormation(parsed.formation as any);
      if (parsed.slots?.length) setSlots(parsed.slots);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ formation, slots }));
    } catch {}
  }, [formation, slots]);

  const teamMap = useMemo(() => {
    const m: Record<number, Team> = {};
    teams.forEach((t) => (m[t.id] = t));
    return m;
  }, [teams]);

  const getPlayer = (id: number | null) =>
    players.find((p) => p.id === id) || null;

  const buildSlots = (fmt: keyof typeof formations, prev: Slot[]) => {
    const preset = formations[fmt];
    const next: Slot[] = [];
    next.push({ id: 'S-GKP-1', type: 'GKP', playerId: null });
    for (let i = 1; i <= preset.DEF; i++)
      next.push({ id: `S-DEF-${i}`, type: 'DEF', playerId: null });
    for (let i = 1; i <= preset.MID; i++)
      next.push({ id: `S-MID-${i}`, type: 'MID', playerId: null });
    for (let i = 1; i <= preset.FWD; i++)
      next.push({ id: `S-FWD-${i}`, type: 'FWD', playerId: null });
    next.push({ id: 'B-GKP-1', type: 'BENCH_GKP', playerId: null });
    next.push({ id: 'B-ANY-1', type: 'BENCH_ANY', playerId: null });
    next.push({ id: 'B-ANY-2', type: 'BENCH_ANY', playerId: null });
    next.push({ id: 'B-ANY-3', type: 'BENCH_ANY', playerId: null });

    //const buckets = { GKP: <number[]>[], DEF: <number[]>[], MID: <number[]>[], FWD: <number[]>[], BENCH: <number[]>[] };
    const buckets = {
      GKP: [] as number[],
      DEF: [] as number[],
      MID: [] as number[],
      FWD: [] as number[],
      BENCH: [] as number[],
    };
    prev.forEach((s) => {
      if (!s.playerId) return;
      const p = getPlayer(s.playerId);
      if (!p) return;
      const pos = POS_LABEL[p.element_type];
      if (s.type.startsWith('BENCH')) buckets.BENCH.push(p.id);
      else buckets[pos].push(p.id);
    });

    const place = (type: SlotType, ids: number[]) => {
      next.forEach((s) => {
        if (s.type === type && !s.playerId && ids.length)
          s.playerId = ids.shift()!;
      });
    };
    place('GKP', buckets.GKP);
    place('DEF', buckets.DEF);
    place('MID', buckets.MID);
    place('FWD', buckets.FWD);
    place('BENCH_GKP', buckets.GKP);
    const rest = [
      ...buckets.DEF,
      ...buckets.MID,
      ...buckets.FWD,
      ...buckets.BENCH,
    ];
    place('BENCH_ANY', rest);

    return next;
  };

  useEffect(() => {
    setSlots((prev) => buildSlots(formation, prev.length ? prev : []));
  }, [formation]);

  const openPicker = (slotId: string) => {
    setActiveSlotId(slotId);
    setPickerOpen(true);
  };

  const canSlotTake = (slot: Slot, p: Player) => {
    const pos = POS_LABEL[p.element_type];
    if (slot.type === 'GKP') return pos === 'GKP';
    if (slot.type === 'DEF') return pos === 'DEF';
    if (slot.type === 'MID') return pos === 'MID';
    if (slot.type === 'FWD') return pos === 'FWD';
    if (slot.type === 'BENCH_GKP') return pos === 'GKP';
    return true;
  };

  const assignToActiveSlot = (playerId: number) => {
    if (!activeSlotId) return;
    setSlots((prev) => {
      const copy = [...prev];
      const sIdx = copy.findIndex((s) => s.id === activeSlotId);
      if (sIdx < 0) return prev;
      const slot = copy[sIdx];
      const p = getPlayer(playerId);
      if (!p || !canSlotTake(slot, p)) return prev;
      const prevIdx = copy.findIndex((s) => s.playerId === playerId);
      if (prevIdx >= 0) copy[prevIdx] = { ...copy[prevIdx], playerId: null };
      copy[sIdx] = { ...copy[sIdx], playerId };
      return copy;
    });
    setPickerOpen(false);
  };

  const clearSlot = (slotId: string) =>
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, playerId: null } : s))
    );

  const sendToBench = (slotId: string) =>
    setSlots((prev) => {
      const copy = [...prev];
      const fromIdx = copy.findIndex((s) => s.id === slotId);
      if (fromIdx < 0 || !copy[fromIdx].playerId) return prev;
      const pid = copy[fromIdx].playerId!;
      const p = getPlayer(pid)!;
      const benchTarget =
        p.element_type === 1
          ? copy.find((s) => s.type === 'BENCH_GKP' && !s.playerId)
          : copy.find((s) => s.type === 'BENCH_ANY' && !s.playerId);
      if (!benchTarget) return prev;
      copy[fromIdx] = { ...copy[fromIdx], playerId: null };
      benchTarget.playerId = pid;
      return copy;
    });

  const starters = useMemo(
    () => slots.filter((s) => s.id.startsWith('S-')),
    [slots]
  );
  const bench = useMemo(
    () => slots.filter((s) => s.id.startsWith('B-')),
    [slots]
  );

  const activeSlot = slots.find((s) => s.id === activeSlotId) || null;
  const pickedIds = useMemo(
    () => new Set(slots.map((s) => s.playerId).filter(Boolean) as number[]),
    [slots]
  );

  const pickerList = useMemo(() => {
    if (!activeSlot) return [];
    return players
      .filter((p) => canSlotTake(activeSlot, p))
      .filter((p) =>
        teamFilter === 'all' ? true : String(p.team) === teamFilter
      )
      .filter((p) =>
        search ? p.web_name.toLowerCase().includes(search.toLowerCase()) : true
      )
      .sort((a, b) => a.web_name.localeCompare(b.web_name));
  }, [activeSlot, players, teamFilter, search]);

  const pickerTotalPages = Math.ceil(pickerList.length / pageSize) || 1;
  const pageRows = pickerList.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [teamFilter, search, activeSlotId]);

  const diff5To10 = (five: number) => Math.min(10, Math.max(1, five * 2));

  const upcoming4 = (teamId: number) =>
    fixtures
      .filter(
        (f) => !f.finished && (f.team_h === teamId || f.team_a === teamId)
      )
      .sort(
        (a, b) =>
          (a.kickoff_time ? Date.parse(a.kickoff_time) : 0) -
          (b.kickoff_time ? Date.parse(b.kickoff_time) : 0)
      )
      .slice(0, 4);

  const getLast4Points = (_playerId: number): number[] => {
    return []; // wire later
  };

  const jerseySrc = (p: Player | null) => {
    if (!p) return defaultJersey;
    const entry = jerseyImageMap[p.team];
    if (!entry) return defaultJersey;
    return p.element_type === 1
      ? (entry.gk ?? entry.out ?? defaultJersey)
      : (entry.out ?? defaultJersey);
  };

  const JerseyCard = ({ slot }: { slot: Slot }) => {
    const p = getPlayer(slot.playerId);
    const next = p ? upcoming4(p.team) : [];
    const lastPts = p ? getLast4Points(p.id) : [];

    return (
      <div className="retro-card-wrap retro-card-wrap--wide">
        {/* rails show on hover, stay inside card */}
        <div className="retro-rail retro-rail--left">
          {(p && lastPts.length ? lastPts : Array(4).fill('-')).map(
            (val, i) => (
              <div
                key={i}
                className={`retro-chip ${val === '-' ? 'retro-chip--empty' : 'pts'}`}
              >
                {val}
              </div>
            )
          )}
        </div>

        {/* NEW: actions row (Sub / Remove) */}
        <div className="retro-actions">
          <Button
            size="sm"
            variant="secondary"
            className="retro-action-btn"
            onClick={() => sendToBench(slot.id)}
            disabled={!slot.playerId}
            title="Send to bench"
          >
            S
          </Button>
          <Button
            size="sm"
            className="retro-action-btn retro-action-btn--danger"
            onClick={() => clearSlot(slot.id)}
            disabled={!slot.playerId}
            title="Remove"
          >
            X
          </Button>
        </div>

        {/* jersey */}
        <button className="retro-jersey" onClick={() => openPicker(slot.id)}>
          <div
            className="retro-jersey__img"
            style={{ backgroundImage: `url('${jerseySrc(p)}')` }}
            aria-hidden
          />
        </button>

        {/* NEW: name bar (always under jersey, full width, ellipsis) */}
        <div
          className="retro-namebar"
          title={p ? p.web_name : slot.type.replace('BENCH_', '')}
        >
          {p ? p.web_name : slot.type.replace('BENCH_', '')}
        </div>

        {/* right rail (upcoming fixtures) */}
        <div className="retro-rail retro-rail--right">
          {(p && next.length ? next : Array(4).fill(null)).map((fx, i) => {
            if (!fx)
              return (
                <div key={i} className="retro-chip retro-chip--empty">
                  -
                </div>
              );
            const isHome = fx.team_h === p!.team;
            const oppId = isHome ? fx.team_a : fx.team_h;
            const opp = teamMap[oppId]?.short_name ?? '???';
            const five = isHome ? fx.team_h_difficulty : fx.team_a_difficulty;
            const ten = diff5To10(five);
            const color = difficultyColors[ten - 1];
            return (
              <div
                key={fx.id}
                className="retro-chip"
                style={{ backgroundColor: color }}
              >
                {opp} ({isHome ? 'H' : 'A'})
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="retro retro-light dark:retro-dark">
      <div className="retro-header">
        <div className="retro-title">Pick Team</div>
        <div className="retro-right">
          <span className="retro-label">Formation</span>
          <Select
            value={formation}
            onValueChange={(v) => setFormation(v as any)}
          >
            <SelectTrigger className="retro-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(formations).map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="retro-pitch">
        <div className="retro-pitch__bg" />
        <div className="retro-pitch__rows">
          <div className="retro-row">
            {starters
              .filter((s) => s.type === 'GKP')
              .map((s) => (
                <JerseyCard key={s.id} slot={s} />
              ))}
          </div>
          <div className="retro-row">
            {starters
              .filter((s) => s.type === 'DEF')
              .map((s) => (
                <JerseyCard key={s.id} slot={s} />
              ))}
          </div>
          <div className="retro-row">
            {starters
              .filter((s) => s.type === 'MID')
              .map((s) => (
                <JerseyCard key={s.id} slot={s} />
              ))}
          </div>
          <div className="retro-row">
            {starters
              .filter((s) => s.type === 'FWD')
              .map((s) => (
                <JerseyCard key={s.id} slot={s} />
              ))}
          </div>

          <div className="retro-bench">
            {bench.map((s) => (
              <div key={s.id} className="retro-bench__cell">
                <JerseyCard slot={s} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Player</DialogTitle>
            <DialogDescription>
              {activeSlot
                ? `Choose a ${activeSlot.type.replace('BENCH_', '')}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-end gap-3 mb-3">
            <div className="w-52">
              <label className="retro-small">Team</label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="h-9">
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
            <div className="flex-1 min-w-[220px]">
              <label className="retro-small">Search</label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name…"
              />
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Pos</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>No players</TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((p) => {
                    const taken = pickedIds.has(p.id);
                    return (
                      <TableRow
                        key={p.id}
                        className={taken ? 'opacity-60' : ''}
                      >
                        <TableCell>
                          <Button
                            size="sm"
                            disabled={taken}
                            onClick={() => assignToActiveSlot(p.id)}
                          >
                            {taken ? 'In squad' : 'Select'}
                          </Button>
                        </TableCell>
                        <TableCell>{p.web_name}</TableCell>
                        <TableCell>
                          {teamMap[p.team]?.short_name ?? ''}
                        </TableCell>
                        <TableCell>{POS_LABEL[p.element_type]}</TableCell>
                        <TableCell className="text-right">
                          {(p.now_cost / 10).toFixed(1)}m
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-3">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <div className="text-sm">
                Page {page} / {pickerTotalPages}
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  setPage((p) => Math.min(pickerTotalPages, p + 1))
                }
                disabled={page === pickerTotalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
