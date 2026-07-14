import type { BossAction, BossPhase } from '../core/types';

// 魔王 FSM 純邏輯（GAME_DESIGN §6，不 import phaser），vitest 對象。

export const BOSS = {
  maxHp: 60,
  phase2HpRatio: 0.5,
  bodyDamage: 1,
  enrageSpeedMultiplier: 1.3,
  jellyRainCountP1: 5,
  jellyRainCountP2: 7,
  minionSpawnHpStep: 10,
  idleMs: 1200,
  rainDurationMs: 1200,
  slamDurationMs: 1300,
  dashDurationMs: 1400,
} as const;

export function phaseForHp(hp: number, maxHp: number): BossPhase {
  return hp <= maxHp * BOSS.phase2HpRatio ? 'p2' : 'p1';
}

export function jellyRainCount(phase: BossPhase): number {
  return phase === 'p2' ? BOSS.jellyRainCountP2 : BOSS.jellyRainCountP1;
}

// P1：idle → jellyRain → idle → slam → …；P2 追加 dash。
export function attackCycle(phase: BossPhase): readonly BossAction[] {
  return phase === 'p2' ? ['jellyRain', 'slam', 'dash'] : ['jellyRain', 'slam'];
}

export function nextAction(phase: BossPhase, previous: BossAction | null): BossAction {
  const cycle = attackCycle(phase);
  if (previous === null) return cycle[0] ?? 'idle';
  const index = cycle.indexOf(previous);
  return cycle[(index + 1) % cycle.length] ?? 'idle';
}

// tick 輸出給呈現層的指令：進入攻擊發攻擊指令，返回待機發 idle。
export type BossCommand =
  | { kind: 'idle' }
  | { kind: 'rain'; count: number }
  | { kind: 'slam' }
  | { kind: 'dash' };

export type BossHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' };

export interface BossFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: BossAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  tick(deltaMs: number): BossCommand | null;
  takeDamage(amount: number): BossHitEvent[];
}

export function createBossFsm(): BossFsm {
  let hp: number = BOSS.maxHp;
  let phase: BossPhase = 'p1';
  let state: BossAction = 'idle';
  let lastAttack: BossAction | null = null;
  let timerMs: number = BOSS.idleMs;
  let damageSinceDrop = 0;
  let defeated = false;

  const speedFactor = (): number => (phase === 'p2' ? BOSS.enrageSpeedMultiplier : 1);

  // 時長於進入狀態當下依階段速度換算，P2 全節奏 ×1.3。
  const durationMs = (action: BossAction): number => {
    switch (action) {
      case 'idle':
        return BOSS.idleMs / speedFactor();
      case 'jellyRain':
        return BOSS.rainDurationMs / speedFactor();
      case 'slam':
        return BOSS.slamDurationMs / speedFactor();
      case 'dash':
        return BOSS.dashDurationMs / speedFactor();
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: BossAction): BossCommand => {
    switch (action) {
      case 'idle':
        return { kind: 'idle' };
      case 'jellyRain':
        return { kind: 'rain', count: jellyRainCount(phase) };
      case 'slam':
        return { kind: 'slam' };
      case 'dash':
        return { kind: 'dash' };
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
      return BOSS.maxHp;
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
    tick(deltaMs: number): BossCommand | null {
      if (defeated) return null;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      if (state === 'idle') {
        state = nextAction(phase, lastAttack);
        lastAttack = state;
      } else {
        state = 'idle';
      }
      // 保留溢出時間，維持節奏不漂移。
      timerMs += durationMs(state);
      return commandOf(state);
    },
    takeDamage(amount: number): BossHitEvent[] {
      if (defeated || amount <= 0) return [];
      hp = Math.max(0, hp - amount);
      const events: BossHitEvent[] = [{ kind: 'damaged', hp }];
      const nextPhase = phaseForHp(hp, BOSS.maxHp);
      if (nextPhase !== phase) {
        phase = nextPhase;
        // 狂暴即時生效：剩餘計時同步換算至新節奏。
        timerMs /= BOSS.enrageSpeedMultiplier;
        events.push({ kind: 'phase', phase });
      }
      if (hp > 0) {
        damageSinceDrop += amount;
        while (damageSinceDrop >= BOSS.minionSpawnHpStep) {
          damageSinceDrop -= BOSS.minionSpawnHpStep;
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
