import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { useTradeStore } from '../stores/tradeStore';
import { INITIAL_BALANCE_USDT } from '../config/trading';
import { formatAmount } from '../lib/format';

export function ResetAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const resetAccount = useTradeStore((state) => state.resetAccount);
  const pushToast = useTradeStore((state) => state.pushToast);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-12 w-full items-center justify-center rounded-control border border-danger/40 text-body font-medium text-danger active:bg-short-bg"
      >
        重置模擬資金
      </button>
      <BottomSheet open={confirming} title="重置模擬資金" onClose={() => setConfirming(false)}>
        <p className="text-label leading-relaxed text-text-2">
          將清除所有持倉、掛單與歷史紀錄，並將餘額重置為{' '}
          <span className="font-semibold tabular-nums">
            {formatAmount(INITIAL_BALANCE_USDT, 0)} USDT
          </span>
          。此操作無法復原。
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="flex h-12 flex-1 items-center justify-center rounded-control border border-border text-body text-text-2 active:bg-surface-2"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              resetAccount();
              setConfirming(false);
              pushToast({ tone: 'warning', title: '模擬資金已重置' });
            }}
            className="flex h-12 flex-1 items-center justify-center rounded-control bg-danger text-body font-semibold text-text active:opacity-90"
          >
            確認重置
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
