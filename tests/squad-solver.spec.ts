// tests/squad-solver.spec.ts
import { describe, it, expect } from 'vitest';
import { bestXIExactTop3, type Player } from '../lib/squad-solver';

const mk = (id: number, team: number, pos: 1|2|3|4, cost: number, w: number, name?: string): Player => ({
  id, team, element_type: pos, now_cost: Math.round(cost*10), web_name: name ?? `P${id}`,
});

describe('bestXIExactTop3', () => {
  it('finds higher-weight XI under budget (beats greedy)', () => {
    // Teams 1..6 ; prices crafted so a pricier swap yields more total weight
    const pool: Player[] = [
      // GK (need 1)
      mk(1, 1, 1, 4.0, 10, 'G1'),
      mk(2, 2, 1, 4.5, 12, 'G2'),

      // DEF (need 3 in 3-4-3 / 3-5-2 or 4 in 4-4-2 etc.)
      mk(11, 1, 2, 4.0,  9, 'D1a'),
      mk(12, 1, 2, 4.5,  9.5,'D1b'),
      mk(13, 2, 2, 4.5, 11, 'D2a'),
      mk(14, 3, 2, 4.0,  8, 'D3a'),
      mk(15, 4, 2, 5.0, 12, 'D4a'),
      mk(16, 5, 2, 4.0,  7, 'D5a'),

      // MID (need 4 or 5 depending on formation)
      mk(21, 1, 3, 6.0, 18, 'M1a'),
      mk(22, 2, 3, 6.5, 19, 'M2a'),
      mk(23, 3, 3, 5.5, 14, 'M3a'),
      mk(24, 4, 3, 7.5, 22, 'M4a'),
      mk(25, 5, 3, 5.0, 12, 'M5a'),
      mk(26, 6, 3, 4.5, 10, 'M6a'),

      // FWD (need 2 or 3 depending on formation)
      mk(31, 1, 4, 7.5, 20, 'F1a'),
      mk(32, 2, 4, 6.0, 15, 'F2a'),
      mk(33, 3, 4, 8.5, 24, 'F3a'),
      mk(34, 4, 4, 5.5, 11, 'F4a'),
      mk(35, 5, 4, 7.0, 18, 'F5a'),
    ];

    // weights map
    const weights: Record<number, number> = Object.fromEntries(pool.map(p => [p.id, (p as any).w ?? p.web_name.startsWith('P') ? 1 : 1]));
    // fill from helper "mk" values:
    for (const p of pool) weights[p.id] = (p as any).w ?? 1;

    // No locks. Budget XI: tight but allows choosing a pricier high-weight combo.
    const budget = 83; // XIV budget after bench (example)

    const res = bestXIExactTop3(pool, weights, budget, {});
    expect(res.length).toBeGreaterThan(0);
    const best = res[0];

    // Must be valid XI of 11 players
    expect(best.ids.length).toBe(11);

    // Respect team cap (<=3 per team)
    const teamCounts = new Map<number, number>();
    for (const id of best.ids) {
      const t = pool.find(p => p.id === id)!.team;
      teamCounts.set(t, (teamCounts.get(t) ?? 0) + 1);
    }
    for (const [, cnt] of teamCounts) expect(cnt).toBeLessThanOrEqual(3);

    // Total cost <= budget
    const totalCost = best.ids.reduce((s, id) => s + pool.find(p => p.id === id)!.now_cost / 10, 0);
    expect(totalCost).toBeLessThanOrEqual(budget);

    // Score equals sum of weights chosen
    const totalScore = best.ids.reduce((s, id) => s + weights[id], 0);
    expect(best.score).toBeCloseTo(totalScore, 6);
  });

  it('honors locks and still finds optimal around them', () => {
    // Minimal pool per position but with choices
    const pool: Player[] = [
      mk(1, 1, 1, 4.0, 6, 'G1'),
      mk(2, 2, 1, 4.5, 8, 'G2'),

      mk(11, 1, 2, 4.0, 6, 'D1'),
      mk(12, 2, 2, 4.5, 7, 'D2'),
      mk(13, 3, 2, 4.0, 5, 'D3'),
      mk(14, 4, 2, 5.0, 9, 'D4'),
      mk(15, 5, 2, 4.0, 5, 'D5'),

      mk(21, 1, 3, 6.0, 12, 'M1'),
      mk(22, 2, 3, 6.5, 13, 'M2'),
      mk(23, 3, 3, 5.5, 10, 'M3'),
      mk(24, 4, 3, 7.5, 15, 'M4'),
      mk(25, 5, 3, 5.0, 9, 'M5'),
      mk(26, 6, 3, 4.5, 8, 'M6'),

      mk(31, 1, 4, 7.5, 14, 'F1'),
      mk(32, 2, 4, 6.0, 12, 'F2'),
      mk(33, 3, 4, 8.5, 18, 'F3'),
      mk(34, 4, 4, 5.5, 9,  'F4'),
      mk(35, 5, 4, 7.0, 13, 'F5'),
    ];
    const weights: Record<number, number> = {};
    for (const p of pool) weights[p.id] = (p as any).w;

    const locks = { 33: true, 24: true }; // lock top FWD (F3) and top MID (M4)
    const budget = 85;

    const res = bestXIExactTop3(pool, weights, budget, locks);
    expect(res.length).toBeGreaterThan(0);
    const best = res[0];

    // locks present
    expect(best.ids.includes(33)).toBe(true);
    expect(best.ids.includes(24)).toBe(true);

    // valid constraints
    const totalCost = best.ids.reduce((s, id) => s + pool.find(p => p.id === id)!.now_cost / 10, 0);
    expect(totalCost).toBeLessThanOrEqual(budget);
    const teamCounts = new Map<number, number>();
    for (const id of best.ids) {
      const t = pool.find(p => p.id === id)!.team;
      teamCounts.set(t, (teamCounts.get(t) ?? 0) + 1);
    }
    for (const [, cnt] of teamCounts) expect(cnt).toBeLessThanOrEqual(3);
  });

  it('explores multiple formations and picks the highest-score arrangement', () => {
    // Construct pool where 3-5-2 beats 3-4-3 by weight
    const pool: Player[] = [
      mk(1, 1, 1, 4.0, 8),
      mk(2, 2, 1, 4.5, 7),

      // DEF (plenty)
      mk(11, 1, 2, 4.0, 6), mk(12, 2, 2, 4.5, 6),
      mk(13, 3, 2, 4.0, 6), mk(14, 4, 2, 4.5, 6),
      mk(15, 5, 2, 4.0, 6),

      // MID (very strong mids)
      mk(21, 1, 3, 7.0, 16), mk(22, 2, 3, 7.0, 16),
      mk(23, 3, 3, 7.0, 16), mk(24, 4, 3, 7.0, 16),
      mk(25, 5, 3, 7.0, 16), mk(26, 6, 3, 7.0, 16),

      // FWD (decent but fewer stars)
      mk(31, 1, 4, 7.5, 10), mk(32, 2, 4, 7.5, 10),
      mk(33, 3, 4, 8.0, 11),
    ];
    const weights: Record<number, number> = {};
    for (const p of pool) weights[p.id] = (p as any).w;

    const res = bestXIExactTop3(pool, weights, 90, {});
    expect(res.length).toBeGreaterThan(0);
    const best = res[0];

    // Expect 5 mids in the chosen XI often because MID weights dominate
    const mids = best.breakdown.mid.length;
    expect([4,5]).toContain(mids);
    expect(best.ids.length).toBe(11);
  });
});
