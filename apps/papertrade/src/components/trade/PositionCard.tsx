import { useState } from 'react';
import clsx from 'clsx';
import { SYMBOL_META } from '../../config/market';
import {
  estimatedCrossLiquidationPrice,
  liquidationPrice,
  roePercent,
  unrealizedPnl,
  type MarkMap,
} from '../../engine/math';
import { type Position } from '../../engine/types';
import { useMarketStore } from '../../stores/marketStore';
import { useTradeStore } from '../../stores/tradeStore';
import { formatAmount, formatPrice, formatSignedPercent, formatSignedPnl } from '../../lib/format';
import { TRADE_ERROR_MESSAGES } from '../../lib/tradeForm';
import { QTY_DISPLAY_DECIMALS } from '../../config/trading';
import { PriceFlash } from '../PriceFlash';
import { TpSlSheet } from './TpSlSheet';
import { TrailingSheet } from './TrailingSheet';
import { CloseSheet } from './CloseSheet';

type SheetKind = 'tpsl' | 'trailing' | 'close' | null;

export function PositionCard({ position }: { position: Position }) {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const ticker = useMarketStore((state) => state.tickers[position.symbol]);
  const account = useTradeStore((state) => state.account);
  const closeMarketOrder = useTradeStore((state) => state.closeMarketOrder);
  const pushToast = useTradeStore((state) => state.pushToast);
  const isCross = position.marginMode === 'cross';
  // cross 估算強平價（ADR-R6-02，僅顯示參考；真實觸發為聚合 MM 檢查）：null 顯示 --。
  const crossLiq = useMarketStore((state) => {
    if (!isCross) return null;
    const marks: MarkMap = {};
    for (const held of account.positions) {
      const heldTicker = state.tickers[held.symbol];
      if (heldTicker !== undefined) marks[held.symbol] = heldTicker.markPrice;
    }
    return estimatedCrossLiquidationPrice(position, account, marks);
  });

  const mark = ticker?.markPrice;
  const pnl =
    mark !== undefined
      ? unrealizedPnl(position.side, position.entryPrice, mark, position.qty)
      : null;
  const roe = pnl !== null ? roePercent(pnl, position.margin) : null;
  const liq = isCross
    ? crossLiq
    : liquidationPrice(position.side, position.entryPrice, position.leverage);
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
          {/* 模式×槓桿合併 chip（R6-2/R6-8）：多空色相不變，補保證金模式語意。 */}
          <span
            className={clsx(
              'rounded px-1.5 py-0.5 text-caption font-medium',
              isLong ? 'bg-long-bg text-long' : 'bg-short-bg text-short',
            )}
          >
            {isLong ? '多' : '空'}｜{isCross ? '全倉' : '逐倉'} {formatAmount(position.leverage, 1)}
            x
          </span>
        </div>
        {/* R6-4 觀察面：uPnL/ROE 以 markRevision 驅動 flash，僅標記價真變動時刷新，
            flash 色相隨當前損益方向；標記價 caption 讓使用者對照強平依據的數值。 */}
        <div className="text-right">
          <PriceFlash
            direction={pnl === null ? null : pnlPositive ? 'up' : 'down'}
            revision={ticker?.markRevision ?? 0}
            className={clsx(
              'block text-price-lg font-semibold',
              pnlPositive ? 'text-long' : 'text-short',
            )}
          >
            {pnl !== null ? formatSignedPnl(pnl) : '--'}
          </PriceFlash>
          <PriceFlash
            direction={pnl === null ? null : pnlPositive ? 'up' : 'down'}
            revision={ticker?.markRevision ?? 0}
            className={clsx('block text-caption', pnlPositive ? 'text-long' : 'text-short')}
          >
            {roe !== null ? formatSignedPercent(roe) : '--'}
          </PriceFlash>
          <p className="mt-0.5 text-caption text-text-3 tabular-nums">
            {`標記價 ${mark !== undefined ? formatPrice(mark, position.symbol) : '--'}`}
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
          <dd className="mt-0.5 text-text-2 tabular-nums">
            {formatPrice(position.entryPrice, position.symbol)}
          </dd>
        </div>
        <div>
          <dt className="text-text-3">標記價</dt>
          <dd className="mt-0.5 text-text-2 tabular-nums">
            {mark !== undefined ? formatPrice(mark, position.symbol) : '--'}
          </dd>
        </div>
        <div>
          <dt className="text-text-3">強平價{isCross ? '（估算）' : ''}</dt>
          <dd className="mt-0.5 text-warning tabular-nums">
            {liq !== null ? formatPrice(liq, position.symbol) : '--'}
          </dd>
        </div>
      </dl>

      {(position.takeProfit !== null ||
        position.stopLoss !== null ||
        position.trailing !== null) && (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-caption text-text-3 tabular-nums">
          {position.takeProfit !== null && (
            <span>止盈 {formatPrice(position.takeProfit, position.symbol)}</span>
          )}
          {position.stopLoss !== null && (
            <span>止損 {formatPrice(position.stopLoss, position.symbol)}</span>
          )}
          {position.trailing !== null && (
            <span>
              追蹤{' '}
              {position.trailing.active
                ? '已啟動'
                : `${formatPrice(position.trailing.activationPrice, position.symbol)} 啟動`}
              ｜回撤 {formatPrice(position.trailing.distance, position.symbol)}
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
