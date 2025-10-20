/**
 * VersionDisplay - 版本資訊顯示組件
 *
 * 根據 UX 最佳實踐研究 (UX Stack Exchange)：
 * - 位置：Footer 右下角
 * - 樣式：小字體、低對比度（不干擾主要內容）
 * - 格式：v1.0.0 • Built on YYYY-MM-DD HH:MM
 */

export function VersionDisplay() {
  // 使用雙重後備機制：優先使用全域常量，fallback 到 import.meta.env
  const version: string =
    typeof __APP_VERSION__ !== 'undefined'
      ? __APP_VERSION__
      : ((import.meta.env['VITE_APP_VERSION'] as string | undefined) ?? '0.0.0');

  const buildTimeString =
    typeof __BUILD_TIME__ !== 'undefined'
      ? __BUILD_TIME__
      : ((import.meta.env['VITE_BUILD_TIME'] as string | undefined) ?? new Date().toISOString());

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
    <div className="text-xs text-gray-400 text-right select-none">
      <span className="font-mono">v{version}</span>
      <span className="mx-1">•</span>
      <span className="opacity-75">
        Built on {formattedDate} {formattedTime}
      </span>
    </div>
  );
}
