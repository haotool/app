import { expect, it, vi } from 'vitest';
import type * as ApiEndpointsModule from '../config/api-endpoints';
const { routes, listeners } = vi.hoisted(() => ({
  routes: [] as {
    match: (args: { url: URL; request: { destination: string } }) => boolean;
    handler: { kind: string; options: Record<string, unknown> };
  }[],
  listeners: new Map<string, (event: never) => void>(),
}));
vi.mock('workbox-core', () => ({
  cacheNames: { precache: 'workbox-precache-v2-https://example.com/' },
  clientsClaim: vi.fn(),
}));
vi.mock('workbox-precaching', () => ({
  getCacheKeyForURL: (url: string) =>
    url.includes('static-loader-data-manifest') ? `${url}?__WB_REVISION__=loader-v1` : url,
  matchPrecache: vi.fn(),
  precacheAndRoute: vi.fn(),
}));
vi.mock('workbox-routing', () => ({
  NavigationRoute: class {},
  setCatchHandler: vi.fn(),
  registerRoute: (match: unknown, handler: unknown) => routes.push({ match, handler } as never),
}));
vi.mock('workbox-strategies', () => {
  const strategy = (kind: string) =>
    class {
      constructor(public options: Record<string, unknown> = {}) {}
      kind = kind;
    };
  return {
    CacheFirst: strategy('CacheFirst'),
    NetworkFirst: strategy('NetworkFirst'),
    NetworkOnly: strategy('NetworkOnly'),
    StaleWhileRevalidate: strategy('StaleWhileRevalidate'),
  };
});
vi.mock('workbox-cacheable-response', () => ({
  CacheableResponsePlugin: class {
    constructor(public options: unknown) {}
  },
}));
vi.mock('workbox-expiration', () => ({
  ExpirationPlugin: class {
    constructor(public options: unknown) {}
  },
}));
const loadSw = async (
  v3Public: boolean,
  manifest: { url: string; revision?: string | null }[] = [],
) => {
  routes.length = 0;
  listeners.clear();
  vi.resetModules();
  vi.doMock('../config/api-endpoints', async (importOriginal) => ({
    ...(await importOriginal<typeof ApiEndpointsModule>()),
    FX_V3_PUBLIC: v3Public,
  }));
  const cacheDeletes: string[] = [];
  vi.stubGlobal('caches', {
    delete: vi.fn((name: string) => {
      cacheDeletes.push(name);
      return Promise.resolve(true);
    }),
    open: vi.fn(() =>
      Promise.resolve({
        match: vi.fn(() => Promise.resolve(new Response('cached'))),
        put: vi.fn(),
      }),
    ),
    match: vi.fn(() => Promise.resolve(new Response('cached'))),
  });
  vi.stubGlobal('self', {
    registration: { scope: 'https://example.com/' },
    location: { origin: 'https://example.com' },
    __WB_MANIFEST: manifest,
    addEventListener: (type: string, listener: (event: never) => void) =>
      listeners.set(type, listener),
    clients: { claim: vi.fn() },
  });
  await import('../sw');
  return {
    cacheDeletes,
    handlerFor: (url: string) =>
      routes.find(
        (route) =>
          typeof route.match === 'function' &&
          route.match({ url: new URL(url), request: { destination: '' } }),
      )?.handler,
    activate: async () => {
      let wait: Promise<unknown> = Promise.resolve();
      listeners.get('activate')?.({
        waitUntil: (promise: Promise<unknown>) => (wait = promise),
      } as never);
      await wait;
      vi.unstubAllGlobals();
    },
  };
};
const DATA = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/';
const RAW = 'https://raw.githubusercontent.com/haotool/app/data/public/rates/';

it('keeps the main history cache strategies while FX_V3_PUBLIC is false', async () => {
  const { handlerFor, activate } = await loadSw(false);
  for (const path of ['history-30d.json', 'providers/moneybox/history-30d.json']) {
    const handler = handlerFor(`${DATA}${path}`);
    expect(handler?.kind).toBe('StaleWhileRevalidate');
    expect(handler?.options['cacheName']).toBe('ratewise-history-aggregate-cache');
  }
  expect(handlerFor(`${DATA}history/2026-09-21.json`)?.options['cacheName']).toBe(
    'ratewise-history-rates-cdn',
  );
  expect(handlerFor(`${DATA}history/2026-09-21.json`)?.kind).toBe('CacheFirst');
  expect(handlerFor(`${RAW}history/2026-09-21.json`)?.options['cacheName']).toBe(
    'ratewise-history-rates-raw',
  );
  expect(handlerFor(`${DATA}v3/current.json`)).toBeUndefined();
  await activate();
});

it('revalidates mutable history with bounded timeout and isolates v3 once public', async () => {
  const { handlerFor, activate } = await loadSw(true);
  for (const path of [
    'history/2026-09-21.json',
    'providers/moneybox/history/2026-09-21.json',
    'history-30d.json',
    'providers/moneybox/history-30d.json',
  ]) {
    const handler = handlerFor(`${DATA}${path}`);
    expect(handler?.kind).toBe('NetworkFirst');
    expect(handler?.options['networkTimeoutSeconds']).toBe(5);
    const expiry = (handler?.options['plugins'] as { options: { maxEntries?: number } }[]).find(
      (plugin) => plugin.options.maxEntries !== undefined,
    );
    expect(expiry?.options.maxEntries).toBeGreaterThanOrEqual(4);
  }
  expect(handlerFor(`${DATA}v3/current.json`)?.kind).toBe('NetworkOnly');
  await activate();
});

it('deletes only caches inactive for the current v3 flag during activation', async () => {
  const legacy = await loadSw(false);
  await legacy.activate();
  expect(legacy.cacheDeletes).toContain('ratewise-history-validated-v2');
  expect(legacy.cacheDeletes).not.toContain('ratewise-history-rates-cdn');

  const v3 = await loadSw(true);
  await v3.activate();
  expect(v3.cacheDeletes).toEqual(
    expect.arrayContaining([
      'ratewise-history-rates-cdn',
      'ratewise-history-rates-raw',
      'ratewise-history-aggregate-cache',
    ]),
  );
  expect(v3.cacheDeletes).not.toContain('ratewise-history-validated-v2');
});

it('foreign precache 先建立時，修復與健康檢查仍只存取自身 precache', async () => {
  await loadSw(true, [
    { url: 'assets/main.js', revision: null },
    { url: 'static-loader-data-manifest-oldhash.json', revision: 'loader-v1' },
  ]);
  const own = 'workbox-precache-v2-https://example.com/';
  const foreign = 'workbox-precache-v2-https://example.com/starpuff/';
  const cache = { keys: vi.fn().mockResolvedValue([]), put: vi.fn().mockResolvedValue(undefined) };
  const open = vi.fn().mockResolvedValue(cache);
  vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValue([foreign, own]), open });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('asset')));
  const dispatch = async (type: string) => {
    let work: Promise<void> | undefined;
    listeners.get('message')?.({
      data: { type },
      waitUntil: (promise: Promise<void>) => {
        work = promise;
      },
    } as never);
    await work;
  };
  try {
    await dispatch('VERIFY_AND_REPAIR_PRECACHE');
    expect(open).toHaveBeenCalledExactlyOnceWith(own);
    expect(cache.put).toHaveBeenCalledWith(
      'https://example.com/assets/main.js',
      expect.any(Response),
    );
    expect(cache.put).toHaveBeenCalledWith(
      'https://example.com/static-loader-data-manifest-oldhash.json?__WB_REVISION__=loader-v1',
      expect.any(Response),
    );
    expect(cache.put).not.toHaveBeenCalledWith(
      'https://example.com/static-loader-data-manifest.json',
      expect.any(Response),
    );
    await dispatch('CHECK_SHELL_PRECACHE');
    expect(open).toHaveBeenCalledTimes(2);
    expect(open).not.toHaveBeenCalledWith(foreign);
  } finally {
    vi.unstubAllGlobals();
  }
});
