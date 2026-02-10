/** AppLayout：整合頁首、導覽與內容區，並處理頁面切換動畫。 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { BottomNavigation } from './BottomNavigation';
import { SideNavigation } from './SideNavigation';
import { ToastProvider } from './Toast';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { OfflineIndicator } from './OfflineIndicator';
import { UpdatePrompt } from './UpdatePrompt';

import { getResolvedLanguage } from '../i18n';
import { navigationTokens } from '../config/design-tokens';
import { getTopLevelTransitionDirection, pageTransition } from '../config/animations';

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

/** Header：行動版頁首，並避免 SSR hydration 語系不一致。 */
function Header() {
  const { t } = useTranslation();

  // 先用固定語系渲染，hydrate 後再切換到實際語系。
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

/**
 * 主應用佈局：含安全區域、響應式導覽與進場動畫。
 *
 * 使用 enter-only 動畫（無 exit），避免 mode="wait" 造成的空白閃爍。
 * 此為 iOS/Android tab bar 切換的業界標準做法。
 */
export function AppLayout() {
  const location = useLocation();
  const [previousPathname, setPreviousPathname] = React.useState(location.pathname);
  const [hasMounted, setHasMounted] = React.useState(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    if (previousPathname !== location.pathname) {
      setPreviousPathname(location.pathname);
    }
  }, [location.pathname, previousPathname]);

  const direction =
    previousPathname === location.pathname
      ? 0
      : getTopLevelTransitionDirection(previousPathname, location.pathname);
  const disableInitialAnimation = prefersReducedMotion || !hasMounted;

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
                {/* enter-only：key 變化觸發 remount，新頁面從方向滑入淡入 */}
                <motion.div
                  key={location.pathname}
                  initial={
                    disableInitialAnimation
                      ? false
                      : { opacity: 0, x: direction === 0 ? 0 : `${direction * 8}%` }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : pageTransition.transition}
                  className="min-h-full"
                >
                  <Outlet />
                </motion.div>
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
