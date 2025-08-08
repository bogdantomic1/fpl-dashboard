'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { singlePlayerConfig } from '../../config/PlayerConfig';
import type { Player } from '@/types/fpl';

export default function ComparePlayers({
  allPlayers,
  selectedPlayers,
}: {
  allPlayers: Player[];
  selectedPlayers: number[];
}) {
  // Build a list of all configurable attributes:
  const cfg = singlePlayerConfig ?? {};
  const attributeOptions = Object.entries(cfg)
    .filter(([, cfg]) => cfg.visible)
    .map(([key, cfg]) => ({ key, label: cfg.label }));

  // State for which attributes to display:
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>([]);

  // Dialog open state
  const [open, setOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('compareAttributes');
    if (stored) {
      setSelectedAttrs(JSON.parse(stored));
    } else {
      // default to first 3 attrs if none stored
      setSelectedAttrs(attributeOptions.slice(0, 3).map((o) => o.key));
    }
  }, []);

  // Toggle an attribute
  const toggleAttr = (key: string) => {
    setSelectedAttrs((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      localStorage.setItem('compareAttributes', JSON.stringify(next));
      return next;
    });
  };

  // Filter players
  const players = allPlayers.filter((p) => selectedPlayers.includes(p.id));

  console.log(singlePlayerConfig, 'asdased');

  return (
    <div className="mt-8 relative p-4 bg-white dark:bg-[#2d0036] rounded-lg">
      {/* Customize button */}
      <Button
        size="sm"
        className="absolute top-4 right-4"
        onClick={() => setOpen(true)}
      >
        Customize
      </Button>

      {/* Customize Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Attributes</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto p-2">
            {attributeOptions.map((opt) => (
              <label
                key={opt.key}
                className="inline-flex items-center space-x-2"
              >
                <Checkbox
                  checked={selectedAttrs.includes(opt.key)}
                  onCheckedChange={() => toggleAttr(opt.key)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <h3 className="text-lg font-semibold mb-4 text-[#37003c] dark:text-white">
        Compare Players
      </h3>

      {players.length === 0 ? (
        <div className="text-sm text-muted-foreground">No players selected</div>
      ) : (
        <div className="overflow-x-auto shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="divide-x divide-gray-200 dark:divide-gray-700">
                {/* empty corner */}
                <th className="px-4 py-2"></th>
                {players.map((p) => (
                  <th
                    key={p.id}
                    className="px-4 py-2 text-center text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap"
                  >
                    {p.web_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#2d0036] divide-y divide-gray-200 dark:divide-gray-700 divide-x">
              {selectedAttrs.map((key) => (
                <tr
                  key={key}
                  className="divide-x divide-gray-200 dark:divide-gray-700"
                >
                  {/* attribute label */}
                  <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {singlePlayerConfig[key].label}
                  </td>
                  {/* one cell per player */}
                  {players.map((p) => {
                    const raw = p[key];
                    const formatter = singlePlayerConfig[key].format;
                    return (
                      <td
                        key={p.id}
                        className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap"
                      >
                        {formatter ? formatter(raw) : String(raw)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
