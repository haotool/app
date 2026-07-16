import { NavLink } from 'react-router-dom';
import {
  ArrowLeftRight,
  ChartCandlestick,
  Settings,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';

interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const TABS: TabItem[] = [
  { to: '/', label: '行情', icon: TrendingUp, end: true },
  { to: '/chart', label: '圖表', icon: ChartCandlestick },
  { to: '/trade', label: '交易', icon: ArrowLeftRight },
  { to: '/portfolio', label: '資產', icon: Wallet },
  { to: '/settings', label: '設定', icon: Settings },
];

export function BottomNav() {
  return (
    <nav
      aria-label="主導覽"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur"
      style={{ paddingBottom: 'var(--sab)' }}
    >
      <ul className="mx-auto flex h-14 max-w-lg items-stretch">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex h-full min-h-11 w-full flex-col items-center justify-center gap-0.5 text-caption transition-colors',
                  isActive ? 'text-primary' : 'text-text-3',
                )
              }
            >
              <Icon size={22} strokeWidth={1.8} aria-hidden />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
