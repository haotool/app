import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';
import { distanceBandOf, pickMove, type WeightedMove } from './moveTable';

// 引力侯爵 Gravion FSM 純邏輯（GAME_DESIGN §123，不 import phaser），vitest 對象。
// 懸浮引力型三段（黑洞外環主題）：P1 重力切換（全場方向力場——場景箭頭預告先行、
// 力場是位移力非傷害，切換瞬間不得直接命中）→ P2 軌道彈（四黑色星體繞場公轉，
// 可擊破屏障找旋轉間隙）→ P3 黑洞壓縮（場地縮小＋中央黑洞彎折星彈，近身輸出優勢）。
// 反制每招 ≥2 解：引力化抗性（力場免效）／殼化定身／潮化撥開；軌道星體星彈可破、
// 雷化鏈電速破；壓縮走廊中央恆開。phase truth 全數收斂於此，禁止散落 scene。

export const GRAVION = {
  // 魔王 HP 階梯（終局章接續 §123 遞增）：Reflector 120 → Gravion 124。
  maxHp: 124,
  bodyDamage: 1,
  // 階段轉換閾值：P2 ≤66%、P3 ≤33%。
  p2HpRatio: 0.66,
  p3HpRatio: 0.33,
  enrageSpeedMultiplier: 1.15,
  // 補給節奏（§26 飢荒保證律）：每損 10 HP 掉補給小怪。
  minionSpawnHpStep: 10,
  // 招式時長（僵直窗獨立為 idleMs＝固定輸出窗）。
  gswitchDurationMs: 4800,
  orbshotDurationMs: 1800,
  orbitDurationMs: 2200,
  crushDurationMs: 4200,
  barrageDurationMs: 2000,
  // p4 為 EX 專屬型態鍵位（#814 基建）：Gravion 無 P4，執行期不可達、沿 p3 值。
  idleMs: { p1: 2100, p2: 1800, p3: 1700, p4: 1700 },
  // telegraph 時長（呈現層讀取；固定不隨狂暴縮放，≥600ms 可讀性紅線）。
  gswitchTelegraphMs: 900,
  orbshotTelegraphMs: 700,
  // 召喚類 telegraph 一併錨定（W2 540ms 漏網教訓）。
  orbitTelegraphMs: 700,
  crushTelegraphMs: 900,
  barrageTelegraphMs: 650,
  // 重力切換（主題）：力場時長與位移力（恆低於玩家全速 220，交叉不變式 16）；
  // 上向力升托帶頂線（升至該高即不再抬升，防無限上浮）。
  gswitchFieldMs: 3800,
  gswitchDriftPxPerSec: 110,
  gswitchLiftTopY: 150,
  // 軌道星體：場上上限／星彈耐久（3 發破一顆；雷化鏈電速破——優勢解非必需）／
  // 公轉半徑與角速度（旋轉間隙可讀）。
  orbCap: 4,
  orbHp: 3,
  orbRadiusPx: 170,
  orbAngularPerMs: 0.0016,
  // 黑洞壓縮（P3）：側牆各覆蓋比例（中央走廊恆開 anti-softlock）與駐留時長。
  crushWallRatio: 0.2,
  crushHoldMs: 2600,
  // 蝕星彈幕：放射彈數。
  barrageCount: 6,
  // 中央黑洞（P3 常駐）：彎折玩家飛行中星彈的作用半徑與加速度（域外不受影響——
  // 近身/中距輸出照常，遠場長彈道才被吸偏＝近身輸出優勢語彙）。
  blackholeRadiusPx: 150,
  blackholePullPxPerSec2: 900,
} as const;

// Gravion EX 專屬差分（§58 EX 慣例：HP/節奏走 EX_MODS 共用倍率）：
// 質性差分＝軌道星體 4→6（間隙變窄）＋彈幕 6→8。
export const EX_GRAVION = {
  orbCap: 6,
  barrageCount: 8,
} as const;

export type GravityDirection = 'left' | 'right' | 'up' | 'down';

const GRAVITY_DIRECTIONS: readonly GravityDirection[] = ['left', 'right', 'up', 'down'];

export type GravionAction = 'idle' | 'gswitch' | 'orbshot' | 'orbit' | 'crush' | 'barrage';

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/gravion.ts 承擔。
export type GravionCommand =
  | { kind: 'idle' }
  | { kind: 'gswitch'; direction: GravityDirection; fieldMs: number }
  | { kind: 'orbshot' }
  | { kind: 'orbit'; cap: number }
  | { kind: 'crush'; holdMs: number }
  | { kind: 'barrage'; count: number };

export type GravionHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' };

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: GRAVION.enrageSpeedMultiplier,
  p3: GRAVION.enrageSpeedMultiplier,
  p4: GRAVION.enrageSpeedMultiplier,
};

// 加權選招表（§111.1 moveTable SSOT）：P1 重力切換/蝕星彈；P2 加入軌道星體召喚；
// P3 黑洞壓縮＋彈幕主軸。
export function gravionMoveTable(phase: BossPhase): readonly WeightedMove<GravionAction>[] {
  switch (phase) {
    case 'p1':
      return [
        { action: 'gswitch', weight: 3 },
        { action: 'orbshot', weight: 3 },
      ];
    case 'p2':
      return [
        { action: 'gswitch', weight: 2 },
        { action: 'orbshot', weight: 2 },
        { action: 'orbit', weight: 3 },
      ];
    // p4 執行期不可達（無 EX P4 型態）：沿 p3 招池補鍵位。
    case 'p3':
    case 'p4':
      return [
        { action: 'crush', weight: 3 },
        { action: 'barrage', weight: 3 },
        { action: 'gswitch', weight: 2 },
      ];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

// 黑洞彎折（P3）：域內飛行星彈速度向黑洞逐幀彎折；域外或重合不動（沿 §59 magnetPull
// 模式，常數獨立——黑洞是場域機制非磁殼）。純函式供 vitest 與呈現層。
export function blackholePull(
  starX: number,
  starY: number,
  vx: number,
  vy: number,
  holeX: number,
  holeY: number,
  deltaMs: number,
): { vx: number; vy: number } {
  const dx = holeX - starX;
  const dy = holeY - starY;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist > GRAVION.blackholeRadiusPx) return { vx, vy };
  const accel = (GRAVION.blackholePullPxPerSec2 * deltaMs) / 1000;
  return { vx: vx + (dx / dist) * accel, vy: vy + (dy / dist) * accel };
}

export interface GravionFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: GravionAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  readonly orbCap: number;
  tick(deltaMs: number): GravionCommand | null;
  takeDamage(amount: number): GravionHitEvent[];
  // 頭頂 hit window：懸浮場控型免暈（§74 慣例）——下砸僅回彈，恆回 false。
  stun(durationMs: number): boolean;
  // 距離帶餵送（§111.1 條件欄）：呈現層逐幀回報與玩家距離；未餵送視為 far。
  setTargetDistance(distancePx: number | null): void;
}

export interface GravionFsmOptions {
  ex?: boolean;
  // 亂數注入（加權選招與重力方向抽選；同 seed 可重放；缺省 Math.random）。
  rng?: () => number;
}

export function createGravionFsm(options: GravionFsmOptions = {}): GravionFsm {
  const ex = options.ex === true;
  const rng = options.rng ?? Math.random;
  const maxHp = Math.round(GRAVION.maxHp * (ex ? EX_MODS.hpMul : 1));
  const orbCap = ex ? EX_GRAVION.orbCap : GRAVION.orbCap;

  let hp = maxHp;
  let phase: BossPhase = 'p1';
  let state: GravionAction = 'idle';
  let recentAttacks: GravionAction[] = [];
  let distancePx: number | null = null;
  let timerMs: number = GRAVION.idleMs.p1;
  let damageSinceDrop = 0;
  // 上次重力方向：連抽避重（同向連續兩次體感為卡場）。
  let lastDirection: GravityDirection | null = null;
  let defeated = false;

  const speedFactor = (): number => SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1);

  const pickDirection = (): GravityDirection => {
    const pool = GRAVITY_DIRECTIONS.filter((dir) => dir !== lastDirection);
    const picked = pool[Math.floor(rng() * pool.length)] ?? 'left';
    lastDirection = picked;
    return picked;
  };

  const durationMs = (action: GravionAction): number => {
    switch (action) {
      // 僵直窗＝固定輸出窗：不隨狂暴縮短（§74 hit window 慣例）。
      case 'idle':
        return GRAVION.idleMs[phase];
      // 重力切換全程（telegraph＋力場）固定不縮放：力場時長即反制窗語彙。
      case 'gswitch':
        return GRAVION.gswitchDurationMs;
      case 'orbshot':
        return GRAVION.orbshotDurationMs / speedFactor();
      case 'orbit':
        return GRAVION.orbitDurationMs / speedFactor();
      case 'crush':
        return GRAVION.crushDurationMs / speedFactor();
      case 'barrage':
        return GRAVION.barrageDurationMs / speedFactor();
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: GravionAction): GravionCommand => {
    switch (action) {
      case 'idle':
        return { kind: 'idle' };
      case 'gswitch':
        return { kind: 'gswitch', direction: pickDirection(), fieldMs: GRAVION.gswitchFieldMs };
      case 'orbshot':
        return { kind: 'orbshot' };
      case 'orbit':
        return { kind: 'orbit', cap: orbCap };
      case 'crush':
        return { kind: 'crush', holdMs: GRAVION.crushHoldMs };
      case 'barrage':
        return {
          kind: 'barrage',
          count: ex ? EX_GRAVION.barrageCount : GRAVION.barrageCount,
        };
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const enterPhase = (next: BossPhase, events: GravionHitEvent[]): void => {
    phase = next;
    state = 'idle';
    recentAttacks = [];
    timerMs = durationMs('idle');
    events.push({ kind: 'phase', phase: next });
  };

  return {
    get hp() {
      return hp;
    },
    get maxHp() {
      return maxHp;
    },
    get phase() {
      return phase;
    },
    get state() {
      return state;
    },
    get speedFactor() {
      return speedFactor();
    },
    get defeated() {
      return defeated;
    },
    get orbCap() {
      return orbCap;
    },
    tick(deltaMs: number): GravionCommand | null {
      if (defeated) return null;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      if (state === 'idle') {
        state = pickMove(
          gravionMoveTable(phase),
          { hpRatio: hp / maxHp, distanceBand: distanceBandOf(distancePx) },
          recentAttacks,
          rng,
        );
        recentAttacks = [...recentAttacks.slice(-1), state];
      } else {
        state = 'idle';
      }
      // 保留溢出時間，維持節奏不漂移（同 bossFsm）。
      timerMs += durationMs(state);
      return commandOf(state);
    },
    takeDamage(amount: number): GravionHitEvent[] {
      if (defeated || amount <= 0) return [];
      const events: GravionHitEvent[] = [];
      hp = Math.max(0, hp - amount);
      events.push({ kind: 'damaged', hp });
      if (hp <= 0) {
        defeated = true;
        events.push({ kind: 'defeated' });
        return events;
      }
      damageSinceDrop += amount;
      while (damageSinceDrop >= GRAVION.minionSpawnHpStep) {
        damageSinceDrop -= GRAVION.minionSpawnHpStep;
        events.push({ kind: 'minionDrop' });
      }
      // 階段轉換：跨多閾值單次受擊依序帶出 phase 事件（p1→p2→p3 不跳段）。
      if (phase === 'p1' && hp <= maxHp * GRAVION.p2HpRatio) enterPhase('p2', events);
      if (phase === 'p2' && hp <= maxHp * GRAVION.p3HpRatio) enterPhase('p3', events);
      return events;
    },
    stun(durationMs: number): boolean {
      // 懸浮場控型免暈（§74 慣例）：下砸命中僅回彈免體傷。
      void durationMs;
      return false;
    },
    setTargetDistance(next: number | null): void {
      distancePx = next;
    },
  };
}
