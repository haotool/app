import type { FC } from 'react';

/**
 * TrendChartSkeleton
 * React Suspense fallback 專用骨架，提供視覺節奏以降低等待感。
 * 參考 React 官方 Suspense 指南（context7:reactjs/react.dev:2025-11-08）。
 */
export const TrendChartSkeleton: FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full h-full flex flex-col justify-end rounded-b-xl overflow-hidden"
      data-testid="trend-chart-skeleton"
    >
      <div className="flex-1 bg-gradient-to-br from-slate-50 via-slate-100 to-white animate-pulse" />
      <div className="relative h-20 bg-white/70 backdrop-blur border-t border-white/40">
        <div className="absolute inset-0 flex items-end gap-1 px-3 pb-2">
          {[40, 55, 30, 65, 45, 70, 50, 60].map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-full bg-gradient-to-t from-purple-400 to-blue-400 animate-pulse"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <span className="sr-only">趨勢圖載入中</span>
      </div>
    </div>
  );
};
