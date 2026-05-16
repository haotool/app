/**
 * SEO 內容頁共用的返回導覽與麵包屑區塊。
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronLeft,
  Database,
  HelpCircle,
  Info,
  SearchCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';
import { APP_INFO } from '../config/app-info';
import { SUPPORT_INFO_LINKS, type SupportInfoHref } from '../config/support-info';

const SUPPORT_INFO_ICON_BY_HREF = {
  '/faq/': HelpCircle,
  '/guide/': BookOpen,
  '/about/': Info,
  '/open-data/': Database,
  '/seo-tech/': SearchCheck,
  '/privacy/': ShieldCheck,
} satisfies Record<SupportInfoHref, LucideIcon>;

function normalizeSupportPath(pathname: string): string {
  if (pathname === '/') return '/';
  return `${pathname.replace(/\/+$/, '')}/`;
}

export interface PageNavHeaderProps {
  breadcrumbItems: BreadcrumbItem[];
  fallbackHref?: string;
  showSupportNav?: boolean;
  className?: string;
}

export function PageNavHeader({
  breadcrumbItems,
  fallbackHref = '/',
  showSupportNav,
  className = '',
}: PageNavHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const normalizedPathname = normalizeSupportPath(location.pathname);
  const shouldShowSupportNav =
    showSupportNav ?? SUPPORT_INFO_LINKS.some((item) => item.href === normalizedPathname);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackHref);
    }
  };

  return (
    <header
      className={`sticky top-0 z-20 -mx-4 mb-6 border-b border-border/60 bg-background/95 shadow-sm shadow-primary/5 backdrop-blur-xl ${className}`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="px-4 py-2.5">
        <div className="flex min-h-[44px] items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full border border-border/70 bg-surface px-3 text-sm font-semibold text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={t('common.back')}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t('common.back')}</span>
          </button>

          <Link
            to="/"
            className="min-w-0 flex-1 rounded-xl px-1 py-0.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={t('nav.home')}
          >
            <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
              {t('settings.supportInfo')}
            </span>
            <span className="block truncate text-sm font-bold text-text">{APP_INFO.name}</span>
          </Link>
        </div>

        <Breadcrumb items={breadcrumbItems} className="mt-2" />

        {shouldShowSupportNav ? (
          <nav aria-label={t('settings.supportInfo')} className="-mx-1 mt-3 overflow-x-auto">
            <div className="flex min-w-max gap-2 px-1 pb-1">
              {SUPPORT_INFO_LINKS.map((item) => {
                const Icon = SUPPORT_INFO_ICON_BY_HREF[item.href];
                const isActive = normalizedPathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isActive
                        ? 'border-primary bg-primary/10 text-active-pill-foreground shadow-sm ring-1 ring-primary/20'
                        : 'border-border/70 bg-surface text-text-muted hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}

export default PageNavHeader;
