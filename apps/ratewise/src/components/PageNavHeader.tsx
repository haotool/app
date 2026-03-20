/**
 * PageNavHeader - 頁面返回導航 + 麵包屑（SSOT 模組）
 *
 * 統一 SEO 落地頁（FAQ、Guide、About、Privacy、OpenData 等）的頂部導航區塊。
 * sticky top-0 固定於頁面頂部，下滑後仍可快速返回。
 * 使用 navigate(-1) 實現真正的「返回」行為，有瀏覽器歷史則返回上一頁，
 * 否則 fallback 到指定路徑（預設 '/'）。
 *
 * @design-token bg-background/90, border-border/50（來自 tailwind.config.ts）
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';

export interface PageNavHeaderProps {
  /** 麵包屑導航項目（第一項通常為首頁） */
  breadcrumbItems: BreadcrumbItem[];
  /** 無瀏覽器歷史時的 fallback 路徑，預設 '/' */
  fallbackHref?: string;
  className?: string;
}

/**
 * 頁面頂部導航區塊：返回按鈕 + 麵包屑。
 * sticky top-0 固定置頂，下滑後仍可見；backdrop-blur 提供玻璃質感背景。
 */
export function PageNavHeader({
  breadcrumbItems,
  fallbackHref = '/',
  className = '',
}: PageNavHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    // 有瀏覽器歷史則返回上一頁（例如：從設定頁進入則返回設定頁）。
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackHref);
    }
  };

  return (
    <div
      className={`sticky top-0 z-20 -mx-4 px-4 py-2.5 mb-6
        bg-background/90 backdrop-blur-md
        border-b border-border/50 ${className}`}
    >
      <div className="flex min-h-[44px] items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex shrink-0 items-center gap-1 cursor-pointer
            text-sm font-medium text-primary
            transition-colors hover:text-primary-hover"
          aria-label={t('common.back')}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t('common.back')}</span>
        </button>

        {/* 垂直分隔線 */}
        <span className="h-4 w-px bg-border/60 shrink-0" aria-hidden="true" />

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </div>
  );
}

export default PageNavHeader;
