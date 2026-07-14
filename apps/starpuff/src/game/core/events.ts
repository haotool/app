import type { StarFlavor } from './config';
import type { BossPhase, EnemyKind, LevelId } from './types';

// 事件契約：跨系統唯一溝通管道（GAME_DESIGN §11，凍結）。
// 匯流排使用 GameScene 的 scene.events，各系統不得直接互相呼叫。
// v2 關卡制（US-014/US-015）：LEVEL_* 取代已無發射者的 WAVE_CHANGED。
export const GameEvents = {
  PLAYER_DAMAGED: 'player:damaged',
  PLAYER_DIED: 'player:died',
  AMMO_CHANGED: 'ammo:changed',
  ENEMY_INHALED: 'enemy:inhaled',
  ENEMY_KILLED: 'enemy:killed',
  STAR_FIRED: 'star:fired',
  BOSS_SPAWNED: 'boss:spawned',
  BOSS_DAMAGED: 'boss:damaged',
  BOSS_PHASE: 'boss:phase',
  BOSS_DEFEATED: 'boss:defeated',
  LEVEL_CHANGED: 'level:changed',
  LEVEL_QUOTA: 'level:quota',
  LEVEL_GATE_OPENED: 'level:gate-opened',
  GAME_WON: 'game:won',
  GAME_LOST: 'game:lost',
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];

export interface GameEventPayloads {
  [GameEvents.PLAYER_DAMAGED]: { hp: number; maxHp: number; damage: number };
  [GameEvents.PLAYER_DIED]: { x: number; y: number };
  [GameEvents.AMMO_CHANGED]: { ammo: number; maxAmmo: number; flavor: StarFlavor };
  [GameEvents.ENEMY_INHALED]: { kind: EnemyKind };
  [GameEvents.ENEMY_KILLED]: { kind: EnemyKind; x: number; y: number };
  [GameEvents.STAR_FIRED]: { x: number; y: number; directionX: 1 | -1; flavor: StarFlavor };
  [GameEvents.BOSS_SPAWNED]: { maxHp: number };
  [GameEvents.BOSS_DAMAGED]: { hp: number; maxHp: number; damage: number };
  [GameEvents.BOSS_PHASE]: { phase: BossPhase };
  [GameEvents.BOSS_DEFEATED]: { x: number; y: number };
  [GameEvents.LEVEL_CHANGED]: { levelId: LevelId; nameZh: string; killQuota: number };
  [GameEvents.LEVEL_QUOTA]: { killCount: number; killQuota: number };
  [GameEvents.LEVEL_GATE_OPENED]: { levelId: LevelId };
  [GameEvents.GAME_WON]: { timeMs: number };
  [GameEvents.GAME_LOST]: { timeMs: number };
}

interface EmitterLike {
  emit(event: string, ...args: unknown[]): unknown;
  on(event: string, fn: (...args: never[]) => void): unknown;
  off(event: string, fn: (...args: never[]) => void): unknown;
}

export function emitGameEvent<K extends GameEventName>(
  emitter: EmitterLike,
  event: K,
  payload: GameEventPayloads[K],
): void {
  emitter.emit(event, payload);
}

export function onGameEvent<K extends GameEventName>(
  emitter: EmitterLike,
  event: K,
  handler: (payload: GameEventPayloads[K]) => void,
): void {
  emitter.on(event, handler);
}

export function offGameEvent<K extends GameEventName>(
  emitter: EmitterLike,
  event: K,
  handler: (payload: GameEventPayloads[K]) => void,
): void {
  emitter.off(event, handler);
}
