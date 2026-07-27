import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';
import { distanceBandOf, pickMove, type WeightedMove } from './moveTable';

// 關稅巨獸 Tariffang FSM 純邏輯（GAME_DESIGN §122，不 import phaser），vitest 對象。
// 地面關卡官三段（星港海關主題）：P1 貨物稽查（貨櫃滑入＋關稅槌）→ P2 加收費用
//（命中魔王即生追蹤稅票；吸入清票／焰化燒票）→ P3 全面封關（雙側閘門＋高速衝撞）。
// phase truth 全數收斂於此，禁止散落 scene（沿 syronaFsm 慣例）。

export const TARIFFANG = {
  // 魔王 HP 階梯（終局章接續 §82 峰值 110 遞增）：Voidra 110 → Tariffang 112。
  maxHp: 112,
  bodyDamage: 1,
  // 階段轉換閾值：P2 ≤66%、P3 ≤33%。
  p2HpRatio: 0.66,
  p3HpRatio: 0.33,
  enrageSpeedMultiplier: 1.15,
  // 補給節奏（§26 飢荒保證律）：每損 10 HP 掉補給小怪。
  minionSpawnHpStep: 10,
  // 招式時長（僵直窗獨立為 idleMs＝固定輸出窗）。
  cargoDurationMs: 2600,
  stampDurationMs: 1600,
  levyDurationMs: 1400,
  gateDurationMs: 3400,
  ramDurationMs: 2000,
  // p4 為 EX 專屬型態鍵位（#814 基建）：Tariffang 無 P4，執行期不可達、沿 p3 值。
  idleMs: { p1: 2200, p2: 1800, p3: 1800, p4: 1800 },
  // telegraph 時長（呈現層讀取；固定不隨狂暴縮放，≥600ms 可讀性紅線）。
  cargoTelegraphMs: 800,
  stampTelegraphMs: 700,
  levyTelegraphMs: 600,
  gateTelegraphMs: 900,
  ramTelegraphMs: 700,
  // 貨櫃稽查：P1 單側 ×1、P2 起 ×2（左右錯拍）。
  cargoCountP1: 1,
  cargoCountP2: 2,
  // 關稅槌落點數。
  stampCount: 3,
  // 稅票：主動查帳 ×3；場上稅票上限（含 P2 被動加收）；壽命逾時必回收（§56）。
  levyTicketCount: 3,
  ticketCap: 4,
  ticketLifeMs: 6000,
  // P2 被動加收（本王主題）：星彈命中即生成追蹤稅票，節流防連射刷屏。
  reactiveTicketCooldownMs: 900,
  // 閘門封關：降下後駐留時長；中央走廊恆開（anti-softlock）。
  gateHoldMs: 1800,
  // 頭頂 hit window（§58 慣例）：下砸命中頭頂觸發短暈（攻擊循環停拍）。
  slamStunMs: 800,
} as const;

// Tariffang EX 專屬差分（§58 EX 慣例：HP/節奏走 EX_MODS 共用倍率）：
// 質性差分＝貨櫃雙向同時滑入（一般恆單側錯拍可背板）＋稅票上限 +2。
export const EX_TARIFFANG = {
  cargoBothSides: true,
  ticketCap: 6,
} as const;

export type TariffangAction = 'idle' | 'cargo' | 'stamp' | 'levy' | 'gate' | 'ram';

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/tariffang.ts 承擔。
export type TariffangCommand =
  | { kind: 'idle' }
  | { kind: 'cargo'; count: number; bothSides: boolean }
  | { kind: 'stamp'; count: number }
  | { kind: 'levy'; count: number }
  | { kind: 'gate'; holdMs: number }
  | { kind: 'ram' };

export type TariffangHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' };

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: TARIFFANG.enrageSpeedMultiplier,
  p3: TARIFFANG.enrageSpeedMultiplier,
  p4: TARIFFANG.enrageSpeedMultiplier,
};

// 加權選招表（§111.1 moveTable SSOT）：P1 稽查/關稅槌；P2 加入主動查帳；
// P3 封關＋衝撞（衝撞限遠距帶——貼身衝撞不可讀，沿 Jellord dash 遠距帶理據）。
export function tariffangMoveTable(phase: BossPhase): readonly WeightedMove<TariffangAction>[] {
  switch (phase) {
    case 'p1':
      return [
        { action: 'cargo', weight: 3 },
        { action: 'stamp', weight: 3 },
      ];
    case 'p2':
      return [
        { action: 'cargo', weight: 3 },
        { action: 'stamp', weight: 2 },
        { action: 'levy', weight: 3 },
      ];
    // p4 執行期不可達（無 EX P4 型態）：沿 p3 招池補鍵位。
    case 'p3':
    case 'p4':
      return [
        { action: 'gate', weight: 3 },
        { action: 'ram', weight: 3, condition: { band: 'far' } },
        { action: 'levy', weight: 2 },
      ];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

export interface TariffangFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: TariffangAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  readonly ticketCap: number;
  tick(deltaMs: number): TariffangCommand | null;
  takeDamage(amount: number): TariffangHitEvent[];
  // P2 被動加收（主題機制）：星彈命中時呼叫——P2 期且冷卻期滿回 true（該生一張稅票）。
  // 場上稅票上限由呈現層以 ticketCap 夾限（存活數為呈現層事實）。
  tryTax(): boolean;
  // 頭頂命中短暈（§58）：回待機並停拍 durationMs，期滿接續攻擊循環；衝撞中不可暈。
  stun(durationMs: number): boolean;
  // 距離帶餵送（§111.1 條件欄）：呈現層逐幀回報與玩家距離；未餵送視為 far。
  setTargetDistance(distancePx: number | null): void;
}

export interface TariffangFsmOptions {
  ex?: boolean;
  // 亂數注入（加權選招；同 seed 可重放；缺省 Math.random）。
  rng?: () => number;
}

export function createTariffangFsm(options: TariffangFsmOptions = {}): TariffangFsm {
  const ex = options.ex === true;
  const rng = options.rng ?? Math.random;
  const maxHp = Math.round(TARIFFANG.maxHp * (ex ? EX_MODS.hpMul : 1));
  const ticketCap = ex ? EX_TARIFFANG.ticketCap : TARIFFANG.ticketCap;

  let hp = maxHp;
  let phase: BossPhase = 'p1';
  let state: TariffangAction = 'idle';
  let recentAttacks: TariffangAction[] = [];
  let distancePx: number | null = null;
  let timerMs: number = TARIFFANG.idleMs.p1;
  let damageSinceDrop = 0;
  // 被動加收冷卻（FSM 內部時鐘）：tick 累加、命中時查詢。
  let clockMs = 0;
  let lastTaxAtMs = Number.NEGATIVE_INFINITY;
  let defeated = false;

  const speedFactor = (): number => SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1);

  const durationMs = (action: TariffangAction): number => {
    switch (action) {
      // 僵直窗＝固定輸出窗：不隨狂暴縮短（§74 hit window 慣例）。
      case 'idle':
        return TARIFFANG.idleMs[phase];
      case 'cargo':
        return TARIFFANG.cargoDurationMs / speedFactor();
      case 'stamp':
        return TARIFFANG.stampDurationMs / speedFactor();
      case 'levy':
        return TARIFFANG.levyDurationMs / speedFactor();
      case 'gate':
        return TARIFFANG.gateDurationMs / speedFactor();
      case 'ram':
        return TARIFFANG.ramDurationMs / speedFactor();
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: TariffangAction): TariffangCommand => {
    switch (action) {
      case 'idle':
        return { kind: 'idle' };
      case 'cargo':
        return {
          kind: 'cargo',
          count: phase === 'p1' ? TARIFFANG.cargoCountP1 : TARIFFANG.cargoCountP2,
          bothSides: ex && EX_TARIFFANG.cargoBothSides,
        };
      case 'stamp':
        return { kind: 'stamp', count: TARIFFANG.stampCount };
      case 'levy':
        return { kind: 'levy', count: TARIFFANG.levyTicketCount };
      case 'gate':
        return { kind: 'gate', holdMs: TARIFFANG.gateHoldMs };
      case 'ram':
        return { kind: 'ram' };
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const enterPhase = (next: BossPhase, events: TariffangHitEvent[]): void => {
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
    get ticketCap() {
      return ticketCap;
    },
    tick(deltaMs: number): TariffangCommand | null {
      if (defeated) return null;
      clockMs += deltaMs;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      if (state === 'idle') {
        state = pickMove(
          tariffangMoveTable(phase),
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
    takeDamage(amount: number): TariffangHitEvent[] {
      if (defeated || amount <= 0) return [];
      const events: TariffangHitEvent[] = [];
      hp = Math.max(0, hp - amount);
      events.push({ kind: 'damaged', hp });
      if (hp <= 0) {
        defeated = true;
        events.push({ kind: 'defeated' });
        return events;
      }
      damageSinceDrop += amount;
      while (damageSinceDrop >= TARIFFANG.minionSpawnHpStep) {
        damageSinceDrop -= TARIFFANG.minionSpawnHpStep;
        events.push({ kind: 'minionDrop' });
      }
      // 階段轉換：跨多閾值單次受擊依序帶出 phase 事件（p1→p2→p3 不跳段）。
      if (phase === 'p1' && hp <= maxHp * TARIFFANG.p2HpRatio) enterPhase('p2', events);
      if (phase === 'p2' && hp <= maxHp * TARIFFANG.p3HpRatio) enterPhase('p3', events);
      return events;
    },
    tryTax(): boolean {
      if (defeated || phase !== 'p2') return false;
      if (clockMs - lastTaxAtMs < TARIFFANG.reactiveTicketCooldownMs) return false;
      lastTaxAtMs = clockMs;
      return true;
    },
    stun(durationMs: number): boolean {
      // 衝撞中不可暈（高速位移期強行停拍會凍在半途）；其餘態回待機停拍。
      if (defeated || state === 'ram') return false;
      state = 'idle';
      timerMs = durationMs;
      return true;
    },
    setTargetDistance(next: number | null): void {
      distancePx = next;
    },
  };
}
