// EX 三王純標準星保底實證 bot v2（§86／主計畫 §3.2 DPS 檢查點）：1200 邏輯寬全程 trace。
// v1（ex-bot-audit）的 Node 側輪詢決策延遲 ~500ms，EX 節奏 ×1.15 下反應不足；
// v2 把決策迴圈搬進瀏覽器（setInterval 80ms tick 同步讀 __sp、合成 KeyboardEvent），
// 貼近人類反應粒度。純標準星紀律不變：只用移動/跳躍/基礎吸射，週期 grantStar('jelly')。
// 用法：node scripts/ex-bot-driver.mjs <levelId: 12|16|20> [port] [--assist]
// --assist：受控 i-frame（grantInvuln 週期護盾）隔離「迴避」軸，單獨驗證
// 「純標準星輸出鏈可完成」（擊破鏈無 DPS 死鎖）；迴避軸由純模式 trace 與
// FSM telegraph 時窗單測分別背書。
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const levelId = Number(process.argv[2] ?? '12');
const port = process.argv[3] ?? '3113';
const assist = process.argv.includes('--assist');
const RUN_TIMEOUT_MS = 900_000;
const OUT_DIR = new URL('../../../screenshots/starpuff-v13/', import.meta.url).pathname;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 瀏覽器內 driver：合成鍵事件驅動 Phaser KeyboardPlugin（keyCode 以 defineProperty 注入）。
function installDriver({ targetLevelId, assistMode }) {
  const KEY = { left: 37, right: 39, jump: 90, shoot: 88 }; // Arrow/Z/X
  const held = new Set();
  const dispatch = (type, keyCode) => {
    const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'keyCode', { get: () => keyCode });
    Object.defineProperty(ev, 'which', { get: () => keyCode });
    window.dispatchEvent(ev);
  };
  const press = (keyCode) => {
    if (held.has(keyCode)) return;
    held.add(keyCode);
    dispatch('keydown', keyCode);
  };
  const release = (keyCode) => {
    if (!held.has(keyCode)) return;
    held.delete(keyCode);
    dispatch('keyup', keyCode);
  };
  const releaseAll = () => {
    for (const keyCode of [...held]) release(keyCode);
  };
  const tap = (keyCode, ms = 60) => {
    dispatch('keydown', keyCode);
    setTimeout(() => dispatch('keyup', keyCode), ms);
  };

  const driver = {
    trace: [],
    shots: 0,
    lastGrantAt: 0,
    lastTraceAt: 0,
    lastJumpAt: 0,
    lastInvulnAt: 0,
    strafeFlip: 1,
    assist: assistMode === true,
    stop: false,
  };
  window.__exDriver = driver;

  const tick = () => {
    if (driver.stop) return;
    const sp = window.__sp;
    if (!sp || sp.scene() !== 'Game') return;
    const bossHp = sp.bossHp();
    if (bossHp <= 0) {
      releaseAll();
      return;
    }
    const now = performance.now();
    const px = sp.probe().x;
    const hp = sp.playerHp();
    const boss = sp.bossPos();
    const bodies = sp.bossBodies();
    const fsm = sp.bossState();
    const ammo = sp.ammo().ammo;
    const shotsArr = sp.bossShots();
    const hazards = sp.bossHazards();
    const foes = sp.enemyPositions();
    const tide = sp.tide();
    const view = sp.view().width;
    const arenaLeft = 400;
    const center = arenaLeft + view / 2;

    if (now - driver.lastTraceAt >= 500) {
      driver.lastTraceAt = now;
      driver.trace.push({
        t: Math.round(now),
        phase: fsm?.phase ?? '-',
        state: fsm?.state ?? '-',
        bossHp,
        hp,
        px: Math.round(px),
      });
    }
    // 純標準星紀律：空匣即補一發 jelly（模擬吸食補給怪）。
    if (now - driver.lastGrantAt >= 1200 && ammo === 0) {
      driver.lastGrantAt = now;
      sp.grantStar('jelly');
    }
    // assist 模式：受控 i-frame 週期續盾（輸出鏈驗證，迴避軸另證）。
    if (driver.assist && now - (driver.lastInvulnAt ?? 0) >= 2500) {
      driver.lastInvulnAt = now;
      sp.grantInvuln(3000);
    }

    const jumpReady = now - driver.lastJumpAt > 620;
    const jump = () => {
      if (!jumpReady) return;
      driver.lastJumpAt = now;
      tap(90, 60);
    };
    const shoot = () => {
      tap(88, 50);
      driver.shots += 1;
    };
    const face = (dir) => {
      if (dir > 0) {
        release(37);
        press(39);
      } else {
        release(39);
        press(37);
      }
    };
    const stopMove = () => {
      release(37);
      release(39);
    };

    // assist 模式（輸出鏈隔離驗證）：i-frame 常駐下跳過全部迴避分支——
    // 純模式的雙子貼臉會讓迴避分支永久搶佔射擊窗（L12 實測），失去驗證目的。
    if (driver.assist) {
      if (ammo > 0) {
        face(Math.sign(boss.x - px || 1));
        if (targetLevelId === 20 && fsm?.phase !== 'p2') jump();
        shoot();
      } else {
        face(px > center ? -1 : 1);
      }
      return;
    }
    // 1) 貼身接觸傷迴避（最高優先）：最近本體 120px 內反向撤離＋跳；
    //    被逼到邊緣死角時改朝魔王方向跳越（穿頭頂換邊）。
    const nearest = bodies.reduce(
      (best, b) => (Math.abs(b.x - px) < Math.abs(best.x - px) ? b : best),
      bodies[0] ?? boss,
    );
    if (Math.abs(nearest.x - px) < 120) {
      const escapeDir = px >= nearest.x ? 1 : -1;
      const cornered =
        (escapeDir < 0 && px < arenaLeft + 160) || (escapeDir > 0 && px > arenaLeft + view - 160);
      face(cornered ? -escapeDir : escapeDir);
      jump();
      return;
    }
    // 1b) 小怪貼身（補給怪/召喚怪接觸傷＝idle 期次要死因）：反向跳離地面帶。
    const nearFoe = foes.reduce(
      (best, f) => (best === null || Math.abs(f.x - px) < Math.abs(best.x - px) ? f : best),
      null,
    );
    if (nearFoe && Math.abs(nearFoe.x - px) < 90 && nearFoe.y > 280) {
      face(px >= nearFoe.x ? 1 : -1);
      jump();
      return;
    }
    // 2) L12 讀招：beam/pincer 跳越；crossbeam 跳低束後站定讓高束過頭；
    //    pillar/rain 錨玩家落點——大步位移。
    if (targetLevelId === 12 && fsm) {
      if (fsm.state === 'beam' || fsm.state === 'pincer') {
        jump();
      } else if (fsm.state === 'crossbeam') {
        if (jumpReady) jump();
        else stopMove();
        return;
      } else if (fsm.state === 'pillar' || fsm.state === 'rain') {
        face(px > center ? -1 : 1);
        return;
      }
    }
    // 3) 低帶 hazard（晶柱/光束/糖漿波）：帶內即跳。
    const lowHazard = hazards.some(
      (h) => h.y > 320 && Math.abs(h.x - px) < Math.max(110, h.w / 2 + 36),
    );
    if (lowHazard) {
      jump();
      return;
    }
    // 4) 彈幕迴避：垂直帶內逼近的彈體，反向側移。
    const nearShot = shotsArr.some((s) => Math.abs(s.x - px) < 100 && s.y > 200);
    if (nearShot) {
      face(px > center ? -1 : 1);
      return;
    }
    // 5) L20 P2 生存段：橫移風箏；過熱窗面向核心射。
    if (targetLevelId === 20 && fsm?.phase === 'p2') {
      const overheat = boss.y > 150;
      if (overheat && ammo > 0) {
        face(boss.x - px > 0 ? 1 : -1);
        shoot();
        return;
      }
      const kite = Math.floor(now / 1500) % 2 === 0 ? 1 : -1;
      const atEdge =
        (kite < 0 && px < arenaLeft + 120) || (kite > 0 && px > arenaLeft + view - 120);
      face(atEdge ? -kite : kite);
      return;
    }
    // 6) L16 漲潮：退向本體對側乾帶等窗。
    if (targetLevelId === 16 && tide && tide.phase === 'high' && px > center) {
      face(-1);
      return;
    }
    // 7) 對打：遠側安定輸出——離最近本體 ≥400px 的遠帶站位（接觸傷實測為 bot
    //    首要死因）；900ms 時間片小步折返（80ms tick 下逐 tick 翻轉會原地抖動）；
    //    射擊窗與走位分離：站位帶內先面向魔王再射，L20 核心懸浮帶起跳高點射。
    const side = px <= boss.x ? -1 : 1;
    const flip = Math.floor(now / 900) % 2 === 0 ? 1 : -1;
    const anchor = Math.min(Math.max(boss.x + side * 400, arenaLeft + 80), arenaLeft + view - 80);
    const target = anchor + flip * 40;
    const drift = Math.abs(target - px) > 60 ? Math.sign(target - px) : 0;
    if (ammo > 0 && Math.floor(now / 400) % 2 === 0) {
      face(Math.sign(boss.x - px || 1));
      if (targetLevelId === 20) jump();
      shoot();
      return;
    }
    if (drift !== 0) face(drift);
    else stopMove();
  };
  driver.interval = setInterval(tick, 80);
}

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

  // 前室直走（不拾增益＝純標準星紀律）：入 arena 觸發入場運鏡。
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.__sp.bossHp() > 0, null, { timeout: 30000 });
  await page.keyboard.up('ArrowRight');
  const maxHp = await page.evaluate(() => window.__sp.bossHp());
  console.log(`EX 魔王 HP ${maxHp}，開戰（瀏覽器內 driver 80ms tick）`);

  await page.evaluate(installDriver, { targetLevelId: levelId, assistMode: assist });

  const startedAt = Date.now();
  const nodeTrace = [];
  let fullRetries = 0;
  let segmentRetries = 0;
  let lastBossHp = maxHp;
  let phaseShots = { p2: false, p3: false };
  let result = 'timeout';

  while (Date.now() - startedAt < RUN_TIMEOUT_MS) {
    const exCleared = await sp(
      (id) => window.__sp.save().levels[String(id)]?.exCleared === true,
      levelId,
    );
    if (exCleared) {
      result = 'won';
      break;
    }
    const scene = await sp(() => window.__sp.scene());
    if (scene === 'Result') {
      fullRetries += 1;
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => window.__sp.scene() === 'Game', null, { timeout: 15000 });
      await page.keyboard.down('ArrowRight');
      await page
        .waitForFunction(() => window.__sp.bossHp() > 0, null, { timeout: 30000 })
        .catch(() => {});
      await page.keyboard.up('ArrowRight');
      // 場景 restart 後 driver interval 仍在（掛 window 不隨 scene 銷毀）。
      lastBossHp = maxHp;
      continue;
    }
    const snap = await sp(() => ({
      bossHp: window.__sp.bossHp(),
      fsm: window.__sp.bossState(),
      hp: window.__sp.playerHp(),
      px: Math.round(window.__sp.probe().x),
      shots: window.__exDriver?.shots ?? -1,
    }));
    if (snap) {
      if (snap.bossHp > lastBossHp) segmentRetries += 1;
      if (snap.bossHp > 0) lastBossHp = snap.bossHp;
      // trace 收斂到 Node 側（瀏覽器側狀態跨 evaluate 失敗時全損的教訓）。
      nodeTrace.push({
        t: Date.now() - startedAt,
        phase: snap.fsm?.phase ?? '-',
        state: snap.fsm?.state ?? '-',
        bossHp: snap.bossHp,
        hp: snap.hp,
        px: snap.px,
        shots: snap.shots,
      });
      const midNow = snap.fsm ? snap.fsm.phase === 'p2' : snap.bossHp <= maxHp * 0.66;
      const lateNow = snap.fsm ? snap.fsm.phase === 'p3' : snap.bossHp <= maxHp * 0.33;
      if (!phaseShots.p2 && midNow && snap.bossHp > 0) {
        phaseShots.p2 = true;
        await page.screenshot({ path: `${OUT_DIR}l${levelId}-ex-p2.png` });
      }
      if (!phaseShots.p3 && lateNow && snap.bossHp > 0) {
        phaseShots.p3 = true;
        await page.screenshot({ path: `${OUT_DIR}l${levelId}-ex-p3.png` });
      }
    }
    await sleep(400);
  }

  const stats = await sp(() => {
    const driver = window.__exDriver;
    driver.stop = true;
    clearInterval(driver.interval);
    return { shots: driver.shots };
  });
  const elapsed = Math.round((Date.now() - startedAt) / 100) / 10;
  const shotsFired = stats?.shots ?? nodeTrace.at(-1)?.shots ?? -1;
  await page.screenshot({ path: `${OUT_DIR}l${levelId}-ex-final.png` });
  writeFileSync(
    `${OUT_DIR}l${levelId}-ex${assist ? '-assist' : ''}-trace.json`,
    JSON.stringify(
      {
        levelId,
        assist,
        result,
        elapsedSec: elapsed,
        view,
        segmentRetries,
        fullRetries,
        shotsFired,
        trace: nodeTrace,
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
