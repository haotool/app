import type Phaser from 'phaser';

// 池物件瞬時互動旗標 SSOT（PR #886 收斂）：burn→tideDeflected→reflected→
// inhalable→caramel 已五度重演「池回收殘留旗標」同族缺陷——逐 spawn 點補
// setData(x, false) 只會等下一個旗標再犯。新增一次性互動標記時只登記於此清單。
//
// 納入判準：跨系統寫入、代表一次性互動結果、物件回池後必須失效的布林標記。
// 判定不納入（盤點於 PR #886 R3，防後人誤判漏看）：
// - hazardKind/lifeMs/damage/pierce/flavor/mix/homingMs/orbitIndex：每次 spawn
//   必寫的本體屬性，殘值不可達。
// - boomMs/boomDir/boomSpeed：spawn 每發必寫歸位，讀取端另有 hazardKind／
//   boomMs 非 null 雙重守門。
// - fxTrail：附著物件（particle emitter）生命週期由 recycleStar/starSteering
//   自管，需 destroy 而非布林覆寫。
// - 敵人本體池個體狀態（hp/state/elite/mini/frozenMs/...）：enemies.spawn 全量
//   逐鍵重建。
// - inhalePull：overlaps 每幀先清再設，幀內生命週期非跨池。
// - shadow（prismix 鏡像殘影）：專屬 sprite 的身分標記，非池取出物件；復位會
//   破壞殘影再召喚語意。
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

// 池取出唯一入口（PR #886 R3）：取出即復位一體化——「新增旗標」由上表守、
// 「新增取出點」由本函式＋poolFlags.test.ts 原始碼靜態守門守（raw pool .get
// 直呼會被測試擋下），兩個維度的遺漏都在結構上不可能發生。
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
