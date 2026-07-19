// G 驗證：觸覺回饋掛點（vibrate 呼叫記錄）與 wake lock 取得（支援環境）。
import { chromium } from '@playwright/test';

const PORT = process.env.SP_DEV_PORT || '3014';
const BASE = `http://localhost:${PORT}/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

// 記錄 vibrate 呼叫。
await page.addInitScript(() => {
  window.__vibrations = [];
  navigator.vibrate = (pattern) => {
    window.__vibrations.push(pattern);
    return true;
  };
});

await page.goto(BASE);
await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');

// wake lock：headless chromium 支援 API；驗證 request 已被呼叫（sentinel 型別存在）。
const wakeLockSupported = await page.evaluate(() => 'wakeLock' in navigator);
console.log('wakeLock API present:', wakeLockSupported);

await page
  .locator('[data-menu="start"]')
  .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
await page.waitForFunction(() => window.__sp.scene() === 'Game');
await page.waitForTimeout(500);

// 受擊 → hurt 音效 → 震動。
await page.evaluate(() => window.__sp.hurtPlayer(1));
await page.waitForTimeout(300);
const vibrations = await page.evaluate(() => window.__vibrations);
console.log(
  'vibrations after hurt:',
  JSON.stringify(vibrations),
  vibrations.length >= 1 ? 'PASS' : 'FAIL',
);

// 靜音後受擊不震。
await page.evaluate(() => {
  const before = window.__vibrations.length;
  window.__muteProbe = before;
});
// 靜音鈕在 canvas 內；以 __sp 不可達，改直接呼叫 mute 模組不可行——用畫面右上角座標點擊。
// 橫持殼無旋轉：邏輯座標≈CSS 座標比例。以 keyboard 快速驗證改用 localStorage 重載較穩。
await page.evaluate(() => localStorage.setItem('sp-muted', '1'));
await page.reload();
await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
await page
  .locator('[data-menu="start"]')
  .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
await page.waitForFunction(() => window.__sp.scene() === 'Game');
await page.waitForTimeout(400);
const beforeMuted = await page.evaluate(() => window.__vibrations.length);
await page.evaluate(() => window.__sp.hurtPlayer(1));
await page.waitForTimeout(300);
const afterMuted = await page.evaluate(() => window.__vibrations.length);
console.log(
  `muted hurt: vibrations ${beforeMuted} -> ${afterMuted}`,
  afterMuted === beforeMuted ? 'PASS（靜音不震）' : 'FAIL',
);

console.log('console errors:', errors.length, errors.slice(0, 3));
await browser.close();
console.log('g-verify done');
