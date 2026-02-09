/**
 * 離線模式指示器組件
 *
 * 功能：
 * - 監控網路連線狀態（navigator.onLine API + 混合式驗證）
 * - 離線時顯示小型指示器（品牌風格，統一 UpdatePrompt 設計）
 * - 使用 notificationTokens 統一風格
 * - 自動隱藏/顯示動畫（motion/react）
 * - SSR 安全（伺服器端不渲染）
 * - 無障礙支援（role="status", aria-live="polite"）
 *
 * 設計：
 * - 位置：畫面頂部中央，固定定位
 * - 風格：與 UpdatePrompt 一致的品牌漸變（藍-靛-紫）
 * - 區別：圖標使用警告色（橙色）區分離線狀態
 * - 動畫：淡入淡出 + 滑動效果
 * - 觸控：點擊可手動關閉
 *
 * @created 2026-02-08
 * @updated 2026-02-09 - 統一品牌風格，與 UpdatePrompt 保持一致
 * @version 2.0.0
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

/** SSR 安全入口：伺服器端回傳 null */
interface OfflineIndicatorProps {
  /**
   * Force offline state for UI showcase/testing.
   * When undefined, uses real network detection.
   */
  forceOffline?: boolean;
  /**
   * Override positioning class for UI showcase preview.
   * Defaults to the global fixed position.
   */
  positionClassName?: string;
}

export function OfflineIndicator({ forceOffline }: OfflineIndicatorProps) {
  if (typeof window === 'undefined') return null;
  return <OfflineIndicatorClient forceOffline={forceOffline} />;
}

function OfflineIndicatorClient({ forceOffline, positionClassName }: OfflineIndicatorProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [isOffline, setIsOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // 監控網路連線狀態 - 混合式檢測（navigator.onLine + 實際網路請求）
  useEffect(() => {
    // 強制離線模式（用於 UI Showcase 預覽）
    if (typeof forceOffline === 'boolean') {
      // 使用 queueMicrotask 避免同步 setState 警告
      queueMicrotask(() => {
        setIsOffline(forceOffline);
        if (forceOffline) {
          setIsDismissed(false);
        }
      });
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    // 混合式離線狀態檢查
    const checkNetworkStatus = async () => {
      // 先快速檢查 navigator.onLine
      const basicCheck = typeof navigator !== 'undefined' ? navigator.onLine : true;

      // 如果 navigator.onLine 為 false，立即標記離線（可信的離線狀態）
      if (!basicCheck) {
        setIsOffline(true);
        logger.warn('Network connection lost - entering offline mode (navigator.onLine)');
        setIsDismissed(false);
        return;
      }

      // navigator.onLine 為 true 時，仍需進行實際網路驗證
      // 因為 true 不可靠（可能只是連接到網路，但沒有網際網路）
      const online = await isOnline();
      const offline = !online;

      setIsOffline(offline);

      if (offline) {
        logger.warn('Network connection lost - entering offline mode (hybrid verification)');
        setIsDismissed(false);
      } else {
        logger.info('Network connection restored - back online (hybrid verification)');
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
  }, [forceOffline]);

  // 手動關閉
  const handleDismiss = () => {
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
              ${notificationTokens.container}
              ${notificationTokens.background.brand}
              ${notificationTokens.background.brandBorder}
              ${notificationTokens.shadow}
              cursor-pointer
            `}
            onClick={handleDismiss}
          >
            {/* 裝飾光暈 - 警告色調（區分離線狀態） */}
            <div
              className={`absolute top-0 right-0 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.offlineTopRight} ${notificationTokens.decoration.blur} ${prefersReducedMotion ? 'hidden' : ''}`}
              aria-hidden="true"
            />
            <div
              className={`absolute bottom-0 left-0 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.offlineBottomLeft} ${notificationTokens.decoration.blur} ${prefersReducedMotion ? 'hidden' : ''}`}
              aria-hidden="true"
            />

            {/* 內容 */}
            <div className={`relative ${notificationTokens.padding}`}>
              <div className="flex items-center gap-3">
                {/* 離線圖標 - 警告色漸變 */}
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

                {/* 文字訊息 - 統一品牌色系 */}
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

                {/* 關閉按鈕 - 統一 UpdatePrompt 樣式 */}
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
