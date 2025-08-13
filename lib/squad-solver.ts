// lib/squad-solver.ts
export type Player = {
  id: number;
  web_name: string;
  now_cost: number; // tenths of a million
  team: number;
  element_type: number; // 1 GKP, 2 DEF, 3 MID, 4 FWD
  [k: string]: any;
};

export type Squad = {
  ids: number[];
  score: number;
  totalCost: number;
  breakdown: { gk: number[]; def: number[]; mid: number[]; fwd: number[] };
};

type PosKey = 'gk' | 'def' | 'mid' | 'fwd';
type Item = { id: number; team: number; cost: number; w: number; p: Player; };

const formations: Array<{ def: number; mid: number; fwd: number }> = [
  { def: 3, mid: 4, fwd: 3 },
  { def: 3, mid: 5, fwd: 2 },
  { def: 4, mid: 4, fwd: 2 },
  { def: 4, mid: 3, fwd: 3 },
  { def: 5, mid: 3, fwd: 2 },
  { def: 5, mid: 4, fwd: 1 },
];

function buildPoolByPos(pool: Player[], weights: Record<number, number>) {
  const map: Record<PosKey, Item[]> = { gk: [], def: [], mid: [], fwd: [] };
  for (const p of pool) {
    const it: Item = { id: p.id, team: p.team, cost: p.now_cost / 10, w: weights[p.id] ?? 0, p };
    (p.element_type === 1 ? map.gk
      : p.element_type === 2 ? map.def
      : p.element_type === 3 ? map.mid
      : map.fwd).push(it);
  }
  (Object.keys(map) as PosKey[]).forEach(k => {
    map[k].sort((a, b) => b.w - a.w || a.cost - b.cost || a.id - b.id);
  });
  return map;
}

function prefixSums(items: Item[]) {
  const prefW: number[] = [0];
  for (let i = 0; i < items.length; i++) prefW[i + 1] = prefW[i] + items[i].w;
  const byCost = items.slice().sort((a, b) => a.cost - b.cost);
  const prefMinCost: number[] = [0];
  for (let i = 0; i < byCost.length; i++) prefMinCost[i + 1] = prefMinCost[i] + byCost[i].cost;
  return { prefW, byCost, prefMinCost };
}

export function bestXIExactTop3(
  pool: Player[],
  weights: Record<number, number>,
  budget: number,
  locks: Record<number, boolean>
): Squad[] {
  const byPos = buildPoolByPos(pool, weights);
  const PS = {
    gk: prefixSums(byPos.gk),
    def: prefixSums(byPos.def),
    mid: prefixSums(byPos.mid),
    fwd: prefixSums(byPos.fwd),
  };
  const lockedSet = new Set<number>(Object.keys(locks).filter(id => locks[+id]).map(id => +id));
  const teamLimit = 3;

  const best: Squad[] = [];
  const consider = (s: Squad) => {
    best.push(s);
    best.sort((a, b) => b.score - a.score || a.totalCost - b.totalCost);
    if (best.length > 3) best.pop();
  };

  const posOrder: PosKey[] = ['gk', 'def', 'mid', 'fwd'];

  for (const form of formations) {
    const need: Record<PosKey, number> = { gk: 1, def: form.def, mid: form.mid, fwd: form.fwd };
    const byTeam: Record<number, number> = {};
    const chosenIds = new Set<number>();
    const breakdown: Record<PosKey, number[]> = { gk: [], def: [], mid: [], fwd: [] };
    let cost = 0;
    let score = 0;
    let feasible = true;

    // place locks
    for (const k of posOrder) {
      const list = byPos[k];
      for (const it of list) {
        if (!lockedSet.has(it.id)) continue;
        if (need[k] <= 0) { feasible = false; break; }
        const tc = byTeam[it.team] ?? 0;
        if (tc >= teamLimit) { feasible = false; break; }
        if (cost + it.cost > budget) { feasible = false; break; }
        chosenIds.add(it.id);
        byTeam[it.team] = tc + 1;
        need[k] -= 1;
        cost += it.cost;
        score += it.w;
        breakdown[k].push(it.id);
      }
      if (!feasible) break;
    }
    if (!feasible) continue;

    const cand: Record<PosKey, Item[]> = {
      gk: byPos.gk.filter(x => !chosenIds.has(x.id)),
      def: byPos.def.filter(x => !chosenIds.has(x.id)),
      mid: byPos.mid.filter(x => !chosenIds.has(x.id)),
      fwd: byPos.fwd.filter(x => !chosenIds.has(x.id)),
    };

    // quick min-cost lower bound
    const minCostLB = (k: PosKey, take: number) => {
      if (take <= 0) return 0;
      const arr = PS[k].byCost;
      let c = 0, t = take, i = 0;
      while (t > 0 && i < arr.length) {
        const it = arr[i++];
        if (chosenIds.has(it.id)) continue;
        c += it.cost;
        t--;
      }
      return t > 0 ? Number.POSITIVE_INFINITY : c;
    };
    const lb =
      minCostLB('gk', need.gk) +
      minCostLB('def', need.def) +
      minCostLB('mid', need.mid) +
      minCostLB('fwd', need.fwd);
    if (cost + lb > budget) continue;

    const maxWeightUB = (k: PosKey, take: number) => {
      if (take <= 0) return 0;
      const arr = cand[k];
      let t = take, sum = 0, i = 0;
      while (t > 0 && i < arr.length) { sum += arr[i++].w; t--; }
      return sum;
    };

    const order = posOrder.filter(k => need[k] > 0);

    const dfs = (idxPos: number, costSoFar: number, scoreSoFar: number) => {
      if (idxPos >= order.length) {
        consider({
          ids: Array.from(chosenIds),
          score: scoreSoFar,
          totalCost: costSoFar,
          breakdown: {
            gk: breakdown.gk.slice(),
            def: breakdown.def.slice(),
            mid: breakdown.mid.slice(),
            fwd: breakdown.fwd.slice(),
          },
        });
        return;
      }
      const k = order[idxPos];
      const needK = need[k];
      const list = cand[k];

      let ub = scoreSoFar + maxWeightUB(k, needK);
      for (let j = idxPos + 1; j < order.length; j++) ub += maxWeightUB(order[j], need[order[j]]);
      if (best.length === 3 && ub <= best[best.length - 1].score) return;

      const choose = (start: number, left: number, c: number, s: number) => {
        // quick budget LB for remainder (coarse but effective)
        let lbPos = 0;
        if (left > 0) {
          const remaining = list.slice(start).slice().sort((a, b) => a.cost - b.cost);
          if (remaining.length < left) return;
          for (let i = 0; i < left; i++) lbPos += remaining[i].cost;
        }
        for (let j = idxPos + 1; j < order.length; j++) {
          const rkey = order[j];
          const cheap = PS[rkey].byCost.filter(it => !chosenIds.has(it.id)).slice(0, need[rkey]);
          if (cheap.length < need[rkey]) return;
          lbPos += cheap.reduce((acc, it) => acc + it.cost, 0);
        }
        if (c + lbPos > budget) return;

        if (left === 0) return dfs(idxPos + 1, c, s);
        if (list.length - start < left) return;

        const cur = list[start];

        // take
        const tc = byTeam[cur.team] ?? 0;
        if (!chosenIds.has(cur.id) && tc < teamLimit && c + cur.cost <= budget) {
          let ub2 = s + cur.w;
          const remainForUB = list.slice(start + 1);
          for (let i = 0; i < left - 1 && i < remainForUB.length; i++) ub2 += remainForUB[i].w;
          for (let j = idxPos + 1; j < order.length; j++) ub2 += maxWeightUB(order[j], need[order[j]]);
          if (!(best.length === 3 && ub2 <= best[best.length - 1].score)) {
            chosenIds.add(cur.id);
            byTeam[cur.team] = tc + 1;
            breakdown[k].push(cur.id);
            choose(start + 1, left - 1, c + cur.cost, s + cur.w);
            breakdown[k].pop();
            byTeam[cur.team] = tc;
            chosenIds.delete(cur.id);
          }
        }
        // skip
        choose(start + 1, left, c, s);
      };

      choose(0, needK, costSoFar, scoreSoFar);
    };

    dfs(0, cost, score);
  }

  const uniq = new Map<string, Squad>();
  for (const s of best) {
    const key = s.ids.slice().sort((a, b) => a - b).join('-');
    const old = uniq.get(key);
    if (!old || s.score > old.score) uniq.set(key, s);
  }
  return [...uniq.values()].sort((a, b) => b.score - a.score || a.totalCost - b.totalCost).slice(0, 3);
}
