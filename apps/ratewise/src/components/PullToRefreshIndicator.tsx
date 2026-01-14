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

  // Color scheme - Brand aligned (blue-indigo-purple gradient, no emoji)
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
      {/* Glassmorphism Container - 棉花糖風格 + 品牌配色 */}
      <div
        className="
          mt-4 px-6 py-3 rounded-[32px]
          backdrop-blur-xl backdrop-saturate-150
          bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
          dark:bg-neutral/80
          border-2 border-indigo-100
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
            {/* Icon glow effect */}
            <div className="absolute inset-0 rounded-full bg-indigo-200 blur-md opacity-50" />
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

          {/* Status Text - 品牌藍紫色調 */}
          <span
            className="
              text-sm font-medium
              text-indigo-700
              transition-colors duration-300
            "
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* 裝飾性泡泡 (棉花糖風格) */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-100/50 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-blue-100/50 blur-3xl"
        aria-hidden="true"
      />
    </div>
  );
}
