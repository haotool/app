/**
 * SEO 內容頁共用的返回導覽與麵包屑區塊。
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';

export interface PageNavHeaderProps {
  breadcrumbItems: BreadcrumbItem[];
  fallbackHref?: string;
  className?: string;
}

export function PageNavHeader({
  breadcrumbItems,
  fallbackHref = '/',
  className = '',
}: PageNavHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackHref);
    }
  };

  return (
    <div
      data-testid="page-nav-header"
      className={`sticky top-0 z-20 -mx-4 px-4 pb-2.5 mb-6
        pt-[calc(0.625rem+env(safe-area-inset-top,0px))]
        bg-background/90 backdrop-blur-md
        border-b border-border/50 ${className}`}
    >
      <div className="flex min-h-[44px] items-center gap-3">
        {/* min-h-11：44px 觸控目標（WCAG 2.5.8）；focus-visible ring（WCAG 2.4.7）＋ active 回饋。 */}
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 cursor-pointer
            text-sm font-medium text-primary rounded
            transition-colors duration-200 hover:text-primary-hover active:opacity-70
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          aria-label={t('common.back')}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t('common.back')}</span>
        </button>

        <span className="h-4 w-px bg-border/60 shrink-0" aria-hidden="true" />

        <Breadcrumb items={breadcrumbItems} />
      </div>
    </div>
  );
}

export default PageNavHeader;
