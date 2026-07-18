import { useState } from 'react';
import clsx from 'clsx';
import { SYMBOL_META } from '../../config/market';
import { liquidationPrice, roePercent, unrealizedPnl } from '../../engine/math';
import { type Position } from '../../engine/types';
import { useMarketStore } from '../../stores/marketStore';
import { useTradeStore } from '../../stores/tradeStore';
import { formatAmount, formatPrice, formatSignedPnl } from '../../lib/format';
import { TRADE_ERROR_MESSAGES } from '../../lib/tradeForm';
import { QTY_DISPLAY_DECIMALS } from '../../config/trading';
import { TpSlSheet } from './TpSlSheet';
import { TrailingSheet } from './TrailingSheet';
import { CloseSheet } from './CloseSheet';

type SheetKind = 'tpsl' | 'trailing' | 'close' | null;

function signedUsdt(value: number): string {
  const sign = value >= 0 ? '+' : '−';
  return `${sign}${formatAmount(Math.abs(value), 2)}`;
}

export function PositionCard({ position }: { position: Position }) {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const ticker = useMarketStore((state) => state.tickers[position.symbol]);
  const closeMarketOrder = useTradeStore((state) => state.closeMarketOrder);
  const pushToast = useTradeStore((state) => state.pushToast);

  const mark = ticker?.markPrice;
  const pnl =
    mark !== undefined
      ? unrealizedPnl(position.side, position.entryPrice, mark, position.qty)
      : null;
  const roe = pnl !== null ? roePercent(pnl, position.margin) : null;
  const liq = liquidationPrice(position.side, position.entryPrice, position.leverage);
  const isLong = position.side === 'long';
  const pnlPositive = (pnl ?? 0) >= 0;
  const base = SYMBOL_META[position.symbol].base;

  // R5-5 一鍵平倉：單擊即以標記價市價全平，不彈確認框，成敗一律 toast 回報。
  function closeAtMarket() {
    if (mark === undefined) {
      pushToast({ tone: 'warning', title: '平倉失敗', description: '行情尚未就緒，請稍候再試。' });
      return;
    }
    const result = closeMarketOrder({ positionId: position.id, fraction: 1, price: mark });
    if (!result.ok) {
      pushToast({
        tone: 'warning',
        title: '平倉失敗',
        description: TRADE_ERROR_MESSAGES[result.error],
      });
      return;
    }
    const realized = result.trade.realizedPnl;
    pushToast({
      tone: realized >= 0 ? 'long' : 'short',
      title: `市價平倉完成：${base}/USDT`,
      description: `${formatSignedPnl(realized)} USDT`,
    });
  }

  return (
    <article className="card-in rounded-card border border-border bg-surface p-3.5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-body font-semibold">
            {base}
            <span className="text-text-3">/USDT</span>
          </h3>
          <span
            className={clsx(
              'rounded px-1.5 py-0.5 text-caption font-medium',
              isLong ? 'bg-long-bg text-long' : 'bg-short-bg text-short',
            )}
          >
            {isLong ? '多' : '空'} {formatAmount(position.leverage, 1)}x
          </span>
        </div>
        <div className="text-right">
          <p
            className={clsx(
              'text-price-lg font-semibold tabular-nums',
              pnlPositive ? 'text-long' : 'text-short',
            )}
          >
            {pnl !== null ? signedUsdt(pnl) : '--'}
          </p>
          <p
            className={clsx('text-caption tabular-nums', pnlPositive ? 'text-long' : 'text-short')}
          >
            {roe !== null ? `${roe >= 0 ? '+' : '−'}${Math.abs(roe).toFixed(2)}%` : '--'}
          </p>
        </div>
      </header>

      <dl className="mt-3 grid grid-cols-4 gap-x-2 gap-y-1 text-caption">
        <div>
          <dt className="text-text-3">數量（{base}）</dt>
          <dd className="mt-0.5 text-text-2 tabular-nums">
            {formatAmount(position.qty, QTY_DISPLAY_DECIMALS)}
          </dd>
        </div>
        <div>
          <dt className="text-text-3">開倉價</dt>
          <dd className="mt-0.5 text-text-2 tabular-nums">{formatPrice(position.entryPrice)}</dd>
        </div>
        <div>
          <dt className="text-text-3">標記價</dt>
          <dd className="mt-0.5 text-text-2 tabular-nums">
            {mark !== undefined ? formatPrice(mark) : '--'}
          </dd>
        </div>
        <div>
          <dt className="text-text-3">強平價</dt>
          <dd className="mt-0.5 text-warning tabular-nums">{formatPrice(liq)}</dd>
        </div>
      </dl>

      {(position.takeProfit !== null ||
        position.stopLoss !== null ||
        position.trailing !== null) && (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-caption text-text-3 tabular-nums">
          {position.takeProfit !== null && <span>止盈 {formatPrice(position.takeProfit)}</span>}
          {position.stopLoss !== null && <span>止損 {formatPrice(position.stopLoss)}</span>}
          {position.trailing !== null && (
            <span>
              追蹤{' '}
              {position.trailing.active
                ? '已啟動'
                : `${formatPrice(position.trailing.activationPrice)} 啟動`}
              ｜回撤 {formatPrice(position.trailing.distance)}
            </span>
          )}
        </p>
      )}

      {/* R5-5 操作列順序：平倉 → 部分 → 止盈止損 → 追蹤，一鍵平倉 primary 置首。 */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          aria-label="市價全平"
          onClick={closeAtMarket}
          className="min-h-11 min-w-11 flex-1 rounded-control bg-primary text-label font-semibold text-text active:bg-primary-pressed"
        >
          平倉
        </button>
        <button
          type="button"
          aria-label="部分平倉"
          onClick={() => setSheet('close')}
          className="min-h-11 min-w-11 flex-1 rounded-control bg-primary/15 text-label font-medium text-primary active:bg-primary/25"
        >
          部分
        </button>
        <button
          type="button"
          onClick={() => setSheet('tpsl')}
          className="min-h-11 min-w-11 flex-1 rounded-control bg-surface-2 text-label text-text-2 active:bg-border"
        >
          止盈止損
        </button>
        <button
          type="button"
          onClick={() => setSheet('trailing')}
          className="min-h-11 min-w-11 flex-1 rounded-control bg-surface-2 text-label text-text-2 active:bg-border"
        >
          追蹤
        </button>
      </div>

      {sheet === 'tpsl' && <TpSlSheet open position={position} onClose={() => setSheet(null)} />}
      {sheet === 'trailing' && (
        <TrailingSheet open position={position} onClose={() => setSheet(null)} />
      )}
      {sheet === 'close' && <CloseSheet open position={position} onClose={() => setSheet(null)} />}
    </article>
  );
}
