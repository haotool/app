// Voidra 純標準星保底實證 bot（§82／主計畫 §3.2 DPS 檢查點）：1200 邏輯寬全程 trace。
// 方法論沿 noctra-bot-audit：週期 grantStar('jelly') 模擬吸彈（純標準星、不用變身/
// 混合/增益），操作走真實鍵盤事件；P2 生存段純走位、過熱窗與 P1/P3 僵直窗點射磨血。
// 用法：node scripts/voidra-bot-audit.mjs [port]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const port = process.argv[2] ?? '3107';
const RUN_TIMEOUT_MS = 480_000;
const OUT_DIR = new URL('../../../screenshots/starpuff-v12/', import.meta.url).pathname;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rand = (min, max) => min + Math.random() * (max - min);

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  // 1200 邏輯寬：殼 1250×500 → round(2.5×480)=1200（VIEW.maxWidth 夾限帶內）。
  const ctx = await browser.newContext({ viewport: { width: 1250, height: 500 } });
  const page = await ctx.newPage();
  const sp = (fn, arg) => page.evaluate(fn, arg).catch(() => null);

  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title', null, { timeout: 20000 });
  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp.scene() === 'Game', null, { timeout: 15000 });
  await page.evaluate(() => window.__sp.gotoLevel(20));
  await page.waitForFunction(() => window.__sp.stage() === 20, null, { timeout: 15000 });
  const view = await page.evaluate(() => window.__sp.view().width);
  console.log(`邏輯視寬：${view}`);

  // 前室直走（不拾增益＝純標準星紀律）：入 arena 觸發入場運鏡。
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.__sp.bossHp() > 0, null, { timeout: 30000 });
  await page.keyboard.up('ArrowRight');
  const maxHp = await page.evaluate(() => window.__sp.bossHp());
  console.log(`Voidra HP ${maxHp}，開戰`);

  const held = new Set();
  const press = async (key) => {
    if (held.has(key)) return;
    held.add(key);
    await page.keyboard.down(key).catch(() => {});
  };
  const release = async (key) => {
    if (!held.has(key)) return;
    held.delete(key);
    await page.keyboard.up(key).catch(() => {});
  };
  const keyOf = (dir) => (dir > 0 ? 'ArrowRight' : 'ArrowLeft');
  const clearHeld = async () => {
    for (const key of ['ArrowLeft', 'ArrowRight']) await release(key);
  };

  const startedAt = Date.now();
  const trace = [];
  let lastGrantAt = 0;
  let lastTraceAt = 0;
  let lastBossHp = maxHp;
  let segmentRetries = 0;
  let fullRetries = 0;
  let shotsFired = 0;
  let strafeFlip = 1;
  let p2Shot = false;
  let p3Shot = false;
  let result = 'timeout';

  while (Date.now() - startedAt < RUN_TIMEOUT_MS) {
    const scene = await sp(() => window.__sp.scene());
    if (scene === 'Credits') {
      result = 'won';
      break;
    }
    if (scene === 'Result') {
      // 敗北重試（人類同路徑：再戰魔王）：ENTER 直入 L20 前室，死亡計數延續。
      fullRetries += 1;
      await clearHeld();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => window.__sp.scene() === 'Game', null, { timeout: 15000 });
      await page.keyboard.down('ArrowRight');
      await page
        .waitForFunction(() => window.__sp.bossHp() > 0, null, { timeout: 30000 })
        .catch(() => {});
      await page.keyboard.up('ArrowRight');
      lastBossHp = maxHp;
      continue;
    }
    if (scene !== 'Game') {
      await sleep(250);
      continue;
    }
    const state = await sp(() => ({
      hp: window.__sp.playerHp(),
      bossHp: window.__sp.bossHp(),
      px: window.__sp.probe().x,
      boss: window.__sp.bossPos(),
      fsm: window.__sp.bossState(),
      ammo: window.__sp.ammo().ammo,
      shots: window.__sp.bossShots(),
      meteor: window.__sp.meteor(),
      view: window.__sp.view().width,
    }));
    if (!state || !state.fsm) {
      await sleep(200);
      continue;
    }
    // 段起點重試偵測：魔王血量回升＝P2/P3 段重試（anti-softlock 路徑實證）。
    if (state.bossHp > lastBossHp) segmentRetries += 1;
    lastBossHp = state.bossHp;
    if (Date.now() - lastTraceAt >= 500) {
      lastTraceAt = Date.now();
      trace.push({
        t: Date.now() - startedAt,
        phase: state.fsm.phase,
        state: state.fsm.state,
        bossHp: state.bossHp,
        hp: state.hp,
        px: Math.round(state.px),
        bossY: state.boss.y,
      });
    }
    if (!p2Shot && state.fsm.phase === 'p2') {
      p2Shot = true;
      await page.screenshot({ path: `${OUT_DIR}l20-p2-survival.png` });
    }
    if (!p3Shot && state.fsm.phase === 'p3') {
      p3Shot = true;
      await page.screenshot({ path: `${OUT_DIR}l20-p3-lowgrav.png` });
    }
    // 純標準星紀律：空匣即補一發 jelly（模擬吸食補給怪）。
    if (Date.now() - lastGrantAt >= 1500 && state.ammo === 0) {
      lastGrantAt = Date.now();
      await sp(() => window.__sp.grantStar('jelly'));
    }
    const arenaLeft = 400;
    const center = arenaLeft + state.view / 2;
    // 1) 彈幕近身迴避：側移離開彈道。
    const nearShot = state.shots.some(
      (s) => Math.abs(s.x - state.px) < 90 && Math.abs(s.y - 340) < 130,
    );
    if (nearShot) {
      const dir = state.px > center ? -1 : 1;
      await clearHeld();
      await press(keyOf(dir));
      await sleep(rand(240, 340));
      await release(keyOf(dir));
      continue;
    }
    // 2) P2 生存段：持續橫移風箏（隕星/晶柱落點抽選恆避開玩家縱帶，移動即保命）；
    //    過熱窗（核心下沉）面向核心點射。
    if (state.fsm.phase === 'p2') {
      const overheat = state.boss.y > 150;
      if (overheat && state.ammo > 0) {
        const dir = Math.sign(state.boss.x - state.px || 1);
        await clearHeld();
        await press(keyOf(dir));
        await sleep(90);
        await release(keyOf(dir));
        await page.keyboard.press('X', { delay: 40 });
        shotsFired += 1;
        continue;
      }
      const kite = Math.floor((Date.now() - startedAt) / 1600) % 2 === 0 ? 1 : -1;
      const atEdge =
        (kite < 0 && state.px < arenaLeft + 120) ||
        (kite > 0 && state.px > arenaLeft + state.view - 120);
      await clearHeld();
      await press(keyOf(atEdge ? -kite : kite));
      await sleep(300);
      await release(keyOf(atEdge ? -kite : kite));
      continue;
    }
    // 3) P1/P3 對打：側帶游走射擊——永不定點（爪擊鎖定當下位置 0.6s 預警，
    //    持續橫移即自然脫離落點）；核心對側 ~280px 帶內小步折返，轉身點射後立即續走。
    const side = state.px <= state.boss.x ? -1 : 1;
    const anchor = Math.min(
      Math.max(state.boss.x + side * 280, arenaLeft + 90),
      arenaLeft + state.view - 90,
    );
    strafeFlip = -strafeFlip;
    const strafeTarget = anchor + strafeFlip * 70;
    const moveDir = Math.sign(strafeTarget - state.px || 1);
    await clearHeld();
    await press(keyOf(moveDir));
    await sleep(rand(240, 320));
    await release(keyOf(moveDir));
    if (state.ammo > 0) {
      // 跳射節奏（保底技能集：移動/跳躍/基礎吸射）：核心懸浮帶（y≈165-190）
      // 地面平射搆不到——起跳至高點發射，準星輔助收斂命中（實測 35%+ vs 地面 10%）。
      const faceDir = Math.sign(state.boss.x - state.px || 1);
      await press(keyOf(faceDir));
      await sleep(60);
      await release(keyOf(faceDir));
      await page.keyboard.press('Z', { delay: 30 });
      await sleep(300);
      await page.keyboard.press('X', { delay: 40 });
      shotsFired += 1;
    }
  }

  const elapsed = Math.round((Date.now() - startedAt) / 100) / 10;
  await page.screenshot({ path: `${OUT_DIR}l20-pure-star-final.png` });
  writeFileSync(
    `${OUT_DIR}l20-pure-star-trace.json`,
    JSON.stringify(
      { result, elapsedSec: elapsed, view, segmentRetries, fullRetries, shotsFired, trace },
      null,
      2,
    ),
  );
  console.log(
    `結果：${result}｜用時 ${elapsed}s｜視寬 ${view}｜段重試 ${segmentRetries}｜整場重試 ${fullRetries}｜發射 ${shotsFired}`,
  );
  await browser.close();
  if (result !== 'won') process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
