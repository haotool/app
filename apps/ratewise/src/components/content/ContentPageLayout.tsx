/**
 * ContentPageLayout（E4 內部內容頁共用骨架）
 *
 * 七個內容頁（FAQ／Guide／About／Privacy／OpenData／SeoTech／OpenSource）統一版面：
 * PageNavHeader（返回＋麵包屑）＋內容容器＋行動版底部導覽（修復審計 P1-8「內容頁遺失底部導覽」）。
 * 主題背景吃 semantic token，深色主題不再出現白字壓淺底。
 * @see .claude/prds/ratewise-e4-internal-pages-design.md
 */

import type { ReactNode } from 'react';
import { PageNavHeader } from '../PageNavHeader';
import { BottomNavigation } from '../BottomNavigation';
import type { BreadcrumbItem } from '../Breadcrumb';

export interface ContentPageLayoutProps {
  breadcrumbItems: BreadcrumbItem[];
  children: ReactNode;
  /**
   * 內容最大寬度：narrow＝長文閱讀（預設）；wide＝表格／技術頁；
   * wide-lg＝僅 ≥lg 放寬（供 lg: 兩欄 grid 頁使用，md–lg 帶維持閱讀寬度，#594 三階 A11/A12）。
   */
  width?: 'narrow' | 'wide' | 'wide-lg';
  testId?: string;
}

const WIDTH_CLASS: Record<NonNullable<ContentPageLayoutProps['width']>, string> = {
  narrow: 'max-w-3xl',
  wide: 'max-w-5xl',
  'wide-lg': 'max-w-3xl lg:max-w-5xl',
};

export function ContentPageLayout({
  breadcrumbItems,
  children,
  width = 'narrow',
  testId = 'content-page',
}: ContentPageLayoutProps) {
  return (
    // pt-safe-top：PWA standalone（viewport-fit=cover）下頂列不頂進瀏海（issue #601）；
    // 頂列本身為靜態（隨內容滾走），safe-area 由頁面容器統一承擔。
    <div className="min-h-screen bg-background text-text pt-safe-top" data-testid={testId}>
      {/* 底部保留導覽列高度＋safe-area，避免內容被固定導覽遮擋。 */}
      <div className={`container mx-auto ${WIDTH_CLASS[width]} px-4 pt-4 pb-24 md:pb-10`}>
        <PageNavHeader breadcrumbItems={breadcrumbItems} />
        {children}
      </div>
      {/* 內容頁保留 App 殼：行動版底部導覽常駐（md 以上自動隱藏）。 */}
      <BottomNavigation />
    </div>
  );
}

export default ContentPageLayout;
