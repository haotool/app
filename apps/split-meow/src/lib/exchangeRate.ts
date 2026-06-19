const RATE_URL =
  'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/providers/moneybox/latest.json';

export interface MoneyboxRate {
  /** 賣出價：換匯所賣出 1 TWD 收取的 KRW 金額 */
  krwPerTwd: number;
  updatedAt: string;
}

interface MoneyboxResponse {
  updateTime: string;
  rates: Record<string, { buy: number; sell: number; base: number }>;
}

export async function fetchMoneyboxRate(): Promise<MoneyboxRate> {
  const res = await fetch(RATE_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as MoneyboxResponse;
  const twd = data.rates['TWD'];
  if (!twd?.sell) throw new Error('TWD sell rate missing');
  return { krwPerTwd: twd.sell, updatedAt: data.updateTime };
}
