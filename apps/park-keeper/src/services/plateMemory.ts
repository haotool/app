const LAST_PLATE_KEY = 'park-keeper:last-plate';
const LAST_FLOOR_KEY = 'park-keeper:last-floor';

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

export const plateMemory = {
  get(): string | null {
    return safeGet(LAST_PLATE_KEY);
  },
  commit(plate: string): void {
    safeCommit(LAST_PLATE_KEY, plate);
  },
  clear(): void {
    safeRemove(LAST_PLATE_KEY);
    safeRemove(LAST_FLOOR_KEY);
  },
  getFloor(): string | null {
    return safeGet(LAST_FLOOR_KEY);
  },
  commitFloor(floor: string): void {
    safeCommit(LAST_FLOOR_KEY, floor);
  },
};
