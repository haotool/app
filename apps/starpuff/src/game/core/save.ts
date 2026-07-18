import type { LevelId } from './types';

// 存檔 SSOT（GAME_DESIGN §38）：localStorage sp-save schema v1，純資料模組供 vitest 驗證。
// parse/fallback 模式沿用 core/layout.ts：版本不符、形狀損毀、隱私模式一律回退預設。

export interface LevelSaveEntry {
  cleared: boolean;
  bestTimeMs: number;
  eggsFound: string[];
  // v9 EX 變體通關（§58）：additive 欄位——舊存檔缺省視為 false，schema v1 不升版。
  exCleared?: boolean;
}

export interface SaveData {
  schemaVersion: number;
  highestClearedLevel: number;
  levels: Partial<Record<LevelId, LevelSaveEntry>>;
  lastPlayedAt: number;
}

export const SAVE_STORAGE_KEY = 'sp-save';
export const SAVE_SCHEMA_VERSION = 1;

export function createDefaultSave(): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    highestClearedLevel: 0,
    levels: {},
    lastPlayedAt: 0,
  };
}

// v10 三區完結（§66）：12 節點；schema v1 不變——舊存檔（≤9 關條目）原樣載入，
// 新節點依解鎖規則自然呈鎖定態。
const LEVEL_IDS: readonly LevelId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function isLevelEntry(value: unknown): value is LevelSaveEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry['cleared'] === 'boolean' &&
    typeof entry['bestTimeMs'] === 'number' &&
    Number.isFinite(entry['bestTimeMs']) &&
    Array.isArray(entry['eggsFound']) &&
    entry['eggsFound'].every((item) => typeof item === 'string')
  );
}

// 解析持久化 JSON：僅收斂合法關卡條目，highestClearedLevel 一律由條目重新推導。
export function parseSave(raw: string | null): SaveData {
  if (!raw) return createDefaultSave();
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data['schemaVersion'] !== SAVE_SCHEMA_VERSION) return createDefaultSave();
    const rawLevels =
      typeof data['levels'] === 'object' && data['levels'] !== null
        ? (data['levels'] as Record<string, unknown>)
        : {};
    const save = createDefaultSave();
    for (const id of LEVEL_IDS) {
      const entry = rawLevels[String(id)];
      if (!isLevelEntry(entry)) continue;
      save.levels[id] = {
        cleared: entry.cleared,
        bestTimeMs: Math.max(0, entry.bestTimeMs),
        eggsFound: [...new Set(entry.eggsFound)],
        // v9 additive 欄位（§58）：僅信任明確 true，舊存檔缺省回落 false。
        exCleared: (entry as { exCleared?: unknown }).exCleared === true,
      };
    }
    save.highestClearedLevel = deriveHighestCleared(save);
    save.lastPlayedAt =
      typeof data['lastPlayedAt'] === 'number' && Number.isFinite(data['lastPlayedAt'])
        ? data['lastPlayedAt']
        : 0;
    return save;
  } catch {
    return createDefaultSave();
  }
}

function deriveHighestCleared(save: SaveData): number {
  let highest = 0;
  for (const id of LEVEL_IDS) {
    if (save.levels[id]?.cleared) highest = Math.max(highest, id);
  }
  return highest;
}

// 隱私模式下 localStorage 可能拋錯：讀寫皆容錯，讀退預設、寫靜默略過。
export function loadSave(): SaveData {
  try {
    return parseSave(localStorage.getItem(SAVE_STORAGE_KEY));
  } catch {
    return createDefaultSave();
  }
}

export function persistSave(save: SaveData): void {
  try {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
  } catch {
    /* noop */
  }
}

function levelEntry(save: SaveData, levelId: LevelId): LevelSaveEntry {
  const existing = save.levels[levelId];
  if (existing) return existing;
  const entry: LevelSaveEntry = { cleared: false, bestTimeMs: 0, eggsFound: [] };
  save.levels[levelId] = entry;
  return entry;
}

// 通關記錄：bestTimeMs 取歷史最短（0 表示尚無紀錄）；回傳更新後存檔（就地更新同一物件）。
export function recordLevelClear(save: SaveData, levelId: LevelId, timeMs: number): SaveData {
  const entry = levelEntry(save, levelId);
  entry.cleared = true;
  entry.bestTimeMs = entry.bestTimeMs > 0 ? Math.min(entry.bestTimeMs, timeMs) : timeMs;
  save.highestClearedLevel = deriveHighestCleared(save);
  save.lastPlayedAt = Date.now();
  return save;
}

// EX 通關記錄（§58）：僅標記 exCleared；一般通關資料（cleared/bestTime）不動。
export function recordExClear(save: SaveData, levelId: LevelId): SaveData {
  const entry = levelEntry(save, levelId);
  entry.exCleared = true;
  save.lastPlayedAt = Date.now();
  return save;
}

// 彩蛋記錄：eggId 於該關去重；觸發即寫（跨局持久，隱藏內容不阻主線）。
export function recordEgg(save: SaveData, levelId: LevelId, eggId: string): SaveData {
  const entry = levelEntry(save, levelId);
  if (!entry.eggsFound.includes(eggId)) entry.eggsFound.push(eggId);
  save.lastPlayedAt = Date.now();
  return save;
}

export function resetSave(): SaveData {
  try {
    localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch {
    /* noop */
  }
  return createDefaultSave();
}

// 解鎖規則（§39）：第 1 關恆開；第 N 關需第 N-1 關已通關。
export function isLevelUnlocked(save: SaveData, levelId: LevelId): boolean {
  if (levelId === 1) return true;
  return save.levels[(levelId - 1) as LevelId]?.cleared === true;
}

export type MapNodeStatus = 'locked' | 'open' | 'cleared';

export function nodeStatus(save: SaveData, levelId: LevelId): MapNodeStatus {
  if (save.levels[levelId]?.cleared) return 'cleared';
  return isLevelUnlocked(save, levelId) ? 'open' : 'locked';
}

// 當前可挑戰節點：最小的「已解鎖未通關」關卡；全通關後為 null。
export function currentChallenge(save: SaveData): LevelId | null {
  for (const id of LEVEL_IDS) {
    if (nodeStatus(save, id) === 'open') return id;
  }
  return null;
}

export function eggsFoundCount(save: SaveData, levelId: LevelId): number {
  return save.levels[levelId]?.eggsFound.length ?? 0;
}
