import { z } from 'zod';

export const DAILY_EQUITY_STORAGE_KEY = 'papertrade:daily-equity';

const baselineSchema = z.object({
  date: z.string().min(1),
  equity: z.number().finite(),
});

// 本地時區日界（非 UTC）：使用者的「今日」以裝置時區為準。
export function localDateKey(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 取得當日起始權益：存檔跨日或損壞時，以目前權益重建 baseline。
export function resolveDailyEquityBaseline(
  storage: Storage,
  now: Date,
  currentEquity: number,
): number {
  const today = localDateKey(now);
  const raw = storage.getItem(DAILY_EQUITY_STORAGE_KEY);
  if (raw !== null) {
    try {
      const parsed = baselineSchema.safeParse(JSON.parse(raw));
      if (parsed.success && parsed.data.date === today) return parsed.data.equity;
    } catch {
      // JSON 損壞視同無存檔，落到重建。
    }
  }
  storage.setItem(DAILY_EQUITY_STORAGE_KEY, JSON.stringify({ date: today, equity: currentEquity }));
  return currentEquity;
}
