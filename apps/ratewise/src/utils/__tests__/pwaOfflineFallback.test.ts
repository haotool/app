import { describe, expect, it, vi } from 'vitest';
import { APP_INFO } from '../../config/app-info';
import { resolveOfflineDocumentFallback } from '../pwaOfflineFallback';

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
      matchOfflineHtmlInAnyCache,
    });

    expect(response).toBe(indexResponse);
    expect(matchPrecache).toHaveBeenCalledWith('index.html');
    expect(matchPrecache).not.toHaveBeenCalledWith('offline.html');
    expect(matchOfflineHtmlInAnyCache).not.toHaveBeenCalled();
  });

  it('should use precached offline.html when index.html is unavailable', async () => {
    const offlineResponse = new Response('<html>offline</html>');

    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      matchPrecache: (url) => (url === 'offline.html' ? offlineResponse : null),
      matchOfflineHtmlInAnyCache: () => null,
    });

    expect(response).toBe(offlineResponse);
  });

  it('should use any cached offline.html before emergency HTML', async () => {
    const anyCacheOfflineResponse = new Response('<html>offline from any cache</html>');

    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      matchPrecache: () => null,
      matchOfflineHtmlInAnyCache: () => anyCacheOfflineResponse,
    });

    expect(response).toBe(anyCacheOfflineResponse);
  });

  it('should return visible emergency HTML when all cache fallbacks are unavailable', async () => {
    const response = await resolveOfflineDocumentFallback({
      emergencyReason: 'emergency-navigation-fallback',
      matchPrecache: () => null,
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
