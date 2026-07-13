import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  canInhale,
  clampAmmo,
  isInInhaleRange,
  knockbackVelocity,
  resolveHit,
  tickTimer,
} from './combat';

describe('combat', () => {
  it('applyDamage 扣血且不低於 0', () => {
    expect(applyDamage(5, 1)).toBe(4);
    expect(applyDamage(1, 5)).toBe(0);
  });

  it('clampAmmo 夾在 0 與上限之間', () => {
    expect(clampAmmo(4, 3)).toBe(3);
    expect(clampAmmo(-1, 3)).toBe(0);
    expect(clampAmmo(2, 3)).toBe(2);
  });

  it('spiky 不可吸入，其餘可吸', () => {
    expect(canInhale('spiky')).toBe(false);
    expect(canInhale('jelly')).toBe(true);
    expect(canInhale('floaty')).toBe(true);
  });

  it('isInInhaleRange 依朝向與距離判定', () => {
    expect(isInInhaleRange(0, 0, 1, 100, 0, 140)).toBe(true);
    expect(isInInhaleRange(0, 0, 1, -100, 0, 140)).toBe(false);
    expect(isInInhaleRange(0, 0, 1, 200, 0, 140)).toBe(false);
  });

  it('isInInhaleRange 錐形半角 45 度：垂直偏移超過水平距離不吸', () => {
    expect(isInInhaleRange(0, 0, 1, 80, 80, 140)).toBe(true);
    expect(isInInhaleRange(0, 0, 1, 80, 81, 140)).toBe(false);
    expect(isInInhaleRange(0, 0, -1, -80, -80, 140)).toBe(true);
    expect(isInInhaleRange(0, 0, 1, 0, 50, 140)).toBe(false);
  });

  it('resolveHit 正常受擊：扣血並啟動 i-frame', () => {
    expect(resolveHit(5, 0, 1, 1200)).toEqual({ hp: 4, invulnerableMs: 1200, damaged: true });
  });

  it('resolveHit i-frame 期間免傷且不重置計時', () => {
    expect(resolveHit(4, 300, 1, 1200)).toEqual({ hp: 4, invulnerableMs: 300, damaged: false });
  });

  it('resolveHit HP 不低於 0', () => {
    expect(resolveHit(1, 0, 5, 1200).hp).toBe(0);
  });

  it('tickTimer 遞減且不低於 0', () => {
    expect(tickTimer(100, 16)).toBe(84);
    expect(tickTimer(10, 16)).toBe(0);
    expect(tickTimer(0, 16)).toBe(0);
  });

  it('knockbackVelocity 遠離來源並向上抬升', () => {
    expect(knockbackVelocity(100, 200, 180, -220)).toEqual({ x: -180, y: -220 });
    expect(knockbackVelocity(200, 100, 180, -220)).toEqual({ x: 180, y: -220 });
    expect(knockbackVelocity(100, 100, 180, -220)).toEqual({ x: 180, y: -220 });
  });
});
