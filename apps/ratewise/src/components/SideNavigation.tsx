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
    path: '/multi',
    labelKey: 'nav.multiCurrency',
    ariaLabelKey: 'nav.multiCurrencyFull',
    icon: Globe,
  },
  {
    path: '/favorites',
    labelKey: 'nav.favorites',
    ariaLabelKey: 'nav.favoritesFull',
    icon: Star,
  },
  {
    path: '/settings',
    labelKey: 'nav.settings',
    ariaLabelKey: 'nav.settingsFull',
    icon: Settings,
  },
];

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
        w-64
        bg-[rgb(var(--color-surface))]
        border-r border-[rgb(var(--color-border))]
        flex flex-col
      `}
      aria-label={t('nav.mainNavigation')}
    >
      {/* Logo / Brand */}
      <div className="px-6 py-4 border-b border-[rgb(var(--color-border))]">
        <h1 className="text-xl font-bold text-[rgb(var(--color-text))]">{t('app.title')}</h1>
        <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">{t('app.subtitle')}</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3
                px-3 py-2
                rounded-lg
                transition-colors duration-200
                ${
                  isActive
                    ? 'bg-[rgb(var(--color-accent)/0.1)] text-[rgb(var(--color-primary))] font-medium'
                    : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-border)/0.5)] hover:text-[rgb(var(--color-text))]'
                }
              `}
              aria-label={t(item.ariaLabelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-[rgb(var(--color-primary))]' : ''}`}
                aria-hidden={true}
              />
              <span className="text-sm">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[rgb(var(--color-border))]">
        <p className="text-xs text-[rgb(var(--color-text-muted))]">{t('app.version')} v2.0.0</p>
      </div>
    </aside>
  );
}
