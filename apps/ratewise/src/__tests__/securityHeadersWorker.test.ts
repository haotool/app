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

  it('為 RateWise HTML 產生 nonce 型 CSP，並只為 inline script 注入 nonce', async () => {
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

  it('Wrangler route 必須覆蓋整個 app.haotool.org', () => {
    const wranglerConfig = readFileSync(
      resolve(process.cwd(), '../../security-headers/wrangler.jsonc'),
      'utf-8',
    );

    expect(wranglerConfig).toContain('"pattern": "app.haotool.org/*"');
  });
});
