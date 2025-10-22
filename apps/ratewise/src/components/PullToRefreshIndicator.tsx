import { RefreshCw } from 'lucide-react';

/**
 * PullToRefreshIndicator - Visual feedback component for pull-to-refresh
 *
 * 品牌對齊風格 (Brand Aligned):
 * - Glassmorphism effect (backdrop blur + translucent background)
 * - Indigo 色系 (與主應用一致)
 * - Smooth rotation animation based on pull distance
 * - Progressive text states (pull → release → refreshing)
 * - Micro-animations with spring physics
 *
 * States:
 * - Pulling: "下拉重新整理" (indigo-400)
 * - Ready: "放開以重新整理" (indigo-600)
 * - Refreshing: "重新整理中..." (indigo-500)
 *
 * Updated: 2025-10-22 - 修正配色為品牌對齊風格
 */

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  canTrigger: boolean;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  canTrigger,
}: PullToRefreshIndicatorProps) {
  // Calculate opacity based on pull distance (0-50px: 0-1)
  const opacity = Math.min(pullDistance / 50, 1);

  // Rotation angle (0-360 degrees based on pull distance)
  const rotation = (pullDistance / 128) * 360;

  // Determine status text
  const statusText = isRefreshing
    ? '重新整理中...'
    : canTrigger
      ? '放開以重新整理'
      : '下拉重新整理';

  // Color scheme based on state - Brand aligned (indigo系)
  const iconColor = isRefreshing
    ? 'text-indigo-500'
    : canTrigger
      ? 'text-indigo-600'
      : 'text-indigo-400';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        opacity,
        transform: `translateY(${Math.min(pullDistance / 2, 64)}px)`,
        transition: isRefreshing ? 'none' : 'opacity 0.2s ease-out, transform 0.2s ease-out',
      }}
    >
      {/* Glassmorphism Container - Brand aligned colors */}
      <div
        className="
          mt-4 px-6 py-3 rounded-2xl
          backdrop-blur-xl backdrop-saturate-150
          bg-white/80 dark:bg-slate-900/80
          border border-indigo-100/50 dark:border-indigo-700/30
          shadow-xl shadow-indigo-500/10
        "
        style={{
          boxShadow: `
            0 10px 30px -10px rgba(99, 102, 241, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset,
            0 1px 0 0 rgba(255, 255, 255, 0.3) inset
          `,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Animated Icon */}
          <RefreshCw
            className={`
              ${iconColor}
              transition-colors duration-300
              ${isRefreshing ? 'animate-spin' : ''}
            `}
            size={20}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              transition: isRefreshing ? undefined : 'transform 0.1s ease-out',
            }}
          />

          {/* Status Text */}
          <span
            className="
              text-sm font-medium
              text-slate-700 dark:text-slate-200
              transition-colors duration-300
            "
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Background Shimmer Effect (subtle) - Brand aligned */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
