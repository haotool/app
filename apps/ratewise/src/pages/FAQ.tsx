/**
 * FAQ Page
 * Frequently Asked Questions with FAQPage structured data for SEO
 */
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';

const FAQ_DATA = [
  {
    question: '什麼是 RateWise 匯率好工具？',
    answer: (
      <>
        <strong>
          RateWise 是一個基於臺灣銀行牌告匯率的即時匯率 PWA 應用，支援 30+ 種貨幣換算。
        </strong>{' '}
        我們提供單幣別與多幣別換算功能，涵蓋 TWD、USD、JPY、EUR、GBP、HKD、CNY、KRW、AUD、CAD、SGD
        等主要貨幣。應用程式採用 Progressive Web App 技術，支援離線使用，Lighthouse Performance
        評分達 97/100，LCP (Largest Contentful Paint) 僅 489ms，提供極致快速的使用體驗。
      </>
    ),
  },
  {
    question: '匯率數據來源是什麼？',
    answer: (
      <>
        <strong>RateWise 的匯率數據 100% 參考臺灣銀行官方牌告匯率。</strong>{' '}
        臺灣銀行是台灣最大的公營銀行，其牌告匯率被廣泛用作市場參考標準。我們的系統每 5
        分鐘自動同步一次匯率數據，確保您獲得最新且準確的匯率資訊。數據涵蓋現金匯率與即期匯率，包括買入價與賣出價兩個方向的完整資訊。
      </>
    ),
  },
  {
    question: '支援哪些貨幣？',
    answer: (
      <>
        <strong>RateWise 支援超過 30 種主要國際貨幣。</strong> 涵蓋亞洲貨幣（TWD 台幣、JPY 日圓、HKD
        港幣、CNY 人民幣、KRW 韓元、SGD 新加坡幣、THB 泰銖、PHP 菲律賓披索）、歐美貨幣（USD
        美元、EUR 歐元、GBP 英鎊、CAD 加幣、AUD 澳幣、NZD 紐幣、CHF
        瑞士法郎）以及其他常用貨幣如瑞典克朗 (SEK)、南非幣 (ZAR)
        等。完整貨幣清單請參考應用內的貨幣選擇器。
      </>
    ),
  },
  {
    question: '如何使用多幣別換算功能？',
    answer: (
      <>
        <strong>多幣別換算模式可同時顯示一個基準貨幣對多種目標貨幣的即時換算結果。</strong>{' '}
        使用方法：1. 在主畫面點選「多幣別換算」模式 2. 選擇基準貨幣（例如 USD）3. 輸入金額（例如
        1000）4. 系統會即時顯示該金額對所有 30+
        種支援貨幣的換算結果。此功能特別適合出國旅遊比價、國際貿易報價比較，或投資者同時追蹤多個貨幣對的匯率變化。
      </>
    ),
  },
  {
    question: '可以離線使用嗎？',
    answer: (
      <>
        <strong>RateWise 採用 PWA (Progressive Web App) 技術，完全支援離線使用。</strong>{' '}
        當您首次開啟應用程式時，Service Worker
        會自動將應用程式資源與最新匯率數據快取至瀏覽器。即使在沒有網路連線的環境下（如飛機上、地下室、國外漫遊關閉時），您仍可使用最後一次更新的匯率資料進行換算。快取的匯率數據有效期為
        5 分鐘，重新連線後會自動更新至最新數據。
      </>
    ),
  },
  {
    question: '匯率更新頻率如何？',
    answer: (
      <>
        <strong>匯率數據每 5 分鐘自動更新一次，確保即時性與準確性。</strong>{' '}
        我們的系統會持續監控臺灣銀行的匯率變動，並在每 5
        分鐘的更新週期中同步最新數據。您也可以透過下拉重新整理（Pull to
        Refresh）或點擊重新整理按鈕手動觸發更新。應用程式會在畫面上顯示最後更新時間（例如「3
        分鐘前更新」），讓您隨時掌握數據的新鮮度。
      </>
    ),
  },
  {
    question: '如何安裝 RateWise 到手機桌面？',
    answer: (
      <>
        <strong>RateWise 支援安裝至手機桌面，像原生 App 一樣使用。</strong> iOS 安裝方式：在 Safari
        瀏覽器開啟 app.haotool.org/ratewise，點擊底部「分享」按鈕，選擇「加入主畫面」。Android
        安裝方式：在 Chrome 瀏覽器開啟
        app.haotool.org/ratewise，點選右上角選單，選擇「安裝應用程式」或「加到主畫面」。安裝後，您可以在桌面直接點擊圖示開啟，無需透過瀏覽器，並享受全螢幕體驗與更快的啟動速度。
      </>
    ),
  },
  {
    question: 'RateWise 免費嗎？',
    answer: (
      <>
        <strong>RateWise 100% 免費使用，無廣告、無付費牆、無訂閱方案。</strong>{' '}
        我們不收取任何費用，也不會要求您註冊帳號或提供個人資訊。應用程式沒有任何廣告干擾，所有功能（包括即時匯率查詢、歷史趨勢圖、多幣別換算、離線使用等）都完全開放給所有使用者。我們是開放原始碼專案，致力於為台灣用戶提供最好的匯率換算體驗。
      </>
    ),
  },
  {
    question: '匯率換算結果準確嗎？',
    answer: (
      <>
        <strong>RateWise 的換算結果基於臺灣銀行官方牌告匯率，確保數據準確性。</strong>{' '}
        臺灣銀行牌告匯率是台灣金融市場的權威參考指標，我們每 5
        分鐘同步一次官方數據。需要注意的是，實際交易匯率可能因銀行（如兆豐、國泰世華）、線上兌換平台（如
        Wise、Revolut）或實體兌換商（如機場、市區換匯所）而有 0.5-2%
        的價差。建議在實際交易前，向您選擇的金融機構確認即時匯率與手續費。
      </>
    ),
  },
  {
    question: '可以查看歷史匯率嗎？',
    answer: (
      <>
        <strong>RateWise 提供歷史匯率趨勢圖，支援查看過去 7 天、30 天或自訂期間的匯率變化。</strong>{' '}
        在單幣別換算模式下，匯率卡片會自動顯示該貨幣對的歷史趨勢線圖，包括最高點、最低點與平均值標記。圖表採用
        Recharts
        函式庫繪製，支援觸控縮放與數據點查詢。您可以透過趨勢圖了解匯率波動情況，例如「USD/TWD 過去
        30 天波動範圍為 30.5-31.2」，幫助您選擇最佳換匯時機。
      </>
    ),
  },
];

export default function FAQ() {
  return (
    <>
      <SEOHelmet
        title="常見問題"
        description="RateWise 匯率好工具常見問題：匯率來源、支援貨幣、離線使用、更新頻率等問題解答。"
        pathname="/faq"
        faq={FAQ_DATA}
      />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-violet-600 hover:text-violet-700 mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              回到首頁
            </Link>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">常見問題</h1>
            <p className="text-slate-600">關於 RateWise 匯率好工具的常見問題解答</p>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {FAQ_DATA.map((faq, index) => (
              <details
                key={index}
                className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 hover:text-violet-600 transition-colors list-none">
                  <h2 className="text-lg font-semibold text-slate-800 group-hover:text-violet-600 transition-colors">
                    {faq.question}
                  </h2>
                  <svg
                    className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 p-6 bg-violet-50 rounded-lg border border-violet-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">還有其他問題？</h2>
            <p className="text-slate-600">
              如果您有其他問題或建議，歡迎透過
              <a
                href="mailto:haotool.org@gmail.com"
                className="text-violet-600 hover:text-violet-700 underline ml-1"
              >
                haotool.org@gmail.com
              </a>
              與我們聯繫。
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
