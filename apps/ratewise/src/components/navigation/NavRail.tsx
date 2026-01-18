/**
 * NavRail - Tablet Navigation (Material Design 3)
 *
 * @description MD3 Navigation Rail for tablets (768px - 1023px)
 * @see https://m3.material.io/components/navigation-rail/guidelines
 * @see component-tokens.ts - navRail
 *
 * 設計規格：
 * - 寬度: 80px (MD3 標準)
 * - 項目: 56x56px
 * - 圖示: 24px
 * - 標籤: 12px
 * - 玻璃效果背景
 *
 * @version 1.0.0
 * @created 2025-01-18
 */

import { Home, List, Settings, TrendingUp, Star } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: Home, label: '首頁' },
  { path: '/list', icon: List, label: '列表' },
  { path: '/favorites', icon: Star, label: '收藏' },
  { path: '/trends', icon: TrendingUp, label: '趨勢' },
  { path: '/settings', icon: Settings, label: '設定' },
];

export function NavRail() {
  const location = useLocation();

  return (
    <nav
      className="fixed left-0 top-0 bottom-0 z-fixed hidden md:flex lg:hidden flex-col"
      style={{
        width: 'var(--nav-rail-width, 80px)',
        paddingTop: 'var(--spacing-6, 24px)',
        paddingBottom: 'var(--spacing-6, 24px)',
      }}
      role="navigation"
      aria-label="主要導覽"
    >
      {/* Glass Background */}
      <div
        className="absolute inset-0 border-r"
        style={{
          background: 'var(--glass-surface-base)',
          backdropFilter: 'blur(var(--glass-blur-lg, 24px))',
          WebkitBackdropFilter: 'blur(var(--glass-blur-lg, 24px))',
          borderColor: 'var(--glass-border-light)',
        }}
      />

      {/* Logo Area */}
      <div className="relative flex justify-center mb-6">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: '48px',
            height: '48px',
            background: 'var(--color-accent-primary-subtle)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-xl, 20px)',
              fontWeight: 700,
              color: 'var(--color-accent-primary)',
            }}
          >
            R
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="relative flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center gap-1 rounded-xl transition-colors"
              style={{
                width: '56px',
                height: '56px',
                background: isActive ? 'var(--color-accent-primary-subtle)' : 'transparent',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={24}
                style={{
                  color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                }}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
