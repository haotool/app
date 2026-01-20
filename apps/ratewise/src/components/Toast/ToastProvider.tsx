/**
 * Toast Provider - 包裝應用程式以啟用 Toast 功能
 *
 * [2026-01-04] 從 Toast.tsx 拆分以符合 react-refresh/only-export-components 規則
 * 參考: [context7:/reactjs/react.dev:toast-notification:2025-12-29]
 *
 * 設計特點：
 * - 無外部依賴，純 React + Tailwind CSS
 * - 支援成功、錯誤、資訊三種類型
 * - 自動消失（2 秒）
 * - 滑順的入場/退場動畫
 * - 堆疊顯示多個通知
 * - 符合棉花糖雲朵風格
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

  // 根據類型選擇樣式
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-success/10 via-success/5 to-success/15',
          border: 'border-success/30',
          text: 'text-success',
          icon: <Check className="w-4 h-4 text-success" />,
        };
      case 'error':
        return {
          bg: 'from-destructive/10 via-destructive/5 to-destructive/15',
          border: 'border-destructive/30',
          text: 'text-destructive',
          icon: <X className="w-4 h-4 text-destructive" />,
        };
      case 'info':
      default:
        return {
          bg: 'from-primary-bg via-primary-bg to-primary-light',
          border: 'border-primary/30',
          text: 'text-primary',
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
        shadow-lg shadow-purple-100/30
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
