/**
 * E5 wave-D 截圖矩陣：三篇 Authority Guide＋AnswerCapsule 消費樣本頁
 * × {zen, nitro} × {390×844, 1440×900}，同時收集 console error（硬標準 0）。
 * 用法：node scripts/qa/capture-authority-guides.mjs <baseURL> <outDir>
 */

import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const baseURL = process.argv[2] ?? 'http://127.0.0.1:4173/ratewise/';
const outDir = process.argv[3] ?? 'screenshots';

const PAGES = [
  { slug: 'sell-rate-vs-mid-rate', path: 'sell-rate-vs-mid-rate/' },
  { slug: 'cash-vs-spot-rate', path: 'cash-vs-spot-rate/' },
  { slug: 'card-rate-guide', path: 'card-rate-guide/' },
  // AnswerCapsule E1 token 收斂的消費樣本頁。
  { slug: 'faq', path: 'faq/' },
  { slug: 'home', path: '' },
];

const THEMES = ['zen', 'nitro'];
const VIEWPORTS = [
  { width: 390, height: 844, suffix: '390x844', isMobile: true },
  { width: 1440, height: 900, suffix: '1440x900', isMobile: false },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const consoleErrors = [];

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    for (const { slug, path } of PAGES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 2,
        isMobile: viewport.isMobile,
        hasTouch: viewport.isMobile,
      });
      await context.addInitScript(
        ([style]) => {
          window.localStorage.setItem('ratewise-theme', JSON.stringify({ style }));
        },
        [theme],
      );
      const page = await context.newPage();
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push({
            theme,
            slug,
            viewport: viewport.suffix,
            text: message.text().slice(0, 300),
          });
        }
      });
      page.on('pageerror', (error) => {
        consoleErrors.push({
          theme,
          slug,
          viewport: viewport.suffix,
          text: `pageerror: ${String(error).slice(0, 300)}`,
        });
      });
      await page.goto(new URL(path, baseURL).toString(), { waitUntil: 'load', timeout: 30_000 });
      await page.waitForTimeout(1_500);
      await page.screenshot({
        path: `${outDir}/e5d-${slug}-${theme}-${viewport.suffix}.png`,
        fullPage: false,
      });
      await context.close();
    }
  }
}

await browser.close();

console.log(`console errors: ${consoleErrors.length}`);
for (const entry of consoleErrors) {
  console.log(`[${entry.theme}/${entry.viewport}] ${entry.slug}: ${entry.text}`);
}
process.exit(consoleErrors.length > 0 ? 1 : 0);
