import type Phaser from 'phaser';

// 池物件瞬時互動旗標 SSOT（PR #886 收斂）：burn→tideDeflected→reflected→
// inhalable→caramel 已五度重演「池回收殘留旗標」同族缺陷——逐 spawn 點補
// setData(x, false) 只會等下一個旗標再犯。新增一次性互動標記時只登記於此清單。
//
// 納入判準：跨系統寫入、代表一次性互動結果、物件回池後必須失效的布林標記。
// 判定不納入（R5 依守門強度分級標示——【機制】有機械鎖會紅、【慣例】無機械鎖
// 純靠人工留意，後者是缺口候選，改動相鄰程式時須主動複查）：
// - hazardKind/lifeMs【機制】：spawnHazard 參數化強制寫入——漏寫即型別錯誤。
// - damage/pierce/flavor/mix（星彈）【機制】：兩發射器每發必寫＋player.test
//   四鍵必寫回歸鎖（R5 建、R6 修假信心：發射前對復用池物件清 sentinel，
//   斷言不再被上一發的殘值頂替——兩發射器各自突變均紅）。
// - 敵人本體池個體狀態【機制】：enemies.spawn 單一取出點全量逐鍵重建＋
//   enemies.test 池復用重建回歸鎖（R5，含 inhalePull/beamDir/aimX/aimY/tailMs）。
// - inhalePull【機制】：讀取端逐幀消費清除＋enemies.spawn 重建清單歸位（R4 補、
//   R5 測試釘住）——單靠幀內消費不足，池復用個體在玩家吸入中生成會殘留一幀。
// - shadow（prismix 鏡像殘影）【機制】：身分標記不復位（復位破壞再召喚語意）；
//   「非池物件」前提在 R4 被證偽（雙掛 shockwaves/shields），改「失效即離池」
//   對帳（R5 前移至 fsm.tick 前＋spawnShardOrbit 取出第二閘＋同幀 merge 測試）。
// - boomMs/boomDir/boomSpeed【慣例·無機械鎖】：三個寫入點每發歸位 boomMs、
//   殘值讀取有 boomMs/hazardKind 閘——新增寫入或讀取分支時人工複查。
// - homingMs（jellord 彈）/orbitIndex（護衛）【慣例·無機械鎖】：單一取出點內
//   每發必寫——新增取出分支時人工複查。
// - fxTrail【慣例·無機械鎖】：附著物件需 destroy 而非布林覆寫，生命週期由
//   recycleStar/starSteering 自管——新增星彈回收路徑時人工複查。
// ticket/ticketUntil（§122 Tariffang 稅票身分與壽命戳記）：稅票追蹤/壽命/吸入
// 迴圈全數以 ticket === true 為閘——取出即歸 false 使殘留戳記不可達，
// 取代 stamp 路徑的手動逐鍵復位（審查回饋：手動清鍵是殘留旗標事故的候選缺口）。
export const POOL_TRANSIENT_FLAGS = [
  'tideDeflected',
  'reflected',
  'burn',
  'prism',
  'inhalable',
  'caramel',
  'ticket',
  'ticketUntil',
] as const;

interface DataHolder {
  setData(key: string, value: unknown): unknown;
}

export function resetTransientFlags(obj: DataHolder): void {
  for (const flag of POOL_TRANSIENT_FLAGS) obj.setData(flag, false);
}

interface PooledGroup {
  get(x?: number, y?: number, key?: string): unknown;
}

// 池取出唯一入口（PR #886 R3/R4/R5）：取出即復位一體化——「新增旗標」由上表
// 守、「新增取出點」由 poolFlags.test.ts 的 TypeScript 型別層守門守：任何對
// Group 型別值的 get 存取（直呼/解構/中括號/換行/改名/跨檔參數/Reflect.get）
// 都會被抓。已知邊界（守門測試以 probe 常駐記錄）：
// 1) 型別斷言脫鉤（as any / as unknown as 寬介面）；
// 2) 容器/寬介面中轉後 symbol 與 Group 脫鉤；
// 3) wrapper 回傳型別被推成非 Group。
// 這三種一般重構即可自然產生，review 時對池群組的型別斷言/中轉要特別留意；
// 動態字串組鍵、eval 等蓄意規避維持不涵蓋。
// 守門存續假設：app tsconfig include 涵蓋 src/game、Phaser Group 符號名為
// 'Group'——兩者由守門測試的檔案在列斷言與 probe 直呼必抓案鎖住，漂移先紅。
export function acquirePooled(
  group: PooledGroup,
  x: number,
  y: number,
  key?: string,
): Phaser.Physics.Arcade.Sprite | null {
  const obj = group.get(x, y, key) as Phaser.Physics.Arcade.Sprite | null;
  if (!obj) return null;
  resetTransientFlags(obj);
  return obj;
}
