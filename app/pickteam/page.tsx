// app/pickteam/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { X, Shirt, Info, ChevronLeft, ChevronRight } from 'lucide-react';

/* ───────────────────────── Types ───────────────────────── */

type Player = {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  element_type: 1 | 2 | 3 | 4; // 1 GKP, 2 DEF, 3 MID, 4 FWD
  team: number;
  now_cost: number;
  [key: string]: any;
};

type Team = {
  id: number;
  name: string;
  short_name?: string;
};

type Fixture = {
  id: number;
  kickoff_time: string;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
};

type SlotType = 'GKP' | 'DEF' | 'MID' | 'FWD' | 'BEN';
type Slot = { id: string; type: SlotType };

/* ───────────────────── Helpers / constants ───────────────────── */

const elementTypeToPos = (
  et: Player['element_type']
): Exclude<SlotType, 'BEN'> =>
  et === 1 ? 'GKP' : et === 2 ? 'DEF' : et === 3 ? 'MID' : 'FWD';

const formationOptions: Record<
  string,
  { gk: number; def: number; mid: number; fwd: number; bench: number }
> = {
  '4-4-2': { gk: 1, def: 4, mid: 4, fwd: 2, bench: 4 },
  '3-5-2': { gk: 1, def: 3, mid: 5, fwd: 2, bench: 4 },
  '5-3-2': { gk: 1, def: 5, mid: 3, fwd: 2, bench: 4 },
  '4-3-3': { gk: 1, def: 4, mid: 3, fwd: 3, bench: 4 },
};

function buildSlots(form: keyof typeof formationOptions): Slot[] {
  const cfg = formationOptions[form];
  const out: Slot[] = [];
  for (let i = 1; i <= cfg.gk; i++) out.push({ id: `gk-${i}`, type: 'GKP' });
  for (let i = 1; i <= cfg.def; i++) out.push({ id: `def-${i}`, type: 'DEF' });
  for (let i = 1; i <= cfg.mid; i++) out.push({ id: `mid-${i}`, type: 'MID' });
  for (let i = 1; i <= cfg.fwd; i++) out.push({ id: `fwd-${i}`, type: 'FWD' });
  for (let i = 1; i <= cfg.bench; i++)
    out.push({ id: `ben-${i}`, type: 'BEN' });
  return out;
}

function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

/* ───────────────────────── DnD wrappers ───────────────────────── */

function DraggableCard({
  id,
  children,
  disabled,
}: {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      disabled,
    });
  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 30 : undefined,
    cursor: disabled ? 'not-allowed' : 'grab',
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-full h-full"
    >
      {children}
    </div>
  );
}

function DroppableSlot({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`aspect-square w-24 md:w-28 rounded-md border border-dashed flex items-center justify-center transition-colors ${
        isOver
          ? 'border-primary/70 bg-primary/10'
          : 'border-muted-foreground/20 bg-black/20'
      }`}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function PickTeamPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [formation, setFormation] = useLocalStorage<
    keyof typeof formationOptions
  >('formation', '4-4-2');
  const [slots, setSlots] = useLocalStorage<Record<string, number | null>>(
    'pickteam-slots',
    {}
  );
  const [search, setSearch] = useState('');

  // Table pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const pitchSlots = useMemo(() => buildSlots(formation), [formation]);

  // Ensure slots object matches current formation
  useEffect(() => {
    setSlots((prev) => {
      const next: Record<string, number | null> = { ...prev };
      pitchSlots.forEach((s) => {
        if (!(s.id in next)) next[s.id] = null;
      });
      Object.keys(next).forEach((k) => {
        if (!pitchSlots.find((s) => s.id === k)) delete next[k];
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitchSlots.map((s) => s.id).join(',')]);

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        const data = await res.json();
        setTeams(data.teams);
        setPlayers(data.elements);
      } catch (e) {
        console.error(e);
      }
    })();

    (async () => {
      try {
        const res = await fetch('/api/fixtures', { cache: 'no-store' });
        const data = await res.json();
        setFixtures(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const teamName = useCallback(
    (teamId: number) =>
      teams.find((t) => t.id === teamId)?.short_name ||
      teams.find((t) => t.id === teamId)?.name ||
      '',
    [teams]
  );

  const getNextFixture = useCallback(
    (teamId: number) => {
      const upcoming = fixtures
        .filter(
          (f) => !f.finished && (f.team_h === teamId || f.team_a === teamId)
        )
        .sort(
          (a, b) => Date.parse(a.kickoff_time) - Date.parse(b.kickoff_time)
        )[0];
      if (!upcoming) return '';
      const isHome = upcoming.team_h === teamId;
      const oppId = isHome ? upcoming.team_a : upcoming.team_h;
      return `${teamName(oppId)} (${isHome ? 'H' : 'A'})`;
    },
    [fixtures, teamName]
  );

  const getPlayer = (id: number | null) => players.find((p) => p.id === id);

  // Which slots are which row
  const gkSlots = pitchSlots.filter((s) => s.type === 'GKP');
  const defSlots = pitchSlots.filter((s) => s.type === 'DEF');
  const midSlots = pitchSlots.filter((s) => s.type === 'MID');
  const fwdSlots = pitchSlots.filter((s) => s.type === 'FWD');
  const benSlots = pitchSlots.filter((s) => s.type === 'BEN');

  // Enforce legal swaps
  const isLegalTarget = (playerId: number, toSlotId: string) => {
    const toSlot = pitchSlots.find((s) => s.id === toSlotId);
    if (!toSlot) return false;
    if (toSlot.type === 'BEN') return true;
    const p = getPlayer(playerId);
    if (!p) return false;
    return elementTypeToPos(p.element_type) === toSlot.type;
  };

  const firstEmptySlotFor = (p: Player): string | null => {
    const want = elementTypeToPos(p.element_type);
    const slot = Object.keys(slots).find((sid) => {
      const sType = pitchSlots.find((s) => s.id === sid)?.type;
      return sType === want && !slots[sid];
    });
    // if no pitch slot free, try bench
    if (!slot) {
      const bench = Object.keys(slots).find((sid) => {
        const sType = pitchSlots.find((s) => s.id === sid)?.type;
        return sType === 'BEN' && !slots[sid];
      });
      return bench || null;
    }
    return slot;
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // FROM a slot
    if (activeId.startsWith('slot-')) {
      const fromSlotId = activeId.replace('slot-', '');
      const fromPlayerId = slots[fromSlotId];
      if (!fromPlayerId) return;

      if (overId.startsWith('slot-')) {
        const toSlotId = overId.replace('slot-', '');
        if (!isLegalTarget(fromPlayerId, toSlotId)) return;

        setSlots((prev) => {
          const next = { ...prev };
          const otherPlayer = next[toSlotId];
          next[toSlotId] = fromPlayerId;
          next[fromSlotId] = otherPlayer ?? null;
          return next;
        });
      }
      return;
    }

    // FROM table list – (we don't drag rows; ignore)
  };

  const removePlayer = (pid: number) => {
    setSlots((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((sid) => {
        if (next[sid] === pid) next[sid] = null;
      });
      return next;
    });
  };

  const addFromTable = (p: Player) => {
    const dest = firstEmptySlotFor(p);
    if (!dest) {
      alert('No suitable empty slot available.');
      return;
    }
    setSlots((prev) => ({ ...prev, [dest]: p.id }));
  };

  /* ───────────── Right pane: table data, search & pagination ───────────── */

  const selectedIds = useMemo(
    () => new Set(Object.values(slots).filter(Boolean) as number[]),
    [slots]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      const nm = (
        p.web_name ||
        `${p.first_name} ${p.second_name}` ||
        ''
      ).toLowerCase();
      const tm = teamName(p.team).toLowerCase();
      return nm.includes(q) || tm.includes(q);
    });
  }, [players, search, teamName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageSlice = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page]
  );

  function Row({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="my-3">
        <div className="text-center text-[10px] md:text-xs mb-2 opacity-80">
          {title}
        </div>
        <div className="flex justify-center gap-5 md:gap-8">{children}</div>
      </div>
    );
  }

  function PlayerCard({
    player,
    nextFixture,
    onRemove,
    draggableId,
  }: {
    player: Player;
    nextFixture: string;
    onRemove?: () => void;
    draggableId: string;
  }) {
    return (
      <DraggableCard id={draggableId}>
        <div className="relative w-full h-full rounded-md bg-white/90 dark:bg-neutral-900/90 shadow flex items-center justify-center p-2">
          <div className="absolute left-2 top-2 text-muted-foreground">
            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
              <Shirt className="w-4 h-4 opacity-70" />
            </div>
          </div>

          <div className="flex flex-col items-center text-center px-3">
            <div className="text-[11px] md:text-sm font-semibold truncate max-w-[96px]">
              {player.web_name}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[96px]">
              {nextFixture || '\u00A0'}
            </div>
          </div>

          <div className="absolute right-2 top-2 flex items-center gap-1">
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="h-6 px-2"
              title="Details"
              onClick={(e) => {
                e.stopPropagation();
                alert(`Details for ${player.web_name}`);
              }}
            >
              <Info className="w-3 h-3 mr-1" />
              Details
            </Button>
          </div>
        </div>
      </DraggableCard>
    );
  }

  function EmptyCard({ label }: { label: string }) {
    return (
      <div className="w-full h-full rounded-md border border-dashed border-muted-foreground/20 bg-black/10 flex flex-col items-center justify-center text-muted-foreground">
        <div className="text-[11px] md:text-xs">{label}</div>
        <div className="text-[10px] opacity-60">Empty</div>
      </div>
    );
  }

  const slotTile = (sid: string, type: SlotType) => {
    const pid = slots[sid];
    const p = getPlayer(pid ?? null);
    return (
      <DroppableSlot key={sid} id={`slot-${sid}`}>
        {p ? (
          <PlayerCard
            player={p}
            nextFixture={getNextFixture(p.team)}
            draggableId={`slot-${sid}`}
            onRemove={() => removePlayer(p.id)}
          />
        ) : (
          <EmptyCard label={type === 'BEN' ? 'BEN' : type} />
        )}
      </DroppableSlot>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Pick Team</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-80">Formation</span>
          <Select
            value={formation}
            onValueChange={(v: keyof typeof formationOptions) =>
              setFormation(v)
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(formationOptions).map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Pitch */}
        <div className="rounded-lg border bg-[rgb(0,40,35)]/85 p-4 md:p-6">
          <Row title="GOALKEEPERS">
            {gkSlots.map((s) => slotTile(s.id, s.type))}
          </Row>
          <Row title="DEFENDERS">
            {defSlots.map((s) => slotTile(s.id, s.type))}
          </Row>
          <Row title="MIDFIELDERS">
            {midSlots.map((s) => slotTile(s.id, s.type))}
          </Row>
          <Row title="FORWARDS">
            {fwdSlots.map((s) => slotTile(s.id, s.type))}
          </Row>
          <Row title="BENCH">{benSlots.map((s) => slotTile(s.id, s.type))}</Row>
        </div>

        {/* Players table */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Input
              placeholder="Search by name or team…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-sm"
            />
            <div className="text-sm opacity-70">
              Showing {filtered.length} players
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              <span className="text-sm opacity-80">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white dark:bg-neutral-950">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="hidden md:table-cell">Pos</TableHead>
                  <TableHead className="hidden md:table-cell">Price</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Next Fixture
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageSlice.map((p) => {
                  const placed = selectedIds.has(p.id);
                  const pos = elementTypeToPos(p.element_type);
                  const price = (p.now_cost / 10).toFixed(1);
                  const nf = getNextFixture(p.team);

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                            <Shirt className="w-4 h-4 opacity-70" />
                          </div>
                          <div className="font-medium">{p.web_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {teamName(p.team)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {pos}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {price}m
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {nf}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {placed ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Remove"
                              onClick={() => removePlayer(p.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addFromTable(p)}
                              title="Add to first suitable slot"
                            >
                              Add
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => alert(`Details for ${p.web_name}`)}
                          >
                            <Info className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pageSlice.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground"
                    >
                      No players.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
