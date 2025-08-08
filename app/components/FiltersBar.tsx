'use client';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import ModeToggle from './modeToggle';
import type { Team, Position } from '@/types/fpl';

interface Props {
  teams: Team[];
  positions: Position[];
  teamFilter: string;
  positionFilter: string;
  maxPrice: number;
  onTeamChange: (v: string) => void;
  onPositionChange: (v: string) => void;
  onMaxPriceChange: (v: number) => void;
}

export default function FiltersBar({
  teams,
  positions,
  teamFilter,
  positionFilter,
  maxPrice,
  onTeamChange,
  onPositionChange,
  onMaxPriceChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <Select onValueChange={onTeamChange} value={teamFilter}>
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

      <Select onValueChange={onPositionChange} value={positionFilter}>
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
        <span className="text-sm">Max price: {maxPrice.toFixed(1)}m</span>
        <Slider
          min={0}
          max={15}
          step={0.5}
          value={[maxPrice]}
          onValueChange={([v]) => onMaxPriceChange(v)}
          className="w-40"
        />
      </div>

      <ModeToggle />
    </div>
  );
}
