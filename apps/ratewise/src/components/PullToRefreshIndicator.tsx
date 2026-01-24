import { RefreshCw } from 'lucide-react';

/**
 * PullToRefreshIndicator - Pull-to-Refresh Visual Feedback Component
 *
 * @description Brand-aligned indicator with cotton candy inspired glassmorphism design
 *
 * @features
 * - Soft blue-purple gradient (brand-aligned)
 * - Large border radius (32px) for soft aesthetic
 * - Premium glassmorphism effect with backdrop blur
 * - Smooth rotation animation based on pull distance
 * - Progressive text states
 * - Design token integration for consistent brand colors
 *
 * @states
 * - Pulling: "下拉重新整理" (primary color)
 * - Ready: "放開以重新整理" (primary dark)
 * - Refreshing: "重新整理中..." (primary default)
 *
 * @design-philosophy
 * - Cotton candy aesthetic inspired by UpdatePrompt
 * - Brand blue-purple color palette
 * - Clean, professional, no emojis
 *
 * @see UpdatePrompt - Shared cotton candy design language
 * @see docs/dev/005_design_token_refactoring.md - Design token migration
 *
 * @created 2025-10-22
 * @updated 2026-01-24
 * @version 2.0.0
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

  // Color scheme - Brand aligned design tokens
  const iconColor = isRefreshing
    ? 'text-primary'
    : canTrigger
      ? 'text-primary-dark'
      : 'text-primary-text-light';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        opacity,
        transform: `translateY(${Math.min(pullDistance / 2, 64)}px)`,
        transition: isRefreshing ? 'none' : 'opacity 0.2s ease-out, transform 0.2s ease-out',
      }}
    >
      {/* Glassmorphism Container - Cotton candy style with brand colors */}
      <div
        className="
          mt-4 px-6 py-3 rounded-[32px]
          backdrop-blur-xl backdrop-saturate-150
          bg-gradient-to-br from-brand-from via-brand-via to-brand-to
          dark:bg-neutral/80
          border-2 border-brand-border
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
            <div className="absolute inset-0 rounded-full bg-primary-light blur-md opacity-50" />
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

          {/* Status Text - Brand color */}
          <span
            className="
              text-sm font-medium
              text-primary-dark
              transition-colors duration-300
            "
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Decorative bubbles (cotton candy style) */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-decoration/50 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-brand-from/50 blur-3xl"
        aria-hidden="true"
      />
    </div>
  );
}
