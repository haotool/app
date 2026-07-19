import { describe, expect, it } from 'vitest';
import { createPprEngine } from './engine';
import { PPR_PRICE_MAX, PPR_PRICE_MIN, PPR_SEED_PRICE } from './config';

describe('createPprEngine', () => {
  it('starts from the seed price', () => {
    const engine = createPprEngine();
    expect(engine.getPrice()).toBe(PPR_SEED_PRICE);
  });

  it('keeps 5000 ticks finite and inside the hard guardrail over a long run', () => {
    const engine = createPprEngine();
    const violations: number[] = [];
    for (let index = 0; index < 5000; index += 1) {
      const price = engine.tick();
      if (!Number.isFinite(price) || price < PPR_PRICE_MIN || price > PPR_PRICE_MAX) {
        violations.push(price);
      }
    }
    expect(violations).toEqual([]);
  });

  it('survives adversarial rngs pinned to both extremes', () => {
    // rng 恆回 0：必觸發跳躍分支且方向固定向下→驗證下界；恆回接近 1 驗證上界。
    const floorEngine = createPprEngine(PPR_SEED_PRICE, () => 0);
    const floorViolations: number[] = [];
    for (let index = 0; index < 2000; index += 1) {
      const price = floorEngine.tick();
      if (!Number.isFinite(price) || price < PPR_PRICE_MIN) floorViolations.push(price);
    }
    expect(floorViolations).toEqual([]);

    const ceilEngine = createPprEngine(PPR_SEED_PRICE, () => 0.999999);
    const ceilViolations: number[] = [];
    for (let index = 0; index < 2000; index += 1) {
      const price = ceilEngine.tick();
      if (!Number.isFinite(price) || price > PPR_PRICE_MAX) ceilViolations.push(price);
    }
    expect(ceilViolations).toEqual([]);
  });

  it('produces jump events that exceed the base step range', () => {
    // 固定序列強制觸發跳躍：單 tick 漲跌幅必須明顯超出基準游走上限 0.5%。
    const values = [0.9, 0.5, 0.0, 0.9];
    let cursor = 0;
    const engine = createPprEngine(PPR_SEED_PRICE, () => {
      const value = values[cursor % values.length]!;
      cursor += 1;
      return value;
    });
    const before = engine.getPrice();
    const after = engine.tick();
    expect(Math.abs(after / before - 1)).toBeGreaterThan(0.2);
  });
});
