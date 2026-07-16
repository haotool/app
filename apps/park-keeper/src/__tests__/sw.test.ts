/**
 * sw.ts activate/config 決策路徑測試（issue #713 review Blocking 3）。
 * mock Workbox 模組層呼叫 + fake CacheStorage，直接觸發 activate/message/tile handler，
 * 驗證持久值缺失時不誤刪 bucket、持久值存在時只留對應 bucket、message 競態不被預設值覆寫。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { TILE_CACHE_CONFIG_MESSAGE } from '@app/park-keeper/services/mapTileCache';

const { registerRouteCalls } = vi.hoisted(() => ({
  registerRouteCalls: [] as unknown[][],
}));

vi.mock('workbox-precaching', () => ({
  cleanupOutdatedCaches: vi.fn(),
  createHandlerBoundToURL: vi.fn(() => vi.fn()),
  precacheAndRoute: vi.fn(),
}));
vi.mock('workbox-routing', () => ({
  NavigationRoute: class {
    constructor(..._args: unknown[]) {}
  },
  registerRoute: vi.fn((...args: unknown[]) => {
    registerRouteCalls.push(args);
  }),
}));
vi.mock('workbox-strategies', () => ({
  CacheFirst: class {},
  NetworkFirst: class {},
}));
vi.mock('workbox-cacheable-response', () => ({ CacheableResponsePlugin: class {} }));
vi.mock('workbox-expiration', () => ({ ExpirationPlugin: class {} }));

const TILE_PREFIX = 'park-keeper-map-tiles';
const CONFIG_CACHE = 'park-keeper-tile-config';

interface ExtendableEventLike {
  waitUntil: (promise: Promise<unknown>) => void;
}

class FakeCache {
  store = new Map<string, Response>();

  private toUrl(request: Request | string): string {
    return typeof request === 'string' ? request : request.url;
  }

  put(request: Request | string, response: Response): Promise<void> {
    this.store.set(this.toUrl(request), response);
    return Promise.resolve();
  }

  match(request: Request | string): Promise<Response | undefined> {
    return Promise.resolve(this.store.get(this.toUrl(request)));
  }

  keys(): Promise<Request[]> {
    return Promise.resolve([...this.store.keys()].map((url) => new Request(url)));
  }

  delete(request: Request | string): Promise<boolean> {
    return Promise.resolve(this.store.delete(this.toUrl(request)));
  }
}

class FakeCacheStorage {
  buckets = new Map<string, FakeCache>();

  open(name: string): Promise<FakeCache> {
    let cache = this.buckets.get(name);
    if (!cache) {
      cache = new FakeCache();
      this.buckets.set(name, cache);
    }
    return Promise.resolve(cache);
  }

  keys(): Promise<string[]> {
    return Promise.resolve([...this.buckets.keys()]);
  }

  delete(name: string): Promise<boolean> {
    return Promise.resolve(this.buckets.delete(name));
  }
}

describe('sw.ts tile 天數 activate/config 決策', () => {
  let fakeCaches: FakeCacheStorage;
  let listeners: Record<string, ((event: never) => unknown)[]>;
  let addEventListenerSpy: MockInstance;

  const loadSw = async () => {
    await import('@app/park-keeper/sw');
  };

  const fireActivate = async () => {
    const pending: Promise<unknown>[] = [];
    const event: ExtendableEventLike = { waitUntil: (p) => void pending.push(p) };
    for (const listener of listeners['activate'] ?? []) {
      (listener as (e: ExtendableEventLike) => void)(event);
    }
    await Promise.all(pending);
  };

  const fireMessage = async (data: unknown) => {
    const pending: Promise<unknown>[] = [];
    const event = { data, waitUntil: (p: Promise<unknown>) => void pending.push(p) };
    for (const listener of listeners['message'] ?? []) {
      (listener as (e: typeof event) => void)(event);
    }
    await Promise.all(pending);
  };

  const getTileRouteHandler = () => {
    const call = registerRouteCalls.find((args) => typeof args[1] === 'function');
    if (!call) throw new Error('tile route handler not registered');
    return call[1] as (input: {
      request: Request;
      event: ExtendableEventLike;
    }) => Promise<Response>;
  };

  const writePersistedDays = async (days: number) => {
    const cache = await fakeCaches.open(CONFIG_CACHE);
    await cache.put(
      new Request(`${globalThis.location.origin}/__park_keeper_tile_config__`),
      new Response(JSON.stringify({ cacheDurationDays: days }), {
        headers: { 'content-type': 'application/json' },
      }),
    );
  };

  beforeEach(() => {
    vi.resetModules();
    registerRouteCalls.length = 0;
    fakeCaches = new FakeCacheStorage();
    listeners = {};

    vi.stubGlobal('caches', fakeCaches);
    vi.stubGlobal('clients', { claim: vi.fn(() => Promise.resolve()) });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('tile', { status: 200 }))),
    );
    addEventListenerSpy = vi
      .spyOn(globalThis, 'addEventListener')
      .mockImplementation((type: string, listener: EventListenerOrEventListenerObject) => {
        (listeners[type] ??= []).push(listener as (event: never) => unknown);
      });
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('activate 無持久值時不得刪除任何既有 day-bucket（首次升級遷移）', async () => {
    await fakeCaches.open(`${TILE_PREFIX}-30d`);
    await fakeCaches.open(`${TILE_PREFIX}-14d`);

    await loadSw();
    await fireActivate();

    const buckets = await fakeCaches.keys();
    expect(buckets).toContain(`${TILE_PREFIX}-30d`);
    expect(buckets).toContain(`${TILE_PREFIX}-14d`);
  });

  it('activate 持久值為 30 時只保留 -30d bucket，config bucket 不受影響', async () => {
    await fakeCaches.open(`${TILE_PREFIX}-7d`);
    await fakeCaches.open(`${TILE_PREFIX}-30d`);
    await writePersistedDays(30);

    await loadSw();
    await fireActivate();

    const buckets = await fakeCaches.keys();
    expect(buckets).not.toContain(`${TILE_PREFIX}-7d`);
    expect(buckets).toContain(`${TILE_PREFIX}-30d`);
    expect(buckets).toContain(CONFIG_CACHE);
  });

  it('讀取持久值期間收到 config 訊息時，不得被預設值覆寫（TOCTOU）', async () => {
    // 首次 config match 先快照結果（此時無持久值 → undefined）再延遲 resolve，
    // 模擬「讀取進行中、結果將為 null」的競態窗口。
    let releaseConfigRead: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseConfigRead = resolve;
    });
    const configCache = await fakeCaches.open(CONFIG_CACHE);
    const originalMatch = configCache.match.bind(configCache);
    let gated = false;
    vi.spyOn(configCache, 'match').mockImplementation(async (request: Request | string) => {
      const snapshot = await originalMatch(request);
      if (!gated) {
        gated = true;
        await gate;
      }
      return snapshot;
    });

    await loadSw();
    const tileHandler = getTileRouteHandler();
    const tileRequest = new Request('https://wmts.nlsc.gov.tw/wmts/EMAP/default/1/1/1');

    // tile 請求先進入，getTileCacheDays 卡在持久值讀取。
    const handlerPromise = tileHandler({ request: tileRequest, event: { waitUntil: vi.fn() } });
    // 競態：讀取期間 client 送來使用者設定 30 天。
    await fireMessage({ type: TILE_CACHE_CONFIG_MESSAGE, cacheDurationDays: 30 });
    // 持久值讀取完成（回 null），不得以 DEFAULT 覆寫已寫入的 30。
    releaseConfigRead?.();
    await handlerPromise;

    const bucket30 = await fakeCaches.open(`${TILE_PREFIX}-30d`);
    expect(bucket30.store.has(tileRequest.url)).toBe(true);
    const buckets = await fakeCaches.keys();
    expect(buckets).not.toContain(`${TILE_PREFIX}-7d`);
  });
});
