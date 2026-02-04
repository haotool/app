/**
 * PWA 更新提示元件
 *
 * Material Design snackbar 風格，置中底部定位。
 * 唯一實例渲染於 App.tsx，內建 SSR 安全檢查。
 *
 * 特點：
 * - SSR 安全（延遲啟用避免 hydration mismatch）
 * - SSOT tokens（notificationTokens + notificationAnimations）
 * - i18n 多語系支援
 * - prefers-reduced-motion 支援
 * - 4 個狀態：offlineReady / needRefresh / isUpdating / updateFailed
 * - offlineReady 5 秒自動消失
 * - 語義化 ARIA：status（低緊急）/ alert（高緊急）
 * - 完整 interval 清理防止記憶體洩漏
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { notificationTokens } from '../config/design-tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { logger } from '../utils/logger';

export function UpdatePrompt() {
  // SSR 安全：伺服器端不渲染
  if (typeof window === 'undefined') return null;

  return <UpdatePromptClient />;
}

function UpdatePromptClient() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const [show, setShow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        void r.update();
        intervalRef.current = setInterval(() => {
          void r.update();
        }, notificationTokens.timing.updateInterval);
      }
    },
    onRegisterError(error) {
      const errorObject = error instanceof Error ? error : new Error(String(error));
      logger.error('Service Worker registration error', errorObject);
    },
  });

  // 清除 interval 防止記憶體洩漏
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 入場動畫延遲
  useEffect(() => {
    if (!offlineReady && !needRefresh && !updateFailed) {
      return undefined;
    }
    const timer = setTimeout(
      () => setShow(true),
      prefersReducedMotion ? 0 : notificationTokens.timing.showDelay,
    );
    return () => {
      clearTimeout(timer);
      setShow(false);
    };
  }, [offlineReady, needRefresh, updateFailed, prefersReducedMotion]);

  // offlineReady 自動消失
  useEffect(() => {
    if (offlineReady && show) {
      autoDismissRef.current = setTimeout(() => {
        setOfflineReady(false);
        setNeedRefresh(false);
        setUpdateFailed(false);
        setShow(false);
      }, notificationTokens.timing.autoDismiss);
    }
    return () => {
      if (autoDismissRef.current !== null) {
        clearTimeout(autoDismissRef.current);
      }
    };
  }, [offlineReady, show, setOfflineReady, setNeedRefresh]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateFailed(false);
    try {
      await updateServiceWorker(true);
    } catch {
      setUpdateFailed(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setUpdateFailed(false);
    setShow(false);
  };

  // 判斷是否需要顯示
  const shouldRender = offlineReady || needRefresh || isUpdating || updateFailed;
  if (!shouldRender) return null;

  // 判斷緊急程度：needRefresh / updateFailed / isUpdating 為高緊急
  const isUrgent = needRefresh || updateFailed || isUpdating;

  // 動畫類別
  const animationClass = prefersReducedMotion
    ? show
      ? 'opacity-100'
      : 'opacity-0 pointer-events-none'
    : show
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-4 pointer-events-none';

  return (
    <div
      className={`${notificationTokens.position} transition-[opacity,transform] duration-500 ease-out ${animationClass}`}
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
      aria-labelledby="update-prompt-title"
      aria-describedby="update-prompt-description"
    >
      <div
        className={`
          relative overflow-hidden ${notificationTokens.borderRadius}
          ${notificationTokens.container}
          bg-gradient-to-r from-brand-from via-brand-via to-brand-to
          border border-brand-border/60
          shadow-lg shadow-brand-shadow/50
          ${prefersReducedMotion ? '' : 'animate-slide-in-bounce'}
        `}
      >
        {/* 裝飾光暈 */}
        <div
          className={`absolute top-0 right-0 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.topRight} ${notificationTokens.decoration.blur} ${prefersReducedMotion ? 'hidden' : ''}`}
          aria-hidden="true"
        />
        <div
          className={`absolute bottom-0 left-0 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.bottomLeft} ${notificationTokens.decoration.blur} ${prefersReducedMotion ? 'hidden' : ''}`}
          aria-hidden="true"
        />

        {/* 內容區域 */}
        <div className={`relative ${notificationTokens.padding}`}>
          <div className="flex items-center gap-3">
            {/* 圖標區 */}
            <div className="flex-shrink-0">
              <div
                className={`relative ${notificationTokens.icon.container} bg-gradient-to-br from-brand-icon-from to-brand-icon-to flex items-center justify-center shadow`}
              >
                <StatusIcon
                  offlineReady={offlineReady}
                  isUpdating={isUpdating}
                  updateFailed={updateFailed}
                  strokeWidth={notificationTokens.icon.strokeWidth}
                  className={notificationTokens.icon.svg}
                />
              </div>
            </div>

            {/* 文字區 */}
            <div className="flex-1 min-w-0">
              <h2
                id="update-prompt-title"
                className="text-sm font-semibold text-brand-text-dark truncate"
              >
                <StatusTitle
                  offlineReady={offlineReady}
                  needRefresh={needRefresh}
                  isUpdating={isUpdating}
                  updateFailed={updateFailed}
                  t={t}
                />
              </h2>
              <p id="update-prompt-description" className="text-xs text-brand-text truncate">
                <StatusDescription
                  offlineReady={offlineReady}
                  needRefresh={needRefresh}
                  isUpdating={isUpdating}
                  updateFailed={updateFailed}
                  t={t}
                />
              </p>
            </div>

            {/* 行動區 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ActionButtons
                offlineReady={offlineReady}
                needRefresh={needRefresh}
                isUpdating={isUpdating}
                updateFailed={updateFailed}
                onUpdate={handleUpdate}
                onClose={close}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

interface StatusIconProps {
  offlineReady: boolean;
  isUpdating: boolean;
  updateFailed: boolean;
  strokeWidth: number;
  className: string;
}

function StatusIcon({
  offlineReady,
  isUpdating,
  updateFailed,
  strokeWidth,
  className,
}: StatusIconProps) {
  if (isUpdating) {
    return (
      <svg
        className={`${className} text-brand-text animate-spin`}
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={4}
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    );
  }

  return (
    <svg
      className={`${className} text-brand-text`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {updateFailed ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      ) : offlineReady ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          d="M5 13l4 4L19 7"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      )}
    </svg>
  );
}

interface StatusTextProps {
  offlineReady: boolean;
  needRefresh: boolean;
  isUpdating: boolean;
  updateFailed: boolean;
  t: (key: string) => string;
}

function StatusTitle({ offlineReady, isUpdating, updateFailed, t }: StatusTextProps) {
  if (isUpdating) return <>{t('pwa.updatingTitle')}</>;
  if (updateFailed) return <>{t('pwa.updateFailedTitle')}</>;
  if (offlineReady) return <>{t('pwa.offlineReadyTitle')}</>;
  return <>{t('pwa.needRefreshTitle')}</>;
}

function StatusDescription({ offlineReady, isUpdating, updateFailed, t }: StatusTextProps) {
  if (isUpdating) return <>{t('pwa.updatingDescription')}</>;
  if (updateFailed) return <>{t('pwa.updateFailedDescription')}</>;
  if (offlineReady) return <>{t('pwa.offlineReadyDescription')}</>;
  return <>{t('pwa.needRefreshDescription')}</>;
}

interface ActionButtonsProps {
  offlineReady: boolean;
  needRefresh: boolean;
  isUpdating: boolean;
  updateFailed: boolean;
  onUpdate: () => Promise<void>;
  onClose: () => void;
  t: (key: string) => string;
}

function ActionButtons({
  needRefresh,
  isUpdating,
  updateFailed,
  onUpdate,
  onClose,
  t,
}: ActionButtonsProps) {
  if (isUpdating) {
    return null;
  }

  if (updateFailed) {
    return (
      <button
        onClick={() => void onUpdate()}
        className="
          px-3 py-1.5 rounded-full text-xs font-medium
          bg-gradient-to-r from-brand-button-from to-brand-button-to
          text-white shadow-sm
          hover:from-brand-button-hover-from hover:to-brand-button-hover-to
          transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-1
        "
        aria-label={t('pwa.actionRetry')}
      >
        {t('pwa.actionRetry')}
      </button>
    );
  }

  if (needRefresh) {
    return (
      <button
        onClick={() => void onUpdate()}
        className="
          px-3 py-1.5 rounded-full text-xs font-medium
          bg-gradient-to-r from-brand-button-from to-brand-button-to
          text-white shadow-sm
          hover:from-brand-button-hover-from hover:to-brand-button-hover-to
          transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-1
        "
        aria-label={t('pwa.actionUpdate')}
      >
        {t('pwa.actionUpdate')}
      </button>
    );
  }

  // offlineReady: close button
  return (
    <button
      onClick={onClose}
      className="
        p-1.5 rounded-full
        bg-brand-icon-from/80 text-brand-text
        hover:text-brand-text-dark hover:bg-brand-icon-from
        transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-1
      "
      aria-label={t('pwa.actionClose')}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}
