/**
 * ssgFallbackGuard 測試
 *
 * 驗證 SPA fallback 快照（快照路由 ≠ 當前 URL）在 hydration 前被降級為 client render，
 * 而正確路由的快照維持 hydrate（issue #459 404／fallback React #418）。
 */

import { describe, it, expect, afterEach } from 'vitest';
import { isStaleSsgSnapshot, applySsgFallbackGuard } from '../ssgFallbackGuard';

function setupDom({
  marker,
  serverRendered = true,
}: {
  marker: string | null;
  serverRendered?: boolean;
}) {
  document.head.innerHTML = marker ? `<meta name="ssg-route" content="${marker}">` : '';
  document.body.innerHTML = `<div id="root"${serverRendered ? ' data-server-rendered="true"' : ''}><main>ssg content</main></div>`;
}

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

describe('isStaleSsgSnapshot', () => {
  it('路由相符（含 base 與尾斜線正規化）不判定 stale', () => {
    expect(isStaleSsgSnapshot('/faq/', '/ratewise/faq/', '/ratewise/')).toBe(false);
    expect(isStaleSsgSnapshot('/faq', '/ratewise/faq/', '/ratewise/')).toBe(false);
    expect(isStaleSsgSnapshot('/', '/ratewise/', '/ratewise/')).toBe(false);
    expect(isStaleSsgSnapshot('/usd-twd/100/', '/ratewise/usd-twd/100/', '/ratewise/')).toBe(false);
  });

  it('首頁快照被送到未知路徑（404 SPA fallback）判定 stale', () => {
    expect(isStaleSsgSnapshot('/', '/ratewise/definitely-not-a-page/', '/ratewise/')).toBe(true);
  });

  it('首頁快照被送到無尾斜線的既有路由（host fallback）判定 stale', () => {
    expect(isStaleSsgSnapshot('/', '/ratewise/multi', '/ratewise/')).toBe(true);
  });

  it('無標記（舊快取 HTML）採保守策略不介入', () => {
    expect(isStaleSsgSnapshot(null, '/ratewise/anything/', '/ratewise/')).toBe(false);
    expect(isStaleSsgSnapshot(undefined, '/ratewise/anything/', '/ratewise/')).toBe(false);
  });

  it('base 為根路徑時仍可正確比對', () => {
    expect(isStaleSsgSnapshot('/faq/', '/faq/', '/')).toBe(false);
    expect(isStaleSsgSnapshot('/', '/unknown/', '/')).toBe(true);
  });
});

describe('applySsgFallbackGuard', () => {
  it('stale 快照：清空 root 並移除 data-server-rendered（改走 client render）', () => {
    setupDom({ marker: '/' });
    window.history.replaceState(null, '', '/ratewise/definitely-not-a-page/');

    const applied = applySsgFallbackGuard('/ratewise/');

    expect(applied).toBe(true);
    const root = document.getElementById('root');
    expect(root?.hasAttribute('data-server-rendered')).toBe(false);
    expect(root?.childNodes.length).toBe(0);
  });

  it('路由相符：保留 SSG 內容與 data-server-rendered（維持 hydrate）', () => {
    setupDom({ marker: '/faq/' });
    window.history.replaceState(null, '', '/ratewise/faq/');

    const applied = applySsgFallbackGuard('/ratewise/');

    expect(applied).toBe(false);
    const root = document.getElementById('root');
    expect(root?.getAttribute('data-server-rendered')).toBe('true');
    expect(root?.textContent).toContain('ssg content');
  });

  it('無標記：不介入', () => {
    setupDom({ marker: null });
    window.history.replaceState(null, '', '/ratewise/definitely-not-a-page/');

    expect(applySsgFallbackGuard('/ratewise/')).toBe(false);
    expect(document.getElementById('root')?.getAttribute('data-server-rendered')).toBe('true');
  });
});
