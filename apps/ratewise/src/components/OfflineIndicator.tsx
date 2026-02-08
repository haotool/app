/**
 * 離線模式指示器組件
 *
 * 功能：
 * - 監控網路連線狀態（navigator.onLine API）
 * - 離線時顯示小型指示器
 * - 使用 notificationTokens 統一風格
 * - 自動隱藏/顯示動畫（motion/react）
 * - SSR 安全（伺服器端不渲染）
 * - 無障礙支援（role="status", aria-live="polite"）
 *
 * 設計：
 * - 位置：畫面頂部中央，固定定位
 * - 風格：與 UpdatePrompt 一致的品牌漸變
 * - 動畫：淡入淡出 + 滑動效果
 * - 觸控：點擊可手動關閉
 *
 * @created 2026-02-08
 * @version 1.0.0
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { WifiOff } from 'lucide-react';
import { notificationTokens } from '../config/design-tokens';
import { notificationAnimations, safeTransition } from '../config/animations';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { logger } from '../utils/logger';
import { isOnline } from '../utils/networkStatus';

/**
 * 離線指示器位置配置
 * 固定於視窗頂部中央，避免遮擋主要內容
 */
const OFFLINE_INDICATOR_POSITION =
  'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto';

/** SSR 安全入口：伺服器端回傳 null */
export function OfflineIndicator() {
  if (typeof window === 'undefined') return null;

  return <OfflineIndicatorClient />;
}

function OfflineIndicatorClient() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [isOffline, setIsOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // 監控網路連線狀態 - 混合式檢測（navigator.onLine + 實際網路請求）
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // 混合式離線狀態檢查
    const checkNetworkStatus = async () => {
      const online = await isOnline();
      const offline = !online;

      setIsOffline(offline);

      if (offline) {
        logger.warn('Network connection lost - entering offline mode (hybrid detection)');
        setIsDismissed(false); // 重新顯示指示器
      } else {
        logger.info('Network connection restored - back online (hybrid detection)');
      }
    };

    // 初始檢查
    void checkNetworkStatus();

    // 定期檢查網路狀態（每 30 秒）
    // 因為 navigator.onLine 在某些情況下不可靠，需要定期驗證
    intervalId = setInterval(() => {
      void checkNetworkStatus();
    }, 30000);

    // 監聽 online/offline 事件作為快速反應機制
    const handleOnlineEvent = () => {
      void checkNetworkStatus();
    };

    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOnlineEvent);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOnlineEvent);
    };
  }, []);

  // 手動關閉
  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const shouldRender = isOffline && !isDismissed;

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="offline-indicator"
          className={OFFLINE_INDICATOR_POSITION}
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
              ${notificationTokens.container}
              bg-gradient-to-r from-neutral-dark via-neutral-darker to-neutral-dark
              border border-warning/40
              ${notificationTokens.shadow}
              cursor-pointer
            `}
            onClick={handleDismiss}
          >
            {/* 裝飾光暈 - 警告色 */}
            <div
              className={`absolute top-0 right-0 ${notificationTokens.decoration.size} rounded-full bg-warning/20 ${notificationTokens.decoration.blur} ${prefersReducedMotion ? 'hidden' : ''}`}
              aria-hidden="true"
            />
            <div
              className={`absolute bottom-0 left-0 ${notificationTokens.decoration.size} rounded-full bg-warning/10 ${notificationTokens.decoration.blur} ${prefersReducedMotion ? 'hidden' : ''}`}
              aria-hidden="true"
            />

            {/* 內容 */}
            <div className={`relative ${notificationTokens.padding}`}>
              <div className="flex items-center gap-3">
                {/* 離線圖標 */}
                <div className="flex-shrink-0">
                  <div
                    className={`relative ${notificationTokens.icon.container} bg-gradient-to-br from-warning-light to-warning flex items-center justify-center shadow-sm`}
                  >
                    <WifiOff
                      className={notificationTokens.icon.svg}
                      strokeWidth={notificationTokens.icon.strokeWidth}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* 文字訊息 */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-white truncate">
                    {t('offline.title', '離線模式')}
                  </h2>
                  <p className="text-xs text-neutral-text-secondary truncate">
                    {t('offline.description', '部分功能可能無法使用')}
                  </p>
                </div>

                {/* 關閉按鈕 */}
                <button
                  onClick={handleDismiss}
                  className="
                    flex-shrink-0 p-1.5 rounded-full
                    bg-neutral-darker/50 text-neutral-text-secondary
                    hover:text-white hover:bg-neutral-darker hover:scale-[1.05]
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
