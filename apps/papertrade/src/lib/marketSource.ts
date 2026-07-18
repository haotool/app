import { type MarketSymbol, type TimeframeId } from '../config/market';
import { marketWs, type MarketWsClient } from '../services/marketWs';
import { fetchKlines, type Kline } from '../services/kline';
import { fetchRecentTrades, type PublicTrade } from '../services/trades';
import { fetchSparkline } from '../services/sparkline';
import { isPprSymbol } from '../features/ppr/config';
import {
  fetchPprKlines,
  fetchPprRecentTrades,
  fetchPprSparkline,
  pprMarketWs,
} from '../features/ppr/feed';

// 市場資料來源單點路由：isPprSymbol → 本地合成 feed，其餘 → 真實 Bybit 管道。
// 真實 services 檔案零改動零污染（security SSOT 第 10 條）；訂閱分派處一律經此模組取來源。

export function marketWsFor(symbol: MarketSymbol): MarketWsClient {
  return isPprSymbol(symbol) ? pprMarketWs : marketWs;
}

export function fetchKlinesBySymbol(
  symbol: MarketSymbol,
  interval: TimeframeId,
  limit: number,
): Promise<Kline[]> {
  return isPprSymbol(symbol)
    ? fetchPprKlines(interval, limit)
    : fetchKlines(symbol, interval, limit);
}

export function fetchRecentTradesBySymbol(
  symbol: MarketSymbol,
  limit: number,
): Promise<PublicTrade[]> {
  return isPprSymbol(symbol) ? fetchPprRecentTrades(limit) : fetchRecentTrades(symbol, limit);
}

export function fetchSparklineBySymbol(symbol: MarketSymbol): Promise<number[]> {
  return isPprSymbol(symbol) ? fetchPprSparkline() : fetchSparkline(symbol);
}
