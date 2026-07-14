/**
 * E3 wave-C QA 腳本（mobile-beauty §7.4 A1/A5/A6/A7/A9 斷言子集）。
 * 執行前先啟動 preview：`npx vite preview --port 4176`；`node apps/haotool/tests/qa-wave-c.mjs`。
 * 唯讀腳本：僅輸出 screenshots/，不修改 src。
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const SCREENSHOT_DIR = path.join(REPO_ROOT, 'screenshots');
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const BASE_URL = process.env.QA_BASE_URL ?? 'http://localhost:4176';
const TOOL_ORDER = ['ratewise', 'starpuff', 'split-meow', 'park-keeper', 'nihonname'];

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const browser = await chromium.launch();

async function newPage(viewport, options = {}) {
  const context = await browser.newContext({ viewport, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  return { context, page, errors };
}

// ---------- 390×844 ----------
{
  const { context, page, errors } = await newPage({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

  // A1 ① bento 版式：2 軌、feature 跨滿
  const cols = await page.evaluate(
    () => getComputedStyle(document.querySelector('.bento')).gridTemplateColumns,
  );
  check('A1 390 bento 2 軌', cols.split(' ').length === 2, cols);
  const featureSpan = await page.evaluate(() => {
    const feature = document.querySelector('.bento-feature');
    const grid = document.querySelector('.bento');
    return Math.abs(feature.getBoundingClientRect().width - grid.getBoundingClientRect().width) < 1;
  });
  check('A1 390 feature 卡跨滿 2 欄', featureSpan);

  // A1 mini 卡：描述與分類 <768 隱藏（display:none）
  const miniHidden = await page.evaluate(() => {
    const mini = document.querySelector('.bento-sm-a');
    const desc = mini.querySelector('p');
    const bottom = mini.querySelector('.mt-auto');
    return getComputedStyle(desc).display === 'none' && getComputedStyle(bottom).display === 'none';
  });
  check('A1 390 mini 卡描述/底列隱藏（N3）', miniHidden);

  // A1 ② 數據帶：零時效數值＋含 sparkline path
  const band = await page.evaluate(() => {
    const node = document.querySelector('[data-testid="feature-data-band"]');
    return { text: node.innerText, hasPath: Boolean(node.querySelector('svg path')) };
  });
  check('A1 數據帶零匯率數字', !/\d+\.\d+/.test(band.text), JSON.stringify(band.text));
  check('A1 數據帶含 sparkline path', band.hasPath);

  // A1 ③ DOM 卡片順序 === TOOLS SSOT
  const order = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.bento > li')).map((li) => li.dataset.toolId),
  );
  check(
    'A1 DOM 順序 = TOOLS SSOT',
    JSON.stringify(order) === JSON.stringify(TOOL_ORDER),
    order.join(','),
  );

  // A6 貼紙旋轉角（matrix 驗算）＋數量 ≤3
  const stickers = await page.evaluate(() => {
    const angle = (selector) => {
      const el = document.querySelector(selector);
      const t = getComputedStyle(el).transform;
      if (t === 'none') return null;
      const [a, b] = t.replace('matrix(', '').split(',').map(Number);
      return Math.round(Math.atan2(b, a) * (180 / Math.PI) * 10) / 10;
    };
    return {
      primary: angle('.sticker-primary'),
      ink: angle('.sticker-ink'),
      live: angle('.sticker-live'),
      count: document.querySelectorAll('.sticker').length,
      primaryBorder: getComputedStyle(document.querySelector('.sticker-primary')).borderWidth,
      livePosition: getComputedStyle(document.querySelector('.sticker-live')).position,
    };
  });
  check('A6 sticker-primary rotate(-2deg)', stickers.primary === -2, String(stickers.primary));
  check('A6 sticker-ink rotate(1.5deg)', stickers.ink === 1.5, String(stickers.ink));
  check('A6 sticker-live rotate(2deg)', stickers.live === 2, String(stickers.live));
  check('A6 border 1px', stickers.primaryBorder === '1px', stickers.primaryBorder);
  check('A6 feature 角標 absolute', stickers.livePosition === 'absolute');
  check('A6 全頁貼紙 ≤3', stickers.count === 3, String(stickers.count));

  // A7 pattern 僅區 3
  const pattern = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section'));
    const withPattern = sections.filter((s) =>
      getComputedStyle(s).backgroundImage.includes('data:image/svg+xml'),
    );
    return {
      count: withPattern.length,
      isTrust: withPattern[0]?.getAttribute('aria-labelledby') === 'stats-heading',
    };
  });
  check(
    'A7 pattern 僅區 3 信任列',
    pattern.count === 1 && pattern.isTrust,
    JSON.stringify(pattern),
  );

  // A5 kinetic：僅 H2、aria 雙軌、H1 永不拆、末段 delay ≤220ms
  const kinetic = await page.evaluate(() => {
    const tools = document.getElementById('tools-heading');
    const author = document.getElementById('author-heading');
    const words = tools.querySelectorAll('.kinetic-word');
    const last = words[words.length - 1];
    return {
      toolsLabel: tools.getAttribute('aria-label'),
      toolsHidden: tools.querySelector('span').getAttribute('aria-hidden'),
      toolsCount: words.length,
      lastDelay: getComputedStyle(last).animationDelay,
      authorLabel: author.getAttribute('aria-label'),
      authorCount: author.querySelectorAll('.kinetic-word').length,
      h1Count: document.getElementById('hero-heading').querySelectorAll('.kinetic-word').length,
      craftCount: document.getElementById('craft-heading').querySelectorAll('.kinetic-word').length,
    };
  });
  check('A5 區 4 aria-label 完整', kinetic.toolsLabel === '五個正在服務真實使用者的工具');
  check('A5 區 4 視覺層 aria-hidden', kinetic.toolsHidden === 'true');
  check('A5 區 4 為 4 段', kinetic.toolsCount === 4, String(kinetic.toolsCount));
  check('A5 區 6 aria-label 完整', kinetic.authorLabel === '寫程式之前，先想像使用的人。');
  check('A5 區 6 為 3 段', kinetic.authorCount === 3, String(kinetic.authorCount));
  check('A5 H1 永不拆', kinetic.h1Count === 0);
  check('A5 區 5 H2 不拆（N2）', kinetic.craftCount === 0);

  // 捲到區 4 觸發 kinetic（data-inview 管線）
  await page.locator('#tools-heading').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const kineticPlayed = await page.evaluate(() => {
    const words = Array.from(document.querySelectorAll('#tools-heading .kinetic-word'));
    return words.every((w) => {
      const s = getComputedStyle(w);
      return s.animationName === 'kinetic-rise' && Number(s.opacity) === 1;
    });
  });
  check('A5 進視口後 kinetic 播畢（終態 opacity 1）', kineticPlayed);
  const lastDelayOk = await page.evaluate(() => {
    const words = document.querySelectorAll('#tools-heading .kinetic-word');
    return getComputedStyle(words[words.length - 1]).animationDelay;
  });
  check('A5 末段 delay ≤220ms', parseFloat(lastDelayOk) * 1000 <= 220, lastDelayOk);

  // A9 text-wrap: pretty
  const pretty = await page.evaluate(() => getComputedStyle(document.querySelector('p')).textWrap);
  check('A9 p text-wrap pretty', pretty === 'pretty', pretty);

  // 零橫捲
  const noHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  check('390 零橫向捲動', noHScroll);

  // 截圖：首屏＋bento 區
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'haotool-e3c-home-390.png') });
  await page.locator('#tools').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'haotool-e3c-bento-390.png') });

  check('390 console error = 0', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ---------- 390 reduced-motion ----------
{
  const { context, page, errors } = await newPage(
    { width: 390, height: 844 },
    { reducedMotion: 'reduce' },
  );
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.locator('#tools-heading').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const reduced = await page.evaluate(() => {
    const word = document.querySelector('#tools-heading .kinetic-word');
    const s = getComputedStyle(word);
    return { animation: s.animationName, opacity: s.opacity };
  });
  check(
    'reduced-motion kinetic 全靜態',
    reduced.animation === 'none' && reduced.opacity === '1',
    JSON.stringify(reduced),
  );
  const stickerStatic = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('.sticker-primary'));
    return s.animationName === 'none' && s.transform !== 'none';
  });
  check('reduced-motion 貼紙維持靜態旋轉（非動畫）', stickerStatic);
  check('reduced console error = 0', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ---------- 1440×900 ----------
{
  const { context, page, errors } = await newPage({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

  const desktop = await page.evaluate(() => {
    const grid = document.querySelector('.bento');
    const style = getComputedStyle(grid);
    const featureRect = document.querySelector('.bento-feature').getBoundingClientRect();
    const miniDesc = document.querySelector('.bento-sm-a p');
    const miniBottom = document.querySelector('.bento-sm-a .mt-auto');
    return {
      cols: style.gridTemplateColumns.split(' ').length,
      rows: style.gridTemplateRows,
      featureHeight: Math.round(featureRect.height),
      descVisible: getComputedStyle(miniDesc).display !== 'none',
      bottomVisible: getComputedStyle(miniBottom).display !== 'none',
    };
  });
  check('A1 1440 bento 12 軌', desktop.cols === 12, String(desktop.cols));
  check('A1 1440 3 列 264px', desktop.rows === '264px 264px 264px', desktop.rows);
  check(
    'A1 1440 feature 高 552（跨 2 列）',
    desktop.featureHeight === 552,
    String(desktop.featureHeight),
  );
  check('A1 1440 mini 描述/底列可見', desktop.descVisible && desktop.bottomVisible);

  const noHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  check('1440 零橫向捲動', noHScroll);

  await page.locator('#tools').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'haotool-e3c-bento-1440.png') });
  check('1440 console error = 0', errors.length === 0, errors.join(' | '));
  await context.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
if (failed.length > 0) process.exit(1);
