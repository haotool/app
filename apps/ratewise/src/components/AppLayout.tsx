/**
 * App Layout Component - ParkKeeper Style (Compact)
 *
 * 整合底部導覽列（移動端）與側邊欄導覽（桌面端）的主要佈局組件
 * 參考 ParkKeeper 設計風格與社群媒體導航規範：
 * - 毛玻璃 Header（backdrop-blur-xl + bg-background/80）
 * - 極細邊框（border-black/[0.03]）
 * - 品牌 Logo + 標題組合
 * - 緊湊導航高度（Header 48px，參考 Threads/Instagram）
 *
 * 佈局結構：
 * ```
 * <div class="h-screen flex flex-col overflow-hidden">
 *   <Header /> (h-12, 48px, glass effect)
 *   <main class="flex-1 overflow-hidden">
 *     <Outlet /> (內容區)
 *   </main>
 *   <BottomNavigation /> (h-14, 56px, fixed bottom)
 * </div>
 * ```
 *
 * @reference ParkKeeper UI Design
 * @reference iOS HIG Tab Bars, Material Design 3 Navigation Bar
 * @see src/config/design-tokens.ts - navigationTokens SSOT
 * @created 2026-01-15
 * @updated 2026-01-24 - 緊湊導航高度（Threads/Instagram 風格）
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNavigation } from './BottomNavigation';
import { SideNavigation } from './SideNavigation';
import { ToastProvider } from './Toast';
import { getResolvedLanguage } from '../i18n';

/**
 * Logo 組件 - 參考 ParkKeeper 的 SVG Logo 風格
 *
 * @description 使用明確的 width/height 屬性確保 SVG 尺寸一致
 * @see navigationTokens.header.logo - SSOT for logo dimensions
 */
function Logo() {
  return (
    <svg viewBox="0 0 40 40" width="28" height="28" className="w-7 h-7 shrink-0" aria-hidden="true">
      {/* 圓角矩形框 */}
      <rect
        x="6"
        y="6"
        width="28"
        height="28"
        rx="8"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* R 字母 */}
      <path
        d="M 15 28 L 15 12 L 22 12 C 25 12 26 13 26 16 C 26 19 25 20 22 20 L 15 20"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* 主題色裝飾圓點 */}
      <circle cx="28" cy="28" r="4" fill="rgb(var(--color-accent))" />
    </svg>
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

  // SSR 時使用固定的預設值，避免 hydration mismatch
  // Client 端 useEffect 後才更新為實際語系
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // SSR 時使用固定的預設語系（zh-TW），client hydration 後才使用實際語系
  const currentLanguage = isHydrated ? getResolvedLanguage() : 'zh-TW';
  const isZhTW = currentLanguage === 'zh-TW';

  return (
    <header
      className="
        h-12 px-4 pt-safe-top z-30 shrink-0
        bg-background/80 backdrop-blur-xl
        border-b border-black/[0.03]
        flex items-center
      "
    >
      <div className="flex justify-between items-center max-w-md mx-auto w-full">
        {/* 品牌 Logo + 標題 */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center">
            <Logo />
          </div>
          <h1
            className="
              text-lg font-black tracking-tight
              bg-clip-text text-transparent
              bg-gradient-to-r from-[rgb(var(--color-title-gradient-from))] to-[rgb(var(--color-title-gradient-to))]
              [-webkit-background-clip:text]
            "
          >
            {isZhTW ? 'RateWise 匯率好工具' : t('app.title')}
          </h1>
        </div>
      </div>
    </header>
  );
}

/**
 * AppLayout Component
 *
 * Main application layout with ParkKeeper design system.
 *
 * 2025 最佳實踐 - Flexbox 滾動容器修正：
 * - h-dvh 而非 min-h-dvh：確保固定高度約束，啟用 overflow 滾動
 * - min-h-0 on flex children：允許 flex 子元素收縮以啟用 overflow
 * - 內容區使用 overflow-y-auto：唯一的滾動點，避免嵌套滾動
 *
 * iOS PWA Standalone Mode Fix:
 * - Uses h-dvh for dynamic viewport height calculation
 * - Content area reserves space for fixed BottomNavigation (56px + safe area)
 * - Safe area handled via CSS env() variables
 *
 * Layout Structure:
 * - Header: 48px (mobile only, shrink-0)
 * - Main: flex-1 min-h-0 with overflow-y-auto
 * - BottomNavigation: fixed, 56px + safe-area-inset-bottom
 *
 * @see https://web.dev/viewport-units/
 * @see https://webkit.org/blog/7929/designing-websites-for-iphone-x/
 * @see https://stackoverflow.com/questions/21515042/scrolling-a-flexbox-with-overflowing-content
 */
export function AppLayout() {
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

            {/* Main content area - flex-1 min-h-0 啟用滾動，唯一滾動點
             *
             * iOS Safari Scroll Fix (2026 最佳實踐):
             * - overflow-y: scroll (not auto) - explicit scroll container
             * - -webkit-overflow-scrolling: touch - enables momentum scrolling on iOS
             * - overscroll-behavior-y: contain - prevents scroll chaining
             *
             * @see https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-overflow-scrolling
             * @see https://bugs.webkit.org/show_bug.cgi?id=275209
             */}
            <main
              data-scroll-container="main"
              className="flex-1 min-h-0 min-w-0 w-full relative overflow-y-auto overflow-x-hidden pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0 [-webkit-overflow-scrolling:touch] overscroll-y-contain"
            >
              <Outlet />
            </main>

            {/* Mobile bottom navigation (<768px) */}
            <BottomNavigation />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
