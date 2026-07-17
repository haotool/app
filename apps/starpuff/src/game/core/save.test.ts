import { describe, expect, it } from 'vitest';
import {
  SAVE_SCHEMA_VERSION,
  createDefaultSave,
  currentChallenge,
  isLevelUnlocked,
  nodeStatus,
  parseSave,
  recordLevelClear,
  recordEgg,
  eggsFoundCount,
} from './save';

const clearedSave = (raw: object) => JSON.stringify({ schemaVersion: SAVE_SCHEMA_VERSION, ...raw });

describe('parseSave（§38 容錯）', () => {
  it('null、空字串、損毀 JSON 一律回退預設', () => {
    expect(parseSave(null)).toEqual(createDefaultSave());
    expect(parseSave('')).toEqual(createDefaultSave());
    expect(parseSave('{oops')).toEqual(createDefaultSave());
    expect(parseSave('[]')).toEqual(createDefaultSave());
  });

  it('schema 版本不符回退預設', () => {
    expect(parseSave(JSON.stringify({ schemaVersion: 99, levels: {} }))).toEqual(
      createDefaultSave(),
    );
  });

  it('合法存檔逐關收斂，非法條目剔除', () => {
    const save = parseSave(
      clearedSave({
        levels: {
          1: { cleared: true, bestTimeMs: 42000, eggsFound: ['reach-x'] },
          2: { cleared: 'yes', bestTimeMs: 1, eggsFound: [] },
          9: { cleared: true, bestTimeMs: 1, eggsFound: [] },
        },
        lastPlayedAt: 123,
      }),
    );
    expect(save.levels[1]).toEqual({ cleared: true, bestTimeMs: 42000, eggsFound: ['reach-x'] });
    expect(save.levels[2]).toBeUndefined();
    expect(save.lastPlayedAt).toBe(123);
  });

  it('highestClearedLevel 由條目重新推導，不信任持久化值', () => {
    const save = parseSave(
      clearedSave({
        highestClearedLevel: 4,
        levels: { 1: { cleared: true, bestTimeMs: 1000, eggsFound: [] } },
      }),
    );
    expect(save.highestClearedLevel).toBe(1);
  });

  it('eggsFound 去重、bestTimeMs 負值夾為 0', () => {
    const save = parseSave(
      clearedSave({
        levels: { 1: { cleared: true, bestTimeMs: -5, eggsFound: ['a', 'a', 'b'] } },
      }),
    );
    expect(save.levels[1]?.eggsFound).toEqual(['a', 'b']);
    expect(save.levels[1]?.bestTimeMs).toBe(0);
  });
});

describe('recordLevelClear（§38 寫入時機）', () => {
  it('首次通關寫入 bestTime 並推進 highestClearedLevel', () => {
    const save = recordLevelClear(createDefaultSave(), 1, 30000);
    expect(save.levels[1]?.cleared).toBe(true);
    expect(save.levels[1]?.bestTimeMs).toBe(30000);
    expect(save.highestClearedLevel).toBe(1);
    expect(save.lastPlayedAt).toBeGreaterThan(0);
  });

  it('重玩僅在更快時刷新 bestTime', () => {
    let save = recordLevelClear(createDefaultSave(), 1, 30000);
    save = recordLevelClear(save, 1, 45000);
    expect(save.levels[1]?.bestTimeMs).toBe(30000);
    save = recordLevelClear(save, 1, 20000);
    expect(save.levels[1]?.bestTimeMs).toBe(20000);
  });

  it('非連續通關（測試鉤子跳關）：解鎖僅看前一關通關態', () => {
    const save = recordLevelClear(createDefaultSave(), 3, 30000);
    expect(save.highestClearedLevel).toBe(3);
    expect(isLevelUnlocked(save, 4)).toBe(true);
    expect(isLevelUnlocked(save, 2)).toBe(false);
  });
});

describe('recordEgg（§38 彩蛋持久化）', () => {
  it('同 id 去重、不影響通關態', () => {
    let save = recordEgg(createDefaultSave(), 1, 'reach-x');
    save = recordEgg(save, 1, 'reach-x');
    expect(save.levels[1]?.eggsFound).toEqual(['reach-x']);
    expect(save.levels[1]?.cleared).toBe(false);
    expect(eggsFoundCount(save, 1)).toBe(1);
    expect(eggsFoundCount(save, 2)).toBe(0);
  });
});

describe('解鎖規則與節點狀態（§39）', () => {
  it('第 1 關恆開；第 N 關需第 N-1 關通關', () => {
    const fresh = createDefaultSave();
    expect(isLevelUnlocked(fresh, 1)).toBe(true);
    expect(isLevelUnlocked(fresh, 2)).toBe(false);
    const cleared1 = recordLevelClear(createDefaultSave(), 1, 1000);
    expect(isLevelUnlocked(cleared1, 2)).toBe(true);
    expect(isLevelUnlocked(cleared1, 3)).toBe(false);
  });

  it('nodeStatus 三態：locked / open / cleared', () => {
    const save = recordLevelClear(createDefaultSave(), 1, 1000);
    expect(nodeStatus(save, 1)).toBe('cleared');
    expect(nodeStatus(save, 2)).toBe('open');
    expect(nodeStatus(save, 3)).toBe('locked');
    expect(nodeStatus(save, 4)).toBe('locked');
  });

  it('currentChallenge 為最小已解鎖未通關關卡；全通關為 null', () => {
    expect(currentChallenge(createDefaultSave())).toBe(1);
    let save = recordLevelClear(createDefaultSave(), 1, 1000);
    expect(currentChallenge(save)).toBe(2);
    save = recordLevelClear(save, 2, 1000);
    save = recordLevelClear(save, 3, 1000);
    save = recordLevelClear(save, 4, 1000);
    expect(currentChallenge(save)).toBe(5);
    save = recordLevelClear(save, 5, 1000);
    save = recordLevelClear(save, 6, 1000);
    save = recordLevelClear(save, 7, 1000);
    expect(currentChallenge(save)).toBeNull();
  });

  it('v8 存檔相容（§50）：舊 v1 存檔（1-4 通關）載入後 L5 開放、L6/L7 鎖定且不損資料', () => {
    const legacy = JSON.stringify({
      schemaVersion: 1,
      highestClearedLevel: 4,
      levels: {
        1: { cleared: true, bestTimeMs: 41000, eggsFound: ['reach-x'] },
        2: { cleared: true, bestTimeMs: 52000, eggsFound: [] },
        3: { cleared: true, bestTimeMs: 63000, eggsFound: [] },
        4: { cleared: true, bestTimeMs: 74000, eggsFound: [] },
      },
      lastPlayedAt: 1700000000000,
    });
    const save = parseSave(legacy);
    expect(save.highestClearedLevel).toBe(4);
    expect(save.levels[1]?.bestTimeMs).toBe(41000);
    expect(nodeStatus(save, 4)).toBe('cleared');
    expect(nodeStatus(save, 5)).toBe('open');
    expect(nodeStatus(save, 6)).toBe('locked');
    expect(nodeStatus(save, 7)).toBe('locked');
    expect(currentChallenge(save)).toBe(5);
  });
});
