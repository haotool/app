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

// TODO(US-005)：完整 FSM（idle 計時、招式時長、受擊補生小怪判定 minionSpawnHpStep）。
export function nextAction(phase: BossPhase, previous: BossAction | null): BossAction {
  const cycle = attackCycle(phase);
  if (previous === null) return cycle[0] ?? 'idle';
  const index = cycle.indexOf(previous);
  return cycle[(index + 1) % cycle.length] ?? 'idle';
}
