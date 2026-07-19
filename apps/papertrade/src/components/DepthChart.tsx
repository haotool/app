import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { DEPTH_REDRAW_INTERVAL_MS, type MarketSymbol } from '../config/market';
import { useOrderbook } from '../hooks/useOrderbook';
import {
  computeDepthProfile,
  depthAtPrice,
  type DepthPoint,
  type DepthProfile,
} from '../lib/depth';
import { type OrderBook } from '../services/orderbook';
import { formatAmount, formatPrice } from '../lib/format';

const VIEW = 100;
const HEADROOM = 1.05;

interface DepthChartProps {
  symbol: MarketSymbol;
}

// 訂單簿 tick 高頻：以固定間隔取樣，深度曲線重算與 DOM 更新最多每 300ms 一次。
function useSampledBook(book: OrderBook): OrderBook {
  const [sampled, setSampled] = useState(book);
  const latestRef = useRef(book);

  useEffect(() => {
    latestRef.current = book;
  }, [book]);

  useEffect(() => {
    const id = setInterval(() => {
      setSampled((previous) => (previous === latestRef.current ? previous : latestRef.current));
    }, DEPTH_REDRAW_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return sampled;
}

interface DepthPaths {
  bidFill: string;
  bidStroke: string;
  askFill: string;
  askStroke: string;
  midX: number;
}

function buildPaths(profile: DepthProfile): DepthPaths | null {
  if (profile.midPrice === null || profile.domainMax === profile.domainMin) return null;
  const xOf = (price: number) =>
    ((price - profile.domainMin) / (profile.domainMax - profile.domainMin)) * VIEW;
  const yOf = (cumulative: number) =>
    VIEW - (cumulative / (profile.maxCumulative * HEADROOM)) * VIEW;

  const bidPoints: string[] = [];
  const worstToBestBids = [...profile.bids].reverse();
  bidPoints.push(`${xOf(profile.domainMin)},${yOf(worstToBestBids[0]?.cumulative ?? 0)}`);
  worstToBestBids.forEach((point: DepthPoint, index: number) => {
    const x = xOf(point.price);
    bidPoints.push(`${x},${yOf(point.cumulative)}`);
    bidPoints.push(`${x},${yOf(worstToBestBids[index + 1]?.cumulative ?? 0)}`);
  });
  const bidStroke = `M${bidPoints.join(' L')}`;
  const bidFill = `${bidStroke} L${xOf(profile.domainMin)},${VIEW} Z`;

  const askPoints: string[] = [];
  profile.asks.forEach((point: DepthPoint, index: number) => {
    const x = xOf(point.price);
    askPoints.push(`${x},${yOf(profile.asks[index - 1]?.cumulative ?? 0)}`);
    askPoints.push(`${x},${yOf(point.cumulative)}`);
  });
  askPoints.push(`${xOf(profile.domainMax)},${yOf(profile.asks.at(-1)?.cumulative ?? 0)}`);
  const askStroke = `M${askPoints.join(' L')}`;
  const askFill = `${askStroke} L${xOf(profile.domainMax)},${VIEW} Z`;

  return { bidFill, bidStroke, askFill, askStroke, midX: xOf(profile.midPrice) };
}

function DepthSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 p-3" aria-label="深度圖載入中">
      <span className="skeleton-pulse h-5 w-full rounded" />
      <span className="skeleton-pulse h-40 w-full rounded" />
    </div>
  );
}

export function DepthChart({ symbol }: DepthChartProps) {
  const book = useOrderbook(symbol);
  const sampled = useSampledBook(book);
  const profile = useMemo(() => computeDepthProfile(sampled), [sampled]);
  const paths = useMemo(() => buildPaths(profile), [profile]);
  const [probePrice, setProbePrice] = useState<number | null>(null);

  if (profile.midPrice === null || paths === null) {
    return <DepthSkeleton />;
  }

  const hit = probePrice === null ? null : depthAtPrice(profile, probePrice);
  const domainSpan = profile.domainMax - profile.domainMin;
  const hitX = hit === null ? null : ((hit.price - profile.domainMin) / domainSpan) * VIEW;

  function handleTap(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    setProbePrice(profile.domainMin + ratio * domainSpan);
  }

  // 鍵盤等效：左右鍵以域寬 2% 步進探針（未設時自中間價起），Escape 清除。
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setProbePrice(null);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = domainSpan * 0.02 * (event.key === 'ArrowLeft' ? -1 : 1);
    const base = probePrice ?? profile.midPrice ?? 0;
    setProbePrice(Math.min(Math.max(base + step, profile.domainMin), profile.domainMax));
  }

  return (
    <section aria-label="市場深度" className="p-3">
      <p aria-live="polite" className="mb-1.5 px-1 text-caption text-text-3 tabular-nums">
        {hit === null ? (
          '點按或以方向鍵探索檔位累計量'
        ) : (
          <>
            <span className={hit.side === 'bid' ? 'text-long' : 'text-short'}>
              {hit.side === 'bid' ? '買' : '賣'} {formatPrice(hit.price, symbol)}
            </span>
            <span className="text-text-2">｜累計 {formatAmount(hit.cumulative)}</span>
          </>
        )}
      </p>
      <div
        data-testid="depth-chart"
        role="button"
        tabIndex={0}
        aria-label="探索市場深度檔位"
        className="relative h-40 touch-manipulation rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        onClick={handleTap}
        onKeyDown={handleKeyDown}
      >
        <svg
          role="img"
          aria-label="市場深度圖"
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <path
            data-testid="depth-bid-area"
            d={paths.bidFill}
            fill="var(--color-long)"
            fillOpacity="0.2"
          />
          <path
            d={paths.bidStroke}
            fill="none"
            stroke="var(--color-long)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            data-testid="depth-ask-area"
            d={paths.askFill}
            fill="var(--color-short)"
            fillOpacity="0.2"
          />
          <path
            d={paths.askStroke}
            fill="none"
            stroke="var(--color-short)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={paths.midX}
            x2={paths.midX}
            y1="0"
            y2={VIEW}
            stroke="var(--color-text-3)"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
            aria-hidden
          />
          {hitX !== null && (
            <line
              x1={hitX}
              x2={hitX}
              y1="0"
              y2={VIEW}
              stroke="var(--color-text-2)"
              vectorEffect="non-scaling-stroke"
              aria-hidden
            />
          )}
        </svg>
        <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded bg-surface-2/80 px-1.5 text-caption text-text-2 tabular-nums">
          {formatPrice(profile.midPrice, symbol)}
        </span>
      </div>
      <div className="mt-1 flex justify-between px-1 text-caption text-text-3 tabular-nums">
        <span>{formatPrice(profile.domainMin, symbol)}</span>
        <span>{formatPrice(profile.domainMax, symbol)}</span>
      </div>
    </section>
  );
}
