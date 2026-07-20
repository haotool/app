import { describe, expect, it } from 'vitest';
import { LEVELS } from './levels';
import { ZONES, levelsInZone, zoneOf } from './zones';

describe('五區分頁資料（§78，主計畫 §2.2）', () => {
  it('五區連續涵蓋 L1-L20：無縫隙、無重疊、區魔王收尾', () => {
    expect(ZONES).toHaveLength(5);
    let expectedFirst = 1;
    for (const zone of ZONES) {
      expect(zone.firstLevelId).toBe(expectedFirst);
      expect(zone.lastLevelId).toBeGreaterThanOrEqual(zone.firstLevelId);
      expectedFirst = zone.lastLevelId + 1;
    }
    expect(ZONES[ZONES.length - 1]?.lastLevelId).toBe(20);
  });

  it('zoneOf：每個 LEVELS 條目落於唯一分區；區間端點對表', () => {
    for (const level of LEVELS) {
      const zone = zoneOf(level.id);
      expect(level.id).toBeGreaterThanOrEqual(zone.firstLevelId);
      expect(level.id).toBeLessThanOrEqual(zone.lastLevelId);
    }
    expect(zoneOf(1).id).toBe(1);
    expect(zoneOf(4).id).toBe(1);
    expect(zoneOf(5).id).toBe(2);
    expect(zoneOf(12).id).toBe(3);
    expect(zoneOf(16).id).toBe(4);
  });

  it('levelsInZone：由 LEVELS 實際條目推導，每頁節點數 ≤5（分頁可讀性上限）', () => {
    const covered = ZONES.flatMap((zone) => levelsInZone(zone, LEVELS));
    expect(covered.map((l) => l.id)).toEqual(LEVELS.map((l) => l.id));
    for (const zone of ZONES) {
      expect(levelsInZone(zone, LEVELS).length).toBeLessThanOrEqual(5);
    }
  });

  it('分區魔王收尾（CV-2 資料面）：已在編的區末關必為魔王關', () => {
    for (const zone of ZONES) {
      const inZone = levelsInZone(zone, LEVELS);
      const last = inZone[inZone.length - 1];
      // 列車過渡期末區可能未滿編：僅當區末關已在編時檢查魔王收尾。
      if (last?.id === zone.lastLevelId) {
        expect(last.boss).not.toBeNull();
      }
    }
  });

  it('區名≠關名層級契約（§97 F-01 裁決）：區名不得與任何在編關名撞名', () => {
    // 區＝地域（果凍平原）、關＝景點（果凍草原）為刻意層級差；撞名會使
    // 地圖頁籤/標頭與節點語意崩塌，資料面守門防未來新關誤用區名。
    const levelNames = new Set(LEVELS.map((level) => level.nameZh));
    for (const zone of ZONES) {
      expect(levelNames.has(zone.nameZh)).toBe(false);
    }
  });
});
