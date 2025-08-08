import type { Player } from '@/types/fpl';

export interface FilterParams {
  players: Player[];
  teamFilter: string; // 'all' or team id (string)
  positionFilter: string; // 'all' or pos id (string)
  maxPrice: number; // in millions (15 means 15.0m)
  sortKey: string;
  sortOrder: 'asc' | 'desc';
}

export function filterAndSortPlayers({
  players,
  teamFilter,
  positionFilter,
  maxPrice,
  sortKey,
  sortOrder,
}: FilterParams): Player[] {
  const filtered = players
    .filter((p) => teamFilter === 'all' || p.team === parseInt(teamFilter))
    .filter(
      (p) =>
        positionFilter === 'all' || p.element_type === parseInt(positionFilter)
    )
    .filter((p) => (p.now_cost ?? 0) / 10 <= maxPrice);

  filtered.sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA == null || valB == null) return 0;

    const numA = Number(valA);
    const numB = Number(valB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    }
    const strA = String(valA);
    const strB = String(valB);
    return sortOrder === 'asc'
      ? strA.localeCompare(strB)
      : strB.localeCompare(strA);
  });

  return filtered;
}
