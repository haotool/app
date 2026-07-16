import { describe, expect, it } from 'vitest';
import { AIR_DASH, CHARGED_STAR, GOLD_STAR, STARSTORM, type MagazineSlot } from '../core/config';
import {
  SHELL_SHIELD,
  advanceAirDash,
  advanceShield,
  advanceStarstormHold,
  airDashSpeed,
  createAirDashState,
  createShieldState,
  fillMagazine,
  isAirDashing,
  isFrontalHit,
  isTopShelly,
  pickChainTargets,
  popTopSlot,
  pushGoldStar,
  refundDashFlap,
  resolveActionPress,
  resolveShieldBlock,
  shieldEligible,
  shouldFireOnRelease,
  starDamage,
  starPitch,
  starstormProgress,
  starstormReady,
  swallowIntoMagazine,
  type AirDashState,
} from './skills';

const slot = (flavor: MagazineSlot['flavor'], charged = false, gold = false): MagazineSlot => ({
  flavor,
  charged,
  gold,
});

describe('swallowIntoMagazine（§23 槽位模型）', () => {
  it('空匣吞入建立標準槽', () => {
    const result = swallowIntoMagazine([], 'jelly');
    expect(result.magazine).toEqual([slot('jelly')]);
    expect(result.charged).toBe(false);
  });

  it('同種連吞 ×2 頂槽升級強化星', () => {
    const result = swallowIntoMagazine([slot('jelly')], 'jelly');
    expect(result.magazine).toEqual([slot('jelly', true)]);
    expect(result.charged).toBe(true);
  });

  it('已強化槽再吞同種：新開一槽不重複強化', () => {
    const result = swallowIntoMagazine([slot('jelly', true)], 'jelly');
    expect(result.magazine).toEqual([slot('jelly', true), slot('jelly')]);
    expect(result.charged).toBe(false);
  });

  it('異種吞入疊新槽（後進先出）', () => {
    const result = swallowIntoMagazine([slot('jelly')], 'floaty');
    expect(result.magazine).toEqual([slot('jelly'), slot('floaty')]);
  });

  it('滿匣改吞覆蓋頂槽（§20 最後吞下者覆蓋）', () => {
    const full = [slot('jelly'), slot('floaty'), slot('puffy')];
    const result = swallowIntoMagazine(full, 'jelly');
    expect(result.magazine).toEqual([slot('jelly'), slot('floaty'), slot('jelly')]);
  });

  it('金星槽不參與連吞升級', () => {
    const result = swallowIntoMagazine([slot('jelly', false, true)], 'jelly');
    expect(result.magazine).toEqual([slot('jelly', false, true), slot('jelly')]);
    expect(result.charged).toBe(false);
  });
});

describe('popTopSlot（後進先出發射）', () => {
  it('取出頂槽並保留其餘', () => {
    const { magazine, slot: top } = popTopSlot([slot('jelly'), slot('floaty')]);
    expect(top).toEqual(slot('floaty'));
    expect(magazine).toEqual([slot('jelly')]);
  });

  it('空匣回傳 null', () => {
    expect(popTopSlot([]).slot).toBeNull();
  });
});

describe('starDamage / starPitch（§23 強化規則）', () => {
  it('強化星傷害 ×1.6、pitch ×0.85', () => {
    expect(starDamage(slot('jelly', true))).toBe(5 * CHARGED_STAR.damageMultiplier);
    expect(starPitch(slot('jelly', true))).toBeCloseTo(1 * CHARGED_STAR.pitchMultiplier, 5);
  });

  it('標準星維持屬性表數值', () => {
    expect(starDamage(slot('floaty'))).toBe(5);
    expect(starPitch(slot('floaty'))).toBe(1.15);
  });

  it('金星彈固定 20 傷', () => {
    expect(starDamage(slot('jelly', false, true))).toBe(GOLD_STAR.damage);
  });
});

describe('星暴充能（§23 滿匣長按 0.8s）', () => {
  it('滿匣且按住才累積，中斷即歸零', () => {
    expect(advanceStarstormHold(0, 100, true, true)).toBe(100);
    expect(advanceStarstormHold(500, 100, true, true)).toBe(600);
    expect(advanceStarstormHold(500, 100, false, true)).toBe(0);
    expect(advanceStarstormHold(500, 100, true, false)).toBe(0);
  });

  it('達 0.8s 就緒；進度 0..1 封頂', () => {
    expect(starstormReady(STARSTORM.holdMs - 1)).toBe(false);
    expect(starstormReady(STARSTORM.holdMs)).toBe(true);
    expect(starstormProgress(400)).toBeCloseTo(0.5, 5);
    expect(starstormProgress(2000)).toBe(1);
  });
});

describe('resolveActionPress（§23 B 鍵決策）', () => {
  it('空中 down+B 且 CD 完 → 下衝擊', () => {
    expect(resolveActionPress({ airborne: true, down: true, slamCooldownMs: 0, ammo: 2 })).toBe(
      'slam',
    );
  });

  it('下衝擊 CD 中不誤射', () => {
    expect(resolveActionPress({ airborne: true, down: true, slamCooldownMs: 500, ammo: 2 })).toBe(
      'none',
    );
  });

  it('地面 down+B 不觸發下衝擊，照常發射', () => {
    expect(resolveActionPress({ airborne: false, down: true, slamCooldownMs: 0, ammo: 2 })).toBe(
      'fire',
    );
  });

  it('滿匣按下延遲至放開結算（星暴或點按）', () => {
    expect(resolveActionPress({ airborne: false, down: false, slamCooldownMs: 0, ammo: 3 })).toBe(
      'defer',
    );
  });

  it('空彈匣按下無動作（保留吸入語意）', () => {
    expect(resolveActionPress({ airborne: false, down: false, slamCooldownMs: 0, ammo: 0 })).toBe(
      'none',
    );
  });

  it('放開短於吸入閾值視為點按發射', () => {
    expect(shouldFireOnRelease(100)).toBe(true);
    expect(shouldFireOnRelease(150)).toBe(false);
  });

  it('頂槽殼盾星按下走延遲（§40）：點按發射與長按舉盾於放開分化', () => {
    expect(
      resolveActionPress({
        airborne: false,
        down: false,
        slamCooldownMs: 0,
        ammo: 1,
        topIsShelly: true,
      }),
    ).toBe('defer');
    expect(
      resolveActionPress({
        airborne: false,
        down: false,
        slamCooldownMs: 0,
        ammo: 1,
        topIsShelly: false,
      }),
    ).toBe('fire');
  });
});

describe('殼盾 FSM（§40）', () => {
  it('isTopShelly 僅頂槽殼盾星成立；金星不算', () => {
    expect(isTopShelly([slot('shelly')])).toBe(true);
    expect(isTopShelly([slot('shelly'), slot('jelly')])).toBe(false);
    expect(isTopShelly([slot('shelly', false, true)])).toBe(false);
    expect(isTopShelly([])).toBe(false);
  });

  it('長按且頂槽殼盾星才舉盾；條件消失即放下', () => {
    let state = advanceShield(createShieldState(), { deltaMs: 16, held: true, eligible: true });
    expect(state.raised).toBe(true);
    state = advanceShield(state, { deltaMs: 16, held: false, eligible: true });
    expect(state.raised).toBe(false);
    state = advanceShield(state, { deltaMs: 16, held: true, eligible: false });
    expect(state.raised).toBe(false);
  });

  it('格擋成功入 4s CD，CD 中不可再舉盾，期滿恢復', () => {
    let state = resolveShieldBlock();
    expect(state.raised).toBe(false);
    expect(state.cooldownMs).toBe(SHELL_SHIELD.cooldownMs);
    state = advanceShield(state, { deltaMs: 1000, held: true, eligible: true });
    expect(state.raised).toBe(false);
    state = advanceShield(state, { deltaMs: SHELL_SHIELD.cooldownMs, held: true, eligible: true });
    expect(state.raised).toBe(true);
  });

  it('殼盾情境（§40 輸入矩陣）：頂槽殼盾星且未滿匣成立；滿匣或頂槽非殼盾不成立', () => {
    expect(shieldEligible([slot('shelly')])).toBe(true);
    expect(shieldEligible([slot('jelly'), slot('shelly')])).toBe(true);
    expect(shieldEligible([slot('jelly')])).toBe(false);
    expect(shieldEligible([])).toBe(false);
    // 滿匣頂槽殼盾星：長按讓位星暴，不屬殼盾情境。
    expect(shieldEligible([slot('jelly'), slot('floaty'), slot('shelly')])).toBe(false);
  });

  it('殼盾情境長按不回落吸入：盾 CD 中 raised 恆 false，但情境仍成立（吸入抑制依情境判定）', () => {
    // 模擬 player.ts 長按達閾值後的吸入判定：inhaling = !raised && !shieldEligible。
    const magazine = [slot('shelly')];
    let state = resolveShieldBlock();
    state = advanceShield(state, { deltaMs: 16, held: true, eligible: shieldEligible(magazine) });
    expect(state.raised).toBe(false);
    const inhaling = !state.raised && !shieldEligible(magazine);
    expect(inhaling).toBe(false);
    // CD 期滿長按恢復舉盾（仍非吸入）。
    state = advanceShield(state, {
      deltaMs: SHELL_SHIELD.cooldownMs,
      held: true,
      eligible: shieldEligible(magazine),
    });
    expect(state.raised).toBe(true);
  });

  it('isFrontalHit 正面判定：面向側與同 x 為正面，背面不格擋', () => {
    expect(isFrontalHit(1, 100, 160)).toBe(true);
    expect(isFrontalHit(1, 100, 40)).toBe(false);
    expect(isFrontalHit(-1, 100, 40)).toBe(true);
    expect(isFrontalHit(-1, 100, 160)).toBe(false);
    expect(isFrontalHit(1, 100, 100)).toBe(true);
  });
});

describe('雷鏈目標選擇（§40）', () => {
  const at = (x: number, y: number) => ({ x, y });

  it('半徑內取最近 N 隻並由近至遠排序', () => {
    const targets = pickChainTargets(0, 0, [at(100, 0), at(50, 0), at(200, 0)], 2, 160);
    expect(targets).toEqual([at(50, 0), at(100, 0)]);
  });

  it('半徑外目標不入鏈；不足 N 隻取實際數', () => {
    expect(pickChainTargets(0, 0, [at(300, 0)], 2, 160)).toEqual([]);
    expect(pickChainTargets(0, 0, [at(40, 30)], 2, 160)).toEqual([at(40, 30)]);
  });

  it('count 0 或負值回空陣列', () => {
    expect(pickChainTargets(0, 0, [at(10, 0)], 0, 160)).toEqual([]);
    expect(pickChainTargets(0, 0, [at(10, 0)], -1, 160)).toEqual([]);
  });
});

describe('advanceAirDash（§30 空中疾衝）', () => {
  const tap = (state: AirDashState, deltaMs: number, airborne = true) =>
    advanceAirDash(state, { deltaMs, jumpPressed: true, airborne });
  const idle = (state: AirDashState, deltaMs: number, airborne = true) =>
    advanceAirDash(state, { deltaMs, jumpPressed: false, airborne });

  it('空中雙擊 350ms 窗內觸發疾衝並進入 2s CD', () => {
    let result = tap(createAirDashState(), 16);
    expect(result.trigger).toBe(false);
    result = idle(result.state, 200);
    result = tap(result.state, 16);
    expect(result.trigger).toBe(true);
    expect(isAirDashing(result.state)).toBe(true);
    expect(result.state.dashLeftMs).toBe(AIR_DASH.durationMs);
    expect(result.state.cooldownMs).toBe(AIR_DASH.cooldownMs);
  });

  it('超過雙擊窗不觸發，該按壓改記為新首擊', () => {
    let result = tap(createAirDashState(), 16);
    result = idle(result.state, 400);
    result = tap(result.state, 16);
    expect(result.trigger).toBe(false);
    result = tap(result.state, 100);
    expect(result.trigger).toBe(true);
  });

  it('落地重置雙擊窗；地面按壓不列入首擊', () => {
    let result = tap(createAirDashState(), 16);
    result = idle(result.state, 50, false);
    result = tap(result.state, 50);
    expect(result.trigger).toBe(false);
    const grounded = tap(createAirDashState(), 16, false);
    const airTap = tap(grounded.state, 100);
    expect(airTap.trigger).toBe(false);
  });

  it('CD 期間雙擊不觸發，CD 耗盡後可再衝', () => {
    let result = tap(createAirDashState(), 16);
    result = tap(result.state, 100);
    expect(result.trigger).toBe(true);
    result = idle(result.state, 500);
    result = tap(result.state, 16);
    result = tap(result.state, 100);
    expect(result.trigger).toBe(false);
    result = idle(result.state, AIR_DASH.cooldownMs);
    result = tap(result.state, 16);
    result = tap(result.state, 100);
    expect(result.trigger).toBe(true);
  });

  it('疾衝 0.18s 後結束；等效速度 1000px/s（180px/0.18s）', () => {
    let result = tap(createAirDashState(), 16);
    result = tap(result.state, 100);
    expect(isAirDashing(result.state)).toBe(true);
    result = idle(result.state, AIR_DASH.durationMs);
    expect(isAirDashing(result.state)).toBe(false);
    expect(airDashSpeed()).toBe(1000);
  });

  it('成功疾衝不減拍翅餘額：首拍消耗於觸發當幀退還（§30 手感）', () => {
    // 模擬雙擊全程：首拍走拍翅分支消耗 1 次，第二拍觸發疾衝後當幀退還。
    let flapsUsed = 0;
    let result = tap(createAirDashState(), 16);
    expect(result.trigger).toBe(false);
    flapsUsed += 1;
    result = tap(result.state, 100);
    expect(result.trigger).toBe(true);
    flapsUsed = refundDashFlap(flapsUsed, true);
    expect(flapsUsed).toBe(0);
  });

  it('首拍未耗拍翅（coyote 跳/buffer 記帳）不退還，退還下限為 0', () => {
    expect(refundDashFlap(2, false)).toBe(2);
    expect(refundDashFlap(0, false)).toBe(0);
    expect(refundDashFlap(0, true)).toBe(0);
  });
});

describe('彩蛋獎勵入匣（§24）', () => {
  it('金星彈置入頂槽；滿匣覆蓋頂槽', () => {
    expect(pushGoldStar([slot('jelly')])).toEqual([slot('jelly'), slot('jelly', false, true)]);
    const full = [slot('jelly'), slot('floaty'), slot('puffy')];
    expect(pushGoldStar(full)[2]).toEqual(slot('jelly', false, true));
    expect(pushGoldStar(full)).toHaveLength(3);
  });

  it('星星雨補滿空槽且不動既有槽', () => {
    const filled = fillMagazine([slot('puffy', true)]);
    expect(filled).toEqual([slot('puffy', true), slot('jelly'), slot('jelly')]);
    expect(fillMagazine(filled)).toHaveLength(3);
  });
});
