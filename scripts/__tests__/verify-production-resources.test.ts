import { describe, expect, it } from 'vitest';
import {
  buildResourceInventory,
  probeResource,
  summarizeProbeResults,
} from '../verify-production-resources.mjs';

describe('verify-production-resources', () => {
  it('會從 app.config 的 seoFiles 與 images 自動展開完整 inventory', () => {
    const inventory = buildResourceInventory([
      {
        name: 'demo-app',
        config: {
          displayName: 'Demo App',
          siteUrl: 'https://example.com/demo',
          resources: {
            seoFiles: ['/sitemap.xml', 'robots.txt'],
            images: ['/og-image.png'],
          },
        },
      },
    ]);

    expect(inventory).toEqual([
      {
        app: 'demo-app',
        displayName: 'Demo App',
        type: 'seo',
        path: '/sitemap.xml',
        url: 'https://example.com/demo/sitemap.xml',
      },
      {
        app: 'demo-app',
        displayName: 'Demo App',
        type: 'seo',
        path: '/robots.txt',
        url: 'https://example.com/demo/robots.txt',
      },
      {
        app: 'demo-app',
        displayName: 'Demo App',
        type: 'image',
        path: '/og-image.png',
        url: 'https://example.com/demo/og-image.png',
      },
    ]);
  });

  it('HEAD 回 405 時會自動退回 GET 判定資源可用性', async () => {
    const calls: string[] = [];
    const resource = {
      app: 'demo-app',
      displayName: 'Demo App',
      type: 'seo',
      path: '/robots.txt',
      url: 'https://example.com/demo/robots.txt',
    };

    const result = await probeResource(resource, {
      fetchImpl: (_url: string, init?: RequestInit) => {
        calls.push(init?.method ?? 'GET');
        return Promise.resolve({
          status: init?.method === 'HEAD' ? 405 : 200,
        } as Response);
      },
    });

    expect(calls).toEqual(['HEAD', 'GET']);
    expect(result.outcome).toBe('200');
    expect(result.httpStatus).toBe(200);
  });

  it('逾時會分類為 timeout', async () => {
    const resource = {
      app: 'demo-app',
      displayName: 'Demo App',
      type: 'image',
      path: '/og-image.png',
      url: 'https://example.com/demo/og-image.png',
    };

    const result = await probeResource(resource, {
      timeoutMs: 5,
      fetchImpl: (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('Timed out');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    });

    expect(result.outcome).toBe('timeout');
    expect(result.httpStatus).toBeNull();
  });

  it('會正確彙總 200 / non200 / timeout 數量', () => {
    const summary = summarizeProbeResults([
      { outcome: '200' },
      { outcome: '200' },
      { outcome: 'non200' },
      { outcome: 'timeout' },
    ] as { outcome: '200' | 'non200' | 'timeout' }[]);

    expect(summary).toEqual({
      total: 4,
      200: 2,
      non200: 1,
      timeout: 1,
    });
  });
});
