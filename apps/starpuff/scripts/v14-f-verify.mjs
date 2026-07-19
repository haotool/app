// F 驗證：keyConfig 標籤單行（854/1200 寬、直橫持、新舊方向）。
import { chromium } from '@playwright/test';

const PORT = process.env.SP_DEV_PORT || '3014';
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('../screenshots/starpuff-v14/', import.meta.url).pathname;

// 單行判定：AABB 短邊即視覺高（旋轉殼下寬高互換），單行鈕視覺高 = min-height 44 + border 4 = 48。
async function checkConfig(viewport, name, initCw = false) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport, hasTouch: true });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  if (initCw) await page.addInitScript(() => localStorage.setItem('sp-rotation', 'cw'));
  await page.goto(BASE);
  await page.waitForSelector('#app canvas');
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await page
    .locator('[data-menu="config"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForSelector('.cfg-bar');
  await page.waitForTimeout(300);
  const metrics = await page.evaluate(() => {
    const portrait = matchMedia('(orientation: portrait)').matches;
    return [...document.querySelectorAll('.cfg-btn')].map((el) => {
      const r = el.getBoundingClientRect();
      const visualH = portrait ? r.width : r.height;
      const visualW = portrait ? r.height : r.width;
      return {
        label: el.textContent,
        visualW: Math.round(visualW),
        visualH: Math.round(visualH),
        singleLine: visualH <= 50,
      };
    });
  });
  const allSingle = metrics.every((m) => m.singleLine);
  console.log(`[${name}] singleLine=${allSingle}`, JSON.stringify(metrics));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  if (errors.length) console.log(`[${name}] console errors:`, errors);
  await browser.close();
  return allSingle;
}

let pass = true;
// 854 邏輯寬對應窄殼：375×667 直持（殼 667 寬）＋667×375 橫持。
pass &= await checkConfig({ width: 375, height: 667 }, 'f-after-keyconfig-portrait-375x667');
pass &= await checkConfig({ width: 667, height: 375 }, 'f-after-keyconfig-landscape-667x375');
// 390×844 直持（主力機）＋新舊雙向。
pass &= await checkConfig({ width: 390, height: 844 }, 'f-after-keyconfig-portrait-390x844');
pass &= await checkConfig(
  { width: 390, height: 844 },
  'f-after-keyconfig-portrait-390x844-cw',
  true,
);
// 1200 邏輯寬：寬桌面殼。
pass &= await checkConfig({ width: 1280, height: 480 }, 'f-after-keyconfig-wide-1280x480');

console.log(pass ? 'F VERIFY PASS' : 'F VERIFY FAIL');
