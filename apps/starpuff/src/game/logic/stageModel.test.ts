import { describe, expect, it } from 'vitest';
import {
  SPRING_COOLDOWN_MS,
  SPRING_VELOCITY_Y,
  canSpringLaunch,
  maxDecorInWindow,
  shouldDropThrough,
} from './stageModel';

describe('canSpringLaunch 彈簧觸發閘（§29 / recon C.3）', () => {
  it('落下或站立（vy>=0）且冷卻期滿可觸發', () => {
    expect(canSpringLaunch(1000, 0, 0)).toBe(true);
    expect(canSpringLaunch(1000, 0, 320)).toBe(true);
  });

  it('上升中（vy<0）不觸發，防連彈抖動', () => {
    expect(canSpringLaunch(1000, 0, SPRING_VELOCITY_Y)).toBe(false);
    expect(canSpringLaunch(1000, 0, -1)).toBe(false);
  });

  it('冷卻期內不重複觸發，期滿恢復', () => {
    const lockedUntil = 1000 + SPRING_COOLDOWN_MS;
    expect(canSpringLaunch(1100, lockedUntil, 100)).toBe(false);
    expect(canSpringLaunch(lockedUntil, lockedUntil, 100)).toBe(true);
  });
});

describe('shouldDropThrough 下落穿透（§29）', () => {
  it('站在單向平台上搖桿下 + 跳觸發', () => {
    expect(shouldDropThrough(true, true, true)).toBe(true);
  });

  it('缺任一條件不觸發（地面下跳、單按下、單按跳）', () => {
    expect(shouldDropThrough(true, true, false)).toBe(false);
    expect(shouldDropThrough(true, false, true)).toBe(false);
    expect(shouldDropThrough(false, true, true)).toBe(false);
  });
});

describe('maxDecorInWindow 同屏密度（§32）', () => {
  it('回報任一視窗內最大道具數（視窗含端點）', () => {
    expect(maxDecorInWindow([0, 500, 1000, 1500, 2000], 1200)).toBe(3);
    expect(maxDecorInWindow([0, 100, 200, 300], 1200)).toBe(4);
  });

  it('空佈景回 0；單件回 1', () => {
    expect(maxDecorInWindow([], 1200)).toBe(0);
    expect(maxDecorInWindow([400], 1200)).toBe(1);
  });
});
