// EX 三王純標準星保底實證 bot（§86／主計畫 §3.2 DPS 檢查點）：1200 邏輯寬全程 trace。
// 方法論沿 voidra-bot-audit：週期 grantStar('jelly') 模擬吸彈（純標準星、不用變身/
// 混合/增益、前室台座直走不拾），操作走真實鍵盤事件；EX 難度可高但必須可通關。
// 用法：node scripts/ex-bot-audit.mjs <levelId: 12|16|20> [port]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const levelId = Number(process.argv[2] ?? '12');
const port = process.argv[3] ?? '3113';
const RUN_TIMEOUT_MS = 900_000;
const OUT_DIR = new URL('../../../screenshots/starpuff-v13/', import.meta.url).pathname;
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
  await page.evaluate((id) => window.__sp.gotoLevel(id, true), levelId);
  await page.waitForFunction((id) => window.__sp.stage() === id, levelId, { timeout: 15000 });
  const view = await page.evaluate(() => window.__sp.view().width);
  console.log(`L${levelId} EX｜邏輯視寬：${view}`);

  // 前室直走（不拾增益＝純標準星紀律；補給怪屬彈藥可吸）：邊走邊吸滿匣入場。
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('X');
  await page.waitForFunction(() => window.__sp.bossHp() > 0, null, { timeout: 30000 });
  await page.keyboard.up('X');
  await page.keyboard.up('ArrowRight');
  const maxHp = await page.evaluate(() => window.__sp.bossHp());
  console.log(`EX 魔王 HP ${maxHp}，開戰`);

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
  let phaseShots = { p2: false, p3: false };
  let result = 'timeout';

  while (Date.now() - startedAt < RUN_TIMEOUT_MS) {
    const scene = await sp(() => window.__sp.scene());
    // 勝利判定：exCleared 寫檔為單一真值（L20 EX 勝利走 Credits、其餘走 Result）。
    const exCleared = await sp(
      (id) => window.__sp.save().levels[String(id)]?.exCleared === true,
      levelId,
    );
    if (exCleared) {
      result = 'won';
      break;
    }
    if (scene === 'Result') {
      // 敗北重試（人類同路徑：再戰魔王，EX 模式由 Result 保留）。
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
      bodies: window.__sp.bossBodies(),
      fsm: window.__sp.bossState(),
      ammo: window.__sp.ammo().ammo,
      shots: window.__sp.bossShots(),
      hazards: window.__sp.bossHazards(),
      tide: window.__sp.tide(),
    }));
    if (!state || state.bossHp <= 0) {
      await sleep(200);
      continue;
    }
    // 段起點重試偵測（L20 EX）：魔王血量回升＝P2/P3 段重試。
    if (state.bossHp > lastBossHp) segmentRetries += 1;
    lastBossHp = state.bossHp;
    if (Date.now() - lastTraceAt >= 500) {
      lastTraceAt = Date.now();
      trace.push({
        t: Date.now() - startedAt,
        phase: state.fsm?.phase ?? '-',
        state: state.fsm?.state ?? '-',
        bossHp: state.bossHp,
        hp: state.hp,
        px: Math.round(state.px),
      });
    }
    // 進度截圖：FSM 可觀測用 phase，否則以 bossHp 比例近似（mid ≤66%、late ≤33%）。
    const midNow = state.fsm ? state.fsm.phase === 'p2' : state.bossHp <= maxHp * 0.66;
    const lateNow = state.fsm ? state.fsm.phase === 'p3' : state.bossHp <= maxHp * 0.33;
    if (!phaseShots.p2 && midNow) {
      phaseShots.p2 = true;
      await page.screenshot({ path: `${OUT_DIR}l${levelId}-ex-p2.png` });
    }
    if (!phaseShots.p3 && lateNow) {
      phaseShots.p3 = true;
      await page.screenshot({ path: `${OUT_DIR}l${levelId}-ex-p3.png` });
    }
    // 純標準星紀律：空匣即補一發 jelly（模擬吸食補給怪）。
    if (Date.now() - lastGrantAt >= 1500 && state.ammo === 0) {
      lastGrantAt = Date.now();
      await sp(() => window.__sp.grantStar('jelly'));
    }
    const arenaLeft = 400;
    const center = arenaLeft + view / 2;
    // 0) L12 FSM 讀招預躲（EX 去同步下讀招取代背板）：
    //    beam/pincer＝跳越；crossbeam＝跳低束後站定讓高束（EX 錯半拍）過頭；
    //    晶柱/晶雨＝落點錨玩家位置，大步位移脫離錨帶。
    if (levelId === 12 && state.fsm) {
      const move = state.fsm.state;
      if (move === 'crossbeam') {
        await clearHeld();
        await page.keyboard.press('Z', { delay: 30 });
        await sleep(rand(280, 340));
        // 落地站定：高束帶（低束上方 86px）從頭頂掠過，再跳反而撞上。
        await sleep(900);
        continue;
      }
      if (move === 'beam' || move === 'pincer') {
        await clearHeld();
        await page.keyboard.press('Z', { delay: 30 });
        await sleep(rand(300, 380));
        continue;
      }
      if (move === 'pillar' || move === 'rain') {
        const dir = state.px > center ? -1 : 1;
        await clearHeld();
        await press(keyOf(dir));
        await sleep(rand(420, 520));
        await release(keyOf(dir));
        continue;
      }
    }
    // 1) 低帶 hazard 即跳（晶柱隆起/光束/糖漿波 active 窗短，滯空即過）。
    const lowHazard = (state.hazards ?? []).some(
      (h) => h.y > 320 && Math.abs(h.x - state.px) < Math.max(120, h.w / 2 + 40),
    );
    if (lowHazard) {
      await page.keyboard.press('Z', { delay: 30 });
      await sleep(rand(320, 400));
      continue;
    }
    // 1b) 彈幕近身迴避：側移離開彈道。
    const nearShot = state.shots.some(
      (s) => Math.abs(s.x - state.px) < 110 && Math.abs(s.y - 340) < 130,
    );
    if (nearShot) {
      const dir = state.px > center ? -1 : 1;
      await clearHeld();
      await press(keyOf(dir));
      await sleep(rand(240, 340));
      await release(keyOf(dir));
      continue;
    }
    // 2) L20 EX P2 生存段：持續橫移風箏；過熱窗（核心下沉）面向核心點射。
    if (levelId === 20 && state.fsm?.phase === 'p2') {
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
        (kite < 0 && state.px < arenaLeft + 120) || (kite > 0 && state.px > arenaLeft + view - 120);
      await clearHeld();
      await press(keyOf(atEdge ? -kite : kite));
      await sleep(300);
      await release(keyOf(atEdge ? -kite : kite));
      continue;
    }
    // 3) L16 EX 潮汐防護：漲潮浸帶時退向本體對側乾位等窗（週期恆留保底位）。
    if (levelId === 16 && state.tide && state.tide.phase === 'high') {
      const dir = state.px > center ? -1 : 1;
      await clearHeld();
      await press(keyOf(dir));
      await sleep(240);
      await release(keyOf(dir));
    }
    // 4) 近身壓迫跳離（L12 雙子夾擊/緩滑貼身、L16 Bubbla 躍出）：遠離「最近本體」
    //    反向跳離（雙子對稱包夾下遠離 boss 中心可能撞上另一具）。
    const bodies = state.bodies ?? [];
    const nearest = bodies.reduce(
      (best, b) => (Math.abs(b.x - state.px) < Math.abs(best.x - state.px) ? b : best),
      bodies[0] ?? state.boss,
    );
    if (Math.abs(nearest.x - state.px) < 130) {
      const dir = state.px > nearest.x ? 1 : -1;
      await clearHeld();
      await press(keyOf(dir));
      await page.keyboard.press('Z', { delay: 30 });
      await sleep(rand(320, 420));
      await release(keyOf(dir));
      continue;
    }
    // 5) 對打通則：側帶游走——永不定點（telegraph 落點以持續橫移自然脫離）；
    //    魔王對側 ~300px 帶內小步折返。
    const side = state.px <= state.boss.x ? -1 : 1;
    const anchor = Math.min(
      Math.max(state.boss.x + side * 300, arenaLeft + 90),
      arenaLeft + view - 90,
    );
    strafeFlip = -strafeFlip;
    const strafeTarget = anchor + strafeFlip * 70;
    const moveDir = Math.sign(strafeTarget - state.px || 1);
    await clearHeld();
    await press(keyOf(moveDir));
    await sleep(rand(240, 320));
    await release(keyOf(moveDir));
    if (state.ammo > 0) {
      const faceDir = Math.sign(state.boss.x - state.px || 1);
      await press(keyOf(faceDir));
      await sleep(60);
      await release(keyOf(faceDir));
      // 射法分流：L12 雙子/裂核與 L16 王座身軀站地面帶——地面平射命中最穩；
      // L20 核心懸浮帶需起跳至高點發射（v12 實測 35%+ vs 地面 10%）。
      if (levelId === 20) {
        await page.keyboard.press('Z', { delay: 30 });
        await sleep(300);
      }
      await page.keyboard.press('X', { delay: 40 });
      shotsFired += 1;
    }
  }

  const elapsed = Math.round((Date.now() - startedAt) / 100) / 10;
  await page.screenshot({ path: `${OUT_DIR}l${levelId}-ex-final.png` });
  writeFileSync(
    `${OUT_DIR}l${levelId}-ex-trace.json`,
    JSON.stringify(
      {
        levelId,
        result,
        elapsedSec: elapsed,
        view,
        segmentRetries,
        fullRetries,
        shotsFired,
        trace,
      },
      null,
      2,
    ),
  );
  console.log(
    `L${levelId} EX 結果：${result}｜用時 ${elapsed}s｜視寬 ${view}｜段重試 ${segmentRetries}｜整場重試 ${fullRetries}｜發射 ${shotsFired}`,
  );
  await browser.close();
  if (result !== 'won') process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
