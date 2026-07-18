export type EnemyKind =
  | 'jelly'
  | 'floaty'
  | 'spiky'
  | 'puffy'
  | 'chompy'
  | 'shelly'
  | 'zappy'
  | 'drilly'
  | 'glowy'
  | 'spora'
  | 'gusty'
  | 'boomy'
  | 'magno'
  | 'mirri';

export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// v8 雙魔王（§54）：關卡資料以 BossKind 指定魔王品種，null 為走動關。
export type BossKind = 'jellord' | 'noctra';

// v9 星化三形態（§57）：雷化／風化／殼化；規格表由 logic/transform.ts 持有。
export type TransformForm = 'volt' | 'gale' | 'shell';

export type BossPhase = 'p1' | 'p2' | 'p3';

export type BossAction = 'idle' | 'jellyRain' | 'slam' | 'dash';

export type GameResult = 'won' | 'lost';

// 結算資料：deaths 為本輪累計死亡；levelId 供敗北後直接重試魔王關。
// v6 hub 模型（§39）：各關獨立計時，timeMs 即該關用時，carryMs 累計語義廢除。
export interface GameResultData {
  result: GameResult;
  timeMs: number;
  deaths: number;
  levelId: LevelId;
}

export const SceneKeys = {
  Boot: 'Boot',
  Title: 'Title',
  Map: 'Map',
  Game: 'Game',
  Result: 'Result',
  Codex: 'Codex',
} as const;

// 圖鑑/技能介紹分頁（§36）。
export type CodexTab = 'monsters' | 'skills';

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
