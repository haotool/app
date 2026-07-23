import { describe, expect, it } from 'vitest';
import {
  NEAR_BAND_PX,
  createSeededRng,
  distanceBandOf,
  moveAllowed,
  pickMove,
  type MoveContext,
  type WeightedMove,
} from './moveTable';

const CTX: MoveContext = { hpRatio: 1, distanceBand: 'far' };

const TABLE: readonly WeightedMove<'a' | 'b' | 'c'>[] = [
  { action: 'a', weight: 3 },
  { action: 'b', weight: 3 },
  { action: 'c', weight: 2, condition: { band: 'far' } },
];

describe('createSeededRng（同 seed 可重放）', () => {
  it('同 seed 序列完全一致、不同 seed 序列相異', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    const c = createSeededRng(7);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    const seqC = Array.from({ length: 20 }, () => c());
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('distanceBandOf（距離帶）', () => {
  it('門檻內 near、門檻外 far、未知視為 far', () => {
    expect(distanceBandOf(NEAR_BAND_PX)).toBe('near');
    expect(distanceBandOf(NEAR_BAND_PX + 1)).toBe('far');
    expect(distanceBandOf(null)).toBe('far');
  });
});

describe('moveAllowed（條件欄 HP 帶/距離帶）', () => {
  it('HP 帶上下限與距離帶皆為 AND 關係', () => {
    expect(moveAllowed(undefined, CTX)).toBe(true);
    expect(moveAllowed({ maxHpRatio: 0.5 }, { ...CTX, hpRatio: 0.4 })).toBe(true);
    expect(moveAllowed({ maxHpRatio: 0.5 }, { ...CTX, hpRatio: 0.6 })).toBe(false);
    expect(moveAllowed({ minHpRatio: 0.5 }, { ...CTX, hpRatio: 0.4 })).toBe(false);
    expect(moveAllowed({ band: 'near' }, CTX)).toBe(false);
    expect(moveAllowed({ band: 'far' }, CTX)).toBe(true);
    expect(moveAllowed({ band: 'far', maxHpRatio: 0.5 }, CTX)).toBe(false);
  });
});

describe('pickMove（加權選招）', () => {
  it('條件不符的招不會被抽中（near 帶剔除 c）', () => {
    const rng = createSeededRng(1);
    for (let i = 0; i < 200; i += 1) {
      const action = pickMove(TABLE, { hpRatio: 1, distanceBand: 'near' }, [], rng);
      expect(action).not.toBe('c');
    }
  });

  it('連續同招上限 2：任意 300 抽不出現三連同招', () => {
    const rng = createSeededRng(9);
    const recent: ('a' | 'b' | 'c')[] = [];
    for (let i = 0; i < 300; i += 1) {
      const action = pickMove(TABLE, CTX, recent, rng);
      recent.push(action);
    }
    for (let i = 2; i < recent.length; i += 1) {
      const three = recent.slice(i - 2, i + 1);
      expect(new Set(three).size).toBeGreaterThan(1);
    }
  });

  it('全部候選被條件剔除時回退整表（anti-softlock）', () => {
    const gated: readonly WeightedMove<'x'>[] = [
      { action: 'x', weight: 1, condition: { band: 'near' } },
    ];
    expect(pickMove(gated, CTX, [], createSeededRng(3))).toBe('x');
  });

  it('唯一候選達同招上限仍可選（永不空手）', () => {
    const single: readonly WeightedMove<'x'>[] = [{ action: 'x', weight: 1 }];
    expect(pickMove(single, CTX, ['x', 'x'], createSeededRng(3))).toBe('x');
  });

  it('同 seed 抽選序列完全重放', () => {
    const draw = (seed: number): string[] => {
      const rng = createSeededRng(seed);
      const recent: ('a' | 'b' | 'c')[] = [];
      for (let i = 0; i < 30; i += 1) recent.push(pickMove(TABLE, CTX, recent, rng));
      return recent;
    };
    expect(draw(5)).toEqual(draw(5));
    expect(draw(5)).not.toEqual(draw(6));
  });
});
