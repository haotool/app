import { describe, expect, it, vi } from 'vitest';
import { APP_INFO } from '../../config/app-info';
import { resolveOfflineDocumentFallback } from '../pwaOfflineFallback';

const TEST_SCOPE = 'https://example.com/ratewise/';

describe('pwaOfflineFallback', () => {
  it('should prefer cached index.html before emergency fallback', async () => {
    const indexResponse = new Response('<html>app shell</html>');
    const matchPrecache = vi.fn((url: 'index.html') =>
      url === 'index.html' ? indexResponse : null,
    );

    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      scope: TEST_SCOPE,
      matchPrecache,
    });

    expect(response).toBe(indexResponse);
    expect(matchPrecache).toHaveBeenCalledWith('index.html');
  });

  it('should fall back to index.html from any cache when precache is evicted', async () => {
    const anyCacheIndexResponse = new Response('<html>index from html-cache</html>');

    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      scope: TEST_SCOPE,
      matchPrecache: () => null,
      matchIndexHtmlInAnyCache: () => anyCacheIndexResponse,
    });

    expect(response).toBe(anyCacheIndexResponse);
  });

  it('should not serve offline.html when index.html is unavailable', async () => {
    const offlineResponse = new Response('<html>offline</html>');

    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      scope: TEST_SCOPE,
      matchPrecache: () => null,
      matchIndexHtmlInAnyCache: () => null,
    });

    expect(response).not.toBe(offlineResponse);
    const html = await response.text();
    expect(html).toContain('data-ratewise-emergency-fallback="true"');
  });

  it('should return visible emergency HTML when all app shell caches are unavailable', async () => {
    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      scope: TEST_SCOPE,
      matchPrecache: () => null,
      matchIndexHtmlInAnyCache: () => null,
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
