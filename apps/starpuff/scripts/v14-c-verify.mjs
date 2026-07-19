// C 驗證：暫停/靜音鍵 safe-area 避讓——四組 insets（直持 ccw/直持 cw/橫持瀏海/無瀏海）。
// mute 鈕為 canvas 內 Phaser 元素：以邏輯座標→裝置座標換算後真點，sp-muted 翻轉即命中。
import { chromium } from '@playwright/test';

const PORT = process.env.SP_DEV_PORT || '3014';
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('../screenshots/starpuff-v14/', import.meta.url).pathname;

const browser = await chromium.launch();
let allPass = true;

// 邏輯座標 → 裝置座標：先轉 canvas CSS 局部，再依殼旋轉映射到裝置。
function logicalToDevice(logical, view, canvasCss, rotation, deviceW, deviceH) {
  const cssX = (logical.x * canvasCss.w) / view.width;
  const cssY = (logical.y * canvasCss.h) / view.height;
  if (rotation === 'none') return { x: cssX, y: cssY };
  if (rotation === 'cw') return { x: deviceW - cssY, y: cssX };
  return { x: cssY, y: deviceH - cssX };
}

async function scenario(name, viewport, insets, rotationPref, expectInsetLogical) {
  const ctx = await browser.newContext({ viewport, hasTouch: true });
  if (rotationPref === 'cw') {
    await ctx.addInitScript(() => localStorage.setItem('sp-rotation', 'cw'));
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const cdp = await ctx.newCDPSession(page);
  if (insets) await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets });
  await page.goto(BASE);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp.scene() === 'Game');
  await page.waitForTimeout(500);

  const env = await page.evaluate(() => {
    const canvas = document.querySelector('#app canvas');
    const layer = document.getElementById('keys-layer');
    const cs = getComputedStyle(layer);
    return {
      view: window.__sp.view(),
      canvasCss: { w: canvas.clientWidth, h: canvas.clientHeight },
      layerRight: cs.right,
      portrait: matchMedia('(orientation: portrait)').matches,
    };
  });
  const rotation = env.portrait ? rotationPref : 'none';
  const insetLogical =
    (Math.max(0, parseFloat(env.layerRight) - 12) * env.view.width) / env.canvasCss.w;
  const insetOk = Math.abs(insetLogical - expectInsetLogical) < 2;
  console.log(
    `[${name}] layerRight=${env.layerRight} insetLogical=${insetLogical.toFixed(1)} expect≈${expectInsetLogical} ${insetOk ? 'PASS' : 'FAIL'}`,
  );
  if (!insetOk) allPass = false;

  // mute 鈕邏輯位（避讓後）：(width - 26 - insetLogical, 26)；真點 → sp-muted 翻轉。
  const muteLogical = { x: env.view.width - 26 - insetLogical, y: 26 };
  const device = logicalToDevice(
    muteLogical,
    env.view,
    env.canvasCss,
    rotation,
    viewport.width,
    viewport.height,
  );
  const mutedBefore = await page.evaluate(() => localStorage.getItem('sp-muted') === '1');
  await page.mouse.click(device.x, device.y);
  await page.waitForTimeout(200);
  const mutedAfter = await page.evaluate(() => localStorage.getItem('sp-muted') === '1');
  const hit = mutedBefore !== mutedAfter;
  console.log(
    `  mute click @(${device.x.toFixed(0)},${device.y.toFixed(0)}) hit=${hit} ${hit ? 'PASS' : 'FAIL'}`,
  );
  if (!hit) allPass = false;
  await page.screenshot({ path: `${OUT}/c-after-${name}.png` });
  if (errors.length) {
    console.log('  console errors:', errors);
    allPass = false;
  }
  await ctx.close();
}

// 直持 ccw（新預設）：裝置 top 47 → 殼右；净 35 CSS px → 邏輯 ≈43.1。
await scenario(
  'portrait-ccw-notch',
  { width: 390, height: 844 },
  { top: 47, left: 0, right: 0, bottom: 34 },
  'ccw',
  (35 * 1039) / 844,
);
// 直持 cw（舊方向）：裝置 bottom 34 → 殼右；净 22 → 邏輯 ≈27.1。
await scenario(
  'portrait-cw-notch',
  { width: 390, height: 844 },
  { top: 47, left: 0, right: 0, bottom: 34 },
  'cw',
  (22 * 1039) / 844,
);
// 橫持瀏海右（landscape 直讀 right inset 47）：844×390 殼邏輯寬 1039，净 35 → ≈43.1。
await scenario(
  'landscape-notch-right',
  { width: 844, height: 390 },
  { top: 0, left: 0, right: 47, bottom: 21 },
  'ccw',
  (35 * 1039) / 844,
);
// 無瀏海（平板/桌面級）：inset 0 → 避讓 0（回歸原錨點）。
await scenario('no-notch', { width: 844, height: 390 }, null, 'ccw', 0);

await browser.close();
console.log(allPass ? 'C VERIFY PASS' : 'C VERIFY FAIL');
