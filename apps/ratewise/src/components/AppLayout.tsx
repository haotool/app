/**
 * App Layout Component
 *
 * 整合底部導覽列（移動端）與側邊欄導覽（桌面端）的主要佈局組件
 * 使用 React Router 的 Outlet 渲染子路由
 *
 * 佈局結構：
 * ```
 * <div> (flex container)
 *   <SideNavigation /> (hidden md:block - 桌面版)
 *   <div> (main area)
 *     <Header /> (簡化的標題列)
 *     <main> (內容區 + Outlet)
 *     <BottomNavigation /> (md:hidden - 移動版)
 *   </div>
 * </div>
 * ```
 *
 * 響應式策略：
 * - < 768px: 底部導覽列 + 全寬內容區
 * - ≥ 768px: 側邊欄導覽 + 內容區
 *
 * iOS Safe Area 適配：
 * - 移動端主內容區底部留出 4rem + safe-area-inset-bottom 空間
 * - 桌面端移除額外 padding
 *
 * [refactor:2026-01-15] 新增 AppLayout 整合導覽系統
 * 依據：Phase 2 架構升級計畫 - AppLayout 設計
 */

import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { SideNavigation } from './SideNavigation';
import { ThemeToggle } from './ThemeToggle';

/**
 * Header 組件（簡化版）
 *
 * 移動端顯示簡化的標題列
 * 桌面端可以顯示完整導航（未來擴展）
 */
function Header() {
  return (
    <header
      className="
        sticky top-0 z-40
        bg-white/95 dark:bg-neutral-dark/95
        backdrop-blur-md
        border-b border-neutral-light dark:border-neutral-border
        px-4 py-3
        md:hidden
      "
    >
      <div className="flex items-center justify-between max-w-content mx-auto">
        <h1 className="text-lg font-bold text-neutral-text">RateWise</h1>
        <ThemeToggle />
      </div>
    </header>
  );
}

/**
 * AppLayout 組件
 *
 * 主要佈局組件，整合響應式導覽系統
 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* 桌面版側邊欄（≥ 768px 顯示） */}
      <SideNavigation className="hidden md:block" />

      {/* 主要內容區 */}
      <div className="flex-1 flex flex-col">
        {/* 簡化的 Header（移動端） */}
        <Header />

        {/* 內容區（Outlet 渲染子路由） */}
        <main
          className="
            flex-1
            px-4 py-6
            pb-20 md:pb-6
            max-w-content mx-auto w-full
          "
        >
          <Outlet />
        </main>

        {/* 移動版底部導覽列（< 768px 顯示） */}
        <BottomNavigation />
      </div>
    </div>
  );
}
