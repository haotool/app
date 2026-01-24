/**
 * ToastProvider - Toast Notification System
 *
 * @description Application wrapper to enable toast notifications with cotton candy styling
 *
 * @features
 * - Zero external dependencies (pure React + Tailwind CSS)
 * - Three types: success, error, info
 * - Auto-dismiss after 2 seconds
 * - Smooth entrance/exit animations
 * - Stacked display for multiple notifications
 * - Cotton candy cloud-inspired design
 * - Design token integration for brand-aligned colors
 *
 * @architecture
 * - Extracted from Toast.tsx to comply with react-refresh/only-export-components rule
 *
 * @see https://react.dev/reference/react/createContext - Toast notification pattern
 * @see docs/dev/005_design_token_refactoring.md - Design token migration
 *
 * @created 2026-01-04
 * @updated 2026-01-24
 * @version 2.0.0
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Check, X, Info } from 'lucide-react';
import { ToastContext, type ToastMessage, type ToastType } from './ToastContext';

/**
 * Toast Provider - 包裝應用程式以啟用 Toast 功能
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
      {/* Toast 容器 - 右上角堆疊 */}
      <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * 單個 Toast 組件
 */
function Toast({ id: _id, message, type, onClose }: ToastMessage & { onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 入場動畫
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // 2 秒後開始退場
    const hideTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2000);

    // 退場動畫完成後移除
    const removeTimer = setTimeout(() => {
      onClose();
    }, 2300);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [onClose]);

  // Select styles based on toast type (design token integrated)
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-success-bg via-success-light to-success-bg',
          border: 'border-success-light/50',
          text: 'text-success-text',
          icon: <Check className="w-4 h-4 text-success" />,
        };
      case 'error':
        return {
          bg: 'from-danger-bg via-danger-light to-danger-bg',
          border: 'border-danger-light/50',
          text: 'text-danger-text',
          icon: <X className="w-4 h-4 text-danger" />,
        };
      case 'info':
      default:
        return {
          bg: 'from-brand-from via-brand-via to-brand-to',
          border: 'border-brand-border/50',
          text: 'text-brand-text-dark',
          icon: <Info className="w-4 h-4 text-primary" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        pointer-events-auto
        max-w-xs
        overflow-hidden rounded-2xl
        bg-gradient-to-br ${styles.bg}
        border-2 ${styles.border}
        shadow-lg shadow-brand-shadow/30
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* 圖標 */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center">
          {styles.icon}
        </div>
        {/* 訊息 */}
        <span className={`text-sm font-medium ${styles.text}`}>{message}</span>
      </div>
    </div>
  );
}
