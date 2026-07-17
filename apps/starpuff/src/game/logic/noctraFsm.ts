import type { BossPhase } from '../core/types';

// 暗月蝠王 Noctra FSM 純邏輯（GAME_DESIGN §54，不 import phaser），vitest 對象。
// 平行於 bossFsm.ts 的表驅動模式：phase truth 全數收斂於此，禁止散落 scene。

export const NOCTRA = {
  maxHp: 70,
  phase2HpRatio: 0.6,
  phase3HpRatio: 0.3,
  bodyDamage: 1,
  enrageSpeedMultiplier: 1.25,
  // P1 盤旋投彈；P3 彈幕改放射狀。
  bombCountP1: 4,
  bombCountP2: 5,
  barrageCount: 10,
  // P2 召喚 floaty 上限（場上同時存活數，超額召喚令由呈現層依現量夾限）。
  summonCap: 2,
  // 補給節奏（anti-softlock）：每損 10 HP 掉補給小怪，與果凍王同律。
  minionSpawnHpStep: 10,
  idleMs: 1100,
  bombDurationMs: 1300,
  diveDurationMs: 1500,
  summonDurationMs: 900,
  barrageDurationMs: 1400,
  sweepDurationMs: 1700,
} as const;

export type NoctraAction = 'hover' | 'bomb' | 'dive' | 'summon' | 'barrage' | 'sweep';

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: NOCTRA.enrageSpeedMultiplier,
  p3: NOCTRA.enrageSpeedMultiplier,
};

export function noctraPhaseForHp(hp: number, maxHp: number): BossPhase {
  if (hp <= maxHp * NOCTRA.phase3HpRatio) return 'p3';
  return hp <= maxHp * NOCTRA.phase2HpRatio ? 'p2' : 'p1';
}

// 三階段招式循環（§54）：P1 盤旋投彈＋俯衝；P2 俯衝連擊＋召喚；P3 狂暴彈幕＋全場俯掠。
export function noctraAttackCycle(phase: BossPhase): readonly NoctraAction[] {
  switch (phase) {
    case 'p1':
      return ['bomb', 'dive'];
    case 'p2':
      return ['bomb', 'dive', 'dive', 'summon'];
    case 'p3':
      return ['barrage', 'sweep', 'bomb'];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

export function noctraNextAction(
  phase: BossPhase,
  previous: NoctraAction | null,
  cycleIndex: number,
): { action: NoctraAction; cycleIndex: number } {
  const cycle = noctraAttackCycle(phase);
  if (previous === null) return { action: cycle[0] ?? 'hover', cycleIndex: 0 };
  const index = (cycleIndex + 1) % cycle.length;
  return { action: cycle[index] ?? 'hover', cycleIndex: index };
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
  | { kind: 'sweep' };

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
}

export function createNoctraFsm(): NoctraFsm {
  let hp: number = NOCTRA.maxHp;
  let phase: BossPhase = 'p1';
  let state: NoctraAction = 'hover';
  let lastAttack: NoctraAction | null = null;
  let cycleIndex = 0;
  let timerMs: number = NOCTRA.idleMs;
  let damageSinceDrop = 0;
  let defeated = false;

  const speedFactor = (): number => SPEED_FACTORS[phase];

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
      return NOCTRA.maxHp;
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
        const next = noctraNextAction(phase, lastAttack, cycleIndex);
        state = next.action;
        cycleIndex = next.cycleIndex;
        lastAttack = state;
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
      const nextPhase = noctraPhaseForHp(hp, NOCTRA.maxHp);
      if (nextPhase !== phase) {
        const previousFactor = SPEED_FACTORS[phase];
        phase = nextPhase;
        // 換階段重置循環游標，避免沿用他階段索引越界跳招。
        cycleIndex = 0;
        lastAttack = null;
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
  };
}
