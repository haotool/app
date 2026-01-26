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
 * - 包含完整 AppLayout 結構（Header + BottomNavigation）
 *
 * @see https://web.dev/articles/cls
 * @see https://www.smashingmagazine.com/2020/04/skeleton-screens-react/
 * @updated 2026-01-25 - 新增 Header 和 BottomNavigation 骨架屏
 */

/**
 * Mobile Header 骨架屏
 * 對應 AppLayout Header 組件（僅行動端顯示）
 *
 * @description 48px 高度，包含 Logo 和標題骨架
 * @see AppLayout.tsx - Header component
 */
const SkeletonHeader = () => (
  <div className="md:hidden shrink-0">
    <header
      className="
        h-12 px-4 pt-safe-top z-30 shrink-0
        bg-background/80 backdrop-blur-xl
        border-b border-black/[0.03]
        flex items-center
      "
    >
      <div className="flex justify-between items-center max-w-md mx-auto w-full">
        {/* 品牌 Logo + 標題骨架 */}
        <div className="flex items-center gap-2.5">
          <div className="skeleton-shimmer w-7 h-7 rounded-lg" />
          <div className="skeleton-shimmer h-5 w-36 rounded" />
        </div>
      </div>
    </header>
  </div>
);

/**
 * Bottom Navigation 骨架屏
 * 對應 AppLayout BottomNavigation 組件（僅行動端顯示）
 *
 * @description 56px 高度，4 個導航項目
 * @see BottomNavigation.tsx
 */
const SkeletonBottomNavigation = () => (
  <nav
    className="
      md:hidden fixed bottom-0 left-0 right-0 z-40
      bg-background/80 backdrop-blur-xl
      border-t border-black/[0.03]
      pb-safe-bottom
    "
  >
    <div className="flex h-14 max-w-md mx-auto relative px-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-1 h-full flex flex-col items-center justify-center gap-0.5">
          <div className="skeleton-shimmer w-5 h-5 rounded" />
          <div className="skeleton-shimmer w-8 h-2 rounded" />
        </div>
      ))}
    </div>
  </nav>
);

/**
 * 主頁面骨架屏
 * 對應 SingleConverter 頁面布局，包含完整 AppLayout 結構
 *
 * @description 包含 Header（行動端）、主內容區、BottomNavigation（行動端）
 */
export const SkeletonLoader = () => {
  return (
    <div
      className="h-dvh w-full flex flex-col font-sans bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] overflow-hidden"
      role="status"
      aria-live="polite"
    >
      {/* Mobile Header 骨架屏 */}
      <SkeletonHeader />

      {/* Main content area 骨架屏 */}
      <main className="flex-1 min-h-0 relative overflow-y-scroll overflow-x-hidden pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0 [-webkit-overflow-scrolling:touch] overscroll-y-contain">
        <div className="p-4 md:p-6">
          {/* SEO 靜態內容區塊 - 對 SEO 爬蟲可見 */}
          <div className="sr-only">
            <h1>RateWise 匯率好工具 - 即時匯率換算</h1>
            <p>
              RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援
              TWD、USD、JPY、EUR、GBP、HKD、CNY、KRW、AUD、CAD、SGD 等超過 30
              種主要貨幣。我們的匯率工具快速、準確、離線可用，是您出國旅遊、國際貿易、外幣兌換的最佳助手。
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
              我們支援超過 30 種主要貨幣，包括：新台幣 TWD、美元 USD、日圓 JPY、歐元 EUR、英鎊
              GBP、港幣 HKD、人民幣 CNY、韓元 KRW、澳幣 AUD、加幣 CAD、新加坡幣 SGD、瑞士法郎
              CHF、紐幣 NZD、泰銖 THB、菲律賓披索 PHP、印尼盾 IDR、越南盾 VND、馬來幣 MYR
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
      </main>

      {/* Mobile Bottom Navigation 骨架屏 */}
      <SkeletonBottomNavigation />
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
 * @description Skeleton for Favorites page with tabs and currency list
 *              收藏頁面骨架屏，包含頁籤和貨幣列表
 */
export const FavoritesSkeleton = () => {
  return (
    <div className="skeleton-page p-5 max-w-md mx-auto space-y-6" role="status" aria-live="polite">
      {/* Tab switcher */}
      <div className="skeleton-card p-1.5">
        <div className="flex gap-1">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton-shimmer flex-1 h-14 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Favorite currencies list with drag handles */}
      <section className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card p-4">
            <div className="flex items-center gap-3">
              {/* Drag handle */}
              <div className="skeleton-shimmer w-4 h-8 rounded" />
              {/* Flag and info */}
              <div className="skeleton-shimmer w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-shimmer h-5 w-16 rounded" />
                <div className="skeleton-shimmer h-4 w-24 rounded" />
              </div>
              {/* Star icon */}
              <div className="skeleton-shimmer h-6 w-6 rounded" />
            </div>
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
 */
export const MultiConverterSkeleton = () => {
  return (
    <div className="skeleton-page p-5 max-w-md mx-auto space-y-4" role="status" aria-live="polite">
      {/* 基準貨幣輸入卡片 */}
      <div className="skeleton-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer w-12 h-12 rounded-full" />
          <div className="space-y-1.5">
            <div className="skeleton-shimmer h-5 w-16 rounded" />
            <div className="skeleton-shimmer h-4 w-24 rounded" />
          </div>
        </div>
        <div className="skeleton-shimmer h-12 w-full rounded-xl" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-shimmer h-8 flex-1 rounded-lg" />
          ))}
        </div>
      </div>

      {/* 貨幣列表 */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-card p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="skeleton-shimmer w-8 h-8 rounded-full" />
                <div className="space-y-1">
                  <div className="skeleton-shimmer h-4 w-12 rounded" />
                  <div className="skeleton-shimmer h-3 w-20 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton-shimmer h-5 w-20 rounded" />
                <div className="skeleton-shimmer h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">載入多幣別換算中...</span>
    </div>
  );
};
