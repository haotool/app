export type EnemyKind = 'jelly' | 'floaty' | 'spiky' | 'puffy' | 'chompy';

export type LevelId = 1 | 2 | 3 | 4;

export type BossPhase = 'p1' | 'p2';

export type BossAction = 'idle' | 'jellyRain' | 'slam' | 'dash';

export type GameResult = 'won' | 'lost';

// 結算資料：deaths 為本輪累計死亡；levelId/carryMs 供敗北後直接重試魔王關。
export interface GameResultData {
  result: GameResult;
  timeMs: number;
  deaths: number;
  levelId: LevelId;
  carryMs: number;
}

export const SceneKeys = {
  Boot: 'Boot',
  Title: 'Title',
  Game: 'Game',
  Result: 'Result',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
