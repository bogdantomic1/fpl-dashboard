// app/page.tsx
'use client';
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
import type { Fixture, Player, Team, Position, NavItem } from '@/types/fpl';
import { getTeamForm } from '@/lib/fpl/difficulty';
import { computeDifficultyMap, difficultyColors } from '@/lib/fpl/difficulty';
import { buildTransferStats, topNIn, topNOut } from '@/lib/fpl/transfers';
import { filterAndSortPlayers } from '@/lib/fpl/filters';

import ModeToggle from './components/modeToggle';
import FiltersBar from './components/FiltersBar';
import PlayersTable from './components/PlayersTable';
import TransfersTabs from './components/TransfersTabs';
import PlayerDrawer from './components/PlayerDrawer';
import ComparePlayers from './components/ComparePlayers';

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

  const filtered = useMemo(() => {
    return filterAndSortPlayers({
      players,
      teamFilter,
      positionFilter,
      maxPrice,
      sortKey,
      sortOrder,
    });
  }, [players, teamFilter, positionFilter, maxPrice, sortKey, sortOrder]);

  const difficultyMap = useMemo(() => {
    if (!selectedPlayer || fixtures.length === 0 || teams.length === 0)
      return {};
    return computeDifficultyMap({
      selectedPlayer,
      fixtures,
      teams,
      // optional overrides:
      // weights: { wStrength: 0.65, wForm: 0.35 },
      // awayBoost: 0.03,
    });
  }, [selectedPlayer, fixtures, teams]);

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
    if (!totalManagers || players.length === 0)
      return { topIn: [], topOut: [] };
    const stats = buildTransferStats(players, totalManagers);
    return { topIn: topNIn(stats, 5), topOut: topNOut(stats, 5) };
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
        <FiltersBar
          teams={teams}
          positions={positions}
          teamFilter={teamFilter}
          positionFilter={positionFilter}
          maxPrice={maxPrice}
          onTeamChange={setTeamFilter}
          onPositionChange={setPositionFilter}
          onMaxPriceChange={setMaxPrice}
        />

        <PlayersTable
          rows={currentPage}
          sortedKeys={sortedKeys}
          teams={teams}
          positions={positions}
          selectedPlayers={selectedPlayers}
          sortKey={sortKey}
          sortOrder={sortOrder}
          page={page}
          totalPages={totalPages}
          onToggleSort={toggleSort}
          onToggleSelect={toggleSelect}
          onRowClick={(p) => setSelectedPlayer(p)}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
        />

        <TransfersTabs topIn={topIn} topOut={topOut} />

        {/* ─── Compare Players Section ─── */}
        <ComparePlayers
          allPlayers={players}
          selectedPlayers={selectedPlayers}
        />
        <PlayerDrawer
          open={!!selectedPlayer}
          onOpenChange={() => setSelectedPlayer(null)}
          selectedPlayer={selectedPlayer}
          playerFixtures={playerFixtures}
          teams={teams}
          difficultyMap={difficultyMap}
          visibleDetailKeys={visibleDetailKeys}
          attributeRanks={attributeRanks}
        />
      </div>
    </div>
  );
}
