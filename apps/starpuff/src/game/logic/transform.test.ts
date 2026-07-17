import { describe, expect, it } from 'vitest';
import type { MagazineSlot } from '../core/config';
import {
  TRANSFORM,
  TRANSFORM_FORMS,
  absorbHalvedDamage,
  createTransformState,
  eligibleForm,
  endTransform,
  resolveTransformHold,
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

  it('非變身味同系滿匣（jelly ×3）不觸發——保留星暴語意', () => {
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
});

describe('resolveTransformHold 長按裁決（§57）', () => {
  it('地面長按 0.6s 且資格成立 → start；未達閾值 → none', () => {
    expect(
      resolveTransformHold({ holdMs: 600, active: false, eligible: true, airborne: false }),
    ).toBe('start');
    expect(
      resolveTransformHold({ holdMs: 599, active: false, eligible: true, airborne: false }),
    ).toBe('none');
  });

  it('空中不可觸發起手；變身中長按 → 提前解除', () => {
    expect(
      resolveTransformHold({ holdMs: 600, active: false, eligible: true, airborne: true }),
    ).toBe('none');
    expect(
      resolveTransformHold({ holdMs: 600, active: true, eligible: false, airborne: true }),
    ).toBe('dismiss');
  });

  it('無資格長按不觸發', () => {
    expect(
      resolveTransformHold({ holdMs: 800, active: false, eligible: false, airborne: false }),
    ).toBe('none');
  });
});

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

describe('形態規格表（§57）：每形態至少改變兩項', () => {
  it('雷化：移速 +15%、帶電接觸、鏈電束', () => {
    const spec = TRANSFORM_FORMS.volt;
    expect(spec.moveSpeedMul).toBeCloseTo(1.15, 5);
    expect(spec.contactDamage).toBeGreaterThan(0);
    expect(spec.beam).toBe(true);
  });

  it('風化：近自由飛行、穿透風刃、落地衝擊', () => {
    const spec = TRANSFORM_FORMS.gale;
    expect(spec.freeFlight).toBe(true);
    expect(spec.windBlade).toBe(true);
    expect(spec.landingImpact).toBe(true);
  });

  it('殼化：受傷減半、反彈彈幕、下砸範圍加倍、移速 -20%', () => {
    const spec = TRANSFORM_FORMS.shell;
    expect(spec.halveDamage).toBe(true);
    expect(spec.reflectProjectiles).toBe(true);
    expect(spec.slamRadiusMul).toBe(2);
    expect(spec.moveSpeedMul).toBeCloseTo(0.8, 5);
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
