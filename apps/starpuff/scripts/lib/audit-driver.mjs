// 統一量測 driver（#818）：走動關＋魔王關單一策略引擎，分級 bot 以感知延遲
// （快照環回看 reactionMs）與策略開關（dodge/kite/flap/mirrorGuard）分級——
// 低/中/高不是三份腳本（開關 SSOT＝difficulty.BOT_TIERS，#814 W1.5 擴完整策略）。
// 本函式經 page.evaluate 序列化進瀏覽器：必須自包含，禁止引用模組作用域。
// 走動關指標語意沿 v18-level-bot（#804/#805/#806 量測 SSOT 同口徑）。
// 可吸/威脅集由 Node 端自 logic SSOT（canInhale/ENEMY_THREAT）計算後注入，零漂移。

export function installAuditDriver(opts) {
  const {
    kind, // 'walk' | 'boss'
    levelId,
    reactionMs,
    dodge,
    kite,
    maxOnScreen,
    floodPlatformXs,
    inhalableKinds,
    contactKinds,
    grantSupply, // 魔王關純標準星紀律：空匣補 jelly
    // 變身優勢 hook（#816 W2）：非 null 時以該味集齊 ×3 並按 SP 變身（TTK 對照量測）。
    transformFlavor = null,
    // 完整策略開關（#814 W1.5，BOT_TIERS SSOT 注入）：滿拍翅空中機動、鏡界窗紀律。
    flap = false,
    mirrorGuard = false,
  } = opts;
  // 重掛保護：先停舊 driver（同頁重進關卡時避免雙 interval 疊鍵）。
  if (window.__audit) {
    window.__audit.stop = true;
    clearInterval(window.__audit.interval);
  }
  const KEY = { left: 37, right: 39, jump: 90, shoot: 88, sp: 67 };
  const INHALABLE = new Set(inhalableKinds);
  const HARMFUL = new Set(contactKinds);
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
  const tap = (k, ms = 70) => {
    dispatch('keydown', k);
    setTimeout(() => dispatch('keyup', k), ms);
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

  const d = {
    m: {
      ticks: 0,
      elapsedMs: 0,
      deaths: 0,
      deathSpots: [],
      damageEvents: [],
      // 走動關（v18 同口徑）：斷檔/飢荒/停轉/配額凍結/可及真空。
      ammoZeroMs: 0,
      longestAmmoZeroMs: 0,
      starvingMs: 0,
      longestStarvingMs: 0,
      fullStallMs: 0,
      longestFullStallMs: 0,
      longestQuotaStallMs: 0,
      reachVacuumMs: 0,
      longestReachVacuumMs: 0,
      preGateMs: 0,
      gateOpenAtMs: -1,
      kills: 0,
      // 魔王關：TTK/嘗試段/招式序列。
      bossMaxHp: 0,
      attempts: 0,
      ttkMs: -1,
      bossKilled: false,
      stateLog: [],
      shots: 0,
      samples: [],
      // 變身優勢 hook（#816 W2）：成功變身次數。
      transforms: 0,
    },
    cur: { ammoZero: 0, starving: 0, fullStall: 0, quotaStall: 0, reachVacuum: 0 },
    ring: [],
    prevHp: -1,
    prevForm: null,
    holdFire: false,
    prevKill: -1,
    prevBossHp: -1,
    fightStartMs: -1,
    lastState: '',
    lastSampleAt: 0,
    lastJumpAt: 0,
    lastShotAt: 0,
    lastGrantAt: 0,
    lastSpAt: 0,
    lastX: 0,
    lastMoveAt: 0,
    // 滿拍翅跳序列（W1.5）：hopUntil 內鎖定航向 hopDir；inhaleHold＝鏡界窗持吸中。
    hopUntil: 0,
    hopDir: 0,
    inhaleHold: false,
    stop: false,
  };
  // 暴露給 stopDriver：停 driver 時放開全部持鍵，避免殘留輸入影響後續量測。
  d.releaseAll = () => {
    for (const k of [...held]) release(k);
  };
  window.__audit = d;

  const readSnap = () => {
    const sp = window.__sp;
    if (!sp || sp.scene() !== 'Game') return null;
    try {
      const probe = sp.probe();
      const snap = {
        px: probe.x,
        py: probe.y,
        hp: sp.playerHp(),
        ammo: sp.ammo().ammo,
        alive: sp.alive(),
        gateOpen: sp.gateOpen(),
        quota: sp.quota(),
        enemies: sp.enemies(),
        tide: sp.tide(),
      };
      if (kind === 'boss') {
        snap.bossHp = sp.bossHp();
        snap.boss = sp.bossPos();
        snap.bodies = sp.bossBodies();
        snap.fsm = sp.bossState();
        snap.shots = sp.bossShots();
        snap.hazards = sp.bossHazards();
        snap.view = sp.view().width;
        // 變身資格真值（#848 審查修復）：連吞合成使槽數塌縮（3 發同系＝2 槽），
        // slot count 門檻永不成立——改讀 eligibleForm SSOT 觀測點。
        snap.tfReady = sp.transformEligible ? sp.transformEligible() : false;
      }
      return snap;
    } catch {
      return null; // 場景轉換窗（死亡重試 restart）內部系統短暫不可用。
    }
  };

  const tick = () => {
    if (d.stop) return;
    // 探針注入窗（星暴長按等）：暫停決策並放開全部按鍵，量測照常由注入端負責。
    if (d.pause) {
      for (const k of [...held]) release(k);
      d.inhaleHold = false;
      d.hopUntil = 0;
      return;
    }
    const now = performance.now();
    const snap = readSnap();
    if (!snap) return;
    const dt = 80;
    d.m.ticks += 1;
    d.m.elapsedMs += dt;

    // ===== 量測（即時真值；感知延遲僅作用於決策）=====
    if (d.prevHp > 0 && snap.hp < d.prevHp) {
      if (d.m.damageEvents.length < 300) {
        d.m.damageEvents.push({
          t: Math.round(d.m.elapsedMs),
          x: Math.round(snap.px),
          y: Math.round(snap.py),
          hp: snap.hp,
        });
      }
      if (snap.hp <= 0) {
        d.m.deaths += 1;
        if (d.m.deathSpots.length < 100) {
          d.m.deathSpots.push({
            t: Math.round(d.m.elapsedMs),
            x: Math.round(snap.px),
            y: Math.round(snap.py),
          });
        }
      }
    }
    d.prevHp = snap.hp;

    if (kind === 'walk') {
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
    } else {
      // 魔王段量測：max HP、攻擊段（HP 回滿＝新嘗試）、TTK、招式轉移序列。
      // bossHp<0＝場景重建尚未入場（GameScene create 初值 -1）：僅重置基準，
      // 不得進擊殺判定——死亡重試窗曾把 -1 誤判為擊破（#814 修復假陽性通關）。
      if (snap.bossHp < 0) {
        d.prevBossHp = 0;
      } else {
        if (snap.bossHp > d.m.bossMaxHp) d.m.bossMaxHp = snap.bossHp;
        if (snap.bossHp > 0 && d.prevBossHp <= 0) {
          d.fightStartMs = d.m.elapsedMs;
          d.m.attempts += 1;
        }
        if (snap.bossHp <= 0 && d.prevBossHp > 0 && !d.m.bossKilled) {
          d.m.bossKilled = true;
          d.m.ttkMs = d.m.elapsedMs - (d.fightStartMs > 0 ? d.fightStartMs : 0);
        }
        d.prevBossHp = snap.bossHp;
      }
      const stateKey = snap.fsm ? `${snap.fsm.phase}:${snap.fsm.state}` : '';
      if (stateKey && stateKey !== d.lastState && d.m.stateLog.length < 600) {
        d.m.stateLog.push({ t: Math.round(d.m.elapsedMs), s: stateKey });
        d.lastState = stateKey;
      }
    }

    if (now - d.lastSampleAt >= 1000) {
      d.lastSampleAt = now;
      const sample = {
        t: Math.round(d.m.elapsedMs / 100) / 10,
        x: Math.round(snap.px),
        hp: snap.hp,
        ammo: snap.ammo,
      };
      if (kind === 'walk') {
        sample.kill = snap.quota.killCount;
        sample.alive = snap.alive.total;
        sample.inh = snap.alive.inhalable;
        if (snap.tide) sample.tide = snap.tide.phase;
      } else {
        sample.bossHp = snap.bossHp;
        if (snap.fsm) sample.state = `${snap.fsm.phase}:${snap.fsm.state}`;
      }
      if (d.m.samples.length < 1200) d.m.samples.push(sample);
    }

    // ===== 感知延遲：決策一律用 reactionMs 前的世界（人類反應注入）=====
    d.ring.push({ t: now, snap });
    if (d.ring.length > 12) d.ring.shift();
    let seen = d.ring[0];
    for (const entry of d.ring) {
      if (now - entry.t >= reactionMs) seen = entry;
      else break;
    }
    const s = seen.snap;

    if (s.hp <= 0) {
      face(0);
      release(KEY.shoot);
      return;
    }

    const jumpReady = now - d.lastJumpAt > 620;
    const jump = (ms = 200) => {
      if (!jumpReady) return;
      d.lastJumpAt = now;
      tap(KEY.jump, ms);
    };
    // 滿拍翅跳（W1.5，沿 T2 §86 實證節拍）：地跳後近頂點補拍翅，淨高至 ~211px；
    // 拍翅由 setTimeout 排程，序列期間 hopUntil 鎖定航向（跨越本體不得中途轉向）。
    const hop = (dir, flaps = 3) => {
      if (now < d.hopUntil) return;
      d.lastJumpAt = now;
      d.hopDir = dir;
      tap(KEY.jump, 70);
      let at = 380;
      for (let i = 0; i < flaps; i += 1) {
        setTimeout(() => {
          if (!d.stop && !d.pause) tap(KEY.jump, 70);
        }, at);
        at += 300;
      }
      d.hopUntil = now + at + 240;
    };
    const shoot = () => {
      // 變身優勢 hook（#816 W2）：集星待變身期間停火，防同系彈匣被射空破壞資格。
      if (d.holdFire) return;
      d.lastShotAt = now;
      d.m.shots += 1;
      tap(KEY.shoot, 55);
    };

    // 星暴 2.0（§109）：持蓄能星時擇機引爆（SP=C 鍵）——模擬玩家主動運用；
    // 走動關同屏敵 ≥2 或飢荒即用，魔王關戰鬥中即用；3s 節流防連點。
    const starburstPhase = window.__sp.starburst ? window.__sp.starburst().phase : 'none';
    const spReady = starburstPhase === 'charged' && now - d.lastSpAt >= 3000;

    if (kind === 'boss') {
      const sp = window.__sp;
      if (s.bossHp <= 0) {
        face(0);
        release(KEY.shoot);
        return;
      }
      // 拍翅序列航線鎖定（W1.5）：跨越本體/行牆期間維持航向，防左右震盪跌回。
      if (now < d.hopUntil) {
        face(d.hopDir);
        return;
      }
      if (spReady) {
        d.lastSpAt = now;
        tap(KEY.sp, 90);
      }
      // 變身優勢 hook（#816 W2）：無形態時集齊優勢味 ×3（正式 swallow 管線）→ 按 SP
      // 立即變身（空中裁決為 none，逐 tick 重試至落地）；變身中 B 即形態技，照常 tap。
      const tf = sp.transform ? sp.transform() : { form: null };
      if (tf.form && d.prevForm === null) d.m.transforms += 1;
      d.prevForm = tf.form;
      d.holdFire = false;
      if (transformFlavor && tf.form === null) {
        if (s.ammo === 0 && now - d.lastGrantAt >= 1200) {
          d.lastGrantAt = now;
          try {
            sp.grantStar(transformFlavor);
            sp.grantStar(transformFlavor);
            sp.grantStar(transformFlavor);
          } catch {
            /* 轉場窗忽略 */
          }
        }
        // 資格門用 transform eligibility 而非槽數（#848 審查修復）：空中裁決 none
        // 由 SP tap 逐 tick 重試至落地，holdFire 持續護匣防射空。
        if (s.tfReady) {
          d.holdFire = true;
          if (now - d.lastSpAt >= 600) {
            d.lastSpAt = now;
            tap(KEY.sp, 90);
          }
        }
      }
      // 鏡界窗紀律（W1.5）：開鏡窗停火防星彈折返自傷（開鏡側不可觀測，整窗停火）。
      const mirrorOpen = mirrorGuard && s.fsm && s.fsm.state === 'mirror';
      if (mirrorOpen) d.holdFire = true;
      if (d.inhaleHold && (!mirrorOpen || s.ammo > 0)) {
        d.inhaleHold = false;
        release(KEY.shoot);
      }
      // 純標準星紀律：空匣補一發 jelly（模擬吸食補給怪；走正式 swallow 管線）；
      // 變身優勢量測時由 transformFlavor 供給線全權接管。
      if (grantSupply && !transformFlavor && s.ammo === 0 && now - d.lastGrantAt >= 1200) {
        d.lastGrantAt = now;
        try {
          sp.grantStar('jelly');
        } catch {
          /* 轉場窗忽略 */
        }
      }
      const arenaLeft = 400;
      const view = s.view ?? 854;
      const center = arenaLeft + view / 2;
      const bodies = s.bodies && s.bodies.length > 0 ? s.bodies : [s.boss];
      const nearest = bodies.reduce(
        (best, b) => (Math.abs(b.x - s.px) < Math.abs(best.x - s.px) ? b : best),
        bodies[0],
      );
      // 鏡界窗再吸（W1.5）：折返彈帶 inhalable——空匣且本體不貼身時面向來彈持吸，
      // 接觸即回收為彈藥（免費彈藥獎勵理解）；彈藥入手或窗閉由上方釋放持鍵。
      if (mirrorOpen && s.ammo === 0 && Math.abs(nearest.x - s.px) > 140) {
        let inShot = null;
        for (const sh of s.shots) {
          if (inShot === null || Math.abs(sh.x - s.px) < Math.abs(inShot.x - s.px)) inShot = sh;
        }
        if (inShot && Math.abs(inShot.x - s.px) < 220) {
          face(Math.abs(inShot.x - s.px) < 30 ? 0 : Math.sign(inShot.x - s.px));
          if (!d.inhaleHold) {
            d.inhaleHold = true;
            press(KEY.shoot);
          }
          return;
        }
      }
      // 雙生夾擊跳越（W1.5 讀招先於接觸迴避：對衝橫貫全場不可退避，必須跳越；
      // twin 高 108px——單跳 98px 會被削，滿拍翅足高且覆蓋 EX 去同步第二拍）。
      if (dodge && levelId === 12 && s.fsm && s.fsm.state === 'pincer') {
        if (flap) hop(0, 3);
        else jump();
        return;
      }
      // 光束貼地紀律（W1.5）：折射光束為反空招——低束帶底緣高於站立頭頂，
      // 貼地即免傷、跳躍反而自投（W1 高 bot p1:beam 傷害主因）；貼身仍地面退避。
      if (dodge && levelId === 12 && s.fsm) {
        const beamState = s.fsm.state === 'beam' || s.fsm.state === 'crossbeam';
        if (beamState) {
          const gap = Math.abs(nearest.x - s.px);
          if (gap < 150) {
            face(s.px >= nearest.x ? 1 : -1);
            return;
          }
          if (s.ammo > 0 && now - d.lastShotAt >= 420) {
            face(Math.sign(nearest.x - s.px || 1));
            shoot();
            return;
          }
          face(0);
          return;
        }
      }
      // kite（完整策略）：L12 P2 雙子退射集火。
      if (kite && levelId === 12 && s.fsm && s.fsm.phase === 'p2' && bodies.length > 1) {
        const gap = Math.abs(nearest.x - s.px);
        if (gap < 110) {
          const backDir = s.px >= nearest.x ? 1 : -1;
          const backCornered =
            (backDir < 0 && s.px < arenaLeft + 160) ||
            (backDir > 0 && s.px > arenaLeft + view - 160);
          // 角落黏死修補（W1.5）：退無可退時滿拍翅跨越換邊（同接觸迴避語彙）。
          if (backCornered && flap) {
            hop(-backDir, 3);
            return;
          }
          face(backDir);
          jump();
          return;
        }
        face(s.px >= nearest.x ? 1 : -1);
        if (s.ammo > 0 && gap < 420 && Math.floor(now / 240) % 2 === 0) {
          face(Math.sign(nearest.x - s.px || 1));
          shoot();
        }
        return;
      }
      // 貼身接觸傷迴避（全分級保命反射，但吃感知延遲）：120px 內反向撤離＋跳，
      // 逼到牆角改朝魔王方向跳越換邊（W1.5：高階滿拍翅跨越——T2 §86 實證
      // 淨高 211px > 本體高；單跳 98px 跨不過本體是 W1 高 bot 角落黏死主因）。
      if (Math.abs(nearest.x - s.px) < 120) {
        const escapeDir = s.px >= nearest.x ? 1 : -1;
        const cornered =
          (escapeDir < 0 && s.px < arenaLeft + 160) ||
          (escapeDir > 0 && s.px > arenaLeft + view - 160);
        if (cornered && flap) {
          hop(-escapeDir, 3);
          return;
        }
        face(cornered ? -escapeDir : escapeDir);
        jump();
        return;
      }
      // 小怪貼身迴避。
      const nearFoe = s.enemies.reduce(
        (best, f) => (best === null || Math.abs(f.x - s.px) < Math.abs(best.x - s.px) ? f : best),
        null,
      );
      if (nearFoe && Math.abs(nearFoe.x - s.px) < 90 && nearFoe.y > 280) {
        face(s.px >= nearFoe.x ? 1 : -1);
        jump();
        return;
      }
      if (dodge) {
        // 讀招迴避（中/高階）：L12 招式表（beam/crossbeam/pincer 已於前段處理）。
        if (levelId === 12 && s.fsm && (s.fsm.state === 'pillar' || s.fsm.state === 'rain')) {
          face(s.px > center ? -1 : 1);
          return;
        }
        // 全高行牆（W1.5，P4 稜光行牆 h≥100）：單跳 98px 不足——朝牆滿拍翅對穿
        //（相對速度縮短交會時間，牆過即安全；遠離側逃相對速度歸零永被追上）。
        if (flap) {
          let wall = null;
          for (const h of s.hazards) {
            if (h.h >= 100 && h.y > 300 && Math.abs(h.x - s.px) < 280) {
              if (wall === null || Math.abs(h.x - s.px) < Math.abs(wall.x - s.px)) wall = h;
            }
          }
          if (wall) {
            hop(Math.sign(wall.x - s.px) || 1, 3);
            return;
          }
        }
        // 低帶 hazard（晶柱/糖漿波）帶內即跳——排除全寬水平光束（h≤40 且 w≥400：
        // 束帶僅擊中空中，跳＝自投，貼地由讀招/站樁分支承擔）。
        const lowHazard = s.hazards.some(
          (h) =>
            h.y > 320 &&
            !(h.h <= 40 && h.w >= 400) &&
            Math.abs(h.x - s.px) < Math.max(110, h.w / 2 + 36),
        );
        if (lowHazard) {
          jump();
          return;
        }
        // 彈幕垂直帶逼近：反向側移。
        const nearShot = s.shots.some((sh) => Math.abs(sh.x - s.px) < 100 && sh.y > 200);
        if (nearShot) {
          face(s.px > center ? -1 : 1);
          return;
        }
        // L16 漲潮退對側乾帶。
        if (levelId === 16 && s.tide && s.tide.phase === 'high' && s.px > center) {
          face(-1);
          return;
        }
      }
      // L20 P2 生存段（完整策略＝風箏；其餘分級靠通用迴避硬撐）。
      if (kite && levelId === 20 && s.fsm && s.fsm.phase === 'p2') {
        const overheat = s.boss.y > 150;
        if (overheat && s.ammo > 0) {
          face(s.boss.x - s.px > 0 ? 1 : -1);
          shoot();
          return;
        }
        const kiteDir = Math.floor(now / 1500) % 2 === 0 ? 1 : -1;
        const atEdge =
          (kiteDir < 0 && s.px < arenaLeft + 120) || (kiteDir > 0 && s.px > arenaLeft + view - 120);
        face(atEdge ? -kiteDir : kiteDir);
        return;
      }
      if (kite) {
        // 遠側安定輸出：±400 遠帶站位＋900ms 時間片折返；射擊窗與走位分離。
        const side = s.px <= s.boss.x ? -1 : 1;
        const flip = Math.floor(now / 900) % 2 === 0 ? 1 : -1;
        const anchor = Math.min(
          Math.max(s.boss.x + side * 400, arenaLeft + 80),
          arenaLeft + view - 80,
        );
        const target = anchor + flip * 40;
        const drift = Math.abs(target - s.px) > 60 ? Math.sign(target - s.px) : 0;
        if (s.ammo > 0 && Math.floor(now / 400) % 2 === 0) {
          face(Math.sign(s.boss.x - s.px || 1));
          if (levelId === 20) jump();
          shoot();
          return;
        }
        if (drift !== 0) face(drift);
        else face(0);
        return;
      }
      // 基礎輸出（低/中階）：面向魔王節流點射；無彈時遠離保距。
      if (s.ammo > 0) {
        face(Math.sign(s.boss.x - s.px || 1));
        if (levelId === 20 && now - d.lastJumpAt >= 900) jump();
        if (now - d.lastShotAt >= 420) shoot();
      } else {
        face(s.px > center ? -1 : 1);
      }
      return;
    }

    // ===== 走動關策略（v18 play 同構，分級門控）=====
    if (s.gateOpen) {
      release(KEY.shoot);
      face(1);
      if (now - d.lastJumpAt >= 800) jump();
      return;
    }
    if (spReady && (s.alive.total >= 2 || (s.ammo === 0 && s.alive.inhalable === 0))) {
      d.lastSpAt = now;
      tap(KEY.sp, 90);
    }
    // 滿潮避難（dodge 分級）：地面帶導航至最近平台＋節奏跳。
    if (dodge && s.tide && s.tide.phase === 'flood' && s.py > 330) {
      let navX = null;
      let navD = Infinity;
      for (const x of floodPlatformXs) {
        const dd = Math.abs(x - s.px);
        if (dd < navD) {
          navD = dd;
          navX = x;
        }
      }
      if (navX !== null) face(navD < 30 ? 0 : Math.sign(navX - s.px));
      if (now - d.lastJumpAt >= 380) {
        d.lastJumpAt = now;
        tap(KEY.jump, 230);
      }
      if (navX !== null) return;
    }
    // 近身威脅迴避（dodge 分級）：不可吸威脅貼臉且無彈 → 跳離。
    if (dodge) {
      const nearThreat = s.enemies.find(
        (e) => HARMFUL.has(e.kind) && Math.abs(e.x - s.px) < 90 && Math.abs(e.y - s.py) < 70,
      );
      if (nearThreat && s.ammo === 0 && now - d.lastJumpAt >= 500) {
        d.lastJumpAt = now;
        tap(KEY.jump, 200);
      }
    }
    // 卡位偵測：4s 未位移 → 跳一下脫困。
    if (Math.abs(s.px - d.lastX) > 30) {
      d.lastX = s.px;
      d.lastMoveAt = now;
    } else if (now - d.lastMoveAt >= 4000 && now - d.lastJumpAt >= 700) {
      d.lastJumpAt = now;
      tap(KEY.jump, 200);
    }
    if (s.ammo === 0) {
      // 覓食：最近恆可吸目標。
      let best = null;
      let bestScore = Infinity;
      for (const e of s.enemies) {
        if (!INHALABLE.has(e.kind)) continue;
        const score = Math.abs(e.x - s.px) + Math.abs(e.y - s.py) * 1.5;
        if (score < bestScore) {
          bestScore = score;
          best = e;
        }
      }
      if (!best) {
        release(KEY.shoot);
        face(1);
        return;
      }
      const dx = best.x - s.px;
      const dy = best.y - s.py;
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
    // 有彈：清最近敵，射擊窗節流 340ms。
    release(KEY.shoot);
    let target = null;
    let tScore = Infinity;
    for (const e of s.enemies) {
      const adx = Math.abs(e.x - s.px);
      const ady = Math.abs(e.y - s.py);
      if (adx > 430 || ady > 150) continue;
      const score = adx + ady;
      if (score < tScore) {
        tScore = score;
        target = e;
      }
    }
    if (target) {
      const dx = target.x - s.px;
      face(Math.abs(dx) < 120 ? 0 : Math.sign(dx));
      if (now - d.lastShotAt >= 340) {
        if (Math.abs(dx) < 120) face(Math.sign(dx) || 1);
        shoot();
      }
    } else {
      face(1);
    }
  };
  d.interval = setInterval(tick, 80);
}
