/**
 * Vitest test setup
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// [fix:2025-12-25] 顯式擴展 expect 以確保 jest-dom matchers 可用
expect.extend(matchers);
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

type StorageTarget = 'localStorage' | 'sessionStorage';

interface MemoryStorage extends Storage {
  _store: Record<string, string>;
}

const storageMocks: Partial<Record<StorageTarget, MemoryStorage>> = {};

const ensureStorage = (target: StorageTarget): Storage => {
  const existing = storageMocks[target];
  if (existing) return existing;

  let store: Record<string, string> = {};
  const memoryStorage: MemoryStorage = {
    _store: store,
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
      memoryStorage._store = store;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  } as MemoryStorage;

  Object.defineProperty(window, target, {
    value: memoryStorage,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  storageMocks[target] = memoryStorage;
  return memoryStorage;
};

// Only mock browser APIs if window is defined (jsdom environment)
if (typeof window !== 'undefined') {
  ensureStorage('localStorage');
  ensureStorage('sessionStorage');

  beforeEach(() => {
    ensureStorage('localStorage').clear();
    ensureStorage('sessionStorage').clear();
  });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;

  // Mock ResizeObserver
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.ResizeObserver = mockResizeObserver as unknown as typeof ResizeObserver;
}
