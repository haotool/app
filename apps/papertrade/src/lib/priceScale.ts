import { type MarketSymbol } from '../config/market';
import { isPprSymbol, PPR_TICK_SIZE } from '../features/ppr/config';

// 全站價格精度 SSOT（ADR-R6-01）：tick size 驅動，禁止依數值量級猜精度。
// 來源鏈：live 覆蓋（instruments-info）← 靜態 fallback 表 ← 0.01 兜底；PPR 走本地宣告值。

export interface PriceFormatOptions {
  type: 'price';
  precision: number;
  minMove: number;
}

// 靜態 fallback tick size（vendored 現值）：僅供 live 值未就緒或請求失敗時安全回退。
const STATIC_TICK_SIZE: Partial<Record<MarketSymbol, number>> = {
  BTCUSDT: 0.1,
  ETHUSDT: 0.01,
  SOLUSDT: 0.01,
  XRPUSDT: 0.0001,
  DOGEUSDT: 0.00001,
  BNBUSDT: 0.01,
  ADAUSDT: 0.0001,
  LTCUSDT: 0.01,
  LINKUSDT: 0.001,
  AVAXUSDT: 0.001,
};

let liveTickSize: Partial<Record<MarketSymbol, number>> = {};

export function setLiveTickSize(symbol: MarketSymbol, tick: number): void {
  if (!Number.isFinite(tick) || tick <= 0) return;
  liveTickSize[symbol] = tick;
}

// 測試隔離用：清空 live 覆蓋，回到靜態 fallback。
export function resetLiveTickSizes(): void {
  liveTickSize = {};
}

export function tickSizeFor(symbol: MarketSymbol): number {
  if (isPprSymbol(symbol)) return PPR_TICK_SIZE;
  return liveTickSize[symbol] ?? STATIC_TICK_SIZE[symbol] ?? 0.01;
}

// 由 tick size 反推小數位數：冪次 tick 容忍浮點誤差取最近整數；非冪次（如 0.5）取下一位。
export function pricePrecisionFor(symbol: MarketSymbol): number {
  const exponent = Math.log10(tickSizeFor(symbol));
  const nearest = Math.round(exponent);
  const digits = Math.abs(exponent - nearest) < 1e-9 ? -nearest : -Math.floor(exponent);
  return Math.max(0, digits);
}

// lightweight-charts series priceFormat（軸與 crosshair 精度同源）。
export function priceFormatFor(symbol: MarketSymbol): PriceFormatOptions {
  return { type: 'price', precision: pricePrecisionFor(symbol), minMove: tickSizeFor(symbol) };
}
