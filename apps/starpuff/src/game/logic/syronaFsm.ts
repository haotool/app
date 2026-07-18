import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';

// 熔糖窯后 Syrona FSM 純邏輯（GAME_DESIGN §74，不 import phaser），vitest 對象。
// 場控型三段：本體半定點（中後方王窯座），威脅來自地形改寫（潮汐/噴泉/滴落）——
// 考驗空間規劃而非追打。phase truth 全數收斂於此，禁止散落 scene（沿 prismixFsm 慣例）。

export const SYRONA = {
  // 魔王 HP 階梯（主計畫 §3.2）：Jellord 60 → Noctra 52 → Prismix 80 → Syrona 90。
  maxHp: 90,
  bodyDamage: 1,
  // 階段轉換閾值：P2 ≤66%、P3 ≤33%。
  p2HpRatio: 0.66,
  p3HpRatio: 0.33,
  enrageSpeedMultiplier: 1.15,
  // 補給節奏（§26 飢荒保證律）：每損 10 HP 掉補給小怪。
  minionSpawnHpStep: 10,
  // P2 召喚 Bubbla 上限（場上同時存活數，超額由呈現層夾限）。
  summonCap: 2,
  // 噴泉：P1 ×3 順序噴發、P2 加密 ×4；EX 每循環洗牌出序。
  fountainCount: 3,
  fountainDenseCount: 4,
  lobCount: 3,
  dripCount: 4,
  // 招式時長（僵直窗獨立為 idleMs：散熱/吟唱/波後即 hit window）。
  fountainDurationMs: 2400,
  lobDurationMs: 1500,
  dripDurationMs: 1800,
  summonDurationMs: 900,
  waveDurationMs: 2000,
  overloadDurationMs: 2600,
  // 階段僵直窗（§74 hit window）：P1 散熱 2.5s、P2 吟唱 2.0s、P3 波後 2.0s。
  idleMs: { p1: 2500, p2: 2000, p3: 2000 },
  // telegraph 時長（呈現層讀取；不隨速率縮放，沿 Noctra 慣例）。
  fountainTelegraphMs: 800,
  lobTelegraphMs: 500,
  dripTelegraphMs: 700,
  waveTelegraphMs: 900,
  // arena 潮汐參數（P2 入場；P3 大沸騰）：沿 L14 潮汐管線。
  tideMaxY: 352,
  tidePeriodMs: 9000,
  tideDutyPct: 0.45,
  // 大沸騰（P3）：週期 -30%、漲頂再升 24px（y -24）。
  boilPeriodMul: 0.7,
  boilMaxYDeltaPx: -24,
  // arena 三浮台（§74 保底位）：低台 ×2 常規保底、高台 ×1 沸騰期保底（詳 levels/呈現層）。
  arenaPlatformYs: [336, 304, 336],
  // 噴口超載（P3 overload）：升托開放垂直路線，乘風打皇冠弱點 ×2 傷。
  crownDamageMul: 2,
} as const;

// Syrona EX 專屬差分（§74）：潮汐週期再 -25%、噴泉 ×5、Bubbla 上限 3、滴落點 6；
// 質性差分＝噴泉順序隨機化（每循環洗牌出序，逼讀 telegraph 取代背板）。
export const EX_SYRONA = {
  fountainCount: 5,
  summonCap: 3,
  dripCount: 6,
  boilPeriodMul: SYRONA.boilPeriodMul * 0.75,
  shuffleFountain: true,
} as const;

export type SyronaAction = 'idle' | 'fountain' | 'lob' | 'drip' | 'summon' | 'wave' | 'overload';

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/syrona.ts 承擔。
// fountain.order 為噴發點出序（一般固定升序、EX 洗牌）；overload 帶超載時長供乘托窗。
export type SyronaCommand =
  | { kind: 'idle' }
  | { kind: 'fountain'; order: readonly number[] }
  | { kind: 'lob'; count: number }
  | { kind: 'drip'; count: number }
  | { kind: 'summon'; cap: number }
  | { kind: 'wave' }
  | { kind: 'overload'; durationMs: number };

export type SyronaHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' };

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: SYRONA.enrageSpeedMultiplier,
  p3: SYRONA.enrageSpeedMultiplier,
};

// 皇冠弱點帶判定（§74）：命中點高於本體頂緣下 34px 內＝皇冠 ×2 傷；純函式供 vitest
// 與呈現層 applyDamageAt 共用（審查修復：幾何決策自呈現層收斂）。
export const CROWN_BAND_PX = 34;

export function isCrownHit(hitY: number, bodyTopY: number): boolean {
  return hitY <= bodyTopY + CROWN_BAND_PX;
}

// 三階段招式循環（§74）：P1 噴泉/射彈；P2 滴落/召喚/加密噴泉；P3 糖漿波/噴口超載。
export function syronaAttackCycle(phase: BossPhase): readonly SyronaAction[] {
  switch (phase) {
    case 'p1':
      return ['fountain', 'lob'];
    case 'p2':
      return ['drip', 'summon', 'fountain'];
    case 'p3':
      return ['wave', 'overload'];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

export interface SyronaFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: SyronaAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  tick(deltaMs: number): SyronaCommand | null;
  takeDamage(amount: number): SyronaHitEvent[];
  // 雷化鏈電中斷召喚（§58 慣例）：僅召喚態可中斷，成功回 true。
  interruptSummon(): boolean;
}

export interface SyronaFsmOptions {
  ex?: boolean;
  // 噴泉洗牌亂數注入（EX 質性差分可測；缺省 Math.random）。
  rng?: () => number;
}

// Fisher-Yates 洗牌：rng 注入保證可重現。
function shuffled(count: number, rng: () => number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = order[i] ?? i;
    order[i] = order[j] ?? j;
    order[j] = a;
  }
  return order;
}

export function createSyronaFsm(options: SyronaFsmOptions = {}): SyronaFsm {
  const ex = options.ex === true;
  const rng = options.rng ?? Math.random;
  const maxHp = Math.round(SYRONA.maxHp * (ex ? EX_MODS.hpMul : 1));
  const summonCap = ex ? EX_SYRONA.summonCap : SYRONA.summonCap;
  const dripCount = ex ? EX_SYRONA.dripCount : SYRONA.dripCount;

  let hp = maxHp;
  let phase: BossPhase = 'p1';
  let state: SyronaAction = 'idle';
  let lastAttack: SyronaAction | null = null;
  let cycleIndex = 0;
  let timerMs: number = SYRONA.idleMs.p1;
  let damageSinceDrop = 0;
  let defeated = false;

  const speedFactor = (): number => SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1);

  const durationMs = (action: SyronaAction): number => {
    switch (action) {
      // 僵直窗＝固定輸出窗（§74 hit window ≥2s 不變式）：不隨狂暴縮短（審查修復）。
      case 'idle':
        return SYRONA.idleMs[phase];
      case 'fountain':
        return SYRONA.fountainDurationMs / speedFactor();
      case 'lob':
        return SYRONA.lobDurationMs / speedFactor();
      case 'drip':
        return SYRONA.dripDurationMs / speedFactor();
      case 'summon':
        return SYRONA.summonDurationMs / speedFactor();
      case 'wave':
        return SYRONA.waveDurationMs / speedFactor();
      case 'overload':
        return SYRONA.overloadDurationMs / speedFactor();
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  // 噴泉出序：P1 基礎 3 點、P2 加密 4 點（EX 一律 5 點且洗牌；一般固定升序可背板）。
  const fountainOrder = (): number[] => {
    const count = ex
      ? EX_SYRONA.fountainCount
      : phase === 'p1'
        ? SYRONA.fountainCount
        : SYRONA.fountainDenseCount;
    if (ex && EX_SYRONA.shuffleFountain) return shuffled(count, rng);
    return Array.from({ length: count }, (_, i) => i);
  };

  const commandOf = (action: SyronaAction): SyronaCommand => {
    switch (action) {
      case 'idle':
        return { kind: 'idle' };
      case 'fountain':
        return { kind: 'fountain', order: fountainOrder() };
      case 'lob':
        return { kind: 'lob', count: SYRONA.lobCount };
      case 'drip':
        return { kind: 'drip', count: dripCount };
      case 'summon':
        return { kind: 'summon', cap: summonCap };
      case 'wave':
        return { kind: 'wave' };
      case 'overload':
        return { kind: 'overload', durationMs: SYRONA.overloadDurationMs / speedFactor() };
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const enterPhase = (next: BossPhase, events: SyronaHitEvent[]): void => {
    phase = next;
    state = 'idle';
    lastAttack = null;
    cycleIndex = 0;
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
    tick(deltaMs: number): SyronaCommand | null {
      if (defeated) return null;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      if (state === 'idle') {
        const cycle = syronaAttackCycle(phase);
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
    takeDamage(amount: number): SyronaHitEvent[] {
      if (defeated || amount <= 0) return [];
      const events: SyronaHitEvent[] = [];
      hp = Math.max(0, hp - amount);
      events.push({ kind: 'damaged', hp });
      if (hp <= 0) {
        defeated = true;
        events.push({ kind: 'defeated' });
        return events;
      }
      damageSinceDrop += amount;
      while (damageSinceDrop >= SYRONA.minionSpawnHpStep) {
        damageSinceDrop -= SYRONA.minionSpawnHpStep;
        events.push({ kind: 'minionDrop' });
      }
      // 階段轉換：跨雙閾值單次受擊依序帶出 phase 事件（p1→p2→p3 不跳段）。
      if (phase === 'p1' && hp <= maxHp * SYRONA.p2HpRatio) enterPhase('p2', events);
      if (phase === 'p2' && hp <= maxHp * SYRONA.p3HpRatio) enterPhase('p3', events);
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
