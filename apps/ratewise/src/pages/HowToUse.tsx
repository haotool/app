/**
 * How To Use Page
 * Step-by-step guide with HowTo structured data for SEO
 */
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';

const HOW_TO_STEPS = [
  {
    name: '開啟 RateWise 應用程式',
    text: '在瀏覽器中輸入 ratewise.app 或點擊已安裝的 RateWise 圖示。首次開啟時，系統會自動載入最新的匯率資料並快取至您的裝置。',
    image: 'https://ratewise.app/screenshots/mobile-home.png',
  },
  {
    name: '選擇換算模式',
    text: '在主畫面頂部選擇「單幣別換算」或「多幣別換算」模式。單幣別適合快速換算兩種貨幣，多幣別可同時比較多種貨幣的匯率。',
  },
  {
    name: '選擇來源貨幣',
    text: '點擊「從」下拉選單，選擇您要換算的來源貨幣（例如 TWD 台幣）。支援 30+ 種主要貨幣，包括 USD、JPY、EUR、GBP、HKD、CNY 等。',
  },
  {
    name: '選擇目標貨幣',
    text: '點擊「到」下拉選單，選擇您要換算的目標貨幣（例如 USD 美元）。系統會即時顯示當前匯率與歷史趨勢圖。',
  },
  {
    name: '輸入金額並查看結果',
    text: '在輸入框輸入您要換算的金額（例如 10000）。系統會即時計算並顯示換算結果，同時展示匯率走勢圖與最後更新時間。',
    image: 'https://ratewise.app/screenshots/mobile-converter-active.png',
  },
  {
    name: '查看歷史匯率趨勢',
    text: '匯率卡片下方會顯示過去 7 天或 30 天的匯率趨勢圖。您可以透過圖表了解匯率波動情況，包括最高點、最低點與平均值。',
  },
  {
    name: '離線使用（選用）',
    text: '若要離線使用，請先在有網路時開啟應用程式，系統會自動快取最新匯率資料。快取有效期為 5 分鐘，在沒有網路的環境下仍可使用最近一次更新的匯率進行換算。',
  },
  {
    name: '安裝至桌面（選用）',
    text: 'iOS 用戶：在 Safari 開啟 ratewise.app，點擊底部「分享」按鈕，選擇「加入主畫面」。Android 用戶：在 Chrome 開啟 ratewise.app，點擊右上角選單，選擇「安裝應用程式」。安裝後可在桌面直接開啟，享受全螢幕體驗。',
  },
];

export default function HowToUse() {
  return (
    <>
      <SEOHelmet
        title="使用指南"
        description="RateWise 匯率好工具使用指南：完整的步驟教學，教您如何快速查詢匯率、換算貨幣、查看歷史趨勢，以及安裝至手機桌面。"
        pathname="/how-to-use"
        breadcrumbs={[{ name: '首頁', url: '/' }, { name: '使用指南' }]}
        howTo={{
          name: '如何使用 RateWise 匯率換算工具',
          description:
            '完整的步驟指南，教您如何使用 RateWise 進行即時匯率查詢、貨幣換算、查看歷史趨勢圖，以及安裝至手機或電腦桌面。',
          steps: HOW_TO_STEPS,
        }}
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
            <h1 className="text-4xl font-bold text-slate-800 mb-2">如何使用 RateWise</h1>
            <p className="text-slate-600">完整的步驟指南，教您快速上手 RateWise 匯率換算工具</p>
          </div>

          {/* Introduction */}
          <div className="bg-violet-50 rounded-lg border border-violet-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-3">開始之前</h2>
            <p className="text-slate-600 leading-relaxed">
              RateWise 是一個簡單易用的匯率換算工具，無需註冊帳號即可使用。
              以下步驟將引導您完成首次使用，包括基本換算、查看趨勢圖，以及安裝至桌面的方法。
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-800">操作步驟</h2>
            {HOW_TO_STEPS.map((step, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">{step.name}</h3>
                    <p className="text-slate-600 leading-relaxed">{step.text}</p>
                    {step.image && (
                      <div className="mt-4">
                        <img
                          src={step.image}
                          alt={step.name}
                          className="rounded-lg border border-slate-200 max-w-md mx-auto"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">實用技巧</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-violet-600 mr-3 mt-1">💡</span>
                <div>
                  <strong className="text-slate-800">快速交換貨幣</strong>
                  <p className="text-slate-600 text-sm">
                    點擊來源貨幣與目標貨幣之間的交換按鈕，可快速對調兩種貨幣
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-3 mt-1">💡</span>
                <div>
                  <strong className="text-slate-800">多幣別比較</strong>
                  <p className="text-slate-600 text-sm">
                    使用「多幣別換算」模式可同時查看一個基準貨幣對所有 30+
                    種貨幣的換算結果，適合旅遊比價
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-3 mt-1">💡</span>
                <div>
                  <strong className="text-slate-800">查看詳細匯率</strong>
                  <p className="text-slate-600 text-sm">
                    匯率卡片顯示「買入價」與「賣出價」，幫助您了解銀行兌換匯率的完整資訊
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-3 mt-1">💡</span>
                <div>
                  <strong className="text-slate-800">手動更新匯率</strong>
                  <p className="text-slate-600 text-sm">
                    在主畫面下拉即可手動觸發匯率更新，無需等待 5 分鐘自動更新週期
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* FAQ Link */}
          <div className="bg-violet-50 rounded-lg border border-violet-100 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">還有問題？</h2>
            <p className="text-slate-600 mb-4">
              查看我們的常見問題頁面，了解更多關於 RateWise 的資訊。
            </p>
            <Link
              to="/faq"
              className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              前往常見問題
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
