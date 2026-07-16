import clsx from 'clsx';
import { SYMBOL_META, type MarketSymbol } from '../config/market';

interface CoinBadgeProps {
  symbol: MarketSymbol;
  size?: 'sm' | 'md';
  variant?: 'solid' | 'soft';
}

export function CoinBadge({ symbol, size = 'sm', variant = 'solid' }: CoinBadgeProps) {
  const meta = SYMBOL_META[symbol];
  return (
    <span
      aria-hidden
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'md' ? 'size-9' : 'size-8',
        meta.base.length >= 4 ? 'text-[9px] tracking-tight' : 'text-caption',
        variant === 'soft' ? 'text-text' : 'text-bg',
      )}
      style={{
        backgroundColor:
          variant === 'soft' ? `color-mix(in srgb, ${meta.accent} 20%, transparent)` : meta.accent,
      }}
    >
      {meta.base}
    </span>
  );
}
