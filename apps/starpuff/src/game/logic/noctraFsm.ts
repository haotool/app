import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';
import { distanceBandOf, pickMove, type WeightedMove } from './moveTable';

// 暗月蝠王 Noctra FSM 純邏輯（GAME_DESIGN §54，不 import phaser），vitest 對象。
// 平行於 bossFsm.ts 的表驅動模式：phase truth 全數收斂於此，禁止散落 scene。

// v9 難度根修（§54，實測席稽核）：v8 出貨值（idle 1100/bomb 4/dive 連擊/barrage 10）
// 實測普通與熟練 bot 勝率皆 0%——有效輸出窗僅剩俯衝縫；本表為調參後基準值，
// EX 沿用本基準再乘 EX 係數。
export const NOCTRA = {
  // 血量（難度根修：70 → 52）：hit window 修復後以雙水準 bot 勝率門檻
  //（普通 ≥40%/熟練 ≥80%）收斂定案——TTK 對齊補給經濟，普通玩家標準星
  // 保底線約 40-60s 擊破。
  maxHp: 52,
  phase2HpRatio: 0.6,
  phase3HpRatio: 0.3,
  bodyDamage: 1,
  // 狂暴節奏（難度根修：1.25 → 1.15）：P2/P3 壓力回落可讀帶。
  enrageSpeedMultiplier: 1.15,
  // P1 盤旋投彈；P3 彈幕改放射狀（難度根修：4/5/10 → 2/3/7——bot 實測 P1/P2
  // 落彈鏈與 P3 放射彈為主要死因，勝率門檻 40%/80% 收斂後定案）。
  bombCountP1: 2,
  bombCountP2: 3,
  barrageCount: 7,
  // P2 召喚 floaty 上限（場上同時存活數，超額召喚令由呈現層依現量夾限）。
  summonCap: 2,
  // 補給節奏（anti-softlock）：每損 8 HP 掉補給小怪（難度根修：10 → 8，
  // 輸出愈多彈藥愈順，正回饋取代枯竭）。
  minionSpawnHpStep: 8,
  // 招式間隙（難度根修：1100 → 1600，表觀 hit window 抬至 ≥55%）。
  idleMs: 1600,
  bombDurationMs: 1300,
  // 俯衝全程（難度根修：1500 → 2100）：涵蓋前搖 720＋下落＋落地滯留＋回升，
  // EX 最高速率（×1.4375）下 telegraph（不隨速率縮放）仍不與下一招重疊。
  diveDurationMs: 2100,
  summonDurationMs: 900,
  barrageDurationMs: 1400,
  sweepDurationMs: 1700,
  eclipseDurationMs: 1500,
  // 俯衝落地滯留（難度根修）：貼地 hold 給地面水平星彈明確輸出窗。
  diveHoldMs: 300,
  // 俯衝落地 hit window（§58）：窗內頭頂下砸觸發長暈（涵蓋滯留＋回升起始）。
  diveStunWindowMs: 900,
  diveStunMs: 1800,
  // 蝕月斗篷（§5 #813）：P2 起低頻隱形，僅月牙軌跡粒子可見；固定 1.2s
  // 不隨速率縮放（可讀性紅線），按住吸入氣流擾動可顯形（吸入第二用途）。
  cloakDurationMs: 1200,
} as const;

// Noctra EX 專屬（§58）：月蝕彈幕矩陣——分列直落彈網、每波留缺口通道。
export const EX_NOCTRA = {
  eclipseCols: 9,
  eclipseRows: 2,
  eclipseGapCols: 2,
  eclipseFallSpeed: 150,
  eclipseRowDelayMs: 520,
} as const;

export type NoctraAction =
  | 'hover'
  | 'bomb'
  | 'dive'
  | 'summon'
  | 'barrage'
  | 'sweep'
  | 'eclipse'
  | 'cloak';

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: NOCTRA.enrageSpeedMultiplier,
  p3: NOCTRA.enrageSpeedMultiplier,
};

export function noctraPhaseForHp(hp: number, maxHp: number): BossPhase {
  if (hp <= maxHp * NOCTRA.phase3HpRatio) return 'p3';
  return hp <= maxHp * NOCTRA.phase2HpRatio ? 'p2' : 'p1';
}

// 加權選招表（§5 #813）：P1 盤旋投彈＋俯衝；P2 追加召喚與低頻蝕月斗篷；
// P3 狂暴彈幕＋俯掠＋投彈＋低頻斗篷；EX P3 追加月蝕彈幕矩陣。
export function noctraMoveTable(
  phase: BossPhase,
  ex = false,
): readonly WeightedMove<NoctraAction>[] {
  switch (phase) {
    case 'p1':
      return [
        { action: 'bomb', weight: 3 },
        { action: 'dive', weight: 3 },
      ];
    case 'p2':
      return [
        { action: 'bomb', weight: 3 },
        { action: 'dive', weight: 3 },
        { action: 'summon', weight: 2 },
        { action: 'cloak', weight: 1 },
      ];
    case 'p3':
      return [
        { action: 'barrage', weight: 3 },
        { action: 'sweep', weight: 3 },
        { action: 'bomb', weight: 2 },
        { action: 'cloak', weight: 1 },
        ...(ex ? [{ action: 'eclipse', weight: 2 } as const] : []),
      ];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

export function noctraBombCount(phase: BossPhase): number {
  return phase === 'p1' ? NOCTRA.bombCountP1 : NOCTRA.bombCountP2;
}

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/noctra.ts 承擔。
export type NoctraCommand =
  | { kind: 'hover' }
  | { kind: 'bomb'; count: number }
  | { kind: 'dive' }
  | { kind: 'summon'; cap: number }
  | { kind: 'barrage'; count: number }
  | { kind: 'sweep' }
  | { kind: 'eclipse'; cols: number; rows: number; gapCols: number }
  | { kind: 'cloak'; durationMs: number };

export type NoctraHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' };

export interface NoctraFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: NoctraAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  tick(deltaMs: number): NoctraCommand | null;
  takeDamage(amount: number): NoctraHitEvent[];
  // 俯衝落地窗頭頂命中長暈（§58）：回盤旋並停拍 durationMs。
  stun(durationMs: number): void;
  // 雷化鏈電中斷召喚（§58）：僅召喚態可中斷，成功回 true。
  interruptSummon(): boolean;
  // 距離帶餵送（§5 條件欄）：呈現層逐幀回報與玩家距離；未餵送視為 far。
  setTargetDistance(distancePx: number | null): void;
}

export interface NoctraFsmOptions {
  ex?: boolean;
  // 加權選招亂數注入（§5：同 seed 可重放；缺省 Math.random）。
  rng?: () => number;
}

export function createNoctraFsm(options: NoctraFsmOptions = {}): NoctraFsm {
  const ex = options.ex === true;
  const rng = options.rng ?? Math.random;
  const maxHp = Math.round(NOCTRA.maxHp * (ex ? EX_MODS.hpMul : 1));
  let hp: number = maxHp;
  let phase: BossPhase = 'p1';
  let state: NoctraAction = 'hover';
  // 近兩次出招（§5 連續同招上限 2）。
  let recentAttacks: NoctraAction[] = [];
  let distancePx: number | null = null;
  let timerMs: number = NOCTRA.idleMs;
  let damageSinceDrop = 0;
  let defeated = false;

  const speedFactor = (): number => SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1);

  const durationMs = (action: NoctraAction): number => {
    switch (action) {
      case 'hover':
        return NOCTRA.idleMs / speedFactor();
      case 'bomb':
        return NOCTRA.bombDurationMs / speedFactor();
      case 'dive':
        return NOCTRA.diveDurationMs / speedFactor();
      case 'summon':
        return NOCTRA.summonDurationMs / speedFactor();
      case 'barrage':
        return NOCTRA.barrageDurationMs / speedFactor();
      case 'sweep':
        return NOCTRA.sweepDurationMs / speedFactor();
      case 'eclipse':
        return NOCTRA.eclipseDurationMs / speedFactor();
      case 'cloak':
        // 隱形窗固定 1.2s（可讀性紅線）：不隨狂暴速率縮放。
        return NOCTRA.cloakDurationMs;
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: NoctraAction): NoctraCommand => {
    switch (action) {
      case 'hover':
        return { kind: 'hover' };
      case 'bomb':
        return { kind: 'bomb', count: noctraBombCount(phase) };
      case 'dive':
        return { kind: 'dive' };
      case 'summon':
        return { kind: 'summon', cap: NOCTRA.summonCap };
      case 'barrage':
        return { kind: 'barrage', count: NOCTRA.barrageCount };
      case 'sweep':
        return { kind: 'sweep' };
      case 'eclipse':
        return {
          kind: 'eclipse',
          cols: EX_NOCTRA.eclipseCols,
          rows: EX_NOCTRA.eclipseRows,
          gapCols: EX_NOCTRA.eclipseGapCols,
        };
      case 'cloak':
        return { kind: 'cloak', durationMs: NOCTRA.cloakDurationMs };
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
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
    tick(deltaMs: number): NoctraCommand | null {
      if (defeated) return null;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      if (state === 'hover') {
        // 加權選招（§5）：權重＋條件（HP 帶/距離帶）＋連續同招上限 2。
        state = pickMove(
          noctraMoveTable(phase, ex),
          { hpRatio: hp / maxHp, distanceBand: distanceBandOf(distancePx) },
          recentAttacks,
          rng,
        );
        recentAttacks = [...recentAttacks.slice(-1), state];
      } else {
        state = 'hover';
      }
      // 保留溢出時間，維持節奏不漂移（同 bossFsm）。
      timerMs += durationMs(state);
      return commandOf(state);
    },
    takeDamage(amount: number): NoctraHitEvent[] {
      if (defeated || amount <= 0) return [];
      hp = Math.max(0, hp - amount);
      const events: NoctraHitEvent[] = [{ kind: 'damaged', hp }];
      const nextPhase = noctraPhaseForHp(hp, maxHp);
      if (nextPhase !== phase) {
        const previousFactor = SPEED_FACTORS[phase];
        phase = nextPhase;
        // 換階段清空同招記錄，新招池從乾淨狀態抽選。
        recentAttacks = [];
        timerMs *= previousFactor / SPEED_FACTORS[phase];
        events.push({ kind: 'phase', phase });
      }
      if (hp > 0) {
        damageSinceDrop += amount;
        while (damageSinceDrop >= NOCTRA.minionSpawnHpStep) {
          damageSinceDrop -= NOCTRA.minionSpawnHpStep;
          events.push({ kind: 'minionDrop' });
        }
      } else {
        defeated = true;
        events.push({ kind: 'defeated' });
      }
      return events;
    },
    stun(durationMs: number): void {
      if (defeated) return;
      state = 'hover';
      timerMs = durationMs;
    },
    interruptSummon(): boolean {
      if (defeated || state !== 'summon') return false;
      state = 'hover';
      timerMs = NOCTRA.idleMs / speedFactor();
      return true;
    },
    setTargetDistance(next: number | null): void {
      distancePx = next;
    },
  };
}
