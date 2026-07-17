/**
 * ListSkeleton — 停車紀錄列表載入骨架
 * 於 IndexedDB 初始讀取期間顯示，避免白畫面（issue #714 狀態缺口）。
 */
import type { ThemeConfig } from '@app/park-keeper/types';

const PLACEHOLDER_COUNT = 3;

export default function ListSkeleton({ theme }: { theme: ThemeConfig }) {
  return (
    <div className="max-w-md mx-auto space-y-5" aria-hidden="true">
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
        <div
          key={i}
          className="rounded-4xl p-5 shadow-elevation-2 border border-black/1 overflow-hidden animate-pulse motion-reduce:animate-none"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-2xl"
              style={{ backgroundColor: theme.colors.secondary }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-4 w-24 rounded-full"
                style={{ backgroundColor: theme.colors.secondary }}
              />
              <div
                className="h-3 w-16 rounded-full"
                style={{ backgroundColor: theme.colors.secondary }}
              />
            </div>
          </div>
          <div className="h-36 rounded-2xl" style={{ backgroundColor: theme.colors.secondary }} />
        </div>
      ))}
    </div>
  );
}
