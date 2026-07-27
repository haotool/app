import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';
import { distanceBandOf, pickMove, type WeightedMove } from './moveTable';

// 潮汐女王 Maridella FSM 純邏輯（GAME_DESIGN §122，不 import phaser），vitest 對象。
// 懸浮場控三段（潮灣主題）：P1 潮線改道（地面水流交替推移＋水滴彈幕）→
// P2 海嘯階梯（波浪牆留高低缺口＋潮湧召喚）→ P3 深海月蝕（暗場＋三水球依序環爆）。
// phase truth 全數收斂於此，禁止散落 scene（沿 syronaFsm 慣例）。

export const MARIDELLA = {
  // 魔王 HP 階梯（終局章遞增）：Tariffang 112 → Maridella 116。
  maxHp: 116,
  bodyDamage: 1,
  // 階段轉換閾值：P2 ≤66%、P3 ≤33%。
  p2HpRatio: 0.66,
  p3HpRatio: 0.33,
  enrageSpeedMultiplier: 1.15,
  // 補給節奏（§26 飢荒保證律）：每損 10 HP 掉補給小怪。
  minionSpawnHpStep: 10,
  // P2 潮湧召喚 foamy 上限（場上同時存活數，超額由呈現層夾限）；
  // 泡泡上浮兼具渡牆輔助——召喚同時是威脅與資源（孢子味＝潮化供給）。
  summonCap: 2,
  // 招式時長（僵直窗獨立為 idleMs＝固定輸出窗）。
  currentDurationMs: 4200,
  dropletDurationMs: 1600,
  waveDurationMs: 2400,
  summonDurationMs: 900,
  moonorbDurationMs: 3600,
  // p4 為 EX 專屬型態鍵位（#814 基建）：Maridella 無 P4，執行期不可達、沿 p3 值。
  idleMs: { p1: 2200, p2: 1900, p3: 1900, p4: 1900 },
  // telegraph 時長（呈現層讀取；固定不隨狂暴縮放，≥600ms 可讀性紅線）。
  currentTelegraphMs: 900,
  dropletTelegraphMs: 650,
  waveTelegraphMs: 900,
  moonorbTelegraphMs: 600,
  // 潮線改道：水流推移強度恆低於玩家全速（220，交叉不變式 16）；潮化免推（§119 優勢）。
  currentPushPxPerSec: 90,
  currentHoldMs: 4000,
  // 水滴彈幕：P1 ×3、P2 起 ×4。
  dropletCountP1: 3,
  dropletCountP2: 4,
  // 海嘯階梯：波浪牆缺口高度（低缺口貼地可走、高缺口跳＋拍翅可穿）——
  // 缺口 ≥100px 恆容玩家 48px 本體（anti-softlock：每道牆必留缺口）。
  waveGapPx: 102,
  // 深海月蝕：水球數與每球爆裂放射彈數。
  moonorbCount: 3,
  moonorbRingShots: 8,
} as const;

// Maridella EX 專屬差分（§58 EX 慣例：HP/節奏走 EX_MODS 共用倍率）：
// 質性差分＝水球 3→4＋召喚上限 3＋水滴 ×5；缺口高度不縮（只縮體不縮窗紅線同源）。
export const EX_MARIDELLA = {
  summonCap: 3,
  moonorbCount: 4,
  dropletCount: 5,
} as const;

export type MaridellaAction = 'idle' | 'current' | 'droplet' | 'wave' | 'summon' | 'moonorb';

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/maridella.ts 承擔。
// current.dir 為水流方向（交替出向，箭頭提前提示）；wave.gapLow 為缺口位置
//（低＝貼地走廊、高＝跳躍帶，rng 抽選同 seed 可重放）。
export type MaridellaCommand =
  | { kind: 'idle' }
  | { kind: 'current'; dir: 1 | -1; holdMs: number }
  | { kind: 'droplet'; count: number }
  | { kind: 'wave'; fromLeft: boolean; gapLow: boolean }
  | { kind: 'summon'; cap: number }
  | { kind: 'moonorb'; count: number };

export type MaridellaHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' };

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: MARIDELLA.enrageSpeedMultiplier,
  p3: MARIDELLA.enrageSpeedMultiplier,
  p4: MARIDELLA.enrageSpeedMultiplier,
};

// 加權選招表（§111.1 moveTable SSOT）：P1 潮線/水滴；P2 海嘯牆＋召喚；
// P3 月蝕環爆為主軸（水滴限遠距帶——貼身拋物不可讀，沿 Syrona lob 理據）。
export function maridellaMoveTable(phase: BossPhase): readonly WeightedMove<MaridellaAction>[] {
  switch (phase) {
    case 'p1':
      return [
        { action: 'current', weight: 3 },
        { action: 'droplet', weight: 3, condition: { band: 'far' } },
      ];
    case 'p2':
      return [
        { action: 'wave', weight: 3 },
        { action: 'droplet', weight: 2, condition: { band: 'far' } },
        { action: 'summon', weight: 2 },
        { action: 'current', weight: 2 },
      ];
    // p4 執行期不可達（無 EX P4 型態）：沿 p3 招池補鍵位。
    case 'p3':
    case 'p4':
      return [
        { action: 'moonorb', weight: 3 },
        { action: 'wave', weight: 3 },
        { action: 'current', weight: 2 },
      ];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

export interface MaridellaFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: MaridellaAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  tick(deltaMs: number): MaridellaCommand | null;
  takeDamage(amount: number): MaridellaHitEvent[];
  // 雷化鏈電中斷召喚（§58 慣例）：僅召喚態可中斷，成功回 true。
  interruptSummon(): boolean;
  // 距離帶餵送（§111.1 條件欄）：呈現層逐幀回報與玩家距離；未餵送視為 far。
  setTargetDistance(distancePx: number | null): void;
}

export interface MaridellaFsmOptions {
  ex?: boolean;
  // 亂數注入（缺口抽選與加權選招共用；同 seed 可重放；缺省 Math.random）。
  rng?: () => number;
}

export function createMaridellaFsm(options: MaridellaFsmOptions = {}): MaridellaFsm {
  const ex = options.ex === true;
  const rng = options.rng ?? Math.random;
  const maxHp = Math.round(MARIDELLA.maxHp * (ex ? EX_MODS.hpMul : 1));
  const summonCap = ex ? EX_MARIDELLA.summonCap : MARIDELLA.summonCap;
  const dropletCount = (phase: BossPhase): number => {
    if (ex) return EX_MARIDELLA.dropletCount;
    return phase === 'p1' ? MARIDELLA.dropletCountP1 : MARIDELLA.dropletCountP2;
  };

  let hp = maxHp;
  let phase: BossPhase = 'p1';
  let state: MaridellaAction = 'idle';
  let recentAttacks: MaridellaAction[] = [];
  let distancePx: number | null = null;
  let timerMs: number = MARIDELLA.idleMs.p1;
  let damageSinceDrop = 0;
  // 潮線交替出向（可讀性）：每次改道翻轉方向，箭頭 telegraph 先行。
  let currentDir: 1 | -1 = 1;
  let defeated = false;

  const speedFactor = (): number => SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1);

  const durationMs = (action: MaridellaAction): number => {
    switch (action) {
      // 僵直窗＝固定輸出窗：不隨狂暴縮短（§74 hit window 慣例）。
      case 'idle':
        return MARIDELLA.idleMs[phase];
      case 'current':
        return MARIDELLA.currentDurationMs / speedFactor();
      case 'droplet':
        return MARIDELLA.dropletDurationMs / speedFactor();
      case 'wave':
        return MARIDELLA.waveDurationMs / speedFactor();
      case 'summon':
        return MARIDELLA.summonDurationMs / speedFactor();
      case 'moonorb':
        return MARIDELLA.moonorbDurationMs / speedFactor();
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: MaridellaAction): MaridellaCommand => {
    switch (action) {
      case 'idle':
        return { kind: 'idle' };
      case 'current': {
        currentDir = currentDir === 1 ? -1 : 1;
        return { kind: 'current', dir: currentDir, holdMs: MARIDELLA.currentHoldMs };
      }
      case 'droplet':
        return { kind: 'droplet', count: dropletCount(phase) };
      case 'wave':
        // 起浪側與缺口位置由 rng 抽選（同 seed 可重放）；缺口恆存（anti-softlock）。
        return { kind: 'wave', fromLeft: rng() < 0.5, gapLow: rng() < 0.5 };
      case 'summon':
        return { kind: 'summon', cap: summonCap };
      case 'moonorb':
        return {
          kind: 'moonorb',
          count: ex ? EX_MARIDELLA.moonorbCount : MARIDELLA.moonorbCount,
        };
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const enterPhase = (next: BossPhase, events: MaridellaHitEvent[]): void => {
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
    tick(deltaMs: number): MaridellaCommand | null {
      if (defeated) return null;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      if (state === 'idle') {
        state = pickMove(
          maridellaMoveTable(phase),
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
    takeDamage(amount: number): MaridellaHitEvent[] {
      if (defeated || amount <= 0) return [];
      const events: MaridellaHitEvent[] = [];
      hp = Math.max(0, hp - amount);
      events.push({ kind: 'damaged', hp });
      if (hp <= 0) {
        defeated = true;
        events.push({ kind: 'defeated' });
        return events;
      }
      damageSinceDrop += amount;
      while (damageSinceDrop >= MARIDELLA.minionSpawnHpStep) {
        damageSinceDrop -= MARIDELLA.minionSpawnHpStep;
        events.push({ kind: 'minionDrop' });
      }
      // 階段轉換：跨多閾值單次受擊依序帶出 phase 事件（p1→p2→p3 不跳段）。
      if (phase === 'p1' && hp <= maxHp * MARIDELLA.p2HpRatio) enterPhase('p2', events);
      if (phase === 'p2' && hp <= maxHp * MARIDELLA.p3HpRatio) enterPhase('p3', events);
      return events;
    },
    interruptSummon(): boolean {
      if (defeated || state !== 'summon') return false;
      state = 'idle';
      timerMs = durationMs('idle');
      return true;
    },
    setTargetDistance(next: number | null): void {
      distancePx = next;
    },
  };
}
