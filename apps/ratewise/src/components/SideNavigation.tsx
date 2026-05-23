/**
 * Side Navigation Component (Desktop)
 *
 * Desktop sidebar navigation with 4 main modules:
 * - Single Currency Converter
 * - Multi Currency Converter
 * - Favorites & History
 * - Settings
 *
 * Design features:
 * - Desktop-first (visible ≥ 768px, hidden < 768px)
 * - Vertical layout
 * - ARIA accessibility support
 * - i18n-aware labels and aria attributes
 */

import { Link, useLocation } from 'react-router-dom';
import { getDisplayVersion } from '../config/version';
import { useTranslation } from 'react-i18next';
import { CreditCard, Globe, Star, Settings } from 'lucide-react';

/**
 * 導覽項目類型 - 使用 i18n keys（與 BottomNavigation 一致）
 */
interface NavItem {
  path: string;
  labelKey: string;
  ariaLabelKey: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

/**
 * 導覽項目配置（與 BottomNavigation 使用相同 i18n keys）
 */
const navItems: NavItem[] = [
  {
    path: '/',
    labelKey: 'nav.singleCurrency',
    ariaLabelKey: 'nav.singleCurrencyFull',
    icon: CreditCard,
  },
  {
    path: '/multi/',
    labelKey: 'nav.multiCurrency',
    ariaLabelKey: 'nav.multiCurrencyFull',
    icon: Globe,
  },
  {
    path: '/favorites/',
    labelKey: 'nav.favorites',
    ariaLabelKey: 'nav.favoritesFull',
    icon: Star,
  },
  {
    path: '/settings/',
    labelKey: 'nav.settings',
    ariaLabelKey: 'nav.settingsFull',
    icon: Settings,
  },
];

function normalizeNavPath(path: string): string {
  if (!path || path === '/') return '/';
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * SideNavigation Props
 */
interface SideNavigationProps {
  className?: string;
}

/**
 * SideNavigation 組件（桌面版）
 *
 * 垂直排列的側邊欄導覽，與底部導覽列功能相同
 * 使用響應式 CSS 控制顯示（hidden md:block）
 */
export function SideNavigation({ className = '' }: SideNavigationProps) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <aside
      className={`
        ${className}
        w-72 xl:w-80
        bg-background
        border-r border-border
        flex flex-col
      `}
      aria-label={t('nav.mainNavigation')}
    >
      {/* Logo / Brand */}
      <div className="border-b border-border px-7 py-6">
        {/* 品牌標題（使用 span 而非 h1，與 mobile Header 一致，避免每頁重複 h1） */}
        <span
          data-testid="app-title"
          className="text-[1.125rem] font-semibold tracking-[0.01em] text-text"
        >
          {t('app.title')}
        </span>
        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-text-muted">
          {t('app.subtitle')}
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-5 space-y-1.5">
        {navItems.map((item) => {
          const isActive = normalizeNavPath(location.pathname) === normalizeNavPath(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3
                min-h-11 px-3.5 py-2.5
                rounded-lg border border-transparent
                transition-colors duration-200
                ${
                  isActive
                    ? 'border-primary/20 bg-primary/10 font-medium text-text'
                    : 'text-text-muted hover:bg-border/30 hover:text-text'
                }
              `}
              aria-label={t(item.ariaLabelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} aria-hidden={true} />
              <span className="text-sm">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-7 py-5">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">
          {t('app.version')} {getDisplayVersion()}
        </p>
      </div>
    </aside>
  );
}
