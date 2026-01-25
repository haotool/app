/**
 * Toast Provider - Application Toast Notification System
 * Toast 提供者 - 應用程式 Toast 通知系統
 *
 * @description Toast notification system with SSOT design tokens.
 *              Supports success, error, and info types with smooth animations.
 *              使用 SSOT 設計 Token 的 Toast 通知系統。
 *              支援成功、錯誤、資訊三種類型，並具有流暢動畫。
 *
 * @see [context7:/reactjs/react.dev:toast-notification:2025-12-29]
 * @version 3.0.0
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Check, X, Info, Copy } from 'lucide-react';
import { ToastContext, type ToastMessage, type ToastType } from './ToastContext';

/**
 * Toast Provider - Wraps application to enable Toast functionality
 * Toast 提供者 - 包裝應用程式以啟用 Toast 功能
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container - top center for better visibility */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Single Toast Component - SSOT Design Token Styled
 * 單個 Toast 組件 - SSOT 設計 Token 風格
 */
function Toast({ id: _id, message, type, onClose }: ToastMessage & { onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entry animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Start exit after 2 seconds
    const hideTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2000);

    // Remove after exit animation completes
    const removeTimer = setTimeout(() => {
      onClose();
    }, 2300);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [onClose]);

  /**
   * Get styles based on toast type - using SSOT design tokens
   * 根據 Toast 類型獲取樣式 - 使用 SSOT 設計 Token
   */
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-surface',
          border: 'border-success/40',
          text: 'text-success',
          iconBg: 'bg-success/15',
          icon: <Check className="w-4 h-4" strokeWidth={2.5} />,
        };
      case 'error':
        return {
          bg: 'bg-surface',
          border: 'border-destructive/40',
          text: 'text-destructive',
          iconBg: 'bg-destructive/15',
          icon: <X className="w-4 h-4" strokeWidth={2.5} />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-surface',
          border: 'border-primary/40',
          text: 'text-primary',
          iconBg: 'bg-primary/15',
          icon:
            message.includes('複製') || message.includes('Copied') || message.includes('コピー') ? (
              <Copy className="w-4 h-4" strokeWidth={2.5} />
            ) : (
              <Info className="w-4 h-4" strokeWidth={2.5} />
            ),
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="toast"
      className={`
        pointer-events-auto
        min-w-[200px] max-w-xs
        overflow-hidden rounded-2xl
        ${styles.bg}
        border-2 ${styles.border}
        shadow-xl shadow-black/10
        backdrop-blur-sm
        transform transition-all duration-300 ease-out
        ${
          isVisible && !isExiting
            ? 'translate-y-0 opacity-100 scale-100'
            : '-translate-y-2 opacity-0 scale-95'
        }
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon with themed background */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full ${styles.iconBg} ${styles.text} flex items-center justify-center`}
        >
          {styles.icon}
        </div>
        {/* Message */}
        <span className={`text-sm font-semibold ${styles.text}`}>{message}</span>
      </div>
    </div>
  );
}
