import { describe, expect, it } from 'vitest';
import { CHARGED_STAR, GOLD_STAR, STARSTORM, type MagazineSlot } from '../core/config';
import {
  advanceStarstormHold,
  fillMagazine,
  popTopSlot,
  pushGoldStar,
  resolveActionPress,
  shouldFireOnRelease,
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
