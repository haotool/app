/**
 * PWA 更新通知元件
 *
 * Material Design snackbar 風格，固定於視窗底部中央。
 * 唯一實例於 App.tsx 渲染，內建 SSR 安全檢查。
 *
 * 功能：
 * - SSR 安全（伺服器端不渲染，避免 hydration 不匹配）
 * - SSOT（notificationTokens + notificationAnimations）
 * - motion/react 入場／退場動畫與按鈕微互動
 * - i18n 國際化
 * - prefers-reduced-motion 無障礙支援
 * - 四狀態：offlineReady / needRefresh / isUpdating / updateFailed
 * - offlineReady 5 秒自動消失
 * - ARIA role 依緊急程度切換（status / alert）
 * - 定時器清理，防止記憶體洩漏
 *
 * @see notificationTokens — design-tokens.ts
 * @see notificationAnimations — animations.ts
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { notificationTokens } from '../config/design-tokens';
import { notificationAnimations, safeTransition } from '../config/animations';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { logger } from '../utils/logger';
import { recacheCriticalResourcesOnLaunch } from '../utils/pwaStorageManager';

/** SSR 安全入口：伺服器端回傳 null */
export function UpdatePrompt() {
  if (typeof window === 'undefined') return null;

  return <UpdatePromptClient />;
}

function UpdatePromptClient() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        registrationRef.current = r;
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

  // visibilitychange: 當 PWA 從背景回到前景時檢查更新
  // 這是舊 PWA 用戶獲得更新通知的關鍵機制
  // iOS Safari PWA 會在背景殺掉 SW，回到前景時需要主動檢查
  // [fix:2026-02-08] 同時重新快取關鍵資源，解決 iOS 清除 Cache Storage 問題
  // Reference: [GitHub:PWA-POLICE/pwa-bugs] [GitHub:Workbox#1494]
  useEffect(() => {
    const checkUpdate = () => {
      if (document.visibilityState === 'visible') {
        // 檢查 Service Worker 更新
        if (registrationRef.current) {
          void registrationRef.current.update();
        }

        // 重新快取關鍵資源（iOS Safari 可能已清除快取）
        void recacheCriticalResourcesOnLaunch(import.meta.env.BASE_URL || '/');
      }
    };

    document.addEventListener('visibilitychange', checkUpdate);
    return () => {
      document.removeEventListener('visibilitychange', checkUpdate);
    };
  }, []);

  // 清除定期更新 interval
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // offlineReady 自動消失
  useEffect(() => {
    if (offlineReady) {
      autoDismissRef.current = setTimeout(() => {
        setOfflineReady(false);
        setNeedRefresh(false);
        setUpdateFailed(false);
      }, notificationTokens.timing.autoDismiss);
    }
    return () => {
      if (autoDismissRef.current !== null) {
        clearTimeout(autoDismissRef.current);
      }
    };
  }, [offlineReady, setOfflineReady, setNeedRefresh]);

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
  };

  const shouldRender = offlineReady || needRefresh || isUpdating || updateFailed;
  const isUrgent = needRefresh || updateFailed || isUpdating;

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="update-prompt"
          className={notificationTokens.position}
          role={isUrgent ? 'alert' : 'status'}
          aria-live={isUrgent ? 'assertive' : 'polite'}
          aria-labelledby="update-prompt-title"
          aria-describedby="update-prompt-description"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={notificationAnimations.enter.variants}
          transition={safeTransition(
            {
              ...notificationAnimations.enter.transition,
              delay: notificationTokens.timing.showDelay / 1000,
            },
            prefersReducedMotion,
          )}
        >
          <div
            className={`
              relative overflow-hidden ${notificationTokens.borderRadius}
              ${notificationTokens.container}
              bg-gradient-to-r from-brand-from via-brand-via to-brand-to
              border border-brand-border/60
              ${notificationTokens.shadow}
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

            {/* 內容 */}
            <div className={`relative ${notificationTokens.padding}`}>
              <div className="flex items-center gap-3">
                {/* 狀態圖標 */}
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

                {/* 標題與描述 */}
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

                {/* 操作按鈕 */}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --- 子元件 --- */

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

/** CTA 按鈕共用樣式（更新／重試） */
const CTA_CLASS = `
  px-3 py-1.5 rounded-full text-xs font-medium
  bg-gradient-to-r from-brand-button-from to-brand-button-to
  text-white shadow-sm
  hover:from-brand-button-hover-from hover:to-brand-button-hover-to
  hover:scale-[1.02] active:scale-[0.98]
  transition-[color,background-color,border-color,transform] duration-200 ease-out
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-1
`;

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
        className={CTA_CLASS}
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
        className={CTA_CLASS}
        aria-label={t('pwa.actionUpdate')}
      >
        {t('pwa.actionUpdate')}
      </button>
    );
  }

  // offlineReady: 關閉按鈕
  return (
    <button
      onClick={onClose}
      className="
        p-1.5 rounded-full
        bg-brand-icon-from/80 text-brand-text
        hover:text-brand-text-dark hover:bg-brand-icon-from hover:scale-[1.05]
        active:scale-[0.95]
        transition-[color,background-color,transform] duration-200 ease-out
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
