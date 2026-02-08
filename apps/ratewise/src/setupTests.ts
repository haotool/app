import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhTW from './i18n/locales/zh-TW';

// 明確擴展 expect 以包含 jest-dom matchers
// 這確保 CI 環境中 matchers 正確載入
// 參考: https://testing-library.com/docs/ecosystem-jest-dom/#with-vitest
expect.extend(matchers);

// 初始化 i18next 測試環境
// 使用繁體中文作為測試語言，確保測試中的翻譯與 UI 一致
void i18n.use(initReactI18next).init({
  resources: {
    'zh-TW': { translation: zhTW },
  },
  lng: 'zh-TW',
  fallbackLng: 'zh-TW',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Mock virtual:pwa-register/react for test environment
// Mock 透過 vitest.config.ts alias 指向 src/__mocks__/pwa-register-react.ts
// 此處不再需要 vi.mock()，由 alias 處理

declare global {
  // React 18 測試環境必須開啟 act() 支援旗標
  // 參考: https://react.dev/reference/react/act

  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Stabilize requestAnimationFrame in tests to avoid CI flakiness
// [context7:vitest-dev/vitest:2026-01-06T02:25:30+08:00]
vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
  window.setTimeout(() => callback(performance.now()), 0),
);
vi.stubGlobal('cancelAnimationFrame', (handle: number) => window.clearTimeout(handle));

// Mock HTMLCanvasElement for lightweight-charts tests
// Based on Vitest best practices: https://vitest.dev/guide/mocking.html#globals
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
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  canvas: null,
};

// Mock HTMLCanvasElement.prototype methods
// Type assertion needed because getContext is an overloaded function
HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') {
    return mockCanvasRenderingContext2D as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');
HTMLCanvasElement.prototype.toBlob = vi.fn();

// Mock window.matchMedia for responsive design tests
// Required by lightweight-charts for handling responsive layouts
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

// Mock ResizeObserver for chart resizing tests
// Must use function keyword (not arrow function) to work as constructor
global.ResizeObserver = vi.fn(function (this: ResizeObserver) {
  this.observe = vi.fn();
  this.unobserve = vi.fn();
  this.disconnect = vi.fn();
}) as unknown as typeof ResizeObserver;

// Provide a resilient in-memory storage fallback to avoid TypeError in CI
type StorageTarget = 'localStorage' | 'sessionStorage';

interface MemoryStorage extends Storage {
  _store: Record<string, string>;
}

const ensureStorage = (target: StorageTarget): Storage => {
  const existing = (window as unknown as Record<string, unknown>)[target];
  if (existing && typeof (existing as Storage).clear === 'function') {
    return existing as Storage;
  }

  // Minimal in-memory implementation compatible with Web Storage API
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
