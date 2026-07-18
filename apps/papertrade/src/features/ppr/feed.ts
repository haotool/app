import {
  KLINE_HISTORY_LIMIT,
  SPARKLINE_POINTS,
  type TimeframeId,
  TIMEFRAMES,
} from '../../config/market';
import { type MarketWsClient, type WsStatus } from '../../services/marketWs';
import { type Kline } from '../../services/kline';
import { type PublicTrade } from '../../services/trades';
import { type Ticker } from '../../services/ticker';
import { useMarketStore } from '../../stores/marketStore';
import { useTradeStore } from '../../stores/tradeStore';
import { createPprEngine, uniform, type PprEngine } from './engine';
import {
  PPR_BOOK_LEVELS,
  PPR_BOOK_SIZE_MAX,
  PPR_BOOK_SIZE_MIN,
  PPR_BOOK_STEP,
  PPR_FUNDING_INTERVAL_MS,
  PPR_FUNDING_RATE,
  PPR_HISTORY_STEP_MAX,
  PPR_HISTORY_STEP_MIN,
  PPR_HISTORY_VOLUME_MAX,
  PPR_HISTORY_VOLUME_MIN,
  PPR_HISTORY_WICK_MAX,
  PPR_PRICE_MAX,
  PPR_PRICE_MIN,
  PPR_SEED_OPEN_INTEREST,
  PPR_SEED_TURNOVER,
  PPR_SEED_VOLUME,
  PPR_SYMBOL,
  PPR_TICK_INTERVAL_MS,
  PPR_TRADE_MAX_COUNT,
  PPR_TRADE_PROBABILITY,
  PPR_TRADE_SIZE_MAX,
  PPR_TRADE_SIZE_MIN,
  PPR_TRADES_BUFFER_LIMIT,
} from './config';

type MessageHandler = (message: unknown) => void;

const TF_SECONDS: Record<TimeframeId, number> = {
  '1': 60,
  '5': 300,
  '15': 900,
  '60': 3_600,
  '240': 14_400,
  D: 86_400,
  W: 604_800,
};

// 本地訊息匯流排：介面與 marketWs 相同，供訂閱分派處以 isPprSymbol 路由。
function createPprBus() {
  const handlers = new Map<string, Set<MessageHandler>>();
  return {
    subscribe(topic: string, handler: MessageHandler): () => void {
      let set = handlers.get(topic);
      if (set === undefined) {
        set = new Set();
        handlers.set(topic, set);
      }
      set.add(handler);
      return () => {
        const current = handlers.get(topic);
        current?.delete(handler);
        if (current?.size === 0) handlers.delete(topic);
      };
    },
    onStatus(handler: (status: WsStatus) => void): () => void {
      // 本地合成 feed 無連線概念：恆為 connected，不觸發重連回補。
      handler('connected');
      return () => undefined;
    },
    getStatus: (): WsStatus => 'connected',
    emit(topic: string, message: unknown): void {
      handlers.get(topic)?.forEach((handler) => handler(message));
    },
    hasSubscribers(topic: string): boolean {
      return handlers.has(topic);
    },
  };
}

const bus = createPprBus();

export const pprMarketWs: MarketWsClient = {
  subscribe: (topic, handler) => bus.subscribe(topic, handler),
  onStatus: (handler) => bus.onStatus(handler),
  getStatus: () => bus.getStatus(),
};

interface FeedRuntime {
  engine: PprEngine;
  klines: Map<TimeframeId, Kline[]>;
  trades: PublicTrade[];
  bookUpdateId: number;
  tradeSeq: number;
  anchorPrice: number;
  high24h: number;
  low24h: number;
  turnover24h: number;
  volume24h: number;
  nextFundingTime: number;
}

let runtime: FeedRuntime | null = null;

function createRuntime(now: number): FeedRuntime {
  const engine = createPprEngine();
  const seed = engine.getPrice();
  return {
    engine,
    klines: new Map(),
    trades: [],
    bookUpdateId: 0,
    tradeSeq: 0,
    anchorPrice: seed,
    high24h: seed,
    low24h: seed,
    turnover24h: PPR_SEED_TURNOVER,
    volume24h: PPR_SEED_VOLUME,
    nextFundingTime: now + PPR_FUNDING_INTERVAL_MS,
  };
}

function getRuntime(now = Date.now()): FeedRuntime {
  runtime ??= createRuntime(now);
  return runtime;
}

function clampPrice(value: number): number {
  return Math.min(PPR_PRICE_MAX, Math.max(PPR_PRICE_MIN, value));
}

// 由當前價回溯生成整段歷史：反向隨機游走，蠟燭間 open=前根 close 保持連續。
function generateHistory(interval: TimeframeId, endPrice: number, endTimeMs: number): Kline[] {
  const tfSec = TF_SECONDS[interval];
  const endBucket = Math.floor(endTimeMs / 1000 / tfSec) * tfSec;
  let cursor = endPrice;
  const closes = [cursor];
  for (let index = 1; index < KLINE_HISTORY_LIMIT; index += 1) {
    const drift = uniform(Math.random, PPR_HISTORY_STEP_MIN, PPR_HISTORY_STEP_MAX);
    const direction = Math.random() < 0.5 ? -1 : 1;
    cursor = clampPrice(cursor * (1 + direction * drift));
    closes.push(cursor);
  }
  closes.reverse();
  let previousClose = closes[0] ?? endPrice;
  return closes.map((close, index) => {
    const open = index === 0 ? close : previousClose;
    previousClose = close;
    const wickUp = 1 + Math.random() * PPR_HISTORY_WICK_MAX;
    const wickDown = 1 - Math.random() * PPR_HISTORY_WICK_MAX;
    return {
      time: endBucket - (KLINE_HISTORY_LIMIT - 1 - index) * tfSec,
      open,
      high: clampPrice(Math.max(open, close) * wickUp),
      low: clampPrice(Math.min(open, close) * wickDown),
      close,
      volume: uniform(Math.random, PPR_HISTORY_VOLUME_MIN, PPR_HISTORY_VOLUME_MAX),
    };
  });
}

function ensureSeries(interval: TimeframeId, now = Date.now()): Kline[] {
  const state = getRuntime(now);
  const existing = state.klines.get(interval);
  if (existing !== undefined) return existing;
  const series = generateHistory(interval, state.engine.getPrice(), now);
  state.klines.set(interval, series);
  return series;
}

// 以不可變替換聚合最新 tick：fetch 回傳的切片不會被後續 tick 原地改寫。
function aggregateTick(
  series: Kline[],
  interval: TimeframeId,
  price: number,
  volumeChunk: number,
  nowMs: number,
): Kline {
  const tfSec = TF_SECONDS[interval];
  const bucket = Math.floor(nowMs / 1000 / tfSec) * tfSec;
  const last = series.at(-1);
  if (last === undefined || bucket > last.time) {
    const open = last?.close ?? price;
    const bar: Kline = {
      time: bucket,
      open,
      high: Math.max(open, price),
      low: Math.min(open, price),
      close: price,
      volume: volumeChunk,
    };
    series.push(bar);
    if (series.length > KLINE_HISTORY_LIMIT) series.shift();
    return bar;
  }
  const bar: Kline = {
    ...last,
    high: Math.max(last.high, price),
    low: Math.min(last.low, price),
    close: price,
    volume: last.volume + volumeChunk,
  };
  series[series.length - 1] = bar;
  return bar;
}

function emitKline(interval: TimeframeId, bar: Kline): void {
  const topic = `kline.${interval}.${PPR_SYMBOL}`;
  if (!bus.hasSubscribers(topic)) return;
  bus.emit(topic, {
    topic,
    data: [
      {
        start: bar.time * 1000,
        open: String(bar.open),
        high: String(bar.high),
        low: String(bar.low),
        close: String(bar.close),
        volume: String(bar.volume),
        confirm: false,
      },
    ],
  });
}

function emitOrderbook(price: number): void {
  const topic = `orderbook.50.${PPR_SYMBOL}`;
  if (!bus.hasSubscribers(topic)) return;
  const state = getRuntime();
  state.bookUpdateId += 1;
  const bids: [string, string][] = [];
  const asks: [string, string][] = [];
  for (let level = 1; level <= PPR_BOOK_LEVELS; level += 1) {
    const size = () => String(uniform(Math.random, PPR_BOOK_SIZE_MIN, PPR_BOOK_SIZE_MAX));
    bids.push([String(clampPrice(price * (1 - PPR_BOOK_STEP * level))), size()]);
    asks.push([String(clampPrice(price * (1 + PPR_BOOK_STEP * level))), size()]);
  }
  bus.emit(topic, { topic, type: 'snapshot', data: { b: bids, a: asks, u: state.bookUpdateId } });
}

function synthesizeTrades(price: number, nowMs: number): PublicTrade[] {
  if (Math.random() >= PPR_TRADE_PROBABILITY) return [];
  const state = getRuntime(nowMs);
  const count = 1 + Math.floor(Math.random() * PPR_TRADE_MAX_COUNT);
  const incoming: PublicTrade[] = [];
  for (let index = 0; index < count; index += 1) {
    state.tradeSeq += 1;
    incoming.push({
      id: `ppr-${state.tradeSeq}`,
      time: nowMs,
      side: Math.random() < 0.5 ? 'buy' : 'sell',
      price: clampPrice(price * (1 + (Math.random() - 0.5) * 2 * PPR_BOOK_STEP)),
      size: uniform(Math.random, PPR_TRADE_SIZE_MIN, PPR_TRADE_SIZE_MAX),
    });
  }
  state.trades = [...incoming].reverse().concat(state.trades).slice(0, PPR_TRADES_BUFFER_LIMIT);
  return incoming;
}

function emitTrades(incoming: PublicTrade[]): void {
  const topic = `publicTrade.${PPR_SYMBOL}`;
  if (incoming.length === 0 || !bus.hasSubscribers(topic)) return;
  bus.emit(topic, {
    topic,
    data: incoming.map((trade) => ({
      i: trade.id,
      T: trade.time,
      S: trade.side === 'buy' ? 'Buy' : 'Sell',
      p: String(trade.price),
      v: String(trade.size),
    })),
  });
}

function buildTicker(state: FeedRuntime, price: number, nowMs: number): Ticker {
  state.high24h = Math.max(state.high24h, price);
  state.low24h = Math.min(state.low24h, price);
  while (state.nextFundingTime <= nowMs) state.nextFundingTime += PPR_FUNDING_INTERVAL_MS;
  return {
    symbol: PPR_SYMBOL,
    lastPrice: price,
    markPrice: price,
    price24hPcnt: (price - state.anchorPrice) / state.anchorPrice,
    highPrice24h: state.high24h,
    lowPrice24h: state.low24h,
    turnover24h: state.turnover24h,
    volume24h: state.volume24h,
    fundingRate: PPR_FUNDING_RATE,
    nextFundingTime: state.nextFundingTime,
    openInterestValue: PPR_SEED_OPEN_INTEREST,
  };
}

function step(nowMs = Date.now()): void {
  const state = getRuntime(nowMs);
  const price = state.engine.tick();
  const trades = synthesizeTrades(price, nowMs);
  const tradedVolume = trades.reduce((sum, trade) => sum + trade.size, 0);
  state.volume24h += tradedVolume;
  state.turnover24h += tradedVolume * price;

  // 與真實 feed 相同介面：寫入 marketStore 同一套 setter，並驅動交易引擎 tick。
  useMarketStore.getState().setTicker(buildTicker(state, price, nowMs));
  useTradeStore.getState().applyTick(PPR_SYMBOL, price, nowMs);

  for (const [interval, series] of state.klines) {
    emitKline(interval, aggregateTick(series, interval, price, tradedVolume, nowMs));
  }
  emitTrades(trades);
  emitOrderbook(price);
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startPprFeed(): () => void {
  if (timer === null) {
    step();
    timer = setInterval(() => step(), PPR_TICK_INTERVAL_MS);
  }
  return stopPprFeed;
}

export function stopPprFeed(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

// 測試隔離用：停止排程並重建全部合成狀態。
export function resetPprFeed(): void {
  stopPprFeed();
  runtime = null;
}

export function fetchPprKlines(interval: TimeframeId, limit: number): Promise<Kline[]> {
  return Promise.resolve(ensureSeries(interval).slice(-limit));
}

export function fetchPprRecentTrades(limit: number): Promise<PublicTrade[]> {
  return Promise.resolve(getRuntime().trades.slice(0, limit));
}

export function fetchPprSparkline(): Promise<number[]> {
  return Promise.resolve(
    ensureSeries('60')
      .slice(-SPARKLINE_POINTS)
      .map((bar) => bar.close),
  );
}

// 供測試斷言 TF 秒數映射完整涵蓋設定的時間框架。
export const PPR_TF_SECONDS: Readonly<Record<TimeframeId, number>> = TF_SECONDS;
export const PPR_ALL_TIMEFRAMES = TIMEFRAMES;
