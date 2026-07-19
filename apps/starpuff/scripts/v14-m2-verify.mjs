// M2 驗證：安裝卡與開始鈕在窄裝置矩陣下零重疊（AABB），且開始鈕可真點。
import { chromium } from '@playwright/test';

const PORT = process.env.SP_DEV_PORT || '3014';
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('../screenshots/starpuff-v14/', import.meta.url).pathname;
const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

const browser = await chromium.launch();
let allPass = true;

const overlap = (a, b) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

for (const viewport of [
  { width: 320, height: 568 },
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 667, height: 375 },
]) {
  const ctx = await browser.newContext({ viewport, hasTouch: true, userAgent: IOS_UA });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title');
  await page.waitForSelector('.install-overlay', { timeout: 6000 });
  await page.waitForTimeout(300);
  const card = await page.locator('.install-card').boundingBox();
  const start = await page.locator('[data-menu="start"]').boundingBox();
  const menuBoxes = await page.evaluate(() =>
    [...document.querySelectorAll('[data-menu]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.dataset.menu, x: r.x, y: r.y, width: r.width, height: r.height };
    }),
  );
  const hitStart = overlap(card, start);
  const hitMenus = menuBoxes.filter((m) => overlap(card, m)).map((m) => m.id);
  const name = `${viewport.width}x${viewport.height}`;
  console.log(
    `[${name}] card-vs-start overlap=${hitStart} card-vs-menus=[${hitMenus.join(',')}] ${!hitStart ? 'PASS' : 'FAIL'}`,
  );
  if (hitStart) allPass = false;
  if (name === '320x568') {
    await page.screenshot({ path: `${OUT}/m2-after-narrow-320-card-open.png` });
  }
  // 卡片開著，貼開始鈕四角與中心真點其一（取底緣中點——先前重疊帶）。
  await page.mouse.click(start.x + start.width / 2, start.y + start.height - 3);
  const scene = await page.evaluate(() => window.__sp.scene());
  console.log(`  bottom-edge click -> scene=${scene} ${scene === 'Game' ? 'PASS' : 'FAIL'}`);
  if (scene !== 'Game') allPass = false;
  if (name === '320x568') {
    await page.screenshot({ path: `${OUT}/m2-after-narrow-320.png` });
  }
  if (errors.length) {
    console.log(`  console errors:`, errors);
    allPass = false;
  }
  await ctx.close();
}

await browser.close();
console.log(allPass ? 'M2 VERIFY PASS' : 'M2 VERIFY FAIL');
