import { useEffect } from 'react';
import { Check } from 'lucide-react';

export interface ToastMessage {
  /** 每次觸發遞增，重啟 CSS 生命週期動畫（後到覆蓋，同時最多一則）。 */
  id: number;
  message: string;
  success?: boolean;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

/**
 * Toast（deep-dive §4.6）：底部置中（safe-area 之上）、墨底白字、進場 200ms → 停留 2s → 離場 200ms。
 * 生命週期由 CSS animation（toast-life 2400ms）呈現，JS 定時移除節點；不可點。
 */
export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDismiss, 2400);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div role="status" aria-live="polite">
      {toast ? (
        <div
          key={toast.id}
          className="toast-bubble shadow-quiet pointer-events-none fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-1/2 z-(--z-toast) flex items-center gap-2 rounded-input bg-text px-5 py-3 text-sm font-medium text-white"
        >
          {toast.success ? <Check className="size-4 text-success" aria-hidden="true" /> : null}
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
