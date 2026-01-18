/**
 * ResponsiveLayout - 三端響應式佈局容器
 *
 * @description 整合 BottomTabBar / NavRail / Sidebar 的響應式佈局
 *
 * 斷點策略：
 * - Mobile (<768px): BottomTabBar + 底部 padding
 * - Tablet (768-1023px): NavRail + 左側 padding
 * - Desktop (≥1024px): Sidebar + 左側 padding
 *
 * 設計規格：
 * - Mobile: padding-bottom: 56px + safe-area
 * - Tablet: padding-left: 80px
 * - Desktop: padding-left: 256px (展開) / 72px (收合)
 *
 * @version 1.0.0
 * @created 2025-01-18
 */

import type { ReactNode } from 'react';
import { BottomTabBar, NavRail, Sidebar } from '../navigation';

interface ResponsiveLayoutProps {
  children: ReactNode;
  /** 是否顯示導覽列（某些頁面可能需要隱藏） */
  showNavigation?: boolean;
  /** 內容區最大寬度 */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthMap = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
};

export function ResponsiveLayout({
  children,
  showNavigation = true,
  maxWidth = 'xl',
}: ResponsiveLayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Navigation Components - Rendered based on screen size via CSS */}
      {showNavigation && (
        <>
          <BottomTabBar />
          <NavRail />
          <Sidebar />
        </>
      )}

      {/* Main Content Area */}
      <main
        className="
          min-h-screen
          pb-[calc(56px+env(safe-area-inset-bottom))]
          md:pb-0
          md:pl-[80px]
          lg:pl-[256px]
          transition-[padding] duration-300
        "
      >
        {/* Content Container with max-width */}
        <div
          className="mx-auto px-4 py-6 md:px-6 lg:px-8"
          style={{
            maxWidth: maxWidthMap[maxWidth],
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * ContentSection - 內容區塊容器
 *
 * @description 提供一致的內容區塊樣式（玻璃效果卡片）
 */
interface ContentSectionProps {
  children: ReactNode;
  className?: string;
  /** 使用玻璃效果 */
  glass?: boolean;
  /** 自訂 padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '0',
  sm: 'var(--spacing-3)',
  md: 'var(--spacing-4)',
  lg: 'var(--spacing-6)',
};

export function ContentSection({
  children,
  className = '',
  glass = true,
  padding = 'md',
}: ContentSectionProps) {
  return (
    <section
      className={`rounded-xl ${className}`}
      style={{
        padding: paddingMap[padding],
        ...(glass
          ? {
              background: 'var(--glass-surface-base)',
              backdropFilter: 'blur(var(--glass-blur-md, 16px))',
              WebkitBackdropFilter: 'blur(var(--glass-blur-md, 16px))',
              border: '1px solid var(--glass-border-light)',
            }
          : {}),
      }}
    >
      {children}
    </section>
  );
}

/**
 * PageHeader - 頁面標題區
 *
 * @description 統一的頁面標題樣式
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between mb-6">
      <div>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl, 24px)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-1"
            style={{
              fontSize: 'var(--font-size-sm, 14px)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
