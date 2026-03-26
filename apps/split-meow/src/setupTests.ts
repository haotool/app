import '@testing-library/jest-dom/vitest';
import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const hasWindow = typeof window !== 'undefined';

// Stabilize requestAnimationFrame in tests
vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
  globalThis.setTimeout(() => callback(globalThis.performance?.now?.() ?? Date.now()), 0),
);
vi.stubGlobal('cancelAnimationFrame', (handle: number) => globalThis.clearTimeout(handle));

// Mock window.matchMedia
if (hasWindow) {
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
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn(function (this: ResizeObserver) {
  this.observe = vi.fn();
  this.unobserve = vi.fn();
  this.disconnect = vi.fn();
}) as unknown as typeof ResizeObserver;

// Mock navigator.vibrate (used in Calculator)
if (hasWindow) {
  Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: vi.fn(),
  });
}

// In-memory storage fallback
if (hasWindow) {
  let store: Record<string, string> = {};
  const memoryStorage: Storage = {
    getItem: (key: string) => (key in store ? (store[key] ?? null) : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };

  Object.defineProperty(window, 'localStorage', {
    value: memoryStorage,
    writable: true,
    configurable: true,
  });

  beforeEach(() => {
    store = {};
  });
}
