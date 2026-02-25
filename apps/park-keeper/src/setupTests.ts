import '@testing-library/jest-dom/vitest';
import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

import i18n from './services/i18n';

// Explicitly extend expect with jest-dom matchers
expect.extend(matchers);

// Re-init i18next for testing with useSuspense: false
void i18n.init({ react: { useSuspense: false } });

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Stabilize requestAnimationFrame in tests
vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
  window.setTimeout(() => callback(performance.now()), 0),
);
vi.stubGlobal('cancelAnimationFrame', (handle: number) => window.clearTimeout(handle));

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

// Mock ResizeObserver
global.ResizeObserver = vi.fn(function (this: ResizeObserver) {
  this.observe = vi.fn();
  this.unobserve = vi.fn();
  this.disconnect = vi.fn();
}) as unknown as typeof ResizeObserver;

// In-memory storage fallback
type StorageTarget = 'localStorage' | 'sessionStorage';

interface MemoryStorage extends Storage {
  _store: Record<string, string>;
}

const ensureStorage = (target: StorageTarget): Storage => {
  const existing = (window as unknown as Record<string, unknown>)[target];
  if (existing && typeof (existing as Storage).clear === 'function') {
    return existing as Storage;
  }

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

  return memoryStorage;
};

beforeEach(() => {
  ensureStorage('localStorage').clear();
  ensureStorage('sessionStorage').clear();
});

// Mock HTMLCanvasElement.getContext for Leaflet compatibility
const mockCanvasRenderingContext2D = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: [] })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: [] })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  isPointInPath: vi.fn(() => false),
  quadraticCurveTo: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  canvas: null,
};

HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') {
    return mockCanvasRenderingContext2D as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as typeof HTMLCanvasElement.prototype.getContext;
