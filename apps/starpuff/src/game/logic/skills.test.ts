import { describe, expect, it } from 'vitest';
import {
  CHARGED_STAR,
  GOLD_STAR,
  STARSTORM,
  STAR_MIXES,
  findMix,
  getMix,
  type MagazineSlot,
} from '../core/config';
import {
  SHELL_SHIELD,
  advanceShield,
  advanceStarstormHold,
  createShieldState,
  fillMagazine,
  isFrontalHit,
  isTopShelly,
  pickChainTargets,
  popTopSlot,
  pushGoldStar,
  resolveActionPress,
  resolveJumpPress,
  resolveShieldBlock,
  shieldEligible,
  shouldFireOnRelease,
  slotSpec,
  starDamage,
  starPitch,
  starstormProgress,
  starstormReady,
  swallowIntoMagazine,
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

  it('異種吞入且無配方疊新槽（後進先出）', () => {
    const result = swallowIntoMagazine([slot('jelly')], 'shelly');
    expect(result.magazine).toEqual([slot('jelly'), slot('shelly')]);
    expect(result.mixed).toBeNull();
  });

  it('滿匣改吞（無配方）覆蓋頂槽（§20 最後吞下者覆蓋）', () => {
    const full = [slot('jelly'), slot('floaty'), slot('puffy')];
    const result = swallowIntoMagazine(full, 'shelly');
    expect(result.magazine).toEqual([slot('jelly'), slot('floaty'), slot('shelly')]);
  });

  it('金星槽不參與連吞升級', () => {
    const result = swallowIntoMagazine([slot('jelly', false, true)], 'jelly');
    expect(result.magazine).toEqual([slot('jelly', false, true), slot('jelly')]);
    expect(result.charged).toBe(false);
  });
});

describe('雙味混合（§46）', () => {
  it('頂槽素槽異種且配方存在 → 合成混合星佔原槽（順序無關）', () => {
    const forward = swallowIntoMagazine([slot('jelly')], 'floaty');
    expect(forward.mixed).toBe('swiftlight');
    expect(forward.magazine).toEqual([
      { flavor: 'jelly', charged: false, gold: false, mix: 'swiftlight' },
    ]);
    const reversed = swallowIntoMagazine([slot('floaty')], 'jelly');
    expect(reversed.mixed).toBe('swiftlight');
  });

  it('滿匣頂槽配方成立時優先合成（不覆蓋）', () => {
    const full = [slot('shelly'), slot('floaty'), slot('puffy')];
    const result = swallowIntoMagazine(full, 'zappy');
    expect(result.mixed).toBe('thunderburst');
    expect(result.magazine).toHaveLength(3);
    expect(result.magazine[2]?.mix).toBe('thunderburst');
  });

  it('混合槽為終態：再吞任何怪推新槽，不再混不再強化', () => {
    const mixed = swallowIntoMagazine([slot('jelly')], 'floaty').magazine;
    const next = swallowIntoMagazine(mixed, 'zappy');
    expect(next.mixed).toBeNull();
    expect(next.magazine).toHaveLength(2);
    expect(next.magazine[1]).toEqual(slot('zappy'));
  });

  it('強化槽不參與混合（推新槽）', () => {
    const result = swallowIntoMagazine([slot('jelly', true)], 'floaty');
    expect(result.mixed).toBeNull();
    expect(result.magazine).toEqual([slot('jelly', true), slot('floaty')]);
  });

  it('九組配方齊備且成分皆為合法星味、無重複配對（§46 六式＋§53 三式）', () => {
    expect(STAR_MIXES).toHaveLength(9);
    const keys = new Set(
      STAR_MIXES.map((mix) => [...mix.pair].sort((a, b) => a.localeCompare(b)).join('+')),
    );
    expect(keys.size).toBe(9);
    for (const mix of STAR_MIXES) {
      expect(mix.pair[0]).not.toBe(mix.pair[1]);
      expect(findMix(mix.pair[0], mix.pair[1])?.id).toBe(mix.id);
      expect(findMix(mix.pair[1], mix.pair[0])?.id).toBe(mix.id);
    }
  });

  it('v8 新配方（§53）：毒爆雲緩速場、電鋸迴旋鏈電、迴風刃雙程穿透', () => {
    const sporeblast = swallowIntoMagazine([slot('spora')], 'puffy');
    expect(sporeblast.mixed).toBe('sporeblast');
    const voltsaw = swallowIntoMagazine([slot('boomy')], 'zappy');
    expect(voltsaw.mixed).toBe('voltsaw');
    const galewheel = swallowIntoMagazine([slot('floaty')], 'boomy');
    expect(galewheel.mixed).toBe('galewheel');
    expect(getMix('sporeblast').slowMs).toBeGreaterThan(0);
    expect(getMix('sporeblast').aoeRadiusPx).toBeGreaterThan(0);
    expect(getMix('voltsaw').boomerang).toBe(true);
    expect(getMix('voltsaw').chainCount).toBeGreaterThan(0);
    expect(getMix('galewheel').boomerang).toBe(true);
    expect(getMix('galewheel').pierceCount).toBe(2);
  });

  it('anti-softlock：基礎星彈（jelly 單味）不屬任何配方觸發條件的必要前提', () => {
    // 混合僅為加成：無配方對照仍可正常疊槽/覆蓋，主線清怪只需基礎星彈。
    expect(findMix('jelly', 'shelly')).toBeNull();
    const plain = swallowIntoMagazine([], 'jelly');
    expect(plain.magazine).toEqual([slot('jelly')]);
  });

  it('混合槽傷害與音高讀配方表（slotSpec 單一出口）', () => {
    const mixedSlot: MagazineSlot = {
      flavor: 'jelly',
      charged: false,
      gold: false,
      mix: 'bigblast',
    };
    expect(slotSpec(mixedSlot).damage).toBe(6);
    expect(starDamage(mixedSlot)).toBe(6);
    expect(starPitch(mixedSlot)).toBeCloseTo(0.7, 5);
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

describe('resolveActionPress（§23 B 鍵決策，v7 起與下衝擊解耦）', () => {
  it('有彈藥點按發射；滿匣延遲至放開結算（星暴或點按）', () => {
    expect(resolveActionPress({ ammo: 2 })).toBe('fire');
    expect(resolveActionPress({ ammo: 3 })).toBe('defer');
  });

  it('空彈匣按下無動作（保留吸入語意）', () => {
    expect(resolveActionPress({ ammo: 0 })).toBe('none');
  });

  it('放開短於吸入閾值視為點按發射', () => {
    expect(shouldFireOnRelease(100)).toBe(true);
    expect(shouldFireOnRelease(150)).toBe(false);
  });

  it('頂槽殼盾星按下走延遲（§40）：點按發射與長按舉盾於放開分化', () => {
    expect(resolveActionPress({ ammo: 1, topIsShelly: true })).toBe('defer');
    expect(resolveActionPress({ ammo: 1, topIsShelly: false })).toBe('fire');
  });
});

describe('resolveJumpPress（§44 跳躍鍵輸入矩陣）', () => {
  it('空中「下＋跳」且 CD 完 → 下衝擊；吞含狀態無關（矩陣不讀彈匣）', () => {
    expect(resolveJumpPress({ airborne: true, down: true, slamCooldownMs: 0 })).toBe('slam');
  });

  it('下衝擊 CD 中回落一般跳躍鏈（拍翅/buffer），不吞輸入', () => {
    expect(resolveJumpPress({ airborne: true, down: true, slamCooldownMs: 500 })).toBe('jump');
  });

  it('空中未壓下 → 一般跳躍鏈（拍翅）', () => {
    expect(resolveJumpPress({ airborne: true, down: false, slamCooldownMs: 0 })).toBe('jump');
  });

  it('地面「下＋跳」→ 一般跳躍（單向平台下穿由 stage 層 shouldDropThrough 覆蓋裁決）', () => {
    expect(resolveJumpPress({ airborne: false, down: true, slamCooldownMs: 0 })).toBe('jump');
    expect(resolveJumpPress({ airborne: false, down: false, slamCooldownMs: 0 })).toBe('jump');
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
