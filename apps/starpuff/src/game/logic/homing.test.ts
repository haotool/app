import { describe, expect, it } from 'vitest';
import { nearestInRange, steerTowardTarget } from './homing';

describe('nearestInRange（§46 追電鎖敵）', () => {
  const at = (x: number, y: number) => ({ x, y });

  it('取範圍內最近者；範圍外回 null', () => {
    expect(nearestInRange(0, 0, [at(100, 0), at(50, 0), at(200, 0)], 320)).toEqual(at(50, 0));
    expect(nearestInRange(0, 0, [at(400, 0)], 320)).toBeNull();
    expect(nearestInRange(0, 0, [], 320)).toBeNull();
  });
});

describe('steerTowardTarget（§46 限速轉向）', () => {
  it('目標在轉角內：直接對準且速率不變', () => {
    // 向右飛（560,0），目標在正右偏上微角。
    const out = steerTowardTarget(560, 0, 0, 0, 100, 5, 560, 0.5);
    const angle = Math.atan2(out.vy, out.vx);
    expect(angle).toBeCloseTo(Math.atan2(5, 100), 5);
    expect(Math.hypot(out.vx, out.vy)).toBeCloseTo(560, 5);
  });

  it('目標在轉角外：僅旋轉 maxTurnRad，逐幀逼近', () => {
    // 向右飛，目標在正上方（+90 度）；maxTurn 0.1 → 只轉 0.1rad。
    const out = steerTowardTarget(500, 0, 0, 0, 0, -100, 500, 0.1);
    expect(Math.atan2(out.vy, out.vx)).toBeCloseTo(-0.1, 5);
    expect(Math.hypot(out.vx, out.vy)).toBeCloseTo(500, 5);
  });

  it('跨 ±PI 邊界取最短旋向；零速以 fallbackSpeed 出發', () => {
    // 向左上 170 度飛、目標在左下 -170 度：最短路徑應跨越 PI（增角）。
    const a = Math.PI * (170 / 180);
    const out = steerTowardTarget(Math.cos(a) * 300, Math.sin(a) * 300, 0, 0, -100, -18, 300, 0.2);
    const angle = Math.atan2(out.vy, out.vx);
    // 逆時針跨界後角度落在 -PI 側。
    expect(angle).toBeLessThan(-Math.PI * (168 / 180));
    const stopped = steerTowardTarget(0, 0, 0, 0, 100, 0, 420, Math.PI);
    expect(Math.hypot(stopped.vx, stopped.vy)).toBeCloseTo(420, 5);
  });
});
