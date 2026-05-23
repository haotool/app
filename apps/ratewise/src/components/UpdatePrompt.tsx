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
 * - 更新狀態追蹤：offlineReady / needRefresh / isUpdating / updateFailed
 * - SW 註冊失敗只記錄診斷，不阻塞可用的網頁體驗
 * - offlineReady 僅自動消失，不顯示成功提示以避免首屏 CLS
 * - ARIA role 依緊急程度切換（status / alert）
 * - 定時器清理，防止記憶體洩漏
 *
 * @see notificationTokens — design-tokens.ts
 * @see notificationAnimations — animations.ts
 */
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { notificationTokens } from '../config/design-tokens';
import { notificationAnimations, safeTransition } from '../config/animations';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { logger } from '../utils/logger';
import { recacheCriticalResourcesOnLaunch } from '../utils/pwaStorageManager';
import { SupportContactLinks } from './SupportContactLinks';

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
  const autoUpdateTriggeredRef = useRef(false);
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
      setOfflineReady(false);
      setNeedRefresh(false);
      setUpdateFailed(false);
      logger.error('Service Worker registration error', errorObject);
    },
  });

  // PWA 從背景回前景時主動檢查更新並重新快取關鍵資源（iOS 會清除 Cache Storage）
  useEffect(() => {
    const checkUpdate = () => {
      if (document.visibilityState === 'visible') {
        if (registrationRef.current) {
          void registrationRef.current.update();
        }

        void recacheCriticalResourcesOnLaunch(import.meta.env.BASE_URL || '/');
      }
    };

    document.addEventListener('visibilitychange', checkUpdate);
    return () => {
      document.removeEventListener('visibilitychange', checkUpdate);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    if (!needRefresh) {
      autoUpdateTriggeredRef.current = false;
      return;
    }

    if (
      autoUpdateTriggeredRef.current ||
      isUpdating ||
      typeof navigator === 'undefined' ||
      !navigator.onLine
    ) {
      return;
    }

    autoUpdateTriggeredRef.current = true;
    setIsUpdating(true);
    setUpdateFailed(false);

    void updateServiceWorker(true)
      .catch(() => {
        autoUpdateTriggeredRef.current = false;
        setUpdateFailed(true);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  }, [isUpdating, needRefresh, updateServiceWorker]);

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

  // `offlineReady` 是首次安裝 SW 的低優先級成功狀態；若以 toast 顯示，Lighthouse
  // 會把通知入場視為 CLS。需要使用者注意的更新/失敗狀態仍保留提示。
  const shouldRender = needRefresh || isUpdating || updateFailed;
  const isUrgent = needRefresh || updateFailed || isUpdating;
  const mobilePositionStyle = {
    '--notification-mobile-top-offset': notificationTokens.mobileTopOffset,
  } as CSSProperties;

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="update-prompt"
          className={`${notificationTokens.position} pointer-events-none`}
          style={mobilePositionStyle}
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
              relative overflow-hidden pointer-events-none ${notificationTokens.borderRadius}
              ${notificationTokens.background.brand}
              ${notificationTokens.background.brandBorder}
              ${notificationTokens.shadow}
            `}
          >
            <div
              className={`absolute top-0 right-0 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.topRight} ${notificationTokens.decoration.blur} ${prefersReducedMotion ? 'hidden' : ''}`}
              aria-hidden="true"
            />
            <div
              className={`absolute bottom-0 left-0 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.bottomLeft} ${notificationTokens.decoration.blur} ${prefersReducedMotion ? 'hidden' : ''}`}
              aria-hidden="true"
            />

            <div className={`relative ${notificationTokens.padding}`}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`relative ${notificationTokens.icon.container} ${notificationTokens.icon.brandGradient} flex items-center justify-center shadow-sm`}
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

                  <div className="flex-1 min-w-0">
                    <h2
                      id="update-prompt-title"
                      className={`text-sm font-semibold ${notificationTokens.text.brandTitle} truncate`}
                    >
                      <StatusTitle
                        offlineReady={offlineReady}
                        needRefresh={needRefresh}
                        isUpdating={isUpdating}
                        updateFailed={updateFailed}
                        t={t}
                      />
                    </h2>
                    <p
                      id="update-prompt-description"
                      className={`text-xs ${notificationTokens.text.brandDescription}`}
                    >
                      <StatusDescription
                        offlineReady={offlineReady}
                        needRefresh={needRefresh}
                        isUpdating={isUpdating}
                        updateFailed={updateFailed}
                        t={t}
                      />
                    </p>
                  </div>

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

                {updateFailed ? (
                  <SupportContactLinks
                    title={t('support.reportIssueLead')}
                    description={t('support.reportIssueHint')}
                    tone="brand"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
        className={`${className} text-primary animate-spin`}
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
      className={`${className} text-primary`}
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

const CTA_CLASS = notificationTokens.actions.primary;

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
        type="button"
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
        type="button"
        onClick={() => void onUpdate()}
        className={CTA_CLASS}
        aria-label={t('pwa.actionUpdate')}
      >
        {t('pwa.actionUpdate')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClose}
      className={notificationTokens.actions.icon}
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
