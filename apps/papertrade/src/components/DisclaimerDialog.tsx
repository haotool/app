import { useEffect, useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { DISCLAIMER_STORAGE_KEY } from '../config/trading';
import { useFocusTrap } from '../hooks/useFocusTrap';

export const DISCLAIMER_TEXT =
  'PaperTrade 為純模擬交易工具，使用虛擬資金，不涉及任何真實下單與金流，內容不構成投資建議。行情數據來源為 Bybit 公開市場行情，可能存在延遲或誤差。';

function readAcknowledged(): boolean {
  try {
    return window.localStorage.getItem(DISCLAIMER_STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

export function DisclaimerDialog() {
  const [acknowledged, setAcknowledged] = useState(readAcknowledged);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, !acknowledged);

  useEffect(() => {
    if (!acknowledged) dialogRef.current?.focus();
  }, [acknowledged]);

  if (acknowledged) return null;

  function acknowledge() {
    try {
      window.localStorage.setItem(DISCLAIMER_STORAGE_KEY, '1');
    } catch {
      // localStorage 不可用時仍允許本次進入。
    }
    setAcknowledged(true);
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-lg items-center justify-center px-6">
      <div className="backdrop-in absolute inset-0 bg-bg/70 backdrop-blur-sm" aria-hidden />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label="免責聲明"
        tabIndex={-1}
        className="dialog-in relative z-10 w-full rounded-card border border-border bg-surface p-5 outline-none"
      >
        <span className="flex size-11 items-center justify-center rounded-control bg-warning/15 text-warning">
          <ShieldAlert size={22} aria-hidden />
        </span>
        <h2 className="mt-3 text-price-lg font-semibold">免責聲明</h2>
        <p className="mt-2 text-label leading-relaxed text-text-2">{DISCLAIMER_TEXT}</p>
        <button
          type="button"
          onClick={acknowledge}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-control bg-primary text-body font-semibold text-text active:bg-primary-pressed"
        >
          我已了解，開始模擬交易
        </button>
      </div>
    </div>
  );
}
