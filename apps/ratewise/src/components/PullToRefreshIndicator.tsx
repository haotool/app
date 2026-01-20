import { RefreshCw } from 'lucide-react';

/**
 * PullToRefreshIndicator - Visual feedback component for pull-to-refresh
 *
 * 品牌對齊風格 (Brand Aligned - Cotton Candy inspired):
 * - 柔和藍紫漸變 (soft blue-indigo-purple gradient)
 * - 參考 UpdatePrompt 的棉花糖風格但無 emoji
 * - 超大圓角 (32px) 打造柔和感
 * - 精緻玻璃擬態效果
 * - 品牌藍紫基調 (與主應用一致)
 * - Smooth rotation animation based on pull distance
 * - Progressive text states (clean, professional)
 *
 * States:
 * - Pulling: "下拉重新整理" (indigo-400)
 * - Ready: "放開以重新整理" (indigo-600)
 * - Refreshing: "重新整理中..." (indigo-500)
 *
 * Design: UpdatePrompt 棉花糖風格 + 品牌藍紫配色
 * Updated: 2025-10-22 - 棉花糖風格統一，無 emoji
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

  // Determine status text (clean, professional)
  const statusText = isRefreshing
    ? '重新整理中...'
    : canTrigger
      ? '放開以重新整理'
      : '下拉重新整理';

  // [fix:2026-01-20] Color scheme - 使用 SSOT token
  const iconColor = isRefreshing ? 'text-primary' : canTrigger ? 'text-primary' : 'text-primary/70';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        opacity,
        transform: `translateY(${Math.min(pullDistance / 2, 64)}px)`,
        transition: isRefreshing ? 'none' : 'opacity 0.2s ease-out, transform 0.2s ease-out',
      }}
    >
      {/* Glassmorphism Container - 使用 SSOT token */}
      <div
        className="
          mt-4 px-6 py-3 rounded-[32px]
          backdrop-blur-xl backdrop-saturate-150
          bg-surface/90
          border-2 border-primary/20
          shadow-xl
        "
        style={{
          boxShadow: `
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 8px 10px -6px rgba(0, 0, 0, 0.1)
          `,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Animated Icon with subtle glow */}
          <div className="relative">
            {/* Icon glow effect - 使用 SSOT token */}
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-md opacity-50" />
            {/* Main icon */}
            <RefreshCw
              className={`
                relative
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
          </div>

          {/* Status Text - 使用 SSOT token */}
          <span
            className="
              text-sm font-medium
              text-text
              transition-colors duration-300
            "
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* 裝飾性泡泡 (棉花糖風格) - 使用 SSOT Design Token */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[rgb(var(--color-accent))]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[rgb(var(--color-primary))]/10 blur-3xl"
        aria-hidden="true"
      />
    </div>
  );
}
