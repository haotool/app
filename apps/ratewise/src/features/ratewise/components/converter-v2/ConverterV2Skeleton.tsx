/**
 * v2「等值雙列」佔位骨架：與 SingleConverterV2 佈局輪廓一致
 * （雙列卡、divider swap 鈕、rate chip、sparkline 卡、4×4 鍵盤），
 * 供 lazy chunk 載入期間的 Suspense fallback，取代空白避免兩段跳動。
 * 必須維持被 SingleConverter 靜態 import（不得併入 v2 lazy chunk）。
 */

import { useTranslation } from 'react-i18next';

export function ConverterV2Skeleton() {
  const { t } = useTranslation();
  return (
    <div
      data-testid="converter-v2-skeleton"
      role="status"
      aria-live="polite"
      className="flex flex-col gap-3 short:gap-2"
    >
      {/* 等值雙列卡：兩列（h-11 幣別鈕＋右對齊金額）＋ divider 內嵌 32px swap 圓 */}
      <div className="rounded-2xl border border-border/60 bg-surface overflow-hidden">
        {[1, 2].map((row) => (
          <div key={row}>
            {row === 2 && (
              <div className="relative flex items-center px-4">
                <div className="h-px flex-1 bg-border/60" />
                <div className="mx-2 -my-1 flex h-11 w-11 shrink-0 items-center justify-center">
                  <div className="skeleton-shimmer h-8 w-8 rounded-full" />
                </div>
                <div className="h-px flex-1 bg-border/60" />
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-3 short:py-1.5">
              <div className="skeleton-shimmer h-11 w-24 shrink-0 rounded-xl" />
              <div className="flex-1 min-w-0 min-h-[44px] flex items-center justify-end px-2">
                <div className="skeleton-shimmer h-8 short:h-6 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* rate chip：置中 44px 膠囊 */}
      <div className="flex justify-center">
        <div className="skeleton-shimmer h-11 w-56 rounded-full" />
      </div>

      {/* sparkline 卡：24px 標頭列＋72px 圖表區 */}
      <div className="rounded-2xl border border-border/60 bg-surface px-3 pt-2 pb-1">
        <div className="flex min-h-[24px] items-center justify-between">
          <div className="skeleton-shimmer h-3.5 w-28 rounded" />
          <div className="skeleton-shimmer h-5 w-16 rounded-full" />
        </div>
        <div className="h-[72px] short:h-[48px] flex items-end pb-1">
          <div className="skeleton-bg h-full w-full rounded-lg" />
        </div>
      </div>

      {/* 常駐計算機：4×4 鍵位（h-[54px]），對齊 ConverterKeypad 尺寸 */}
      <div className="rounded-2xl bg-surface px-1 pt-3 pb-2 short:pt-1.5 short:pb-1">
        <div className="grid grid-cols-4 gap-2 short:gap-1.5">
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className="skeleton-shimmer h-[54px] short:h-[44px] rounded-2xl" />
          ))}
        </div>
      </div>

      <span className="sr-only">{t('converterV2.skeletonLoading')}</span>
    </div>
  );
}
