import { expect, it, vi } from 'vitest';
const { routes } = vi.hoisted(() => ({
  routes: [] as {
    match: (args: { url: URL }) => boolean;
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
it('revalidates mutable history with bounded timeout and isolates v3 from legacy caches', async () => {
  vi.stubGlobal('self', {
    registration: { scope: 'https://example.com/' },
    location: { origin: 'https://example.com' },
    __WB_MANIFEST: [],
    addEventListener: vi.fn(),
    clients: { claim: vi.fn() },
  });
  await import('../sw');
  const handlerFor = (url: string) =>
    routes.find((route) => typeof route.match === 'function' && route.match({ url: new URL(url) }))
      ?.handler;
  for (const path of [
    'history/2026-09-21.json',
    'providers/moneybox/history/2026-09-21.json',
    'history-30d.json',
    'providers/moneybox/history-30d.json',
  ]) {
    const handler = handlerFor(`https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/${path}`);
    expect(handler?.kind).toBe('NetworkFirst');
    expect(handler?.options['networkTimeoutSeconds']).toBe(5);
    expect(handler?.options['plugins']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          options: expect.objectContaining({ maxEntries: expect.any(Number) }),
        }),
      ]),
    );
    const expiry = (handler?.options['plugins'] as { options: { maxEntries?: number } }[]).find(
      (plugin) => plugin.options.maxEntries !== undefined,
    );
    expect(expiry?.options.maxEntries).toBeGreaterThanOrEqual(4);
  }
  expect(
    handlerFor('https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/v3/current.json')?.kind,
  ).toBe('NetworkOnly');
  vi.unstubAllGlobals();
});
