/**
 * AppLayout - 主要應用佈局組件
 * 整合 Header、側邊欄、底部導覽與內容區域
 * 頁面切換使用輕量 crossfade 動畫，支援 prefers-reduced-motion
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { BottomNavigation } from './BottomNavigation';
import { SideNavigation } from './SideNavigation';
import { ToastProvider } from './Toast';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { OfflineIndicator } from './OfflineIndicator';
import { UpdatePrompt } from './UpdatePrompt';

import { getResolvedLanguage } from '../i18n';
import { navigationTokens } from '../config/design-tokens';
import { pageTransition } from '../config/animations';

/** Logo 組件 */
function Logo() {
  const basePath = import.meta.env.BASE_URL || '/';

  return (
    <img
      src={`${basePath}logo.png`}
      alt="RateWise"
      width={28}
      height={28}
      className="w-7 h-7 shrink-0"
      loading="eager"
      decoding="async"
    />
  );
}

/**
 * Header 組件 - ParkKeeper 風格（Compact）
 *
 * 特點：
 * - 毛玻璃背景
 * - 品牌 Logo + 標題（支援多語系）
 * - 48px 高度（參考 Threads/Instagram）
 * - shrink-0 確保 Header 不會被壓縮
 *
 * SSR/Hydration 修正 (2026-01-27):
 * - 使用 useState + useEffect 確保 SSR 與 client 初始渲染一致
 * - SSR 時使用固定的預設語系（zh-TW），避免 React #418 hydration mismatch
 * - Client hydration 完成後才更新為實際語系
 *
 * @see navigationTokens.header - SSOT for header dimensions
 * @see https://developer.apple.com/design/human-interface-guidelines/tab-bars
 * @see https://react.dev/errors/418 - Hydration mismatch error
 */
function Header() {
  const { t } = useTranslation();

  // SSR/Hydration 一致性處理
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const currentLanguage = isHydrated ? getResolvedLanguage() : 'zh-TW';
  const isZhTW = currentLanguage === 'zh-TW';

  return (
    <header
      className="
        px-4 z-30 shrink-0
        bg-background/80 backdrop-blur-xl
        border-b border-black/[0.03]
        flex items-center
      "
      style={{
        height: navigationTokens.header.heightWithSafeArea,
        paddingTop: navigationTokens.safeArea.top,
      }}
    >
      <div className="flex justify-between items-center max-w-md mx-auto w-full">
        {/* 品牌 Logo + 標題（使用 span 而非 h1，避免每頁重複 h1）*/}
        <div className="flex items-center gap-1.5">
          <Logo />
          <span
            data-testid="app-title"
            className="
              text-lg font-black tracking-tight
              bg-clip-text text-transparent
              bg-gradient-to-r from-[rgb(var(--color-title-gradient-from))] to-[rgb(var(--color-title-gradient-to))]
              [-webkit-background-clip:text]
            "
          >
            {isZhTW ? 'RateWise 匯率好工具' : t('app.title')}
          </span>
        </div>
      </div>
    </header>
  );
}

/** 主應用佈局 - 支援 iOS PWA 安全區域與響應式側邊欄 */
export function AppLayout() {
  const location = useLocation();

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <ToastProvider>
      {/* 根容器：固定視口高度，啟用 flex 滾動 */}
      <div className="h-dvh w-full flex flex-col font-sans bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] overflow-hidden">
        {/* Desktop sidebar (≥768px) */}
        <div className="flex flex-1 min-h-0 min-w-0">
          <SideNavigation className="hidden md:block" />

          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Header (mobile only) - shrink-0 確保不被壓縮 */}
            <div className="md:hidden shrink-0">
              <Header />
            </div>

            {/* 內容區域 - 支援 iOS Safari 慣性滾動 */}
            <main
              data-scroll-container="main"
              className="flex-1 min-h-0 min-w-0 w-full relative overflow-y-auto overflow-x-hidden pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0 [-webkit-overflow-scrolling:touch] overscroll-y-contain"
            >
              <RouteErrorBoundary>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={location.pathname}
                    variants={pageTransition.variants}
                    initial={prefersReducedMotion ? false : 'initial'}
                    animate="animate"
                    exit="exit"
                    transition={prefersReducedMotion ? { duration: 0 } : pageTransition.transition}
                    className="min-h-full"
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </RouteErrorBoundary>
            </main>

            {/* Mobile bottom navigation (<768px) */}
            <BottomNavigation />
          </div>
        </div>
      </div>

      {/* 全域 PWA/離線狀態提示 */}
      <OfflineIndicator />
      <UpdatePrompt />
    </ToastProvider>
  );
}
