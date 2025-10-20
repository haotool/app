/**
 * VersionDisplay - 版本資訊顯示組件
 *
 * 根據 UX 最佳實踐研究 (UX Stack Exchange)：
 * - 位置：Footer 右下角
 * - 樣式：小字體、低對比度（不干擾主要內容）
 * - 格式：v1.0.0 • Built on YYYY-MM-DD HH:MM
 */

export function VersionDisplay() {
  const version: string = __APP_VERSION__;
  const buildTime = new Date(__BUILD_TIME__);

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
    <div className="text-xs text-gray-400 text-right select-none">
      <span className="font-mono">v{version}</span>
      <span className="mx-1">•</span>
      <span className="opacity-75">
        Built on {formattedDate} {formattedTime}
      </span>
    </div>
  );
}
