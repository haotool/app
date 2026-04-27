import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// @ts-expect-error Worker 由 Cloudflare runtime 執行，這裡以整合測試方式直接匯入 JS 檔。
import worker from '../../../../security-headers/src/worker.js';

class MockElement {
  constructor(private readonly element: Element) {}

  getAttribute(name: string) {
    return this.element.getAttribute(name);
  }

  setAttribute(name: string, value: string) {
    this.element.setAttribute(name, value);
  }
}

class MockHTMLRewriter {
  private readonly handlers: {
    selector: string;
    handler: { element?: (element: MockElement) => void };
  }[] = [];

  on(selector: string, handler: { element?: (element: MockElement) => void }) {
    this.handlers.push({ selector, handler });
    return this;
  }

  transform(response: Response) {
    const handlers = [...this.handlers];

    return new Response(
      new ReadableStream({
        async start(controller) {
          const html = await response.text();
          const document = new DOMParser().parseFromString(html, 'text/html');

          handlers.forEach(({ selector, handler }) => {
            if (!handler.element) return;

            const matchedElements = document.querySelectorAll(selector) as NodeListOf<Element>;
            matchedElements.forEach((element) => {
              handler.element?.(new MockElement(element));
            });
          });

          const serializedHtml = `<!DOCTYPE html>${document.documentElement.outerHTML}`;
          controller.enqueue(new TextEncoder().encode(serializedHtml));
          controller.close();
        },
      }),
      response,
    );
  }
}

const originalFetch = globalThis.fetch;

function createHtmlResponse(html: string) {
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
}

describe('security-headers worker', () => {
  beforeEach(() => {
    vi.stubGlobal('HTMLRewriter', MockHTMLRewriter);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('為 HTML 頁面產生 nonce 型 CSP，並只為 inline script 注入 nonce', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      createHtmlResponse(`<!doctype html>
<html>
  <head>
    <script type="application/ld+json">{"@context":"https://schema.org"}</script>
    <script src="/ratewise/assets/app-abcdef.js"></script>
  </head>
  <body>
    <script>window.__staticRouterHydrationData = {};</script>
  </body>
</html>`),
    );

    const response = await worker.fetch(new Request('https://app.haotool.org/ratewise/'));
    const csp = response.headers.get('content-security-policy') ?? '';
    const nonceMatch = csp.match(/'nonce-([^']+)'/);
    const scriptSrcDirective = csp.match(/script-src[^;]+/)?.[0] ?? '';
    const body = await response.text();

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).not.toContain('sha256-');
    expect(scriptSrcDirective).not.toContain("'unsafe-inline'");
    expect(nonceMatch).not.toBeNull();
    expect(body.match(/nonce="/g)).toHaveLength(2);
    expect(body).not.toMatch(/<script[^>]*src="\/ratewise\/assets\/app-abcdef\.js"[^>]*nonce="/);
    expect(response.headers.get('cross-origin-embedder-policy')).toBe('require-corp');
    expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin');
    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin');
  });

  it('CSP report 端點只接受 POST 且限制媒體型別', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const getResponse = await worker.fetch(
      new Request('https://app.haotool.org/ratewise/csp-report', {
        method: 'GET',
      }),
    );

    expect(getResponse.status).toBe(405);
    expect(getResponse.headers.get('allow')).toBe('POST');

    const invalidTypeResponse = await worker.fetch(
      new Request('https://app.haotool.org/ratewise/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'text/plain',
        },
        body: 'invalid',
      }),
    );

    expect(invalidTypeResponse.status).toBe(415);

    const validResponse = await worker.fetch(
      new Request('https://app.haotool.org/ratewise/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/csp-report',
        },
        body: '{"csp-report":{"effective-directive":"script-src"}}',
      }),
    );

    expect(validResponse.status).toBe(204);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('為 Park Keeper HTML 套用 geolocation 白名單與地圖資源 CSP', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createHtmlResponse(
          `<!doctype html><html><head><script>{"ok":true}</script></head><body></body></html>`,
        ),
      );

    const response = await worker.fetch(new Request('https://app.haotool.org/park-keeper/'));
    const csp = response.headers.get('content-security-policy') ?? '';

    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).toContain('https://unpkg.com');
    expect(csp).toContain('https://wmts.nlsc.gov.tw');
    expect(csp).toContain('https://*.basemaps.cartocdn.com');
    expect(response.headers.get('permissions-policy')).toContain('geolocation=(self)');
    expect(response.headers.get('permissions-policy')).toContain('accelerometer=(self)');
    expect(response.headers.get('permissions-policy')).toContain('gyroscope=(self)');
    expect(response.headers.get('permissions-policy')).toContain('magnetometer=(self)');
  });

  it('為 NihonName 保留 legacy inline script policy，直到 preload handoff 被清理', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createHtmlResponse('<!doctype html><html><head></head><body></body></html>'),
      );

    const response = await worker.fetch(new Request('https://app.haotool.org/nihonname/'));
    const csp = response.headers.get('content-security-policy') ?? '';

    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://www.transparenttextures.com');
  });

  it('為 Quake School 保留 legacy inline script policy，避免 onload preload 斷線', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createHtmlResponse('<!doctype html><html><head></head><body></body></html>'),
      );

    const response = await worker.fetch(new Request('https://app.haotool.org/quake-school/'));
    const csp = response.headers.get('content-security-policy') ?? '';

    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain('https://fonts.googleapis.com');
  });

  it('未定義專屬 profile 的 app 路徑應保留 fallback CSP，避免 legacy 遠端頭像被誤擋', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createHtmlResponse('<!doctype html><html><head></head><body></body></html>'),
      );

    const response = await worker.fetch(new Request('https://app.haotool.org/split-meow/'));
    const csp = response.headers.get('content-security-policy') ?? '';

    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain('img-src');
    expect(csp).toContain('https:');
    expect(csp).toContain('https://unpkg.com');
  });

  it('root host 的首頁接受 markdown negotiation 時應導向 root markdown mirror', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response('# haotool markdown mirror', {
        headers: {
          'content-type': 'text/markdown; charset=utf-8',
        },
      }),
    );
    globalThis.fetch = fetchSpy;

    const response = await worker.fetch(
      new Request('https://app.haotool.org/', {
        headers: {
          accept: 'text/markdown',
        },
      }),
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://app.haotool.org/index.md',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(response.headers.get('content-type')).toContain('text/markdown');
  });

  it('root HTML 首頁應輸出 agent discovery Link headers 且不得誤指向 ratewise markdown', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createHtmlResponse('<!doctype html><html><head></head><body>haotool root</body></html>'),
      );

    const response = await worker.fetch(new Request('https://app.haotool.org/'));
    const link = response.headers.get('link') ?? '';

    expect(link).toContain(
      '<https://app.haotool.org/index.md>; rel="alternate"; type="text/markdown"',
    );
    expect(link).toContain(
      '<https://app.haotool.org/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
    );
    expect(link).toContain(
      '<https://app.haotool.org/.well-known/agent-skills/index.json>; rel="service-desc"; type="application/json"',
    );
    expect(link).not.toContain('/ratewise/index.md');
  });

  it('ratewise 首頁接受 markdown negotiation 時應導向對應 mirror', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response('# ratewise markdown mirror', {
        headers: {
          'content-type': 'text/markdown; charset=utf-8',
        },
      }),
    );
    globalThis.fetch = fetchSpy;

    const response = await worker.fetch(
      new Request('https://app.haotool.org/ratewise/', {
        headers: {
          accept: 'text/markdown',
        },
      }),
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://app.haotool.org/ratewise/index.md',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(response.headers.get('content-type')).toContain('text/markdown');
  });

  it('root API catalog 應輸出 RFC 9727 linkset JSON', async () => {
    globalThis.fetch = vi.fn();

    const response = await worker.fetch(
      new Request('https://app.haotool.org/.well-known/api-catalog', {
        headers: {
          accept: 'application/linkset+json, application/json',
        },
      }),
    );
    const catalog = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/linkset+json');
    expect(catalog.linkset).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          anchor: 'https://app.haotool.org/ratewise/',
          'service-desc': expect.arrayContaining([
            expect.objectContaining({
              href: 'https://app.haotool.org/ratewise/openapi.json',
            }),
          ]),
          'service-doc': expect.arrayContaining([
            expect.objectContaining({
              href: 'https://app.haotool.org/ratewise/open-data/',
            }),
          ]),
          status: expect.arrayContaining([
            expect.objectContaining({
              href: 'https://app.haotool.org/ratewise/__network_probe__',
            }),
          ]),
        }),
      ]),
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('root Agent Skills index 應輸出 v0.2.0 schema 與 sha256 digest', async () => {
    globalThis.fetch = vi.fn();

    const response = await worker.fetch(
      new Request('https://app.haotool.org/.well-known/agent-skills/index.json'),
    );
    const index = await response.json();

    expect(response.status).toBe(200);
    expect(index.$schema).toBe('https://schemas.agentskills.io/discovery/0.2.0/schema.json');
    expect(index.skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'haotool-discovery',
          type: 'skill-md',
          url: '/.well-known/agent-skills/haotool-discovery/SKILL.md',
          digest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        }),
        expect.objectContaining({
          name: 'ratewise-api',
          type: 'skill-md',
          url: '/.well-known/agent-skills/ratewise-api/SKILL.md',
          digest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        }),
      ]),
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('root Agent Skill artifact 應可直接讀取 Markdown', async () => {
    globalThis.fetch = vi.fn();

    const response = await worker.fetch(
      new Request('https://app.haotool.org/.well-known/agent-skills/haotool-discovery/SKILL.md'),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/markdown');
    expect(await response.text()).toContain('name: haotool-discovery');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('公開分享圖開放 CORS，所有 Vite hashed asset 一律 immutable', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('image-bytes', {
        headers: {
          'content-type': 'image/jpeg',
        },
      }),
    );

    const ogResponse = await worker.fetch(
      new Request('https://app.haotool.org/ratewise/og-image.jpg'),
    );

    expect(ogResponse.headers.get('access-control-allow-origin')).toBe('*');
    expect(ogResponse.headers.get('cross-origin-resource-policy')).toBe('cross-origin');

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('console.log("ok")', {
        headers: {
          'content-type': 'application/javascript',
        },
      }),
    );

    const assetResponse = await worker.fetch(
      new Request('https://app.haotool.org/nihonname/assets/app-Dfg5aO0c.js'),
    );

    expect(assetResponse.headers.get('cache-control')).toBe('max-age=31536000, public, immutable');
  });

  it('缺檔資產回傳 404 時必須 no-store，避免邊緣快取 stale 404', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('<!doctype html><html><body>Not Found</body></html>', {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      }),
    );

    const response = await worker.fetch(
      new Request('https://app.haotool.org/ratewise/assets/vendor-router-D21zu8CL.js'),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate');
    expect(response.headers.get('cdn-cache-control')).toBe('no-store');
    expect(response.headers.get('cloudflare-cdn-cache-control')).toBe('no-store');
    expect(response.headers.get('cross-origin-embedder-policy')).toBeNull();
    expect(response.headers.get('cross-origin-opener-policy')).toBeNull();
    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin');
  });

  it('改寫 root robots.txt 時必須移除條件式驗證 header 與過期 validators', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response('User-agent: *\nAllow: /\n', {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          etag: 'W/"origin-robots"',
          'last-modified': 'Sat, 25 Apr 2026 10:08:07 GMT',
          'cache-control': 'public, max-age=0, must-revalidate',
        },
      }),
    );
    globalThis.fetch = fetchSpy;

    const response = await worker.fetch(
      new Request('https://app.haotool.org/robots.txt', {
        headers: {
          'If-None-Match': 'W/"origin-robots"',
          'If-Modified-Since': 'Sat, 25 Apr 2026 10:08:07 GMT',
        },
      }),
    );

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const forwardedHeaders = new Headers(init?.headers);

    expect(forwardedHeaders.get('if-none-match')).toBeNull();
    expect(forwardedHeaders.get('if-modified-since')).toBeNull();
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Content-Signal: ai-train=no, search=yes, ai-input=no');
    expect(response.headers.get('etag')).toBeNull();
    expect(response.headers.get('last-modified')).toBeNull();
  });

  it('Wrangler route 必須覆蓋整個 app.haotool.org', () => {
    const wranglerConfig = readFileSync(
      resolve(process.cwd(), '../../security-headers/wrangler.jsonc'),
      'utf-8',
    );

    expect(wranglerConfig).toContain('"pattern": "app.haotool.org/*"');
  });

  it('www.haotool.org 應永久轉址到 apex，避免落到上游 404', async () => {
    globalThis.fetch = vi.fn();

    const response = await worker.fetch(
      new Request('https://www.haotool.org/projects/?ref=nav', {
        method: 'GET',
      }),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://haotool.org/projects/?ref=nav');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
