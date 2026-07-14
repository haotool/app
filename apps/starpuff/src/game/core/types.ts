export type EnemyKind = 'jelly' | 'floaty' | 'spiky' | 'puffy' | 'chompy';

export type LevelId = 1 | 2 | 3 | 4;

export type BossPhase = 'p1' | 'p2';

export type BossAction = 'idle' | 'jellyRain' | 'slam' | 'dash';

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
