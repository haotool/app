import { describe, expect, it } from 'vitest';
import { applyDamage, canInhale, clampAmmo, isInInhaleRange } from './combat';

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
});
