import { expect, it, vi } from 'vitest';
import type * as ApiEndpointsModule from '../config/api-endpoints';
const { routes } = vi.hoisted(() => ({
  routes: [] as {
    match: (args: { url: URL; request: { destination: string } }) => boolean;
    handler: { kind: string; options: Record<string, unknown> };
  }[],
}));
vi.mock('workbox-core', () => ({ clientsClaim: vi.fn() }));
vi.mock('workbox-precaching', () => ({
  cleanupOutdatedCaches: vi.fn(),
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
const loadSw = async (v3Public: boolean) => {
  routes.length = 0;
  vi.resetModules();
  vi.doMock('../config/api-endpoints', async (importOriginal) => ({
    ...(await importOriginal<typeof ApiEndpointsModule>()),
    FX_V3_PUBLIC: v3Public,
  }));
  vi.stubGlobal('self', {
    registration: { scope: 'https://example.com/' },
    location: { origin: 'https://example.com' },
    __WB_MANIFEST: [],
    addEventListener: vi.fn(),
    clients: { claim: vi.fn() },
  });
  await import('../sw');
  vi.unstubAllGlobals();
  return (url: string) =>
    routes.find(
      (route) =>
        typeof route.match === 'function' &&
        route.match({ url: new URL(url), request: { destination: '' } }),
    )?.handler;
};
const DATA = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/';
const RAW = 'https://raw.githubusercontent.com/haotool/app/data/public/rates/';

it('keeps the main history cache strategies while FX_V3_PUBLIC is false', async () => {
  const handlerFor = await loadSw(false);
  for (const path of ['history-30d.json', 'providers/moneybox/history-30d.json']) {
    const handler = handlerFor(`${DATA}${path}`);
    expect(handler?.kind).toBe('StaleWhileRevalidate');
    expect(handler?.options['cacheName']).toBe('history-aggregate-cache');
  }
  expect(handlerFor(`${DATA}history/2026-09-21.json`)?.options['cacheName']).toBe(
    'history-rates-cdn',
  );
  expect(handlerFor(`${DATA}history/2026-09-21.json`)?.kind).toBe('CacheFirst');
  expect(handlerFor(`${RAW}history/2026-09-21.json`)?.options['cacheName']).toBe(
    'history-rates-raw',
  );
  expect(handlerFor(`${DATA}v3/current.json`)).toBeUndefined();
});

it('revalidates mutable history with bounded timeout and isolates v3 once public', async () => {
  const handlerFor = await loadSw(true);
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
});
