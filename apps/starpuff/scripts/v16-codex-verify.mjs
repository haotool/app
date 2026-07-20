// v16 P1-01/F-03 圖鑑分頁截圖：854／1200／直持 390×844 三視口 × 技能/成就分頁。
// 用法：SP_DEV_PORT=3016 node scripts/v16-codex-verify.mjs <prefix>
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const port = process.env.SP_DEV_PORT || '3016';
const prefix = process.argv[2] || 'codex';
const outDir = new URL('../../../screenshots/starpuff-v16/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { name: '854', width: 854, height: 480 },
  { name: '1200', width: 1200, height: 480 },
  { name: 'portrait', width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  for (const tab of ['skills', 'achievements']) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: true,
    });
    await page.addInitScript(() => {
      localStorage.setItem('sp-rotation-notice', '1');
      localStorage.setItem('sp-install-dismissed', '1');
    });
    await page.goto(`http://localhost:${port}/`);
    await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
    if (tab === 'skills') {
      await page
        .locator('[data-menu="skills"]')
        .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
    } else {
      await page
        .locator('[data-menu="codex"]')
        .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
      await page.waitForFunction(() => window.__sp?.scene?.() === 'Codex');
      await page
        .locator('[data-menu="tab-achievements"]')
        .dispatchEvent('pointerdown', { pointerId: 5, isPrimary: true });
    }
    await page.waitForFunction((t) => window.__sp?.codexTab?.() === t, tab);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${outDir}${prefix}-${tab}-${vp.name}.png` });
    await page.close();
  }
}
await browser.close();
console.log(`截圖輸出：${outDir}（prefix=${prefix}）`);
