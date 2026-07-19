// B 翻轉驗證：ccw 新預設幾何、搖桿語意、safe-area 換軸、cw 舊方向切換。
import { chromium } from '@playwright/test';

const PORT = process.env.SP_DEV_PORT || '3014';
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('../screenshots/starpuff-v14/', import.meta.url).pathname;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

// CDP 模擬瀏海（裝置 top=47）＋home indicator（bottom=34）。
const cdp = await page.context().newCDPSession(page);
let safeAreaOk = true;
try {
  await cdp.send('Emulation.setSafeAreaInsetsOverride', {
    insets: { top: 47, left: 0, right: 0, bottom: 34 },
  });
} catch (e) {
  safeAreaOk = false;
  console.log('safe-area CDP unavailable:', e.message.split('\n')[0]);
}

await page.goto(BASE);
await page.waitForSelector('#app canvas');
await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
await page.waitForTimeout(500);

const geo = await page.evaluate(() => {
  const c = document.querySelector('#app canvas').getBoundingClientRect();
  const cs = getComputedStyle(document.getElementById('game-shell'));
  return {
    transform: cs.transform,
    coverage:
      Math.round(((c.width * c.height) / (window.innerWidth * window.innerHeight)) * 10000) / 10000,
    view: window.__sp.view(),
  };
});
// rotate(-90deg) = matrix(0, -1, 1, 0, tx, ty)。
console.log('ccw geometry:', JSON.stringify(geo));
if (!geo.transform.startsWith('matrix(0, -1, 1, 0')) {
  console.log('FAIL: expected ccw matrix');
}
await page.screenshot({ path: `${OUT}/b-after-portrait-title.png` });

// 進遊戲：DOM 鈕不受旋轉影響。
await page
  .locator('[data-menu="start"]')
  .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
await page.waitForFunction(() => window.__sp.scene() === 'Game');
await page.waitForTimeout(400);

// 搖桿語意（ccw）：裝置「往上滑」= 遊戲往右。
const before = await page.evaluate(() => window.__sp.probe());
const joy = page.locator('#joy-zone');
await joy.dispatchEvent('pointerdown', {
  pointerId: 3,
  isPrimary: true,
  clientX: 150,
  clientY: 500,
});
await joy.dispatchEvent('pointermove', {
  pointerId: 3,
  isPrimary: true,
  clientX: 150,
  clientY: 440,
});
await page.waitForTimeout(700);
const after = await page.evaluate(() => window.__sp.probe());
await joy.dispatchEvent('pointerup', { pointerId: 3, isPrimary: true, clientX: 150, clientY: 440 });
const dx = after.x - before.x;
console.log(`joystick swipe-up => player dx = ${Math.round(dx)} (expect > 0, ccw 往右)`);
if (dx <= 0) console.log('FAIL: swipe-up should move right under ccw');

// 按鍵幾何：safe-area 模擬下 A/B 與裝置緣距。
const btns = await page.evaluate(() => {
  const a = document.querySelector('[data-btn="a"]').getBoundingClientRect();
  const b = document.querySelector('[data-btn="b"]').getBoundingClientRect();
  const layer = document.getElementById('keys-layer');
  const lcs = getComputedStyle(layer);
  return {
    a: { x: Math.round(a.x), y: Math.round(a.y), w: a.width, h: a.height },
    b: { x: Math.round(b.x), y: Math.round(b.y), w: b.width, h: b.height },
    layerInsets: { top: lcs.top, right: lcs.right, bottom: lcs.bottom, left: lcs.left },
  };
});
console.log('ccw buttons (device coords):', JSON.stringify(btns));
await page.screenshot({ path: `${OUT}/b-after-portrait-game.png` });

// 切回 cw 舊方向（模擬設定），驗證 CSS 與指標換算跟著走。
await page.evaluate(() => {
  localStorage.setItem('sp-rotation', 'cw');
  document.documentElement.classList.add('sp-rot-cw');
});
await page.waitForTimeout(300);
const cwGeo = await page.evaluate(() => {
  const cs = getComputedStyle(document.getElementById('game-shell'));
  return { transform: cs.transform };
});
console.log('cw geometry after toggle:', JSON.stringify(cwGeo));
if (!cwGeo.transform.startsWith('matrix(0, 1, -1, 0')) console.log('FAIL: expected cw matrix');

// cw 語意回歸：裝置「往下滑」= 遊戲往右。
const b2 = await page.evaluate(() => window.__sp.probe());
await joy.dispatchEvent('pointerdown', {
  pointerId: 4,
  isPrimary: true,
  clientX: 150,
  clientY: 400,
});
await joy.dispatchEvent('pointermove', {
  pointerId: 4,
  isPrimary: true,
  clientX: 150,
  clientY: 460,
});
await page.waitForTimeout(700);
const a2 = await page.evaluate(() => window.__sp.probe());
await joy.dispatchEvent('pointerup', { pointerId: 4, isPrimary: true, clientX: 150, clientY: 460 });
const dx2 = a2.x - b2.x;
console.log(`cw joystick swipe-down => player dx = ${Math.round(dx2)} (expect > 0)`);
if (dx2 <= 0) console.log('FAIL: swipe-down should move right under cw');
await page.screenshot({ path: `${OUT}/b-after-portrait-game-cw-toggle.png` });

console.log('console errors:', errors.length, errors.slice(0, 3));
console.log('safe-area emulated:', safeAreaOk);
await browser.close();
console.log('b-verify done');
