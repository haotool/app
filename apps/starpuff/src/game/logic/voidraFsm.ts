import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';

// 蝕星魔核 Voidra FSM 純邏輯（GAME_DESIGN §82，不 import phaser），vitest 對象。
// 場控收束型三段（主計畫 §6.3 v12 定案：P2＝定點轟炸生存段）：
// P1 王座戰（重力牽引/星屑彈環/虛空爪擊）→ P2 生存段（核心升頂不可及、40s 波次表
// 定點轟炸、3 次過熱窗＝唯一輸出窗、沿途空投 5 枚星屑）→ P3 核心決戰（全場低重力
// 0.55、蝕星彈幕/黑洞潮汐、裂核大窗）。phase truth 全數收斂於此，禁止散落 scene。

export const VOIDRA = {
  // 魔王 HP 階梯（主計畫 §3.2）：… Prismix 80 → Syrona 90 → Voidra 110。
  maxHp: 110,
  bodyDamage: 1,
  // 階段轉換閾值：P2 ≤70%、P3 ≤40%（P2 另有 40s 波次表播完的時間驅動轉換）。
  p2HpRatio: 0.7,
  p3HpRatio: 0.4,
  enrageSpeedMultiplier: 1.15,
  // 補給節奏（§26 飢荒保證律）：每損 10 HP 掉補給小怪。
  minionSpawnHpStep: 10,
  // P1 招式：重力牽引（呈現層施拉力，反向操作可抵抗）/星屑彈環放射/虛空爪擊。
  pullDurationMs: 2200,
  ringCount: 6,
  ringDurationMs: 1400,
  clawDurationMs: 1600,
  clawTelegraphMs: 600,
  // 階段僵直窗（hit window）：P1 收爪僵直 2.5s、P3 裂核大窗 3.5s（固定不隨狂暴縮）。
  idleMs: { p1: 2500, p2: 0, p3: 3500 },
  // P3 蝕星彈幕：放射 ×8＋螺旋雙層（EX 三層）；黑洞潮汐強牽引。
  barrageRadialCount: 8,
  barrageSpiralLayers: 2,
  barrageDurationMs: 1800,
  crushDurationMs: 2400,
  barrageTelegraphMs: 800,
  // P3 全場低重力注入值（交叉不變式 16 由呈現層牽引夾限背書）。
  p3GravityScale: 0.55,
  // 黑洞潮汐牽引上限（恆低於玩家全速 220，交叉不變式 16）。
  crushPullPxPerSec: 150,
} as const;

// P2 生存段波次表（survivalPhase，主計畫 §6.3 兩案共用結構）：40s 定點轟炸——
// pillar 晶柱崩落（落點預警）、shard 星屑空投（彩蛋收集 ×5）、overheat 炮擊過熱窗
//（核心下沉 3.0s＝唯一輸出窗 ×3）；隕星波由呈現層沿 meteor 管線連續投放不入表。
export interface SurvivalWave {
  atMs: number;
  kind: 'pillar' | 'shard' | 'overheat';
}

export const VOIDRA_SURVIVAL = {
  durationMs: 40_000,
  overheatWindowMs: 3000,
  collectibles: 5,
  outputWindows: 3,
  waves: [
    { atMs: 1500, kind: 'pillar' },
    { atMs: 3500, kind: 'shard' },
    { atMs: 5500, kind: 'pillar' },
    { atMs: 7500, kind: 'shard' },
    { atMs: 9000, kind: 'overheat' },
    { atMs: 13_500, kind: 'pillar' },
    { atMs: 15_500, kind: 'shard' },
    { atMs: 18_000, kind: 'pillar' },
    { atMs: 20_000, kind: 'overheat' },
    { atMs: 24_500, kind: 'shard' },
    { atMs: 26_500, kind: 'pillar' },
    { atMs: 29_000, kind: 'pillar' },
    { atMs: 31_000, kind: 'shard' },
    { atMs: 33_000, kind: 'overheat' },
    { atMs: 37_500, kind: 'pillar' },
  ] as readonly SurvivalWave[],
} as const;

// Voidra EX 專屬差分（§82）：P2 轟炸密度 +25%（呈現層 meteor 間隔 ÷1.25）、
// P3 螺旋三層；HP 沿 EX_MODS 共用 ×1.5（兩魔王既成慣例，主計畫 §12-v1.2）。
export const EX_VOIDRA = {
  bombardmentDensityMul: 1.25,
  barrageSpiralLayers: 3,
} as const;

export type VoidraAction = 'idle' | 'pull' | 'ring' | 'claw' | 'survival' | 'barrage' | 'crush';

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/voidra.ts 承擔。
export type VoidraCommand =
  | { kind: 'idle' }
  | { kind: 'pull'; durationMs: number }
  | { kind: 'ring'; count: number }
  | { kind: 'claw' }
  | { kind: 'wave'; wave: 'pillar' | 'shard' }
  | { kind: 'overheat'; windowMs: number }
  // 40s 波次表播完的時間驅動轉換（隨令入 P3）：呈現層據此收核心/注低重力/發 phase。
  | { kind: 'survivalEnd' }
  | { kind: 'barrage'; radial: number; spiralLayers: number }
  | { kind: 'crush'; durationMs: number };

export type VoidraHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' };

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: 1,
  p3: VOIDRA.enrageSpeedMultiplier,
};

// 三階段招式循環（§82）：P1 牽引/彈環/爪擊；P2 波次表驅動（無循環）；P3 彈幕/潮汐。
export function voidraAttackCycle(phase: BossPhase): readonly VoidraAction[] {
  switch (phase) {
    case 'p1':
      return ['pull', 'ring', 'claw'];
    case 'p2':
      return ['survival'];
    case 'p3':
      return ['barrage', 'crush'];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

export interface VoidraFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: VoidraAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  // P2 生存段觀測：進度時鐘與過熱窗狀態（呈現層/測試/e2e 共用單一真值）。
  readonly survivalMs: number;
  readonly overheatActive: boolean;
  readonly shardsCollected: number;
  tick(deltaMs: number): VoidraCommand | null;
  takeDamage(amount: number): VoidraHitEvent[];
  // 星屑收集（§83 星核共鳴單一真值）：滿 5 枚回 complete（僅回報一次）。
  collectShard(): { collected: number; complete: boolean };
  // 段起點重試（§82 anti-softlock）：P2/P3 死亡不回滾整場，重置至該段起點。
  resetToPhase(phase: 'p2' | 'p3'): void;
}

export interface VoidraFsmOptions {
  ex?: boolean;
}

export function createVoidraFsm(options: VoidraFsmOptions = {}): VoidraFsm {
  const ex = options.ex === true;
  const maxHp = Math.round(VOIDRA.maxHp * (ex ? EX_MODS.hpMul : 1));
  const spiralLayers = ex ? EX_VOIDRA.barrageSpiralLayers : VOIDRA.barrageSpiralLayers;

  let hp = maxHp;
  let phase: BossPhase = 'p1';
  let state: VoidraAction = 'idle';
  let lastAttack: VoidraAction | null = null;
  let cycleIndex = 0;
  let timerMs: number = VOIDRA.idleMs.p1;
  let damageSinceDrop = 0;
  let defeated = false;
  // P2 生存段狀態：時鐘/波次指標/過熱窗迄點/星屑計數。
  let survivalMs = 0;
  let waveIndex = 0;
  let overheatUntilMs = -1;
  let shards = 0;
  let shardsCompleteEmitted = false;

  const speedFactor = (): number => SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1);

  const durationMs = (action: VoidraAction): number => {
    switch (action) {
      // 僵直窗＝固定輸出窗（hit window 不隨狂暴縮，沿 Syrona 審查修復慣例）。
      case 'idle':
        return VOIDRA.idleMs[phase];
      case 'pull':
        return VOIDRA.pullDurationMs / speedFactor();
      case 'ring':
        return VOIDRA.ringDurationMs / speedFactor();
      case 'claw':
        return VOIDRA.clawDurationMs / speedFactor();
      case 'survival':
        return VOIDRA_SURVIVAL.durationMs;
      case 'barrage':
        return VOIDRA.barrageDurationMs / speedFactor();
      case 'crush':
        return VOIDRA.crushDurationMs / speedFactor();
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: VoidraAction): VoidraCommand => {
    switch (action) {
      case 'idle':
      case 'survival':
        return { kind: 'idle' };
      case 'pull':
        return { kind: 'pull', durationMs: VOIDRA.pullDurationMs / speedFactor() };
      case 'ring':
        return { kind: 'ring', count: VOIDRA.ringCount };
      case 'claw':
        return { kind: 'claw' };
      case 'barrage':
        return { kind: 'barrage', radial: VOIDRA.barrageRadialCount, spiralLayers };
      case 'crush':
        return { kind: 'crush', durationMs: VOIDRA.crushDurationMs / speedFactor() };
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const enterPhase = (next: BossPhase, events: VoidraHitEvent[]): void => {
    phase = next;
    lastAttack = null;
    cycleIndex = 0;
    if (next === 'p2') {
      state = 'survival';
      survivalMs = 0;
      waveIndex = 0;
      overheatUntilMs = -1;
      timerMs = Number.POSITIVE_INFINITY;
    } else {
      state = 'idle';
      timerMs = durationMs('idle');
    }
    events.push({ kind: 'phase', phase: next });
  };

  // P2 免傷帶（§82 唯一輸出窗）：過熱窗外核心升頂不可及，任何傷害忽略。
  const survivalImmune = (): boolean =>
    phase === 'p2' && !(survivalMs >= 0 && survivalMs < overheatUntilMs);

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
    get survivalMs() {
      return survivalMs;
    },
    get overheatActive() {
      return phase === 'p2' && survivalMs < overheatUntilMs;
    },
    get shardsCollected() {
      return shards;
    },
    tick(deltaMs: number): VoidraCommand | null {
      if (defeated) return null;
      // P2 生存段：波次表驅動——依時序逐一發波；40s 播完時間驅動入 P3。
      if (phase === 'p2') {
        survivalMs += deltaMs;
        const wave = VOIDRA_SURVIVAL.waves[waveIndex];
        if (wave && survivalMs >= wave.atMs) {
          waveIndex += 1;
          if (wave.kind === 'overheat') {
            overheatUntilMs = wave.atMs + VOIDRA_SURVIVAL.overheatWindowMs;
            return { kind: 'overheat', windowMs: VOIDRA_SURVIVAL.overheatWindowMs };
          }
          return { kind: 'wave', wave: wave.kind };
        }
        if (survivalMs >= VOIDRA_SURVIVAL.durationMs) {
          // 時間驅動轉換（§6.3 不設計時失敗）：波次表播完即入 P3，隨令帶出。
          enterPhase('p3', []);
          return { kind: 'survivalEnd' };
        }
        return null;
      }
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      if (state === 'idle') {
        const cycle = voidraAttackCycle(phase);
        const index = lastAttack === null ? 0 : (cycleIndex + 1) % cycle.length;
        state = cycle[index] ?? 'idle';
        cycleIndex = index;
        lastAttack = state;
      } else {
        state = 'idle';
      }
      // 保留溢出時間，維持節奏不漂移（同 bossFsm）。
      timerMs += durationMs(state);
      return commandOf(state);
    },
    takeDamage(amount: number): VoidraHitEvent[] {
      if (defeated || amount <= 0) return [];
      if (survivalImmune()) return [];
      const events: VoidraHitEvent[] = [];
      hp = Math.max(0, hp - amount);
      events.push({ kind: 'damaged', hp });
      if (hp <= 0) {
        defeated = true;
        events.push({ kind: 'defeated' });
        return events;
      }
      damageSinceDrop += amount;
      while (damageSinceDrop >= VOIDRA.minionSpawnHpStep) {
        damageSinceDrop -= VOIDRA.minionSpawnHpStep;
        events.push({ kind: 'minionDrop' });
      }
      // 階段轉換：跨雙閾值單次受擊依序帶出 phase 事件（p1→p2→p3 不跳段）。
      if (phase === 'p1' && hp <= maxHp * VOIDRA.p2HpRatio) enterPhase('p2', events);
      if (phase === 'p2' && hp <= maxHp * VOIDRA.p3HpRatio) enterPhase('p3', events);
      return events;
    },
    collectShard(): { collected: number; complete: boolean } {
      if (shards >= VOIDRA_SURVIVAL.collectibles) {
        return { collected: shards, complete: false };
      }
      shards += 1;
      const complete = shards === VOIDRA_SURVIVAL.collectibles && !shardsCompleteEmitted;
      if (complete) shardsCompleteEmitted = true;
      return { collected: shards, complete };
    },
    resetToPhase(target: 'p2' | 'p3'): void {
      if (defeated) return;
      const ratio = target === 'p2' ? VOIDRA.p2HpRatio : VOIDRA.p3HpRatio;
      hp = Math.round(maxHp * ratio);
      damageSinceDrop = 0;
      shards = 0;
      shardsCompleteEmitted = false;
      const events: VoidraHitEvent[] = [];
      enterPhase(target, events);
    },
  };
}
