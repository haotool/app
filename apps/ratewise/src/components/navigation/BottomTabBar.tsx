/**
 * BottomTabBar - Mobile Navigation (Material Design 3)
 *
 * @description MD3 Navigation Bar for mobile devices (<768px)
 * @see https://m3.material.io/components/navigation-bar/guidelines
 * @see component-tokens.ts - bottomTabBar
 *
 * 設計規格：
 * - 高度: 56px (MD3 標準)
 * - Tab 寬度: 64-96px
 * - 圖示: 24px
 * - 標籤: 12px (xs)
 * - 玻璃效果背景
 *
 * @version 1.0.0
 * @created 2025-01-18
 */

import { Home, List, Settings, TrendingUp } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

interface TabItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const tabs: TabItem[] = [
  { path: '/', icon: Home, label: '首頁' },
  { path: '/list', icon: List, label: '列表' },
  { path: '/trends', icon: TrendingUp, label: '趨勢' },
  { path: '/settings', icon: Settings, label: '設定' },
];

export function BottomTabBar() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-fixed md:hidden"
      style={{
        height: 'var(--nav-tab-bar-height, 56px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      role="navigation"
      aria-label="主要導覽"
    >
      {/* Glass Background */}
      <div
        className="absolute inset-0 border-t"
        style={{
          background: 'var(--glass-surface-base)',
          backdropFilter: 'blur(var(--glass-blur-lg, 24px))',
          WebkitBackdropFilter: 'blur(var(--glass-blur-lg, 24px))',
          borderColor: 'var(--glass-border-light)',
        }}
      />

      {/* Tab Items */}
      <div className="relative flex h-full items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="relative flex flex-col items-center justify-center gap-1 px-3 py-2"
              style={{
                minWidth: '64px',
                maxWidth: '96px',
                minHeight: 'var(--touch-target-min, 44px)',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active Indicator (MD3 Pill) */}
              {isActive && (
                <div
                  className="absolute top-1 rounded-full"
                  style={{
                    width: '64px',
                    height: '32px',
                    background: 'var(--color-accent-primary-subtle)',
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              )}

              {/* Icon */}
              <Icon
                size={24}
                className="relative z-10"
                style={{
                  color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                  transition: 'color var(--duration-fast) var(--easing-ease-out)',
                }}
                aria-hidden="true"
              />

              {/* Label */}
              <span
                className="relative z-10 text-center"
                style={{
                  fontSize: 'var(--font-size-xs, 14px)',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                  transition: 'color var(--duration-fast) var(--easing-ease-out)',
                }}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
