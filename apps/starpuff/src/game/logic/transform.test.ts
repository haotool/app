import { describe, expect, it } from 'vitest';
import type { MagazineSlot } from '../core/config';
import {
  GALE_GLIDE,
  SHELL_CHARGE,
  SHELL_TUCK,
  TRANSFORM,
  TRANSFORM_FORMS,
  VOLT_DISCHARGE,
  absorbHalvedDamage,
  consumeDischarge,
  consumeTuck,
  createTransformState,
  eligibleForm,
  endTransform,
  glideFallVy,
  startTransform,
  tickTransform,
  transformProgress,
} from './transform';

const slot = (flavor: MagazineSlot['flavor'], extra: Partial<MagazineSlot> = {}): MagazineSlot => ({
  flavor,
  charged: false,
  gold: false,
  ...extra,
});

describe('eligibleForm 變身資格（§57）', () => {
  it('同系 ×3 對應三形態：zappy→volt、floaty→gale、shelly→shell', () => {
    expect(eligibleForm([slot('zappy'), slot('zappy'), slot('zappy')])).toBe('volt');
    expect(eligibleForm([slot('floaty'), slot('floaty'), slot('floaty')])).toBe('gale');
    expect(eligibleForm([slot('shelly'), slot('shelly'), slot('shelly')])).toBe('shell');
  });

  it('非變身味同系 ×3（jelly）不觸發——jelly 線收斂至滿匣結晶（§109）', () => {
    expect(eligibleForm([slot('jelly'), slot('jelly'), slot('jelly')])).toBeNull();
  });

  it('未滿三發或混味不觸發', () => {
    expect(eligibleForm([slot('zappy'), slot('zappy')])).toBeNull();
    expect(eligibleForm([slot('zappy'), slot('zappy'), slot('floaty')])).toBeNull();
  });

  it('金星與混合槽破壞同系資格；強化槽同味計入', () => {
    expect(eligibleForm([slot('zappy'), slot('zappy'), slot('jelly', { gold: true })])).toBeNull();
    expect(
      eligibleForm([slot('floaty'), slot('floaty'), slot('floaty', { mix: 'swiftlight' })]),
    ).toBeNull();
    expect(eligibleForm([slot('shelly'), slot('shelly', { charged: true }), slot('shelly')])).toBe(
      'shell',
    );
  });

  it('強化槽計 2 發：連吞三隻同系（[強化,單發]）即達標；單一強化槽（2 發）未達', () => {
    expect(eligibleForm([slot('zappy', { charged: true }), slot('zappy')])).toBe('volt');
    expect(eligibleForm([slot('zappy', { charged: true })])).toBeNull();
  });
});

// 長按裁決（resolveTransformHold）已退場（§109）：變身觸發改 SP 鍵即時裁決，
// 對應測試移至 logic/starburst.test.ts 的 resolveSpPress（地面/資格/變身中解除語意不變）。

describe('tickTransform 持續與到期（§57）', () => {
  it('start 後計時 10s；tick 遞減、到期自動解除並回報 expired', () => {
    let state = startTransform('volt');
    expect(state.remainingMs).toBe(TRANSFORM.durationMs);
    const mid = tickTransform(state, 4000);
    expect(mid.expired).toBe(false);
    expect(mid.state.remainingMs).toBe(6000);
    state = mid.state;
    const end = tickTransform(state, 6000);
    expect(end.expired).toBe(true);
    expect(end.state.form).toBeNull();
  });

  it('未變身時 tick 為 no-op；endTransform 清空形態', () => {
    const idle = createTransformState();
    expect(tickTransform(idle, 500)).toEqual({ state: idle, expired: false });
    expect(endTransform().form).toBeNull();
  });

  it('transformProgress 由 1 遞減至 0（HUD 倒數環）', () => {
    const state = startTransform('gale');
    expect(transformProgress(state)).toBe(1);
    expect(transformProgress(tickTransform(state, 5000).state)).toBeCloseTo(0.5, 5);
    expect(transformProgress(createTransformState())).toBe(0);
  });
});

describe('形態規格表（§57/§110）：每形態 攻/防/機動 三語彙', () => {
  it('雷化：移速 +15%、帶電接觸、鏈電束、放電反擊 ×2、磁力域免疫', () => {
    const spec = TRANSFORM_FORMS.volt;
    expect(spec.moveSpeedMul).toBeCloseTo(1.15, 5);
    expect(spec.contactDamage).toBeGreaterThan(0);
    expect(spec.beam).toBe(true);
    expect(spec.dischargeCharges).toBe(2);
    expect(spec.magnetImmune).toBe(true);
  });

  it('風化：近自由飛行、穿透風刃、落地衝擊、落地滾翻 0.3s、滑翔', () => {
    const spec = TRANSFORM_FORMS.gale;
    expect(spec.freeFlight).toBe(true);
    expect(spec.windBlade).toBe(true);
    expect(spec.landingImpact).toBe(true);
    expect(spec.landingRollMs).toBe(300);
    expect(spec.glide).toBe(true);
  });

  it('殼化：受傷減半、反彈彈幕、下砸範圍加倍、移速 -20%、滾殼衝撞、受身入殼 ×1', () => {
    const spec = TRANSFORM_FORMS.shell;
    expect(spec.halveDamage).toBe(true);
    expect(spec.reflectProjectiles).toBe(true);
    expect(spec.slamRadiusMul).toBe(2);
    expect(spec.moveSpeedMul).toBeCloseTo(0.8, 5);
    expect(spec.chargeDash).toBe(true);
    expect(spec.tuckCharges).toBe(1);
  });

  it('語彙膨脹守門（§110）：防禦/機動新語彙不跨形態外溢', () => {
    expect(TRANSFORM_FORMS.gale.dischargeCharges).toBe(0);
    expect(TRANSFORM_FORMS.shell.dischargeCharges).toBe(0);
    expect(TRANSFORM_FORMS.volt.landingRollMs).toBe(0);
    expect(TRANSFORM_FORMS.shell.glide).toBe(false);
    expect(TRANSFORM_FORMS.volt.tuckCharges).toBe(0);
    expect(TRANSFORM_FORMS.gale.chargeDash).toBe(false);
  });
});

describe('consumeDischarge 雷化放電反擊（§110）', () => {
  it('雷化期內可觸發 2 次，耗盡後不再觸發；到期解除歸零', () => {
    let state = startTransform('volt');
    expect(state.dischargeLeft).toBe(2);
    const first = consumeDischarge(state);
    expect(first.triggered).toBe(true);
    const second = consumeDischarge(first.state);
    expect(second.triggered).toBe(true);
    const third = consumeDischarge(second.state);
    expect(third.triggered).toBe(false);
    expect(third.state.dischargeLeft).toBe(0);
    state = tickTransform(second.state, TRANSFORM.durationMs).state;
    expect(state.dischargeLeft).toBe(0);
  });

  it('非雷化形態不觸發；tick 途中計數保留', () => {
    expect(consumeDischarge(startTransform('shell')).triggered).toBe(false);
    const mid = tickTransform(startTransform('volt'), 4000).state;
    expect(mid.dischargeLeft).toBe(2);
    expect(VOLT_DISCHARGE.radiusPx).toBe(120);
    expect(VOLT_DISCHARGE.damage).toBe(1);
  });
});

describe('consumeTuck 殼化受身入殼（§110）', () => {
  it('殼化期內全免 1 次即耗盡；免傷窗 0.5s', () => {
    const state = startTransform('shell');
    expect(state.tuckLeft).toBe(1);
    const first = consumeTuck(state);
    expect(first.triggered).toBe(true);
    expect(consumeTuck(first.state).triggered).toBe(false);
    expect(SHELL_TUCK.invulnMs).toBe(500);
  });

  it('非殼化形態不觸發', () => {
    expect(consumeTuck(startTransform('volt')).triggered).toBe(false);
    expect(consumeTuck(createTransformState()).triggered).toBe(false);
  });
});

describe('glideFallVy 風化滑翔緩降（§110）', () => {
  it('下落超過帽值收斂至帽值；上升與緩降中不干預', () => {
    expect(glideFallVy(400)).toBe(GALE_GLIDE.fallCapVy);
    expect(glideFallVy(GALE_GLIDE.fallCapVy)).toBe(GALE_GLIDE.fallCapVy);
    expect(glideFallVy(-200)).toBe(-200);
    expect(GALE_GLIDE.driftMul).toBeCloseTo(1.6, 5);
  });
});

describe('SHELL_CHARGE 滾殼衝撞常數（§110）', () => {
  it('衝撞速度/時長/CD/低弧跳（衝撞躍）值域鎖定', () => {
    expect(SHELL_CHARGE.speed).toBeGreaterThan(0);
    expect(SHELL_CHARGE.durationMs).toBe(700);
    expect(SHELL_CHARGE.cooldownMs).toBeGreaterThanOrEqual(SHELL_CHARGE.durationMs);
    expect(SHELL_CHARGE.hopVy).toBeLessThan(0);
    expect(SHELL_CHARGE.damage).toBeGreaterThan(0);
  });
});

describe('absorbHalvedDamage 殼化減傷池（§57）', () => {
  it('兩次 1 傷合計實扣 1（0.5 池累積）', () => {
    const first = absorbHalvedDamage(0, 1);
    expect(first.damage).toBe(0);
    expect(first.pool).toBeCloseTo(0.5, 5);
    const second = absorbHalvedDamage(first.pool, 1);
    expect(second.damage).toBe(1);
    expect(second.pool).toBeCloseTo(0, 5);
  });

  it('偶數傷害直接減半', () => {
    expect(absorbHalvedDamage(0, 2)).toEqual({ pool: 0, damage: 1 });
  });
});
