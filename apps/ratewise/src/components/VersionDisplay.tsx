import { useState, useEffect } from 'react';

/**
 * VersionDisplay - 版本資訊顯示組件
 *
 * 2025 UX 最佳實踐:
 * - 簡約設計，不使用下底線
 * - Hover 顯示建置時間 tooltip
 * - 支援桌面 hover 和行動裝置 tap
 * - 開發模式下顯示實時時間，生產模式顯示構建時間
 */

export function VersionDisplay() {
  // 使用 import.meta.env 讀取 Vite 注入的環境變數
  const version = import.meta.env.VITE_APP_VERSION ?? '1.0.0';
  const isDev = import.meta.env.DEV;

  // 開發模式：使用實時時間；生產模式：使用構建時間
  const [buildTimeString, setBuildTimeString] = useState(
    import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString(),
  );

  useEffect(() => {
    // 開發模式下每秒更新一次時間，確保顯示最新狀態
    if (!isDev) {
      return; // 生產模式不需要清理
    }

    setBuildTimeString(new Date().toISOString());

    const interval = setInterval(() => {
      setBuildTimeString(new Date().toISOString());
    }, 1000);

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
      className="relative inline-block cursor-help text-xs text-gray-400 font-mono group"
      title={`Built on ${formattedDate} ${formattedTime}`}
    >
      v{version}
      {isDev && <span className="ml-1 text-[10px] text-orange-500">dev</span>}
      {/* Tooltip - 桌面版 hover 顯示 */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
        Built on {formattedDate} {formattedTime}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  );
}
