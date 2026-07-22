import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';

// 稜晶雙子 Prismix FSM 純邏輯（GAME_DESIGN §68，不 import phaser），vitest 對象。
// 分裂型三段：P1 單體 → P2 鏡像雙子（獨立血條各半，單份指令左右鏡像執行）→
// P3 裂核合體；掙扎窗內相繼擊破兩具＝雙子連破（跳過 P3，觸發 twin-finish 彩蛋）。
// phase truth 全數收斂於此，禁止散落 scene（沿 bossFsm/noctraFsm 表驅動慣例）。

export const PRISMIX = {
  // 魔王 HP 階梯（主計畫 §3.2）：Jellord 60 → Noctra 52 → Prismix 80。
  maxHp: 80,
  bodyDamage: 1,
  // P1→P2 分裂閾值：總血 ≤66%（EX 提前至 75%）。
  splitHpRatio: 0.66,
  // 殘核掙扎窗：單具擊破後另一具僵直可傷；窗內補殺＝雙子連破。
  struggleMs: 1000,
  // 狂暴節奏：P2/P3 沿 Noctra 根修後的可讀帶。
  enrageSpeedMultiplier: 1.15,
  // 補給節奏（§26 飢荒保證律）：每損 10 HP 掉補給小怪。
  minionSpawnHpStep: 10,
  // P2 召喚 mirri 上限（場上同時存活數，超額由呈現層夾限）。
  summonCap: 2,
  pillarCount: 3,
  radialCount: 8,
  rainCount: 3,
  // P3 環繞碎晶盾（可擊破，EX 6）。
  shardOrbitCount: 4,
  idleMs: 1500,
  pillarDurationMs: 1500,
  beamDurationMs: 1800,
  pincerDurationMs: 1700,
  crossbeamDurationMs: 1600,
  summonDurationMs: 900,
  barrageDurationMs: 1500,
  rainDurationMs: 1500,
  // telegraph 時長（呈現層讀取；不隨速率縮放，沿 Noctra 慣例）。
  // #810：地面尖刺前搖 600→950ms——500ms 反應玩家迴避率 0%→達標（掃參定值，
  // 下限 SSOT＝difficulty.AUDIT_THRESHOLDS.spikeTelegraphMinMs）。
  pillarTelegraphMs: 950,
  beamTelegraphMs: 500,
  // #809：雙生夾擊為衝撞型前搖，對齊 ≥600ms 可讀性紅線（550→600）。
  pincerTelegraphMs: 600,
  rainTelegraphMs: 600,
} as const;

// Prismix EX 專屬差分（§68）：分裂提前、掙扎窗收短、碎晶盾加密；
// 雙子動作去同步（相位錯半拍）為呈現層差分，HP/節奏沿 EX_MODS 共用係數。
export const EX_PRISMIX = {
  splitHpRatio: 0.75,
  struggleMs: 700,
  shardOrbitCount: 6,
  desyncMs: 260,
} as const;

export type PrismixAction =
  | 'idle'
  | 'pillar'
  | 'beam'
  | 'pincer'
  | 'crossbeam'
  | 'summon'
  | 'struggle'
  | 'barrage'
  | 'rain';

export type PrismixSide = 'a' | 'b';

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/prismix.ts 承擔；
// merge 為時間驅動轉換（掙扎窗期滿合體入 P3），隨指令帶出裂核血量與碎晶盾數。
export type PrismixCommand =
  | { kind: 'idle' }
  | { kind: 'pillar'; count: number }
  | { kind: 'beam' }
  | { kind: 'pincer' }
  | { kind: 'crossbeam' }
  | { kind: 'summon'; cap: number }
  | { kind: 'barrage'; count: number }
  | { kind: 'rain'; count: number }
  | { kind: 'merge'; coreHp: number; shards: number };

// takeDamage 輸出的傷害驅動事件：split（P1→P2 分裂）、struggle（單具擊破入掙扎窗）、
// twinFinish（窗內補殺雙子連破，跳過 P3）。
export type PrismixHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'split'; hpA: number; hpB: number }
  | { kind: 'struggle'; survivor: PrismixSide; windowMs: number }
  | { kind: 'twinFinish' }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' };

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: PRISMIX.enrageSpeedMultiplier,
  p3: PRISMIX.enrageSpeedMultiplier,
};

// 三階段招式循環（§68）：P1 晶柱／折射光束；P2 雙生夾擊／交錯光束／召喚；
// P3 全域折射彈幕／晶雨。
export function prismixAttackCycle(phase: BossPhase): readonly PrismixAction[] {
  switch (phase) {
    case 'p1':
      return ['pillar', 'beam'];
    case 'p2':
      return ['pincer', 'crossbeam', 'summon'];
    case 'p3':
      return ['barrage', 'rain'];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

export interface PrismixFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: PrismixAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  // P2 雙子獨立血條（§68）：非 P2 回 null；呈現層據此發 BOSS_TWIN_HP。
  readonly twins: { a: number; b: number } | null;
  tick(deltaMs: number): PrismixCommand | null;
  // P2 必須指定受擊側；P1/P3 忽略 side。
  takeDamage(amount: number, side?: PrismixSide): PrismixHitEvent[];
  // 雷化鏈電中斷召喚（§58 慣例）：僅召喚態可中斷，成功回 true。
  interruptSummon(): boolean;
}

export interface PrismixFsmOptions {
  ex?: boolean;
}

export function createPrismixFsm(options: PrismixFsmOptions = {}): PrismixFsm {
  const ex = options.ex === true;
  const maxHp = Math.round(PRISMIX.maxHp * (ex ? EX_MODS.hpMul : 1));
  const splitRatio = ex ? EX_PRISMIX.splitHpRatio : PRISMIX.splitHpRatio;
  const struggleMs = ex ? EX_PRISMIX.struggleMs : PRISMIX.struggleMs;
  const shards = ex ? EX_PRISMIX.shardOrbitCount : PRISMIX.shardOrbitCount;

  let phase: BossPhase = 'p1';
  let state: PrismixAction = 'idle';
  let lastAttack: PrismixAction | null = null;
  let cycleIndex = 0;
  let timerMs: number = PRISMIX.idleMs;
  let damageSinceDrop = 0;
  let defeated = false;
  // P1/P3 單血池；P2 期以 hpA/hpB 為真值（hp 僅供合計）。
  let hp: number = maxHp;
  let hpA = 0;
  let hpB = 0;
  let survivor: PrismixSide = 'a';

  const totalHp = (): number => (phase === 'p2' ? hpA + hpB : hp);
  const speedFactor = (): number => SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1);

  const durationMs = (action: PrismixAction): number => {
    switch (action) {
      case 'idle':
        return PRISMIX.idleMs / speedFactor();
      case 'pillar':
        return PRISMIX.pillarDurationMs / speedFactor();
      case 'beam':
        return PRISMIX.beamDurationMs / speedFactor();
      case 'pincer':
        return PRISMIX.pincerDurationMs / speedFactor();
      case 'crossbeam':
        return PRISMIX.crossbeamDurationMs / speedFactor();
      case 'summon':
        return PRISMIX.summonDurationMs / speedFactor();
      case 'barrage':
        return PRISMIX.barrageDurationMs / speedFactor();
      case 'rain':
        return PRISMIX.rainDurationMs / speedFactor();
      // 掙扎窗為固定時長（不隨速率縮放：窗長即彩蛋判定窗）。
      case 'struggle':
        return struggleMs;
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: PrismixAction): PrismixCommand => {
    switch (action) {
      case 'idle':
      case 'struggle':
        return { kind: 'idle' };
      case 'pillar':
        return { kind: 'pillar', count: PRISMIX.pillarCount };
      case 'beam':
        return { kind: 'beam' };
      case 'pincer':
        return { kind: 'pincer' };
      case 'crossbeam':
        return { kind: 'crossbeam' };
      case 'summon':
        return { kind: 'summon', cap: PRISMIX.summonCap };
      case 'barrage':
        return { kind: 'barrage', count: PRISMIX.radialCount };
      case 'rain':
        return { kind: 'rain', count: PRISMIX.rainCount };
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  // 供彈保證律（§26）：跨階段累計每 10 傷掉補給。
  const accrueDrops = (amount: number, events: PrismixHitEvent[]): void => {
    damageSinceDrop += amount;
    while (damageSinceDrop >= PRISMIX.minionSpawnHpStep) {
      damageSinceDrop -= PRISMIX.minionSpawnHpStep;
      events.push({ kind: 'minionDrop' });
    }
  };

  return {
    get hp() {
      return totalHp();
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
    get twins() {
      return phase === 'p2' ? { a: hpA, b: hpB } : null;
    },
    tick(deltaMs: number): PrismixCommand | null {
      if (defeated) return null;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      // 掙扎窗期滿：存活具吸收殘核合體入 P3（時間驅動轉換，隨指令帶出裂核血量）。
      if (state === 'struggle') {
        phase = 'p3';
        hp = survivor === 'a' ? hpA : hpB;
        hpA = 0;
        hpB = 0;
        state = 'idle';
        lastAttack = null;
        cycleIndex = 0;
        timerMs = durationMs('idle');
        return { kind: 'merge', coreHp: hp, shards };
      }
      if (state === 'idle') {
        const cycle = prismixAttackCycle(phase);
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
    takeDamage(amount: number, side: PrismixSide = 'a'): PrismixHitEvent[] {
      if (defeated || amount <= 0) return [];
      const events: PrismixHitEvent[] = [];
      if (phase === 'p2') {
        // 掙扎窗內僅存活具可傷；平時對已死側傷害忽略（呈現層防呆）。
        const target: PrismixSide = state === 'struggle' ? survivor : side;
        if (target === 'a' && hpA <= 0) return [];
        if (target === 'b' && hpB <= 0) return [];
        if (target === 'a') hpA = Math.max(0, hpA - amount);
        else hpB = Math.max(0, hpB - amount);
        events.push({ kind: 'damaged', hp: totalHp() });
        accrueDrops(amount, events);
        if (state === 'struggle' && (survivor === 'a' ? hpA : hpB) <= 0) {
          // 雙子連破（§68 彩蛋）：掙扎窗內相繼擊破兩具，總血歸零直接擊破跳過 P3。
          defeated = true;
          events.push({ kind: 'twinFinish' }, { kind: 'defeated' });
          return events;
        }
        if (state !== 'struggle' && (hpA <= 0 || hpB <= 0)) {
          survivor = hpA <= 0 ? 'b' : 'a';
          state = 'struggle';
          timerMs = struggleMs;
          events.push({ kind: 'struggle', survivor, windowMs: struggleMs });
        }
        return events;
      }
      hp = Math.max(0, hp - amount);
      events.push({ kind: 'damaged', hp });
      if (hp <= 0) {
        defeated = true;
        events.push({ kind: 'defeated' });
        return events;
      }
      accrueDrops(amount, events);
      // P1→P2 分裂（§68）：總血跌破閾值即均分為雙獨立血條（餘數歸 A）。
      if (phase === 'p1' && hp <= maxHp * splitRatio) {
        phase = 'p2';
        hpA = Math.ceil(hp / 2);
        hpB = hp - hpA;
        hp = 0;
        state = 'idle';
        lastAttack = null;
        cycleIndex = 0;
        timerMs = durationMs('idle');
        events.push({ kind: 'phase', phase: 'p2' }, { kind: 'split', hpA, hpB });
      }
      return events;
    },
    interruptSummon(): boolean {
      if (defeated || state !== 'summon') return false;
      state = 'idle';
      timerMs = durationMs('idle');
      return true;
    },
  };
}
