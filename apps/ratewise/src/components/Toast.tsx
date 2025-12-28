/**
 * Toast 通知組件 - 輕量級無依賴實作
 *
 * [2025-12-29] 建立
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

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { Check, X, Info } from 'lucide-react';

// Toast 類型定義
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// 創建 Context
const ToastContext = createContext<ToastContextValue | null>(null);

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
          bg: 'from-green-50 via-emerald-50 to-green-100',
          border: 'border-green-200/50',
          text: 'text-green-800',
          icon: <Check className="w-4 h-4 text-green-600" />,
        };
      case 'error':
        return {
          bg: 'from-red-50 via-pink-50 to-red-100',
          border: 'border-red-200/50',
          text: 'text-red-800',
          icon: <X className="w-4 h-4 text-red-600" />,
        };
      case 'info':
      default:
        return {
          bg: 'from-purple-50 via-blue-50 to-purple-100',
          border: 'border-purple-200/50',
          text: 'text-purple-800',
          icon: <Info className="w-4 h-4 text-purple-600" />,
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

/**
 * useToast Hook - 在組件中使用 Toast
 *
 * @example
 * const { showToast } = useToast();
 * showToast('已複製到剪貼簿', 'success');
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    // 如果未在 ToastProvider 內使用，提供一個 no-op 實作
    return {
      showToast: () => {
        console.warn('useToast: Toast context not found. Wrap your app in ToastProvider.');
      },
    };
  }
  return context;
}
