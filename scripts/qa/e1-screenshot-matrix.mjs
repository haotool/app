/**
 * E1 截圖矩陣：{首頁, /multi, /settings} × {zen, nitro, kawaii} × {390×844, 375×667}。
 * 同時蒐集 console error（閘門要求 0）。輸出至 repo 根 screenshots/。
 * 用法：node scripts/qa/e1-screenshot-matrix.mjs（需先啟動 preview :4173）
 */

import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(ROOT, 'screenshots');
const BASE = process.env.BASE_URL ?? 'http://localhost:4173';

const PAGES = [
  ['home', '/ratewise/'],
  ['multi', '/ratewise/multi/'],
  ['settings', '/ratewise/settings/'],
];
const THEMES = ['zen', 'nitro', 'kawaii'];
const VIEWPORTS = [
  [390, 844],
  [375, 667],
];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const consoleErrors = [];

for (const theme of THEMES) {
  for (const [width, height] of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await context.addInitScript((style) => {
      localStorage.setItem('ratewise-theme', JSON.stringify({ style }));
      // 跳過啟動畫面等待，穩定截圖內容。
      sessionStorage.setItem('ratewise:splash-shown', '1');
    }, theme);

    for (const [name, path] of PAGES) {
      const page = await context.newPage();
      const label = `${name}-${theme}-${width}x${height}`;
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(`[${label}] ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => {
        consoleErrors.push(`[${label}] pageerror: ${error.message}`);
      });

      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: join(OUT_DIR, `e1-${label}.png`) });
      await page.close();
      console.log(`captured e1-${label}.png`);
    }
    await context.close();
  }
}

await browser.close();

// 已知基線問題（基底 18834c58 同樣出現，與 E1 無關）：SSG hydration React #418。
// 證據：對照 worktree 於基底 commit build+preview，首頁/設定頁皆出現同一錯誤。
const KNOWN_BASELINE = /Minified React error #418/;
const newErrors = consoleErrors.filter((entry) => !KNOWN_BASELINE.test(entry));
const baselineErrors = consoleErrors.length - newErrors.length;

console.log(`\nknown baseline hydration #418 occurrences: ${baselineErrors}`);
if (newErrors.length > 0) {
  console.error(`console errors (excluding known baseline): ${newErrors.length}`);
  for (const entry of newErrors) console.error(entry);
  process.exit(1);
}
console.log('console errors (excluding known baseline): 0');
