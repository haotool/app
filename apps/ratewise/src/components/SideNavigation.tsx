/**
 * Side Navigation Component (Desktop)
 *
 * 桌面版側邊欄導覽，與 BottomNavigation 相同的 4 大功能模組：
 * - 單幣別轉換 (Single Converter)
 * - 多幣別轉換 (Multi Converter)
 * - 收藏與歷史 (Favorites)
 * - 設定 (Settings)
 *
 * 設計特性：
 * - 桌面優先（≥ 768px 顯示，< 768px 隱藏）
 * - 垂直佈局（與底部導覽列相反）
 * - 相同的圖標與標籤
 * - ARIA 無障礙性支援
 *
 * [refactor:2026-01-15] 新增桌面版側邊欄導覽組件
 * 依據：Phase 2 架構升級計畫 - 響應式導覽策略
 */

import { Link, useLocation } from 'react-router-dom';
import { CreditCard, Globe, Star, Settings } from 'lucide-react';

/**
 * 導覽項目類型
 */
interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  ariaLabel: string;
}

/**
 * 導覽項目配置（與 BottomNavigation 相同）
 */
const navItems: NavItem[] = [
  {
    path: '/',
    label: '單幣別',
    icon: CreditCard,
    ariaLabel: '單幣別轉換',
  },
  {
    path: '/multi',
    label: '多幣別',
    icon: Globe,
    ariaLabel: '多幣別轉換',
  },
  {
    path: '/favorites',
    label: '收藏',
    icon: Star,
    ariaLabel: '收藏與歷史',
  },
  {
    path: '/settings',
    label: '設定',
    icon: Settings,
    ariaLabel: '應用程式設定',
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
  const location = useLocation();

  return (
    <aside
      className={`
        ${className}
        w-64
        bg-white dark:bg-neutral-dark
        border-r border-neutral-light dark:border-neutral-border
        flex flex-col
      `}
      aria-label="主要導航"
    >
      {/* Logo / Brand */}
      <div className="px-6 py-4 border-b border-neutral-light dark:border-neutral-border">
        <h1 className="text-xl font-bold text-neutral-text">RateWise</h1>
        <p className="text-xs text-neutral-text-muted mt-1">匯率換算工具</p>
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
                    ? 'bg-primary-light text-primary-text font-medium'
                    : 'text-neutral-text-muted hover:bg-neutral-light hover:text-neutral-text'
                }
              `}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} aria-hidden={true} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-neutral-light dark:border-neutral-border">
        <p className="text-xs text-neutral-text-muted">版本 v2.0.0</p>
      </div>
    </aside>
  );
}
