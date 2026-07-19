import { describe, expect, it } from 'vitest';
import {
  createDefaultSave,
  parseSave,
  recordEgg,
  recordExClear,
  recordLevelClear,
} from '../core/save';
import type { SaveData } from '../core/save';
import type { LevelId } from '../core/types';
import {
  ACHIEVEMENTS,
  awardAchievements,
  getAchievement,
  unlockedAchievements,
} from './achievements';
import { BOSS_LEVEL_IDS, LEVELS } from './levels';

const ALL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;

function saveWithClears(ids: readonly number[], timeMs = 45000): SaveData {
  const save = createDefaultSave();
  for (const id of ids) recordLevelClear(save, id as LevelId, timeMs);
  return save;
}

function saveWithAllEggs(): SaveData {
  const save = saveWithClears(ALL_IDS);
  for (const level of LEVELS) {
    for (const egg of level.easterEggs) recordEgg(save, level.id, egg.trigger);
  }
  return save;
}

describe('成就資料表（§94 SSOT 不變式）', () => {
  it('id 唯一、數量 21、名稱描述非空', () => {
    expect(ACHIEVEMENTS).toHaveLength(21);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const spec of ACHIEVEMENTS) {
      expect(spec.nameZh.length).toBeGreaterThan(0);
      expect(spec.descZh.length).toBeGreaterThan(0);
    }
  });

  it('boss 類成就覆蓋 BOSS_LEVEL_IDS 全魔王首勝與 EX（派生守門，禁第二份清單漂移）', () => {
    // 每王首勝與 EX 各一條：boss 關 id 純序滿編對照。
    const bossIds = ACHIEVEMENTS.filter((a) => a.id.startsWith('boss-'));
    const exIds = ACHIEVEMENTS.filter((a) => a.id.startsWith('ex-') && a.id !== 'ex-conquest');
    expect(bossIds).toHaveLength(BOSS_LEVEL_IDS.length);
    expect(exIds).toHaveLength(BOSS_LEVEL_IDS.length);
    for (const levelId of BOSS_LEVEL_IDS) {
      const firstWin = saveWithClears([levelId]);
      expect(bossIds.some((a) => a.unlocked(firstWin))).toBe(true);
      const exWin = recordExClear(createDefaultSave(), levelId);
      expect(exIds.some((a) => a.unlocked(exWin))).toBe(true);
    }
  });

  it('getAchievement 依 id 取條目，未知 id 回 null', () => {
    expect(getAchievement('first-clear')?.nameZh.length).toBeGreaterThan(0);
    expect(getAchievement('nope')).toBeNull();
  });
});

describe('進度類判定', () => {
  it('first-clear：L1 通關前後', () => {
    expect(unlockedAchievements(createDefaultSave()).has('first-clear')).toBe(false);
    expect(unlockedAchievements(saveWithClears([1])).has('first-clear')).toBe(true);
  });

  it('all-clear：19/20 不成立、20/20 成立', () => {
    expect(unlockedAchievements(saveWithClears(ALL_IDS.slice(0, 19))).has('all-clear')).toBe(false);
    expect(unlockedAchievements(saveWithClears(ALL_IDS)).has('all-clear')).toBe(true);
  });
});

describe('魔王類判定', () => {
  it('各王首勝逐一解鎖、EX 不影響首勝', () => {
    const save = saveWithClears([4]);
    const unlocked = unlockedAchievements(save);
    expect(unlocked.has('boss-jellord')).toBe(true);
    expect(unlocked.has('boss-noctra')).toBe(false);
    // EX 通關不寫 cleared：首勝不因 EX 成立。
    const exOnly = recordExClear(createDefaultSave(), 7);
    expect(unlockedAchievements(exOnly).has('boss-noctra')).toBe(false);
    expect(unlockedAchievements(exOnly).has('ex-noctra')).toBe(true);
  });

  it('ex-conquest：4/5 不成立、5/5 成立（§86 同源判定）', () => {
    const partial = createDefaultSave();
    for (const id of BOSS_LEVEL_IDS.slice(0, -1)) recordExClear(partial, id);
    expect(unlockedAchievements(partial).has('ex-conquest')).toBe(false);
    const full = createDefaultSave();
    for (const id of BOSS_LEVEL_IDS) recordExClear(full, id);
    expect(unlockedAchievements(full).has('ex-conquest')).toBe(true);
  });
});

describe('收集類判定', () => {
  it('egg-first / egg-10 邊界', () => {
    const save = createDefaultSave();
    expect(unlockedAchievements(save).has('egg-first')).toBe(false);
    recordEgg(save, 1, 'reach-x');
    expect(unlockedAchievements(save).has('egg-first')).toBe(true);
    expect(unlockedAchievements(save).has('egg-10')).toBe(false);
    // 每關一枚湊 9：跨關累計（同關去重由 recordEgg 保證）。
    for (const id of [2, 3, 4, 5, 6, 7, 8, 9] as const) recordEgg(save, id, `egg-${id}`);
    expect(unlockedAchievements(save).has('egg-10')).toBe(false);
    recordEgg(save, 10, 'egg-10');
    expect(unlockedAchievements(save).has('egg-10')).toBe(true);
  });

  it('egg-all：總數由 LEVELS 派生，缺一不成立', () => {
    const save = saveWithAllEggs();
    expect(unlockedAchievements(save).has('egg-all')).toBe(true);
    const missing = saveWithAllEggs();
    const lastLevel = LEVELS[LEVELS.length - 1];
    if (!lastLevel) throw new Error('LEVELS 不可為空');
    missing.levels[lastLevel.id] = {
      cleared: true,
      bestTimeMs: 45000,
      eggsFound: [],
      exCleared: false,
    };
    expect(unlockedAchievements(missing).has('egg-all')).toBe(false);
  });
});

describe('技巧類判定（速通門檻）', () => {
  it('speed-boss-120：魔王關 120000 含端點成立、120001 不成立、走動關不計', () => {
    expect(unlockedAchievements(saveWithClears([4], 120000)).has('speed-boss-120')).toBe(true);
    expect(unlockedAchievements(saveWithClears([4], 120001)).has('speed-boss-120')).toBe(false);
    // 走動關（L1）不入速通判定。
    expect(unlockedAchievements(saveWithClears([1], 30000)).has('speed-boss-120')).toBe(false);
  });

  it('speed-boss-60：60000 邊界、bestTime=0（無紀錄）不計', () => {
    expect(unlockedAchievements(saveWithClears([12], 60000)).has('speed-boss-60')).toBe(true);
    expect(unlockedAchievements(saveWithClears([12], 60001)).has('speed-boss-60')).toBe(false);
    const zero = createDefaultSave();
    zero.levels[16] = { cleared: true, bestTimeMs: 0, eggsFound: [], exCleared: false };
    expect(unlockedAchievements(zero).has('speed-boss-60')).toBe(false);
  });
});

describe('隱藏類判定（魔王專屬彩蛋）', () => {
  it('egg-twin / egg-vent / egg-core 各依對應關卡彩蛋 id 鎖定', () => {
    const twin = recordEgg(createDefaultSave(), 12, 'twin-finish');
    expect(unlockedAchievements(twin).has('egg-twin')).toBe(true);
    expect(unlockedAchievements(twin).has('egg-vent')).toBe(false);
    const vent = recordEgg(createDefaultSave(), 16, 'vent-hit-count');
    expect(unlockedAchievements(vent).has('egg-vent')).toBe(true);
    const core = recordEgg(createDefaultSave(), 20, 'survive-collect');
    expect(unlockedAchievements(core).has('egg-core')).toBe(true);
    // 隱藏旗標：三條 secret 均為 hidden。
    for (const id of ['egg-twin', 'egg-vent', 'egg-core']) {
      expect(getAchievement(id)?.hidden).toBe(true);
    }
  });
});

describe('awardAchievements（補發與去重）', () => {
  it('首次頒發回傳新增 id 並寫入 save.achievements；重複呼叫回空', () => {
    const save = saveWithClears([1]);
    const newly = awardAchievements(save);
    expect(newly).toContain('first-clear');
    expect(save.achievements).toContain('first-clear');
    expect(awardAchievements(save)).toEqual([]);
  });

  it('進度推進後僅頒發增量', () => {
    const save = saveWithClears([1]);
    awardAchievements(save);
    recordLevelClear(save, 2, 45000);
    recordLevelClear(save, 3, 45000);
    recordLevelClear(save, 4, 45000);
    const newly = awardAchievements(save);
    expect(newly).toContain('boss-jellord');
    expect(newly).not.toContain('first-clear');
  });

  it('歷史滿進度存檔一次補發全部 21 條（舊玩家補發語意）', () => {
    const save = saveWithAllEggs();
    for (const id of BOSS_LEVEL_IDS) recordExClear(save, id);
    // 速通門檻：45000 ≤ 60000 → 兩條速通同時成立。
    const newly = awardAchievements(save);
    expect(newly).toHaveLength(ACHIEVEMENTS.length);
    expect(new Set(save.achievements).size).toBe(ACHIEVEMENTS.length);
  });

  it('已頒發但資料回退（重置後）不重複頒發也不移除', () => {
    const save = saveWithClears([1]);
    awardAchievements(save);
    // 模擬 stored 保留但條目消失（防禦性語意：頒發紀錄不可逆）。
    save.levels = {};
    expect(awardAchievements(save)).toEqual([]);
    expect(save.achievements).toContain('first-clear');
  });
});

// 歷代舊存檔（schemaVersion 1，v9–v14 世代形狀）：parseSave 遷移後開機補發必須
// 精確重建歷史成就——欄位缺省（無 achievements）與各代進度形狀逐代驗證。
describe('v9–v14 舊存檔載入補發', () => {
  function eraSave(
    clears: readonly { id: number; timeMs: number; eggs?: readonly string[] }[],
    exIds: readonly number[] = [],
  ): string {
    const levels: Record<string, object> = {};
    for (const entry of clears) {
      levels[String(entry.id)] = {
        cleared: true,
        bestTimeMs: entry.timeMs,
        eggsFound: entry.eggs ?? [],
        ...(exIds.includes(entry.id) ? { exCleared: true } : {}),
      };
    }
    return JSON.stringify({ schemaVersion: 1, levels, lastPlayedAt: 1, highestClearedLevel: 0 });
  }

  it('v9 世代（1–9 通關、L4/L7 EX、一顆彩蛋）補發進度/雙王/EX/彩蛋/速通', () => {
    const save = parseSave(
      eraSave(
        [
          { id: 1, timeMs: 130000, eggs: ['reach-x'] },
          ...[2, 3, 5, 6, 8, 9].map((id) => ({ id, timeMs: 130000 })),
          { id: 4, timeMs: 90000 },
          { id: 7, timeMs: 130000 },
        ],
        [4, 7],
      ),
    );
    const newly = awardAchievements(save);
    expect([...newly].sort()).toEqual(
      [
        'first-clear',
        'boss-jellord',
        'boss-noctra',
        'ex-jellord',
        'ex-noctra',
        'egg-first',
        'speed-boss-120',
      ].sort(),
    );
  });

  it('v10 世代（1–12 通關、無 EX、無彩蛋）僅補發進度與三王首勝', () => {
    const save = parseSave(
      eraSave(Array.from({ length: 12 }, (_, i) => ({ id: i + 1, timeMs: 130000 }))),
    );
    const newly = awardAchievements(save);
    expect([...newly].sort()).toEqual(
      ['first-clear', 'boss-jellord', 'boss-noctra', 'boss-prismix'].sort(),
    );
  });

  it('v12 世代（全 20 通關、L12 速通 55s、隱藏彩蛋 twin-finish）補發含隱藏與雙速通', () => {
    const save = parseSave(
      eraSave([
        ...Array.from({ length: 20 }, (_, i) => ({ id: i + 1, timeMs: 130000 })),
        { id: 12, timeMs: 55000, eggs: ['twin-finish'] },
      ]),
    );
    const newly = awardAchievements(save);
    expect(newly).toContain('all-clear');
    expect(newly).toContain('boss-voidra');
    expect(newly).toContain('speed-boss-120');
    expect(newly).toContain('speed-boss-60');
    expect(newly).toContain('egg-twin');
    expect(newly).toContain('egg-first');
    expect(newly).not.toContain('ex-conquest');
  });

  it('v13/v14 世代（全 20＋五王 EX＋全彩蛋）一次補發全部 21 條', () => {
    const save = parseSave(
      eraSave(
        LEVELS.map((level) => ({
          id: level.id,
          timeMs: 45000,
          eggs: level.easterEggs.map((egg) => egg.trigger),
        })),
        [...BOSS_LEVEL_IDS],
      ),
    );
    const newly = awardAchievements(save);
    expect(newly).toHaveLength(ACHIEVEMENTS.length);
  });
});
