import { describe, expect, it } from 'vitest';
import { createPprEngine, nextRegime, sampleFatTail, type Rng } from './engine';
import {
  PPR_PRICE_MAX,
  PPR_PRICE_MIN,
  PPR_REGIME_NEXT,
  PPR_REGIME_STAY,
  PPR_SEED_PRICE,
  type PprRegime,
} from './config';

// 測試用固定 seed PRNG：確定性、跨執行穩定，統計性斷言不飄。
function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sequenceRng(values: number[], cycle = false): Rng {
  let cursor = 0;
  return () => {
    const value = cycle ? values[cursor % values.length] : values[cursor];
    cursor += 1;
    if (value === undefined) throw new Error(`rng sequence exhausted at ${cursor - 1}`);
    return value;
  };
}

describe('createPprEngine', () => {
  it('starts from the seed price in the range regime', () => {
    const engine = createPprEngine();
    expect(engine.getPrice()).toBe(PPR_SEED_PRICE);
    expect(engine.getRegime()).toBe('range');
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
    // rng 恆回 0：每 tick 觸發下行插針＋回彈交替→驗證下界；恆回接近 1 驗證上界。
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

  it('produces fat-tail jump events that exceed the base step range', () => {
    // 單 tick 消耗序：stay、wick、基準符號、基準步幅、跳躍判定、跳躍符號、肥尾取樣。
    const engine = createPprEngine(
      PPR_SEED_PRICE,
      sequenceRng([0.9, 0.9, 0.5, 0.5, 0.001, 0.9, 0.99], true),
    );
    const before = engine.getPrice();
    const after = engine.tick();
    expect(Math.abs(after / before - 1)).toBeGreaterThan(0.2);
  });

  it('spikes on a wick tick then snaps back next tick without chaining', () => {
    const values = [
      // tick1 插針：stay、wick 觸發、方向（上）、幅度（中點→+100%）。
      0.9, 0.0, 0.9, 0.5,
      // tick2 回彈：噪聲符號（+）、噪聲步幅。
      0.9, 0.5,
      // tick3 常規：stay、wick 不觸發、符號、步幅、跳躍不觸發。
      0.9, 0.9, 0.9, 0.5, 0.9,
    ];
    const engine = createPprEngine(PPR_SEED_PRICE, sequenceRng(values));
    const pre = engine.getPrice();

    const spike = engine.tick();
    expect(spike / pre).toBeGreaterThan(1.9);

    // 回彈到插針前價位附近（僅基準噪聲±0.5% 與微幅回歸），非趨勢延續。
    const recovered = engine.tick();
    expect(Math.abs(recovered / pre - 1)).toBeLessThan(0.02);

    const settled = engine.tick();
    expect(Math.abs(settled / recovered - 1)).toBeLessThan(0.02);
  });

  it('sustains upward drift while the pump regime persists', () => {
    // tick1 轉移進 pump（stay 抽 0.999 離開 range、roll 0.1 落 pump），之後每 tick 停留。
    const values = [0.999, 0.1, 0.9, 0.9, 0.5, 0.9];
    for (let index = 0; index < 10; index += 1) values.push(0.5, 0.9, 0.9, 0.5, 0.9);
    const engine = createPprEngine(PPR_SEED_PRICE, sequenceRng(values));
    const before = engine.getPrice();
    let price = before;
    for (let index = 0; index < 11; index += 1) price = engine.tick();
    expect(engine.getRegime()).toBe('pump');
    expect(price / before).toBeGreaterThan(1.05);
  });

  it('converges to a plausible regime occupancy over a long seeded run', () => {
    const engine = createPprEngine(PPR_SEED_PRICE, mulberry32(1234));
    const counts: Record<PprRegime, number> = { range: 0, pump: 0, dump: 0, bleed: 0 };
    const total = 50_000;
    for (let index = 0; index < total; index += 1) {
      engine.tick();
      counts[engine.getRegime()] += 1;
    }
    // 理論平衡約 range 72%、pump/dump 各 5%、bleed 18%；此處驗證數量級收斂而非精確值。
    expect(counts.range / total).toBeGreaterThan(0.5);
    expect(counts.range / total).toBeLessThan(0.9);
    for (const state of ['pump', 'dump', 'bleed'] as const) {
      expect(counts[state] / total).toBeGreaterThan(0.005);
      expect(counts[state] / total).toBeLessThan(0.35);
    }
  });
});

describe('sampleFatTail', () => {
  it('maps the rng extremes onto the sampling bounds', () => {
    expect(sampleFatTail(() => 0, 0.3, 0.8, 3)).toBe(0.3);
    expect(sampleFatTail(() => 0.999, 0.3, 0.8, 3)).toBeCloseTo(0.8, 2);
  });

  it('applies the power transform deterministically', () => {
    expect(sampleFatTail(() => 0.5, 0, 1, 3)).toBeCloseTo(0.125, 10);
    // power=1 退化為均勻分布。
    expect(sampleFatTail(() => 0.5, 0.3, 0.8, 1)).toBeCloseTo(0.55, 10);
  });

  it('skews the mass toward the lower bound (statistical, seeded)', () => {
    const rng = mulberry32(42);
    const total = 10_000;
    let below = 0;
    for (let index = 0; index < total; index += 1) {
      if (sampleFatTail(rng, 0, 1, 3) < 0.5) below += 1;
    }
    // 理論值 0.5^(1/3) ≈ 0.794：多數溫和、少數暴力。
    expect(below / total).toBeGreaterThan(0.75);
    expect(below / total).toBeLessThan(0.84);
  });
});

describe('nextRegime', () => {
  it('stays in the current regime while the stay draw holds', () => {
    expect(nextRegime(sequenceRng([0.5]), 'range')).toBe('range');
    expect(nextRegime(sequenceRng([0.96]), 'pump')).toBe('pump');
  });

  it('transitions according to the weight table when leaving', () => {
    expect(nextRegime(sequenceRng([0.999, 0.1]), 'range')).toBe('pump');
    expect(nextRegime(sequenceRng([0.999, 0.45]), 'range')).toBe('dump');
    expect(nextRegime(sequenceRng([0.999, 0.95]), 'range')).toBe('bleed');
    expect(nextRegime(sequenceRng([0.999, 0.05]), 'pump')).toBe('range');
    expect(nextRegime(sequenceRng([0.999, 0.99]), 'bleed')).toBe('dump');
  });

  it('keeps the transition config normalised', () => {
    for (const [state, stay] of Object.entries(PPR_REGIME_STAY)) {
      expect(stay).toBeGreaterThan(0);
      expect(stay).toBeLessThan(1);
      const weights = PPR_REGIME_NEXT[state as PprRegime];
      const sum = weights.reduce((acc, [, weight]) => acc + weight, 0);
      expect(sum).toBeCloseTo(1, 10);
    }
  });
});
