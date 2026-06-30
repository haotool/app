import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_INFO } from '../../config/app-info';
import {
  resolveOfflineDocumentFallback,
  resolveOfflineStaticResourceFallback,
} from '../pwaOfflineFallback';

describe('pwaOfflineFallback', () => {
  it('should prefer cached index.html before offline fallbacks', async () => {
    const indexResponse = new Response('<html>app shell</html>');
    const matchPrecache = vi.fn((url: 'index.html' | 'offline.html') =>
      url === 'index.html' ? indexResponse : null,
    );
    const matchOfflineHtmlInAnyCache = vi.fn();

    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      matchPrecache,
      matchIndexHtmlInAnyCache: () => null,
      matchOfflineHtmlInAnyCache,
    });

    expect(response).toBe(indexResponse);
    expect(matchPrecache).toHaveBeenCalledWith('index.html');
    expect(matchPrecache).not.toHaveBeenCalledWith('offline.html');
    expect(matchOfflineHtmlInAnyCache).not.toHaveBeenCalled();
  });

  it('should fall back to index.html from any cache when precache is evicted', async () => {
    const anyCacheIndexResponse = new Response('<html>index from html-cache</html>');

    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      matchPrecache: () => null,
      matchIndexHtmlInAnyCache: () => anyCacheIndexResponse,
      matchOfflineHtmlInAnyCache: () => null,
    });

    expect(response).toBe(anyCacheIndexResponse);
  });

  it('should use precached offline.html when index.html is unavailable', async () => {
    const offlineResponse = new Response('<html>offline</html>');

    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      matchPrecache: (url) => (url === 'offline.html' ? offlineResponse : null),
      matchIndexHtmlInAnyCache: () => null,
      matchOfflineHtmlInAnyCache: () => null,
    });

    expect(response).toBe(offlineResponse);
  });

  it('should use any cached offline.html before emergency HTML', async () => {
    const anyCacheOfflineResponse = new Response('<html>offline from any cache</html>');

    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      matchPrecache: () => null,
      matchIndexHtmlInAnyCache: () => null,
      matchOfflineHtmlInAnyCache: () => anyCacheOfflineResponse,
    });

    expect(response).toBe(anyCacheOfflineResponse);
  });

  it('should return visible emergency HTML when all cache fallbacks are unavailable', async () => {
    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      matchPrecache: () => null,
      matchIndexHtmlInAnyCache: () => null,
      matchOfflineHtmlInAnyCache: () => null,
    });

    const html = await response.text();
    expect(html).toContain('data-ratewise-emergency-fallback="true"');
    expect(html).toContain(APP_INFO.name);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-RateWise-Offline-Fallback')).toBe(
      'emergency-navigation-fallback',
    );
    expect(response.headers.get('X-RateWise-Offline-Fallback')).not.toBeNull();
  });
});

describe('resolveOfflineStaticResourceFallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return exact caches.match(request) hit without calling matchPrecacheFn', async () => {
    const request = new Request('https://app.haotool.org/ratewise/assets/x.js');
    const exactResponse = new Response('exact');
    const cachesMatch = vi.fn().mockResolvedValue(exactResponse);
    vi.stubGlobal('caches', { match: cachesMatch });
    const matchPrecacheFn = vi.fn();

    const response = await resolveOfflineStaticResourceFallback(request, matchPrecacheFn);

    expect(response).toBe(exactResponse);
    expect(cachesMatch).toHaveBeenCalledTimes(1);
    expect(cachesMatch).toHaveBeenCalledWith(request);
    expect(matchPrecacheFn).not.toHaveBeenCalled();
  });

  it('should fall back to ignoreSearch match when exact match misses', async () => {
    const request = new Request('https://app.haotool.org/ratewise/assets/x.js?__WB_REVISION__=abc');
    const ignoreSearchResponse = new Response('ignore-search');
    const cachesMatch = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(ignoreSearchResponse);
    vi.stubGlobal('caches', { match: cachesMatch });
    const matchPrecacheFn = vi.fn();

    const response = await resolveOfflineStaticResourceFallback(request, matchPrecacheFn);

    expect(response).toBe(ignoreSearchResponse);
    expect(cachesMatch).toHaveBeenCalledTimes(2);
    expect(cachesMatch).toHaveBeenNthCalledWith(1, request);
    expect(cachesMatch).toHaveBeenNthCalledWith(2, 'https://app.haotool.org/ratewise/assets/x.js', {
      ignoreSearch: true,
    });
    expect(matchPrecacheFn).not.toHaveBeenCalled();
  });

  it('should fall back to matchPrecacheFn when caches layers miss', async () => {
    const request = new Request('https://app.haotool.org/ratewise/assets/x.js');
    const precacheResponse = new Response('precached');
    const cachesMatch = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('caches', { match: cachesMatch });
    const matchPrecacheFn = vi.fn((key: string) => (key === 'x.js' ? precacheResponse : null));

    const response = await resolveOfflineStaticResourceFallback(request, matchPrecacheFn);

    expect(response).toBe(precacheResponse);
    expect(matchPrecacheFn.mock.calls.map(([key]) => key)).toEqual([
      'ratewise/assets/x.js',
      'assets/x.js',
      'x.js',
    ]);
  });

  it('should return Response.error() when all fallback layers miss', async () => {
    const request = new Request('https://app.haotool.org/ratewise/assets/x.js');
    const cachesMatch = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('caches', { match: cachesMatch });
    const matchPrecacheFn = vi.fn().mockResolvedValue(null);

    const response = await resolveOfflineStaticResourceFallback(request, matchPrecacheFn);

    expect(response.type).toBe('error');
  });
});
