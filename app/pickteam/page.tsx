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
const SHORTLIST_KEY = 'retro_shortlist_v1';

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
  1: { gk: '/shirt_3_1-110.webp', out: '/shirt_3-110.webp' }, //Arsenal 
  2: { gk: 'shirt_7_1-110.webp', out: 'shirt_7-220.webp' }, //Aston Villa
  3: { gk: 'shirt_90_1-110.webp', out: 'shirt_90-110.webp' }, //Burnley
  4: { gk: 'shirt_91_1-110.webp', out: 'shirt_91-110.webp' }, //Bournemouth
  5: { gk: 'shirt_94_1-110.webp', out: 'shirt_94-110.webp' }, //Brentford
  6: { gk: 'shirt_36_1-110.webp', out: 'shirt_36-220.webp' }, //Brighton
  7: { gk: 'shirt_8_1-110.webp', out: 'shirt_8-220.webp' }, //Chelsea
  8: { gk: 'shirt_31_1-110.webp', out: 'shirt_31-220.webp' }, //Crystal Palace
  9: { gk: 'shirt_11_1-110.webp', out: 'shirt_11-220.webp' }, //Everton
  10: { gk: 'shirt_54_1-110.webp', out: 'shirt_54-110.webp' }, //Fulham
  11: { gk: 'shirt_2_1-110.webp', out: 'shirt_2-110.webp' }, //Leeds
  12: { gk: 'shirt_14_1-110.webp', out: 'shirt_14-220.webp' }, //Liverpool
  13: { gk: 'shirt_43_1-110.webp', out: 'shirt_43-110.webp' }, //Manchester City
  14: { gk: 'shirt_1_1-110.webp', out: 'shirt_1-110.webp' }, //Manchester United
  15: { gk: 'shirt_4_1-110.webp', out: 'shirt_4-110.webp' }, //Newcastle
  16: { gk: 'shirt_17_1-110.webp', out: 'shirt_17-110.webp' }, //Nottingham Forest
  17: { gk: 'shirt_56_1-110.webp', out: 'shirt_56-220.webp' }, //Sunderland
  18: { gk: 'shirt_6_1-220.webp', out: 'shirt_6-220.webp' }, //Tottenham
  19: { gk: 'shirt_21_1-110.webp', out: 'shirt_21-220.webp' }, //West Ham
  20: { gk: 'shirt_39_1-110.webp', out: 'shirt_39-110.webp' }, //Wolves
};
const defaultJersey = '/jersey.webp';

export default function PickTeamPage() {
  // core data
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);

  // pitch state
  const [formation, setFormation] = useState<keyof typeof formations>('4-4-2');
  const [slots, setSlots] = useState<Slot[]>([]);

  // picker dialog (unchanged: jersey opens this)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<'all' | string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // right-side shortlist table (independent filters)
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseTeam, setBrowseTeam] = useState<'all' | string>('all');
  const [browsePage, setBrowsePage] = useState(1);
  const browsePageSize = 10;

  // shortlist state (persisted)
  const [shortGKP, setShortGKP] = useState<number[]>([]);
  const [shortDEF, setShortDEF] = useState<number[]>([]);
  const [shortMID, setShortMID] = useState<number[]>([]);
  const [shortFWD, setShortFWD] = useState<number[]>([]);
  const [detailPlayerId, setDetailPlayerId] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // ─── Data fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/data', { headers: { 'Cache-Control': 'no-cache' } });
      const data = await res.json();
      setPlayers(data.elements);
      setTeams(data.teams);
    })().catch(console.error);
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/fixtures', { headers: { 'Cache-Control': 'no-cache' } });
      const data: Fixture[] = await res.json();
      setFixtures(data);
    })().catch(console.error);
  }, []);

  // ─── Persist pitch selection (your original key) ────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { formation: string; slots: Slot[] };
        if (parsed.formation && formations[parsed.formation]) setFormation(parsed.formation as any);
        if (parsed.slots?.length) setSlots(parsed.slots);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ formation, slots }));
    } catch {}
  }, [formation, slots]);

  // ─── Persist shortlist (new key) ────────────────────────────────────────────
  useEffect(() => {
    console.log('Initializing shortlist from localStorage');
    try {
      const raw = localStorage.getItem(SHORTLIST_KEY);
      console.log('Shortlist raw data:', raw);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          gkp: number[]; def: number[]; mid: number[]; fwd: number[];
        };
        if(gkp.length === 0 && def.length===0 && mid.length === 0 && fwd.length === 0) {
          console.log('No shortlist found, initializing empty');
        setShortGKP(parsed.gkp ?? []);
        setShortDEF(parsed.def ?? []);
        setShortMID(parsed.mid ?? []);
        setShortFWD(parsed.fwd ?? []);
        }
        else {
          console.log('Shortlist found, loading existing');
          return}
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SHORTLIST_KEY, JSON.stringify({
        gkp: shortGKP, def: shortDEF, mid: shortMID, fwd: shortFWD,
      }));
    } catch {}
  }, [shortGKP, shortDEF, shortMID, shortFWD]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const teamMap = useMemo(() => {
    const m: Record<number, Team> = {};
    teams.forEach((t) => (m[t.id] = t));
    return m;
  }, [teams]);

  const getPlayer = (id: number | null) => players.find((p) => p.id === id) || null;

  const buildSlots = (fmt: keyof typeof formations, prev: Slot[]) => {
    const preset = formations[fmt];
    const next: Slot[] = [];
    next.push({ id: 'S-GKP-1', type: 'GKP', playerId: null });
    for (let i = 1; i <= preset.DEF; i++) next.push({ id: `S-DEF-${i}`, type: 'DEF', playerId: null });
    for (let i = 1; i <= preset.MID; i++) next.push({ id: `S-MID-${i}`, type: 'MID', playerId: null });
    for (let i = 1; i <= preset.FWD; i++) next.push({ id: `S-FWD-${i}`, type: 'FWD', playerId: null });
    next.push({ id: 'B-GKP-1', type: 'BENCH_GKP', playerId: null });
    next.push({ id: 'B-ANY-1', type: 'BENCH_ANY', playerId: null });
    next.push({ id: 'B-ANY-2', type: 'BENCH_ANY', playerId: null });
    next.push({ id: 'B-ANY-3', type: 'BENCH_ANY', playerId: null });

    const buckets = { GKP: [] as number[], DEF: [] as number[], MID: [] as number[], FWD: [] as number[], BENCH: [] as number[] };
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
        if (s.type === type && !s.playerId && ids.length) s.playerId = ids.shift()!;
      });
    };
    place('GKP', buckets.GKP);
    place('DEF', buckets.DEF);
    place('MID', buckets.MID);
    place('FWD', buckets.FWD);
    place('BENCH_GKP', buckets.GKP);
    const rest = [...buckets.DEF, ...buckets.MID, ...buckets.FWD, ...buckets.BENCH];
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
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, playerId: null } : s)));

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

  const starters = useMemo(() => slots.filter((s) => s.id.startsWith('S-')), [slots]);
  const bench = useMemo(() => slots.filter((s) => s.id.startsWith('B-')), [slots]);

  const activeSlot = slots.find((s) => s.id === activeSlotId) || null;
  const pickedIds = useMemo(() => new Set(slots.map((s) => s.playerId).filter(Boolean) as number[]), [slots]);

  const pickerList = useMemo(() => {
    if (!activeSlot) return [];
    return players
      .filter((p) => canSlotTake(activeSlot, p))
      .filter((p) => (teamFilter === 'all' ? true : String(p.team) === teamFilter))
      .filter((p) => (search ? p.web_name.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => a.web_name.localeCompare(b.web_name));
  }, [activeSlot, players, teamFilter, search]);

  const pickerTotalPages = Math.ceil(pickerList.length / pageSize) || 1;
  const pageRows = pickerList.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [teamFilter, search, activeSlotId]);

  const diff5To10 = (five: number) => Math.min(10, Math.max(1, five * 2));

  const upcoming4 = (teamId: number) =>
    fixtures
      .filter((f) => !f.finished && (f.team_h === teamId || f.team_a === teamId))
      .sort(
        (a, b) =>
          (a.kickoff_time ? Date.parse(a.kickoff_time) : 0) -
          (b.kickoff_time ? Date.parse(b.kickoff_time) : 0)
      )
      .slice(0, 4);

  const getLast4Points = (_playerId: number): number[] => {
    return []; // wire later if needed
  };

  const jerseySrc = (p: Player | null) => {
    if (!p) return defaultJersey;
    const entry = jerseyImageMap[p.team];
    if (!entry) return defaultJersey;
    return p.element_type === 1 ? (entry.gk ?? entry.out ?? defaultJersey) : (entry.out ?? defaultJersey);
  };

  // ─── RIGHT-SIDE BROWSE TABLE (shortlist manager) ────────────────────────────
  const browseList = useMemo(() => {
    return players
      .filter((p) => (browseTeam === 'all' ? true : String(p.team) === browseTeam))
      .filter((p) => (browseSearch ? p.web_name.toLowerCase().includes(browseSearch.toLowerCase()) : true))
      .sort((a, b) => a.web_name.localeCompare(b.web_name));
  }, [players, browseTeam, browseSearch]);

  const browseTotalPages = Math.ceil(browseList.length / browsePageSize) || 1;
  const browseRows = browseList.slice((browsePage - 1) * browsePageSize, browsePage * browsePageSize);
  useEffect(() => setBrowsePage(1), [browseTeam, browseSearch]);

  const toggleShortlist = (p: Player) => {
    const pos = POS_LABEL[p.element_type];
    if (pos === 'GKP') {
      setShortGKP((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]));
    } else if (pos === 'DEF') {
      setShortDEF((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]));
    } else if (pos === 'MID') {
      setShortMID((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]));
    } else {
      setShortFWD((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]));
    }
  };

  const inShortlist = (p: Player) => {
    const pos = POS_LABEL[p.element_type];
    if (pos === 'GKP') return shortGKP.includes(p.id);
    if (pos === 'DEF') return shortDEF.includes(p.id);
    if (pos === 'MID') return shortMID.includes(p.id);
    return shortFWD.includes(p.id);
  };

  // ─── Jersey Card (unchanged behavior: click jersey opens picker) ────────────
  const JerseyCard = ({ slot }: { slot: Slot }) => {
    const p = getPlayer(slot.playerId);
    const next = p ? upcoming4(p.team) : [];
    const lastPts = p ? getLast4Points(p.id) : [];

    return (
      <div className="retro-card-wrap retro-card-wrap--wide">
        {/* left rail */}
        <div className="retro-rail retro-rail--left">
          {(p && lastPts.length ? lastPts : Array(4).fill('-')).map((val, i) => (
            <div key={i} className={`retro-chip ${val === '-' ? 'retro-chip--empty' : 'pts'}`}>
              {val}
            </div>
          ))}
        </div>

        {/* actions row (Sub / Remove) */}
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

        {/* jersey (opens picker) */}
        <button className="retro-jersey" onClick={() => openPicker(slot.id)}>
          <div
            className="retro-jersey__img"
            style={{ backgroundImage: `url('${jerseySrc(p)}')` }}
            aria-hidden
          />
        </button>

        {/* name bar */}
        <div className="retro-namebar" title={p ? p.web_name : slot.type.replace('BENCH_', '')}>
          {p ? p.web_name : slot.type.replace('BENCH_', '')}
        </div>

        {/* right rail (upcoming fixtures) */}
        <div className="retro-rail retro-rail--right">
          {(p && next.length ? next : Array(4).fill(null)).map((fx, i) => {
            if (!fx) {
              return (
                <div key={i} className="retro-chip retro-chip--empty">
                  -
                </div>
              );
            }
            const isHome = fx.team_h === p!.team;
            const oppId = isHome ? fx.team_a : fx.team_h;
            const opp = teamMap[oppId]?.short_name ?? '???';
            const five = isHome ? fx.team_h_difficulty : fx.team_a_difficulty;
            const ten = diff5To10(five);
            const color = difficultyColors[ten - 1];
            return (
              <div key={fx.id} className="retro-chip" style={{ backgroundColor: color }}>
                {opp} ({isHome ? 'H' : 'A'})
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="retro retro-light dark:retro-dark">
      {/* Header */}
      <div className="retro-header">
        <div className="retro-title">Pick Team</div>
        <div className="retro-right">
          <span className="retro-label">Formation</span>
          <Select value={formation} onValueChange={(v) => setFormation(v as any)}>
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

      {/* Layout: left = pitch (unchanged), right = shortlist table */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* LEFT: Pitch (unchanged structure/styles) */}
        <div className="retro-pitch lg:sticky lg:top-4 lg:self-start">
          <div className="retro-pitch__bg" />
          <div className="retro-pitch__rows">
            <div className="retro-row">
              {starters.filter((s) => s.type === 'GKP').map((s) => (
                <JerseyCard key={s.id} slot={s} />
              ))}
            </div>
            <div className="retro-row">
              {starters.filter((s) => s.type === 'DEF').map((s) => (
                <JerseyCard key={s.id} slot={s} />
              ))}
            </div>
            <div className="retro-row">
              {starters.filter((s) => s.type === 'MID').map((s) => (
                <JerseyCard key={s.id} slot={s} />
              ))}
            </div>
            <div className="retro-row">
              {starters.filter((s) => s.type === 'FWD').map((s) => (
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

        {/* RIGHT: Shortlist table + position lists */}
        <div className="flex-1 min-w-[320px] space-y-4">
          {/* Browse & shortlist manager (opaque, narrower columns) */}
          <div className="rounded-lg border bg-white/95 dark:bg-neutral-900/95 shadow-sm overflow-hidden">
            <div className="p-3 flex flex-wrap gap-3 items-end">
              <div className="w-44">
                <label className="retro-small block mb-1">Team</label>
                <Select value={browseTeam} onValueChange={setBrowseTeam}>
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
              <div className="flex-1 min-w-[200px]">
                <label className="retro-small block mb-1">Search</label>
                <Input
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  placeholder="Search name…"
                />
              </div>
            </div>

            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[42%]">Name</TableHead>
                  <TableHead className="w-[22%]">Team</TableHead>
                  <TableHead className="w-[14%]">Pos</TableHead>
                  <TableHead className="w-[12%] text-right">Price</TableHead>
                  <TableHead className="w-[10%] text-right">List</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {browseRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No players
                    </TableCell>
                  </TableRow>
                ) : (
                  browseRows.map((p) => {
                    const listed = inShortlist(p);
                    return (
                      <TableRow key={p.id} className="cursor-pointer">
                        <TableCell
                          onClick={() => setDetailPlayerId(p.id)}
                          className="truncate"
                          title={p.web_name}
                        >
                          {p.web_name}
                        </TableCell>
                        <TableCell className="truncate">
                          {teamMap[p.team]?.short_name ?? ''}
                        </TableCell>
                        <TableCell>{POS_LABEL[p.element_type]}</TableCell>
                        <TableCell className="text-right">
                          {(p.now_cost / 10).toFixed(1)}m
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={listed ? 'destructive' : 'secondary'}
                            onClick={() => toggleShortlist(p)}
                          >
                            {listed ? 'Remove' : 'Add'}
                          </Button>
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
                onClick={() => setBrowsePage((p) => Math.max(1, p - 1))}
                disabled={browsePage === 1}
              >
                Prev
              </Button>
              <div className="text-sm">
                Page {browsePage} / {browseTotalPages}
              </div>
              <Button
                variant="secondary"
                onClick={() => setBrowsePage((p) => Math.min(browseTotalPages, p + 1))}
                disabled={browsePage === browseTotalPages}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Shortlist by position */}
          <div className="grid md:grid-cols-2 gap-4">
            <ShortListBox
              title="GKP"
              ids={shortGKP}
              players={players}
              teamMap={teamMap}
              onClickPlayer={setDetailPlayerId}
              onRemove={(id) => setShortGKP((prev) => prev.filter((x) => x !== id))}
            />
            <ShortListBox
              title="DEF"
              ids={shortDEF}
              players={players}
              teamMap={teamMap}
              onClickPlayer={setDetailPlayerId}
              onRemove={(id) => setShortDEF((prev) => prev.filter((x) => x !== id))}
            />
            <ShortListBox
              title="MID"
              ids={shortMID}
              players={players}
              teamMap={teamMap}
              onClickPlayer={setDetailPlayerId}
              onRemove={(id) => setShortMID((prev) => prev.filter((x) => x !== id))}
            />
            <ShortListBox
              title="FWD"
              ids={shortFWD}
              players={players}
              teamMap={teamMap}
              onClickPlayer={setDetailPlayerId}
              onRemove={(id) => setShortFWD((prev) => prev.filter((x) => x !== id))}
            />
          </div>
        </div>
      </div>

      {/* Picker (unchanged) */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Player</DialogTitle>
            <DialogDescription>
              {activeSlot ? `Choose a ${activeSlot.type.replace('BENCH_', '')}` : ''}
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
                      <TableRow key={p.id} className={taken ? 'opacity-60' : ''}>
                        <TableCell>
                          <Button size="sm" disabled={taken} onClick={() => assignToActiveSlot(p.id)}>
                            {taken ? 'In squad' : 'Select'}
                          </Button>
                        </TableCell>
                        <TableCell>{p.web_name}</TableCell>
                        <TableCell>{teamMap[p.team]?.short_name ?? ''}</TableCell>
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
              <div className="text-sm">Page {page} / {pickerTotalPages}</div>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(pickerTotalPages, p + 1))}
                disabled={page === pickerTotalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details dialog for shortlist clicks */}
      <Dialog open={detailPlayerId != null} onOpenChange={(o) => !o && setDetailPlayerId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Player details</DialogTitle>
            <DialogDescription>Quick info from shortlist</DialogDescription>
          </DialogHeader>
          {detailPlayerId ? (
            <div className="space-y-2">
              {(() => {
                const p = players.find((x) => x.id === detailPlayerId)!;
                return (
                  <>
                    <div className="text-sm"><b>Name:</b> {p.web_name}</div>
                    <div className="text-sm"><b>Team:</b> {teamMap[p.team]?.name}</div>
                    <div className="text-sm"><b>Position:</b> {POS_LABEL[p.element_type]}</div>
                    <div className="text-sm"><b>Price:</b> {(p.now_cost / 10).toFixed(1)}m</div>
                    <div className="pt-2">
                      <Button onClick={() => setDetailPlayerId(null)}>Close</Button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Small shortlist box component */
function ShortListBox({
  title,
  ids,
  players,
  teamMap,
  onClickPlayer,
  onRemove,
}: {
  title: 'GKP' | 'DEF' | 'MID' | 'FWD';
  ids: number[];
  players: Player[];
  teamMap: Record<number, Team>;
  onClickPlayer: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const items = ids
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => !!p);

  return (
    <div className="rounded-lg border bg-white/95 dark:bg-neutral-900/95 p-3">
      <div className="text-sm font-semibold mb-2">{title} shortlist</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">No players yet</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((p) => (
            <div
              key={p.id}
              className="inline-flex items-center gap-2 rounded border px-2 py-1 text-xs bg-background cursor-pointer"
              onClick={() => onClickPlayer(p.id)}
              title="Click for details"
            >
              <span className="font-medium truncate max-w-[140px]">{p.web_name}</span>
              <span className="text-muted-foreground">{teamMap[p.team]?.short_name}</span>
              <span className="text-muted-foreground">{(p.now_cost / 10).toFixed(1)}m</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}>
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
