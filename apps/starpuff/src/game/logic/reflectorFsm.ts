import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';
import { distanceBandOf, pickMove, type WeightedMove } from './moveTable';

// 鏡界館長 Reflector FSM 純邏輯（GAME_DESIGN §123，不 import phaser），vitest 對象。
// 懸浮鏡界型三段（鏡界資料塔主題）：P1 鏡面回彈（開鏡窗內玩家星彈被複製為沿固定
// 射線的反向星彈——傷害恆全額結算，回彈僅為額外反擊彈；窗滿接閃光弱點窗 ×2）→
// P2 假噗噗分身（玩家幻影模仿移動）→ P3 全景反射（三鏡板折射自身彈幕，近身輸出優勢）。
// anti-softlock 不變式：全階段無任何星彈免傷窗——基礎星彈恆可通關（回彈有節流/上限/
// 固定射線提前顯示，見 REFLECTOR 常數）。phase truth 全數收斂於此，禁止散落 scene。

export const REFLECTOR = {
  // 魔王 HP 階梯（終局章接續 §122 遞增）：Maridella 116 → Reflector 120。
  maxHp: 120,
  bodyDamage: 1,
  // 階段轉換閾值：P2 ≤66%、P3 ≤33%。
  p2HpRatio: 0.66,
  p3HpRatio: 0.33,
  enrageSpeedMultiplier: 1.15,
  // 補給節奏（§26 飢荒保證律）：每損 10 HP 掉補給小怪。
  minionSpawnHpStep: 10,
  // 招式時長（僵直窗獨立為 idleMs＝固定輸出窗）。
  beamDurationMs: 2000,
  shardDurationMs: 1600,
  mirrorDurationMs: 3200,
  cloneDurationMs: 1400,
  panoramaDurationMs: 3000,
  // p4 為 EX 專屬型態鍵位（#814 基建）：Reflector 無 P4，執行期不可達、沿 p3 值。
  idleMs: { p1: 2100, p2: 1800, p3: 1800, p4: 1800 },
  // telegraph 時長（呈現層讀取；固定不隨狂暴縮放，≥600ms 可讀性紅線）。
  beamTelegraphMs: 900,
  shardTelegraphMs: 700,
  // 開鏡前搖＝反射射線提前顯示（回彈方向固定沿此射線，讀線走位即反制）。
  mirrorTelegraphMs: 800,
  // 召喚類 telegraph 一併錨定（W2 540ms 漏網教訓）。
  cloneTelegraphMs: 700,
  panoramaTelegraphMs: 900,
  // 鏡面回彈（主題）：開鏡窗長；窗內星彈命中→沿固定射線生成回彈彈（節流＋場上上限，
  // 防高頻射擊刷屏）；窗滿接閃光弱點窗（受擊 ×2，「鏡面閃光時露弱點」）。
  mirrorWindowMs: 1600,
  flashWindowMs: 1200,
  reboundCooldownMs: 900,
  reboundCap: 3,
  flashDamageMul: 2,
  // 假噗噗分身：場上上限與壽命（沿 §112.3 鏡像殘影管線，1 發星彈即破）。
  cloneCap: 2,
  cloneLifeMs: 6000,
  // 全景反射（P3）：折射彈幕放射數（鏡板折返一次，遠場密度高＝近身輸出優勢）。
  panoramaShardCount: 6,
  // 頭頂 hit window（§58 慣例）：下砸命中頭頂觸發短暈。
  slamStunMs: 800,
} as const;

// Reflector EX 專屬差分（§58 EX 慣例：HP/節奏走 EX_MODS 共用倍率）：
// 質性差分＝開鏡窗雙射線交錯（一般恆單射線可背板）＋幻影上限 +1。
export const EX_REFLECTOR = {
  dualRay: true,
  cloneCap: 3,
} as const;

export type ReflectorAction = 'idle' | 'beam' | 'shard' | 'mirror' | 'clone' | 'panorama';

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/reflector.ts 承擔。
export type ReflectorCommand =
  | { kind: 'idle' }
  | { kind: 'beam' }
  | { kind: 'shard' }
  | { kind: 'mirror'; windowMs: number; dualRay: boolean }
  | { kind: 'clone'; cap: number }
  | { kind: 'panorama'; count: number };

export type ReflectorHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' };

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: REFLECTOR.enrageSpeedMultiplier,
  p3: REFLECTOR.enrageSpeedMultiplier,
  p4: REFLECTOR.enrageSpeedMultiplier,
};

// 加權選招表（§111.1 moveTable SSOT）：P1 折射光束/稜光碎片/開鏡；P2 加入假噗噗分身；
// P3 全景反射主軸（beam 限遠距帶——貼身光束不可讀，沿 Jellord dash 遠距帶理據）。
export function reflectorMoveTable(phase: BossPhase): readonly WeightedMove<ReflectorAction>[] {
  switch (phase) {
    case 'p1':
      return [
        { action: 'beam', weight: 3, condition: { band: 'far' } },
        { action: 'shard', weight: 3 },
        { action: 'mirror', weight: 2 },
      ];
    case 'p2':
      return [
        { action: 'beam', weight: 2, condition: { band: 'far' } },
        { action: 'shard', weight: 2 },
        { action: 'mirror', weight: 3 },
        { action: 'clone', weight: 2 },
      ];
    // p4 執行期不可達（無 EX P4 型態）：沿 p3 招池補鍵位。
    case 'p3':
    case 'p4':
      return [
        { action: 'panorama', weight: 3 },
        { action: 'shard', weight: 2 },
        { action: 'mirror', weight: 2 },
      ];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

export interface ReflectorFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: ReflectorAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  readonly cloneCap: number;
  tick(deltaMs: number): ReflectorCommand | null;
  takeDamage(amount: number): ReflectorHitEvent[];
  // 鏡面回彈（主題機制）：星彈命中時呼叫——開鏡窗內且冷卻期滿回 true（該生一發回彈）。
  // 場上回彈上限由呈現層以 reboundCap 夾限（存活數為呈現層事實）。
  // anti-softlock：回彈與否不影響 takeDamage 全額結算（無免傷窗）。
  tryRebound(): boolean;
  // 開鏡窗即時值（呈現層鏡光面板顯示）。
  isMirrorWindow(): boolean;
  // 閃光弱點窗（§123「鏡面閃光時露弱點」）：窗內受擊 ×2；呈現層據此乘傷。
  isFlashWindow(): boolean;
  // 頭頂命中短暈（§58）：回待機並停拍 durationMs，期滿接續攻擊循環。
  stun(durationMs: number): boolean;
  // 距離帶餵送（§111.1 條件欄）：呈現層逐幀回報與玩家距離；未餵送視為 far。
  setTargetDistance(distancePx: number | null): void;
}

export interface ReflectorFsmOptions {
  ex?: boolean;
  // 亂數注入（加權選招；同 seed 可重放；缺省 Math.random）。
  rng?: () => number;
}

export function createReflectorFsm(options: ReflectorFsmOptions = {}): ReflectorFsm {
  const ex = options.ex === true;
  const rng = options.rng ?? Math.random;
  const maxHp = Math.round(REFLECTOR.maxHp * (ex ? EX_MODS.hpMul : 1));
  const cloneCap = ex ? EX_REFLECTOR.cloneCap : REFLECTOR.cloneCap;

  let hp = maxHp;
  let phase: BossPhase = 'p1';
  let state: ReflectorAction = 'idle';
  let recentAttacks: ReflectorAction[] = [];
  let distancePx: number | null = null;
  let timerMs: number = REFLECTOR.idleMs.p1;
  let damageSinceDrop = 0;
  // 開鏡/閃光窗與回彈節流（FSM 內部時鐘）：tick 累加、命中時查詢。
  let clockMs = 0;
  let mirrorUntilMs = Number.NEGATIVE_INFINITY;
  let flashUntilMs = Number.NEGATIVE_INFINITY;
  let lastReboundAtMs = Number.NEGATIVE_INFINITY;
  let defeated = false;

  const speedFactor = (): number => SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1);

  const durationMs = (action: ReflectorAction): number => {
    switch (action) {
      // 僵直窗＝固定輸出窗：不隨狂暴縮短（§74 hit window 慣例）。
      case 'idle':
        return REFLECTOR.idleMs[phase];
      case 'beam':
        return REFLECTOR.beamDurationMs / speedFactor();
      case 'shard':
        return REFLECTOR.shardDurationMs / speedFactor();
      // 開鏡窗（telegraph＋窗＋閃光）固定不縮放：可讀性與反制窗紅線。
      case 'mirror':
        return REFLECTOR.mirrorDurationMs;
      case 'clone':
        return REFLECTOR.cloneDurationMs / speedFactor();
      case 'panorama':
        return REFLECTOR.panoramaDurationMs / speedFactor();
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: ReflectorAction): ReflectorCommand => {
    switch (action) {
      case 'idle':
        return { kind: 'idle' };
      case 'beam':
        return { kind: 'beam' };
      case 'shard':
        return { kind: 'shard' };
      case 'mirror':
        return {
          kind: 'mirror',
          windowMs: REFLECTOR.mirrorWindowMs,
          dualRay: ex && EX_REFLECTOR.dualRay,
        };
      case 'clone':
        return { kind: 'clone', cap: cloneCap };
      case 'panorama':
        return { kind: 'panorama', count: REFLECTOR.panoramaShardCount };
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const enterPhase = (next: BossPhase, events: ReflectorHitEvent[]): void => {
    phase = next;
    state = 'idle';
    recentAttacks = [];
    timerMs = durationMs('idle');
    // 換階段關窗：回彈/弱點窗不跨段殘留。
    mirrorUntilMs = Number.NEGATIVE_INFINITY;
    flashUntilMs = Number.NEGATIVE_INFINITY;
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
    get cloneCap() {
      return cloneCap;
    },
    tick(deltaMs: number): ReflectorCommand | null {
      if (defeated) return null;
      clockMs += deltaMs;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      if (state === 'idle') {
        state = pickMove(
          reflectorMoveTable(phase),
          { hpRatio: hp / maxHp, distanceBand: distanceBandOf(distancePx) },
          recentAttacks,
          rng,
        );
        recentAttacks = [...recentAttacks.slice(-1), state];
        // 開鏡：telegraph（射線顯示）後開窗，窗滿接閃光弱點窗（風險→獎勵耦合）。
        if (state === 'mirror') {
          mirrorUntilMs = clockMs + REFLECTOR.mirrorTelegraphMs + REFLECTOR.mirrorWindowMs;
          flashUntilMs = mirrorUntilMs + REFLECTOR.flashWindowMs;
        }
      } else {
        state = 'idle';
      }
      // 保留溢出時間，維持節奏不漂移（同 bossFsm）。
      timerMs += durationMs(state);
      return commandOf(state);
    },
    takeDamage(amount: number): ReflectorHitEvent[] {
      if (defeated || amount <= 0) return [];
      const events: ReflectorHitEvent[] = [];
      hp = Math.max(0, hp - amount);
      events.push({ kind: 'damaged', hp });
      if (hp <= 0) {
        defeated = true;
        events.push({ kind: 'defeated' });
        return events;
      }
      damageSinceDrop += amount;
      while (damageSinceDrop >= REFLECTOR.minionSpawnHpStep) {
        damageSinceDrop -= REFLECTOR.minionSpawnHpStep;
        events.push({ kind: 'minionDrop' });
      }
      // 階段轉換：跨多閾值單次受擊依序帶出 phase 事件（p1→p2→p3 不跳段）。
      if (phase === 'p1' && hp <= maxHp * REFLECTOR.p2HpRatio) enterPhase('p2', events);
      if (phase === 'p2' && hp <= maxHp * REFLECTOR.p3HpRatio) enterPhase('p3', events);
      return events;
    },
    tryRebound(): boolean {
      if (defeated || clockMs >= mirrorUntilMs) return false;
      // 開鏡 telegraph 期（射線顯示中）不回彈：預告先行、窗內才生效。
      if (clockMs < mirrorUntilMs - REFLECTOR.mirrorWindowMs) return false;
      if (clockMs - lastReboundAtMs < REFLECTOR.reboundCooldownMs) return false;
      lastReboundAtMs = clockMs;
      return true;
    },
    isMirrorWindow(): boolean {
      return (
        !defeated && clockMs >= mirrorUntilMs - REFLECTOR.mirrorWindowMs && clockMs < mirrorUntilMs
      );
    },
    isFlashWindow(): boolean {
      return !defeated && clockMs >= mirrorUntilMs && clockMs < flashUntilMs;
    },
    stun(durationMs: number): boolean {
      if (defeated) return false;
      state = 'idle';
      timerMs = durationMs;
      return true;
    },
    setTargetDistance(next: number | null): void {
      distancePx = next;
    },
  };
}
