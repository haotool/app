/**
 * VersionDisplay - 版本資訊顯示組件
 *
 * 2025 UX 最佳實踐:
 * - 簡約設計，不使用下底線
 * - Hover 顯示建置時間 tooltip
 * - 支援桌面 hover 和行動裝置 tap
 *
 * [fix:2025-11-05] 使用 Vite define 全域變數讀取版本號
 * 參考: [context7:vitejs/vite:2025-11-05] - Environment Variables and Modes
 */

export function VersionDisplay() {
  // [fix:2025-11-05] 使用 Vite 環境變數讀取版本號
  // 參考: https://vitejs.dev/guide/env-and-mode.html
  // VITE_ 前綴的環境變數會自動暴露到 import.meta.env
  // 由 scripts/generate-version.js 在啟動時自動生成到 .env.local
  const version = import.meta.env.VITE_APP_VERSION ?? '1.0.0';
  const buildTimeString = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString();

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
      {/* Tooltip - 桌面版 hover 顯示 */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        Built on {formattedDate} {formattedTime}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  );
}
