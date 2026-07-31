import { describe, expect, it } from 'vitest';
import { STAR, STARSTORM } from '../core/config';
import {
  beginDetonation,
  chargeStarburst,
  createStarburstState,
  resolveSpMode,
  resolveSpPress,
  resolveTransformMode,
  resolveTransformPress,
  shouldCrystallize,
  tickDetonation,
} from './starburst';

describe('滿匣結晶裁決（§109）', () => {
  it('彈匣滿 5 槽且無蓄能星 → 結晶', () => {
    expect(shouldCrystallize(STAR.maxAmmo, 'none')).toBe(true);
  });

  it('未滿匣不結晶（同系 3–4 發保留變身窗口）', () => {
    expect(shouldCrystallize(STAR.maxAmmo - 1, 'none')).toBe(false);
    expect(shouldCrystallize(0, 'none')).toBe(false);
  });

  it('不疊加：蓄能星存在（charged/detonating）時再滿匣不再結晶', () => {
    expect(shouldCrystallize(STAR.maxAmmo, 'charged')).toBe(false);
    expect(shouldCrystallize(STAR.maxAmmo, 'detonating')).toBe(false);
  });
});

describe('蓄爆狀態機（§109：0.3s 不可取消）', () => {
  it('charged 起爆進入 detonating，蓄爆時長取 STARSTORM.chargeMs', () => {
    const state = beginDetonation(chargeStarburst());
    expect(state).toEqual({ phase: 'detonating', detonateMs: STARSTORM.chargeMs });
  });

  it('非 charged 相位起爆為 no-op（無蓄能星不可引爆）', () => {
    expect(beginDetonation(createStarburstState())).toEqual(createStarburstState());
    const detonating = beginDetonation(chargeStarburst());
    expect(beginDetonation(detonating)).toBe(detonating);
  });

  it('tick 遞減至期滿回報 detonated 並復位 none', () => {
    let state = beginDetonation(chargeStarburst());
    const mid = tickDetonation(state, 100);
    expect(mid.detonated).toBe(false);
    expect(mid.state.detonateMs).toBe(STARSTORM.chargeMs - 100);
    state = mid.state;
    const done = tickDetonation(state, STARSTORM.chargeMs);
    expect(done.detonated).toBe(true);
    expect(done.state).toEqual(createStarburstState());
  });

  it('非 detonating 相位 tick 為 no-op', () => {
    const idle = createStarburstState();
    expect(tickDetonation(idle, 500)).toEqual({ state: idle, detonated: false });
    const charged = chargeStarburst();
    expect(tickDetonation(charged, 500)).toEqual({ state: charged, detonated: false });
  });
});

describe('resolveSpPress（#952 拆鍵後專責星暴）', () => {
  it('蓄能星存在 → 引爆', () => {
    expect(resolveSpPress({ phase: 'charged' })).toBe('detonate');
  });

  it('蓄爆中與無蓄能星 → none', () => {
    expect(resolveSpPress({ phase: 'detonating' })).toBe('none');
    expect(resolveSpPress({ phase: 'none' })).toBe('none');
  });
});

describe('resolveSpMode（#952 呈現：圖示即行為）', () => {
  it('蓄能星存在 → detonate 金色大星；其餘 hidden', () => {
    expect(resolveSpMode({ phase: 'charged' })).toBe('detonate');
    expect(resolveSpMode({ phase: 'detonating' })).toBe('hidden');
    expect(resolveSpMode({ phase: 'none' })).toBe('hidden');
  });
});

describe('resolveTransformPress（#952 拆鍵後專責變身；#953 解除地面限制）', () => {
  it('資格成立 → 變身', () => {
    expect(resolveTransformPress({ transformActive: false, eligible: true })).toBe('transform');
  });

  it('變身中 → 提前解除', () => {
    expect(resolveTransformPress({ transformActive: true, eligible: false })).toBe('dismiss');
  });

  it('無資格 → none', () => {
    expect(resolveTransformPress({ transformActive: false, eligible: false })).toBe('none');
  });

  // #953 不變式：地面狀態不再是本裁決的輸入——空中可變身由簽章保證，非由分支保證。
  it('簽章不含 airborne（#953 不變式）', () => {
    expect(resolveTransformPress.length).toBe(1);
    expect(resolveTransformPress({ transformActive: false, eligible: true })).toBe('transform');
  });
});

describe('resolveTransformMode（#952 TF 鍵呈現；#953 不受地面限制）', () => {
  it('變身中 → dismiss；資格成立 → 形態色圓徽；無資格 → hidden', () => {
    expect(resolveTransformMode({ transformForm: 'volt', eligibleForm: null })).toBe('dismiss');
    expect(resolveTransformMode({ transformForm: null, eligibleForm: 'gale' })).toBe('gale');
    expect(resolveTransformMode({ transformForm: null, eligibleForm: null })).toBe('hidden');
  });
});
