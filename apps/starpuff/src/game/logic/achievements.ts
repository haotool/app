import type { SaveData } from '../core/save';
import type { BossKind, LevelId } from '../core/types';
import { BOSS_LEVEL_IDS, LEVELS, exConquestDone } from './levels';

// 成就系統 SSOT（GAME_DESIGN §94，pure TS 不 import phaser），vitest 對象。
// 全部成就由既有 save 資料派生判定（cleared/bestTimeMs/eggsFound/exCleared），
// 禁止侵入式遊戲邏輯鉤子；魔王與彩蛋條目由 LEVELS 派生，禁第二份硬編清單。

export type AchievementCategory = 'progress' | 'boss' | 'collect' | 'skill' | 'secret';

export interface AchievementSpec {
  id: string;
  nameZh: string;
  descZh: string;
  category: AchievementCategory;
  // 隱藏成就：未解鎖時名稱與描述以「？？？」遮蔽（§94）。
  hidden: boolean;
  unlocked: (save: SaveData) => boolean;
}

// 五王成就命名表：以 BossKind 為鍵，加王時型別強制補名（清單本體仍由 LEVELS 派生）。
const BOSS_TITLES: Record<BossKind, { win: string; winDesc: string; ex: string; exDesc: string }> =
  {
    jellord: {
      win: '搖晃的王座',
      winDesc: '擊破果凍王',
      ex: 'EX 果凍王制霸',
      exDesc: '以 EX 變體擊破果凍王',
    },
    noctra: {
      win: '月蝕終結',
      winDesc: '擊破暗月蝠王',
      ex: 'EX 蝠王制霸',
      exDesc: '以 EX 變體擊破暗月蝠王',
    },
    prismix: {
      win: '雙晶謝幕',
      winDesc: '擊破稜晶雙子',
      ex: 'EX 雙子制霸',
      exDesc: '以 EX 變體擊破稜晶雙子',
    },
    syrona: {
      win: '窯火熄滅',
      winDesc: '擊破熔糖窯后',
      ex: 'EX 窯后制霸',
      exDesc: '以 EX 變體擊破熔糖窯后',
    },
    voidra: {
      win: '星核黎明',
      winDesc: '擊破蝕星魔核',
      ex: 'EX 魔核制霸',
      exDesc: '以 EX 變體擊破蝕星魔核',
    },
  };

const BOSS_LEVELS = LEVELS.filter(
  (level): level is (typeof LEVELS)[number] & { boss: BossKind } => level.boss !== null,
);

// 隱藏成就對應關卡由彩蛋觸發器反查（觸發器於魔王關唯一，levels.test 守門資料不變式）。
function levelWithEgg(trigger: string): LevelId {
  const level = LEVELS.find((spec) => spec.easterEggs.some((egg) => egg.trigger === trigger));
  if (!level) throw new Error(`未定義彩蛋觸發器：${trigger}`);
  return level.id;
}

function totalEggsFound(save: SaveData): number {
  let count = 0;
  for (const level of LEVELS) count += save.levels[level.id]?.eggsFound.length ?? 0;
  return count;
}

function allEggsFound(save: SaveData): boolean {
  return LEVELS.every((level) =>
    level.easterEggs.every((egg) => save.levels[level.id]?.eggsFound.includes(egg.trigger)),
  );
}

// 速通判定：bestTimeMs 僅一般通關寫入（EX 不寫），0 表示尚無紀錄不計。
function bossBestWithin(save: SaveData, maxMs: number): boolean {
  return BOSS_LEVEL_IDS.some((id) => {
    const best = save.levels[id]?.bestTimeMs ?? 0;
    return best > 0 && best <= maxMs;
  });
}

function hasEgg(save: SaveData, trigger: string): boolean {
  return save.levels[levelWithEgg(trigger)]?.eggsFound.includes(trigger) === true;
}

// 顯示順序即表序：進度 → 魔王首勝 → EX → 制霸 → 收集 → 技巧 → 隱藏。
export const ACHIEVEMENTS: readonly AchievementSpec[] = [
  {
    id: 'first-clear',
    nameZh: '星途啟程',
    descZh: '通關第一關',
    category: 'progress',
    hidden: false,
    unlocked: (save) => save.levels[1]?.cleared === true,
  },
  {
    id: 'all-clear',
    nameZh: '星圖全開',
    descZh: '二十關全數通關',
    category: 'progress',
    hidden: false,
    unlocked: (save) => LEVELS.every((level) => save.levels[level.id]?.cleared === true),
  },
  ...BOSS_LEVELS.map(
    (level): AchievementSpec => ({
      id: `boss-${level.boss}`,
      nameZh: BOSS_TITLES[level.boss].win,
      descZh: BOSS_TITLES[level.boss].winDesc,
      category: 'boss',
      hidden: false,
      unlocked: (save) => save.levels[level.id]?.cleared === true,
    }),
  ),
  ...BOSS_LEVELS.map(
    (level): AchievementSpec => ({
      id: `ex-${level.boss}`,
      nameZh: BOSS_TITLES[level.boss].ex,
      descZh: BOSS_TITLES[level.boss].exDesc,
      category: 'boss',
      hidden: false,
      unlocked: (save) => save.levels[level.id]?.exCleared === true,
    }),
  ),
  {
    id: 'ex-conquest',
    nameZh: '星核制霸',
    descZh: '五王 EX 變體全數制霸',
    category: 'boss',
    hidden: false,
    unlocked: (save) => exConquestDone(save),
  },
  {
    id: 'egg-first',
    nameZh: '好奇心的獎勵',
    descZh: '發現第一顆彩蛋',
    category: 'collect',
    hidden: false,
    unlocked: (save) => totalEggsFound(save) >= 1,
  },
  {
    id: 'egg-10',
    nameZh: '彩蛋收藏家',
    descZh: '累計發現 10 顆彩蛋',
    category: 'collect',
    hidden: false,
    unlocked: (save) => totalEggsFound(save) >= 10,
  },
  {
    id: 'egg-all',
    nameZh: '彩蛋大師',
    descZh: '全部彩蛋收集完成',
    category: 'collect',
    hidden: false,
    unlocked: allEggsFound,
  },
  {
    id: 'speed-boss-120',
    nameZh: '疾風討伐',
    descZh: '任一魔王關 120 秒內通關',
    category: 'skill',
    hidden: false,
    unlocked: (save) => bossBestWithin(save, 120000),
  },
  {
    id: 'speed-boss-60',
    nameZh: '星速傳說',
    descZh: '任一魔王關 60 秒內通關',
    category: 'skill',
    hidden: false,
    unlocked: (save) => bossBestWithin(save, 60000),
  },
  {
    id: 'egg-twin',
    nameZh: '雙星共落',
    descZh: '達成雙子連破的祕密',
    category: 'secret',
    hidden: true,
    unlocked: (save) => hasEgg(save, 'twin-finish'),
  },
  {
    id: 'egg-vent',
    nameZh: '窯風舞者',
    descZh: '達成窯風三連的祕密',
    category: 'secret',
    hidden: true,
    unlocked: (save) => hasEgg(save, 'vent-hit-count'),
  },
  {
    id: 'egg-core',
    nameZh: '星核共鳴者',
    descZh: '達成星核共鳴的祕密',
    category: 'secret',
    hidden: true,
    unlocked: (save) => hasEgg(save, 'survive-collect'),
  },
] as const;

export function getAchievement(id: string): AchievementSpec | null {
  return ACHIEVEMENTS.find((spec) => spec.id === id) ?? null;
}

// 當前解鎖集合：恆由 save 資料即時派生（呈現層以此為準，stored 只管頒發去重）。
export function unlockedAchievements(save: SaveData): ReadonlySet<string> {
  return new Set(ACHIEVEMENTS.filter((spec) => spec.unlocked(save)).map((spec) => spec.id));
}

// 頒發：diff 已頒發集合、就地 append 新解鎖 id（沿 recordLevelClear 就地更新慣例），
// 回傳本次新增供 toast 佇列；重複呼叫冪等回空。
export function awardAchievements(save: SaveData): string[] {
  const awarded = new Set(save.achievements);
  const newly: string[] = [];
  for (const spec of ACHIEVEMENTS) {
    if (awarded.has(spec.id) || !spec.unlocked(save)) continue;
    save.achievements.push(spec.id);
    newly.push(spec.id);
  }
  return newly;
}
