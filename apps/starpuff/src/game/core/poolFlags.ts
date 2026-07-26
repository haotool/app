import type Phaser from 'phaser';

// 池物件瞬時互動旗標 SSOT（PR #886 收斂）：burn→tideDeflected→reflected→
// inhalable→caramel 已五度重演「池回收殘留旗標」同族缺陷——逐 spawn 點補
// setData(x, false) 只會等下一個旗標再犯。新增一次性互動標記時只登記於此清單。
//
// 納入判準：跨系統寫入、代表一次性互動結果、物件回池後必須失效的布林標記。
// 判定不納入（R4 逐條事實重查後改寫；每條附「為何現在為真＋如何保持為真」）：
// - hazardKind/lifeMs：spawnHazard 參數化強制寫入（R4）——漏寫即型別錯誤，
//   不再依賴各 spawner 分支自律。
// - damage/pierce/flavor/mix（星彈）：兩個發射器（launchStar/launchShot）每發
//   必寫，發射器即池取出點（型別層守門保證新增發射器必經 acquirePooled 審視）。
// - boomMs：spawnHazard/兩發射器每發必寫歸位；boomDir/boomSpeed 僅在 boomMs
//   有效（hazards 另加 hazardKind==='boomerang'）分支讀取，殘值不可達。
// - homingMs（jellord 彈）/orbitIndex（護衛）：單一取出點內每發必寫。
// - fxTrail：附著物件（particle emitter）需 destroy 而非布林覆寫，生命週期由
//   recycleStar/starSteering 自管。
// - 敵人本體池個體狀態（hp/state/elite/mini/frozenMs/...）：enemies.spawn 單一
//   取出點全量逐鍵重建。
// - inhalePull：overlaps 同一 wire 內每幀先清再設，幀內生命週期非跨池。
// - shadow（prismix 鏡像殘影）：身分標記不復位（復位會破壞再召喚語意）；其
//   「非池物件」前提在 R4 被證偽（殘影雙掛 shockwaves/shields 池），改以
//   「失效即離池」對帳修正——殘影 inactive 時不得留在任何池群組內。
export const POOL_TRANSIENT_FLAGS = [
  'tideDeflected',
  'reflected',
  'burn',
  'inhalable',
  'caramel',
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

// 池取出唯一入口（PR #886 R3/R4）：取出即復位一體化——「新增旗標」由上表守、
// 「新增取出點」由 poolFlags.test.ts 的 TypeScript 型別層守門守：任何對 Group
// 型別值的 get 存取（直呼/解構/中括號/換行/改名/跨檔參數/Reflect.get）都會被
// 抓。此守門大幅降低遺漏機率但非不可繞過——動態字串組鍵、any 斷言等蓄意規避
// 不在涵蓋範圍（已知邊界，見守門測試自證案）。
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
