/**
 * 頁面載入指示器
 * [2026-01-04] 從 routes.tsx 拆分以符合 react-refresh/only-export-components 規則
 */

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-sky-50">
      <div className="animate-pulse text-sky-500 font-bold">載入中...</div>
    </div>
  );
}
