import { describe, expect, it } from 'vitest';
import {
  UPDRAFT,
  isInUpdraft,
  isVentSupplying,
  updraftLift,
  ventPhase,
  type UpdraftZone,
} from './updraft';

const GROUND_TOP = 400;
const zone: UpdraftZone = { x: 1000, topY: 150, w: 96 };
// L13 熱泉噴口（§72）：periodMs 2600、dutyPct 0.31 ≈ 噴發 0.8s。
const vent: UpdraftZone = { x: 1000, topY: 150, w: 96, periodMs: 2600, dutyPct: 0.31 };
// idleMs = 2600 × (1-0.31) = 1794。
const VENT_IDLE_MS = 1794;

describe('isInUpdraft（§51 柱域判定）', () => {
  it('柱寬內且介於柱頂與地面頂之間為域內', () => {
    expect(isInUpdraft(1000, 300, zone, GROUND_TOP)).toBe(true);
    expect(isInUpdraft(1047, 300, zone, GROUND_TOP)).toBe(true);
    expect(isInUpdraft(1049, 300, zone, GROUND_TOP)).toBe(false);
    expect(isInUpdraft(952, 399, zone, GROUND_TOP)).toBe(true);
  });

  it('柱頂以上不供力（自然拋出）；地面頂以下不供力', () => {
    expect(isInUpdraft(1000, 149, zone, GROUND_TOP)).toBe(false);
    expect(isInUpdraft(1000, 150, zone, GROUND_TOP)).toBe(true);
    expect(isInUpdraft(1000, 401, zone, GROUND_TOP)).toBe(false);
  });
});

describe('updraftLift（§51 升力結算）', () => {
  it('逐幀向上加速：16ms 內增加 liftPxPerSec2×dt', () => {
    const lifted = updraftLift(0, 16, false);
    expect(lifted).toBeCloseTo(-UPDRAFT.liftPxPerSec2 * 0.016, 5);
  });

  it('升速夾限於 maxRiseSpeed，不無限加速', () => {
    let vy = 200;
    for (let i = 0; i < 120; i += 1) vy = updraftLift(vy, 16, false);
    expect(vy).toBe(UPDRAFT.maxRiseSpeed);
  });

  it('卡頂防護（§56）：blockedUp 時不供力，交還重力回落', () => {
    expect(updraftLift(-100, 16, true)).toBe(-100);
  });

  it('下墜中入柱：先減緩下墜再轉上升', () => {
    const first = updraftLift(300, 16, false);
    expect(first).toBeLessThan(300);
    expect(first).toBeGreaterThan(UPDRAFT.maxRiseSpeed);
  });
});

describe('ventPhase 熱泉噴口週期（§72 週期參數化）', () => {
  it('週期頭為 idle，噴發前 0.5s 轉 telegraph（蒸汽預警）', () => {
    expect(ventPhase(0, vent)).toBe('idle');
    expect(ventPhase(VENT_IDLE_MS - UPDRAFT.ventTelegraphMs - 1, vent)).toBe('idle');
    expect(ventPhase(VENT_IDLE_MS - UPDRAFT.ventTelegraphMs, vent)).toBe('telegraph');
    expect(ventPhase(VENT_IDLE_MS - 1, vent)).toBe('telegraph');
  });

  it('噴發段為 erupt，滿週期循環回 idle', () => {
    expect(ventPhase(VENT_IDLE_MS, vent)).toBe('erupt');
    expect(ventPhase(2599, vent)).toBe('erupt');
    expect(ventPhase(2600, vent)).toBe('idle');
  });

  it('periodMs 缺省（既有氣流柱）恆為 erupt——L5 行為零回歸', () => {
    expect(ventPhase(0, zone)).toBe('erupt');
    expect(ventPhase(999999, zone)).toBe('erupt');
  });
});

describe('isVentSupplying 供力判定（telegraph/idle 不供力）', () => {
  it('恆常柱恆供力；週期噴口僅噴發段供力', () => {
    expect(isVentSupplying(0, zone)).toBe(true);
    expect(isVentSupplying(0, vent)).toBe(false);
    expect(isVentSupplying(VENT_IDLE_MS - 100, vent)).toBe(false);
    expect(isVentSupplying(VENT_IDLE_MS, vent)).toBe(true);
  });
});
