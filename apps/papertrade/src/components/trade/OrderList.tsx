import clsx from 'clsx';
import { SYMBOL_META } from '../../config/market';
import { useTradeStore } from '../../stores/tradeStore';
import { formatAmount, formatPrice } from '../../lib/format';
import { QTY_DISPLAY_DECIMALS } from '../../config/trading';

export function OrderList() {
  const orders = useTradeStore((state) => state.account.orders);
  const cancelPendingOrder = useTradeStore((state) => state.cancelPendingOrder);
  const pushToast = useTradeStore((state) => state.pushToast);

  // R5-5：與持倉區堆疊常駐同顯，空狀態以單行精簡呈現。
  return (
    <section aria-label="當前委託" className="px-4 pt-4">
      <h2 className="text-label font-medium text-text-2">
        當前委託 <span className="tabular-nums">({orders.length})</span>
      </h2>
      {orders.length === 0 && <p className="mt-2 text-caption text-text-3">尚無委託</p>}
      {orders.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {orders.map((order) => {
            const isLong = order.side === 'long';
            return (
              <li
                key={order.id}
                className="flex items-center gap-3 rounded-card border border-border bg-surface px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-label font-medium">
                    {SYMBOL_META[order.symbol].base}
                    <span className="text-text-3">/USDT</span>
                    <span
                      className={clsx(
                        'rounded px-1 py-0.5 text-caption',
                        isLong ? 'bg-long-bg text-long' : 'bg-short-bg text-short',
                      )}
                    >
                      {order.kind === 'close' ? '平' : ''}
                      {isLong ? '多' : '空'}
                    </span>
                  </p>
                  <p className="mt-0.5 text-caption text-text-3 tabular-nums">
                    {formatAmount(order.qty, QTY_DISPLAY_DECIMALS)} @{' '}
                    {formatPrice(order.limitPrice)}
                    {order.kind === 'open' &&
                      `｜佔用 ${formatAmount(order.margin + order.fee, 2)} USDT`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const result = cancelPendingOrder(order.id);
                    if (result.ok) {
                      pushToast({ tone: order.side, title: '已撤銷委託' });
                    }
                  }}
                  className="min-h-11 min-w-11 shrink-0 rounded-control border border-border px-3 text-caption text-text-2 active:bg-surface-2"
                >
                  撤單
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
