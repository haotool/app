// 池物件瞬時互動旗標 SSOT（PR #886 收斂）：burn→tideDeflected→reflected→inhalable
// 已四度重演「池回收殘留旗標」同族缺陷——逐 spawn 點補 setData(x, false) 只會等
// 下一個旗標再犯。所有池取出點（hazards/魔王彈幕/星彈）一律呼叫本函式單點復位；
// 新增一次性互動標記時只登記於此清單，杜絕結構性遺漏。
export const POOL_TRANSIENT_FLAGS = ['tideDeflected', 'reflected', 'burn', 'inhalable'] as const;

interface DataHolder {
  setData(key: string, value: unknown): unknown;
}

export function resetTransientFlags(obj: DataHolder): void {
  for (const flag of POOL_TRANSIENT_FLAGS) obj.setData(flag, false);
}
