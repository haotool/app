/**
 * E3 wave-D QA 腳本（mobile-beauty §7.4 A2/A3＋§6 素材版位斷言子集）。
 * 執行前先啟動 preview：`npx vite preview --port 4176`；`node apps/haotool/tests/qa-wave-d.mjs`。
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

// ---------- 1440×900：sticky enhanced 三幕 ----------
{
  const { context, page, errors } = await newPage({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

  // A2 ① pin 高度 = 3 × 100svh（CLS 防護靜態宣告）。
  const pin = await page.evaluate(() => {
    const el = document.querySelector('.craft-pin');
    return { height: el.getBoundingClientRect().height, inner: window.innerHeight };
  });
  check(
    'A2 1440 pin 高度 = 3×innerHeight',
    Math.abs(pin.height - pin.inner * 3) < 2,
    `${pin.height} vs ${pin.inner * 3}`,
  );

  // 捲至 cover 50%：幕 2 可見、幕 1 已離場。cover 起點 = pin 頂進入視口底。
  const sceneOpacity = async () =>
    page.evaluate(() => {
      const scenes = [1, 2, 3].map((n) => document.querySelector(`.craft-scene-${n}`));
      return scenes.map((scene) => Number(getComputedStyle(scene).opacity));
    });
  await page.evaluate(() => {
    const el = document.querySelector('.craft-pin');
    const rect = el.getBoundingClientRect();
    const coverStart = window.scrollY + rect.top - window.innerHeight;
    const coverLength = rect.height + window.innerHeight;
    window.scrollTo(0, coverStart + coverLength * 0.5);
  });
  await page.waitForTimeout(300);
  const mid = await sceneOpacity();
  check('A2 cover 50% 幕 2 opacity > 0.9', mid[1] > 0.9, String(mid[1]));
  check('A2 cover 50% 幕 1 opacity < 0.1', mid[0] < 0.1, String(mid[0]));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'haotool-e3d-sticky-1440.png') });

  // 幕 1 → 幕 3 換幕全程走查。
  await page.evaluate(() => {
    const el = document.querySelector('.craft-pin');
    const rect = el.getBoundingClientRect();
    const coverStart = window.scrollY + rect.top - window.innerHeight;
    window.scrollTo(0, coverStart + (rect.height + window.innerHeight) * 0.3);
  });
  await page.waitForTimeout(200);
  const early = await sceneOpacity();
  check('A2 cover 30% 幕 1 可見', early[0] > 0.9, String(early[0]));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  const late = await sceneOpacity();
  check('A2 頁底幕 3 opacity = 1', late[2] === 1, String(late[2]));

  // 幕版式：enhanced 下 overline 顯示、draw-in icon 隱藏（N8）。
  const enhanced = await page.evaluate(() => ({
    overline: getComputedStyle(document.querySelector('.craft-scene-1 .craft-overline')).display,
    icon: getComputedStyle(document.querySelector('.craft-scene-1 .craft-icon')).display,
  }));
  check('A2 enhanced overline 顯示', enhanced.overline !== 'none', enhanced.overline);
  check('A2 enhanced draw-in 整格隱藏（N8）', enhanced.icon === 'none', enhanced.icon);

  // A4 banner 插畫 ≥1024 可見。
  const illus = await page.evaluate(() => {
    const el = document.querySelector('.banner-illus');
    const style = getComputedStyle(el);
    return { display: style.display, position: style.position, width: style.width };
  });
  check(
    'A4 1440 banner 插畫可見（absolute 240px）',
    illus.display === 'block' && illus.position === 'absolute' && illus.width === '240px',
    JSON.stringify(illus),
  );

  // A3 morph：兩頁同名配對＋startViewTransition 呼叫。
  const homeName = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector('[data-tool-id="ratewise"] .tool-vt'))
        .viewTransitionName,
  );
  check('A3 Home ratewise 卡 vt-name', homeName === 'tool-ratewise', homeName);
  await page.evaluate(() => {
    window.__vtCalls = 0;
    const original = document.startViewTransition?.bind(document);
    if (original) {
      document.startViewTransition = (cb) => {
        window.__vtCalls += 1;
        return original(cb);
      };
    }
  });
  await page.locator('a[href="/tools/"]', { hasText: '查看全部工具' }).click();
  await page.waitForURL('**/tools/');
  await page.waitForTimeout(600);
  const vtCalls = await page.evaluate(() => window.__vtCalls);
  check('A3 導航呼叫 startViewTransition +1', vtCalls === 1, String(vtCalls));
  const toolsName = await page.evaluate(
    () => getComputedStyle(document.querySelector('.tool-vt')).viewTransitionName,
  );
  check('A3 Tools 頁 ratewise 卡 vt-name（同名配對）', toolsName === 'tool-ratewise', toolsName);
  const uniqueNames = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.tool-vt')).map(
      (el) => getComputedStyle(el).viewTransitionName,
    ),
  );
  check(
    'A3 Tools 頁 5 名恆唯一',
    uniqueNames.length === 5 && new Set(uniqueNames).size === 5,
    uniqueNames.join(','),
  );
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'haotool-e3d-morph-1440.png') });

  check('1440 console error = 0', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ---------- 390×844：行動 enhanced＋素材版位 ----------
{
  const { context, page, errors } = await newPage({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

  // 行動 Chromium 支援 view()：pin 同樣 enhanced（高度 3×svh）。
  const pin = await page.evaluate(() => ({
    height: document.querySelector('.craft-pin').getBoundingClientRect().height,
    inner: window.innerHeight,
  }));
  check(
    'A2 390 pin 高度 = 3×innerHeight（enhanced）',
    Math.abs(pin.height - pin.inner * 3) < 2,
    `${pin.height}`,
  );

  // A4 頭像顯示（好字佔位已移除）。
  const avatar = await page.evaluate(() => {
    const img = document.querySelector('img[src="/brand/avatar.png"]');
    if (!img) return null;
    return {
      alt: img.getAttribute('alt'),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      containerText: document.body.textContent.includes('好字佔位'),
    };
  });
  await page.evaluate(() =>
    document.getElementById('author-heading').scrollIntoView({ block: 'center' }),
  );
  await page.waitForTimeout(900);
  const avatarLoaded = await page.evaluate(() => {
    const img = document.querySelector('img[src="/brand/avatar.png"]');
    return img.complete && img.naturalWidth === 640;
  });
  check(
    'A4 390 區 6 頭像存在且載入（640w）',
    avatar !== null && avatarLoaded,
    JSON.stringify(avatar),
  );
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'haotool-e3d-home-390-avatar.png') });

  // A4 插畫 <1024 隱藏（lazy 不觸發下載）。
  const illusHidden = await page.evaluate(() => {
    const el = document.querySelector('.banner-illus');
    return getComputedStyle(el).display === 'none';
  });
  check('A4 390 banner 插畫隱藏', illusHidden);

  const noHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  check('390 零橫向捲動', noHScroll);
  check('390 console error = 0', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ---------- 844×390 矮視口：min-height 閘降級 ----------
{
  const { context, page, errors } = await newPage({ width: 844, height: 390 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const pin = await page.evaluate(() => ({
    height: document.querySelector('.craft-pin').getBoundingClientRect().height,
    inner: window.innerHeight,
    scenes: [1, 2, 3].map((n) => {
      const s = getComputedStyle(document.querySelector(`.craft-scene-${n}`));
      return { opacity: s.opacity, animation: s.animationName };
    }),
  }));
  check(
    'A2 矮視口 pin 不 pin（高度 < 2×innerHeight）',
    pin.height < pin.inner * 2,
    String(pin.height),
  );
  check(
    'A2 矮視口三幕全可見（fallback 卡版）',
    pin.scenes.every((s) => s.opacity === '1' && s.animation === 'none'),
    JSON.stringify(pin.scenes),
  );
  check('矮視口 console error = 0', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ---------- 390 reduced-motion：全靜態降級 ----------
{
  const { context, page, errors } = await newPage(
    { width: 390, height: 844 },
    { reducedMotion: 'reduce' },
  );
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

  const reduced = await page.evaluate(() => {
    const pinHeight = document.querySelector('.craft-pin').getBoundingClientRect().height;
    const scenes = [1, 2, 3].map((n) => {
      const s = getComputedStyle(document.querySelector(`.craft-scene-${n}`));
      return { opacity: s.opacity, animation: s.animationName };
    });
    const icon = getComputedStyle(document.querySelector('.craft-scene-1 .craft-icon')).display;
    const vtName = getComputedStyle(document.querySelector('.tool-vt')).viewTransitionName;
    return { pinHeight, inner: window.innerHeight, scenes, icon, vtName };
  });
  check(
    'A2 reduce pin 降級（高度 < 2×innerHeight）',
    reduced.pinHeight < reduced.inner * 2,
    String(reduced.pinHeight),
  );
  check(
    'A2 reduce 三幕全可見零動畫',
    reduced.scenes.every((s) => s.opacity === '1' && s.animation === 'none'),
    JSON.stringify(reduced.scenes),
  );
  check('A2 reduce fallback icon 顯示（draw-in 卡版保留）', reduced.icon !== 'none', reduced.icon);
  check('A3 reduce vt-name 歸零', reduced.vtName === 'none', reduced.vtName);
  check('reduce console error = 0', errors.length === 0, errors.join(' | '));
  await context.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
if (failed.length > 0) process.exit(1);
