/**
 * Bottom Navigation Component - ParkKeeper Style
 *
 * 移動端底部導覽列，參考 ParkKeeper 設計風格：
 * - 毛玻璃效果背景（backdrop-blur-xl + bg-background/80）
 * - 極細邊框（border-black/[0.02]）
 * - 上標籤風格（text-[9px] + uppercase + tracking-[0.2em]）
 * - 選中指示條動畫
 *
 * 導覽項目：
 * - 單幣別轉換 (Single Converter)
 * - 多幣別轉換 (Multi Converter)
 * - 收藏與歷史 (Favorites)
 * - 設定 (Settings)
 *
 * @reference ParkKeeper UI Design
 * @created 2026-01-15
 * @updated 2026-01-16 - ParkKeeper 風格重構
 */

import { Link, useLocation } from 'react-router-dom';
import { CreditCard, Globe, Star, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * 導覽項目類型
 */
interface NavItem {
  path: string;
  labelKey: string;
  ariaLabelKey: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean; strokeWidth?: number }>;
}

/**
 * 導覽項目配置 - 使用 i18n keys
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
 * BottomNavigation 組件
 *
 * ParkKeeper 風格導覽列：
 * - 毛玻璃效果
 * - 選中狀態指示條
 * - 極簡文字標籤
 */
export function BottomNavigation() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 inset-x-0 h-20 pb-safe-bottom z-30
        bg-background/80 backdrop-blur-xl
        border-t border-black/[0.02]
        md:hidden
      "
      aria-label={t('nav.singleCurrencyFull')}
    >
      <div className="flex h-full max-w-md mx-auto relative px-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex-1 h-full"
              aria-label={t(item.ariaLabelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              <button
                className="w-full h-full flex flex-col items-center justify-center gap-1 relative group transition-transform duration-200 ease-out active:scale-95"
                tabIndex={-1}
              >
                {/* 圖標 */}
                <div
                  className={`
                    transition-all duration-300
                    ${isActive ? 'text-primary scale-105' : 'opacity-30 group-hover:opacity-50'}
                  `}
                >
                  <Icon
                    className="w-[22px] h-[22px]"
                    strokeWidth={isActive ? 2.5 : 2}
                    aria-hidden={true}
                  />
                </div>

                {/* 標籤 - ParkKeeper 風格 */}
                <span
                  className={`
                    text-[9px] font-black uppercase tracking-[0.2em]
                    transition-all duration-300
                    ${isActive ? 'text-primary' : 'opacity-30'}
                  `}
                >
                  {t(item.labelKey)}
                </span>

                {/* 選中指示條 */}
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-1 rounded-t-full bg-[rgb(var(--color-primary))] origin-center" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
