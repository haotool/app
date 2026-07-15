import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDebouncedStorage } from './debouncedStorage';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    storage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    } satisfies Storage,
    store,
  };
}

describe('createDebouncedStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces rapid writes into a single underlying write', () => {
    const { storage, store } = createMemoryStorage();
    const debounced = createDebouncedStorage(storage, 300);

    for (let index = 0; index < 50; index += 1) {
      debounced.setItem('key', `value-${index}`);
    }
    expect(storage.setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(store.get('key')).toBe('value-49');
  });

  it('serves the pending value from getItem before flush', () => {
    const { storage } = createMemoryStorage();
    const debounced = createDebouncedStorage(storage, 300);

    debounced.setItem('key', 'pending');
    expect(debounced.getItem('key')).toBe('pending');
    expect(storage.getItem('key')).toBeNull();
  });

  it('flush writes the pending value immediately', () => {
    const { storage, store } = createMemoryStorage();
    const debounced = createDebouncedStorage(storage, 300);

    debounced.setItem('key', 'latest');
    debounced.flush();
    expect(store.get('key')).toBe('latest');

    vi.advanceTimersByTime(300);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('removeItem drops the pending write and clears the underlying key', () => {
    const { storage, store } = createMemoryStorage();
    const debounced = createDebouncedStorage(storage, 300);

    debounced.setItem('key', 'stale');
    debounced.removeItem('key');
    vi.advanceTimersByTime(300);

    expect(store.has('key')).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
