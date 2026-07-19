// v15 成就系統實測驗證（GAME_DESIGN §94）：獨立瀏覽器五幕取證——
// A 舊存檔開機補發、B 真實擊破管線多重解鎖 toast 佇列與 Result 名單、
// C 成就頁 854/1200 雙寬、D 直持 390×844 safe-area、E console error 歸零。
// 用法：SP_DEV_PORT=5215 node scripts/v15-verify.mjs
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const PORT = process.env.SP_DEV_PORT ?? '5215';
const BASE_URL = `http://localhost:${PORT}/starpuff/`;
const OUT_DIR = 'screenshots/starpuff-v15';
mkdirSync(OUT_DIR, { recursive: true });

const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
};

const seedInit = (page, save) =>
  page.addInitScript(
    ({ raw, ack }) => {
      localStorage.setItem('sp-save', raw);
      localStorage.setItem(ack.key, ack.value);
    },
    { raw: JSON.stringify(save), ack: { key: 'sp-rotation-notice-ack', value: '1' } },
  );

const v1Save = (levels) => ({
  schemaVersion: 1,
  highestClearedLevel: 0,
  levels,
  lastPlayedAt: Date.now(),
});

const fullLevels = () => {
  const eggByLevel = {
    1: ['reach-x'],
    2: ['stand-count'],
    3: ['eat-sequence'],
    4: ['crown-early-hit'],
    5: ['stand-count'],
    6: ['eat-sequence'],
    7: ['crown-early-hit'],
    8: ['eat-sequence'],
    9: ['eat-sequence'],
    10: ['stand-count'],
    11: ['eat-sequence'],
    12: ['twin-finish'],
    13: ['reach-x'],
    14: ['stand-count'],
    15: ['eat-sequence'],
    16: ['vent-hit-count'],
    17: ['stand-count'],
    18: ['eat-sequence'],
    19: ['eat-sequence'],
    20: ['survive-collect'],
  };
  const levels = {};
  for (let id = 1; id <= 20; id++) {
    levels[String(id)] = {
      cleared: true,
      bestTimeMs: id === 12 ? 55000 : 130000,
      eggsFound: eggByLevel[id],
      ...([4, 7, 12, 16, 20].includes(id) ? { exCleared: true } : {}),
    };
  }
  return levels;
};

async function newPage(browser, viewport) {
  const context = await browser.newContext({
    viewport,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return { context, page, errors };
}

const waitScene = (page, scene) =>
  page.waitForFunction((s) => window.__sp?.scene?.() === s, scene, { timeout: 20000 });
const press = (page, selector) =>
  page.locator(selector).dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });

const browser = await chromium.launch();

// 幕 A：v13 世代 v1 滿進度存檔 → 開機補發 21 條、schema 升 v2、成就頁全亮（854/1200）。
{
  const { context, page, errors } = await newPage(browser, { width: 854, height: 480 });
  await seedInit(page, v1Save(fullLevels()));
  await page.goto(BASE_URL);
  await waitScene(page, 'Title');
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('sp-save')));
  check(
    'A1 開機補發 21 條',
    persisted.achievements?.length === 21,
    `got ${persisted.achievements?.length}`,
  );
  check('A2 schema 升 v2', persisted.schemaVersion === 2);
  await press(page, '[data-menu="codex"]');
  await waitScene(page, 'Codex');
  await press(page, '[data-menu="tab-achievements"]');
  await page.waitForTimeout(900);
  const tab = await page.evaluate(() => window.__sp.codexTab());
  check('A3 成就分頁切換', tab === 'achievements');
  await page.screenshot({ path: join(OUT_DIR, 'a-achievements-all-unlocked-854.png') });
  check('A4 console error 0', errors.length === 0, errors.join(' | ').slice(0, 200));
  await context.close();
}

// 幕 B：真實擊破管線——L2/L3 通關種子 → 直達 L4 快殺果凍王 → 三重解鎖
//（boss-jellord＋speed-boss-120＋speed-boss-60）toast 佇列與 Result 名單。
{
  const { context, page, errors } = await newPage(browser, { width: 854, height: 480 });
  await seedInit(
    page,
    v1Save({
      2: { cleared: true, bestTimeMs: 130000, eggsFound: [] },
      3: { cleared: true, bestTimeMs: 130000, eggsFound: [] },
    }),
  );
  await page.goto(BASE_URL);
  await waitScene(page, 'Title');
  // 零增量開機不落盤（KISS：v1 存檔待首次真實寫入才升版），achievements 缺省視為空。
  const bootAwards = await page.evaluate(
    () => JSON.parse(localStorage.getItem('sp-save')).achievements ?? [],
  );
  check('B1 部分進度開機零補發', bootAwards.length === 0, bootAwards.join(','));
  await press(page, '[data-menu="start"]');
  await waitScene(page, 'Game');
  await page.evaluate(() => window.__sp.gotoLevel(4));
  await page.waitForFunction(() => window.__sp.stage() === 4, undefined, { timeout: 15000 });
  // 場景就緒門（重生點）後才送鍵，避免 restart 競態吃掉 keydown。
  await page.waitForFunction(() => window.__sp.probe().x < 200, undefined, { timeout: 15000 });
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.__sp.bossHp() > 0, undefined, { timeout: 30000 });
  await page.keyboard.up('ArrowRight');
  const killStart = Date.now();
  while (Date.now() - killStart < 60000) {
    const hp = await page.evaluate(() => window.__sp.bossHp());
    if (hp <= 0) break;
    await page.evaluate(() => window.__sp.damageBoss(15));
    await page.waitForTimeout(250);
  }
  check('B2 果凍王擊破', (await page.evaluate(() => window.__sp.bossHp())) <= 0);
  // 擊破批合併 toast 觀測點（戰中彩蛋批先播，擊破批跨批序列輪替）：輪詢至輪到擊破批。
  let toastText = '';
  const toastDeadline = Date.now() + 8000;
  while (Date.now() < toastDeadline) {
    toastText = await page.evaluate(() => window.__sp.achievementToast());
    if (toastText.includes('搖晃的王座')) break;
    await page.waitForTimeout(200);
  }
  check('B6 擊破批 toast 含首勝名稱', toastText.includes('搖晃的王座'), toastText);
  await page.screenshot({ path: join(OUT_DIR, 'b-toast-during-win-delay.png') });
  await waitScene(page, 'Result');
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(OUT_DIR, 'b-result-unlocked-list.png') });
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('sp-save')));
  check(
    'B3 三重解鎖頒發',
    ['boss-jellord', 'speed-boss-120', 'speed-boss-60'].every((id) =>
      after.achievements.includes(id),
    ),
    after.achievements.join(','),
  );
  check('B5 真實寫入完成 v1→v2 遷移', after.schemaVersion === 2);
  check('B4 console error 0', errors.length === 0, errors.join(' | ').slice(0, 200));
  await context.close();
}

// 幕 C：1200 寬幅成就頁（部分解鎖含隱藏遮蔽）。
{
  const { context, page, errors } = await newPage(browser, { width: 1200, height: 480 });
  await seedInit(page, v1Save({ 1: { cleared: true, bestTimeMs: 90000, eggsFound: ['reach-x'] } }));
  await page.goto(BASE_URL);
  await waitScene(page, 'Title');
  await press(page, '[data-menu="codex"]');
  await waitScene(page, 'Codex');
  await press(page, '[data-menu="tab-achievements"]');
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(OUT_DIR, 'c-achievements-partial-1200.png') });
  check('C1 console error 0', errors.length === 0, errors.join(' | ').slice(0, 200));
  await context.close();
}

// 幕 D：直持 390×844 旋轉殼成就頁（safe-area 淨區排版）。
{
  const { context, page, errors } = await newPage(browser, { width: 390, height: 844 });
  await seedInit(page, v1Save({ 1: { cleared: true, bestTimeMs: 90000, eggsFound: ['reach-x'] } }));
  await page.goto(BASE_URL);
  await waitScene(page, 'Title');
  await press(page, '[data-menu="codex"]');
  await waitScene(page, 'Codex');
  await press(page, '[data-menu="tab-achievements"]');
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(OUT_DIR, 'd-achievements-portrait-390x844.png') });
  check('D1 console error 0', errors.length === 0, errors.join(' | ').slice(0, 200));
  await context.close();
}

await browser.close();
if (failures.length > 0) {
  console.error(`\nFAILED：${failures.join('、')}`);
  process.exit(1);
}
console.log('\nV15 VERIFY PASS 全幕通過');
