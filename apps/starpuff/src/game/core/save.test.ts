import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LevelId } from './types';
import {
  SAVE_BACKUP_KEY,
  SAVE_SCHEMA_VERSION,
  SAVE_STORAGE_KEY,
  createDefaultSave,
  currentChallenge,
  isLevelUnlocked,
  isSaveStorageAvailable,
  loadSave,
  nodeStatus,
  parseSave,
  persistSave,
  recordExClear,
  recordLevelClear,
  recordEgg,
  resetSave,
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

  it('v1 舊存檔遷移載入（§94）：關卡條目保留、achievements 補空集、版次升 2', () => {
    const save = parseSave(
      JSON.stringify({
        schemaVersion: 1,
        levels: { 1: { cleared: true, bestTimeMs: 42000, eggsFound: ['reach-x'] } },
        lastPlayedAt: 5,
      }),
    );
    expect(save.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(save.levels[1]?.cleared).toBe(true);
    expect(save.achievements).toEqual([]);
  });

  it('v2 achievements 欄位收斂：非字串剔除、去重、非陣列回空集', () => {
    const save = parseSave(
      clearedSave({
        levels: {},
        achievements: ['first-clear', 'first-clear', 7, null, 'egg-first'],
      }),
    );
    expect(save.achievements).toEqual(['first-clear', 'egg-first']);
    expect(parseSave(clearedSave({ levels: {}, achievements: 'oops' })).achievements).toEqual([]);
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
    expect(save.levels[1]).toEqual({
      cleared: true,
      bestTimeMs: 42000,
      eggsFound: ['reach-x'],
      exCleared: false,
    });
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
    expect(currentChallenge(save)).toBe(8);
    save = recordLevelClear(save, 8, 1000);
    save = recordLevelClear(save, 9, 1000);
    // v10 三區完結（§67/§68）：L9 之後接續 L10-L12。
    expect(currentChallenge(save)).toBe(10);
    save = recordLevelClear(save, 10, 1000);
    save = recordLevelClear(save, 11, 1000);
    expect(currentChallenge(save)).toBe(12);
    save = recordLevelClear(save, 12, 1000);
    // v11 四區完結（§76）：L12 之後接續 L13-L16。
    expect(currentChallenge(save)).toBe(13);
    save = recordLevelClear(save, 13, 1000);
    save = recordLevelClear(save, 14, 1000);
    save = recordLevelClear(save, 15, 1000);
    expect(currentChallenge(save)).toBe(16);
    save = recordLevelClear(save, 16, 1000);
    // v12 五區終章（§84）：L16 之後接續 L17-L20，全通關為 null。
    expect(currentChallenge(save)).toBe(17);
    save = recordLevelClear(save, 17, 1000);
    save = recordLevelClear(save, 18, 1000);
    save = recordLevelClear(save, 19, 1000);
    expect(currentChallenge(save)).toBe(20);
    save = recordLevelClear(save, 20, 1000);
    // §121/§122 星海終局篇：L20 之後接續 L21 → L22 → L23 → L24，全通關為 null。
    expect(currentChallenge(save)).toBe(21);
    save = recordLevelClear(save, 21, 1000);
    expect(currentChallenge(save)).toBe(22);
    save = recordLevelClear(save, 22, 1000);
    expect(currentChallenge(save)).toBe(23);
    save = recordLevelClear(save, 23, 1000);
    expect(currentChallenge(save)).toBe(24);
    save = recordLevelClear(save, 24, 1000);
    expect(currentChallenge(save)).toBeNull();
  });

  it('§121/§122 解鎖鏈在編序銜接：L22 需 L21 通關、L23 需 L22 通關（W2 補號自動收斂）', () => {
    let save = createDefaultSave();
    for (let id = 1; id <= 19; id += 1) save = recordLevelClear(save, id as LevelId, 1000);
    expect(isLevelUnlocked(save, 21)).toBe(false);
    save = recordLevelClear(save, 20, 1000);
    expect(isLevelUnlocked(save, 21)).toBe(true);
    expect(isLevelUnlocked(save, 22)).toBe(false);
    save = recordLevelClear(save, 21, 1000);
    expect(isLevelUnlocked(save, 22)).toBe(true);
    // W1 舊檔跳號通關（L21→L23 已通）情境：補號後 L23 解鎖依在編前一關 L22。
    expect(isLevelUnlocked(save, 23)).toBe(false);
    save = recordLevelClear(save, 22, 1000);
    expect(isLevelUnlocked(save, 23)).toBe(true);
    save = recordLevelClear(save, 23, 1000);
    expect(isLevelUnlocked(save, 24)).toBe(true);
  });

  it('§122 W1 舊檔相容：跳號通關（L21/L23 已通、無 L22）載入後 L22 為當前挑戰、L23 保持 cleared', () => {
    let save = createDefaultSave();
    for (let id = 1; id <= 21; id += 1) save = recordLevelClear(save, id as LevelId, 1000);
    save = recordLevelClear(save, 23, 1000);
    // 補號後：L22 開放（前一關 L21 已通）、L23 已通不倒退、L24 隨 L23 已通直接開放。
    expect(nodeStatus(save, 22)).toBe('open');
    expect(nodeStatus(save, 23)).toBe('cleared');
    expect(nodeStatus(save, 24)).toBe('open');
    expect(currentChallenge(save)).toBe(22);
  });

  it('v11 存檔相容（§76）：v10 存檔（1-12 通關）載入後 L13 開放、L14 鎖定', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      highestClearedLevel: 12,
      levels: Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [
          String(i + 1),
          { cleared: true, bestTimeMs: 60000, eggsFound: [] },
        ]),
      ),
      lastPlayedAt: 1,
    });
    const save = parseSave(raw);
    expect(save.highestClearedLevel).toBe(12);
    expect(nodeStatus(save, 13)).toBe('open');
    expect(nodeStatus(save, 14)).toBe('locked');
    expect(nodeStatus(save, 16)).toBe('locked');
    expect(currentChallenge(save)).toBe(13);
  });

  it('v10 存檔相容（§67）：v9 存檔（1-9 通關）載入後 L10 開放、L11 鎖定', () => {
    const entry = { cleared: true, bestTimeMs: 45000, eggsFound: [] };
    const save = parseSave(
      JSON.stringify({
        schemaVersion: 1,
        highestClearedLevel: 9,
        levels: {
          1: entry,
          2: entry,
          3: entry,
          4: entry,
          5: entry,
          6: entry,
          7: entry,
          8: entry,
          9: entry,
        },
        lastPlayedAt: 1700000000000,
      }),
    );
    expect(save.highestClearedLevel).toBe(9);
    expect(nodeStatus(save, 10)).toBe('open');
    expect(nodeStatus(save, 11)).toBe('locked');
    expect(currentChallenge(save)).toBe(10);
  });

  it('v9 存檔相容（§60）：v8 存檔（1-7 通關）載入後 L8 開放、L9 鎖定', () => {
    const entry = { cleared: true, bestTimeMs: 45000, eggsFound: [] };
    const save = parseSave(
      JSON.stringify({
        schemaVersion: 1,
        highestClearedLevel: 7,
        levels: { 1: entry, 2: entry, 3: entry, 4: entry, 5: entry, 6: entry, 7: entry },
        lastPlayedAt: 1700000000000,
      }),
    );
    expect(save.highestClearedLevel).toBe(7);
    expect(nodeStatus(save, 8)).toBe('open');
    expect(nodeStatus(save, 9)).toBe('locked');
    expect(currentChallenge(save)).toBe(8);
    expect(save.levels[7]?.exCleared).toBe(false);
  });

  it('v9 exCleared（§58）：additive 欄位——舊檔缺省 false、僅信任明確 true、記錄不動一般通關', () => {
    // 舊存檔缺 exCleared：載入回落 false，不 crash。
    const legacy = parseSave(
      clearedSave({ levels: { 4: { cleared: true, bestTimeMs: 74000, eggsFound: [] } } }),
    );
    expect(legacy.levels[4]?.exCleared).toBe(false);
    // 損毀值（非 true）一律回落 false；明確 true 保留。
    const dirty = parseSave(
      clearedSave({
        levels: {
          4: { cleared: true, bestTimeMs: 1, eggsFound: [], exCleared: 'yes' },
          7: { cleared: true, bestTimeMs: 1, eggsFound: [], exCleared: true },
        },
      }),
    );
    expect(dirty.levels[4]?.exCleared).toBe(false);
    expect(dirty.levels[7]?.exCleared).toBe(true);
    // recordExClear 僅標記星章：cleared/bestTime 不動。
    let save = recordLevelClear(createDefaultSave(), 4, 30000);
    save = recordExClear(save, 4);
    expect(save.levels[4]?.exCleared).toBe(true);
    expect(save.levels[4]?.cleared).toBe(true);
    expect(save.levels[4]?.bestTimeMs).toBe(30000);
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

// 記憶體版 localStorage stub（vitest node 環境，沿 shellCards.test.ts stubGlobal 慣例）。
function stubStorage(): Map<string, string> {
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  });
  return map;
}

describe('存檔備援（v19 #819 卡 7：backup 輪替＋checksum＋恢復）', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('persistSave 寫入含 checksum；loadSave 讀回等值', () => {
    const map = stubStorage();
    const save = recordLevelClear(createDefaultSave(), 1, 30000);
    persistSave(save);
    const raw = map.get(SAVE_STORAGE_KEY);
    expect(raw).toBeDefined();
    expect(JSON.parse(raw ?? '{}')).toMatchObject({ checksum: expect.any(String) });
    const loaded = loadSave();
    expect(loaded.highestClearedLevel).toBe(1);
    expect(loaded.levels[1]).toEqual({
      cleared: true,
      bestTimeMs: 30000,
      eggsFound: [],
      exCleared: false,
    });
  });

  it('備援輪替：再次 persist 前先把上一份合法主檔轉入 sp-save-backup', () => {
    const map = stubStorage();
    const first = recordLevelClear(createDefaultSave(), 1, 30000);
    persistSave(first);
    const firstRaw = map.get(SAVE_STORAGE_KEY);
    const second = recordLevelClear(first, 2, 40000);
    persistSave(second);
    expect(map.get(SAVE_BACKUP_KEY)).toBe(firstRaw);
  });

  it('主檔 JSON 損毀：loadSave 從備援恢復（回寫主檔），不默默歸零', () => {
    const map = stubStorage();
    const first = recordLevelClear(createDefaultSave(), 1, 30000);
    persistSave(first);
    persistSave(recordLevelClear(first, 2, 40000));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    map.set(SAVE_STORAGE_KEY, '{oops');
    const restored = loadSave();
    expect(restored.levels[1]?.cleared).toBe(true);
    expect(warn).toHaveBeenCalled();
    // 主檔已被恢復回寫：再次載入不再走備援。
    expect(parseSave(map.get(SAVE_STORAGE_KEY) ?? null)).toEqual(restored);
    warn.mockRestore();
  });

  it('checksum 不符（欄位被篡改）視為損毀：走備援恢復', () => {
    const map = stubStorage();
    const first = recordLevelClear(createDefaultSave(), 1, 30000);
    persistSave(first);
    persistSave(recordLevelClear(first, 2, 40000));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const tampered = JSON.parse(map.get(SAVE_STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    tampered['highestClearedLevel'] = 20;
    (tampered['levels'] as Record<string, unknown>)['20'] = {
      cleared: true,
      bestTimeMs: 1,
      eggsFound: [],
    };
    map.set(SAVE_STORAGE_KEY, JSON.stringify(tampered));
    const restored = loadSave();
    expect(restored.levels[20]).toBeUndefined();
    expect(restored.levels[1]?.cleared).toBe(true);
    warn.mockRestore();
  });

  it('legacy 主檔（無 checksum 欄位）向後相容：直接接受不走備援', () => {
    const map = stubStorage();
    map.set(
      SAVE_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        levels: { 1: { cleared: true, bestTimeMs: 42000, eggsFound: [] } },
        lastPlayedAt: 5,
      }),
    );
    const save = loadSave();
    expect(save.levels[1]?.cleared).toBe(true);
    expect(save.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });

  it('主檔與備援皆損毀：回退預設（警示不拋錯）且重複載入節流不洗版', () => {
    const map = stubStorage();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    map.set(SAVE_STORAGE_KEY, '{oops');
    map.set(SAVE_BACKUP_KEY, '{also-broken');
    expect(loadSave()).toEqual(createDefaultSave());
    expect(warn).toHaveBeenCalledTimes(1);
    // 雙壞無自癒（不落盤預設）：後續 loadSave 熱呼叫不重複警示（審查 nit 節流）。
    expect(loadSave()).toEqual(createDefaultSave());
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('主檔損毀時 persistSave 不輪替：合法備援不被壞資料覆蓋（審查回歸鎖）', () => {
    const map = stubStorage();
    const first = recordLevelClear(createDefaultSave(), 1, 30000);
    persistSave(first);
    persistSave(recordLevelClear(first, 2, 40000));
    const backupRaw = map.get(SAVE_BACKUP_KEY);
    expect(backupRaw).toBeDefined();
    // 主檔被外力寫壞後再落盤：損毀內容不得進備援，備援維持上一份合法存檔。
    map.set(SAVE_STORAGE_KEY, '{corrupted');
    persistSave(recordLevelClear(first, 3, 50000));
    expect(map.get(SAVE_BACKUP_KEY)).toBe(backupRaw);
    // 新主檔本身正常落盤。
    expect(parseSave(map.get(SAVE_STORAGE_KEY) ?? null).levels[3]?.cleared).toBe(true);
  });

  it('備援自癒回寫失敗：備援逐字不變，storage 恢復後再載入等值且成功落盤（貫穿回歸鎖）', () => {
    const map = stubStorage();
    const first = recordLevelClear(createDefaultSave(), 1, 30000);
    persistSave(first);
    persistSave(recordLevelClear(first, 2, 40000));
    const backupRaw = map.get(SAVE_BACKUP_KEY);
    expect(backupRaw).toBeDefined();
    map.set(SAVE_STORAGE_KEY, '{corrupted');

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // 主檔損毀＋備援合法＋回寫全面失敗（配額耗盡）：恢復值仍須正確回傳，
    // 且不得動到備援——自癒失敗時備援是唯一存活副本。
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: () => {
        throw new DOMException('exceeded the quota', 'QuotaExceededError');
      },
      removeItem: (key: string) => void map.delete(key),
    });
    const restored = loadSave();
    // 備援存的是上一世代（僅第 1 關）：確認恢復來源確實是備援而非殘存主檔。
    expect(restored.levels[1]?.cleared).toBe(true);
    expect(restored.levels[2]).toBeUndefined();
    expect(map.get(SAVE_BACKUP_KEY)).toBe(backupRaw);
    expect(map.get(SAVE_STORAGE_KEY)).toBe('{corrupted');

    // 換回可寫入 storage：下次開機重走同一條恢復路徑，回傳值相同且這次真正落盤。
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => void map.set(key, value),
      removeItem: (key: string) => void map.delete(key),
    });
    expect(loadSave()).toEqual(restored);
    expect(parseSave(map.get(SAVE_STORAGE_KEY) ?? null)).toEqual(restored);
    expect(map.get(SAVE_BACKUP_KEY)).toBe(backupRaw);
    warn.mockRestore();
  });

  it('備援輪替配額失敗：主檔仍寫入（審查回歸鎖）', () => {
    const map = stubStorage();
    const first = recordLevelClear(createDefaultSave(), 1, 30000);
    persistSave(first);
    // 僅備援鍵寫入拋 QuotaExceededError：主檔覆寫路徑不得被連帶略過。
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (key === SAVE_BACKUP_KEY) throw new Error('QuotaExceededError');
        map.set(key, value);
      },
      removeItem: (key: string) => void map.delete(key),
    });
    persistSave(recordLevelClear(first, 2, 40000));
    expect(parseSave(map.get(SAVE_STORAGE_KEY) ?? null).levels[2]?.cleared).toBe(true);
  });

  it('checksum 屬性存在但非字串：判損毀走備援恢復', () => {
    const map = stubStorage();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const first = recordLevelClear(createDefaultSave(), 1, 30000);
    persistSave(first);
    persistSave(recordLevelClear(first, 2, 40000));
    const legit = map.get(SAVE_BACKUP_KEY);
    // 手改 checksum 為 null 不得繞過校驗。
    const tampered = JSON.parse(map.get(SAVE_STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    tampered['checksum'] = null;
    tampered['highestClearedLevel'] = 20;
    map.set(SAVE_STORAGE_KEY, JSON.stringify(tampered));
    expect(loadSave()).toEqual(parseSave(legit ?? null));
    warn.mockRestore();
  });

  it('resetSave 同時清除主檔與備援（避免恢復出已重置的舊進度）', () => {
    const map = stubStorage();
    const first = recordLevelClear(createDefaultSave(), 1, 30000);
    persistSave(first);
    persistSave(recordLevelClear(first, 2, 40000));
    resetSave();
    expect(map.has(SAVE_STORAGE_KEY)).toBe(false);
    expect(map.has(SAVE_BACKUP_KEY)).toBe(false);
  });

  it('localStorage 不可用：isSaveStorageAvailable false、loadSave 回預設不拋錯', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    });
    expect(isSaveStorageAvailable()).toBe(false);
    expect(loadSave()).toEqual(createDefaultSave());
  });

  it('localStorage 可用：isSaveStorageAvailable true 且探測鍵不殘留', () => {
    const map = stubStorage();
    expect(isSaveStorageAvailable()).toBe(true);
    expect([...map.keys()]).toEqual([]);
  });
});

// 配額邊界回歸鎖（#868）：同源空間僅剩少量時，1 字元 probe 會通過但體積大得多的
// sp-save 主檔寫入仍拋 QuotaExceededError；持久化必須回報失敗供呼叫端提示。
function stubQuotaLimitedStorage(maxValueLength: number): Map<string, string> {
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (value.length > maxValueLength) {
        throw new DOMException('exceeded the quota', 'QuotaExceededError');
      }
      map.set(key, value);
    },
    removeItem: (key: string) => void map.delete(key),
  });
  return map;
}

describe('存檔寫入失敗外顯（#868）', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('主檔寫入成功時 persistSave 回傳 true', () => {
    stubStorage();
    expect(persistSave(recordLevelClear(createDefaultSave(), 1, 30000))).toBe(true);
  });

  it('主檔寫入拋 QuotaExceededError 時 persistSave 回傳 false，不再靜默吞掉', () => {
    const map = stubQuotaLimitedStorage(8);
    expect(persistSave(recordLevelClear(createDefaultSave(), 1, 30000))).toBe(false);
    expect(map.has(SAVE_STORAGE_KEY)).toBe(false);
  });

  it('備援輪替失敗不影響回傳值：主檔寫得進去即為 true', () => {
    const map = stubStorage();
    persistSave(recordLevelClear(createDefaultSave(), 1, 30000));
    const previous = map.get(SAVE_STORAGE_KEY) ?? '';
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (key === SAVE_BACKUP_KEY) {
          throw new DOMException('exceeded the quota', 'QuotaExceededError');
        }
        map.set(key, value);
      },
      removeItem: (key: string) => void map.delete(key),
    });
    expect(persistSave(recordLevelClear(createDefaultSave(), 2, 20000))).toBe(true);
    expect(map.get(SAVE_BACKUP_KEY)).toBeUndefined();
    expect(map.get(SAVE_STORAGE_KEY)).not.toBe(previous);
  });

  it('配額僅容得下 1 字元時，探測負載對齊主檔體積後回報不可用', () => {
    const map = stubStorage();
    persistSave(recordLevelClear(createDefaultSave(), 1, 30000));
    const saved = map.get(SAVE_STORAGE_KEY) ?? '';
    expect(saved.length).toBeGreaterThan(1);

    // 舊版 1 字元 probe 在此情境會誤判可寫；探測負載須對齊實際主檔體積。
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (value.length > 1) throw new DOMException('exceeded the quota', 'QuotaExceededError');
        map.set(key, value);
      },
      removeItem: (key: string) => void map.delete(key),
    });
    expect(isSaveStorageAvailable()).toBe(false);
  });

  it('尚無存檔時探測下限為預設存檔落盤體積：容不下即回報不可用', () => {
    stubQuotaLimitedStorage(1);
    expect(isSaveStorageAvailable()).toBe(false);
  });

  it('尚無存檔但配額容得下預設存檔體積時回報可用，不誤報', () => {
    // 4096 遠大於預設存檔序列化長度（約百餘字元），代表空間充裕的一般情境。
    stubQuotaLimitedStorage(4096);
    expect(isSaveStorageAvailable()).toBe(true);
  });
});
