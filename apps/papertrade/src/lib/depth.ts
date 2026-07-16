import { type OrderBook } from '../services/orderbook';

export interface DepthPoint {
  price: number;
  cumulative: number;
}

export interface DepthProfile {
  bids: DepthPoint[];
  asks: DepthPoint[];
  midPrice: number | null;
  domainMin: number;
  domainMax: number;
  maxCumulative: number;
}

export interface DepthHit {
  side: 'bid' | 'ask';
  price: number;
  cumulative: number;
}

function accumulate(levels: OrderBook['bids']): DepthPoint[] {
  const points: DepthPoint[] = [];
  let total = 0;
  for (const [price, size] of levels) {
    total += size;
    points.push({ price, cumulative: total });
  }
  return points;
}

// 由訂單簿建構深度輪廓：bids 自最佳價向下、asks 自最佳價向上累加。
// 顯示域以中間價對稱展開，確保中心標記固定於圖表中央。
export function computeDepthProfile(book: OrderBook): DepthProfile {
  const bids = accumulate(book.bids);
  const asks = accumulate(book.asks);
  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;
  const maxCumulative = Math.max(bids.at(-1)?.cumulative ?? 0, asks.at(-1)?.cumulative ?? 0);

  if (bestBid === undefined || bestAsk === undefined) {
    return { bids, asks, midPrice: null, domainMin: 0, domainMax: 0, maxCumulative };
  }

  const midPrice = (bestBid + bestAsk) / 2;
  const worstBid = bids.at(-1)?.price ?? bestBid;
  const worstAsk = asks.at(-1)?.price ?? bestAsk;
  const span = Math.max(midPrice - worstBid, worstAsk - midPrice);
  return {
    bids,
    asks,
    midPrice,
    domainMin: midPrice - span,
    domainMax: midPrice + span,
    maxCumulative,
  };
}

// 取指定價格所在階梯的檔位與累計量：買側取價格 >= 查詢價的最深檔，賣側對稱。
// 位於價差內回 null；超出最劣檔視為總量（曲線向域邊緣平坦延伸）。
export function depthAtPrice(profile: DepthProfile, price: number): DepthHit | null {
  if (profile.midPrice === null) return null;

  if (price <= profile.midPrice) {
    let hit: DepthPoint | null = null;
    for (const point of profile.bids) {
      if (point.price >= price) hit = point;
      else break;
    }
    return hit === null ? null : { side: 'bid', price: hit.price, cumulative: hit.cumulative };
  }

  let hit: DepthPoint | null = null;
  for (const point of profile.asks) {
    if (point.price <= price) hit = point;
    else break;
  }
  return hit === null ? null : { side: 'ask', price: hit.price, cumulative: hit.cumulative };
}
