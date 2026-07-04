/**
 * 品牌啟動頁（rw-splash）啟動順序測試（Plan 015）
 *
 * 驗證三件事：
 * 1. 無 JS 視角（原始 HTML）：splash 元素帶 hidden 屬性，爬蟲完全看不到（SEO 隱形核心機制）。
 * 2. 有 JS 首次載入：DOMContentLoaded 時 splash 已顯示（同步 inline script 於首次 paint 前移除
 *    hidden）；app ready 後 splash 自 DOM 移除，sessionStorage 旗標寫入。
 * 3. 同 session 二次載入：splash 維持 hidden，不再顯示。
 *
 * @see apps/ratewise/index.html - rw-splash 標記與同步 inline script
 * @created 2026-07-04
 */

import { test, expect } from '@playwright/test';

const BASE_PATH =
  process.env['E2E_BASE_PATH'] || process.env['VITE_RATEWISE_BASE_PATH'] || '/ratewise';
const HOME_PATH = `${BASE_PATH}/`.replace(/\/+$/, '/');

declare global {
  interface Window {
    __splashAtDCL?: {
      exists: boolean;
      hidden: boolean;
      display: string;
    };
  }
}

test.describe('品牌啟動頁 rw-splash', () => {
  test('無 JS 視角：原始 HTML 中 splash 帶 hidden 屬性', async ({ request }) => {
    const response = await request.get(HOME_PATH);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    // hidden 屬性必須存在於原始標記，確保爬蟲/noscript 環境不可見。
    expect(html).toMatch(/<div id="rw-splash"[^>]*\bhidden\b/);
  });

  test('首次載入：DCL 時 splash 可見，app ready 後移除並寫入 session 旗標', async ({ page }) => {
    // 在任何頁面 script 前註冊：於 DOMContentLoaded 快照 splash 狀態。
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('rw-splash');
        window.__splashAtDCL = el
          ? {
              exists: true,
              hidden: el.hasAttribute('hidden'),
              display: getComputedStyle(el).display,
            }
          : { exists: false, hidden: false, display: '' };
      });
    });

    await page.goto(HOME_PATH);

    // DCL 快照：splash 存在、hidden 已被同步 script 移除、display 為 flex（可見）。
    const atDCL = await page.evaluate(() => window.__splashAtDCL);
    expect(atDCL?.exists).toBe(true);
    expect(atDCL?.hidden).toBe(false);
    expect(atDCL?.display).toBe('flex');

    // app ready 後 splash 應自 DOM 移除（含 2500ms 硬上限保護）。
    await page.waitForFunction(() => !document.getElementById('rw-splash'), undefined, {
      timeout: 10_000,
    });

    const state = await page.evaluate(() => ({
      sessionFlag: sessionStorage.getItem('rw-splash-shown'),
      appReady: document.documentElement.getAttribute('data-ratewise-app-ready'),
    }));
    expect(state.sessionFlag).toBe('1');
  });

  test('偏好關閉（ratewise-splash-enabled=0）時 splash 維持 hidden 不顯示', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ratewise-splash-enabled', '0');
      document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('rw-splash');
        window.__splashAtDCL = el
          ? {
              exists: true,
              hidden: el.hasAttribute('hidden'),
              display: getComputedStyle(el).display,
            }
          : { exists: false, hidden: false, display: '' };
      });
    });
    await page.goto(HOME_PATH);

    // 設定頁開關關閉 → inline splash 不得顯示（偏好 SSOT 對齊 React 版）。
    const atDCL = await page.evaluate(() => window.__splashAtDCL);
    expect(atDCL?.exists).toBe(true);
    expect(atDCL?.hidden).toBe(true);
    expect(atDCL?.display).toBe('none');
  });

  test('首次載入視覺 parity：inline splash 使用共用 .ratewise-splash 樣式與動畫 class', async ({
    page,
  }) => {
    await page.goto(HOME_PATH, { waitUntil: 'commit' });
    // 於 splash 尚未被 app-ready 移除前取樣（2500ms 硬上限內）。
    const parity = await page.evaluate(() => {
      const el = document.getElementById('rw-splash');
      if (!el) return null;
      return {
        classes: el.className,
        phase: el.getAttribute('data-phase'),
        hasCoinSolid: Boolean(el.querySelector('.splash-coin-solid')),
        hasCoinRing: Boolean(el.querySelector('.splash-coin-ring')),
        hasWordmark: Boolean(el.querySelector('.brand-wordmark.splash-wordmark')),
        hasTagline: Boolean(el.querySelector('.splash-tagline.brand-subtitle')),
      };
    });
    // splash 可能已被 app-ready 移除（載入極快時）；存在時必須符合 parity 結構。
    if (parity) {
      expect(parity.classes).toContain('ratewise-splash');
      expect(parity.phase === 'enter' || parity.phase === 'exit').toBe(true);
      expect(parity.hasCoinSolid).toBe(true);
      expect(parity.hasCoinRing).toBe(true);
      expect(parity.hasWordmark).toBe(true);
      expect(parity.hasTagline).toBe(true);
    } else {
      // 已移除代表 inline script 有執行；session 旗標必須已寫入。
      const flag = await page.evaluate(() => sessionStorage.getItem('rw-splash-shown'));
      expect(flag).toBe('1');
    }
  });

  test('同 session 二次載入：splash 維持 hidden 不再顯示', async ({ page }) => {
    await page.goto(HOME_PATH);
    await page.waitForFunction(() => !document.getElementById('rw-splash'), undefined, {
      timeout: 10_000,
    });

    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('rw-splash');
        window.__splashAtDCL = el
          ? {
              exists: true,
              hidden: el.hasAttribute('hidden'),
              display: getComputedStyle(el).display,
            }
          : { exists: false, hidden: false, display: '' };
      });
    });
    await page.reload();

    // 二次載入：元素存在於靜態標記，但 hidden 未被移除（sessionStorage 旗標已存在）。
    const atDCL = await page.evaluate(() => window.__splashAtDCL);
    expect(atDCL?.exists).toBe(true);
    expect(atDCL?.hidden).toBe(true);
    expect(atDCL?.display).toBe('none');
  });
});
