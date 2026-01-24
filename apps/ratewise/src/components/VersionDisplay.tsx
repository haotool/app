import { useState, useEffect } from 'react';

/**
 * VersionDisplay - Version Information Display Component
 *
 * @description Displays application version with build time tooltip
 *
 * @features
 * - Minimal design without underlines
 * - Hover tooltip showing build timestamp
 * - Desktop hover and mobile tap support
 * - Real-time updates in development mode
 * - Static build time in production mode
 * - Design token integration for consistent styling
 *
 * @accessibility
 * - Tooltip for additional context
 * - Keyboard navigation support via title attribute
 *
 * @performance
 * - SSG-safe: Fixed initial value to prevent hydration mismatch
 * - Client-side updates only in development mode
 *
 * @see https://react.dev/errors/418 - Hydration mismatch prevention
 * @see docs/dev/005_design_token_refactoring.md - Design token migration
 *
 * @created 2025-01-01
 * @updated 2026-01-24
 * @version 2.0.0
 */

// [fix:2025-11-28] 使用固定的 build time 作為 SSG 初始值
// 避免 SSG 和 hydration 產生不同的 HTML 導致 React Error #418
const INITIAL_BUILD_TIME = import.meta.env.VITE_BUILD_TIME ?? '2025-01-01T00:00:00.000Z';

export function VersionDisplay() {
  // 使用 import.meta.env 讀取 Vite 注入的環境變數
  const version = import.meta.env.VITE_APP_VERSION ?? '1.0.0';
  const isDev = import.meta.env.DEV;

  // [fix:2025-11-28] 使用固定的初始值避免 hydration mismatch
  // 開發模式：hydration 後更新為實時時間
  // 生產模式：始終使用構建時間
  const [buildTimeString, setBuildTimeString] = useState(INITIAL_BUILD_TIME);

  useEffect(() => {
    // 開發模式下每秒更新一次時間，確保顯示最新狀態
    if (!isDev) {
      return; // 生產模式不需要更新
    }

    // hydration 完成後才開始更新時間
    const updateTime = () => setBuildTimeString(new Date().toISOString());
    updateTime();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isDev]);

  const buildTime = new Date(buildTimeString);

  const formattedDate = buildTime.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const formattedTime = buildTime.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <span
      className="relative inline-block cursor-help text-xs text-neutral-text-muted font-mono group"
      title={`Built on ${formattedDate} ${formattedTime}`}
    >
      v{version}
      {isDev && <span className="ml-1 text-[10px] text-warning">dev</span>}
      {/* Tooltip - Desktop hover display */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-neutral-darker rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
        Built on {formattedDate} {formattedTime}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-darker" />
      </span>
    </span>
  );
}
