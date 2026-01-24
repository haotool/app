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

import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { SideNavigation } from './SideNavigation';

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
 * - 品牌 Logo + 標題
 * - 48px 高度（參考 Threads/Instagram）
 *
 * @see navigationTokens.header - SSOT for header dimensions
 * @see https://developer.apple.com/design/human-interface-guidelines/tab-bars
 */
function Header() {
  return (
    <header
      className="
        h-12 px-4 pt-safe-top z-30
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
              text-xl font-black tracking-tight
              bg-clip-text text-transparent
              bg-gradient-to-r from-[rgb(var(--color-text))] to-[rgb(var(--color-primary))]
              [--webkit-background-clip:text]
            "
          >
            RateWise
          </h1>
        </div>
      </div>
    </header>
  );
}

/**
 * AppLayout 組件
 *
 * ParkKeeper 風格主佈局
 *
 * iOS PWA Standalone 模式修復：
 * - 使用 h-dvh 替代 h-screen (100vh → 100dvh)
 * - 100vh 在 iOS standalone 模式會包含 status bar + home indicator
 * - 100dvh (Dynamic Viewport Height) 正確計算可用視窗高度
 *
 * @reference https://web.dev/viewport-units/
 * @reference https://webkit.org/blog/7929/designing-websites-for-iphone-x/
 */
export function AppLayout() {
  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden font-sans bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]">
      {/* 桌面版側邊欄（≥ 768px 顯示） - 移至內容區旁 */}
      <div className="flex flex-1 overflow-hidden">
        <SideNavigation className="hidden md:block" />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header（移動端） */}
          <div className="md:hidden">
            <Header />
          </div>

          {/* 主內容區 */}
          <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
            <div className="h-full pb-safe-bottom">
              <Outlet />
            </div>
          </main>

          {/* 移動版底部導覽列（< 768px 顯示） */}
          <BottomNavigation />
        </div>
      </div>
    </div>
  );
}
