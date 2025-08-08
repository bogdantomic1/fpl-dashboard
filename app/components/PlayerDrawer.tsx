'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import type { Player, Fixture, Team } from '@/types/fpl';
import { singlePlayerConfig } from '@/config/PlayerConfig';
import { difficultyColors } from '@/lib/fpl/difficulty';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlayer: Player | null;
  playerFixtures: Fixture[];
  teams: Team[];
  difficultyMap: Record<number, number>;
  visibleDetailKeys: string[];
  attributeRanks: Record<string, string>;
}

export default function PlayerDrawer({
  open,
  onOpenChange,
  selectedPlayer,
  playerFixtures,
  teams,
  difficultyMap,
  visibleDetailKeys,
  attributeRanks,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-5xl mx-auto">
        <DrawerHeader>
          <DrawerTitle className="text-center text-xl font-bold">
            {selectedPlayer
              ? `${selectedPlayer.first_name} ${selectedPlayer.second_name}  #${selectedPlayer.squad_number ?? ''}`
              : 'Player Details'}
          </DrawerTitle>
        </DrawerHeader>

        {/* Fixtures pills */}
        {selectedPlayer && (
          <div className="flex gap-2 overflow-x-scroll px-4 py-2 mb-4">
            {playerFixtures.map((fx) => {
              const isHome = fx.team_h === selectedPlayer.team;
              const oppId = isHome ? fx.team_a : fx.team_h;
              const oppName = teams.find((t) => t.id === oppId)?.name ?? '';
              const diff = difficultyMap[fx.id] ?? 1.0;
              const colorIdx = Math.min(9, Math.max(0, Math.round(diff) - 1));
              const bg = difficultyColors[colorIdx];

              return (
                <div
                  key={fx.id}
                  className="min-w-[140px] rounded-md px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: bg }}
                >
                  <div className="font-semibold">
                    {oppName} ({isHome ? 'H' : 'A'}) {diff}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Attribute grid with rank badge */}
        {selectedPlayer && (
          <div className="grid gap-4 max-h-[70vh] overflow-y-auto grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4 pb-4">
            {visibleDetailKeys.map((key) => {
              const raw =
                key === 'team'
                  ? teams.find((t) => t.id === selectedPlayer.team)?.name
                  : (selectedPlayer as any)[key];
              const format = singlePlayerConfig[key]?.format;
              const rank = attributeRanks[key];

              return (
                <div key={key} className="relative bg-muted/20 rounded-md p-3">
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
  );
}
