import type { LevelId } from './types';

// 存檔 SSOT（GAME_DESIGN §38/§94）：localStorage sp-save schema v2（v1 由 parseSave 遷移），
// 純資料模組供 vitest 驗證。parse/fallback 模式沿用 core/layout.ts：未知版本、形狀損毀、
// 隱私模式一律回退預設。

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
  // v15 成就（§94）：已頒發成就 id——toast 去重與補發基準；頒發紀錄不可逆（不隨資料回退移除）。
  achievements: string[];
}

export const SAVE_STORAGE_KEY = 'sp-save';
// 存檔備援（v19 #819 卡 7）：每次寫入前把上一份合法主檔輪替至備援鍵；
// 主檔 parse 失敗（含 checksum 不符）時由備援恢復，不再默默歸零。
export const SAVE_BACKUP_KEY = 'sp-save-backup';
// v15 升 v2（§94）：新增 achievements 欄位；v1 舊存檔由 parseSave 遷移，禁 discard。
export const SAVE_SCHEMA_VERSION = 2;

export function createDefaultSave(): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    highestClearedLevel: 0,
    levels: {},
    lastPlayedAt: 0,
    achievements: [],
  };
}

// v12 五區終章（§84）：20 節點；schema v1 不變——舊存檔（≤16 關條目）原樣載入，
// 新節點依解鎖規則自然呈鎖定態。
const LEVEL_IDS: readonly LevelId[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
];

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

// checksum 規範序列化（v19 卡 7）：JSON.stringify 依欄位插入序輸出，執行期物件的
// 插入序不可靠（exCleared 為後補欄位），故以固定欄位序手工建構再序列化。
function canonicalJson(save: SaveData): string {
  const levels: Record<string, unknown> = {};
  for (const id of LEVEL_IDS) {
    const entry = save.levels[id];
    if (!entry) continue;
    levels[String(id)] = {
      cleared: entry.cleared,
      bestTimeMs: entry.bestTimeMs,
      eggsFound: [...entry.eggsFound],
      exCleared: entry.exCleared === true,
    };
  }
  return JSON.stringify({
    schemaVersion: save.schemaVersion,
    highestClearedLevel: save.highestClearedLevel,
    levels,
    lastPlayedAt: save.lastPlayedAt,
    achievements: [...save.achievements],
  });
}

// djb2 xor 變體：非密碼學完整性檢查（偵測截斷/位元翻轉/手改），base36 字串輸出。
function checksumOf(save: SaveData): string {
  const raw = canonicalJson(save);
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash * 33) ^ raw.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

// 嚴格解析（v19 卡 7）：null＝損毀（JSON 壞損、未知版本、checksum 不符）——供
// loadSave 區分「損毀走備援」與「合法載入」；legacy 存檔（無 checksum 欄位）視為合法。
export function parseSaveStrict(raw: string): SaveData | null {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const version = data['schemaVersion'];
  if (version !== 1 && version !== SAVE_SCHEMA_VERSION) return null;
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
  // 成就欄位收斂（§94）：只收字串條目並去重；v1 缺欄位回空集（migration 缺省）。
  save.achievements = Array.isArray(data['achievements'])
    ? [...new Set(data['achievements'].filter((item): item is string => typeof item === 'string'))]
    : [];
  // checksum 驗證：屬性存在即須為相符字串（非字串亦判損毀，防手改為 null/數字繞過）；
  // 僅完全無此屬性的 legacy 存檔豁免。
  if ('checksum' in data && data['checksum'] !== checksumOf(save)) return null;
  return save;
}

// 解析持久化 JSON：僅收斂合法關卡條目，highestClearedLevel 一律由條目重新推導。
// versioned migration（§94）：v1（v9–v14 世代）缺 achievements 欄位，載入補空集後由
// 開機補發回填；回傳物件恆為當前 schema 版，persistSave 寫出即完成升版。
export function parseSave(raw: string | null): SaveData {
  if (!raw) return createDefaultSave();
  return parseSaveStrict(raw) ?? createDefaultSave();
}

function deriveHighestCleared(save: SaveData): number {
  let highest = 0;
  for (const id of LEVEL_IDS) {
    if (save.levels[id]?.cleared) highest = Math.max(highest, id);
  }
  return highest;
}

// 雙壞警示節流（審查 nit）：主檔＋備援皆損毀時無自癒（不落盤預設），loadSave 為
// 多處熱呼叫（boot/Title/Map/e2e 觀測點）會重複警示——每工作階段至多一次；
// 備援恢復路徑會回寫自癒，天然只警一次，不需節流。
let warnedDoubleCorrupt = false;

// 隱私模式下 localStorage 可能拋錯：讀寫皆容錯，讀退預設、寫靜默略過。
// 主檔損毀（v19 卡 7）：先從備援恢復並回寫主檔；備援亦不可用才回退預設，均警示留痕。
export function loadSave(): SaveData {
  let raw: string | null;
  try {
    raw = localStorage.getItem(SAVE_STORAGE_KEY);
  } catch {
    return createDefaultSave();
  }
  if (raw === null) return createDefaultSave();
  const parsed = parseSaveStrict(raw);
  if (parsed !== null) return parsed;
  try {
    const backupRaw = localStorage.getItem(SAVE_BACKUP_KEY);
    const restored = backupRaw !== null ? parseSaveStrict(backupRaw) : null;
    if (restored !== null) {
      console.warn('sp-save 損毀，已從 sp-save-backup 恢復進度');
      persistSave(restored);
      return restored;
    }
  } catch {
    /* noop */
  }
  if (!warnedDoubleCorrupt) console.warn('sp-save 損毀且備援不可用，回退預設存檔');
  warnedDoubleCorrupt = true;
  return createDefaultSave();
}

export function persistSave(save: SaveData): void {
  try {
    // 備援輪替（v19 卡 7）：上一份主檔合法才轉入備援，避免損毀資料污染備援。
    const previous = localStorage.getItem(SAVE_STORAGE_KEY);
    if (previous !== null && parseSaveStrict(previous) !== null) {
      localStorage.setItem(SAVE_BACKUP_KEY, previous);
    }
  } catch {
    /* noop：備援輪替失敗（配額不足／隱私模式）不得阻斷主檔寫入。 */
  }
  try {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...save, checksum: checksumOf(save) }));
  } catch {
    /* noop */
  }
}

// 儲存可用性探測（v19 卡 7）：隱私模式/空間耗盡時回 false，由 main.ts 明確提示，
// 不再靜默吞掉「進度無法保存」。
export function isSaveStorageAvailable(): boolean {
  try {
    const probeKey = 'sp-storage-probe';
    localStorage.setItem(probeKey, '1');
    localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
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
    // 備援同步清除（v19 卡 7）：避免刻意重置後又從備援恢復出舊進度。
    localStorage.removeItem(SAVE_BACKUP_KEY);
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
