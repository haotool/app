export type EnemyKind = 'jelly' | 'floaty' | 'spiky';

export type LevelId = 1 | 2 | 3 | 4;

// 關卡事件契約（US-014）：正式併入 events.ts 前暫存於此，見 interface-changes。
export const LevelEvents = {
  LEVEL_CHANGED: 'level:changed',
  LEVEL_QUOTA: 'level:quota',
  LEVEL_GATE_OPENED: 'level:gate-opened',
} as const;

export interface LevelChangedPayload {
  levelId: LevelId;
  nameZh: string;
  killQuota: number;
}

export interface LevelQuotaPayload {
  killCount: number;
  killQuota: number;
}

export type BossPhase = 'p1' | 'p2';

export type BossAction = 'idle' | 'jellyRain' | 'slam' | 'dash';

export type WaveId = 'tutorial' | 'wave1' | 'wave2' | 'boss';

export type GameResult = 'won' | 'lost';

export interface GameResultData {
  result: GameResult;
  timeMs: number;
}

export const SceneKeys = {
  Boot: 'Boot',
  Title: 'Title',
  Game: 'Game',
  Result: 'Result',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
