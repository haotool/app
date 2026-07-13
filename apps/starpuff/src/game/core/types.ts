export type EnemyKind = 'jelly' | 'floaty' | 'spiky';

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
