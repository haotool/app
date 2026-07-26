import type { LevelSpec } from './levels';

// 五區分頁資料 SSOT（GAME_DESIGN §78，主計畫 §2.2，不 import phaser），vitest 對象。
// 分區分頁地圖：每區一頁＋頁籤導航；區解鎖＝區首關解鎖（前區魔王擊破）。
// 節點清單由 LEVELS 實際條目推導（區間過濾），關卡逐列車擴充時分頁零改動。
// 區間端點取 number：LevelId 聯集隨列車逐步擴充，分區表先行涵蓋全 20 關藍圖。

export interface ZoneSpec {
  id: number;
  nameZh: string;
  firstLevelId: number;
  lastLevelId: number;
}

export const ZONES: readonly ZoneSpec[] = [
  { id: 1, nameZh: '果凍平原', firstLevelId: 1, lastLevelId: 4 },
  { id: 2, nameZh: '天風峽域', firstLevelId: 5, lastLevelId: 7 },
  { id: 3, nameZh: '幻晶深域', firstLevelId: 8, lastLevelId: 12 },
  { id: 4, nameZh: '焙糖火山', firstLevelId: 13, lastLevelId: 16 },
  { id: 5, nameZh: '星核聖域', firstLevelId: 17, lastLevelId: 20 },
  // §118 星海終局篇（21-30）：每章＝走動關＋魔王關成對收尾（W1-W4 逐波入編）。
  { id: 6, nameZh: '星海港域', firstLevelId: 21, lastLevelId: 22 },
  { id: 7, nameZh: '冰晶潮域', firstLevelId: 23, lastLevelId: 24 },
  { id: 8, nameZh: '鏡界塔域', firstLevelId: 25, lastLevelId: 26 },
  { id: 9, nameZh: '引力深域', firstLevelId: 27, lastLevelId: 28 },
  { id: 10, nameZh: '崩盤終章', firstLevelId: 29, lastLevelId: 30 },
] as const;

// 關卡所屬區：L1-L20 全數落於五區之一；未涵蓋 id 視為資料錯誤即擲錯。
export function zoneOf(levelId: number): ZoneSpec {
  const zone = ZONES.find((z) => levelId >= z.firstLevelId && levelId <= z.lastLevelId);
  if (!zone) throw new Error(`未定義分區的關卡 id：${levelId}`);
  return zone;
}

// 區內節點：由 LEVELS 實際條目推導（列車過渡期末區可能未滿編，分頁自然收斂）。
export function levelsInZone(zone: ZoneSpec, levels: readonly LevelSpec[]): LevelSpec[] {
  return levels.filter((l) => l.id >= zone.firstLevelId && l.id <= zone.lastLevelId);
}
