/**
 * Bottom Navigation Component - ParkKeeper Style (Compact)
 *
 * 移動端底部導覽列，參考 ParkKeeper 設計風格與社群媒體導航規範：
 * - 毛玻璃效果背景（backdrop-blur-xl + bg-background/80）
 * - 極細邊框（border-black/[0.02]）
 * - 緊湊標籤風格（text-[8px] + uppercase + tracking-[0.15em]）
 * - 選中指示條動畫
 * - 56px 高度（平衡 iOS 49pt 與 Material 56dp 標準）
 *
 * 導覽項目：
 * - 單幣別轉換 (Single Converter)
 * - 多幣別轉換 (Multi Converter)
 * - 收藏與歷史 (Favorites)
 * - 設定 (Settings)
 *
 * @reference ParkKeeper UI Design
 * @reference iOS HIG Tab Bars (49pt), Material Design 3 Nav Bar (56dp)
 * @see src/config/design-tokens.ts - navigationTokens SSOT
 * @created 2026-01-15
 * @updated 2026-01-24 - 緊湊導航高度（Threads/Instagram 風格）
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
 * ParkKeeper 風格導覽列（緊湊版）：
 * - 毛玻璃效果
 * - 選中狀態指示條
 * - 緊湊文字標籤（8px）
 * - 56px 高度（WCAG 44px touch target 合規）
 *
 * @see navigationTokens.bottomNav - SSOT for dimensions
 */
export function BottomNavigation() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 inset-x-0 h-14 pb-safe-bottom z-30
        bg-background/80 backdrop-blur-xl
        border-t border-black/[0.02]
        md:hidden
      "
      aria-label={t('nav.singleCurrencyFull')}
    >
      <div className="flex h-full max-w-md mx-auto relative px-4">
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
                className="w-full h-full flex flex-col items-center justify-center gap-0.5 relative group transition-transform duration-200 ease-out active:scale-95"
                tabIndex={-1}
              >
                {/* 圖標 - 20px (navigationTokens.bottomNav.icon.size) */}
                <div
                  className={`
                    transition-all duration-300
                    ${isActive ? 'text-primary scale-105' : 'opacity-30 group-hover:opacity-50'}
                  `}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} aria-hidden={true} />
                </div>

                {/* 標籤 - 8px (navigationTokens.bottomNav.label.fontSize) */}
                <span
                  className={`
                    text-[8px] font-black uppercase tracking-[0.15em]
                    transition-all duration-300
                    ${isActive ? 'text-primary' : 'opacity-30'}
                  `}
                >
                  {t(item.labelKey)}
                </span>

                {/* 選中指示條 - w-6 h-[3px] (navigationTokens.bottomNav.indicator) */}
                {isActive && (
                  <div className="absolute bottom-0 w-6 h-[3px] rounded-t-full bg-[rgb(var(--color-primary))] origin-center" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
