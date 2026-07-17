import { describe, expect, it } from 'vitest';
import { UPDRAFT, isInUpdraft, updraftLift, type UpdraftZone } from './updraft';

const GROUND_TOP = 400;
const zone: UpdraftZone = { x: 1000, topY: 150, w: 96 };

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
