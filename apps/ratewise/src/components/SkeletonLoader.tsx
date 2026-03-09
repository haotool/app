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
import { performFullRefresh } from '../utils/swUtils';
import { APP_INFO } from '../config/app-info';
import { MailtoLink } from './MailtoLink';
import { SupportContactLinks } from './SupportContactLinks';

/** 骨架屏超時閾值（毫秒）。超過此時間仍在顯示表示 app 初始化失敗。 */
const SKELETON_TIMEOUT_MS = 10_000;

/**
 * 骨架屏卡住時的復原 UI
 * 提供強制重新載入按鈕與聯絡資訊，確保使用者永遠有出口。
 */
function SkeletonTimeoutFallback() {
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = () => {
    setIsReloading(true);
    void performFullRefresh();
  };

  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-sm w-full space-y-5 text-center">
        <AlertCircle className="mx-auto text-warning" size={40} />
        <div>
          <h2 className="text-lg font-bold text-text mb-2">應用程式載入逾時</h2>
          <p className="text-sm text-text-muted">
            載入時間超過預期，可能是快取過期或網路問題。請強制重新載入以取得最新版本。
          </p>
        </div>
        <button
          onClick={handleReload}
          disabled={isReloading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg transition"
        >
          <RefreshCw size={18} className={isReloading ? 'animate-spin' : ''} />
          {isReloading ? '重新載入中...' : '強制重新載入（清除快取）'}
        </button>
        <SupportContactLinks title="若問題持續發生，請聯絡作者：" description="" />
        <p className="text-xs text-text-muted">
          也可嘗試：設定 → 清除瀏覽器快取，或聯絡{' '}
          <MailtoLink email={APP_INFO.email} className="underline" />
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
  const [isTimedOut, setIsTimedOut] = useState(false);

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
    <div className="p-4 md:p-6" role="status" aria-live="polite">
      {/* SEO 靜態內容 - 對爬蟲可見，inline style 確保 CSS 載入前即隱藏，避免 CLS */}
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
        <p className="font-bold text-lg">RateWise 匯率好工具 - 即時匯率換算</p>
        <p>
          RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 18
          種貨幣。我們的匯率工具快速、準確、離線可用，是您出國旅遊、國際貿易與外幣兌換前的實用助手。
        </p>

        <h2>主要功能特色</h2>
        <p>
          RateWise
          匯率換算器提供多種實用功能：單幣別快速換算讓您即時查詢兩種貨幣的匯率；多幣別同時比較功能可一次查看所有支援貨幣的匯率；
          歷史匯率趨勢圖顯示過去 7 至 30 天的匯率變化，幫助您判斷最佳換匯時機。所有匯率數據每 5
          分鐘自動更新，確保資訊即時準確。
        </p>

        <h2>支援貨幣列表</h2>
        <p>
          我們支援 18 種貨幣，包括：新台幣 TWD、美元 USD、日圓 JPY、歐元 EUR、英鎊 GBP、港幣
          HKD、人民幣 CNY、韓元 KRW、澳幣 AUD、加幣 CAD、新加坡幣 SGD、瑞士法郎 CHF、紐幣 NZD、泰銖
          THB、菲律賓披索 PHP、印尼盾 IDR、越南盾 VND、馬來幣 MYR
          等。無論您需要換算哪種貨幣，RateWise 都能滿足您的需求。
        </p>

        <h2>為什麼選擇 RateWise</h2>
        <p>
          RateWise
          的匯率數據來源為臺灣銀行牌告匯率，提供現金和即期買入賣出價格，是台灣最具公信力的匯率參考來源。我們的應用程式採用
          Progressive Web App (PWA)
          技術開發，您可以將它安裝到手機桌面，享受原生應用般的使用體驗。即使在離線狀態下，您仍可使用上次更新的匯率數據進行換算。
        </p>

        <h2>使用方式</h2>
        <p>
          使用 RateWise
          非常簡單：首先選擇您要換算的來源貨幣和目標貨幣，然後輸入金額，系統會立即顯示換算結果。您也可以使用快速金額按鈕快速輸入常用金額。點擊匯率卡片可展開歷史趨勢圖，查看匯率走勢。切換到多幣別模式可同時查看所有貨幣的匯率。
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-4">
        {/* 來源貨幣輸入骨架 - 對應 SingleConverter 上半部 */}
        <div className="space-y-3">
          <div className="skeleton-shimmer h-4 w-20 rounded" />
          <div className="relative">
            {/* 貨幣選擇器 + 金額輸入 */}
            <div className="skeleton-shimmer h-14 w-full rounded-2xl" />
          </div>
          {/* 快速金額按鈕 - 水平排列 */}
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-shimmer h-8 w-14 flex-shrink-0 rounded-xl" />
            ))}
          </div>
        </div>

        {/* 匯率卡片骨架 - 對應匯率顯示區塊 */}
        <div className="skeleton-card rounded-xl p-4 space-y-3">
          {/* 匯率類型切換器 */}
          <div className="flex justify-center">
            <div className="skeleton-shimmer h-7 w-28 rounded-full" />
          </div>
          {/* 主匯率顯示 */}
          <div className="text-center space-y-2 py-3">
            <div className="skeleton-shimmer h-7 w-52 mx-auto rounded-lg" />
            <div className="skeleton-shimmer h-4 w-40 mx-auto rounded" />
          </div>
          {/* 迷你趨勢圖區域 */}
          <div className="skeleton-bg h-20 rounded-xl" />
        </div>

        {/* 交換按鈕骨架 */}
        <div className="flex justify-center">
          <div className="skeleton-shimmer-accent w-11 h-11 rounded-full" />
        </div>

        {/* 目標貨幣輸入骨架 - 對應 SingleConverter 下半部 */}
        <div className="space-y-3">
          <div className="skeleton-shimmer h-4 w-20 rounded" />
          <div className="relative">
            {/* 貨幣選擇器 + 金額輸出 */}
            <div className="skeleton-shimmer-accent h-14 w-full rounded-2xl" />
          </div>
          {/* 快速金額按鈕 - 水平排列 */}
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-shimmer h-8 w-14 flex-shrink-0 rounded-xl" />
            ))}
          </div>
        </div>

        {/* 加入歷史記錄按鈕骨架 */}
        <div className="skeleton-shimmer-accent h-12 w-full rounded-xl" />

        {/* 資料來源骨架 - 對應底部小字 */}
        <div className="flex justify-center">
          <div className="skeleton-shimmer h-3 w-40 rounded" />
        </div>
      </div>

      <span className="sr-only">載入匯率資料中...</span>
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
            <div className="skeleton-shimmer h-4 w-12 rounded" />
            <div className="skeleton-shimmer h-3 w-20 rounded" />
          </div>
        </div>
        <div className="skeleton-shimmer h-4 w-16 rounded" />
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
        <div className="skeleton-shimmer h-12 rounded-lg" />

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
        <div className="skeleton-shimmer h-14 rounded-lg" />
        <div className="skeleton-shimmer h-14 rounded-lg" />
      </div>

      {/* 結果顯示 */}
      <div className="skeleton-shimmer-accent h-16 rounded-xl" />
    </div>
  );
};

/**
 * 設定頁面骨架屏
 * 對應 Settings 頁面布局
 */
export const SettingsSkeleton = () => {
  return (
    <div className="skeleton-page p-5 max-w-md mx-auto space-y-6" role="status" aria-live="polite">
      {/* 介面風格區塊 */}
      <section className="space-y-3">
        <div className="skeleton-shimmer h-4 w-20 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
          ))}
        </div>
      </section>

      {/* 語言區塊 */}
      <section className="space-y-3">
        <div className="skeleton-shimmer h-4 w-12 rounded" />
        <div className="skeleton-card p-1.5">
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-shimmer flex-1 h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      {/* 儲存與快取區塊 */}
      <section className="space-y-3">
        <div className="skeleton-shimmer h-4 w-24 rounded" />
        <div className="skeleton-card p-5 space-y-4">
          <div className="flex justify-between">
            <div className="skeleton-shimmer h-4 w-24 rounded" />
            <div className="skeleton-shimmer h-5 w-16 rounded" />
          </div>
          <div className="flex justify-between">
            <div className="skeleton-shimmer h-4 w-20 rounded" />
            <div className="skeleton-shimmer h-5 w-12 rounded" />
          </div>
        </div>
      </section>

      <span className="sr-only">載入設定中...</span>
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
 * 舊版錯誤：左側為「拖曳手柄 w-4 h-8」→ 實際 UI 左側是 star(w-7)
 *
 * @see Favorites.tsx — 實際 UI 結構（star → flag+name → convert btn）
 * @see segmentedSwitch tokens — Tab 高度 py-3.5 + icon(18) + label(10) ≈ h-14
 */
export const FavoritesSkeleton = () => {
  return (
    <div
      className="flex-1 px-3 sm:px-5 py-6 max-w-md mx-auto w-full"
      role="status"
      aria-live="polite"
    >
      {/* 頁籤切換器 — 對應 'card p-1.5' segmented switch，2 個 flex-1 tab */}
      <div className="skeleton-card p-1.5 mb-6">
        <div className="flex gap-1">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton-shimmer flex-1 h-14 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* 貨幣清單 — 對應 'space-y-2'，每行 'card p-4 flex items-center gap-3' */}
      <section className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-card p-4 flex items-center gap-3">
            {/* 星號欄 — 對應 'w-7 flex-shrink-0 flex items-center justify-center'
             *  Favorites.tsx 左側永遠是 star（固定裝飾或互動按鈕），非拖曳手柄
             */}
            <div
              data-testid="skeleton-star"
              className="w-7 flex-shrink-0 flex items-center justify-center"
            >
              <div className="skeleton-shimmer w-5 h-5 rounded" />
            </div>
            {/* 國旗 — 對應 'text-2xl w-8 text-center' emoji flag */}
            <div className="skeleton-shimmer w-8 h-8 rounded-full flex-shrink-0" />
            {/* 幣別代碼 + 名稱 — 對應 'flex-1 min-w-0' */}
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="skeleton-shimmer h-4 w-16 rounded" />
              <div className="skeleton-shimmer h-3 w-24 rounded" />
            </div>
            {/* 換算按鈕區 — 對應 'px-2 py-1 flex-shrink-0' 的「換算 →」 */}
            <div className="skeleton-shimmer h-4 w-14 rounded flex-shrink-0" />
          </div>
        ))}
      </section>

      <span className="sr-only">載入收藏中...</span>
    </div>
  );
};

/**
 * 多幣別頁面骨架屏
 * 對應 MultiConverter 頁面布局
 *
 * 結構設計原則（CLS 防止）：
 * - 完全鏡像實際 MultiConverter UI 的佈局層級
 * - 外層：flex-1 flex flex-col px-3 sm:px-5 py-4 max-w-md mx-auto w-full
 * - 卡片：skeleton-card p-4 flex-1 flex flex-col（對應 'card p-4 flex-1 flex flex-col'）
 * - 快速金額列：5 個 pill，對應 flex gap-2 mb-4 overflow-x-auto
 * - 貨幣清單：8 行，每行結構 star(w-6) | flag(w-7) | code+name | [right] amount+rate
 *
 * @see MultiConverter.tsx（component）— 實際 UI 結構
 * @see multiConverterLayoutTokens — SSOT 頁面佈局 token
 */
export const MultiConverterSkeleton = () => {
  return (
    <div
      className="flex-1 flex flex-col px-3 sm:px-5 py-4 max-w-md mx-auto w-full"
      role="status"
      aria-live="polite"
    >
      {/* 主卡片 — 對應 'card p-4 flex-1 flex flex-col' */}
      <div className="skeleton-card p-4 flex-1 flex flex-col">
        {/* 快速金額 pill 列 — 對應 'flex gap-2 mb-4 overflow-x-auto scrollbar-hide' */}
        <div className="flex gap-2 mb-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              data-testid="skeleton-quick-pill"
              className="skeleton-shimmer h-8 w-14 flex-shrink-0 rounded-xl"
            />
          ))}
        </div>

        {/* 貨幣清單 — 對應 'flex-1 space-y-2 -m-0.5 p-0.5' */}
        <div className="flex-1 space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              data-testid="skeleton-currency-row"
              className="flex items-center px-3 py-2.5 rounded-xl"
            >
              {/* 星號欄 — 對應 'w-6 flex-shrink-0 flex items-center justify-center' */}
              <div className="w-6 flex-shrink-0 flex items-center justify-center">
                <div className="skeleton-shimmer w-4 h-4 rounded" />
              </div>
              {/* 國旗欄 — 對應 'text-xl flex-shrink-0 w-7 text-center' */}
              <div className="skeleton-shimmer w-6 h-5 rounded flex-shrink-0 mx-1" />
              {/* 幣別代碼 + 名稱 — 對應 code text-sm + name text-[11px] */}
              <div className="space-y-1 ml-1 flex-shrink-0">
                <div className="skeleton-shimmer h-3.5 w-10 rounded" />
                <div className="skeleton-shimmer h-2.5 w-16 rounded" />
              </div>
              {/* 金額 + 匯率資訊（右側）— 對應 'flex-1 ml-2' text-right */}
              <div className="flex-1 ml-2 space-y-1">
                <div className="skeleton-shimmer h-4 w-20 ml-auto rounded" />
                <div className="skeleton-shimmer h-2.5 w-28 ml-auto rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">載入多幣別換算中...</span>
    </div>
  );
};
