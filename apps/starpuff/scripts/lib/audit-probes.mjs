// 四專項探針（#809 跳越／#810 telegraph／#811 吞食／#812 星暴恢復）。
// 各探針回傳純資料物件；門檻裁定由 CLI 端引用 difficulty.ts SSOT 統一結算。
import { enterArena, gotoLevel, readScene, retryFromResult, sleep } from './audit-session.mjs';

// ===== #809 跳越可行性（魔王關）＝解析矩陣（CLI 端）＋貼牆逃脫實證（本探針）=====
// 存活軸以 grantInvuln 隔離（貼牆等待期挨彈幕致死會吃光試次）；命中壓力改記
// 逃脫期間貼身重疊 tick 數。地面王以 damageBoss 强制入 P2（衝刺/雙子等逼角
// 行為多在 P2 起），走正式傷害管線不繞 FSM。
export async function runJumpProbe(page, { levelId, trials = 8, capMs = 300_000 }) {
  await gotoLevel(page, levelId, false);
  if (!(await enterArena(page))) return { levelId, error: 'arena-timeout' };
  const grounded = await page
    .evaluate(() => {
      const b = window.__sp.bossPos();
      return b.y >= 300;
    })
    .catch(() => false);
  // 地面王強制 P2：HP 壓至 45%（jellord/prismix 衝刺與雙子期）。
  if (grounded) {
    await page
      .evaluate(() => {
        const sp = window.__sp;
        const hp = sp.bossHp();
        sp.damageBoss(Math.ceil(hp * 0.55));
      })
      .catch(() => {});
    await sleep(1200);
  }
  const results = [];
  let observedBossY = null;
  const startedAt = Date.now();
  while (results.length < trials && Date.now() - startedAt < capMs) {
    if ((await readScene(page)) !== 'Game') {
      await retryFromResult(page).catch(() => {});
      if ((await readScene(page)) !== 'Game') {
        await gotoLevel(page, levelId, false);
      }
      if (!(await enterArena(page))) break;
      continue;
    }
    const setup = await page
      .evaluate(() => {
        const sp = window.__sp;
        sp.grantInvuln(40_000);
        const bodies = sp.bossBodies();
        const boss = bodies[0] ?? sp.bossPos();
        const view = sp.view().width;
        return { px: sp.probe().x, bossX: boss.x, bossY: boss.y, view, hp: sp.playerHp() };
      })
      .catch(() => null);
    if (!setup) {
      await sleep(600);
      continue;
    }
    observedBossY = setup.bossY;
    const arenaLeft = 400;
    const center = arenaLeft + setup.view / 2;
    // 受困側＝離魔王最近的牆（夾角風險真實存在的一側；Syrona 王座 0.8W→右牆）。
    const wallSide = setup.bossX > center ? 1 : -1;
    const wallX = wallSide < 0 ? arenaLeft + 70 : arenaLeft + setup.view - 70;
    const wallKey = wallSide < 0 ? 'ArrowLeft' : 'ArrowRight';
    await page.keyboard.down(wallKey);
    await page
      .waitForFunction(
        ({ x, side }) =>
          window.__sp.scene() !== 'Game' ||
          (side < 0 ? window.__sp.probe().x <= x : window.__sp.probe().x >= x),
        { x: wallX, side: wallSide },
        { timeout: 10_000 },
      )
      .catch(() => {});
    await page.keyboard.up(wallKey);
    if ((await readScene(page)) !== 'Game') continue;
    // 等魔王最近本體進 220px（貼身壓迫成形）；20s 未逼近＝本試次記「未受困」。
    const cornered = await page
      .waitForFunction(
        () => {
          const sp = window.__sp;
          if (sp.scene() !== 'Game') return true;
          const px = sp.probe().x;
          const bodies = sp.bossBodies();
          const boss = bodies.length > 0 ? bodies : [sp.bossPos()];
          return boss.some((b) => Math.abs(b.x - px) <= 220);
        },
        null,
        { timeout: 20_000 },
      )
      .then(() => true)
      .catch(() => false);
    if ((await readScene(page)) !== 'Game') continue;
    if (!cornered) {
      results.push({ cornered: false, escaped: null, ms: null, contactTicks: 0 });
      continue;
    }
    // 逃脫嘗試：面向魔王側持續位移＋跳躍與三段拍翅，2.6s 內越過本體中心＝成功。
    const attempt = await page.evaluate(
      async ({ escapeDir }) => {
        const sp = window.__sp;
        const dispatch = (type, keyCode) => {
          const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true });
          Object.defineProperty(ev, 'keyCode', { get: () => keyCode });
          Object.defineProperty(ev, 'which', { get: () => keyCode });
          window.dispatchEvent(ev);
        };
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const bodiesAt = () => {
          const bodies = sp.bossBodies();
          return bodies.length > 0 ? bodies : [sp.bossPos()];
        };
        const nearest = () => {
          const px = sp.probe().x;
          return bodiesAt().reduce(
            (best, b) => (Math.abs(b.x - px) < Math.abs(best.x - px) ? b : best),
            bodiesAt()[0],
          );
        };
        const bossX = nearest().x;
        const moveKey = escapeDir > 0 ? 39 : 37;
        const started = performance.now();
        let contactTicks = 0;
        dispatch('keydown', moveKey);
        // 地跳＋三段拍翅（間隔讓每次拍翅接近頂點）。
        const flapper = (async () => {
          for (let flap = 0; flap < 4; flap += 1) {
            dispatch('keydown', 90);
            await wait(70);
            dispatch('keyup', 90);
            await wait(flap === 0 ? 380 : 300);
          }
        })();
        let escaped = false;
        while (performance.now() - started < 2600) {
          if (sp.scene() !== 'Game') break;
          const px = sp.probe().x;
          const py = sp.probe().y;
          const near = nearest();
          if (Math.abs(near.x - px) < 70 && Math.abs(near.y - py) < 80) contactTicks += 1;
          if (escapeDir > 0 ? px > bossX + 30 : px < bossX - 30) {
            escaped = true;
            break;
          }
          await wait(80);
        }
        await flapper;
        dispatch('keyup', moveKey);
        return { escaped, ms: Math.round(performance.now() - started), contactTicks };
      },
      { escapeDir: -wallSide },
    );
    results.push({ cornered: true, ...attempt });
    await sleep(700);
  }
  const corneredTrials = results.filter((r) => r.cornered);
  const escapes = corneredTrials.filter((r) => r.escaped === true);
  return {
    levelId,
    trials: results.length,
    corneredTrials: corneredTrials.length,
    escapeRate: corneredTrials.length > 0 ? escapes.length / corneredTrials.length : null,
    avgEscapeMs:
      escapes.length > 0
        ? Math.round(escapes.reduce((sum, r) => sum + r.ms, 0) / escapes.length)
        : null,
    avgContactTicks:
      corneredTrials.length > 0
        ? Math.round(
            (corneredTrials.reduce((sum, r) => sum + r.contactTicks, 0) / corneredTrials.length) *
              10,
          ) / 10
        : null,
    observedBossY,
    detail: results,
  };
}

// ===== #810 telegraph 反應窗（L12 地面尖刺為主）=====
// 幾何重疊判定＋grantInvuln 隔離存活軸：i-frame 與死亡重試不污染逐週期命中歸因。
export async function runTelegraphProbe(
  page,
  { levelId = 12, cyclesPerTier = 8, reactionTiers = [250, 350, 500], capMs = 420_000 },
) {
  await gotoLevel(page, levelId, false);
  if (!(await enterArena(page))) return { levelId, error: 'arena-timeout' };
  await page.evaluate(
    ({ tiers, perTier }) => {
      const sp = window.__sp;
      const probe = {
        tiers,
        perTier,
        tierIndex: 0,
        cycles: [],
        stateSeq: [],
        lastState: '',
        pending: null,
        dodgeTimer: null,
        moveKey: null,
        stop: false,
      };
      window.__tg = probe;
      const dispatch = (type, keyCode) => {
        const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true });
        Object.defineProperty(ev, 'keyCode', { get: () => keyCode });
        Object.defineProperty(ev, 'which', { get: () => keyCode });
        window.dispatchEvent(ev);
      };
      const releaseMove = () => {
        if (probe.moveKey !== null) {
          dispatch('keyup', probe.moveKey);
          probe.moveKey = null;
        }
      };
      // 30ms 細粒度輪詢：招式入態→首個地面尖刺 hazard 出現→消失。
      probe.interval = setInterval(() => {
        if (probe.stop) return;
        if (sp.scene() !== 'Game') return;
        let fsm;
        let hazards;
        let px;
        let py;
        try {
          fsm = sp.bossState();
          hazards = sp.bossHazards();
          px = sp.probe().x;
          py = sp.probe().y;
          // 存活軸隔離：長效無敵（每 20s 續一次）。
          if (!probe.lastInvulnAt || performance.now() - probe.lastInvulnAt > 20_000) {
            probe.lastInvulnAt = performance.now();
            sp.grantInvuln(30_000);
          }
        } catch {
          return;
        }
        const now = performance.now();
        const stateKey = fsm ? `${fsm.phase}:${fsm.state}` : '';
        if (stateKey && stateKey !== probe.lastState) {
          probe.lastState = stateKey;
          if (probe.stateSeq.length < 400) probe.stateSeq.push(fsm.state);
          if (fsm.state === 'pillar' && !probe.pending) {
            const reactionMs = probe.tiers[probe.tierIndex] ?? 350;
            probe.pending = {
              tier: reactionMs,
              stateEnterAt: now,
              castX: px,
              firstHazardAt: null,
              hazardXs: [],
              overlapped: false,
              hazardGoneAt: null,
            };
            // 反應延遲注入：延遲後向遠離施放錨的方向移動 620ms。
            probe.dodgeTimer = setTimeout(() => {
              const view = sp.view().width;
              const arenaLeft = 400;
              const center = arenaLeft + view / 2;
              const dir = probe.pending && probe.pending.castX > center ? -1 : 1;
              const key = dir > 0 ? 39 : 37;
              probe.moveKey = key;
              dispatch('keydown', key);
              setTimeout(releaseMove, 620);
            }, reactionMs);
          }
        }
        const pending = probe.pending;
        if (!pending) return;
        const groundSpikes = hazards.filter((h) => h.y > 320 && h.h > 60);
        if (groundSpikes.length > 0) {
          if (pending.firstHazardAt === null) {
            pending.firstHazardAt = now;
            pending.hazardXs = groundSpikes.map((h) => h.x);
          }
          // 幾何重疊＝命中判定：玩家 hurtbox 半寬 18、尖刺半寬 13＋容差。
          const hit = groundSpikes.some((h) => Math.abs(h.x - px) < 31 && py > 300);
          if (hit) pending.overlapped = true;
        } else if (pending.firstHazardAt !== null && pending.hazardGoneAt === null) {
          pending.hazardGoneAt = now;
          probe.cycles.push({
            tier: pending.tier,
            telegraphMs: Math.round(pending.firstHazardAt - pending.stateEnterAt),
            activeMs: Math.round(pending.hazardGoneAt - pending.firstHazardAt),
            dodged: !pending.overlapped,
          });
          probe.pending = null;
          releaseMove();
          const doneInTier = probe.cycles.filter((c) => c.tier === probe.tiers[probe.tierIndex]);
          if (doneInTier.length >= probe.perTier && probe.tierIndex < probe.tiers.length - 1) {
            probe.tierIndex += 1;
          }
        }
      }, 30);
    },
    { tiers: reactionTiers, perTier: cyclesPerTier },
  );
  const targetCycles = cyclesPerTier * reactionTiers.length;
  const startedAt = Date.now();
  let cycles = [];
  let stateSeq = [];
  while (Date.now() - startedAt < capMs) {
    await sleep(2000);
    if ((await readScene(page)) === 'Result') {
      await retryFromResult(page);
      await enterArena(page);
      continue;
    }
    const snapshot = await page
      .evaluate(() => ({
        cycles: window.__tg?.cycles ?? [],
        stateSeq: window.__tg?.stateSeq ?? [],
      }))
      .catch(() => null);
    if (snapshot) {
      cycles = snapshot.cycles;
      stateSeq = snapshot.stateSeq;
    }
    if (cycles.length >= targetCycles) break;
  }
  await page
    .evaluate(() => {
      if (window.__tg) {
        window.__tg.stop = true;
        clearInterval(window.__tg.interval);
      }
    })
    .catch(() => {});
  const byTier = reactionTiers.map((tier) => {
    const rows = cycles.filter((c) => c.tier === tier);
    return {
      reactionMs: tier,
      cycles: rows.length,
      dodgeRate:
        rows.length > 0
          ? Math.round((rows.filter((c) => c.dodged).length / rows.length) * 100) / 100
          : null,
    };
  });
  const telegraphSamples = cycles.map((c) => c.telegraphMs);
  return {
    levelId,
    state: 'pillar',
    cycles: cycles.length,
    telegraphMsAvg:
      telegraphSamples.length > 0
        ? Math.round(telegraphSamples.reduce((a, b) => a + b, 0) / telegraphSamples.length)
        : null,
    telegraphMsMin: telegraphSamples.length > 0 ? Math.min(...telegraphSamples) : null,
    activeMsAvg:
      cycles.length > 0
        ? Math.round(cycles.reduce((a, c) => a + c.activeMs, 0) / cycles.length)
        : null,
    byTier,
    stateSeq,
    detail: cycles,
  };
}

// ===== #811 殼殼吞食成功率 =====
// 場面控制：chompy 填滿同屏上限凍結自然生成（v18 stall 手法）→ 可吸計數轉移
// 即為殼殼暈眩窗精確邊界；全程保 ammo≥1 抑制飢荒救援補生污染。
// 儀器校正（T2）：stun 停位受牆反彈影響左右側皆可能——吸入朝殼殼實際方位推進
// （原固定向右致左側案例必失敗，量測值系統性低估）；吸入窗上限由 stunWindowMs
// 注入（SHELLY_FSM.stunMs SSOT），避免窗長調參後被舊硬編上限截斷。
export async function runSwallowProbe(
  page,
  { runs = 100, spinRuns = 30, capMs = 900_000, stunWindowMs = 1000 },
) {
  const levelId = 1;
  const attemptOnce = async (arm) =>
    page.evaluate(
      async ({ mode, windowCapMs }) => {
        const sp = window.__sp;
        const dispatch = (type, keyCode) => {
          const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true });
          Object.defineProperty(ev, 'keyCode', { get: () => keyCode });
          Object.defineProperty(ev, 'which', { get: () => keyCode });
          window.dispatchEvent(ev);
        };
        const tap = async (keyCode, ms) => {
          dispatch('keydown', keyCode);
          await new Promise((resolve) => setTimeout(resolve, ms));
          dispatch('keyup', keyCode);
        };
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        try {
          sp.grantInvuln(20_000);
          // 彈藥管理：正好 1 發（0 補 1；>1 傾瀉到 1，頂槽可能為殼盾星——點按即發不受阻）。
          let guard = 0;
          while (sp.ammo().ammo === 0 && guard < 3) {
            sp.grantStar('jelly');
            guard += 1;
          }
          guard = 0;
          while (sp.ammo().ammo > 1 && guard < 5) {
            await tap(88, 55);
            await wait(220);
            guard += 1;
          }
          const px = sp.probe().x;
          // 目標鎖最近隻（殘留舊殼殼防污染）；追擊/跟隨共用。
          const nearestShelly = () => {
            const now = sp.probe().x;
            return (sp.enemies?.() ?? [])
              .filter((e) => e.kind === 'shelly')
              .reduce(
                (best, e) =>
                  best === null || Math.abs(e.x - now) < Math.abs(best.x - now) ? e : best,
                null,
              );
          };
          sp.spawn('shelly', px + 150, 330);
          await wait(320);
          // 面向右、單發命中 → walk 首發轉縮殼（spin 無敵 1.5s → stun 可吸 1.6s）。
          await tap(39, 70);
          const fireAt = performance.now();
          await tap(88, 55);
          if (mode === 'spin') {
            // 衝刺（縮殼旋轉）期吸食：預期 0 成功。
            await wait(360);
            const ammoBefore = sp.ammo().ammo;
            dispatch('keydown', 88);
            await wait(800);
            dispatch('keyup', 88);
            const swallowed = sp.ammo().ammo > ammoBefore;
            // 殘局：等 stun 窗過（不吸），殼殼回 walk 漫遊（保 1 彈防救援污染）。
            await wait(1600);
            if (sp.ammo().ammo === 0) sp.grantStar('jelly');
            return { arm: 'spin', swallowed, windowSeen: true };
          }
          // 正確時機：等可吸轉移 0→1（凍結場上唯一可吸＝殼殼 stun 邊界）。
          // 衝刺期跟隨（保距 110px）：真人「趁暈眩吸入」的前提是追著看它暈——
          // 站樁等暈才起步是最劣策略，會把遠停位案例誤計為時機失敗。
          let stunEnterAt = null;
          let chaseKey = null;
          const chase = () => {
            const s = nearestShelly();
            const now = sp.probe().x;
            const want = s === null || Math.abs(s.x - now) < 110 ? null : s.x < now ? 37 : 39;
            if (want === chaseKey) return;
            if (chaseKey !== null) dispatch('keyup', chaseKey);
            if (want !== null) dispatch('keydown', want);
            chaseKey = want;
          };
          while (performance.now() - fireAt < 2600) {
            chase();
            if (sp.alive().inhalable > 0) {
              stunEnterAt = performance.now();
              break;
            }
            await wait(30);
          }
          if (chaseKey !== null) dispatch('keyup', chaseKey);
          if (stunEnterAt === null) {
            if (sp.ammo().ammo === 0) sp.grantStar('jelly');
            return { arm: 'stun', swallowed: false, windowSeen: false };
          }
          // 立即長按吸入（ammo 0 → press='none' 純吸入）＋朝殼殼實際方位推進
          //（正確時機操作＝面向目標吸；停位左右側皆可能，儀器不得假設恆右）。
          // 目標鎖最近隻（殘留舊殼殼防污染）；追到近距即鬆方向鍵（真人走近後停住吸，
          // 機械持鍵過衝會反向遠離）。
          const ammoBefore = sp.ammo().ammo;
          let moveKey = null;
          const steer = () => {
            const s = nearestShelly();
            const px = sp.probe().x;
            const want = s === null || Math.abs(s.x - px) < 70 ? null : s.x < px ? 37 : 39;
            if (want === moveKey) return;
            if (moveKey !== null) dispatch('keyup', moveKey);
            if (want !== null) dispatch('keydown', want);
            moveKey = want;
          };
          dispatch('keydown', 88);
          let swallowed = false;
          let windowClosedAt = null;
          while (performance.now() - stunEnterAt < windowCapMs + 400) {
            steer();
            if (sp.ammo().ammo > ammoBefore) {
              swallowed = true;
              break;
            }
            if (sp.alive().inhalable === 0) {
              windowClosedAt = performance.now();
              break;
            }
            await wait(30);
          }
          if (moveKey !== null) dispatch('keyup', moveKey);
          dispatch('keyup', 88);
          if (sp.ammo().ammo === 0) sp.grantStar('jelly');
          return {
            arm: 'stun',
            swallowed,
            windowSeen: true,
            reactToSwallowMs: swallowed ? Math.round(performance.now() - stunEnterAt) : null,
            windowMs: windowClosedAt ? Math.round(windowClosedAt - stunEnterAt) : null,
          };
        } catch {
          return { arm: mode, swallowed: false, windowSeen: false, error: true };
        }
      },
      { mode: arm, windowCapMs: stunWindowMs },
    );

  const resetField = async () => {
    await gotoLevel(page, levelId, false);
    await page.evaluate(() => {
      const sp = window.__sp;
      sp.grantInvuln(30_000);
      // 凍結生成：同屏上限填滿不可吸紮根怪（L1 cap=3）；擺遠避免堵住吞食走位
      //（殼殼衝刺可達 ~480px，520 仍在追擊帶會成 immovable 牆——上修至 900+）。
      const px = sp.probe().x;
      for (let i = 0; i < 3; i += 1) sp.spawn('chompy', px + 900 + i * 110, 330);
      sp.grantStar('jelly');
    });
    await sleep(400);
  };

  await resetField();
  const stunResults = [];
  const spinResults = [];
  const startedAt = Date.now();
  let sinceReset = 0;
  const ensureField = async (resetEvery) => {
    if ((await readScene(page)) !== 'Game' || sinceReset >= resetEvery) {
      await resetField();
      sinceReset = 0;
    }
  };
  while (stunResults.length < runs && Date.now() - startedAt < capMs) {
    await ensureField(12);
    stunResults.push(await attemptOnce('stun'));
    sinceReset += 1;
    await sleep(350);
  }
  while (spinResults.length < spinRuns && Date.now() - startedAt < capMs) {
    await ensureField(8);
    spinResults.push(await attemptOnce('spin'));
    sinceReset += 1;
    await sleep(350);
  }
  const seen = stunResults.filter((r) => r.windowSeen);
  const swallowed = seen.filter((r) => r.swallowed);
  const windows = seen.map((r) => r.windowMs).filter((v) => typeof v === 'number');
  const reactTimes = swallowed.map((r) => r.reactToSwallowMs).filter((v) => typeof v === 'number');
  return {
    levelId,
    stunAttempts: stunResults.length,
    windowSeenRate:
      stunResults.length > 0 ? Math.round((seen.length / stunResults.length) * 100) / 100 : null,
    stunSuccessRate:
      seen.length > 0 ? Math.round((swallowed.length / seen.length) * 100) / 100 : null,
    avgWindowMs:
      windows.length > 0 ? Math.round(windows.reduce((a, b) => a + b, 0) / windows.length) : null,
    avgReactToSwallowMs:
      reactTimes.length > 0
        ? Math.round(reactTimes.reduce((a, b) => a + b, 0) / reactTimes.length)
        : null,
    spinAttempts: spinResults.length,
    spinSuccessRate:
      spinResults.length > 0
        ? Math.round((spinResults.filter((r) => r.swallowed).length / spinResults.length) * 100) /
          100
        : null,
  };
}

// ===== #812 星暴誤放恢復 =====
// 注入：滿彈匣（jelly 連授至 3 槽）→ 長按 0.9s 觸發星暴（誤放重現）→ 量測
// 恢復（ammo>0）時間分佈；恢復由 bot 覓食策略自然達成（不授星）。
// ensureDriver：重進關卡（含 reload 復原）後重掛覓食 driver 的回呼。
export async function runStarburstProbe(
  page,
  { levelId, trials = 6, capMs = 300_000, ensureDriver },
) {
  const samples = [];
  let aborted = null;
  const startedAt = Date.now();
  const reenter = async () => {
    await gotoLevel(page, levelId, false);
    if (ensureDriver) await ensureDriver();
    await sleep(500);
  };
  while (samples.length < trials && Date.now() - startedAt < capMs) {
    const scene = await readScene(page);
    if (scene !== 'Game') {
      // 誤放注入以 pre-gate 為前提；提前通關（Result/Map）＝重進本關續收樣本。
      await reenter();
      continue;
    }
    const state = await page
      .evaluate(() => ({
        gateOpen: window.__sp.gateOpen(),
        hp: window.__sp.playerHp(),
        driverAlive: Boolean(window.__audit) && !window.__audit.stop,
      }))
      .catch(() => null);
    if (!state) {
      await sleep(500);
      continue;
    }
    if (state.gateOpen || !state.driverAlive) {
      await reenter();
      continue;
    }
    if (state.hp <= 0) {
      await sleep(800);
      continue;
    }
    const injected = await page.evaluate(async () => {
      const sp = window.__sp;
      const driver = window.__audit;
      const dispatch = (type, keyCode) => {
        const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true });
        Object.defineProperty(ev, 'keyCode', { get: () => keyCode });
        Object.defineProperty(ev, 'which', { get: () => keyCode });
        window.dispatchEvent(ev);
      };
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      try {
        if (driver) driver.pause = true;
        await wait(200);
        // jelly 連授至 3 槽（連吞同味強化不佔新槽：×5 保證 [強化,強化,單發] 滿匣；
        // jelly 無變身形態、頂槽非殼盾 → 長按語意唯一收斂到星暴）。
        let guard = 0;
        while (sp.ammo().ammo < 3 && guard < 8) {
          sp.grantStar('jelly');
          guard += 1;
          await wait(60);
        }
        if (sp.ammo().ammo < 3) return { ok: false, reason: 'fill-failed' };
        dispatch('keydown', 88);
        await wait(950);
        dispatch('keyup', 88);
        const fired = sp.ammo().ammo === 0 && sp.transform().form === null;
        return { ok: fired, at: performance.now() };
      } catch {
        return { ok: false, reason: 'inject-error' };
      } finally {
        if (driver) driver.pause = false;
      }
    });
    if (!injected.ok) {
      aborted = injected.reason ?? 'unknown';
      await sleep(1000);
      continue;
    }
    // 恢復量測：bot 覓食（play 策略 ammo==0 分支）至 ammo>0。
    // 開門守衛：星暴清屏擊殺可補滿配額直接開門——開門後不生成（§107.1 尾端
    // release），「恢復」在已過關狀態下無意義，棄樣重進（非卡關，不得計逾時）。
    const recovery = await page
      .waitForFunction(() => window.__sp.ammo().ammo > 0 || window.__sp.gateOpen(), null, {
        timeout: 45_000,
      })
      .then(() =>
        page.evaluate(
          (t0) => ({
            ms: Math.round(performance.now() - t0),
            recovered: window.__sp.ammo().ammo > 0,
          }),
          injected.at,
        ),
      )
      .catch(() => null);
    if (recovery !== null && !recovery.recovered) {
      await reenter();
      continue;
    }
    samples.push({ recoveryMs: recovery?.ms ?? null, timedOut: recovery === null });
    await sleep(2500);
  }
  const recovered = samples.map((s) => s.recoveryMs).filter((v) => typeof v === 'number');
  return {
    levelId,
    trials: samples.length,
    recoveredCount: recovered.length,
    timeoutCount: samples.filter((s) => s.timedOut).length,
    recoveryMsSamples: recovered,
    aborted,
  };
}
