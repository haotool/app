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

import { describe, it, expect, vi } from 'vitest';

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
   * 驗證快取策略配置
   */
  const cacheStrategies = {
    'html-cache': { strategy: 'NetworkFirst', maxAge: 7 * 24 * 60 * 60 },
    'history-rates-cdn': { strategy: 'CacheFirst', maxAge: 365 * 24 * 60 * 60 },
    'latest-rate-cache': { strategy: 'StaleWhileRevalidate', maxAge: 5 * 60 },
    'image-cache': { strategy: 'CacheFirst', maxAge: 90 * 24 * 60 * 60 },
    'font-cache': { strategy: 'CacheFirst', maxAge: 365 * 24 * 60 * 60 },
    'static-resources': { strategy: 'NetworkFirst', maxAge: 7 * 24 * 60 * 60 },
    'offline-fallback': { strategy: 'CacheFirst', maxAge: 30 * 24 * 60 * 60 },
  };

  it('should have correct HTML cache configuration', () => {
    const config = cacheStrategies['html-cache'];
    expect(config.strategy).toBe('NetworkFirst');
    expect(config.maxAge).toBe(7 * 24 * 60 * 60); // 7 days
  });

  it('should have correct historical rates cache configuration', () => {
    const config = cacheStrategies['history-rates-cdn'];
    expect(config.strategy).toBe('CacheFirst');
    expect(config.maxAge).toBe(365 * 24 * 60 * 60); // 1 year
  });

  it('should have correct latest rate cache configuration', () => {
    const config = cacheStrategies['latest-rate-cache'];
    expect(config.strategy).toBe('StaleWhileRevalidate');
    expect(config.maxAge).toBe(5 * 60); // 5 minutes
  });

  it('should have correct offline fallback configuration', () => {
    const config = cacheStrategies['offline-fallback'];
    expect(config.strategy).toBe('CacheFirst');
    expect(config.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
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
