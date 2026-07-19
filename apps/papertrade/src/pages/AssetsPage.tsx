import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ChartColumn, History } from 'lucide-react';
import { SYMBOL_META, type MarketSymbol } from '../config/market';
import { HISTORY_MAX_ENTRIES, QTY_DISPLAY_DECIMALS } from '../config/trading';
import { getAccountMetrics } from '../engine/engine';
import { type ClosedTrade, type CloseReason } from '../engine/types';
import { useMarketStore } from '../stores/marketStore';
import { useTradeStore } from '../stores/tradeStore';
import { formatAmount, formatPrice, formatSignedPercent, formatSignedPnl } from '../lib/format';
import { resolveDailyEquityBaseline } from '../lib/dailyEquity';
import { computePracticeStats } from '../lib/practiceStats';
import { EmptyState } from '../components/EmptyState';
import { ResetAccountButton } from '../components/ResetAccountButton';

const REASON_LABELS: Record<CloseReason, string> = {
  manual: '手動',
  tp: '止盈',
  sl: '止損',
  trailing: '追蹤',
  liquidation: '強平',
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatProfitFactor(value: number | null): string {
  if (value === null) return '--';
  return Number.isFinite(value) ? value.toFixed(2) : '∞';
}

function StatCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface p-3">
      <dt className="text-caption text-text-3">{label}</dt>
      <dd className="mt-1 text-label font-medium tabular-nums">{children}</dd>
    </div>
  );
}

function PracticeStatsSection({ history }: { history: ClosedTrade[] }) {
  const stats = computePracticeStats(history);

  return (
    <section aria-label="練習統計" className="pt-6">
      <h2 className="text-label font-medium text-text-2">
        練習統計
        {history.length >= HISTORY_MAX_ENTRIES && (
          <span className="ml-1 text-caption font-normal text-text-3">
            （近 {HISTORY_MAX_ENTRIES} 筆）
          </span>
        )}
      </h2>
      {history.length === 0 ? (
        <EmptyState
          icon={ChartColumn}
          title="尚無統計資料"
          description="完成首筆平倉後，此處將顯示練習統計。"
          className="mt-2"
        />
      ) : (
        <dl className="mt-2 grid grid-cols-3 gap-2">
          <StatCard label="總交易數">{stats.totalTrades}</StatCard>
          <StatCard label="勝率">{(stats.winRate * 100).toFixed(1)}%</StatCard>
          <StatCard label="總實現損益">
            <span className={stats.totalPnl >= 0 ? 'text-long' : 'text-short'}>
              {formatSignedPnl(stats.totalPnl)}
            </span>
          </StatCard>
          <StatCard label="總手續費">{formatAmount(stats.totalFees, 2)}</StatCard>
          <StatCard label="最大單筆盈/虧">
            <span className={stats.maxWin === null ? 'text-text-3' : 'text-long'}>
              {stats.maxWin === null ? '--' : formatSignedPnl(stats.maxWin)}
            </span>
            <span className="text-text-3"> / </span>
            <span className={stats.maxLoss === null ? 'text-text-3' : 'text-short'}>
              {stats.maxLoss === null ? '--' : formatSignedPnl(stats.maxLoss)}
            </span>
          </StatCard>
          <StatCard label="獲利因子">{formatProfitFactor(stats.profitFactor)}</StatCard>
        </dl>
      )}
    </section>
  );
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
    <div className="flex flex-col px-4 pb-6 lg:mx-auto lg:max-w-2xl">
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
          今日變化 {formatSignedPnl(dailyChange)}
          {dailyChangePercent !== null && `（${formatSignedPercent(dailyChangePercent)}）`}
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
            {formatSignedPnl(metrics.totalUpnl)}
          </dd>
        </div>
      </dl>

      <PracticeStatsSection history={account.history} />

      <section aria-label="平倉歷史" className="pt-6">
        <h2 className="text-label font-medium text-text-2">
          平倉歷史 <span className="tabular-nums">({account.history.length})</span>
        </h2>
        {account.history.length === 0 ? (
          <EmptyState
            icon={History}
            title="尚無平倉紀錄"
            description="完成首筆平倉後，紀錄將顯示於此。"
            className="mt-2"
          />
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
                      {/* pair 名收成單一節點，避免窄幅下「BTC」與「/USDT」被拆行。 */}
                      <span className="whitespace-nowrap">
                        {SYMBOL_META[trade.symbol].base}
                        <span className="text-text-3">/USDT</span>
                      </span>
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
                      {formatSignedPnl(trade.realizedPnl)}
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
