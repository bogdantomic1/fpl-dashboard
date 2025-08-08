'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import type { Player, Team, Position } from '@/types/fpl';
import { playerColumnConfig } from '@/config/ColumnConfig';

interface Props {
  rows: Player[];
  sortedKeys: string[];
  teams: Team[];
  positions: Position[];
  selectedPlayers: number[];
  sortKey: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  totalPages: number;
  onToggleSort: (key: string) => void;
  onToggleSelect: (playerId: number) => void;
  onRowClick: (player: Player) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function PlayersTable({
  rows,
  sortedKeys,
  teams,
  positions,
  selectedPlayers,
  sortKey,
  sortOrder,
  page,
  totalPages,
  onToggleSort,
  onToggleSelect,
  onRowClick,
  onPrevPage,
  onNextPage,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border dark:border-gray-700 bg-white dark:bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            {sortedKeys.map((key) => (
              <TableHead
                key={key}
                className="cursor-pointer hover:underline"
                onClick={() => onToggleSort(key)}
              >
                {playerColumnConfig[key]?.label ?? key}
                {sortKey === key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((player) => {
            const isChecked = selectedPlayers.includes(player.id);
            return (
              <TableRow
                key={player.id}
                onClick={() => onRowClick(player)}
                className="cursor-pointer"
              >
                <TableCell className="w-12 p-0 flex justify-center items-center">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => onToggleSelect(player.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>

                {sortedKeys.map((key) => {
                  const raw =
                    key === 'team'
                      ? teams.find((t) => t.id === player.team)?.name
                      : key === 'element_type'
                        ? positions.find((p) => p.id === player.element_type)
                            ?.singular_name
                        : player[key];

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

      <div className="flex justify-between items-center p-4">
        <Button variant="secondary" disabled={page === 1} onClick={onPrevPage}>
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages || 1}
        </span>
        <Button
          variant="secondary"
          disabled={page === totalPages || totalPages === 0}
          onClick={onNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
