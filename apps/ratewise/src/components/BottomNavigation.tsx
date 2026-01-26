/**
 * Bottom Navigation Component - ParkKeeper Style (Compact)
 *
 * 移動端底部導覽列，參考 ParkKeeper 設計風格與社群媒體導航規範：
 * - 毛玻璃效果背景（backdrop-blur-xl + bg-background/80）
 * - 極細邊框（border-black/[0.02]）
 * - 緊湊標籤風格（text-[8px] + uppercase + tracking-[0.15em]）
 * - 選中指示條滑動動畫（Motion layoutId）
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
 * @see https://motion.dev/docs/react/-layout-group - layoutId 動畫
 */

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
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
 * BottomNavigation Component
 *
 * ParkKeeper-style navigation bar (compact version):
 * - Glassmorphism effect
 * - Active state indicator
 * - Compact text labels (8px)
 * - 56px content height + safe area (WCAG 44px touch target compliant)
 *
 * iOS PWA Safe Area Fix:
 * - Uses padding-bottom for safe area instead of fixed height
 * - Navigation content stays at 56px, safe area extends below
 *
 * @see navigationTokens.bottomNav - SSOT for dimensions
 * @see https://webkit.org/blog/7929/designing-websites-for-iphone-x/
 */
export function BottomNavigation() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 inset-x-0 z-30
        bg-background/80 backdrop-blur-xl
        border-t border-black/[0.02]
        md:hidden
        pb-[env(safe-area-inset-bottom,0px)]
      "
      aria-label={t('nav.mainNavigation')}
    >
      <div className="flex h-14 max-w-md mx-auto relative px-4">
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
                <motion.div
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    opacity: isActive ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.2 }}
                  className={isActive ? 'text-primary' : 'group-hover:opacity-50'}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} aria-hidden={true} />
                </motion.div>

                {/* 標籤 - 8px (navigationTokens.bottomNav.label.fontSize) */}
                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`
                    text-[8px] font-black uppercase tracking-[0.15em]
                    ${isActive ? 'text-primary' : ''}
                  `}
                >
                  {t(item.labelKey)}
                </motion.span>

                {/* 選中指示條 - w-6 h-[3px] (navigationTokens.bottomNav.indicator) */}
                {/* 使用 layoutId 實現滑動動畫效果 */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 w-6 h-[3px] rounded-t-full bg-[rgb(var(--color-primary))]"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
