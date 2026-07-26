import { describe, expect, it } from 'vitest';
import { ASSETS } from './assets';
import { ASSETS_V21_PART1 } from './assetsV21Part1';
import { ASSETS_V21_PART2 } from './assetsV21Part2';
import { ASSETS_V21_PART3 } from './assetsV21Part3';
import { entriesForLevel, levelAssetKeys, SHARED_LEVEL_KEYS } from './assetPlan';
import { LEVELS } from '../logic/levels';

// v21-v30 素材「暫時 lazy」契約守門（#857 審查 Blocking 1）：
// 未被任何 LevelSpec／TRANSFORM_FORMS 認領的新資產一律標 lazy，避免落入
// entriesForLevel 的未認領 fallback 被每關全載。W2/W3 接關後本檔測試會翻紅，
// 屆時依分檔行內註解把認領到的條目改回原 phase。
const V21_ENTRIES = [...ASSETS_V21_PART1, ...ASSETS_V21_PART2, ...ASSETS_V21_PART3];

describe('assetsV21 暫時 lazy 契約', () => {
  it('接關前全部 v21 條目維持 lazy；被派生認領的條目必須改回正確 phase', () => {
    const claimed = new Set<string>(SHARED_LEVEL_KEYS);
    for (const level of LEVELS) for (const key of levelAssetKeys(level)) claimed.add(key);

    const claimedButLazy = V21_ENTRIES.filter(
      (entry) => claimed.has(entry.key) && entry.phase === 'lazy',
    );
    // 一旦 LevelSpec／TRANSFORM_FORMS 認領了 v21 鍵，這裡會翻紅——把該條目的
    // phase 依行內註解改回 level/boss/form 即可通過。
    expect(claimedButLazy.map((entry) => entry.key)).toEqual([]);

    const unclaimedNotLazy = V21_ENTRIES.filter(
      (entry) => !claimed.has(entry.key) && entry.phase !== 'lazy',
    );
    expect(unclaimedNotLazy.map((entry) => entry.key)).toEqual([]);
  });

  it('現有各關的載入計畫不撿取任何 v21 lazy 條目', () => {
    const v21Keys = new Set(V21_ENTRIES.map((entry) => entry.key));
    for (const level of LEVELS) {
      const picked = entriesForLevel(level, LEVELS).filter((entry) => v21Keys.has(entry.key));
      expect(picked.map((entry) => entry.key)).toEqual([]);
    }
  });

  it('precache 排除樣式不誤殺非 lazy 資產（前綴碰撞守門）', () => {
    const lazyKeys = V21_ENTRIES.filter((entry) => entry.phase === 'lazy').map(
      (entry) => entry.key,
    );
    const activeKeys = ASSETS.map((entry) => entry.key);
    for (const active of activeKeys) {
      const collided = lazyKeys.filter((lazy) => `${active}-hash.webp`.startsWith(`${lazy}-`));
      expect(collided).toEqual([]);
    }
  });

  // bundle 預算守門（#857 複審應修 3）：v21 條目字面量不得進主 manifest——
  // 一旦整批 spread 回 ASSETS，442+ 筆 URL/key 會常駐主 bundle（實測 +67.88kB）
  // 且隨後續批次單向成長。接關時只允許把「已認領」條目逐筆搬回並標正確 phase。
  it('主 manifest 零 lazy 條目（bundle 預算守門）', () => {
    expect(ASSETS.filter((entry) => entry.phase === 'lazy').map((entry) => entry.key)).toEqual([]);
  });
});
