/**
 * Sidebar - Desktop Navigation
 *
 * @description 桌面端側邊欄導覽 (≥1024px)
 * @see component-tokens.ts - sidebar
 *
 * 設計規格：
 * - 展開寬度: 256px
 * - 收合寬度: 72px
 * - 項目高度: 40px
 * - 玻璃效果背景
 *
 * @version 1.0.0
 * @created 2025-01-18
 */

import {
  Home,
  List,
  Settings,
  TrendingUp,
  Star,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { path: '/', icon: Home, label: '首頁' },
      { path: '/list', icon: List, label: '貨幣列表' },
      { path: '/favorites', icon: Star, label: '收藏貨幣' },
      { path: '/trends', icon: TrendingUp, label: '趨勢分析' },
    ],
  },
  {
    title: '更多',
    items: [
      { path: '/settings', icon: Settings, label: '設定' },
      { path: '/faq', icon: HelpCircle, label: '常見問題' },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarWidth = isCollapsed ? '72px' : '256px';

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-fixed hidden lg:flex flex-col transition-all duration-300"
      style={{
        width: sidebarWidth,
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

      {/* Header */}
      <div
        className="relative flex items-center justify-between px-4 border-b"
        style={{
          height: 'var(--nav-top-bar-height, 64px)',
          borderColor: 'var(--glass-border-light)',
        }}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: '40px',
                height: '40px',
                background: 'var(--color-accent-primary-subtle)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-lg, 18px)',
                  fontWeight: 700,
                  color: 'var(--color-accent-primary)',
                }}
              >
                R
              </span>
            </div>
            <span
              style={{
                fontSize: 'var(--font-size-lg, 18px)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              RateWise
            </span>
          </div>
        )}

        {isCollapsed && (
          <div
            className="flex items-center justify-center rounded-xl mx-auto"
            style={{
              width: '40px',
              height: '40px',
              background: 'var(--color-accent-primary-subtle)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-lg, 18px)',
                fontWeight: 700,
                color: 'var(--color-accent-primary)',
              }}
            >
              R
            </span>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border shadow-md"
          style={{
            width: '24px',
            height: '24px',
            background: 'var(--color-surface-default)',
            borderColor: 'var(--color-border-default)',
          }}
          aria-label={isCollapsed ? '展開側邊欄' : '收合側邊欄'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav Sections */}
      <div className="relative flex-1 overflow-y-auto py-4 px-3">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {/* Section Title */}
            {section.title && !isCollapsed && (
              <div
                className="px-3 mb-2"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {section.title}
              </div>
            )}

            {/* Nav Items */}
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 rounded-lg transition-colors"
                    style={{
                      height: '40px',
                      padding: isCollapsed ? '0 12px' : '0 12px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      background: isActive ? 'var(--color-accent-primary-subtle)' : 'transparent',
                    }}
                    title={isCollapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon
                      size={20}
                      style={{
                        color: isActive
                          ? 'var(--color-accent-primary)'
                          : 'var(--color-text-secondary)',
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    />
                    {!isCollapsed && (
                      <span
                        style={{
                          fontSize: 'var(--font-size-sm, 14px)',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive
                            ? 'var(--color-accent-primary)'
                            : 'var(--color-text-secondary)',
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div
          className="relative px-4 py-3 border-t"
          style={{
            borderColor: 'var(--glass-border-light)',
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          <div>RateWise v1.5.0</div>
          <div>臺灣銀行牌告匯率</div>
        </div>
      )}
    </aside>
  );
}
