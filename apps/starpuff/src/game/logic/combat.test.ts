import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  canInhale,
  clampAmmo,
  inhaleFlavor,
  isInInhaleRange,
  knockbackVelocity,
  pickInRadius,
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

  it('spiky 與 chompy 不可吸入，其餘可吸（吞下即賦星屬性來源）', () => {
    expect(canInhale('spiky')).toBe(false);
    expect(canInhale('chompy')).toBe(false);
    expect(canInhale('jelly')).toBe(true);
    expect(canInhale('floaty')).toBe(true);
    expect(canInhale('puffy')).toBe(true);
  });

  it('shelly 僅暈眩時可吸（§30）；未帶狀態預設不可吸', () => {
    expect(canInhale('shelly')).toBe(false);
    expect(canInhale('shelly', false)).toBe(false);
    expect(canInhale('shelly', true)).toBe(true);
    expect(canInhale('spiky', true)).toBe(false);
  });

  it('inhaleFlavor 吸入屬性換算（§40）：shelly 得殼盾星、zappy 得雷鏈星、不可吸者為 null', () => {
    expect(inhaleFlavor('jelly')).toBe('jelly');
    expect(inhaleFlavor('floaty')).toBe('floaty');
    expect(inhaleFlavor('puffy')).toBe('puffy');
    expect(inhaleFlavor('shelly')).toBe('shelly');
    expect(inhaleFlavor('zappy')).toBe('zappy');
    expect(inhaleFlavor('spiky')).toBeNull();
    expect(inhaleFlavor('chompy')).toBeNull();
  });

  it('zappy 恆可吸（§30）', () => {
    expect(canInhale('zappy')).toBe(true);
    expect(canInhale('zappy', true)).toBe(true);
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
    expect(resolveHit(5, 0, 1, 1500)).toEqual({ hp: 4, invulnerableMs: 1500, damaged: true });
  });

  it('resolveHit i-frame 期間免傷且不重置計時', () => {
    expect(resolveHit(4, 300, 1, 1500)).toEqual({ hp: 4, invulnerableMs: 300, damaged: false });
  });

  it('resolveHit HP 不低於 0', () => {
    expect(resolveHit(1, 0, 5, 1500).hp).toBe(0);
  });

  it('resolveHit 已死亡（HP 0）不再結算', () => {
    expect(resolveHit(0, 0, 1, 1500)).toEqual({ hp: 0, invulnerableMs: 0, damaged: false });
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

describe('pickInRadius（§46 半徑選敵）', () => {
  const at = (x: number, y: number) => ({ x, y });

  it('圓域內全取（含邊界）、域外排除、順序保持', () => {
    const picked = pickInRadius(0, 0, [at(50, 0), at(0, 100), at(101, 0), at(-60, -60)], 100);
    expect(picked).toEqual([at(50, 0), at(0, 100), at(-60, -60)]);
  });

  it('空候選回空陣列', () => {
    expect(pickInRadius(0, 0, [], 100)).toEqual([]);
  });
});
