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
  | 'mirri'
  | 'bubbla'
  | 'splatta'
  | 'twinkla'
  | 'cometa'
  // §119 星海終局篇新怪：貨櫃丁/票券蝠/掃描眼（L21）與泡泡機/冰史萊姆/潮汐魟（L23）。
  | 'cargo'
  | 'ticketa'
  | 'scanna'
  | 'foamy'
  | 'frosty'
  | 'manta';

export type LevelId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  // §118 星海終局篇（21-30）：W1 交付 L21/L23，其餘由 W2-W4 波次逐關入編。
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30;

// v8 雙魔王（§54）：關卡資料以 BossKind 指定魔王品種，null 為走動關。
// v10（§68）：新增分裂型稜晶雙子 prismix。v11（§74）：場控型 Syrona。
// v12（§82）：場控收束型最終魔王 Voidra。
export type BossKind = 'jellord' | 'noctra' | 'prismix' | 'syrona' | 'voidra';

// v9 星化三形態（§57）：雷化／風化／殼化；規格表由 logic/transform.ts 持有。
// §118 星海終局篇：新增焰化／潮化／稜化／引力化（引入關見 FORM_INTRO_LEVEL）。
export type TransformForm = 'volt' | 'gale' | 'shell' | 'ember' | 'tide' | 'prism' | 'gravity';

// 星暴 2.0 蓄能相位（§109）：none 無蓄能星；charged 頭頂蓄能星待引爆；detonating 蓄爆中。
export type StarburstPhase = 'none' | 'charged' | 'detonating';

// p4：EX 專屬第四型態（#814 T6）——目前僅 Prismix 裂核殘響可達；
// Syrona/Voidra 於後續波次落地，Jellord/Noctra 執行期不可達。
export type BossPhase = 'p1' | 'p2' | 'p3' | 'p4';

export type BossAction = 'idle' | 'jellyRain' | 'slam' | 'dash';

export type GameResult = 'won' | 'lost';

// 結算資料：deaths 為本輪累計死亡；levelId 供敗北後直接重試魔王關。
// v6 hub 模型（§39）：各關獨立計時，timeMs 即該關用時，carryMs 累計語義廢除。
export interface GameResultData {
  result: GameResult;
  timeMs: number;
  deaths: number;
  levelId: LevelId;
  // EX 變體（§86）：敗北再戰須保留變體模式，缺省 false。
  ex?: boolean;
  // v15 成就（§94）：勝利瞬間新頒發的成就 id——Result 結算列示防多重解鎖演出期漏看，缺省空。
  unlocked?: readonly string[];
}

export const SceneKeys = {
  Boot: 'Boot',
  Title: 'Title',
  Map: 'Map',
  Game: 'Game',
  Result: 'Result',
  Codex: 'Codex',
  // v12 謝幕（§84）：全破 L20 後的星光復甦演出，播畢接 Result。
  Credits: 'Credits',
} as const;

// 圖鑑/技能介紹/成就分頁（§36/§94）。
export type CodexTab = 'monsters' | 'skills' | 'achievements';

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
