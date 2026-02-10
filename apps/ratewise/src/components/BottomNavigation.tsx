/** BottomNavigation：行動版四頁導覽列。 */

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { CreditCard, Globe, Star, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { transitions } from '../config/animations';

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

/** 底部導覽列（含安全區域與選中指示器）。 */
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
              className="flex-1 h-full flex flex-col items-center justify-center gap-0.5 relative group touch-manipulation"
              aria-label={t(item.ariaLabelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* 觸控回饋背景（避免在 <a> 內使用 whileTap 產生 tabindex）。 */}
              <div
                className="
                  absolute inset-1 rounded-xl bg-primary/0
                  transition-colors duration-75
                  group-active:bg-primary/10
                "
              />

              {/* 圖標動畫（僅使用 animate，避免 tabindex 問題）。 */}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  opacity: isActive ? 1 : 0.35,
                }}
                transition={transitions.spring}
                className={`
                  ${isActive ? 'text-primary' : ''}
                  transition-transform duration-75
                  group-active:scale-90
                `}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} aria-hidden={true} />
              </motion.div>

              {/* 標籤 - 8px */}
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.35,
                  y: isActive ? 0 : 1,
                }}
                transition={transitions.default}
                className={`
                  text-[8px] font-black uppercase tracking-[0.15em]
                  ${isActive ? 'text-primary' : ''}
                `}
              >
                {t(item.labelKey)}
              </motion.span>

              {/* 選中指示條 - layoutId 滑動動畫 */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 w-6 h-[3px] rounded-t-full bg-[rgb(var(--color-primary))]"
                  transition={transitions.spring}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
