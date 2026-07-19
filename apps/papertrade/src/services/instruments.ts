import { z } from 'zod';
import { BYBIT_REST_URL, isMarketSymbol } from '../config/market';
import { setLiveTickSize } from '../lib/priceScale';

// 寬鬆解析（慣例同 parseTickerMessage）：僅取 symbol 與 priceFilter.tickSize，其餘缺漏容忍。
// 欄位路徑依官方文檔 GET /v5/market/instruments-info：result.list[].priceFilter.tickSize。
const instrumentsSchema = z.object({
  result: z.object({
    list: z.array(
      z.object({
        symbol: z.string(),
        priceFilter: z.object({ tickSize: z.string().optional() }).optional(),
      }),
    ),
  }),
});

export function applyInstrumentsTickSizes(payload: unknown): void {
  const parsed = instrumentsSchema.safeParse(payload);
  if (!parsed.success) return;
  for (const entry of parsed.data.result.list) {
    if (!isMarketSymbol(entry.symbol)) continue;
    const tick = Number(entry.priceFilter?.tickSize);
    if (Number.isFinite(tick) && tick > 0) setLiveTickSize(entry.symbol, tick);
  }
}

// 啟動時抓取即時 tick size（fire-and-forget）：失敗靜默，維持 priceScale 靜態回退。
// limit=1000 為單請求上限；未涵蓋 symbol 由靜態表兜底，不做分頁追蹤。
export function refreshLiveTickSizes(): void {
  fetch(`${BYBIT_REST_URL}/v5/market/instruments-info?category=linear&limit=1000`)
    .then((response) => response.json())
    .then(applyInstrumentsTickSizes)
    .catch(() => undefined);
}
