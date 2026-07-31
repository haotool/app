import { describe, expect, it } from 'vitest';
import { STAR, STARSTORM, type MagazineSlot, type StarFlavor } from '../core/config';
import {
  beginDetonation,
  chargeStarburst,
  createStarburstState,
  resolveSpMode,
  resolveSpPress,
  resolveTransformMode,
  resolveTransformPress,
  canCrystallize,
  starstormBossDamage,
  STARSTORM_CONVERSION,
  tickDetonation,
} from './starburst';

describe('滿匣結晶裁決（§109）', () => {
  it('彈匣滿 5 槽且無蓄能星 → 結晶', () => {
    expect(canCrystallize(STAR.maxAmmo, 'none')).toBe(true);
  });

  it('未滿匣不結晶（同系 3–4 發保留變身窗口）', () => {
    expect(canCrystallize(STAR.maxAmmo - 1, 'none')).toBe(false);
    expect(canCrystallize(0, 'none')).toBe(false);
  });

  it('不疊加：蓄能星存在（charged/detonating）時再滿匣不再結晶', () => {
    expect(canCrystallize(STAR.maxAmmo, 'charged')).toBe(false);
    expect(canCrystallize(STAR.maxAmmo, 'detonating')).toBe(false);
  });
});

describe('蓄爆狀態機（§109：0.3s 不可取消）', () => {
  it('charged 起爆進入 detonating，蓄爆時長取 STARSTORM.chargeMs', () => {
    const state = beginDetonation(chargeStarburst(12));
    expect(state).toEqual({ phase: 'detonating', detonateMs: STARSTORM.chargeMs, bossDamage: 12 });
  });

  it('非 charged 相位起爆為 no-op（無蓄能星不可引爆）', () => {
    expect(beginDetonation(createStarburstState())).toEqual(createStarburstState());
    const detonating = beginDetonation(chargeStarburst(12));
    expect(beginDetonation(detonating)).toBe(detonating);
  });

  it('tick 遞減至期滿回報 detonated 並復位 none', () => {
    let state = beginDetonation(chargeStarburst(12));
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
    const charged = chargeStarburst(12);
    expect(tickDetonation(charged, 500)).toEqual({ state: charged, detonated: false });
  });
});

describe('resolveSpPress（#952 拆鍵後專責星暴）', () => {
  it('蓄能星存在 → 引爆', () => {
    expect(resolveSpPress({ phase: 'charged', ammo: 0 })).toBe('detonate');
  });

  it('蓄爆中與無蓄能星 → none', () => {
    expect(resolveSpPress({ phase: 'detonating', ammo: 0 })).toBe('none');
    expect(resolveSpPress({ phase: 'none', ammo: 0 })).toBe('none');
  });
});

describe('resolveSpMode（#952 呈現：圖示即行為）', () => {
  it('蓄能星存在 → detonate 金色大星；其餘 hidden', () => {
    expect(resolveSpMode({ phase: 'charged', ammo: 0 })).toBe('detonate');
    expect(resolveSpMode({ phase: 'detonating', ammo: 0 })).toBe('hidden');
    expect(resolveSpMode({ phase: 'none', ammo: 0 })).toBe('hidden');
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

// #954：魔王傷害改依投入星值計價——修前恆為固定 12，而同樣 5 槽直射有 25~40，
// 魔王戰兌換率是明確虧損。本組釘住「累積被兌現」與保底不回歸。
describe('starstormBossDamage 動態傷害（#954）', () => {
  const plain = (flavor: StarFlavor): MagazineSlot => ({ flavor, charged: false, gold: false });

  it('素星滿匣：投入 25（5×5）× 1.2 → 30，明顯高於舊固定 12', () => {
    const magazine = Array.from({ length: STAR.maxAmmo }, () => plain('jelly'));
    expect(starstormBossDamage(magazine)).toBe(Math.round(25 * STARSTORM_CONVERSION));
    expect(starstormBossDamage(magazine)).toBeGreaterThan(STARSTORM.bossDamage);
  });

  it('強化星計入更高星值：同槽數換得更高傷害（彈匣經營有意義）', () => {
    const plainFive = Array.from({ length: STAR.maxAmmo }, () => plain('jelly'));
    const chargedFive = Array.from({ length: STAR.maxAmmo }, () => ({
      flavor: 'jelly' as StarFlavor,
      charged: true,
      gold: false,
    }));
    expect(starstormBossDamage(chargedFive)).toBeGreaterThan(starstormBossDamage(plainFive));
  });

  it('保底不低於舊固定值：空匣或低星值不回歸為 0', () => {
    expect(starstormBossDamage([])).toBe(STARSTORM.bossDamage);
    expect(starstormBossDamage([plain('jelly')])).toBe(STARSTORM.bossDamage);
  });
});

describe('canCrystallize 手動結晶（#954）與 SP 兩義互斥', () => {
  it('滿匣且無蓄能星 → SP 結晶；結晶後同鍵改為引爆（天然互斥，每態單義）', () => {
    expect(resolveSpPress({ phase: 'none', ammo: STAR.maxAmmo })).toBe('crystallize');
    expect(resolveSpPress({ phase: 'charged', ammo: STAR.maxAmmo })).toBe('detonate');
  });

  it('未滿匣不可結晶——彈匣得以停在滿匣以外的任何狀態', () => {
    expect(resolveSpPress({ phase: 'none', ammo: STAR.maxAmmo - 1 })).toBe('none');
  });

  it('圖示即行為：滿匣顯示 crystallize、蓄能顯示 detonate', () => {
    expect(resolveSpMode({ phase: 'none', ammo: STAR.maxAmmo })).toBe('crystallize');
    expect(resolveSpMode({ phase: 'charged', ammo: STAR.maxAmmo })).toBe('detonate');
    expect(resolveSpMode({ phase: 'none', ammo: 1 })).toBe('hidden');
  });
});
