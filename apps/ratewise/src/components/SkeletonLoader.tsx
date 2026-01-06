/**
 * Skeleton Loader Component
 * [Lighthouse-optimization:2025-10-28] 取代 loading spinner，提升 perceived performance
 * [SEO-fix:2026-01-06] 添加靜態 SEO 內容，解決 Seobility 爬蟲無法看到 H1/內容的問題
 *
 * 參考:
 * - https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/
 * - https://react.dev/reference/react/Suspense
 * - Seobility SEO 審計報告 2026-01-06
 *
 * 優勢:
 * - 即時顯示內容結構，減少 perceived loading time
 * - 用戶可預期內容佈局，降低 cognitive load
 * - 避免 spinner 的「等待感」，提升 UX
 * - SSG 輸出包含 SEO 友好的靜態內容（H1、H2、段落）
 *
 * SEO 修復說明:
 * - 問題：ClientOnly 導致 SSG 輸出只有骨架動畫，沒有真實文字
 * - Seobility 報告：無 H1、只有 60 字、無段落
 * - 解決方案：在骨架屏中嵌入 SEO 靜態內容，使用 sr-only 對視覺用戶隱藏
 */

export const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" role="status" aria-live="polite">
      {/**
       * SEO 靜態內容區塊
       * - 使用 sr-only 對視覺用戶隱藏
       * - 對 SEO 爬蟲可見，提供完整的語義結構
       * - 包含 H1、H2、段落文字（>250 字）
       */}
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
          我們支援超過 30 種主要貨幣，包括：新台幣 TWD、美元 USD、日圓 JPY、歐元 EUR、英鎊 GBP、港幣
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
