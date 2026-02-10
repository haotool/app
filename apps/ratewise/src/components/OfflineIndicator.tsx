/** 離線模式指示器 - 完全離線時顯示，10 秒自動關閉，同次 session 不再重複 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { WifiOff } from 'lucide-react';
import { notificationTokens } from '../config/design-tokens';
import { notificationAnimations, safeTransition } from '../config/animations';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { logger } from '../utils/logger';
import { isOnline } from '../utils/networkStatus';

interface OfflineIndicatorProps {
  /** 強制離線狀態（測試用） */
  forceOffline?: boolean;
  /** 自訂定位（預覽用） */
  positionClassName?: string;
}

/** SSR 安全入口 */
export function OfflineIndicator({ forceOffline }: OfflineIndicatorProps) {
  if (typeof window === 'undefined') return null;
  return <OfflineIndicatorClient forceOffline={forceOffline} />;
}

const AUTO_DISMISS_MS = 10_000;

/** 同次 session 是否已顯示過離線提示 */
let sessionDismissed = false;

/** 重置 session 狀態（僅供測試使用） */
export function resetSessionDismissed() {
  sessionDismissed = false;
}

function OfflineIndicatorClient({ forceOffline, positionClassName }: OfflineIndicatorProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [isOffline, setIsOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(sessionDismissed);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 10 秒自動關閉，關閉後同次 session 不再顯示
  useEffect(() => {
    if (isOffline && !isDismissed) {
      autoDismissRef.current = setTimeout(() => {
        sessionDismissed = true;
        setIsDismissed(true);
      }, AUTO_DISMISS_MS);
    }
    return () => {
      if (autoDismissRef.current !== null) {
        clearTimeout(autoDismissRef.current);
        autoDismissRef.current = null;
      }
    };
  }, [isOffline, isDismissed]);

  // 網路狀態監控
  useEffect(() => {
    if (typeof forceOffline === 'boolean') {
      queueMicrotask(() => {
        setIsOffline(forceOffline);
        if (forceOffline) {
          sessionDismissed = false;
          setIsDismissed(false);
        }
      });
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkNetworkStatus = async () => {
      const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (!browserOnline) {
        setIsOffline(true);
        logger.warn('Offline mode detected (navigator.onLine)');
        return;
      }

      const online = await isOnline();
      setIsOffline(!online);

      if (!online) {
        logger.warn('Offline mode detected (hybrid verification)');
      }
    };

    void checkNetworkStatus();

    intervalId = setInterval(() => void checkNetworkStatus(), 30_000);

    const handleEvent = () => void checkNetworkStatus();
    window.addEventListener('online', handleEvent);
    window.addEventListener('offline', handleEvent);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('online', handleEvent);
      window.removeEventListener('offline', handleEvent);
    };
  }, [forceOffline]);

  const handleDismiss = () => {
    sessionDismissed = true;
    setIsDismissed(true);
  };

  const shouldRender = isOffline && !isDismissed;
  const positionClass = positionClassName ?? notificationTokens.positionTop;

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="offline-indicator"
          className={positionClass}
          role="status"
          aria-live="polite"
          aria-atomic="true"
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
              ${notificationTokens.background.brand}
              ${notificationTokens.background.brandBorder}
              ${notificationTokens.shadow}
              cursor-pointer
            `}
            onClick={handleDismiss}
          >
            <div
              className={`absolute top-0 right-0 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.offlineTopRight} ${notificationTokens.decoration.blur} ${prefersReducedMotion ? 'hidden' : ''}`}
              aria-hidden="true"
            />
            <div
              className={`absolute bottom-0 left-0 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.offlineBottomLeft} ${notificationTokens.decoration.blur} ${prefersReducedMotion ? 'hidden' : ''}`}
              aria-hidden="true"
            />

            <div className={`relative ${notificationTokens.padding}`}>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div
                    className={`relative ${notificationTokens.icon.container} ${notificationTokens.icon.warningGradient} flex items-center justify-center shadow-sm`}
                  >
                    <WifiOff
                      className={`${notificationTokens.icon.svg} text-white`}
                      strokeWidth={notificationTokens.icon.strokeWidth}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h2
                    className={`text-sm font-semibold ${notificationTokens.text.warningTitle} truncate`}
                  >
                    {t('offline.title', '離線模式')}
                  </h2>
                  <p className={`text-xs ${notificationTokens.text.warningDescription} truncate`}>
                    {t('offline.description', '部分功能可能無法使用')}
                  </p>
                </div>

                <button
                  onClick={handleDismiss}
                  className="
                    p-1.5 rounded-full
                    bg-brand-icon-from/80 text-brand-text
                    hover:text-brand-text-dark hover:bg-brand-icon-from hover:scale-[1.05]
                    active:scale-[0.95]
                    transition-[color,background-color,transform] duration-200 ease-out
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-1
                  "
                  aria-label={t('offline.close', '關閉離線提示')}
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
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
