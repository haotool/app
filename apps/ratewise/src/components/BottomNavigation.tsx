/**
 * Bottom Navigation Component
 *
 * 移動端底部導覽列，提供 4 大功能模組快速切換：
 * - 單幣別轉換 (Single Converter) - CreditCard 圖標
 * - 多幣別轉換 (Multi Converter) - Globe 圖標
 * - 收藏與歷史 (Favorites) - Star 圖標
 * - 設定 (Settings) - Settings 圖標
 *
 * 設計特性：
 * - 移動優先（< 768px 顯示，≥ 768px 隱藏）
 * - iOS Safe Area 適配（env(safe-area-inset-bottom)）
 * - 毛玻璃效果背景（backdrop-blur-md）
 * - ARIA 無障礙性支援
 * - lucide-react 輕量化圖標（1KB/icon）
 *
 * [refactor:2026-01-15] 新增底部導覽列組件支援模組化架構
 * 依據：Phase 2 架構升級計畫 - 底部導覽列設計
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
 * 導覽項目配置
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
 * BottomNavigation 組件
 *
 * 使用 React Router 的 Link 和 useLocation 實現導覽
 * 使用 lucide-react 的輕量化圖標
 * 使用 Tailwind CSS 的語義化 Design Token
 */
export function BottomNavigation() {
  const location = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white/95 dark:bg-neutral-dark/95
        backdrop-blur-md
        border-t border-neutral-light dark:border-neutral-border
        safe-area-inset-bottom
        md:hidden
      "
      aria-label="主要導航"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full
                transition-colors duration-200
                ${isActive ? 'text-primary' : 'text-neutral-text-muted hover:text-neutral-text'}
              `}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : ''}`}
                aria-hidden={true}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
