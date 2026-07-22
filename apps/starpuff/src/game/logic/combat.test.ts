import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  INHALE_GRACE_MS,
  SHELLY_NEAR_PX,
  applyDamage,
  canInhale,
  clampAmmo,
  inhaleFlavor,
  inhaleGraceUntil,
  inhalePullSpeed,
  inhaleRangePx,
  isContactHarmless,
  isInInhalePullRange,
  isInInhaleRange,
  knockbackVelocity,
  pickInRadius,
  resolveHit,
  tickTimer,
} from './combat';
import type { EnemyKind } from '../core/types';

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

  it('#811 殼殼判定半徑 +20%、暈眩引力 ×1.5；非殼殼維持原值', () => {
    expect(inhaleRangePx('shelly', 140)).toBeCloseTo(168, 5);
    expect(inhaleRangePx('jelly', 140)).toBe(140);
    expect(inhalePullSpeed('jelly', 140, 40, 160, 2.2)).toBeCloseTo(160 + 100 * 2.2, 5);
    expect(inhalePullSpeed('shelly', 140, 40, 160, 2.2)).toBeCloseTo((160 + 128 * 2.2) * 1.5, 5);
  });

  it('#811 殼殼近身豁免：貼身 ≤60px 錐外仍可拉（停位貼腳死角），非殼殼與遠位不豁免', () => {
    // 殼殼在腳邊（dx 3 / dy 9，|dy|>|dx| 錐外）——豁免生效。
    expect(isInInhaleRange(0, 0, 1, 3, 9, 140)).toBe(false);
    expect(isInInhalePullRange('shelly', 0, 0, 1, 3, 9, 140)).toBe(true);
    // 面向反側貼身亦可拉（真人可即時回頭，機械面向不設死角）。
    expect(isInInhalePullRange('shelly', 0, 0, 1, -20, 9, 140)).toBe(true);
    // 非殼殼同位置：錐外即不可拉。
    expect(isInInhalePullRange('jelly', 0, 0, 1, 3, 9, 140)).toBe(false);
    // 殼殼超出近身圈且錐外：不可拉。
    expect(isInInhalePullRange('shelly', 0, 0, 1, 30, 70, 140)).toBe(false);
    expect(SHELLY_NEAR_PX).toBe(60);
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

describe('v18-level-bot INHALABLE 漂移守門（§107.4：量測近似集對齊 canInhale 真值）', () => {
  // 全品種窮舉表：新增 EnemyKind 而未更新此表時型別報錯，強制同步審視 bot 量測口徑。
  const ALL_KINDS: Record<EnemyKind, true> = {
    jelly: true,
    floaty: true,
    spiky: true,
    puffy: true,
    chompy: true,
    shelly: true,
    zappy: true,
    drilly: true,
    glowy: true,
    spora: true,
    gusty: true,
    boomy: true,
    magno: true,
    mirri: true,
    bubbla: true,
    splatta: true,
    twinkla: true,
    cometa: true,
  };

  it('腳本內嵌集合等於恆可吸真值（條件可吸 exposed 品種保守不計）', () => {
    const source = readFileSync(
      new URL('../../../scripts/v18-level-bot.mjs', import.meta.url),
      'utf8',
    );
    const block = /const INHALABLE = new Set\(\[([\s\S]*?)\]\);/.exec(source)?.[1];
    expect(block).toBeDefined();
    const botSet = Array.from((block ?? '').matchAll(/'(\w+)'/g), (m) => m[1] ?? '');
    const truth = (Object.keys(ALL_KINDS) as EnemyKind[]).filter((kind) => canInhale(kind));
    expect([...botSet].sort()).toEqual([...truth].sort());
  });
});

describe('吸入接觸豁免（§77：被吸入中的怪對玩家無接觸傷害）', () => {
  it('被吸入中（豁免窗內）與玩家重疊 → 零傷害', () => {
    const until = inhaleGraceUntil(1000);
    expect(isContactHarmless(1000, until)).toBe(true);
    expect(isContactHarmless(1000 + INHALE_GRACE_MS - 1, until)).toBe(true);
  });

  it('未被吸入的怪（無豁免窗）→ 正常傷害', () => {
    expect(isContactHarmless(1000, 0)).toBe(false);
  });

  it('吸入中斷後豁免窗過期 → 恢復傷害性（風險回報保留）', () => {
    const until = inhaleGraceUntil(1000);
    expect(isContactHarmless(until, until)).toBe(false);
    expect(isContactHarmless(until + 1, until)).toBe(false);
  });

  it('拉力逐幀刷新豁免窗：最後拉力幀後保留 INHALE_GRACE_MS', () => {
    expect(inhaleGraceUntil(2000)).toBe(2000 + INHALE_GRACE_MS);
  });
});
