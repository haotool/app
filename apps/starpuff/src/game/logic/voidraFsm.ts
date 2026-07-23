import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';
import { distanceBandOf, pickMove, type WeightedMove } from './moveTable';
import { STAR_SIPHON, shieldAfterAbsorb } from './starSiphon';

// 蝕星魔核 Voidra FSM 純邏輯（GAME_DESIGN §82/§113，不 import phaser），vitest 對象。
// 場控收束型三段（主計畫 §6.3 v12 定案：P2＝定點轟炸生存段）：
// P1 王座戰（重力牽引/星屑彈環/虛空爪擊/星光虹吸）→ P2 生存段（核心升頂不可及、
// 40s 波次表定點轟炸、3 次過熱窗＝唯一輸出窗、沿途空投 5 枚星屑）→ P3 核心決戰
//（全場低重力 0.55、蝕星彈幕/黑洞潮汐/星光虹吸、裂核大窗）。
// phase truth 全數收斂於此，禁止散落 scene。

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

export type VoidraAction =
  | 'idle'
  | 'pull'
  | 'ring'
  | 'claw'
  | 'siphon'
  | 'survival'
  | 'barrage'
  | 'crush';

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/voidra.ts 承擔。
export type VoidraCommand =
  | { kind: 'idle' }
  | { kind: 'pull'; durationMs: number }
  | { kind: 'ring'; count: number }
  | { kind: 'claw' }
  // 星光虹吸（§113）：紫色吸流窗開啟——窗內受擊＝逆流爆盾（takeDamage 路徑結算）。
  | { kind: 'siphon'; windowMs: number }
  // 吸流窗滿未被反制：呈現層嘗試抽彈匣頂槽並回餵 absorbSiphonStar。
  | { kind: 'siphonDrain' }
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
  | { kind: 'defeated' }
  // 星光虹吸反制（§113）：窗內受擊——護盾全清＋回傷取較大值＋取消本次抽取。
  | { kind: 'siphonBurst' }
  // 護盾層抵銷（§113）：非虹吸窗受擊被護盾吃掉，零傷、層數遞減。
  | { kind: 'shieldBlock'; remaining: number };

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: 1,
  p3: VOIDRA.enrageSpeedMultiplier,
};

// 加權選招表（§5 #813 W3）：P1/P3 固定循環改權重驅動（沿 §111.1 moveTable SSOT）；
// P2 生存段仍為波次表驅動（§82 不變，survival 單一入口僅供對表）。
export function voidraMoveTable(phase: BossPhase): readonly WeightedMove<VoidraAction>[] {
  switch (phase) {
    case 'p1':
      return [
        { action: 'pull', weight: 3 },
        { action: 'ring', weight: 3 },
        { action: 'claw', weight: 3 },
        { action: 'siphon', weight: 2 },
      ];
    case 'p2':
      return [{ action: 'survival', weight: 1 }];
    case 'p3':
      return [
        { action: 'barrage', weight: 3 },
        { action: 'crush', weight: 3 },
        { action: 'siphon', weight: 2 },
      ];
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
  // 星光虹吸護盾層（§113 單一真值）：呈現層據此畫護盾環。
  readonly shieldLayers: number;
  tick(deltaMs: number): VoidraCommand | null;
  takeDamage(amount: number): VoidraHitEvent[];
  // 星屑收集（§83 星核共鳴單一真值）：滿 5 枚回 complete（僅回報一次）。
  collectShard(): { collected: number; complete: boolean };
  // 星光虹吸抽取回餵（§113）：呈現層 siphonDrain 抽彈匣頂槽成功後呼叫；夾限至上限。
  absorbSiphonStar(): { shields: number; absorbed: boolean };
  // 段起點重試（§82 anti-softlock）：P2/P3 死亡不回滾整場，重置至該段起點。
  resetToPhase(phase: 'p2' | 'p3'): void;
  // 距離帶餵送（§5 條件欄）：呈現層逐幀回報與玩家距離；未餵送視為 far。
  setTargetDistance(distancePx: number | null): void;
}

export interface VoidraFsmOptions {
  ex?: boolean;
  // 加權選招亂數注入（§5：同 seed 可重放；缺省 Math.random）。
  rng?: () => number;
}

export function createVoidraFsm(options: VoidraFsmOptions = {}): VoidraFsm {
  const ex = options.ex === true;
  const rng = options.rng ?? Math.random;
  const maxHp = Math.round(VOIDRA.maxHp * (ex ? EX_MODS.hpMul : 1));
  const spiralLayers = ex ? EX_VOIDRA.barrageSpiralLayers : VOIDRA.barrageSpiralLayers;

  let hp = maxHp;
  let phase: BossPhase = 'p1';
  let state: VoidraAction = 'idle';
  // 近兩次出招（§5 連續同招上限 2）。
  let recentAttacks: VoidraAction[] = [];
  let distancePx: number | null = null;
  // 星光虹吸護盾層（§113）：僅由 absorbSiphonStar 增、受擊抵銷/爆盾遞減。
  let shieldLayers = 0;
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
      // 吸流窗＝telegraph（§113 可讀性紅線）：固定不隨狂暴速率縮放。
      case 'siphon':
        return STAR_SIPHON.windowMs;
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
      case 'siphon':
        return { kind: 'siphon', windowMs: STAR_SIPHON.windowMs };
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
    // 換階段清空同招記錄（§5 W2 慣例）。
    recentAttacks = [];
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
    get shieldLayers() {
      return shieldLayers;
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
        // 加權選招（§5 W3）：權重＋條件（HP 帶/距離帶）＋連續同招上限 2。
        state = pickMove(
          voidraMoveTable(phase),
          { hpRatio: hp / maxHp, distanceBand: distanceBandOf(distancePx) },
          recentAttacks,
          rng,
        );
        recentAttacks = [...recentAttacks.slice(-1), state];
        // 保留溢出時間，維持節奏不漂移（同 bossFsm）。
        timerMs += durationMs(state);
        return commandOf(state);
      }
      const finished = state;
      state = 'idle';
      timerMs += durationMs('idle');
      // 吸流窗滿未被反制（§113）：發 siphonDrain——呈現層抽頂槽並回餵 absorbSiphonStar。
      if (finished === 'siphon') return { kind: 'siphonDrain' };
      return commandOf('idle');
    },
    takeDamage(amount: number): VoidraHitEvent[] {
      if (defeated || amount <= 0) return [];
      if (survivalImmune()) return [];
      const events: VoidraHitEvent[] = [];
      let incoming = amount;
      if (state === 'siphon') {
        // 逆流爆盾（§113 反制）：護盾全清＋取消本次抽取＋回傷取較大值（不懲罰重彈）。
        shieldLayers = 0;
        state = 'idle';
        timerMs = durationMs('idle');
        incoming = Math.max(amount, STAR_SIPHON.backfireDamage);
        events.push({ kind: 'siphonBurst' });
      } else if (shieldLayers > 0) {
        // 護盾層抵銷（§113）：零傷、層數遞減；不掉補給（無實傷）。
        shieldLayers -= 1;
        return [{ kind: 'shieldBlock', remaining: shieldLayers }];
      }
      hp = Math.max(0, hp - incoming);
      events.push({ kind: 'damaged', hp });
      if (hp <= 0) {
        defeated = true;
        events.push({ kind: 'defeated' });
        return events;
      }
      damageSinceDrop += incoming;
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
    absorbSiphonStar(): { shields: number; absorbed: boolean } {
      if (defeated) return { shields: shieldLayers, absorbed: false };
      const next = shieldAfterAbsorb(shieldLayers);
      const absorbed = next > shieldLayers;
      shieldLayers = next;
      return { shields: shieldLayers, absorbed };
    },
    resetToPhase(target: 'p2' | 'p3'): void {
      if (defeated) return;
      const ratio = target === 'p2' ? VOIDRA.p2HpRatio : VOIDRA.p3HpRatio;
      hp = Math.round(maxHp * ratio);
      damageSinceDrop = 0;
      shards = 0;
      shardsCompleteEmitted = false;
      // 段起點重試清空護盾層（§113，比照整場重啟語義）。
      shieldLayers = 0;
      const events: VoidraHitEvent[] = [];
      enterPhase(target, events);
    },
    setTargetDistance(next: number | null): void {
      distancePx = next;
    },
  };
}
