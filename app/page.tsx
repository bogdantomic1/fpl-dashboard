



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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
//import { playerColumnConfig, singlePlayerConfig } from '@/config/playerConfig';

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

export const playerColumnConfig: Record<string, ColumnConfig>  = {
  "can_transact": { label: "Can Transact", visible: false },
  "can_select": { label: "Can Select", visible: false },
  "chance_of_playing_next_round": { label: "Chance Of Playing Next Round", visible: false },
  "chance_of_playing_this_round": { label: "Chance Of Playing This Round", visible: false },
  "code": { label: "Code", visible: false },
  "cost_change_event": { label: "Cost Change Event", visible: false },
  "cost_change_event_fall": { label: "Cost Change Event Fall", visible: false },
  "cost_change_start": { label: "Cost Change Start", visible: false },
  "cost_change_start_fall": { label: "Cost Change Start Fall", visible: false },
  "dreamteam_count": { label: "Dreamteam Count", visible: false },
  "element_type": { label: "Element Type", visible: true },
  "ep_next": { label: "Ep Next", visible: false },
  "ep_this": { label: "Ep This", visible: false },
  "event_points": { label: "Event Points", visible: true },
  "first_name": { label: "First Name", visible: false },
  "form": { label: "Form", visible: true },
  "id": { label: "Id", visible: false },
  "in_dreamteam": { label: "In Dreamteam", visible: false },
  "news": { label: "News", visible: false },
  "news_added": { label: "News Added", visible: false },
  "now_cost": {
    label: "Cost",
    visible: true,
    format: (v: number, teams?: Team[]) => `${(v / 10).toFixed(1)}m`,
  },
  "photo": { label: "Photo", visible: false },
  "points_per_game": { label: "Points Per Game", visible: true },
  "removed": { label: "Removed", visible: false },
  "second_name": { label: "Second Name", visible: false },
  "selected_by_percent": { label: "Selected By Percent", visible: true },
  "special": { label: "Special", visible: false },
  "squad_number": { label: "Squad Number", visible: false },
   "status": {
    label: "Status",
    visible: true,
    format: (v: string) =>
      v === "a" ? "Available" : v === "i" ? "Injured" : v === "u" ? "Unavailable" : "nzm",
  },
  "team": { label: "Team", visible: true},
  "team_code": { label: "Team Code", visible: false },
  "total_points": { label: "Total Points", visible: true },
  "transfers_in": { label: "Transfers In", visible: true },
  "transfers_in_event": { label: "Transfers In Event", visible: true },
  "transfers_out": { label: "Transfers Out", visible: true },
  "transfers_out_event": { label: "Transfers Out Event", visible: true },
  "value_form": { label: "Value Form", visible: true },
  "value_season": { label: "Value Season", visible: true },
  "web_name": { label: "Web Name", visible: true },
  "region": { label: "Region", visible: false },
  "team_join_date": { label: "Team Join Date", visible: false },
  "birth_date": { label: "Birth Date", visible: false },
  "has_temporary_code": { label: "Has Temporary Code", visible: false },
  "opta_code": { label: "Opta Code", visible: false },
  "minutes": { label: "Minutes", visible: true },
  "goals_scored": { label: "Goals Scored", visible: true },
  "assists": { label: "Assists", visible: true },
  "clean_sheets": { label: "Clean Sheets", visible: false },
  "goals_conceded": { label: "Goals Conceded", visible: false },
  "own_goals": { label: "Own Goals", visible: false },
  "penalties_saved": { label: "Penalties Saved", visible: false },
  "penalties_missed": { label: "Penalties Missed", visible: false },
  "yellow_cards": { label: "Yellow Cards", visible: false },
  "red_cards": { label: "Red Cards", visible: false },
  "saves": { label: "Saves", visible: false },
  "bonus": { label: "Bonus", visible: false },
  "bps": { label: "Bps", visible: true },
  "influence": { label: "Influence", visible: false },
  "creativity": { label: "Creativity", visible: false },
  "threat": { label: "Threat", visible: false },
  "ict_index": { label: "Ict Index", visible: false },
  "clearances_blocks_interceptions": { label: "Clearances Blocks Interceptions", visible: false },
  "recoveries": { label: "Recoveries", visible: false },
  "tackles": { label: "Tackles", visible: false },
  "defensive_contribution": { label: "Defensive Contribution", visible: false },
  "starts": { label: "Starts", visible: false },
  "expected_goals": { label: "Expected Goals", visible: true },
  "expected_assists": { label: "Expected Assists", visible: true },
  "expected_goal_involvements": { label: "Expected Goal Involvements", visible: true },
  "expected_goals_conceded": { label: "Expected Goals Conceded", visible: false },
  "influence_rank": { label: "Influence Rank", visible: false },
  "influence_rank_type": { label: "Influence Rank Type", visible: false },
  "creativity_rank": { label: "Creativity Rank", visible: false },
  "creativity_rank_type": { label: "Creativity Rank Type", visible: false },
  "threat_rank": { label: "Threat Rank", visible: false },
  "threat_rank_type": { label: "Threat Rank Type", visible: false },
  "ict_index_rank": { label: "Ict Index Rank", visible: false },
  "ict_index_rank_type": { label: "Ict Index Rank Type", visible: false },
  "corners_and_indirect_freekicks_order": { label: "Corners And Indirect Freekicks Order", visible: false },
  "corners_and_indirect_freekicks_text": { label: "Corners And Indirect Freekicks Text", visible: false },
  "direct_freekicks_order": { label: "Direct Freekicks Order", visible: false },
  "direct_freekicks_text": { label: "Direct Freekicks Text", visible: false },
  "penalties_order": { label: "Penalties Order", visible: false },
  "penalties_text": { label: "Penalties Text", visible: false },
  "expected_goals_per_90": { label: "Expected Goals Per 90", visible: false },
  "saves_per_90": { label: "Saves Per 90", visible: false },
  "expected_assists_per_90": { label: "Expected Assists Per 90", visible: false },
  "expected_goal_involvements_per_90": { label: "Expected Goal Involvements Per 90", visible: false },
  "expected_goals_conceded_per_90": { label: "Expected Goals Conceded Per 90", visible: false },
  "goals_conceded_per_90": { label: "Goals Conceded Per 90", visible: false },
  "now_cost_rank": { label: "Now Cost Rank", visible: false },
  "now_cost_rank_type": { label: "Now Cost Rank Type", visible: false },
  "form_rank": { label: "Form Rank", visible: false },
  "form_rank_type": { label: "Form Rank Type", visible: false },
  "points_per_game_rank": { label: "Points Per Game Rank", visible: false },
  "points_per_game_rank_type": { label: "Points Per Game Rank Type", visible: false },
  "selected_rank": { label: "Selected Rank", visible: false },
  "selected_rank_type": { label: "Selected Rank Type", visible: false },
  "starts_per_90": { label: "Starts Per 90", visible: false },
  "clean_sheets_per_90": { label: "Clean Sheets Per 90", visible: false },
  "defensive_contribution_per_90": { label: "Defensive Contribution Per 90", visible: false },
};

export const singlePlayerConfig: Record<string, ColumnConfig>  = {
  "can_transact": { label: "Can Transact", visible: false },
  "can_select": { label: "Can Select", visible: false },
  "chance_of_playing_next_round": { label: "Chance Of Playing Next Round", visible: false },
  "chance_of_playing_this_round": { label: "Chance Of Playing This Round", visible: false },
  "code": { label: "Code", visible: false },
  "cost_change_event": { label: "Cost Change Event", visible: false },
  "cost_change_event_fall": { label: "Cost Change Event Fall", visible: false },
  "cost_change_start": { label: "Cost Change Start", visible: false },
  "cost_change_start_fall": { label: "Cost Change Start Fall", visible: false },
  "dreamteam_count": { label: "Dreamteam Count", visible: false },
  "element_type": { label: "Element Type", visible: true },
  "ep_next": { label: "Ep Next", visible: false },
  "ep_this": { label: "Ep This", visible: false },
  "event_points": { label: "Event Points", visible: true },
  "first_name": { label: "First Name", visible: false },
  "form": { label: "Form", visible: true },
  "id": { label: "Id", visible: false },
  "in_dreamteam": { label: "In Dreamteam", visible: false },
  "news": { label: "News", visible: false },
  "news_added": { label: "News Added", visible: false },
  "now_cost": {
    label: "Cost",
    visible: true,
    format: (v: number, teams?: Team[]) => `${(v / 10).toFixed(1)}m`,
  },
  "photo": { label: "Photo", visible: false },
  "points_per_game": { label: "Points Per Game", visible: true },
  "removed": { label: "Removed", visible: false },
  "second_name": { label: "Second Name", visible: false },
  "selected_by_percent": { label: "Selected By Percent", visible: true },
  "special": { label: "Special", visible: false },
  "squad_number": { label: "Squad Number", visible: false },
   "status": {
    label: "Status",
    visible: true,
    format: (v: string) =>
      v === "a" ? "Available" : v === "i" ? "Injured" : v === "u" ? "Unavailable" : "nzm",
  },
  "team": { label: "Team", visible: true },
  //"team": { label: "Team", visible: true, format: (v: number, teams1: Team[]) => teams1.find(t => t.id === v)?.name || 'Unknown' },
  "team_code": { label: "Team Code", visible: false },
  "total_points": { label: "Total Points", visible: true },
  "transfers_in": { label: "Transfers In", visible: true },
  "transfers_in_event": { label: "Transfers In Event", visible: true },
  "transfers_out": { label: "Transfers Out", visible: true },
  "transfers_out_event": { label: "Transfers Out Event", visible: true },
  "value_form": { label: "Value Form", visible: true },
  "value_season": { label: "Value Season", visible: true },
  "web_name": { label: "Web Name", visible: true },
  "region": { label: "Region", visible: false },
  "team_join_date": { label: "Team Join Date", visible: false },
  "birth_date": { label: "Birth Date", visible: false },
  "has_temporary_code": { label: "Has Temporary Code", visible: false },
  "opta_code": { label: "Opta Code", visible: false },
  "minutes": { label: "Minutes", visible: true },
  "goals_scored": { label: "Goals Scored", visible: true },
  "assists": { label: "Assists", visible: true },
  "clean_sheets": { label: "Clean Sheets", visible: false },
  "goals_conceded": { label: "Goals Conceded", visible: false },
  "own_goals": { label: "Own Goals", visible: false },
  "penalties_saved": { label: "Penalties Saved", visible: false },
  "penalties_missed": { label: "Penalties Missed", visible: false },
  "yellow_cards": { label: "Yellow Cards", visible: false },
  "red_cards": { label: "Red Cards", visible: false },
  "saves": { label: "Saves", visible: false },
  "bonus": { label: "Bonus", visible: false },
  "bps": { label: "Bps", visible: true },
  "influence": { label: "Influence", visible: false },
  "creativity": { label: "Creativity", visible: false },
  "threat": { label: "Threat", visible: false },
  "ict_index": { label: "Ict Index", visible: false },
  "clearances_blocks_interceptions": { label: "Clearances Blocks Interceptions", visible: false },
  "recoveries": { label: "Recoveries", visible: false },
  "tackles": { label: "Tackles", visible: false },
  "defensive_contribution": { label: "Defensive Contribution", visible: false },
  "starts": { label: "Starts", visible: false },
  "expected_goals": { label: "Expected Goals", visible: true },
  "expected_assists": { label: "Expected Assists", visible: true },
  "expected_goal_involvements": { label: "Expected Goal Involvements", visible: true },
  "expected_goals_conceded": { label: "Expected Goals Conceded", visible: false },
  "influence_rank": { label: "Influence Rank", visible: false },
  "influence_rank_type": { label: "Influence Rank Type", visible: false },
  "creativity_rank": { label: "Creativity Rank", visible: false },
  "creativity_rank_type": { label: "Creativity Rank Type", visible: false },
  "threat_rank": { label: "Threat Rank", visible: false },
  "threat_rank_type": { label: "Threat Rank Type", visible: false },
  "ict_index_rank": { label: "Ict Index Rank", visible: false },
  "ict_index_rank_type": { label: "Ict Index Rank Type", visible: false },
  "corners_and_indirect_freekicks_order": { label: "Corners And Indirect Freekicks Order", visible: false },
  "corners_and_indirect_freekicks_text": { label: "Corners And Indirect Freekicks Text", visible: false },
  "direct_freekicks_order": { label: "Direct Freekicks Order", visible: false },
  "direct_freekicks_text": { label: "Direct Freekicks Text", visible: false },
  "penalties_order": { label: "Penalties Order", visible: false },
  "penalties_text": { label: "Penalties Text", visible: false },
  "expected_goals_per_90": { label: "Expected Goals Per 90", visible: false },
  "saves_per_90": { label: "Saves Per 90", visible: false },
  "expected_assists_per_90": { label: "Expected Assists Per 90", visible: false },
  "expected_goal_involvements_per_90": { label: "Expected Goal Involvements Per 90", visible: false },
  "expected_goals_conceded_per_90": { label: "Expected Goals Conceded Per 90", visible: false },
  "goals_conceded_per_90": { label: "Goals Conceded Per 90", visible: false },
  "now_cost_rank": { label: "Now Cost Rank", visible: false },
  "now_cost_rank_type": { label: "Now Cost Rank Type", visible: false },
  "form_rank": { label: "Form Rank", visible: false },
  "form_rank_type": { label: "Form Rank Type", visible: false },
  "points_per_game_rank": { label: "Points Per Game Rank", visible: false },
  "points_per_game_rank_type": { label: "Points Per Game Rank Type", visible: false },
  "selected_rank": { label: "Selected Rank", visible: false },
  "selected_rank_type": { label: "Selected Rank Type", visible: false },
  "starts_per_90": { label: "Starts Per 90", visible: false },
  "clean_sheets_per_90": { label: "Clean Sheets Per 90", visible: false },
  "defensive_contribution_per_90": { label: "Defensive Contribution Per 90", visible: false },
};

export default function Dashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [teamFilter, setTeamFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(15);
  const [page, setPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [sortKey, setSortKey] = useState<string>('total_points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 10;

  const allKeys = useMemo(() => {
    if (players.length === 0) return [];
    return Object.keys(players[0]);
  }, [players]);

  const visibleKeys = allKeys.filter((key) => playerColumnConfig[key]?.visible ?? false);

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

  const filtered = useMemo(() => {
    let data = players
      .filter((p) => !teamFilter || p.team === parseInt(teamFilter))
      .filter((p) => !positionFilter || p.element_type === parseInt(positionFilter))
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
    <div className="flex min-h-screen bg-[#f7f5fa] dark:bg-[#37003c]">
      <div className="flex-1 p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setPositionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by position" />
            </SelectTrigger>
            <SelectContent>
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border dark:border-gray-700 bg-white dark:bg-[#2d0036]">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleKeys.map((key) => (
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
              {currentPage.map((player) => (
                <TableRow
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className="cursor-pointer"
                >
                  {visibleKeys.map((key) => {
                    const raw = key === 'team' ? teams.find((t) => t.id === player.team)?.name : player[key];
                    const format = playerColumnConfig[key]?.format;
                    return <TableCell key={key}>{format ? format(raw) : String(raw)}</TableCell>;
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center p-4">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <span className="text-sm text-[#37003c] dark:text-white">Page {page} of {totalPages || 1}</span>
            <Button variant="secondary" disabled={page === totalPages || totalPages === 0} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      </div>

      <aside className="hidden lg:block lg:w-80 bg-[#ebe4f0] dark:bg-[#2d0036] p-6"></aside>

      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">{selectedPlayer?.web_name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            {selectedPlayer && Object.keys(selectedPlayer).map((key) => {
              if (!singlePlayerConfig[key]?.visible) return null;
              const raw = key === 'team' ? teams.find(t => t.id === selectedPlayer.team)?.name : selectedPlayer[key];
              const format = singlePlayerConfig[key]?.format;
              return (
                <div key={key} className="bg-muted/20 rounded-md p-3">
                  <div className="text-sm text-muted-foreground font-semibold">{singlePlayerConfig[key]?.label}</div>
                  <div className="text-base font-medium text-foreground">{format ? format(raw) : String(raw)}</div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
