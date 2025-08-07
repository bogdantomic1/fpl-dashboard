// app/page.tsx
'use client';
import ComparePlayers from './components2/ComparePlayers';
import { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { playerColumnConfig } from '../config/ColumnConfig';
import { singlePlayerConfig } from '../config/PlayerConfig';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ModeToggle } from './components2/modeToggle';
import { Badge } from '@/components/ui/badge';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
const mockTransfersIn = [
  { name: 'Saka', transfers: 5, owners: 100 },
  { name: 'Kane', transfers: 4, owners: 200 },
  { name: 'Havertz', transfers: 3, owners: 150 },
  { name: 'De Bruyne', transfers: 2, owners: 120 },
  { name: 'Fernandes', transfers: 1, owners: 130 },
];

const mockTransfersOut = [
  { name: 'Odegaard', transfers: 6, owners: 90 },
  { name: 'Rashford', transfers: 5, owners: 210 },
  { name: 'Son', transfers: 4, owners: 180 },
  { name: 'Martinelli', transfers: 2, owners: 80 },
  { name: 'Sterling', transfers: 1, owners: 140 },
];

interface Fixture {
  id: number;
  kickoff_time: string;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
}

interface Player {
  id: number;
  [key: string]: any;
}

interface Team {
  id: number;
  name: string;
}

interface Position {
  id: number;
  singular_name: string;
}

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
}

export const navItems: NavItem[] = [
  {
    title: 'Home',
    href: '/',
    description: 'Return to dashboard overview',
    icon: <CircleIcon size={16} />,
  },
  {
    title: 'Team Picks',
    href: '/picks',
    description: 'Review and set your weekly team',
    icon: <CircleCheckIcon size={16} />,
  },
  {
    title: 'Transfers',
    href: '/transfers',
    description: 'Manage your transfers history',
    icon: <CircleHelpIcon size={16} />,
  },
  {
    title: 'Player Stats',
    href: '/stats',
    description: 'Analyze player performance',
  },
  {
    title: 'Fixture Planner',
    href: '/fixtures',
    description: 'Plan and view upcoming fixtures',
  },
];

function ListItem({ item }: { item: NavItem }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={item.href}
          className="flex items-start space-x-2 p-4 rounded-lg hover:bg-muted"
        >
          {item.icon && <span className="mt-1">{item.icon}</span>}
          <div>
            <div className="text-sm font-medium leading-none">{item.title}</div>
            {item.description && (
              <p className="text-muted-foreground text-sm leading-snug mt-1">
                {item.description}
              </p>
            )}
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export default function Dashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [teamFilter, setTeamFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(15);
  const [page, setPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<string>('total_points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [totalManagers, setTotalManagers] = useState<number>(0);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [playerFixtures, setPlayerFixtures] = useState<Fixture[]>([]);
  const pageSize = 10;

  const toggleSelect = (playerId: number) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const mockNextFixtures = [
    { team: 'Chelsea', venue: 'A', difficulty: 2 },
    { team: 'Man Utd', venue: 'H', difficulty: 3 },
    { team: 'Arsenal', venue: 'A', difficulty: 1 },
    { team: 'Chelsea', venue: 'A', difficulty: 4 },
    { team: 'Man Utd', venue: 'H', difficulty: 5 },
    { team: 'Arsenal', venue: 'A', difficulty: 6 },
    { team: 'Chelsea', venue: 'A', difficulty: 7 },
    { team: 'Man Utd', venue: 'H', difficulty: 8 },
    { team: 'Arsenal', venue: 'A', difficulty: 9 },
    { team: 'Chelsea', venue: 'A', difficulty: 10 },
    { team: 'Man Utd', venue: 'H', difficulty: 2 },
    { team: 'Chelsea', venue: 'A', difficulty: 2 },
    { team: 'Man Utd', venue: 'H', difficulty: 3 },
    { team: 'Arsenal', venue: 'A', difficulty: 1 },
    { team: 'Chelsea', venue: 'A', difficulty: 4 },
    { team: 'Man Utd', venue: 'H', difficulty: 5 },
    { team: 'Arsenal', venue: 'A', difficulty: 6 },
    { team: 'Chelsea', venue: 'A', difficulty: 7 },
    { team: 'Man Utd', venue: 'H', difficulty: 8 },
    { team: 'Arsenal', venue: 'A', difficulty: 9 },
    { team: 'Chelsea', venue: 'A', difficulty: 10 },
    { team: 'Man Utd', venue: 'H', difficulty: 2 },
  ];

  const difficultyColors = [
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

  const allKeys = useMemo(() => {
    if (players.length === 0) return [];
    return Object.keys(players[0]);
  }, [players]);

  const visibleKeys = allKeys.filter(
    (key) => playerColumnConfig[key]?.visible ?? false
  );

  const sortedKeys = visibleKeys.sort((a, b) => {
    const orderA = playerColumnConfig[a]?.order ?? 0;
    const orderB = playerColumnConfig[b]?.order ?? 0;
    return orderA - orderB;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/data', {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });
        const data = await res.json();
        setTotalManagers(data.total_players);
        setTeams(data.teams);
        setPositions(data.element_types);
        setPlayers(data.elements);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const res = await fetch('/api/fixtures', {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });
        const data = await res.json();
        setFixtures(data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchFixtures();
  }, []);

  useEffect(() => {
    console.log(fixtures, 'Fixtures loaded');
  }, [fixtures]);

  // 2) Whenever a player is selected, filter their fixtures
  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerFixtures([]);
      return;
    }
    const teamId = selectedPlayer.team;
    const pf = fixtures.filter(
      (f) => f.team_h === teamId || f.team_a === teamId
    );
    setPlayerFixtures(pf);
  }, [selectedPlayer, fixtures]);

  useEffect(() => {
    console.log('Selected Players:', selectedPlayers);
  }, [selectedPlayers]);

  const filtered = useMemo(() => {
    let data = players
      .filter((p) => teamFilter === 'all' || p.team === parseInt(teamFilter))
      .filter(
        (p) =>
          positionFilter === 'all' ||
          p.element_type === parseInt(positionFilter)
      )
      .filter((p) => p.now_cost / 10 <= maxPrice);

    data.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA == null || valB == null) return 0;
      if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else {
        return sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      }
    });

    return data;
  }, [players, teamFilter, positionFilter, maxPrice, sortKey, sortOrder]);

  // 1) Helper to compute a team’s PPG form over last N finished fixtures
  function getTeamForm(
    teamId: number,
    allFixtures: Fixture[],
    count: number = 5
  ): number {
    // find finished fixtures for this team
    const finished = allFixtures
      .filter((f) => f.finished && (f.team_h === teamId || f.team_a === teamId))
      // latest first
      .sort((a, b) => Date.parse(b.kickoff_time) - Date.parse(a.kickoff_time))
      .slice(0, count);

    if (finished.length === 0) return 0;

    const totalPoints = finished.reduce((sum, f) => {
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

    return totalPoints / finished.length;
  }

  // 2) Weights & home boost
  const wAttack = 0.4;
  const wDefense = 0.4;
  const wHomeForm = 0.1;
  const wAwayForm = 0.1;
  const awayFactor = 0.12; // +5%

  const difficultyMap = useMemo(() => {
    if (!selectedPlayer || playerFixtures.length === 0) return {};

    // 1) Precompute formMap (if you haven’t already)
    const formMap: Record<number, number> = {};
    teams.forEach((t) => {
      formMap[t.id] = getTeamForm(t.id, fixtures, 5);
    });

    // 2) Gather raw “ratio” scores
    const raws = playerFixtures.map((f) => {
      const isHome = f.team_h === selectedPlayer.team;
      const oppId = isHome ? f.team_a : f.team_h;
      const opp = teams.find((t) => t.id === oppId)!;
      const sel = teams.find((t) => t.id === selectedPlayer.team)!;

      // venue‐specific strengths
      const oppStr = isHome
        ? opp.strength_overall_away
        : opp.strength_overall_home;
      const selStr = isHome
        ? sel.strength_overall_home
        : sel.strength_overall_away;

      // forms
      const oppForm = formMap[oppId] ?? 0;
      const selForm = formMap[sel.id] ?? 0;

      // raw blend
      const ratioStr = oppStr / selStr;
      const ratioForm = selForm > 0 ? oppForm / selForm : 1;
      const raw  = 0.7 * ratioStr + 0.3 * ratioForm;
      return { id: f.id,  raw};
    });

    // 3) Normalize into 0…1 across these raws
    const rawVals = raws.map((r) => r.raw);
    const minRaw = Math.min(...rawVals);
    const maxRaw = Math.max(...rawVals);
    const normalize = (x: number) =>
      maxRaw === minRaw ? 0.5 : (x - minRaw) / (maxRaw - minRaw);

    // 4) Scale to 1–10, two‐decimal precision
    return raws.reduce<Record<number, number>>((map, { id, raw }) => {
      const cont = 1 + normalize(raw) * 9; // continuous 1–10
      const twoDec = parseFloat(cont.toFixed(2)); // e.g. 8.29
      map[id] = twoDec;
      return map;
    }, {});
  }, [playerFixtures, selectedPlayer, teams, fixtures]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentPage = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [teamFilter, positionFilter, maxPrice]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const visibleDetailKeys = useMemo(
    () =>
      Object.keys(singlePlayerConfig).filter(
        (key) => singlePlayerConfig[key]?.visible
      ),
    []
  );

  const { topIn, topOut } = useMemo(() => {
    if (!totalManagers || players.length === 0) {
      return { topIn: [], topOut: [] };
    }

    // Map each element to the stats we need
    const stats = players.map((p) => {
      const ownershipPct = parseFloat(p.selected_by_percent); // e.g. 18.2
      const transfersIn = p.transfers_in_event; // number of managers IN
      const transfersOut = p.transfers_out_event; // number of managers OUT

      // Convert to % of total managers
      const inPct = (transfersIn / totalManagers) * 100;
      const outPct = (transfersOut / totalManagers) * 100;

      return {
        id: p.id,
        name: p.web_name,
        ownershipPct,
        transfersIn,
        transfersOut,
        inPct,
        outPct,
      };
    });

    // Sort & take top 5
    const topIn = [...stats]
      .sort((a, b) => b.transfersIn - a.transfersIn)
      .slice(0, 5);

    const topOut = [...stats]
      .sort((a, b) => b.transfersOut - a.transfersOut)
      .slice(0, 5);

    return { topIn, topOut };
  }, [players, totalManagers]);

  const attributeRanks = useMemo(() => {
    type RankMap = Record<string, string>;
    const ranks: RankMap = {};
    if (!selectedPlayer) return ranks;

    visibleDetailKeys.forEach((key) => {
      // collect every numeric value for this stat
      const numericValues = players
        .map((p) => {
          const v = Number(p[key]);
          return isNaN(v) ? null : v;
        })
        .filter((v): v is number => v !== null);

      const myVal = Number(selectedPlayer[key]);
      if (isNaN(myVal)) {
        ranks[key] = '-';
        return;
      }

      // 1) count how many are strictly greater → competition rank
      const countGreater = numericValues.filter((v) => v > myVal).length;
      const rank = countGreater + 1;

      // 2) count how many share this exact value
      const countSame = numericValues.filter((v) => v === myVal).length;

      // 3) if more than one, prefix with T-
      ranks[key] = countSame > 1 ? `T-${rank}` : `${rank}`;
    });

    return ranks;
  }, [players, selectedPlayer, visibleDetailKeys]);

  return (
    <div className="min-h-screen bg-[#f7f5fa] dark:bg-[#37003c] block">
      <div className="flex-1 p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select onValueChange={setTeamFilter} value={teamFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue>
                {teamFilter === 'all'
                  ? 'All Teams'
                  : teams.find((t) => String(t.id) === teamFilter)?.name ||
                    'Filter by team'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setPositionFilter} value={positionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue>
                {positionFilter === 'all'
                  ? 'All Positions'
                  : positions.find((p) => String(p.id) === positionFilter)
                      ?.singular_name || 'Filter by position'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {positions.map((pos) => (
                <SelectItem key={pos.id} value={String(pos.id)}>
                  {pos.singular_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#37003c] dark:text-white">
              Max price: {maxPrice.toFixed(1)}m
            </span>
            <Slider
              min={0}
              max={15}
              step={0.5}
              value={[maxPrice]}
              onValueChange={([v]) => setMaxPrice(v)}
              className="w-40"
            />
          </div>
          <ModeToggle />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border dark:border-gray-700 bg-white dark:bg-[#2d0036]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                {sortedKeys.map((key) => (
                  <TableHead
                    key={key}
                    className="cursor-pointer hover:underline"
                    onClick={() => toggleSort(key)}
                  >
                    {playerColumnConfig[key]?.label ?? key}
                    {sortKey === key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPage.map((player) => {
                const isChecked = selectedPlayers.includes(player.id);
                return (
                  <TableRow
                    key={player.id}
                    onClick={() => {
                      setSelectedPlayer(player);
                    }}
                    className="cursor-pointer"
                  >
                    {/* --- Checkbox cell --- */}
                    <TableCell className="w-12 p-0 flex justify-center items-center">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleSelect(player.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    {sortedKeys.map((key) => {
                      const raw =
                        key === 'team'
                          ? teams.find((t) => t.id === player.team)?.name
                          : key === 'element_type'
                            ? positions.find(
                                (p) => p.id === player.element_type
                              )?.singular_name
                            : player[key]; //player[key]
                      const format = playerColumnConfig[key]?.format;
                      return (
                        <TableCell key={key}>
                          {format ? format(raw) : String(raw)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {/* Pagination */}
          <div className="flex justify-between items-center p-4">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-[#37003c] dark:text-white">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Transfers In/Out (Tabs) ─── */}
      <div className="mt-8 p-4 ml-4 mr-4 bg-white dark:bg-[#2d0036] rounded-lg">
        <Tabs defaultValue="in" className="space-y-4">
          <TabsList>
            <TabsTrigger value="in">In</TabsTrigger>
            <TabsTrigger value="out">Out</TabsTrigger>
          </TabsList>

          <TabsContent value="in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Transfers In</TableHead>
                  <TableHead>Ownership %</TableHead>
                  <TableHead>In % of Managers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topIn.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.transfersIn}</TableCell>
                    <TableCell>{p.ownershipPct.toFixed(1)}%</TableCell>
                    <TableCell>{p.inPct.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="out">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Transfers Out</TableHead>
                  <TableHead>Ownership %</TableHead>
                  <TableHead>Out % of Managers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOut.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.transfersOut}</TableCell>
                    <TableCell>{p.ownershipPct.toFixed(1)}%</TableCell>
                    <TableCell>{p.outPct.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Compare Players Section ─── */}
      <ComparePlayers allPlayers={players} selectedPlayers={selectedPlayers} />

      <Drawer
        open={!!selectedPlayer}
        onOpenChange={() => setSelectedPlayer(null)}
      >
        <DrawerContent className="max-w-5xl mx-auto">
          <DrawerHeader>
            <DrawerTitle className="text-center text-xl font-bold">
              {selectedPlayer?.first_name +
                ' ' +
                selectedPlayer?.second_name +
                '  #' +
                selectedPlayer?.squad_number || 'Player Details'}
            </DrawerTitle>
          </DrawerHeader>
          {/* ――― Next Fixtures (hard-coded) ――― */}
          {selectedPlayer && (
            <div className="flex gap-2 overflow-x-scroll px-4 py-2 mb-4">
              {/* {playerFixtures.map((fx) => {
                const isHome = fx.team_h === selectedPlayer.team;
                const oppTeamId = isHome ? fx.team_a : fx.team_h;
                const oppTeam =
                  teams.find((t) => t.id === oppTeamId)?.name ?? 'Unknown';
                //const difficulty = isHome
                //  ? fx.team_h_difficulty
                //  : fx.team_a_difficulty;
                //const bg = difficultyColors[difficulty - 1];

                const difficulty = difficultyMap[fx.id] || 1;
                const bg = difficultyColors[difficulty - 1];

                // If finished, show "H - A", else show kickoff time (you can format differently)
                const display = fx.finished
                  ? `${fx.team_h_score ?? 0}-${fx.team_a_score ?? 0}`
                  : '';

                return (
                  <div
                    key={fx.id}
                    className="min-w-[140px] flex flex-col justify-between rounded-md p-3 text-white"
                    style={{ backgroundColor: bg }}
                  >
                    <div className="font-semibold">
                      {oppTeam} ({isHome ? 'H' : 'A'}) {difficulty}
                    </div>
                    <div className="text-xs">{display}</div>
                  </div>
                );
              })} */}

              {playerFixtures.map((fx) => {
                const isHome = fx.team_h === selectedPlayer.team;
                const oppId = isHome ? fx.team_a : fx.team_h;
                const oppName = teams.find((t) => t.id === oppId)?.name ?? '';
                const diff = difficultyMap[fx.id] ?? 1.0;
                // color‐index: round to nearest integer 1–10, then -1 for 0-9 index
                const colorIdx = Math.min(9, Math.max(0, Math.round(diff) - 1));
                const bg = difficultyColors[colorIdx];
                const display = fx.finished
                  ? `${fx.team_h_score ?? 0}-${fx.team_a_score ?? 0}`
                  : '';

                return (
                  <div
                    key={fx.id}
                    className="min-w-[140px] rounded-md px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: bg }}
                  >
                    <div className="font-semibold">
                      {oppName} ({isHome ? 'H' : 'A'}) {diff}
                    </div>
                    <div className="text-xs">{display}</div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedPlayer && (
            <div
              className="grid gap-4 max-h-[70vh] overflow-y-auto
                  grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {visibleDetailKeys.map((key) => {
                // safely read selectedPlayer
                const raw =
                  key === 'team'
                    ? teams.find((t) => t.id === selectedPlayer.team)?.name
                    : (selectedPlayer as any)[key];
                const format = singlePlayerConfig[key]?.format;
                const rank = attributeRanks[key];

                return (
                  <div
                    key={key}
                    className="relative bg-muted/20 rounded-md p-3"
                  >
                    {/* rank badge */}
                    <div className="absolute top-1 right-1 text-[0.8rem] font-bold text-muted-foreground">
                      #{rank ?? '-'}
                    </div>

                    <div className="text-sm text-muted-foreground font-semibold">
                      {singlePlayerConfig[key]?.label}
                    </div>
                    <div className="text-base font-medium text-foreground">
                      {format ? format(raw) : String(raw)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
