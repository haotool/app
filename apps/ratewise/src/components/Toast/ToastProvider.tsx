/**
 * Toast Provider - Application Toast Notification System
 * Toast 提供者 - 應用程式 Toast 通知系統
 *
 * @description 現代化 Toast 通知系統，使用 SSOT 設計 Token。
 *              支援 success、error、info 類型，具有流暢動畫效果。
 *
 * 位置策略（響應式設計）：
 * - 桌面端：右上角（不干擾主要內容區域）
 * - 行動端：右上角（避免遮擋底部「加入歷史記錄」按鈕）
 *
 * 寬度策略：
 * - 使用 w-fit 自動適應內容寬度
 * - max-width 限制最大寬度為 90vw
 *
 * @see [web.dev/patterns/components/toast] Toast 最佳實踐
 * @see [logrocket.com/ux-design/toast-notifications] UX 設計指南
 * @version 5.0.0 - 右上角定位 + 自適應寬度
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
      {/* Toast 容器 - 右上角定位，安全區域內縮 */}
      <div className="fixed top-16 right-4 z-[60] flex flex-col items-end gap-2 pointer-events-none">
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
  /**
   * 取得 Toast 樣式 - 使用淡化主色搭配 SSOT Design Token
   *
   * 設計理念：
   * - 淡化主色背景 (primary/15) 取代深色漸層
   * - 主色文字搭配淡色背景，視覺更柔和
   * - 符合現代化 Toast 設計趨勢
   */
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-primary/15 border border-primary/20',
          text: 'text-primary',
          iconBg: 'bg-primary/20',
          icon: isCopyMessage ? (
            <Copy className="w-4 h-4" strokeWidth={2.5} />
          ) : (
            <Check className="w-4 h-4" strokeWidth={2.5} />
          ),
        };
      case 'error':
        return {
          bg: 'bg-destructive/15 border border-destructive/20',
          text: 'text-destructive',
          iconBg: 'bg-destructive/20',
          icon: <X className="w-4 h-4" strokeWidth={2.5} />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-primary/15 border border-primary/20',
          text: 'text-primary',
          iconBg: 'bg-primary/20',
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
        w-fit max-w-[min(30ch,90vw)]
        overflow-hidden rounded-xl
        ${styles.bg}
        shadow-md
        backdrop-blur-xl
        transform transition-all duration-300 ease-out
        ${
          isVisible && !isExiting
            ? 'translate-x-0 opacity-100 scale-100'
            : 'translate-x-4 opacity-0 scale-95'
        }
      `}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        {/* 圖示 - 較小的圓形背景 */}
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full ${styles.iconBg} ${styles.text} flex items-center justify-center`}
        >
          {styles.icon}
        </div>
        {/* 訊息文字 */}
        <span className={`text-sm font-semibold ${styles.text}`}>{message}</span>
      </div>
    </div>
  );
}
