/**
 * Skeleton Loader Components - SSOT Design System
 *
 * @description 骨架屏組件系統，提升 perceived performance
 *              使用 SSOT design tokens，自動適應所有主題
 *
 * 設計原則 (來源: web.dev, smashingmagazine):
 * - 布局與最終 UI 結構高度一致，減少 CLS
 * - 使用 shimmer 動畫提升感知速度
 * - CSS-only 動畫，避免 JavaScript 阻塞
 * - 主題感知顏色，適應所有 6 種風格
 *
 * 重要：SkeletonLoader 僅渲染內容骨架，不包含 AppLayout 結構
 *       因為它作為 ClientOnly fallback 已在 AppLayout 內部渲染
 *
 * Watchdog（2026-03-07）：
 * - 客戶端顯示超過 SKELETON_TIMEOUT_MS 後自動轉為錯誤復原 UI
 * - 避免 SW 快取過期、chunk 載入失敗導致永遠卡在骨架屏
 * - 提供「強制重新載入」按鈕 + 聯絡資訊，確保使用者永遠有操作出口
 *
 * @see https://web.dev/articles/cls
 * @see https://www.smashingmagazine.com/2020/04/skeleton-screens-react/
 */

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { performFullRefresh } from '../utils/swUtils';
import { APP_INFO } from '../config/app-info';
import {
  feedbackSurfaceTokens,
  multiConverterLayoutTokens,
  pageLayoutTokens,
  rateWiseLayoutTokens,
} from '../config/design-tokens';
import { MailtoLink } from './MailtoLink';
import { SupportContactLinks } from './SupportContactLinks';

/** 骨架屏超時閾值（毫秒）。超過此時間仍在顯示表示 app 初始化失敗。 */
const SKELETON_TIMEOUT_MS = 10_000;

/**
 * 骨架屏卡住時的復原 UI
 * 提供強制重新載入按鈕與聯絡資訊，確保使用者永遠有出口。
 */
function SkeletonTimeoutFallback() {
  const { t } = useTranslation();
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = () => {
    setIsReloading(true);
    void performFullRefresh();
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5 rounded-card border border-border/70 bg-surface p-8 text-center shadow-floating">
        <AlertCircle className="mx-auto text-warning" size={40} />
        <div>
          <h2 className="text-lg font-bold text-text mb-2">{t('errors.appLoadTimeout')}</h2>
          <p className="text-sm text-text-muted">{t('errors.appLoadTimeoutDesc')}</p>
        </div>
        <button
          type="button"
          onClick={handleReload}
          disabled={isReloading}
          className={`${feedbackSurfaceTokens.actionButton} disabled:opacity-60`}
        >
          <RefreshCw size={18} className={isReloading ? 'animate-spin' : ''} />
          {isReloading ? t('errors.reloading') : t('errors.forceReload')}
        </button>
        <SupportContactLinks title={t('support.contactTitle')} description="" />
        <p className="text-xs text-text-muted">
          {t('errors.cacheHint')} <MailtoLink email={APP_INFO.email} className="underline" />
        </p>
      </div>
    </div>
  );
}

/**
 * 主頁面骨架屏
 * 對應 SingleConverter 頁面內容布局
 *
 * @description 僅渲染內容骨架，不包含 Header/BottomNav（由 AppLayout 提供）
 *              作為 ClientOnly fallback，必須與最終渲染結構匹配
 *              內建 watchdog：客戶端顯示超過 10 秒自動轉為錯誤復原 UI
 */
export const SkeletonLoader = () => {
  const { t } = useTranslation();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const isBrowser = typeof window !== 'undefined';

  useEffect(() => {
    // SSR 環境不執行（useEffect 僅在 client 執行）
    const timer = setTimeout(() => {
      setIsTimedOut(true);
    }, SKELETON_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (isTimedOut) {
    return <SkeletonTimeoutFallback />;
  }

  return (
    <div className={rateWiseLayoutTokens.content.className} role="status" aria-live="polite">
      {/* 僅在 client 顯示輔助文案；SSG HTML 不注入通用 SEO 文字，避免壓過 route 主內容。 */}
      {isBrowser && (
        <div
          className="sr-only"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
          }}
        >
          <p>{t('skeleton.appLoading')}</p>
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-4">
        {/* 來源貨幣輸入骨架 - 對應 SingleConverter 上半部 */}
        <div className="space-y-3">
          <div className="skeleton-shimmer h-4 w-20 rounded-compact" />
          <div className="relative">
            {/* 貨幣選擇器 + 金額輸入 */}
            <div className="skeleton-shimmer h-14 w-full rounded-control" />
          </div>
          {/* 快速金額按鈕 - 水平排列 */}
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-shimmer h-8 w-14 flex-shrink-0 rounded-control" />
            ))}
          </div>
        </div>

        {/* 匯率卡片骨架 - 對應匯率顯示區塊 */}
        <div className="skeleton-card space-y-3 rounded-control p-4">
          {/* 匯率類型切換器 */}
          <div className="flex justify-center">
            <div className="skeleton-shimmer h-7 w-28 rounded-full" />
          </div>
          {/* 主匯率顯示 */}
          <div className="text-center space-y-2 py-3">
            <div className="skeleton-shimmer h-7 w-52 mx-auto rounded-control" />
            <div className="skeleton-shimmer h-4 w-40 mx-auto rounded-compact" />
          </div>
          {/* 迷你趨勢圖區域 */}
          <div className="skeleton-bg h-20 rounded-control" />
        </div>

        {/* 交換按鈕骨架 */}
        <div className="flex justify-center">
          <div className="skeleton-shimmer-accent w-11 h-11 rounded-full" />
        </div>

        {/* 目標貨幣輸入骨架 - 對應 SingleConverter 下半部 */}
        <div className="space-y-3">
          <div className="skeleton-shimmer h-4 w-20 rounded-compact" />
          <div className="relative">
            {/* 貨幣選擇器 + 金額輸出 */}
            <div className="skeleton-shimmer-accent h-14 w-full rounded-control" />
          </div>
          {/* 快速金額按鈕 - 水平排列 */}
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-shimmer h-8 w-14 flex-shrink-0 rounded-control" />
            ))}
          </div>
        </div>

        {/* 加入歷史記錄按鈕骨架 */}
        <div className="skeleton-shimmer-accent h-12 w-full rounded-control" />

        {/* 資料來源骨架 - 對應底部小字 */}
        <div className="flex justify-center">
          <div className="skeleton-shimmer h-3 w-40 rounded-compact" />
        </div>
      </div>

      {isBrowser ? <span className="sr-only">{t('skeleton.ratesLoading')}</span> : null}
    </div>
  );
};

/**
 * 貨幣卡片骨架屏
 * 對應 CurrencyCard 組件
 */
export const CurrencyCardSkeleton = () => {
  return (
    <div className="skeleton-card p-3" role="status">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer w-8 h-8 rounded-full" />
          <div className="space-y-1">
            <div className="skeleton-shimmer h-4 w-12 rounded-compact" />
            <div className="skeleton-shimmer h-3 w-20 rounded-compact" />
          </div>
        </div>
        <div className="skeleton-shimmer h-4 w-16 rounded-compact" />
      </div>
    </div>
  );
};

/**
 * 轉換器模式骨架屏
 * 支援 single/multi 兩種模式
 */
export const ConverterSkeleton = ({ mode }: { mode: 'single' | 'multi' }) => {
  if (mode === 'multi') {
    return (
      <div className="space-y-4" role="status">
        {/* 基準貨幣輸入 */}
        <div className="skeleton-shimmer h-12 rounded-control" />

        {/* 貨幣卡片列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CurrencyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="status">
      {/* 貨幣選擇器 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="skeleton-shimmer h-14 rounded-control" />
        <div className="skeleton-shimmer h-14 rounded-control" />
      </div>

      {/* 結果顯示 */}
      <div className="skeleton-shimmer-accent h-16 rounded-control" />
    </div>
  );
};

/**
 * 設定頁面骨架屏
 * 對應 Settings 頁面布局
 */
export const SettingsSkeleton = () => {
  const { t } = useTranslation();

  return (
    <div className={pageLayoutTokens.content.className} role="status" aria-live="polite">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] xl:items-start">
        <div className="space-y-6">
          {/* 介面風格區塊 */}
          <section className="space-y-3">
            <div className="skeleton-shimmer h-4 w-20 rounded-compact" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-shimmer h-20 rounded-control" />
              ))}
            </div>
          </section>

          {/* 語言區塊 */}
          <section className="space-y-3">
            <div className="skeleton-shimmer h-4 w-12 rounded-compact" />
            <div className="skeleton-card p-1.5">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-shimmer h-16 flex-1 rounded-control" />
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="skeleton-shimmer h-4 w-16 rounded-compact" />
            <div className="skeleton-card p-1.5">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-shimmer h-16 flex-1 rounded-control" />
                ))}
              </div>
            </div>
            <div className="skeleton-shimmer h-3 w-56 rounded-compact" />
          </section>
        </div>

        <div className="space-y-6">
          {/* 儲存與快取區塊 */}
          <section className="space-y-3">
            <div className="skeleton-shimmer h-4 w-24 rounded-compact" />
            <div className="skeleton-card p-5 space-y-4">
              <div className="flex justify-between">
                <div className="skeleton-shimmer h-4 w-24 rounded-compact" />
                <div className="skeleton-shimmer h-5 w-16 rounded-compact" />
              </div>
              <div className="flex justify-between">
                <div className="skeleton-shimmer h-4 w-20 rounded-compact" />
                <div className="skeleton-shimmer h-5 w-12 rounded-compact" />
              </div>
              <div className="mx-auto h-3 w-40 rounded-compact skeleton-shimmer" />
            </div>
          </section>

          {/* 資料管理區塊（危險操作）— 對應 Settings.tsx ShieldAlert section */}
          <section className="space-y-3">
            <div className="skeleton-shimmer h-4 w-20 rounded-compact" />
            <div className="skeleton-card overflow-hidden">
              <div
                data-testid="skeleton-settings-danger-btn"
                className="skeleton-shimmer h-12 w-full rounded-none"
              />
            </div>
          </section>

          {/* 支援與資訊區塊 — 對應 Settings.tsx HelpCircle section（7 個連結列）*/}
          <section className="space-y-3">
            <div className="skeleton-shimmer h-4 w-28 rounded-compact" />
            <div className="skeleton-card overflow-hidden divide-y divide-border">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  data-testid="skeleton-settings-link"
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="skeleton-shimmer h-4 w-24 rounded-compact" />
                  <div className="skeleton-shimmer h-4 w-4 rounded-compact" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <span className="sr-only">{t('skeleton.settingsLoading')}</span>
    </div>
  );
};

/**
 * Favorites Page Skeleton
 * 收藏頁面骨架屏
 *
 * 結構設計原則（CLS 防止）：
 * - 完全鏡像實際 Favorites UI 的佈局層級
 * - 頁籤：skeleton-card p-1.5，2 個 flex-1 h-14 tab（icon + label）
 * - 貨幣列表：card p-4 flex items-center gap-3
 *   - 星號欄（w-7，左側）→ 對應 Favorites.tsx 的 star/fixed-star column
 *   - 國旗（text-2xl w-8 rounded-full）→ 對應 emoji flag placeholder
 *   - 幣別名稱（flex-1）→ 對應 code + name
 *   - 換算按鈕（flex-shrink-0）→ 對應「換算 →」按鈕區
 *
 * 先前骨架曾誤設為獨立拖曳手柄；實際 UI 左側為 star(w-7) 欄位。
 *
 * @see Favorites.tsx — 實際 UI 結構（star → flag+name → convert btn）
 * @see segmentedSwitch tokens — Tab 高度 py-3.5 + icon(18) + label(10) ≈ h-14
 */
export const FavoritesSkeleton = () => {
  const { t } = useTranslation();

  return (
    <div
      className={`${pageLayoutTokens.content.className} flex-1`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] lg:items-start">
        <div className="min-w-0">
          {/* 頁籤切換器 — 對應 'card p-1.5' segmented switch，2 個 flex-1 tab */}
          <div className="mb-6 skeleton-card p-1.5">
            <div className="flex gap-1">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton-shimmer h-14 flex-1 rounded-control" />
              ))}
            </div>
          </div>

          {/* 貨幣清單 — 對應 'space-y-2'，每行 'card p-4 flex items-center gap-3' */}
          <section className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-card flex items-center gap-3 p-4">
                <div
                  data-testid="skeleton-star"
                  className="flex w-7 flex-shrink-0 items-center justify-center"
                >
                  <div className="skeleton-shimmer h-5 w-5 rounded-compact" />
                </div>
                <div className="skeleton-shimmer h-8 w-8 rounded-full flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="skeleton-shimmer h-4 w-16 rounded-compact" />
                  <div className="skeleton-shimmer h-3 w-24 rounded-compact" />
                </div>
                <div className="skeleton-shimmer h-4 w-14 rounded-compact flex-shrink-0" />
              </div>
            ))}
          </section>
        </div>

        <aside className="hidden lg:flex lg:flex-col lg:gap-4">
          <section className="skeleton-card p-5">
            <div className="skeleton-shimmer h-4 w-24 rounded-compact" />
            <div className="mt-4 space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-control border border-border/70 bg-surface px-4 py-3"
                >
                  <div className="skeleton-shimmer h-3 w-20 rounded-compact" />
                  <div className="skeleton-shimmer h-5 w-10 rounded-compact" />
                </div>
              ))}
            </div>
          </section>

          <section className="skeleton-card p-5">
            <div className="space-y-2">
              <div className="skeleton-shimmer h-3 w-full rounded-compact" />
              <div className="skeleton-shimmer h-3 w-4/5 rounded-compact" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="skeleton-shimmer h-11 w-full rounded-control" />
              <div className="skeleton-shimmer h-11 w-full rounded-control" />
            </div>
          </section>
        </aside>
      </div>

      <span className="sr-only">{t('skeleton.favoritesLoading')}</span>
    </div>
  );
};

/**
 * 多幣別頁面骨架屏
 * 對應 MultiConverter 頁面布局
 *
 * 結構設計原則（CLS 防止）：
 * - 完全鏡像實際 MultiConverter UI 的佈局層級
 * - 外層：使用 multiConverterLayoutTokens.content.className
 * - 卡片：skeleton-card p-4 flex-1 flex flex-col（對應 'card p-4 flex-1 flex flex-col'）
 * - 快速金額列：5 個 pill，對應 flex gap-2 mb-4 overflow-x-auto
 * - 貨幣清單：8 行，每行結構 star(w-6) | flag(w-7) | code+name | [right] amount+rate
 *
 * @see MultiConverter.tsx（component）— 實際 UI 結構
 * @see multiConverterLayoutTokens — SSOT 頁面佈局 token
 */
export const MultiConverterSkeleton = () => {
  const { t } = useTranslation();

  return (
    <div className={multiConverterLayoutTokens.content.className} role="status" aria-live="polite">
      {/* 主卡片 — 對應 'card p-4 flex-1 flex flex-col' */}
      <div className="skeleton-card p-4 flex-1 flex flex-col">
        {/* 快速金額 pill 列 — 對應 'flex gap-2 mb-4 overflow-x-auto scrollbar-hide' */}
        <div className="flex gap-2 mb-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              data-testid="skeleton-quick-pill"
              className="skeleton-shimmer h-8 w-14 flex-shrink-0 rounded-control"
            />
          ))}
        </div>

        {/* 貨幣清單 — 對應 'flex-1 space-y-2 -m-0.5 p-0.5' */}
        <div className="flex-1 space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              data-testid="skeleton-currency-row"
              className="flex items-center rounded-control px-3 py-2.5"
            >
              {/* 星號欄 — 對應 'w-6 flex-shrink-0 flex items-center justify-center' */}
              <div className="w-6 flex-shrink-0 flex items-center justify-center">
                <div className="skeleton-shimmer w-4 h-4 rounded-compact" />
              </div>
              {/* 國旗欄 — 對應 'text-xl flex-shrink-0 w-7 text-center' */}
              <div className="skeleton-shimmer w-6 h-5 rounded-compact flex-shrink-0 mx-1" />
              {/* 幣別代碼 + 名稱 — 對應 code text-sm + name text-[11px] */}
              <div className="space-y-1 ml-1 flex-shrink-0">
                <div className="skeleton-shimmer h-3.5 w-10 rounded-compact" />
                <div className="skeleton-shimmer h-2.5 w-16 rounded-compact" />
              </div>
              {/* 金額 + 匯率資訊（右側）— 對應 'flex-1 ml-2' text-right */}
              <div className="flex-1 ml-2 space-y-1">
                <div className="skeleton-shimmer h-4 w-20 ml-auto rounded-compact" />
                <div className="skeleton-shimmer h-2.5 w-28 ml-auto rounded-compact" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">{t('skeleton.multiConverterLoading')}</span>
    </div>
  );
};
