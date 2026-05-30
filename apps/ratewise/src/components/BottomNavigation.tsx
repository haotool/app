/** BottomNavigation：行動版四頁導覽列。 */

import React, { useTransition } from 'react';
import { useNavigate, useLocation, useHref } from 'react-router-dom';
import { CreditCard, Globe, Star, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** 導覽項目型別。 */
interface NavItem {
  path: string;
  labelKey: string;
  ariaLabelKey: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean; strokeWidth?: number }>;
}

/** 導覽項目設定（使用 i18n key）。 */
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

interface BottomNavigationItemProps {
  item: NavItem;
  isActive: boolean;
  isPending: boolean;
  onNavigate: (event: React.MouseEvent<HTMLAnchorElement>, path: string) => void;
  t: (key: string) => string;
}

function BottomNavigationItem({
  item,
  isActive,
  isPending,
  onNavigate,
  t,
}: BottomNavigationItemProps) {
  const resolvedHref = useHref(item.path);
  const href = item.path === '/' && !resolvedHref.endsWith('/') ? `${resolvedHref}/` : resolvedHref;
  const Icon = item.icon;

  return (
    <a
      href={href}
      onClick={(event) => onNavigate(event, item.path)}
      className="flex-1 h-full flex flex-col items-center justify-center gap-0.5 relative group touch-manipulation"
      aria-label={t(item.ariaLabelKey)}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* 觸控回饋背景（避免在 <a> 內使用 whileTap 產生 tabindex）。 */}
      <div
        className="
          absolute inset-1 rounded-control bg-primary/0
          transition-colors duration-75
          group-active:bg-primary/10
        "
      />

      {/* 圖標（CSS transition 替代 motion，去除 vendor-motion 依賴） */}
      <div
        className={`
          relative transition-[opacity,transform,color] duration-200
          ${isActive ? 'scale-105 opacity-100 text-primary' : isPending ? 'opacity-80 scale-100' : 'opacity-[0.55] scale-100'}
          group-active:scale-90
        `}
      >
        <Icon
          className="w-5 h-5"
          strokeWidth={isActive ? 2.5 : isPending ? 2.25 : 2}
          aria-hidden={true}
        />
        {/* 等待指示點：chunk 載入中時顯示 */}
        {isPending && (
          <span
            className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
            aria-hidden="true"
          />
        )}
      </div>

      {/* 標籤 */}
      <span
        className={`
          text-xs font-semibold uppercase tracking-[0.08em] transition-[opacity,transform,color] duration-200
          ${isActive ? 'text-primary opacity-100 translate-y-0' : isPending ? 'opacity-80 translate-y-px' : 'opacity-[0.55] translate-y-px'}
        `}
      >
        {t(item.labelKey)}
      </span>

      {/* 選中指示條（靜態，無滑動動畫） */}
      {isActive && <div className="absolute bottom-0 h-[3px] w-6 rounded-t-full bg-primary" />}
    </a>
  );
}

/** 底部導覽列（含安全區域與選中指示器）。 */
export function BottomNavigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isPending) setPendingPath(null);
  }, [isPending]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (path === location.pathname) return;
    setPendingPath(path);
    startTransition(() => {
      navigate(path);
    });
  };

  return (
    <nav
      className="
        fixed bottom-0 inset-x-0 z-30
        bg-background/92 backdrop-blur-md
        border-t border-border/70
        md:hidden
        pb-[env(safe-area-inset-bottom,0px)]
      "
      aria-label={t('nav.mainNavigation')}
    >
      <div className="flex h-14 max-w-lg mx-auto relative px-4">
        {navItems.map((item) => {
          const isActive = normalizeNavPath(location.pathname) === normalizeNavPath(item.path);
          const isThisPending = isPending && pendingPath === item.path;

          return (
            <BottomNavigationItem
              key={item.path}
              item={item}
              isActive={isActive}
              isPending={isThisPending}
              onNavigate={handleNavClick}
              t={t}
            />
          );
        })}
      </div>
    </nav>
  );
}
