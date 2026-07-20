// v16 深度 QA：舊世代資料相容——v1 存檔（v9–v14）＋ sp-key-layout v1 自訂＋
// cw 舊持向偏好，直持/橫持開機與進關 console error 必須為 0，且自訂鍵位不被
// D1 新預設覆蓋（§95 儲存語意）。
import { chromium } from '@playwright/test';

const port = process.env.SP_DEV_PORT || '3016';
const failures = [];

const LEGACY_SAVE = JSON.stringify({
  schemaVersion: 1,
  highestClearedLevel: 9,
  levels: {
    1: { cleared: true, bestTimeMs: 61000, eggsFound: ['reach-x'] },
    4: { cleared: true, bestTimeMs: 120000, eggsFound: [] },
    9: { cleared: true, bestTimeMs: 90000, eggsFound: [] },
  },
  lastPlayedAt: 1720000000000,
});
const LEGACY_LAYOUT = JSON.stringify({
  version: 1,
  a: { cx: 0.4, cy: 0.6 },
  b: { cx: 0.88, cy: 0.3 },
});

async function run(name, viewport, rotation) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport, hasTouch: true });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(
    ([save, layout, rot]) => {
      localStorage.setItem('sp-save', save);
      localStorage.setItem('sp-key-layout', layout);
      if (rot) localStorage.setItem('sp-rotation', rot);
      localStorage.setItem('sp-rotation-notice', '1');
      localStorage.setItem('sp-install-dismissed', '1');
    },
    [LEGACY_SAVE, LEGACY_LAYOUT, rotation],
  );
  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  // v1 存檔開機補發成就＋schema 升 v2。
  const save = await page.evaluate(() => window.__sp.save());
  if (save.schemaVersion !== 2) failures.push(`${name}: schema 未升 v2`);
  if (!save.achievements.includes('boss-jellord')) failures.push(`${name}: 成就未補發`);
  // 進關：自訂 v1 鍵位須原樣套用（cx 0.4/0.88），不被旋轉預設覆蓋。
  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Game');
  await page.waitForTimeout(700);
  for (const [btn, cx] of [
    ['a', 40],
    ['b', 88],
  ]) {
    const left = await page
      .locator(`[data-btn="${btn}"]`)
      .evaluate((el) => parseFloat(el.style.left));
    if (Math.abs(left - cx) > 0.5) {
      failures.push(`${name}: 自訂鍵位 ${btn} 被覆蓋（left=${left}% 預期 ${cx}%）`);
    }
  }
  if (errors.length > 0) failures.push(`${name}: console errors ${JSON.stringify(errors)}`);
  await browser.close();
  console.log(`${name}: ${errors.length === 0 ? 'PASS' : 'FAIL'}`);
}

await run('橫持 854 v1 資料', { width: 854, height: 480 }, null);
await run('直持 ccw v1 資料', { width: 390, height: 844 }, null);
await run('直持 cw 舊偏好 v1 資料', { width: 390, height: 844 }, 'cw');

if (failures.length > 0) {
  console.error('FAILURES:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('v16 legacy QA 全數通過');
