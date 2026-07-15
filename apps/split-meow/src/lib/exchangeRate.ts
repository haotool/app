const RATE_URL =
  'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/providers/moneybox/latest.json';

/** 匯率快照有效期：6 小時。 */
export const RATE_TTL_MS = 6 * 60 * 60 * 1000;

export interface MoneyboxRate {
  /** 賣出價：換匯所賣出 1 TWD 收取的 KRW 金額 */
  krwPerTwd: number;
  updatedAt: string;
  /** ISO 時間戳（feed 的 timestamp），供 TTL 判斷；updatedAt 為 KST 字串僅供顯示。 */
  updatedAtIso: string;
}

interface MoneyboxResponse {
  timestamp: string;
  updateTime: string;
  rates: Record<string, { buy: number; sell: number; base: number }>;
}

/** 快照缺失、不可解析或超過 TTL 視為過期。 */
export function isRateStale(updatedAtIso: string | null, now = Date.now()): boolean {
  if (!updatedAtIso) return true;
  const ts = Date.parse(updatedAtIso);
  return !Number.isFinite(ts) || now - ts > RATE_TTL_MS;
}

export async function fetchMoneyboxRate(): Promise<MoneyboxRate> {
  const res = await fetch(RATE_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as MoneyboxResponse;
  const sell = data.rates['TWD']?.sell;
  if (typeof sell !== 'number' || !Number.isFinite(sell) || sell <= 0) {
    throw new Error('TWD sell rate missing or invalid');
  }
  return { krwPerTwd: sell, updatedAt: data.updateTime, updatedAtIso: data.timestamp };
}
