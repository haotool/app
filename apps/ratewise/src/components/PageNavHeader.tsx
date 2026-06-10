/**
 * SEO 內容頁共用的返回導覽與麵包屑區塊。
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';
import { pageNavHeaderTokens } from '../config/design-tokens';
import { cn } from '../utils/classnames';

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
    <div data-testid="page-nav-header" className={cn(pageNavHeaderTokens.root, className)}>
      <div className={pageNavHeaderTokens.row}>
        <button
          type="button"
          onClick={handleBack}
          className={pageNavHeaderTokens.backButton}
          aria-label={t('common.back')}
        >
          <ChevronLeft className={pageNavHeaderTokens.backIcon} aria-hidden="true" />
          <span>{t('common.back')}</span>
        </button>

        <Breadcrumb items={breadcrumbItems} className={pageNavHeaderTokens.breadcrumbSlot} />
      </div>
    </div>
  );
}

export default PageNavHeader;
