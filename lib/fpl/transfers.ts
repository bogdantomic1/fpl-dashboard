import type { Player } from '@/types/fpl';

export interface TransferRow {
  id: number;
  name: string;
  ownershipPct: number;
  transfersIn: number;
  transfersOut: number;
  inPct: number;
  outPct: number;
}

export function buildTransferStats(
  players: Player[],
  totalManagers: number
): TransferRow[] {
  if (!totalManagers) return [];
  return players.map((p) => {
    const ownershipPct = parseFloat(p.selected_by_percent); // "18.2" -> 18.2
    const transfersIn = p.transfers_in_event ?? 0;
    const transfersOut = p.transfers_out_event ?? 0;
    //calculate real number of mangers owening that play using totalManager & ownership %
    const realNumberOfMangers = (totalManagers / 100) * ownershipPct;

    const inPct = (transfersIn / realNumberOfMangers) * 100;
    const outPct = (transfersOut / realNumberOfMangers) * 100;
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
}

export function topNIn(stats: TransferRow[], n: number = 5): TransferRow[] {
  return [...stats].sort((a, b) => b.transfersIn - a.transfersIn).slice(0, n);
}

export function topNOut(stats: TransferRow[], n: number = 5): TransferRow[] {
  return [...stats].sort((a, b) => b.transfersOut - a.transfersOut).slice(0, n);
}
