/**
 * PageNavHeader - 頁面返回導航 + 麵包屑（SSOT 模組）
 *
 * 統一 SEO 落地頁（FAQ、Guide、About、Privacy、OpenData 等）的頂部導航區塊。
 * 使用 navigate(-1) 實現真正的「返回」行為，有瀏覽器歷史則返回上一頁，
 * 否則 fallback 到指定路徑（預設 '/'）。
 *
 * @design-token text-primary, hover:text-primary-hover（來自 design-tokens.ts）
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
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
 * 固定置於頁面頭部，提供一致的導航體驗。
 */
export function PageNavHeader({
  breadcrumbItems,
  fallbackHref = '/',
  className = '',
}: PageNavHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // 有瀏覽器歷史則返回上一頁（例如：從設定頁進入則返回設定頁）。
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackHref);
    }
  };

  return (
    <div className={`mb-8 ${className}`}>
      <button
        type="button"
        onClick={handleBack}
        className="mb-4 inline-flex items-center gap-1 text-primary transition-colors hover:text-primary-hover cursor-pointer"
        aria-label="返回上一頁"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium">返回</span>
      </button>

      <Breadcrumb items={breadcrumbItems} />
    </div>
  );
}

export default PageNavHeader;
