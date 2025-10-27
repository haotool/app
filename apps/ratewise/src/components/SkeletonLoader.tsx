/**
 * Skeleton Loader Component
 * [Lighthouse-optimization:2025-10-28] 取代 loading spinner，提升 perceived performance
 *
 * 參考:
 * - https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/
 * - https://react.dev/reference/react/Suspense
 *
 * 優勢:
 * - 即時顯示內容結構，減少 perceived loading time
 * - 用戶可預期內容佈局，降低 cognitive load
 * - 避免 spinner 的「等待感」，提升 UX
 */

export const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" role="status" aria-live="polite">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>

        {/* Mode Switcher Skeleton */}
        <div className="flex gap-2 mb-4 animate-pulse">
          <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
        </div>

        {/* Main Converter Card Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 animate-pulse">
          {/* Currency Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-slate-200 rounded"></div>
              <div className="h-12 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-slate-200 rounded"></div>
              <div className="h-12 bg-slate-200 rounded-lg"></div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-200 rounded"></div>
            <div className="h-14 bg-slate-200 rounded-lg"></div>
          </div>

          {/* Result Display */}
          <div className="bg-purple-50 rounded-xl p-4 space-y-2">
            <div className="h-6 w-full bg-purple-200 rounded"></div>
            <div className="h-4 w-3/4 bg-purple-200 rounded"></div>
          </div>

          {/* Quick Amounts */}
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-20 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>

        {/* Trend Chart Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
          <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="h-64 bg-slate-200 rounded-lg"></div>
        </div>

        {/* Favorites Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
          <div className="h-4 w-24 bg-slate-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">載入匯率資料中...</span>
    </div>
  );
};

/**
 * Lightweight Currency Card Skeleton
 * 用於貨幣列表的輕量化骨架屏
 */
export const CurrencyCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm animate-pulse" role="status">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          <div className="space-y-1">
            <div className="h-4 w-12 bg-slate-200 rounded"></div>
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="h-4 w-16 bg-slate-200 rounded"></div>
      </div>
    </div>
  );
};

/**
 * Converter Mode Skeleton
 * 針對特定轉換模式的骨架屏
 */
export const ConverterSkeleton = ({ mode }: { mode: 'single' | 'multi' }) => {
  if (mode === 'multi') {
    return (
      <div className="space-y-4 animate-pulse" role="status">
        <div className="h-12 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CurrencyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pulse" role="status">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-14 bg-slate-200 rounded-lg"></div>
        <div className="h-14 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-16 bg-purple-200 rounded-xl"></div>
    </div>
  );
};
