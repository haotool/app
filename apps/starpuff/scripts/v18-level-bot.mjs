// v18 走動關平衡量測 bot（#804/#805/#806 前後對比 SSOT）：真實鍵盤事件遊玩，
// 不用 grantStar/配額輔助——量測「彈藥斷檔」「生成停轉」「死亡數」三軸原始數據。
// 模式：play＝固定時窗內以基礎吸射推進通關；idle＝掛機觀察生成器（授長無敵隔離存活軸）；
// stall＝#804 定向重現——官方 spawn hook 填滿同屏上限顆不可吸紮根怪＋零彈掛機，
// 量測生成器停轉時長（修復前應凍結全程、修復後救援閾值內必出可吸怪）；
// forage＝#805 供給可及性量測——駐守世界中段定點覓食（吃怪維持族群換血、不推進
// 不打精英不進門），彈藥斷檔佔比與覓食節奏收斂為供給指標，排除推進/精英/死亡重試噪音。
// 用法：node scripts/v18-level-bot.mjs <levelId> [--mode play|idle|stall|forage] [--cap 秒] [--label 名稱] [--port 3018]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const levelId = Number(process.argv[2] ?? '5');
const mode = process.argv.includes('--mode')
  ? process.argv[process.argv.indexOf('--mode') + 1]
  : 'play';
const capSec = process.argv.includes('--cap')
  ? Number(process.argv[process.argv.indexOf('--cap') + 1])
  : mode === 'idle'
    ? 180
    : 420;
const label = process.argv.includes('--label')
  ? process.argv[process.argv.indexOf('--label') + 1]
  : `l${String(levelId).padStart(2, '0')}-${mode}`;
const port = process.argv.includes('--port')
  ? process.argv[process.argv.indexOf('--port') + 1]
  : '3018';
// --shots：playtest 抽驗模式——起點/中段/結尾各留一張截圖佐證。
const shots = process.argv.includes('--shots');
// --midpoint：idle 前先自動走到世界中段再站定——起點掛機有「生成帶恆在視外
// 350px+」的結構性偏差，中場站位讓 ±350 供給圈覆蓋雙向生成帶（#805 口徑）。
const midpoint = process.argv.includes('--midpoint');
const OUT_DIR = new URL('../../../screenshots/starpuff-v18/', import.meta.url).pathname;

// 瀏覽器內 driver：80ms tick 合成鍵事件（Arrow/Z/X），逐 tick 累計平衡指標。
function installDriver({ playMode, forageMode, anchorX, floodPlatformXs, maxOnScreen }) {
  const KEY = { left: 37, right: 39, jump: 90, shoot: 88 };
  const held = new Set();
  const dispatch = (type, keyCode) => {
    const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'keyCode', { get: () => keyCode });
    Object.defineProperty(ev, 'which', { get: () => keyCode });
    window.dispatchEvent(ev);
  };
  const press = (k) => {
    if (held.has(k)) return;
    held.add(k);
    dispatch('keydown', k);
  };
  const release = (k) => {
    if (!held.has(k)) return;
    held.delete(k);
    dispatch('keyup', k);
  };
  const face = (dir) => {
    if (dir > 0) {
      release(KEY.left);
      press(KEY.right);
    } else if (dir < 0) {
      release(KEY.right);
      press(KEY.left);
    } else {
      release(KEY.left);
      release(KEY.right);
    }
  };
  const tap = (k, ms = 70) => {
    dispatch('keydown', k);
    setTimeout(() => dispatch('keyup', k), ms);
  };

  // 恆可吸品種（條件可吸 shelly/drilly/bubbla/twinkla 保守不計，對齊飢荒保證律口徑）。
  // 量測用近似集，真值=logic/combat.ts canInhale；一致性由 combat.test.ts 漂移守門。
  const INHALABLE = new Set([
    'jelly',
    'floaty',
    'puffy',
    'zappy',
    'glowy',
    'spora',
    'gusty',
    'boomy',
    'magno',
    'mirri',
    'splatta',
    'cometa',
  ]);
  const HARMFUL = new Set(['spiky', 'chompy']);

  const d = {
    m: {
      ticks: 0,
      elapsedMs: 0,
      deaths: 0,
      // 開門前彈藥斷檔：總時長／最長連續窗。
      ammoZeroMs: 0,
      longestAmmoZeroMs: 0,
      // 飢荒（零彈＋同屏零可吸）：總時長／最長窗。
      starvingMs: 0,
      longestStarvingMs: 0,
      // 生成停轉（同屏滿且零可吸）：#804 主指標。
      fullStallMs: 0,
      longestFullStallMs: 0,
      // 配額凍結：開門前 killCount 未推進的最長窗。
      longestQuotaStallMs: 0,
      // 可及供給真空（#805 主指標）：玩家水平 ±350px 且地面帶（y ≥ 280）內
      // 零恆可吸個體的時窗——gusty 高空盤旋/spora 遠處紮根名義可吸但不可及，
      // 此指標量測「伸手可得的彈藥供給」。
      reachVacuumMs: 0,
      longestReachVacuumMs: 0,
      // 滿潮生成計數（§107.3 佐證欄）：flood 相位內 alive 總數上升即計為生成。
      floodSpawns: 0,
      preGateMs: 0,
      gateOpenAtMs: -1,
      kills: 0,
      samples: [],
    },
    cur: { ammoZero: 0, starving: 0, fullStall: 0, quotaStall: 0, reachVacuum: 0 },
    prevHp: -1,
    prevKill: -1,
    prevAlive: -1,
    lastSampleAt: 0,
    lastJumpAt: 0,
    lastShotAt: 0,
    lastX: 0,
    lastMoveAt: 0,
    lastInvulnAt: -99999,
    stop: false,
  };
  window.__v18 = d;

  const tick = () => {
    if (d.stop) return;
    const sp = window.__sp;
    let snap;
    try {
      if (!sp || sp.scene() !== 'Game') return;
      snap = {
        px: sp.probe().x,
        py: sp.probe().y,
        hp: sp.playerHp(),
        ammo: sp.ammo().ammo,
        alive: sp.alive(),
        gateOpen: sp.gateOpen(),
        quota: sp.quota(),
        enemies: sp.enemies(),
        tide: sp.tide(),
      };
    } catch {
      return; // 場景轉換窗（死亡重試 restart）內部系統短暫不可用。
    }
    const now = performance.now();
    const dt = 80;
    d.m.ticks += 1;
    d.m.elapsedMs += dt;

    // 指標累計（開門前才計，開門後斷檔無意義）。
    if (!snap.gateOpen) {
      d.m.preGateMs += dt;
      const zero = snap.ammo === 0;
      const starving = zero && snap.alive.inhalable === 0;
      const fullStall = starving && snap.alive.total >= maxOnScreen;
      d.cur.ammoZero = zero ? d.cur.ammoZero + dt : 0;
      d.cur.starving = starving ? d.cur.starving + dt : 0;
      d.cur.fullStall = fullStall ? d.cur.fullStall + dt : 0;
      if (zero) d.m.ammoZeroMs += dt;
      if (starving) d.m.starvingMs += dt;
      if (fullStall) d.m.fullStallMs += dt;
      d.m.longestAmmoZeroMs = Math.max(d.m.longestAmmoZeroMs, d.cur.ammoZero);
      d.m.longestStarvingMs = Math.max(d.m.longestStarvingMs, d.cur.starving);
      d.m.longestFullStallMs = Math.max(d.m.longestFullStallMs, d.cur.fullStall);
      d.cur.quotaStall = snap.quota.killCount === d.prevKill ? d.cur.quotaStall + dt : 0;
      d.m.longestQuotaStallMs = Math.max(d.m.longestQuotaStallMs, d.cur.quotaStall);
      d.prevKill = snap.quota.killCount;
      d.m.kills = snap.quota.killCount;
      const reachable = snap.enemies.some(
        (e) => INHALABLE.has(e.kind) && Math.abs(e.x - snap.px) <= 350 && e.y >= 280,
      );
      d.cur.reachVacuum = reachable ? 0 : d.cur.reachVacuum + dt;
      if (!reachable) d.m.reachVacuumMs += dt;
      d.m.longestReachVacuumMs = Math.max(d.m.longestReachVacuumMs, d.cur.reachVacuum);
    } else if (d.m.gateOpenAtMs < 0) {
      d.m.gateOpenAtMs = d.m.elapsedMs;
    }
    if (d.prevHp > 0 && snap.hp <= 0) d.m.deaths += 1;
    d.prevHp = snap.hp;
    // 滿潮生成計數：flood 相位內 alive 總數逐 tick 上升量（idle 乾淨儀器＝滿潮內生成數）。
    if (snap.tide?.phase === 'flood' && d.prevAlive >= 0 && snap.alive.total > d.prevAlive) {
      d.m.floodSpawns += snap.alive.total - d.prevAlive;
    }
    d.prevAlive = snap.alive.total;
    if (now - d.lastSampleAt >= 1000) {
      d.lastSampleAt = now;
      d.m.samples.push({
        t: Math.round(d.m.elapsedMs / 100) / 10,
        x: Math.round(snap.px),
        hp: snap.hp,
        ammo: snap.ammo,
        kill: snap.quota.killCount,
        alive: snap.alive.total,
        inh: snap.alive.inhalable,
        tide: snap.tide ? snap.tide.phase : undefined,
      });
    }

    if (!playMode && !forageMode) {
      // idle 掛機：授長無敵隔離存活軸，純觀察生成器。
      if (now - d.lastInvulnAt >= 30000) {
        d.lastInvulnAt = now;
        try {
          sp.grantInvuln(60000);
        } catch {
          /* 轉場窗忽略 */
        }
      }
      return;
    }
    if (forageMode) {
      // 覓食模式（#805 供給量測）：定點錨守＋吃怪換血＋滿匣傾瀉，隔離推進噪音。
      if (snap.hp <= 0) {
        face(0);
        release(KEY.shoot);
        return;
      }
      try {
        const elite = sp.elite();
        if (elite.armed && !elite.done) sp.slayElite(); // 精英噪音隔離（官方 e2e 鉤子）。
      } catch {
        /* 轉場窗忽略 */
      }
      if (snap.gateOpen) {
        face(0);
        release(KEY.shoot);
        return;
      }
      if (snap.ammo >= 3) {
        release(KEY.shoot);
        if (now - d.lastShotAt >= 700) {
          d.lastShotAt = now;
          tap(KEY.shoot, 60); // 滿匣傾瀉維持覓食需求。
        }
        return;
      }
      let best = null;
      let bestScore = Infinity;
      for (const e of snap.enemies) {
        if (!INHALABLE.has(e.kind)) continue;
        if (Math.abs(e.x - anchorX) > 650) continue;
        const score = Math.abs(e.x - snap.px) + Math.abs(e.y - snap.py) * 1.5;
        if (score < bestScore) {
          bestScore = score;
          best = e;
        }
      }
      if (!best) {
        release(KEY.shoot);
        const back = anchorX - snap.px;
        face(Math.abs(back) > 60 ? Math.sign(back) : 0);
        return;
      }
      const dx = best.x - snap.px;
      const dy = best.y - snap.py;
      // 地面帶策略（#805 口徑）：dy 窗與 play 一致（-140），不主動跳吸高空巡航帶
      // ——量測「不諳跳吸的地面玩家」視角的供給可及性，避免 bot 補償稀釋 mix 效果。
      if (Math.abs(dx) < 190 && dy > -140 && dy < 80) {
        face(Math.abs(dx) < 36 ? 0 : Math.sign(dx));
        press(KEY.shoot);
        if (dy < -70 && now - d.lastJumpAt >= 600) {
          d.lastJumpAt = now;
          tap(KEY.jump, 260);
        }
      } else {
        release(KEY.shoot);
        face(Math.sign(dx));
      }
      return;
    }

    // ===== play 策略（純基礎吸射＋跳躍；不用下砸/變身/受控賦星）=====
    if (snap.hp <= 0) {
      face(0);
      release(KEY.shoot);
      return;
    }
    if (snap.gateOpen) {
      release(KEY.shoot);
      face(1);
      if (now - d.lastJumpAt >= 800) {
        d.lastJumpAt = now;
        tap(KEY.jump);
      }
      return;
    }
    // 滿潮避難（擬人策略）：落水/地面帶時導航至最近平台中心＋節奏跳；
    // 已站上平台層（py ≤ 330）不再亂跳。避難優先於獵食。
    if (snap.tide && snap.tide.phase === 'flood' && snap.py > 330) {
      let navX = null;
      let navD = Infinity;
      for (const x of floodPlatformXs) {
        const dd = Math.abs(x - snap.px);
        if (dd < navD) {
          navD = dd;
          navX = x;
        }
      }
      if (navX !== null) face(navD < 30 ? 0 : Math.sign(navX - snap.px));
      if (now - d.lastJumpAt >= 380) {
        d.lastJumpAt = now;
        tap(KEY.jump, 230);
      }
      if (navX !== null) return;
    }
    // 近身威脅迴避：不可吸威脅貼臉且無彈 → 跳離。
    const nearThreat = snap.enemies.find(
      (e) => HARMFUL.has(e.kind) && Math.abs(e.x - snap.px) < 90 && Math.abs(e.y - snap.py) < 70,
    );
    if (nearThreat && snap.ammo === 0 && now - d.lastJumpAt >= 500) {
      d.lastJumpAt = now;
      tap(KEY.jump, 200);
    }
    // 卡位偵測：4s 未位移 → 跳一下輔助脫困。
    if (Math.abs(snap.px - d.lastX) > 30) {
      d.lastX = snap.px;
      d.lastMoveAt = now;
    } else if (now - d.lastMoveAt >= 4000 && now - d.lastJumpAt >= 700) {
      d.lastJumpAt = now;
      tap(KEY.jump, 200);
    }

    if (snap.ammo === 0) {
      // 覓食：最近恆可吸目標。
      let best = null;
      let bestScore = Infinity;
      for (const e of snap.enemies) {
        if (!INHALABLE.has(e.kind)) continue;
        const score = Math.abs(e.x - snap.px) + Math.abs(e.y - snap.py) * 1.5;
        if (score < bestScore) {
          bestScore = score;
          best = e;
        }
      }
      if (!best) {
        release(KEY.shoot);
        face(1); // 無目標：向右探索逼出生成。
        return;
      }
      const dx = best.x - snap.px;
      const dy = best.y - snap.py;
      if (Math.abs(dx) < 190 && dy > -140 && dy < 80) {
        face(Math.abs(dx) < 36 ? 0 : Math.sign(dx));
        press(KEY.shoot); // 長按吸入。
        // 目標偏高（gusty/floaty 帶）：跳擊縮短垂直差。
        if (dy < -70 && now - d.lastJumpAt >= 600) {
          d.lastJumpAt = now;
          tap(KEY.jump, 260);
        }
      } else {
        release(KEY.shoot);
        face(Math.sign(dx));
      }
      return;
    }
    // 有彈：清最近敵（含紮根堵路者），射擊窗節流 340ms。
    release(KEY.shoot);
    let target = null;
    let tScore = Infinity;
    for (const e of snap.enemies) {
      const adx = Math.abs(e.x - snap.px);
      const ady = Math.abs(e.y - snap.py);
      if (adx > 430 || ady > 150) continue;
      const score = adx + ady;
      if (score < tScore) {
        tScore = score;
        target = e;
      }
    }
    if (target) {
      const dx = target.x - snap.px;
      face(Math.abs(dx) < 120 ? 0 : Math.sign(dx));
      if (now - d.lastShotAt >= 340) {
        d.lastShotAt = now;
        if (Math.abs(dx) < 120) face(Math.sign(dx) || 1);
        tap(KEY.shoot, 60);
      }
    } else {
      face(1);
    }
  };
  d.interval = setInterval(tick, 80);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1250, height: 500 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('sp-rotation-notice', '1');
    localStorage.setItem('sp-install-dismissed', '1');
  });

  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__sp?.scene?.() === 'Title', null, { timeout: 20000 });
  await page
    .locator('[data-menu="start"]')
    .dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true });
  await page.waitForFunction(() => window.__sp.scene() === 'Game', null, { timeout: 15000 });
  await page.evaluate((id) => window.__sp.gotoLevel(id), levelId);
  await page.waitForFunction((id) => window.__sp.stage() === id, levelId, { timeout: 15000 });
  await page.waitForTimeout(600);

  // maxOnScreen 對齊 levels.ts 資料：L19 為 6，其餘走動關 5。
  const cap = levelId === 19 ? 6 : 5;
  if (mode === 'stall') {
    // #804 定向重現：同屏上限填滿不可吸紮根怪（chompy 恆紮根），玩家零彈掛機。
    await page.evaluate((n) => {
      const px = window.__sp.probe().x;
      for (let i = 0; i < n; i++) window.__sp.spawn('chompy', px + 180 + i * 90, 330);
    }, cap);
  }
  const anchorX = process.argv.includes('--anchor')
    ? Number(process.argv[process.argv.indexOf('--anchor') + 1])
    : 1400;
  if (midpoint || mode === 'forage') {
    await page.keyboard.down('ArrowRight');
    await page
      .waitForFunction((ax) => window.__sp.probe().x >= ax, anchorX, { timeout: 90000 })
      .catch(() => {});
    await page.keyboard.up('ArrowRight');
  }
  // 滿潮避難導航錨（潮汐關平台/單向平台中心 x，對齊 levels.ts 資料）；非潮汐關空集。
  const FLOOD_PLATFORMS = {
    14: [420, 620, 820, 1050, 1250, 1480, 1700, 2150, 2380, 2600, 2850, 3050, 3250],
    15: [350, 430, 620, 850, 1300, 1520, 1750, 2250, 2480, 2700, 3150, 3300, 3450],
  };
  await page.evaluate(installDriver, {
    playMode: mode === 'play',
    forageMode: mode === 'forage',
    anchorX,
    floodPlatformXs: FLOOD_PLATFORMS[levelId] ?? [],
    maxOnScreen: cap,
  });
  console.log(`L${levelId} ${mode}｜上限 ${capSec}s｜同屏上限 ${cap}`);

  const startedAt = Date.now();
  let result = 'timeout';
  let lastMetrics = null;
  let midShotDone = false;
  if (shots) await page.screenshot({ path: `${OUT_DIR}${label}-start.png` });
  while (Date.now() - startedAt < capSec * 1000) {
    await page.waitForTimeout(1000);
    const scene = await page.evaluate(() => window.__sp.scene()).catch(() => null);
    const metrics = await page.evaluate(() => window.__v18?.m ?? null).catch(() => null);
    if (metrics) lastMetrics = metrics;
    if (shots && !midShotDone && Date.now() - startedAt >= (capSec * 1000) / 3) {
      midShotDone = true;
      await page.screenshot({ path: `${OUT_DIR}${label}-mid.png` }).catch(() => {});
    }
    if (mode === 'play' && scene === 'Result') {
      result = 'cleared';
      break;
    }
  }
  if (shots) await page.screenshot({ path: `${OUT_DIR}${label}-end.png` }).catch(() => {});
  await page
    .evaluate(() => {
      if (window.__v18) window.__v18.stop = true;
    })
    .catch(() => {});

  const m = lastMetrics ?? {};
  const report = {
    levelId,
    mode,
    result,
    capSec,
    elapsedSec: Math.round((m.elapsedMs ?? 0) / 100) / 10,
    deaths: m.deaths ?? -1,
    kills: m.kills ?? -1,
    gateOpenAtSec: m.gateOpenAtMs > 0 ? Math.round(m.gateOpenAtMs / 100) / 10 : null,
    preGateSec: Math.round((m.preGateMs ?? 0) / 100) / 10,
    ammoZeroSec: Math.round((m.ammoZeroMs ?? 0) / 100) / 10,
    longestAmmoZeroSec: Math.round((m.longestAmmoZeroMs ?? 0) / 100) / 10,
    starvingSec: Math.round((m.starvingMs ?? 0) / 100) / 10,
    longestStarvingSec: Math.round((m.longestStarvingMs ?? 0) / 100) / 10,
    fullStallSec: Math.round((m.fullStallMs ?? 0) / 100) / 10,
    longestFullStallSec: Math.round((m.longestFullStallMs ?? 0) / 100) / 10,
    longestQuotaStallSec: Math.round((m.longestQuotaStallMs ?? 0) / 100) / 10,
    reachVacuumSec: Math.round((m.reachVacuumMs ?? 0) / 100) / 10,
    longestReachVacuumSec: Math.round((m.longestReachVacuumMs ?? 0) / 100) / 10,
    floodSpawns: m.floodSpawns ?? 0,
    consoleErrors: errors.length,
    samples: m.samples ?? [],
  };
  const outPath = `${OUT_DIR}${label}.json`;
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  const { samples, ...summary } = report;
  void samples;
  console.log(JSON.stringify(summary, null, 2));
  console.log(`trace → ${outPath}`);
  await browser.close();
  if (errors.length > 0) {
    console.error(`console errors ×${errors.length}：\n${errors.slice(0, 5).join('\n')}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
