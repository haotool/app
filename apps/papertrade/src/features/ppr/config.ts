import { type MarketSymbol } from '../../config/market';

// PPR 泡泡幣模組總開關（單點 flag）：關閉即不啟動合成 feed、不出現在行情清單。
export const PPR_ENABLED = true;

export const PPR_SYMBOL: MarketSymbol = 'PPRUSDT';
export const PPR_DISPLAY_NAME = 'PPR 泡泡幣';
// UI 常駐標示文案：防止使用者誤認為真實行情（security SSOT 第 10 條）。
export const PPR_DISCLAIMER = '虛構迷因幣，僅供娛樂';
export const PPR_BADGE_LABEL = '娛樂';

// 是否為 ppr 來源 symbol：身分判定與 flag 無關，確保 PPR 永不流向真實 Bybit 管道。
export function isPprSymbol(symbol: string): boolean {
  return symbol === PPR_SYMBOL;
}

// —— 合成行情引擎參數（集中常數）——
// PPR 價格最小跳動單位（ADR-R6-01 定案值）：全站精度由 lib/priceScale.ts 反推。
export const PPR_TICK_SIZE = 0.00001;
export const PPR_TICK_INTERVAL_MS = 250;
export const PPR_SEED_PRICE = 0.042;
// 基準隨機游走：每 tick ±0.1–0.5%。
// 單 tick 基礎波動即大於 1000x 強平緩衝 0.05%：極高槓桿開 PPR 幾乎必然快速強平，
// 屬模擬環境的教育示範設計，不另加攔截（ADR-R5-03）。
export const PPR_BASE_STEP_MIN = 0.001;
export const PPR_BASE_STEP_MAX = 0.005;
// 跳躍事件：機率制觸發 ±30–80% 劇烈波動，觸發後下一 tick 可連鎖。
export const PPR_JUMP_PROBABILITY = 0.004;
export const PPR_JUMP_CHAIN_PROBABILITY = 0.3;
export const PPR_JUMP_MIN = 0.3;
export const PPR_JUMP_MAX = 0.8;
// 均值回歸錨（log 空間）：常態微弱拉回；跑出軟回歸帶則強力拉回；硬護欄兜底。
export const PPR_ANCHOR_PRICE = PPR_SEED_PRICE;
export const PPR_REVERSION_BASE = 0.002;
export const PPR_REVERSION_OUTBAND = 0.08;
export const PPR_SOFT_MIN = 0.001;
export const PPR_SOFT_MAX = 1;
export const PPR_PRICE_MIN = 0.0001;
export const PPR_PRICE_MAX = 10;

// —— 歷史 K 線回溯生成參數 ——
export const PPR_HISTORY_STEP_MIN = 0.002;
export const PPR_HISTORY_STEP_MAX = 0.02;
export const PPR_HISTORY_WICK_MAX = 0.015;
export const PPR_HISTORY_VOLUME_MIN = 50_000;
export const PPR_HISTORY_VOLUME_MAX = 5_000_000;

// —— 合成 ticker／訂單簿／成交流參數 ——
export const PPR_FUNDING_RATE = 0.0001;
export const PPR_FUNDING_INTERVAL_MS = 8 * 3_600_000;
export const PPR_SEED_TURNOVER = 5_000_000;
export const PPR_SEED_VOLUME = 120_000_000;
export const PPR_SEED_OPEN_INTEREST = 1_500_000;
export const PPR_BOOK_LEVELS = 12;
export const PPR_BOOK_STEP = 0.0006;
export const PPR_BOOK_SIZE_MIN = 500;
export const PPR_BOOK_SIZE_MAX = 50_000;
export const PPR_TRADE_PROBABILITY = 0.8;
export const PPR_TRADE_MAX_COUNT = 3;
export const PPR_TRADE_SIZE_MIN = 100;
export const PPR_TRADE_SIZE_MAX = 20_000;
export const PPR_TRADES_BUFFER_LIMIT = 60;
