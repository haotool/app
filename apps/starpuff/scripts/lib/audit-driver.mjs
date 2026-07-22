// 統一量測 driver（#818）：走動關＋魔王關單一策略引擎，分級 bot 以感知延遲
// （快照環回看 reactionMs）與策略開關（dodge/kite）分級——低/中/高不是三份腳本。
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
  } = opts;
  // 重掛保護：先停舊 driver（同頁重進關卡時避免雙 interval 疊鍵）。
  if (window.__audit) {
    window.__audit.stop = true;
    clearInterval(window.__audit.interval);
  }
  const KEY = { left: 37, right: 39, jump: 90, shoot: 88 };
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
    },
    cur: { ammoZero: 0, starving: 0, fullStall: 0, quotaStall: 0, reachVacuum: 0 },
    ring: [],
    prevHp: -1,
    prevKill: -1,
    prevBossHp: -1,
    fightStartMs: -1,
    lastState: '',
    lastSampleAt: 0,
    lastJumpAt: 0,
    lastShotAt: 0,
    lastGrantAt: 0,
    lastX: 0,
    lastMoveAt: 0,
    stop: false,
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
    const shoot = () => {
      d.lastShotAt = now;
      d.m.shots += 1;
      tap(KEY.shoot, 55);
    };

    if (kind === 'boss') {
      const sp = window.__sp;
      if (s.bossHp <= 0) {
        face(0);
        release(KEY.shoot);
        return;
      }
      // 純標準星紀律：空匣補一發 jelly（模擬吸食補給怪；走正式 swallow 管線）。
      if (grantSupply && s.ammo === 0 && now - d.lastGrantAt >= 1200) {
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
      // kite（完整策略）：L12 P2 雙子退射集火。
      if (kite && levelId === 12 && s.fsm && s.fsm.phase === 'p2' && bodies.length > 1) {
        const gap = Math.abs(nearest.x - s.px);
        if (gap < 110) {
          face(s.px >= nearest.x ? 1 : -1);
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
      // 逼到牆角改朝魔王方向跳越換邊。
      if (Math.abs(nearest.x - s.px) < 120) {
        const escapeDir = s.px >= nearest.x ? 1 : -1;
        const cornered =
          (escapeDir < 0 && s.px < arenaLeft + 160) ||
          (escapeDir > 0 && s.px > arenaLeft + view - 160);
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
        // 讀招迴避（中/高階）：L12 招式表。
        if (levelId === 12 && s.fsm) {
          if (s.fsm.state === 'beam' || s.fsm.state === 'pincer') {
            jump();
          } else if (s.fsm.state === 'crossbeam') {
            if (jumpReady) jump();
            else {
              face(0);
            }
            return;
          } else if (s.fsm.state === 'pillar' || s.fsm.state === 'rain') {
            face(s.px > center ? -1 : 1);
            return;
          }
        }
        // 低帶 hazard（晶柱/光束/糖漿波）帶內即跳。
        const lowHazard = s.hazards.some(
          (h) => h.y > 320 && Math.abs(h.x - s.px) < Math.max(110, h.w / 2 + 36),
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
