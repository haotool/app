/**
 * PageContainer Component - Unified Page Layout (SSOT)
 *
 * 統一所有頁面的內容區域佈局，確保視覺一致性。
 * 使用 design-tokens.ts 中的 pageLayoutTokens 作為 SSOT。
 *
 * 設計原理（2025 最佳實踐）：
 * - 外層容器：min-h-full（不重複 overflow，由 AppLayout 統一處理滾動）
 * - 內容區域：水平內距 20px、垂直內距 24px、最大寬度 448px
 * - 底部留白：由 AppLayout pb-[calc(56px+safe-area)] 統一處理
 * - 支援自定義變體：default (標準)、full (滿版)、centered (置中)
 *
 * @example
 * ```tsx
 * // 標準頁面佈局
 * <PageContainer>
 *   <h1>Page Title</h1>
 *   <p>Content...</p>
 * </PageContainer>
 *
 * // 滿版佈局 (無 maxWidth 限制)
 * <PageContainer variant="full">
 *   <FullWidthComponent />
 * </PageContainer>
 *
 * // 置中佈局 (適合登入、空狀態等)
 * <PageContainer variant="centered">
 *   <LoginForm />
 * </PageContainer>
 *
 * // 自定義間距
 * <PageContainer padding="none" className="custom-class">
 *   <CustomContent />
 * </PageContainer>
 * ```
 *
 * @see src/config/design-tokens.ts - pageLayoutTokens SSOT
 * @see AppLayout.tsx - 外層滾動容器
 * @created 2026-01-25
 * @updated 2026-01-26 - 修正捲軸跑版問題
 * @version 2.0.0
 */

import React from 'react';
import { pageLayoutTokens } from '../config/design-tokens';

export type PageContainerVariant = 'default' | 'full' | 'centered';
export type PageContainerPadding = 'default' | 'compact' | 'none';

export interface PageContainerProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 佈局變體 */
  variant?: PageContainerVariant;
  /** 內距模式 */
  padding?: PageContainerPadding;
  /** 自定義類別 */
  className?: string;
  /**
   * 是否顯示底部留白
   * @deprecated 已由 AppLayout 統一處理，此參數已無作用
   */
  hasBottomNav?: boolean;
  /** 作為 section 還是 div */
  as?: 'div' | 'section' | 'article';
}

/**
 * 取得容器類別
 *
 * @description 使用 min-h-full 確保內容至少填滿視口，
 *              滾動由 AppLayout 統一處理，避免雙重滾動問題
 */
function getContainerClasses(): string {
  return pageLayoutTokens.container.className;
}

/**
 * 取得內容區域類別
 */
function getContentClasses(
  variant: PageContainerVariant,
  padding: PageContainerPadding,
  className?: string,
): string {
  // 內距配置
  const paddingClasses = {
    default: 'px-5 py-6',
    compact: 'px-4 py-4',
    none: '',
  };

  // 變體配置
  const variantClasses = {
    default: 'max-w-md mx-auto',
    full: 'max-w-full',
    centered: 'max-w-md mx-auto flex flex-col items-center justify-center min-h-full',
  };

  return [paddingClasses[padding], variantClasses[variant], className].filter(Boolean).join(' ');
}

/**
 * PageContainer 組件
 */
export function PageContainer({
  children,
  variant = 'default',
  padding = 'default',
  className,
  hasBottomNav: _hasBottomNav = true, // deprecated, kept for backwards compatibility
  as: Component = 'div',
}: PageContainerProps) {
  return (
    <div className={getContainerClasses()}>
      <Component className={getContentClasses(variant, padding, className)}>{children}</Component>
    </div>
  );
}

/**
 * PageSection - 頁面區塊組件
 *
 * 用於分隔頁面內的不同區塊，統一區塊間距。
 *
 * @example
 * ```tsx
 * <PageContainer>
 *   <PageSection>
 *     <h2>Section 1</h2>
 *     <p>Content...</p>
 *   </PageSection>
 *   <PageSection>
 *     <h2>Section 2</h2>
 *     <p>Content...</p>
 *   </PageSection>
 * </PageContainer>
 * ```
 */
export interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  /** 是否為最後一個區塊 (不加底部間距) */
  isLast?: boolean;
}

export function PageSection({ children, className, isLast = false }: PageSectionProps) {
  const { section } = pageLayoutTokens;
  const sectionClass = isLast ? '' : section.className;

  return <section className={`${sectionClass} ${className ?? ''}`}>{children}</section>;
}

/**
 * PageCard - 頁面卡片組件
 *
 * 統一卡片樣式，整合 design tokens。
 *
 * @example
 * ```tsx
 * <PageCard>
 *   <h3>Card Title</h3>
 *   <p>Card content...</p>
 * </PageCard>
 * ```
 */
export interface PageCardProps {
  children: React.ReactNode;
  className?: string;
  /** 是否可互動 (添加 hover 效果) */
  interactive?: boolean;
  /** 點擊事件 */
  onClick?: () => void;
}

export function PageCard({ children, className, interactive = false, onClick }: PageCardProps) {
  const { card } = pageLayoutTokens;
  const interactiveClass = interactive ? 'cursor-pointer hover:shadow-card-hover' : '';

  return (
    <div
      className={`${card.className} ${interactiveClass} ${className ?? ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}

export default PageContainer;
