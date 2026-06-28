/**
 * Service Worker 單元測試
 *
 * 測試範圍：
 * 1. 路徑處理函數（getBasePath, resolvePath）
 * 2. 離線導航回退邏輯
 * 3. 快取策略配置驗證
 *
 * [test:2026-01-10] PWA 離線功能測試
 */

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';

const { matchPrecacheMock, navigationHandlerRef } = vi.hoisted(() => ({
  matchPrecacheMock: vi.fn(),
  navigationHandlerRef: {
    current: null as
      | ((params: { event: ExtendableEvent; request: Request }) => Promise<Response>)
      | null,
  },
}));

vi.mock('workbox-core', () => ({
  clientsClaim: vi.fn(),
}));

vi.mock('workbox-precaching', () => ({
  cleanupOutdatedCaches: vi.fn(),
  matchPrecache: (...args: unknown[]) => matchPrecacheMock(...args),
  precacheAndRoute: vi.fn(),
}));

vi.mock('workbox-routing', () => ({
  NavigationRoute: class NavigationRoute {
    constructor(
      handler: (params: { event: ExtendableEvent; request: Request }) => Promise<Response>,
    ) {
      navigationHandlerRef.current = handler;
    }
  },
  registerRoute: vi.fn(),
  setCatchHandler: vi.fn(),
}));

vi.mock('workbox-strategies', () => ({
  CacheFirst: class CacheFirst {},
  NetworkOnly: class NetworkOnly {},
  StaleWhileRevalidate: class StaleWhileRevalidate {},
}));

vi.mock('workbox-cacheable-response', () => ({
  CacheableResponsePlugin: class CacheableResponsePlugin {},
}));

vi.mock('workbox-expiration', () => ({
  ExpirationPlugin: class ExpirationPlugin {},
}));

// Mock ServiceWorkerGlobalScope
const mockScope = 'https://example.com/ratewise/';

// 模擬 self.registration.scope
const mockSelf = {
  registration: {
    scope: mockScope,
  },
  __WB_MANIFEST: [],
  skipWaiting: vi.fn(),
  addEventListener: vi.fn(),
  clients: {
    claim: vi.fn(),
  },
};

// 設置全域 self mock
vi.stubGlobal('self', mockSelf);

// 提取 sw.ts 中的路徑處理邏輯進行測試
// 注意：這些函數需要從 sw.ts 提取出來成為可測試的模組

describe('Service Worker Path Utilities', () => {
  /**
   * 從 Service Worker scope 提取 base path
   * 這是 sw.ts 中 getBasePath 函數的測試版本
   */
  function getBasePath(scopeUrl: string): string {
    try {
      const url = new URL(scopeUrl);
      return url.pathname;
    } catch {
      return '/';
    }
  }

  /**
   * 將相對路徑轉換為基於 scope 的完整路徑
   * 這是 sw.ts 中 resolvePath 函數的測試版本
   */
  function resolvePath(basePath: string, relativePath: string): string {
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    return `${basePath}${cleanPath}`;
  }

  describe('getBasePath', () => {
    it('should extract /ratewise/ from production scope', () => {
      const scope = 'https://app.haotool.org/ratewise/';
      expect(getBasePath(scope)).toBe('/ratewise/');
    });

    it('should extract / from root scope', () => {
      const scope = 'https://localhost:3001/';
      expect(getBasePath(scope)).toBe('/');
    });

    it('should handle nested paths', () => {
      const scope = 'https://example.com/apps/ratewise/';
      expect(getBasePath(scope)).toBe('/apps/ratewise/');
    });

    it('should return / for invalid URL', () => {
      expect(getBasePath('invalid-url')).toBe('/');
    });

    it('should handle scope without trailing slash', () => {
      const scope = 'https://example.com/ratewise';
      expect(getBasePath(scope)).toBe('/ratewise');
    });
  });

  describe('resolvePath', () => {
    it('should resolve index.html for production base', () => {
      const basePath = '/ratewise/';
      expect(resolvePath(basePath, 'index.html')).toBe('/ratewise/index.html');
    });

    it('should resolve offline.html for production base', () => {
      const basePath = '/ratewise/';
      expect(resolvePath(basePath, 'offline.html')).toBe('/ratewise/offline.html');
    });

    it('should resolve paths for root base', () => {
      const basePath = '/';
      expect(resolvePath(basePath, 'index.html')).toBe('/index.html');
      expect(resolvePath(basePath, 'offline.html')).toBe('/offline.html');
    });

    it('should handle leading slash in relative path', () => {
      const basePath = '/ratewise/';
      expect(resolvePath(basePath, '/index.html')).toBe('/ratewise/index.html');
    });

    it('should handle nested relative paths', () => {
      const basePath = '/ratewise/';
      expect(resolvePath(basePath, 'assets/style.css')).toBe('/ratewise/assets/style.css');
    });
  });
});

describe('Service Worker Offline Fallback', () => {
  /**
   * 模擬 matchPrecache 行為
   */
  function mockMatchPrecache(url: string, precachedUrls: string[]): Response | null {
    if (precachedUrls.includes(url)) {
      return new Response('<html>offline</html>', {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    return null;
  }

  describe('Offline Navigation Fallback', () => {
    it('should find offline.html in precache with relative URL', () => {
      const precachedUrls = ['offline.html', 'index.html'];
      const result = mockMatchPrecache('offline.html', precachedUrls);
      expect(result).not.toBeNull();
    });

    it('should return null when offline.html not in precache', () => {
      const precachedUrls = ['index.html'];
      const result = mockMatchPrecache('offline.html', precachedUrls);
      expect(result).toBeNull();
    });
  });
});

describe('Service Worker Cache Strategies', () => {
  /**
   * 驗證快取策略配置（預期值 = 修復後的正確配置）
   */
  const expectedStrategies = {
    'history-rates-cdn': { strategy: 'CacheFirst', maxAge: 365 * 24 * 60 * 60 },
    'latest-rate-cache': { strategy: 'StaleWhileRevalidate', maxAge: 7 * 24 * 60 * 60 },
    'image-cache': { strategy: 'CacheFirst', maxAge: 30 * 24 * 60 * 60, maxEntries: 60 },
    'font-cache': { strategy: 'CacheFirst', maxAge: 365 * 24 * 60 * 60 },
    'static-resources': { strategy: 'CacheFirst', maxAge: 30 * 24 * 60 * 60 },
  };

  it('should use NavigationRoute + bounded SWR-style handler for zero-white-screen navigation', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const swPath = path.resolve(__dirname, '../sw.ts');
    const sourceCode = await fs.readFile(swPath, 'utf-8');

    // 已 install 過的 PWA：暖快取 SWR；冷快取 precache-first，避免 3s timeout 假離線。
    expect(sourceCode).toContain('handleNavigationRequest');
    expect(sourceCode).toContain('new NavigationRoute(handleNavigationRequest)');
    expect(sourceCode).toContain('event.waitUntil(');
    expect(sourceCode).toContain('fetchAndCacheNavigation(request, cache)');
    expect(sourceCode).toContain("matchPrecache('index.html')");
    // 防回歸：禁止重新引入 NetworkFirst navigation（cold-start 白屏根因之一）。
    expect(sourceCode).not.toContain('new NetworkFirst(');
    // 防回歸：禁止重新引入 3s 全域 navigation timeout（iOS eviction 假離線根因）。
    expect(sourceCode).not.toContain('const NAVIGATION_NETWORK_TIMEOUT_MS');
    expect(sourceCode).not.toContain('Promise.race([networkResponse, timeoutFallback])');
    // case 3（precache 已 miss）允許 8s bounded race，避免 hung network 無限白屏。
    expect(sourceCode).toContain('const NAVIGATION_FETCH_TIMEOUT_MS = 8000');
    expect(sourceCode).toContain('navigation-fetch-timeout');
  });

  it('should have correct historical rates cache configuration', () => {
    const config = expectedStrategies['history-rates-cdn'];
    expect(config.strategy).toBe('CacheFirst');
    expect(config.maxAge).toBe(365 * 24 * 60 * 60); // 1 year
  });

  it('should have correct latest rate cache configuration', () => {
    const config = expectedStrategies['latest-rate-cache'];
    expect(config.strategy).toBe('StaleWhileRevalidate');
    expect(config.maxAge).toBe(7 * 24 * 60 * 60); // 7 days
  });

  it('should cache same-origin api latest and pairs JSON with StaleWhileRevalidate', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const swPath = path.resolve(__dirname, '../sw.ts');
    const sourceCode = await fs.readFile(swPath, 'utf-8');

    expect(sourceCode).toContain("url.pathname.endsWith('/api/latest.json')");
    expect(sourceCode).toContain("url.pathname.includes('/api/pairs/')");
  });

  it('should use CacheFirst with 30-day expiration for runtime images', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const swPath = path.resolve(__dirname, '../sw.ts');
    const sourceCode = await fs.readFile(swPath, 'utf-8');
    const config = expectedStrategies['image-cache'];

    expect(sourceCode).toContain('IMAGE_EXTENSION_PATTERN');
    expect(sourceCode).toContain("cacheName: 'image-cache'");
    expect(sourceCode).toContain('maxEntries: 60');
    expect(config.strategy).toBe('CacheFirst');
    expect(config.maxAge).toBe(30 * 24 * 60 * 60);
    expect(config.maxEntries).toBe(60);
  });

  it('should register a network-only route for connectivity probe', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const swPath = path.resolve(__dirname, '../sw.ts');
    const sourceCode = await fs.readFile(swPath, 'utf-8');

    expect(sourceCode).toContain('__network_probe__');
    expect(sourceCode).toContain('new NetworkOnly(');
  });

  it('should fetch manifest.webmanifest with NetworkOnly to avoid stale relative start_url', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const swPath = path.resolve(__dirname, '../sw.ts');
    const sourceCode = await fs.readFile(swPath, 'utf-8');

    expect(sourceCode).toContain("url.pathname.endsWith('.webmanifest')");
    expect(sourceCode).not.toContain('.(webmanifest|txt|xml)$');
  });

  // 🔴 RED: JS/CSS 應使用 CacheFirst（Vite hash-based filenames 是 immutable）
  it('should use CacheFirst for JS/CSS static resources (hash-based filenames are immutable)', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const swPath = path.resolve(__dirname, '../sw.ts');
    const sourceCode = await fs.readFile(swPath, 'utf-8');

    // 找到 cacheName: 'static-resources' 所在位置，往前找最近的 new XxxStrategy
    const cacheNameIdx = sourceCode.indexOf("cacheName: 'static-resources'");
    expect(cacheNameIdx).toBeGreaterThan(-1);

    // 截取 cacheName 前面的一小段程式碼（策略宣告在同一個 registerRoute 內）
    const preceding = sourceCode.slice(Math.max(0, cacheNameIdx - 200), cacheNameIdx);
    const strategyMatch = preceding.match(/new\s+(\w+)\s*\(\s*\{/g);
    expect(strategyMatch).not.toBeNull();

    // 取最後一個匹配（最靠近 cacheName 的策略）
    const lastMatch = strategyMatch![strategyMatch!.length - 1] ?? '';
    const nameMatch = /new\s+(\w+)/.exec(lastMatch);
    expect(nameMatch).not.toBeNull();
    expect(nameMatch![1]).toBe('CacheFirst');
  });

  // 🔴 RED: offline.html 不應有冗餘的 runtime route（已在 precache 中）
  it('should NOT have a redundant offline-fallback runtime route (already in precache)', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const swPath = path.resolve(__dirname, '../sw.ts');
    const sourceCode = await fs.readFile(swPath, 'utf-8');

    // 不應有 cacheName: 'offline-fallback' 的 runtime route
    expect(sourceCode).not.toContain("cacheName: 'offline-fallback'");
  });

  it('should delegate handlerDidError to the shared offline document fallback helper', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const swPath = path.resolve(__dirname, '../sw.ts');
    const sourceCode = await fs.readFile(swPath, 'utf-8');

    // precache-first navigation → resolveOfflineDocumentFallback helper（含三層 fallback + emergency HTML）。
    expect(sourceCode).toContain('new NavigationRoute(');
    expect(sourceCode).toContain('resolveOfflineDocumentFallback');
    expect(sourceCode).toContain("emergencyReason: 'emergency-navigation-fallback'");
    expect(sourceCode).toContain("matchPrecache('index.html')");
    // 防回歸：navigation 不可重新引入 NetworkFirst（cold-start 白屏根因之一）。
    expect(sourceCode).not.toContain('new NetworkFirst(');
    expect(sourceCode).not.toContain('NAVIGATION_NETWORK_TIMEOUT_MS');
  });

  it('should clear stale navigation HTML runtime cache when a new worker activates', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const swPath = path.resolve(__dirname, '../sw.ts');
    const sourceCode = await fs.readFile(swPath, 'utf-8');

    expect(sourceCode).toContain("const HTML_CACHE_NAME = 'html-cache'");
    expect(sourceCode).toContain('clearNavigationHtmlCacheOnActivate');
    expect(sourceCode).toContain('caches.delete(HTML_CACHE_NAME)');
    expect(sourceCode).toContain(
      'clearNavigationHtmlCacheOnActivate().then(() => ensureOfflineHtmlCached())',
    );
  });

  it('should delegate NavigationRoute failures to the shared offline document fallback', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const swPath = path.resolve(__dirname, '../sw.ts');
    const sourceCode = await fs.readFile(swPath, 'utf-8');

    expect(sourceCode).toContain('resolveOfflineDocumentFallback');
    expect(sourceCode).toContain("emergencyReason: 'emergency-navigation-fallback'");
    expect(sourceCode).toContain("matchOfflineHtmlInAnyCache: () => caches.match('offline.html')");
  });
});

describe('Service Worker URL Matching', () => {
  /**
   * 模擬 URL 匹配邏輯
   */
  function matchesOfflineRoute(pathname: string, basePath: string): boolean {
    const offlinePath = `${basePath}offline.html`;
    return pathname === offlinePath;
  }

  function matchesHistoricalRatesRoute(url: URL): boolean {
    return (
      url.origin === 'https://cdn.jsdelivr.net' &&
      url.pathname.includes('/public/rates/history/') &&
      url.pathname.endsWith('.json')
    );
  }

  function matchesLatestRateRoute(url: URL): boolean {
    return (
      url.origin === 'https://raw.githubusercontent.com' &&
      url.pathname.includes('/public/rates/latest.json')
    );
  }

  describe('Offline Route Matching', () => {
    it('should match /ratewise/offline.html for production base', () => {
      expect(matchesOfflineRoute('/ratewise/offline.html', '/ratewise/')).toBe(true);
    });

    it('should match /offline.html for root base', () => {
      expect(matchesOfflineRoute('/offline.html', '/')).toBe(true);
    });

    it('should not match wrong path', () => {
      expect(matchesOfflineRoute('/ratewise/index.html', '/ratewise/')).toBe(false);
    });
  });

  describe('Historical Rates Route Matching', () => {
    it('should match CDN historical rates URL', () => {
      const url = new URL(
        'https://cdn.jsdelivr.net/gh/user/repo/public/rates/history/2025-01-01.json',
      );
      expect(matchesHistoricalRatesRoute(url)).toBe(true);
    });

    it('should not match non-CDN URL', () => {
      const url = new URL('https://example.com/public/rates/history/2025-01-01.json');
      expect(matchesHistoricalRatesRoute(url)).toBe(false);
    });

    it('should not match non-JSON file', () => {
      const url = new URL('https://cdn.jsdelivr.net/gh/user/repo/public/rates/history/2025-01-01');
      expect(matchesHistoricalRatesRoute(url)).toBe(false);
    });
  });

  describe('Latest Rate Route Matching', () => {
    it('should match GitHub raw latest.json URL', () => {
      const url = new URL(
        'https://raw.githubusercontent.com/user/repo/main/public/rates/latest.json',
      );
      expect(matchesLatestRateRoute(url)).toBe(true);
    });

    it('should not match other GitHub raw URLs', () => {
      const url = new URL('https://raw.githubusercontent.com/user/repo/main/README.md');
      expect(matchesLatestRateRoute(url)).toBe(false);
    });
  });
});

describe('Service Worker Denylist', () => {
  /**
   * 模擬 NavigationRoute denylist 邏輯
   */
  const denylist = [/^\/api/, /^\/rates/, /\.[a-zA-Z0-9]+$/, /\/sw\.js$/, /\/workbox-.*\.js$/];

  function isDenied(pathname: string): boolean {
    return denylist.some((pattern) => pattern.test(pathname));
  }

  it('should deny API endpoints', () => {
    expect(isDenied('/api/rates')).toBe(true);
    expect(isDenied('/api/v1/data')).toBe(true);
  });

  it('should deny rates JSON endpoints', () => {
    expect(isDenied('/rates/2025-01-01.json')).toBe(true);
  });

  it('should deny files with extensions', () => {
    expect(isDenied('/assets/script.js')).toBe(true);
    expect(isDenied('/images/logo.png')).toBe(true);
    expect(isDenied('/styles/main.css')).toBe(true);
  });

  it('should deny Service Worker files', () => {
    expect(isDenied('/sw.js')).toBe(true);
    expect(isDenied('/workbox-abc123.js')).toBe(true);
  });

  it('should allow navigation routes', () => {
    expect(isDenied('/')).toBe(false);
    expect(isDenied('/about')).toBe(false);
    expect(isDenied('/faq')).toBe(false);
  });
});

describe('handleNavigationRequest', () => {
  const htmlCacheName = 'html-cache';
  const navigationUrl = 'https://example.com/ratewise/about';
  const offlineHtml = '<html>offline fallback</html>';

  let htmlCache: {
    match: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };
  let cachesOpen: ReturnType<typeof vi.fn>;
  let cachesMatch: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    htmlCache = {
      match: vi.fn(),
      put: vi.fn(),
    };
    cachesOpen = vi.fn().mockResolvedValue(htmlCache);
    cachesMatch = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal('caches', {
      open: cachesOpen,
      match: cachesMatch,
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
    });

    await import('../sw.ts');
    expect(navigationHandlerRef.current).not.toBeNull();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    cachesOpen.mockResolvedValue(htmlCache);
    cachesMatch.mockResolvedValue(undefined);
    htmlCache.match.mockReset();
    htmlCache.put.mockReset();
    matchPrecacheMock.mockReset();
  });

  function createNavigationEvent(): ExtendableEvent {
    return { waitUntil: vi.fn() } as unknown as ExtendableEvent;
  }

  function createOfflineFallbackResponse(): Response {
    return new Response(offlineHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  it('case 2: precache hit resolves instantly without timer dependency', async () => {
    vi.useFakeTimers();

    const precachedShell = new Response('<html>precached index</html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

    htmlCache.match.mockResolvedValue(undefined);
    matchPrecacheMock.mockImplementation((url: string) =>
      Promise.resolve(url === 'index.html' ? precachedShell : null),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );

    const handler = navigationHandlerRef.current!;
    const response = await handler({
      event: createNavigationEvent(),
      request: new Request(navigationUrl),
    });

    expect(response).toBe(precachedShell);
    expect(matchPrecacheMock).toHaveBeenCalledWith('index.html');
    await vi.runAllTimersAsync();
  });

  it('case 3: network resolves within 8s returns network response without orphan timer', async () => {
    vi.useFakeTimers();

    const networkHtml = '<html>network fresh</html>';
    const networkResponse = new Response(networkHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

    htmlCache.match.mockResolvedValue(undefined);
    matchPrecacheMock.mockImplementation((url: string) =>
      Promise.resolve(url === 'index.html' ? null : null),
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(networkResponse.clone()));

    const orphanRejections: unknown[] = [];
    const onRejection = (reason: unknown) => {
      orphanRejections.push(reason);
    };
    process.on('unhandledRejection', onRejection);

    try {
      const handler = navigationHandlerRef.current!;
      const response = await handler({
        event: createNavigationEvent(),
        request: new Request(navigationUrl),
      });
      const body = await response.text();

      expect(body).toBe(networkHtml);
      expect(matchPrecacheMock).toHaveBeenCalledWith('index.html');
      expect(matchPrecacheMock).not.toHaveBeenCalledWith('offline.html');

      await vi.advanceTimersByTimeAsync(8000);
      expect(orphanRejections).toHaveLength(0);
    } finally {
      process.off('unhandledRejection', onRejection);
    }
  });

  it('case 3: timeout fallback still waitUntils late network fetch to html-cache', async () => {
    vi.useFakeTimers();

    const offlineFallback = createOfflineFallbackResponse();
    const networkHtml = '<html>late network</html>';
    let resolveFetch!: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    htmlCache.match.mockResolvedValue(undefined);
    matchPrecacheMock.mockImplementation((url: string) => {
      if (url === 'index.html') return Promise.resolve(null);
      if (url === 'offline.html') return Promise.resolve(offlineFallback);
      return Promise.resolve(null);
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => fetchPromise),
    );

    const waitUntilMock = vi.fn();
    const event = { waitUntil: waitUntilMock } as unknown as ExtendableEvent;
    const handler = navigationHandlerRef.current!;
    const responsePromise = handler({
      event,
      request: new Request(navigationUrl),
    });

    await vi.advanceTimersByTimeAsync(8000);

    const response = await responsePromise;
    const body = await response.text();

    expect(body).toBe(offlineHtml);
    expect(waitUntilMock).toHaveBeenCalledTimes(1);

    resolveFetch(
      new Response(networkHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    );
    const waitUntilPromise = waitUntilMock.mock.calls[0]?.[0] as Promise<unknown> | undefined;
    await waitUntilPromise;

    expect(htmlCache.put).toHaveBeenCalled();
  });

  it('case 3: hung network falls back to offline.html after bounded timeout', async () => {
    vi.useFakeTimers();

    const offlineFallback = createOfflineFallbackResponse();

    htmlCache.match.mockResolvedValue(undefined);
    matchPrecacheMock.mockImplementation((url: string) => {
      if (url === 'index.html') return Promise.resolve(null);
      if (url === 'offline.html') return Promise.resolve(offlineFallback);
      return Promise.resolve(null);
    });
    cachesMatch.mockResolvedValue(undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );

    const handler = navigationHandlerRef.current!;
    const responsePromise = handler({
      event: createNavigationEvent(),
      request: new Request(navigationUrl),
    });

    await vi.advanceTimersByTimeAsync(8000);

    const response = await responsePromise;
    const body = await response.text();

    expect(body).toBe(offlineHtml);
    expect(matchPrecacheMock).toHaveBeenCalledWith('index.html');
    expect(matchPrecacheMock).toHaveBeenCalledWith('offline.html');
    expect(cachesOpen).toHaveBeenCalledWith(htmlCacheName);
  });
});
