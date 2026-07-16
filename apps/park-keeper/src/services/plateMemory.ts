const LAST_PLATE_KEY = 'park-keeper:last-plate';
const LAST_FLOOR_KEY = 'park-keeper:last-floor';
const PLATE_HISTORY_KEY = 'park-keeper:plate-history';

// 歷史車號上限：一鍵切換 chips 需求（design brief 旅程 A），多車家庭常見 2-3 台。
const PLATE_HISTORY_MAX = 3;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// 空值視為 no-op，不覆寫既有記憶；清除記憶只走 clear()。
function safeCommit(key: string, value: string): void {
  if (!value.trim()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // 隱私模式或儲存空間不足時靜默降級，不影響操作流程。
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // 靜默降級。
  }
}

function readHistory(): string[] {
  const raw = safeGet(PLATE_HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && !!item.trim());
  } catch {
    return [];
  }
}

export const plateMemory = {
  get(): string | null {
    return safeGet(LAST_PLATE_KEY);
  },
  commit(plate: string): void {
    if (!plate.trim()) return;
    safeCommit(LAST_PLATE_KEY, plate);
    // 歷史去重置頂，上限 PLATE_HISTORY_MAX。
    const next = [plate, ...readHistory().filter((p) => p !== plate)].slice(0, PLATE_HISTORY_MAX);
    safeCommit(PLATE_HISTORY_KEY, JSON.stringify(next));
  },
  getHistory(): string[] {
    return readHistory();
  },
  clear(): void {
    safeRemove(LAST_PLATE_KEY);
    safeRemove(LAST_FLOOR_KEY);
    safeRemove(PLATE_HISTORY_KEY);
  },
  getFloor(): string | null {
    return safeGet(LAST_FLOOR_KEY);
  },
  commitFloor(floor: string): void {
    safeCommit(LAST_FLOOR_KEY, floor);
  },
};
