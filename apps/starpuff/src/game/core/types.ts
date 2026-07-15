export type EnemyKind = 'jelly' | 'floaty' | 'spiky' | 'puffy' | 'chompy' | 'shelly' | 'zappy';

export type LevelId = 1 | 2 | 3 | 4;

export type BossPhase = 'p1' | 'p2' | 'p3';

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
  Codex: 'Codex',
} as const;

// 圖鑑/技能介紹分頁（§36）。
export type CodexTab = 'monsters' | 'skills';

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
