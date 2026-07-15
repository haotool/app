export const PERSIST_DEBOUNCE_MS = 300;

interface PendingWrite {
  key: string;
  value: string;
}

export interface DebouncedStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  flush: () => void;
}

// 節流 localStorage 寫入：高頻 tick（追蹤止損極值更新）只保留最新值，最多每 delayMs 落盤一次。
export function createDebouncedStorage(storage: Storage, delayMs: number): DebouncedStorage {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: PendingWrite | null = null;

  function flush(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending === null) return;
    const write = pending;
    pending = null;
    storage.setItem(write.key, write.value);
  }

  return {
    getItem: (key) => {
      if (pending !== null && pending.key === key) return pending.value;
      return storage.getItem(key);
    },
    setItem: (key, value) => {
      pending = { key, value };
      if (timer === null) timer = setTimeout(flush, delayMs);
    },
    removeItem: (key) => {
      if (pending !== null && pending.key === key) {
        pending = null;
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      }
      storage.removeItem(key);
    },
    flush,
  };
}
