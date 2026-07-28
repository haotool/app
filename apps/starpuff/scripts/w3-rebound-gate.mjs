// L26 鏡面回彈觀測守門（GAME_DESIGN §123.2，W3 審查尾修）：鏡窗內受控賦星＋
// 強制射擊，斷言窗內魔王彈增量（回彈）≥1 並截圖——把「開鏡窗回彈可讀」的證據
// 變成可重現腳本（人工實測易撞彈匣見底拍不到同框，grantStar 消除供彈噪音）。
// 觀測口徑：FSM 處於 mirror 態期間不發其他攻擊指令（state 轉移才出招），
// 故窗內 bossShots 的任何增量必為鏡面回彈。
//
// 用法：dev server（SP_DEV_PORT）跑起後
//   node scripts/w3-rebound-gate.mjs [--port P] [--windows N]
// 輸出：screenshots/w3-l26-rebound.png（QA 暫存，不入版控）；失敗 exit 1。
import { mkdirSync } from 'node:fs';
// ts-bridge 副作用：註冊無副檔名 import 的 .ts 解析 hook（repo TS 慣例）。
import './lib/ts-bridge.mjs';
import { enterArena, gotoLevel, openSession, sleep } from './lib/audit-session.mjs';

const { REFLECTOR } = await import('../src/game/logic/reflectorFsm.ts');

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] !== undefined ? argv[index + 1] : fallback;
};
const port = opt('port', process.env.SP_DEV_PORT ?? '3007');
// 開鏡為 P1 加權招（權重 2）：預設最多等 8 個窗口，杜絕偶發折返彈回收遮蔽增量。
const maxWindows = Number(opt('windows', '8'));
const SHOT_DIR = new URL('../../../screenshots/', import.meta.url).pathname;

const readState = (page) => page.evaluate(() => window.__sp.bossState());
const readShots = (page) => page.evaluate(() => window.__sp.bossShots().length);

// 鍵位派發沿 audit-driver 成熟模式（keyCode 事件＋55ms tap）：Phaser 鍵盤走
// window keydown/keyup；left 37/right 39/shoot 88。
const tapKey = (page, keyCode, ms = 55) =>
  page.evaluate(
    ({ code, holdMs }) =>
      new Promise((resolve) => {
        const dispatch = (type) => {
          const ev = new KeyboardEvent(type, { keyCode: code, bubbles: true });
          Object.defineProperty(ev, 'keyCode', { get: () => code });
          window.dispatchEvent(ev);
        };
        dispatch('keydown');
        setTimeout(() => {
          dispatch('keyup');
          resolve(null);
        }, holdMs);
      }),
    { code: keyCode, holdMs: ms },
  );

// 面向魔王側（發射朝面向）：依玩家/魔王相對位置短按方向鍵校正。
async function faceBoss(page) {
  const toward = await page.evaluate(() => {
    const player = window.__sp.probe();
    const boss = window.__sp.bossPos();
    return boss.x >= player.x ? 39 : 37;
  });
  await tapKey(page, toward, 60);
}

// 等待下一次開鏡：mirror 態進場（timeout 內輪詢），回 false 表示逾時。
// 受控無敵（v13 EX bot「受控 i-frame 隔離迴避軸」既有慣例）：本守門驗「回彈可
// 觀測」非迴避公平性，等窗期間續租無敵防站樁陣亡使輪詢卡死於 Result。
async function waitMirror(page, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  let invulnAt = 0;
  while (Date.now() < deadline) {
    if (Date.now() - invulnAt > 4000) {
      invulnAt = Date.now();
      await page.evaluate(() => window.__sp.grantInvuln(6000)).catch(() => {});
    }
    const state = await readState(page).catch(() => null);
    if (state?.state === 'mirror') return true;
    await sleep(80);
  }
  return false;
}

const { browser, page, errors } = await openSession(port);
let passed = false;
try {
  await gotoLevel(page, 26);
  if (!(await enterArena(page))) throw new Error('未能進入 L26 arena');

  for (let attempt = 1; attempt <= maxWindows && !passed; attempt += 1) {
    if (!(await waitMirror(page))) throw new Error('等不到開鏡窗（mirror 態逾時）');
    // 過 telegraph 期（射線顯示先行、窗內才回彈——FSM tryRebound 同一口徑）。
    await sleep(REFLECTOR.mirrorTelegraphMs + 120);
    const stillMirror = await readState(page);
    if (stillMirror?.state !== 'mirror') continue;
    // 受控賦星＋面向校正＋窗內連射：星彈命中即應觸發回彈（節流 0.9s，一發足矣）。
    await page.evaluate(() => {
      window.__sp.grantStar('jelly');
      window.__sp.grantStar('jelly');
      window.__sp.grantStar('jelly');
    });
    await faceBoss(page);
    const baseline = await readShots(page);
    for (let i = 0; i < 3; i += 1) {
      await tapKey(page, 88, 55);
      await sleep(120);
    }
    // 窗內輪詢增量：baseline 於射擊前取樣，增量必為回彈（mirror 態零其他出招）。
    const probeDeadline = Date.now() + REFLECTOR.mirrorWindowMs;
    while (Date.now() < probeDeadline) {
      const shots = await readShots(page);
      const state = await readState(page);
      if (state?.state !== 'mirror') break;
      if (shots > baseline) {
        mkdirSync(SHOT_DIR, { recursive: true });
        await page.screenshot({ path: `${SHOT_DIR}w3-l26-rebound.png` });
        console.log(
          `PASS：第 ${attempt} 窗回彈觀測成立（bossShots ${baseline} → ${shots}）；` +
            `截圖 screenshots/w3-l26-rebound.png`,
        );
        passed = true;
        break;
      }
      await sleep(100);
    }
  }
  if (!passed) throw new Error(`${maxWindows} 個開鏡窗內未觀測到回彈增量`);
  if (errors.length > 0) throw new Error(`console 錯誤 ${errors.length} 筆：${errors[0]}`);
  console.log('console error 0');
} finally {
  await browser.close();
}
if (!passed) process.exit(1);
