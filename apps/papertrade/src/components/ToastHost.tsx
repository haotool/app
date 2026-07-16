import { useEffect } from 'react';
import clsx from 'clsx';
import { AlertTriangle, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { useTradeStore, type ToastItem } from '../stores/tradeStore';
import { TOAST_DURATION_MS } from '../config/trading';

const TONE_STYLES = {
  long: 'border-long/40 text-long',
  short: 'border-short/40 text-short',
  warning: 'border-warning text-warning',
  info: 'border-primary/40 text-primary',
} as const;

const TONE_ICONS = {
  long: TrendingUp,
  short: TrendingDown,
  warning: AlertTriangle,
  info: Info,
} as const;

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = TONE_ICONS[toast.tone];

  return (
    <div
      role="status"
      className={clsx(
        'toast-in pointer-events-auto relative flex w-full items-start gap-2.5 rounded-control border bg-surface-2/95 px-3.5 py-2.5 backdrop-blur',
        TONE_STYLES[toast.tone],
        toast.tone === 'warning' && 'warning-pulse',
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-label font-semibold">{toast.title}</p>
        {toast.description !== undefined && (
          <p className="mt-0.5 text-caption text-text-2 tabular-nums">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        aria-label="關閉通知"
        onClick={() => onDismiss(toast.id)}
        className="-my-2.5 -mr-2.5 flex size-11 shrink-0 items-center justify-center text-text-3"
      >
        ×
      </button>
    </div>
  );
}

export function ToastHost() {
  const toasts = useTradeStore((state) => state.toasts);
  const dismissToast = useTradeStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 mx-auto flex max-w-lg flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
