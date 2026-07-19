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
  // 本地合成迷因幣（features/ppr）：是否為 ppr 來源由 isPprSymbol() 判斷，此處僅註冊。
  'PPRUSDT',
] as const;

export type MarketSymbol = (typeof SYMBOLS)[number];

export interface SymbolMeta {
  base: string;
  name: string;
  accent: string;
}

export const SYMBOL_META: Record<MarketSymbol, SymbolMeta> = {
  BTCUSDT: { base: 'BTC', name: 'Bitcoin', accent: 'var(--color-accent-btc)' },
  ETHUSDT: { base: 'ETH', name: 'Ethereum', accent: 'var(--color-accent-eth)' },
  SOLUSDT: { base: 'SOL', name: 'Solana', accent: 'var(--color-accent-sol)' },
  XRPUSDT: { base: 'XRP', name: 'XRP', accent: 'var(--color-accent-xrp)' },
  DOGEUSDT: { base: 'DOGE', name: 'Dogecoin', accent: 'var(--color-accent-doge)' },
  BNBUSDT: { base: 'BNB', name: 'BNB', accent: 'var(--color-accent-bnb)' },
  ADAUSDT: { base: 'ADA', name: 'Cardano', accent: 'var(--color-accent-ada)' },
  LTCUSDT: { base: 'LTC', name: 'Litecoin', accent: 'var(--color-accent-ltc)' },
  LINKUSDT: { base: 'LINK', name: 'Chainlink', accent: 'var(--color-accent-link)' },
  AVAXUSDT: { base: 'AVAX', name: 'Avalanche', accent: 'var(--color-accent-avax)' },
  PPRUSDT: { base: 'PPR', name: 'PPR 泡泡幣', accent: 'var(--color-accent-ppr)' },
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
// tickers 常態每秒多則；靜默超過此值視為半開連線（斷網不觸發 close 事件）。
export const WS_SILENCE_TIMEOUT_MS = 12_000;

export const KLINE_HISTORY_LIMIT = 1000;
export const SPARKLINE_POINTS = 24;
export const SPARKLINE_INTERVAL: TimeframeId = '60';
export const SPARKLINE_CACHE_TTL_MS = 5 * 60 * 1000;
export const SPARKLINE_MAX_CONCURRENCY = 3;
export const ORDERBOOK_DISPLAY_LEVELS = 10;
// 交易頁緊湊訂單簿單側檔數上限；實際檔數依左欄表單高度動態裁切（最少各 3 檔）。
export const TRADE_ORDERBOOK_LEVELS = 10;
export const TRADES_DISPLAY_LIMIT = 30;
// 深度圖重繪節流：訂單簿 tick 遠高於視覺需求，取樣間隔內只重繪一次。
export const DEPTH_REDRAW_INTERVAL_MS = 300;
