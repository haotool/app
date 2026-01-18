/**
 * RateDisplayCard - Exchange rate display card with mini trend chart
 *
 * A glassmorphism card component that displays exchange rate information
 * with an integrated mini trend chart slot.
 *
 * Features:
 * - Primary rate display (large, prominent)
 * - Reverse rate display (secondary)
 * - Change indicator (up/down arrow with percentage)
 * - Rate type toggle (spot/cash)
 * - Mini trend chart slot (80px height, constrained)
 *
 * Size constraints:
 * - Card max-width: 480px (prevents overly wide cards on desktop)
 * - Trend chart height: 80px (compact but readable)
 * - Trend chart width: 100% (fills card width)
 *
 * @module components/ui/RateDisplayCard
 */

import type { ReactNode, CSSProperties } from 'react';
import { TrendingUp, TrendingDown, Minus, Banknote, CreditCard } from 'lucide-react';
import { formatExchangeRate } from '../../utils/currencyFormatter';

type RateType = 'spot' | 'cash';

interface RateDisplayCardProps {
  /** Source currency code */
  fromCurrency: string;
  /** Target currency code */
  toCurrency: string;
  /** Primary rate (1 fromCurrency = X toCurrency) */
  rate: number;
  /** Reverse rate (1 toCurrency = X fromCurrency) */
  reverseRate: number;
  /** Day-over-day change percentage */
  changePercent?: number;
  /** Rate type (spot or cash) */
  rateType: RateType;
  /** Callback when rate type changes */
  onRateTypeChange: (type: RateType) => void;
  /** Mini trend chart slot */
  trendChart?: ReactNode;
  /** Whether trend data is loading */
  isLoadingTrend?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function RateDisplayCard({
  fromCurrency,
  toCurrency,
  rate,
  reverseRate,
  changePercent,
  rateType,
  onRateTypeChange,
  trendChart,
  isLoadingTrend = false,
  className = '',
  style,
}: RateDisplayCardProps) {
  const isPositive = changePercent !== undefined && changePercent > 0;
  const isNegative = changePercent !== undefined && changePercent < 0;
  const isNeutral = changePercent === undefined || changePercent === 0;

  return (
    <div
      className={`rate-display-card ${className}`}
      style={{
        maxWidth: '480px',
        width: '100%',
        borderRadius: 'var(--radius-xl, 16px)',
        overflow: 'hidden',
        background: 'var(--glass-surface-elevated)',
        backdropFilter: 'blur(var(--glass-blur-lg, 24px))',
        WebkitBackdropFilter: 'blur(var(--glass-blur-lg, 24px))',
        border: '1px solid var(--glass-border-medium)',
        boxShadow: 'var(--shadow-lg), var(--glass-shadow-glow)',
        ...style,
      }}
    >
      {/* Rate information section */}
      <div
        style={{
          padding: 'var(--spacing-4, 16px)',
          background:
            'linear-gradient(135deg, var(--color-accent-primary-subtle) 0%, transparent 100%)',
        }}
      >
        {/* Rate type toggle */}
        <div className="flex justify-center mb-3">
          <div
            className="inline-flex p-0.5 rounded-full"
            style={{
              background: 'var(--glass-surface-base)',
              border: '1px solid var(--glass-border-light)',
            }}
          >
            <button
              onClick={() => onRateTypeChange('spot')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200"
              style={{
                fontSize: 'var(--font-size-xs, 14px)',
                fontWeight: rateType === 'spot' ? 600 : 500,
                color: rateType === 'spot' ? 'white' : 'var(--color-text-secondary)',
                background: rateType === 'spot' ? 'var(--color-accent-primary)' : 'transparent',
              }}
              aria-label="切換到即期匯率"
              aria-pressed={rateType === 'spot'}
            >
              <CreditCard size={14} />
              <span>即期</span>
            </button>
            <button
              onClick={() => onRateTypeChange('cash')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200"
              style={{
                fontSize: 'var(--font-size-xs, 14px)',
                fontWeight: rateType === 'cash' ? 600 : 500,
                color: rateType === 'cash' ? 'white' : 'var(--color-text-secondary)',
                background: rateType === 'cash' ? 'var(--color-accent-primary)' : 'transparent',
              }}
              aria-label="切換到現金匯率"
              aria-pressed={rateType === 'cash'}
            >
              <Banknote size={14} />
              <span>現金</span>
            </button>
          </div>
        </div>

        {/* Primary rate display */}
        <div className="text-center">
          <div
            className="flex items-baseline justify-center gap-2 mb-1"
            style={{
              fontSize: 'var(--font-size-3xl, 30px)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--line-height-tight)',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-lg, 18px)', fontWeight: 500 }}>
              1 {fromCurrency} =
            </span>
            <span>{formatExchangeRate(rate)}</span>
            <span style={{ fontSize: 'var(--font-size-lg, 18px)', fontWeight: 500 }}>
              {toCurrency}
            </span>
          </div>

          {/* Reverse rate + change indicator */}
          <div className="flex items-center justify-center gap-3">
            <span
              style={{
                fontSize: 'var(--font-size-sm, 14px)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              1 {toCurrency} = {formatExchangeRate(reverseRate)} {fromCurrency}
            </span>

            {/* Change indicator */}
            {changePercent !== undefined && (
              <span
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full"
                style={{
                  fontSize: 'var(--font-size-xs, 14px)',
                  fontWeight: 600,
                  color: isNeutral
                    ? 'var(--color-text-tertiary)'
                    : isPositive
                      ? 'var(--color-status-success)'
                      : 'var(--color-status-error)',
                  background: isNeutral
                    ? 'var(--glass-surface-base)'
                    : isPositive
                      ? 'var(--color-status-success-bg)'
                      : 'var(--color-status-error-bg)',
                }}
              >
                {isPositive && <TrendingUp size={12} />}
                {isNegative && <TrendingDown size={12} />}
                {isNeutral && <Minus size={12} />}
                {isPositive && '+'}
                {changePercent.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Trend chart section */}
      <div
        className="relative"
        style={{
          height: '80px',
          background: 'var(--glass-surface-subtle, rgba(255,255,255,0.02))',
          borderTop: '1px solid var(--glass-border-light)',
        }}
      >
        {isLoadingTrend ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="animate-pulse"
              style={{
                width: '60%',
                height: '40px',
                background: 'var(--glass-surface-base)',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>
        ) : trendChart ? (
          <div className="absolute inset-0">{trendChart}</div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              fontSize: 'var(--font-size-xs, 14px)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            No trend data
          </div>
        )}

        {/* Trend chart label */}
        <div
          className="absolute bottom-1 right-2 pointer-events-none"
          style={{
            fontSize: '10px',
            color: 'var(--color-text-tertiary)',
            opacity: 0.6,
          }}
        >
          30-day trend
        </div>
      </div>
    </div>
  );
}

/**
 * CompactRateCard - Compact rate card for list views
 *
 * Dimensions: height 64px, mini chart 60x32px
 */
interface CompactRateCardProps {
  currency: string;
  currencyName: string;
  flag: string;
  rate: number;
  changePercent?: number;
  miniChart?: ReactNode;
  onClick?: () => void;
}

export function CompactRateCard({
  currency,
  currencyName,
  flag,
  rate,
  changePercent,
  miniChart,
  onClick,
}: CompactRateCardProps) {
  const isPositive = changePercent !== undefined && changePercent > 0;
  const isNegative = changePercent !== undefined && changePercent < 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02]"
      style={{
        height: '64px',
        background: 'var(--glass-surface-base)',
        border: '1px solid var(--glass-border-light)',
      }}
    >
      {/* Currency info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span style={{ fontSize: '24px' }}>{flag}</span>
        <div className="text-left min-w-0">
          <div
            style={{
              fontSize: 'var(--font-size-base, 16px)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            {currency}
          </div>
          <div
            className="truncate"
            style={{
              fontSize: 'var(--font-size-xs, 14px)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {currencyName}
          </div>
        </div>
      </div>

      {/* Mini chart */}
      {miniChart && (
        <div
          style={{
            width: '60px',
            height: '32px',
            flexShrink: 0,
          }}
        >
          {miniChart}
        </div>
      )}

      {/* Rate + change */}
      <div className="text-right flex-shrink-0">
        <div
          style={{
            fontSize: 'var(--font-size-base, 16px)',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-primary)',
          }}
        >
          {formatExchangeRate(rate)}
        </div>
        {changePercent !== undefined && (
          <div
            className="inline-flex items-center gap-0.5"
            style={{
              fontSize: 'var(--font-size-xs, 14px)',
              fontWeight: 500,
              color: isPositive
                ? 'var(--color-status-success)'
                : isNegative
                  ? 'var(--color-status-error)'
                  : 'var(--color-text-tertiary)',
            }}
          >
            {isPositive && <TrendingUp size={10} />}
            {isNegative && <TrendingDown size={10} />}
            {isPositive && '+'}
            {changePercent.toFixed(2)}%
          </div>
        )}
      </div>
    </button>
  );
}
