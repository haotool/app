import type { MagazineSlot, StarFlavor } from './config';
import type { BossPhase, EnemyKind, LevelId, TransformForm } from './types';

// 事件契約：跨系統唯一溝通管道（GAME_DESIGN §11，凍結）。
// 匯流排使用 GameScene 的 scene.events，各系統不得直接互相呼叫。
// v2 關卡制（US-014/US-015）：LEVEL_* 取代已無發射者的 WAVE_CHANGED。
// v3 技能組合（§23）：SKILL_* 由 player 發出，GameScene 結算世界效果。
export const GameEvents = {
  PLAYER_DAMAGED: 'player:damaged',
  PLAYER_HEALED: 'player:healed',
  PLAYER_DIED: 'player:died',
  AMMO_CHANGED: 'ammo:changed',
  ENEMY_INHALED: 'enemy:inhaled',
  ENEMY_KILLED: 'enemy:killed',
  STAR_FIRED: 'star:fired',
  SKILL_STARSTORM: 'skill:starstorm',
  SKILL_SLAM_LANDED: 'skill:slam-landed',
  // v6 殼盾（§40）：成功格擋由 player 發出，GameScene 結算反擊星爆。
  SKILL_SHIELD_BLOCK: 'skill:shield-block',
  // v9 星化形態技（§57）：player 發出，GameScene 結算世界效果（雷化鏈電束／風化落地衝擊）。
  SKILL_TRANSFORM_STRIKE: 'skill:transform-strike',
  BOSS_SPAWNED: 'boss:spawned',
  BOSS_DAMAGED: 'boss:damaged',
  BOSS_PHASE: 'boss:phase',
  // P3 狂暴皇冠（§30）：slam 附加全場震落，站立玩家強制彈起由 GameScene 結算。
  BOSS_QUAKE: 'boss:quake',
  // v10 雙子獨立血條（§68）：producer systems/prismix（split/受擊/掙扎/合體），
  // consumer systems/hud（魔王條雙節顯示；active false 回落單節）。
  BOSS_TWIN_HP: 'boss:twin-hp',
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
  [GameEvents.PLAYER_HEALED]: { hp: number; maxHp: number };
  [GameEvents.PLAYER_DIED]: { x: number; y: number };
  [GameEvents.AMMO_CHANGED]: {
    ammo: number;
    maxAmmo: number;
    flavor: StarFlavor;
    magazine: readonly MagazineSlot[];
  };
  [GameEvents.ENEMY_INHALED]: { kind: EnemyKind };
  [GameEvents.ENEMY_KILLED]: { kind: EnemyKind; x: number; y: number };
  [GameEvents.STAR_FIRED]: {
    x: number;
    y: number;
    directionX: 1 | -1;
    flavor: StarFlavor;
    pitch: number;
  };
  [GameEvents.SKILL_STARSTORM]: { x: number; y: number };
  [GameEvents.SKILL_SLAM_LANDED]: { x: number; y: number };
  [GameEvents.SKILL_SHIELD_BLOCK]: { x: number; y: number; facing: 1 | -1 };
  [GameEvents.SKILL_TRANSFORM_STRIKE]: {
    kind: 'volt-beam' | 'gale-landing';
    form: TransformForm;
    x: number;
    y: number;
    facing: 1 | -1;
  };
  [GameEvents.BOSS_SPAWNED]: { maxHp: number };
  [GameEvents.BOSS_DAMAGED]: { hp: number; maxHp: number; damage: number };
  [GameEvents.BOSS_PHASE]: { phase: BossPhase };
  [GameEvents.BOSS_QUAKE]: { x: number; y: number };
  [GameEvents.BOSS_TWIN_HP]: { hpA: number; hpB: number; maxHp: number; active: boolean };
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
