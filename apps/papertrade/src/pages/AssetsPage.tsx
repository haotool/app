import { useState } from 'react';
import clsx from 'clsx';
import { History } from 'lucide-react';
import { SYMBOL_META, type MarketSymbol } from '../config/market';
import { QTY_DISPLAY_DECIMALS } from '../config/trading';
import { getAccountMetrics } from '../engine/engine';
import { type CloseReason } from '../engine/types';
import { useMarketStore } from '../stores/marketStore';
import { useTradeStore } from '../stores/tradeStore';
import { formatAmount, formatPrice } from '../lib/format';
import { resolveDailyEquityBaseline } from '../lib/dailyEquity';
import { ResetAccountButton } from '../components/ResetAccountButton';

const REASON_LABELS: Record<CloseReason, string> = {
  manual: '手動',
  tp: '止盈',
  sl: '止損',
  trailing: '追蹤',
  liquidation: '強平',
};

function signedUsdt(value: number): string {
  const sign = value >= 0 ? '+' : '−';
  return `${sign}${formatAmount(Math.abs(value), 2)}`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function AssetsPage() {
  const account = useTradeStore((state) => state.account);
  const tickers = useMarketStore((state) => state.tickers);

  const marks: Partial<Record<MarketSymbol, number>> = {};
  for (const position of account.positions) {
    const ticker = tickers[position.symbol];
    if (ticker !== undefined) marks[position.symbol] = ticker.markPrice;
  }
  const metrics = getAccountMetrics(account, marks);
  const upnlPositive = metrics.totalUpnl >= 0;

  // 當日起始權益以本地日界快照；掛載時解析一次，跨日於下次進入頁面時重建。
  const [dailyBaseline] = useState(() =>
    resolveDailyEquityBaseline(window.localStorage, new Date(), metrics.equity),
  );
  const dailyChange = metrics.equity - dailyBaseline;
  const dailyChangePercent = dailyBaseline > 0 ? (dailyChange / dailyBaseline) * 100 : null;
  const dailyPositive = dailyChange >= 0;

  return (
    <div className="flex flex-col px-4 pb-6">
      <header className="pb-4 pt-5">
        <p className="text-caption text-text-3">總權益（USDT）</p>
        <p className="mt-1 text-price-xl font-semibold tabular-nums">
          {formatAmount(metrics.equity, 2)}
        </p>
        <p
          className={clsx(
            'mt-1 text-label font-medium tabular-nums',
            dailyPositive ? 'text-long' : 'text-short',
          )}
        >
          今日變化 {signedUsdt(dailyChange)}
          {dailyChangePercent !== null &&
            `（${dailyChangePercent >= 0 ? '+' : '−'}${Math.abs(dailyChangePercent).toFixed(2)}%）`}
        </p>
      </header>

      <dl className="grid grid-cols-3 gap-2">
        <div className="rounded-card border border-border bg-surface p-3">
          <dt className="text-caption text-text-3">可用</dt>
          <dd className="mt-1 text-label font-medium tabular-nums">
            {formatAmount(metrics.available, 2)}
          </dd>
        </div>
        <div className="rounded-card border border-border bg-surface p-3">
          <dt className="text-caption text-text-3">佔用保證金</dt>
          <dd className="mt-1 text-label font-medium tabular-nums">
            {formatAmount(metrics.usedMargin, 2)}
          </dd>
        </div>
        <div className="rounded-card border border-border bg-surface p-3">
          <dt className="text-caption text-text-3">未實現損益</dt>
          <dd
            className={clsx(
              'mt-1 text-label font-medium tabular-nums',
              upnlPositive ? 'text-long' : 'text-short',
            )}
          >
            {signedUsdt(metrics.totalUpnl)}
          </dd>
        </div>
      </dl>

      <section aria-label="平倉歷史" className="pt-6">
        <h2 className="text-label font-medium text-text-2">
          平倉歷史 <span className="tabular-nums">({account.history.length})</span>
        </h2>
        {account.history.length === 0 ? (
          <div className="mt-2 flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-4 py-8 text-center">
            <History size={26} className="text-text-3" aria-hidden />
            <p className="text-label text-text-2">尚無平倉紀錄</p>
            <p className="text-caption text-text-3">完成第一筆交易後，紀錄會顯示在這裡。</p>
          </div>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {account.history.map((trade) => {
              const isLong = trade.side === 'long';
              const pnlPositive = trade.realizedPnl >= 0;
              return (
                <li
                  key={trade.id}
                  className="rounded-card border border-border bg-surface px-3.5 py-2.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-label font-medium">
                      {SYMBOL_META[trade.symbol].base}
                      <span className="text-text-3">/USDT</span>
                      <span
                        className={clsx(
                          'rounded px-1 py-0.5 text-caption',
                          isLong ? 'bg-long-bg text-long' : 'bg-short-bg text-short',
                        )}
                      >
                        {isLong ? '多' : '空'}
                      </span>
                      <span
                        className={clsx(
                          'rounded px-1 py-0.5 text-caption',
                          trade.reason === 'liquidation'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-surface-2 text-text-3',
                        )}
                      >
                        {REASON_LABELS[trade.reason]}
                      </span>
                    </p>
                    <p
                      className={clsx(
                        'text-label font-semibold tabular-nums',
                        pnlPositive ? 'text-long' : 'text-short',
                      )}
                    >
                      {signedUsdt(trade.realizedPnl)}
                    </p>
                  </div>
                  <p className="mt-1 text-caption text-text-3 tabular-nums">
                    {formatAmount(trade.qty, QTY_DISPLAY_DECIMALS)}｜開{' '}
                    {formatPrice(trade.entryPrice)} → 平 {formatPrice(trade.exitPrice)}
                  </p>
                  <p className="mt-0.5 flex justify-between text-caption text-text-3 tabular-nums">
                    <span>手續費 {formatAmount(trade.openFee + trade.fee, 4)} USDT</span>
                    <span>{formatTime(trade.closedAt)}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="pt-6">
        <ResetAccountButton />
      </div>
    </div>
  );
}
