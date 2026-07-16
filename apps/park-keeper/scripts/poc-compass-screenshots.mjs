/**
 * PoC 羅盤截圖腳本（issue #716 US-4 驗收：≥2 輪 × 四主題）。
 * 用法：node scripts/poc-compass-screenshots.mjs <round>
 * 前置：`vite preview --port 4176` 已啟動。
 * 產出：<repo-root>/screenshots/poc-round-<round>-<theme>.png
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const round = process.argv[2] ?? '1';
const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../../../screenshots');
mkdirSync(outDir, { recursive: true });

const BASE_URL = process.env.POC_BASE_URL ?? 'http://localhost:4176/park-keeper/';
// 車位（記錄時 GPS）與導航時使用者位置相距約 120m，避免落入抵達判定。
const PARK_GEO = { latitude: 25.034, longitude: 121.5644 };
const WALK_GEO = { latitude: 25.0348, longitude: 121.5653 };

const THEMES = [
  { name: 'Zen', file: 'zen' },
  { name: 'Nitro', file: 'nitro' },
  { name: 'Kawaii', file: 'kawaii' },
  { name: 'Classic', file: 'classic' },
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  permissions: ['geolocation'],
  geolocation: PARK_GEO,
  serviceWorkers: 'block',
});
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

await page.goto(BASE_URL);

// 1. 建立停車記錄（FAB → 樓層 chip auto-save）
await page.getByRole('button', { name: '新增停車紀錄' }).click();
await page.getByPlaceholder('車牌號碼').waitFor();
await page.getByRole('button', { name: 'B3', exact: true }).click();
await page.getByRole('button', { name: /導航/ }).waitFor();

// 2. 導航情境：使用者位置移離車位
await context.setGeolocation(WALK_GEO);

for (const theme of THEMES) {
  // 切主題：設定 tab → 主題卡 → 回列表 tab
  await page.getByRole('button', { name: '設定' }).click();
  await page.getByText(theme.name, { exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: '列表' }).click();

  // 開導航
  await page.getByRole('button', { name: /導航/ }).click();
  await page.getByRole('button', { name: '關閉導航' }).waitFor();

  // heading 注入：朝向東北（alpha=315 → heading=45），讓盤面呈現旋轉狀態
  await page.evaluate(() => {
    for (let i = 0; i < 15; i++) {
      window.dispatchEvent(
        new DeviceOrientationEvent('deviceorientationabsolute', {
          alpha: 315,
          beta: 8,
          gamma: 0,
          absolute: true,
        }),
      );
    }
  });
  // 等 spring 動畫與 tile 載入穩定
  await page.waitForTimeout(1600);

  const path = `${outDir}/poc-round-${round}-${theme.file}.png`;
  await page.screenshot({ path });
  console.log(`captured ${path}`);

  await page.getByRole('button', { name: '關閉導航' }).click();
  await page.waitForTimeout(300);
}

// 對準態展示（僅 round 2+）：heading 對齊目標 bearing（車位在使用者西南 ≈225°）
// → alpha = 360 − 225 = 135，落在 ±10° 對準窗內，觸發楔形滿飽和＋對準文案。
if (Number(round) >= 2) {
  // 等 NavOverlay exit 動畫完成、列表 FAB 回穩再重開導航。
  await page.getByRole('button', { name: '新增停車紀錄' }).waitFor();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /導航/ }).click();
  await page.getByRole('button', { name: '關閉導航' }).waitFor();
  await page.evaluate(() => {
    for (let i = 0; i < 40; i++) {
      window.dispatchEvent(
        new DeviceOrientationEvent('deviceorientationabsolute', {
          alpha: 135,
          beta: 8,
          gamma: 0,
          absolute: true,
        }),
      );
    }
  });
  await page.waitForTimeout(1600);
  const alignedPath = `${outDir}/poc-round-${round}-aligned.png`;
  await page.screenshot({ path: alignedPath });
  console.log(`captured ${alignedPath}`);
  await page.getByRole('button', { name: '關閉導航' }).click();
}

if (consoleErrors.length > 0) {
  console.log(`console errors (${consoleErrors.length}):`);
  for (const err of consoleErrors) console.log(`  - ${err}`);
} else {
  console.log('console errors: 0');
}

await browser.close();
