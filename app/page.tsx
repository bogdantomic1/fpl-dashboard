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
  const pageSize = 10;

  const toggleSelect = (playerId: number) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const mockNextFixtures = [
    { team: 'Chelsea', venue: 'A' },
    { team: 'Man Utd', venue: 'H' },
    { team: 'Arsenal', venue: 'A' },
    { team: 'Chelsea', venue: 'A' },
    { team: 'Man Utd', venue: 'H' },
    { team: 'Arsenal', venue: 'A' },
    { team: 'Chelsea', venue: 'A' },
    { team: 'Man Utd', venue: 'H' },
    { team: 'Arsenal', venue: 'A' },
    { team: 'Chelsea', venue: 'A' },
    { team: 'Man Utd', venue: 'H' },
    { team: 'Arsenal', venue: 'A' },
    { team: 'Chelsea', venue: 'A' },
    { team: 'Man Utd', venue: 'H' },
    { team: 'Arsenal', venue: 'A' },
    { team: 'Chelsea', venue: 'A' },
    { team: 'Man Utd', venue: 'H' },
    { team: 'Arsenal', venue: 'A' },
    { team: 'Chelsea', venue: 'A' },
    { team: 'Man Utd', venue: 'H' },
    { team: 'Arsenal', venue: 'A' },
    { team: 'Chelsea', venue: 'A' },
    { team: 'Man Utd', venue: 'H' },
    { team: 'Arsenal', venue: 'A' },
    { team: 'Chelsea', venue: 'A' },
    { team: 'Man Utd', venue: 'H' },
    { team: 'Arsenal', venue: 'A' },
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

  {
    /*CONSOLE.LOG START*/
  }
  console.log(selectedPlayer);
  {
    /*CONSOLE.LOG END*/
  }

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
                    //onClick={() => }
                    className="cursor-pointer"
                  >
                    {/* --- Checkbox cell --- */}
                    <TableCell className="p-0 w-[40px]">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleSelect(player.id)}
                        // prevent the row-click handler from firing
                        onClick={(e) => e.stopPropagation()}
                        className={`cursor-pointer ${
                          selectedPlayers.includes(player.id)
                            ? 'bg-purple-50 dark:bg-purple-900'
                            : ''
                        }`}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTransfersIn.map((p) => {
                  const pct = ((p.transfers / p.owners) * 100).toFixed(1) + '%';
                  return (
                    <TableRow key={p.name}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.transfers}</TableCell>
                      <TableCell>{pct}</TableCell>
                    </TableRow>
                  );
                })}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTransfersOut.map((p) => {
                  const pct = ((p.transfers / p.owners) * 100).toFixed(1) + '%';
                  return (
                    <TableRow key={p.name}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.transfers}</TableCell>
                      <TableCell>{pct}</TableCell>
                    </TableRow>
                  );
                })}
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
            <div className="flex gap-2 overflow-x-scroll px-4 py-2 mb-4 w-max">
              {mockNextFixtures.map((fx, i) => (
                <div
                  key={i}
                  className="bg-muted/20 dark:bg-muted/50 rounded-md px-3 py-1 text-sm font-semibold"
                >
                  {fx.team} ({fx.venue})
                </div>
              ))}
            </div>
          )}
          <div
            className="grid gap-4 max-h-[70vh] overflow-y-auto
        grid-cols-2
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4"
          >
            {selectedPlayer &&
              Object.keys(selectedPlayer).map((key) => {
                if (!singlePlayerConfig[key]?.visible) return null;
                const raw =
                  key === 'team'
                    ? teams.find((t) => t.id === selectedPlayer.team)?.name
                    : selectedPlayer[key];
                const format = singlePlayerConfig[key]?.format;
                return (
                  <div key={key} className="bg-muted/20 rounded-md p-3">
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
        </DrawerContent>
      </Drawer>
    </div>
  );
}
