export const SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'BNBUSDT',
  'ADAUSDT',
  'LTCUSDT',
  'LINKUSDT',
  'AVAXUSDT',
] as const;

export type MarketSymbol = (typeof SYMBOLS)[number];

export interface SymbolMeta {
  base: string;
  name: string;
  accent: string;
}

export const SYMBOL_META: Record<MarketSymbol, SymbolMeta> = {
  BTCUSDT: { base: 'BTC', name: 'Bitcoin', accent: '#F7931A' },
  ETHUSDT: { base: 'ETH', name: 'Ethereum', accent: '#627EEA' },
  SOLUSDT: { base: 'SOL', name: 'Solana', accent: '#9945FF' },
  XRPUSDT: { base: 'XRP', name: 'XRP', accent: '#0A93DC' },
  DOGEUSDT: { base: 'DOGE', name: 'Dogecoin', accent: '#C2A633' },
  BNBUSDT: { base: 'BNB', name: 'BNB', accent: '#F3BA2F' },
  ADAUSDT: { base: 'ADA', name: 'Cardano', accent: '#0033AD' },
  LTCUSDT: { base: 'LTC', name: 'Litecoin', accent: '#8E9AAF' },
  LINKUSDT: { base: 'LINK', name: 'Chainlink', accent: '#2A5ADA' },
  AVAXUSDT: { base: 'AVAX', name: 'Avalanche', accent: '#E84142' },
};

export function isMarketSymbol(value: string): value is MarketSymbol {
  return (SYMBOLS as readonly string[]).includes(value);
}

export const TIMEFRAMES = [
  { id: '1', label: '1m' },
  { id: '5', label: '5m' },
  { id: '15', label: '15m' },
  { id: '60', label: '1h' },
  { id: '240', label: '4h' },
  { id: 'D', label: '1D' },
  { id: 'W', label: '1W' },
] as const;

export type TimeframeId = (typeof TIMEFRAMES)[number]['id'];

export function isTimeframeId(value: string): value is TimeframeId {
  return TIMEFRAMES.some((timeframe) => timeframe.id === value);
}

export const DEFAULT_SYMBOL: MarketSymbol = 'BTCUSDT';
export const DEFAULT_TIMEFRAME: TimeframeId = '60';

export const BYBIT_WS_URL = 'wss://stream.bybit.com/v5/public/linear';
export const BYBIT_REST_URL = 'https://api.bybit.com';

export const WS_PING_INTERVAL_MS = 20_000;
export const WS_RECONNECT_BASE_MS = 1_000;
export const WS_RECONNECT_MAX_MS = 30_000;

export const KLINE_HISTORY_LIMIT = 1000;
export const SPARKLINE_POINTS = 24;
export const SPARKLINE_INTERVAL: TimeframeId = '60';
export const SPARKLINE_CACHE_TTL_MS = 5 * 60 * 1000;
export const ORDERBOOK_DISPLAY_LEVELS = 8;
