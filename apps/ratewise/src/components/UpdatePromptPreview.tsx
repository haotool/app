/**
 * PWA 更新通知預覽元件
 *
 * 用於 UI Showcase 展示，支援手動控制不同狀態。
 * 與 UpdatePrompt 共用相同的視覺設計和動畫。
 *
 * 功能：
 * - 支援四種狀態：offlineReady / needRefresh / isUpdating / updateFailed
 * - 使用 notificationTokens 統一風格
 * - motion/react 入場／退場動畫
 * - SSR 安全
 * - 無障礙支援
 *
 * @created 2026-02-09
 * @version 1.0.0
 */
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { notificationTokens } from '../config/design-tokens';
import { notificationAnimations, safeTransition } from '../config/animations';
import { useReducedMotion } from '../hooks/useReducedMotion';

export type UpdatePromptState = 'offlineReady' | 'needRefresh' | 'isUpdating' | 'updateFailed';

interface UpdatePromptPreviewProps {
  /**
   * 當前顯示的狀態
   */
  state: UpdatePromptState | null;
  /**
   * 關閉回調
   */
  onClose?: () => void;
  /**
   * 更新/重試回調
   */
  onUpdate?: () => void;
  /**
   * 覆蓋定位類別（用於 UI Showcase 預覽）
   */
  positionClassName?: string;
}

/** SSR 安全入口：伺服器端回傳 null */
export function UpdatePromptPreview({
  state,
  onClose,
  onUpdate,
  positionClassName,
}: UpdatePromptPreviewProps) {
  if (typeof window === 'undefined') return null;
  return (
    <UpdatePromptPreviewClient
      state={state}
      onClose={onClose}
      onUpdate={onUpdate}
      positionClassName={positionClassName}
    />
  );
}

function UpdatePromptPreviewClient({
  state,
  onClose,
  onUpdate,
  positionClassName,
}: UpdatePromptPreviewProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const offlineReady = state === 'offlineReady';
  const needRefresh = state === 'needRefresh';
  const isUpdating = state === 'isUpdating';
  const updateFailed = state === 'updateFailed';

  const shouldRender = state !== null;
  const isUrgent = needRefresh || updateFailed || isUpdating;

  const positionClass = positionClassName ?? notificationTokens.position;

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="update-prompt-preview"
          className={positionClass}
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
              ${notificationTokens.background.brand}
              ${notificationTokens.background.brandBorder}
              ${notificationTokens.shadow}
            `}
          >
            {/* 裝飾光暈 - 品牌色 */}
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
                {/* 狀態圖標 - 品牌色漸變 */}
                <div className="flex-shrink-0">
                  <div
                    className={`relative ${notificationTokens.icon.container} ${notificationTokens.icon.brandGradient} flex items-center justify-center shadow`}
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
                    className={`text-xs ${notificationTokens.text.brandDescription} truncate`}
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

                {/* 操作按鈕 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ActionButtons
                    offlineReady={offlineReady}
                    needRefresh={needRefresh}
                    isUpdating={isUpdating}
                    updateFailed={updateFailed}
                    onUpdate={() => onUpdate?.()}
                    onClose={() => onClose?.()}
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
  onUpdate: () => void;
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
      <button onClick={onUpdate} className={CTA_CLASS} aria-label={t('pwa.actionRetry')}>
        {t('pwa.actionRetry')}
      </button>
    );
  }

  if (needRefresh) {
    return (
      <button onClick={onUpdate} className={CTA_CLASS} aria-label={t('pwa.actionUpdate')}>
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
