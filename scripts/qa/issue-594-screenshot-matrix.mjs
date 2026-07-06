/**
 * issue #594 二階平板適配截圖矩陣：
 * {首頁 v1, 首頁 v2, guide, privacy, jpy-twd} × {768×1024, 1024×768, 1440×900, 390×844, 375×667}。
 * 同時蒐集 console error。輸出至 repo 根 screenshots/，檔名前綴由 PHASE 環境變數控制（before/after）。
 * 用法：PHASE=before node scripts/qa/issue-594-screenshot-matrix.mjs（需先啟動 preview :4173）
 */

import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(ROOT, 'screenshots');
const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const PHASE = process.env.PHASE ?? 'before';

const PAGES = [
  ['home-v1', '/ratewise/'],
  ['home-v2', '/ratewise/?converter=v2'],
  ['guide', '/ratewise/guide/'],
  ['privacy', '/ratewise/privacy/'],
  ['jpy-twd', '/ratewise/jpy-twd/'],
];
const VIEWPORTS = [
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [390, 844],
  [375, 667],
];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const consoleErrors = [];

for (const [width, height] of VIEWPORTS) {
  const isMobile = width < 768;
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile,
    hasTouch: isMobile,
    deviceScaleFactor: 2,
  });
  await context.addInitScript(() => {
    // 跳過啟動畫面等待，穩定截圖內容。
    sessionStorage.setItem('ratewise:splash-shown', '1');
  });

  for (const [name, path] of PAGES) {
    const page = await context.newPage();
    const label = `${name}-${width}x${height}`;
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
    await page.screenshot({ path: join(OUT_DIR, `594-${PHASE}-${label}.png`) });
    await page.close();
    console.log(`captured 594-${PHASE}-${label}.png`);
  }
  await context.close();
}

await browser.close();

// 已知基線問題：SSG hydration React #418（基底同樣出現，與本次無關）。
const KNOWN_BASELINE = /Minified React error #418/;
const newErrors = consoleErrors.filter((entry) => !KNOWN_BASELINE.test(entry));
console.log(`\nknown baseline hydration #418: ${consoleErrors.length - newErrors.length}`);
if (newErrors.length > 0) {
  console.error(`console errors (excluding known baseline): ${newErrors.length}`);
  for (const entry of newErrors) console.error(entry);
  process.exit(1);
}
console.log('console errors (excluding known baseline): 0');
