import '@testing-library/jest-dom/vitest';
import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const hasWindow = typeof window !== 'undefined';

vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
  globalThis.setTimeout(() => callback(globalThis.performance?.now?.() ?? Date.now()), 0),
);
vi.stubGlobal('cancelAnimationFrame', (handle: number) => globalThis.clearTimeout(handle));

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

global.ResizeObserver = vi.fn(function (this: ResizeObserver) {
  this.observe = vi.fn();
  this.unobserve = vi.fn();
  this.disconnect = vi.fn();
}) as unknown as typeof ResizeObserver;

// 測試環境禁止真實 WebSocket 連線；行為驗證由各測試自行 stub。
class NoopWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readyState = NoopWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) {}
  send = vi.fn();
  close(): void {
    this.readyState = NoopWebSocket.CLOSED;
  }
}
vi.stubGlobal('WebSocket', NoopWebSocket);

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
