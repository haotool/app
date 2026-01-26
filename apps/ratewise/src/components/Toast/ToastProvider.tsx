/**
 * Toast Provider - Application Toast Notification System
 * Toast 提供者 - 應用程式 Toast 通知系統
 *
 * @description Modern toast notification system with SSOT design tokens.
 *              Supports success, error, and info types with smooth animations.
 *              位置：底部導航列上方，避免遮擋內容。
 *              使用 SSOT 設計 Token 的現代化 Toast 通知系統。
 *
 * @see [context7:/reactjs/react.dev:toast-notification:2026-01-25]
 * @version 4.0.0
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
      {/* Toast container - bottom center, above bottom navigation */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Single Toast Component - Modern SSOT Design Token Styled
 * 單個 Toast 組件 - 現代化 SSOT 設計 Token 風格
 */
function Toast({ id: _id, message, type, onClose }: ToastMessage & { onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entry animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Start exit after 2.5 seconds
    const hideTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2500);

    // Remove after exit animation completes
    const removeTimer = setTimeout(() => {
      onClose();
    }, 2800);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [onClose]);

  /**
   * Detect if message is copy-related
   * 偵測訊息是否與複製相關
   */
  const isCopyMessage =
    message.includes('複製') ||
    message.includes('Copied') ||
    message.includes('コピー') ||
    message.includes('已複製');

  /**
   * Get styles based on toast type - using SSOT design tokens with primary color
   * 根據 Toast 類型獲取樣式 - 使用 SSOT 設計 Token 和主題主色
   */
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          gradient: 'from-primary/95 to-primary-hover/95',
          text: 'text-white',
          iconBg: 'bg-white/20',
          icon: isCopyMessage ? (
            <Copy className="w-4 h-4" strokeWidth={2.5} />
          ) : (
            <Check className="w-4 h-4" strokeWidth={2.5} />
          ),
        };
      case 'error':
        return {
          gradient: 'from-destructive/95 to-destructive/85',
          text: 'text-white',
          iconBg: 'bg-white/20',
          icon: <X className="w-4 h-4" strokeWidth={2.5} />,
        };
      case 'info':
      default:
        return {
          gradient: 'from-primary/95 to-accent/95',
          text: 'text-white',
          iconBg: 'bg-white/20',
          icon: <Info className="w-4 h-4" strokeWidth={2.5} />,
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
        min-w-[180px] max-w-[280px]
        overflow-hidden rounded-full
        bg-gradient-to-r ${styles.gradient}
        shadow-lg shadow-primary/20
        backdrop-blur-md
        transform transition-all duration-300 ease-out
        ${
          isVisible && !isExiting
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-4 opacity-0 scale-95'
        }
      `}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        {/* Icon with subtle background */}
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full ${styles.iconBg} ${styles.text} flex items-center justify-center`}
        >
          {styles.icon}
        </div>
        {/* Message */}
        <span className={`text-sm font-semibold ${styles.text} whitespace-nowrap`}>{message}</span>
      </div>
    </div>
  );
}
