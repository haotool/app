/**
 * Guide Page - 使用指南
 * [BDD Implementation: Green Light]
 * [Updated: 2025-12-03] 擴充至 8 步驟完整教學
 *
 * Feature: HowTo Schema for AI Search Optimization
 * 依據: docs/dev/013_ai_search_optimization_spec.md
 * 依據: docs/dev/019_optional_features_spec.md
 */
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { Breadcrumb } from '../components/Breadcrumb';

const Guide = () => {
  const howToSteps = [
    {
      position: 1,
      name: '開啟 RateWise',
      text: '在瀏覽器中開啟 RateWise 匯率好工具（app.haotool.org/ratewise），或將其加入手機主畫面作為 PWA 應用程式使用。',
      image: '/screenshots/step1-open-app.png',
    },
    {
      position: 2,
      name: '選擇換算模式',
      text: '在頁面頂部選擇「單幣別」或「多幣別」換算模式。單幣別適合一對一換算，多幣別適合同時查看多種貨幣匯率。',
      image: '/screenshots/step2-select-mode.png',
    },
    {
      position: 3,
      name: '選擇原始貨幣',
      text: '在「從」欄位選擇您要兌換的貨幣（例如：TWD 台幣）。RateWise 支援超過 30 種主要貨幣。',
      image: '/screenshots/step3-select-from.png',
    },
    {
      position: 4,
      name: '選擇目標貨幣',
      text: '在「到」欄位選擇您要兌換成的貨幣（例如：USD 美元、JPY 日圓）。',
      image: '/screenshots/step4-select-to.png',
    },
    {
      position: 5,
      name: '輸入金額',
      text: '在原始貨幣欄位輸入金額，或使用快速金額按鈕（100、1000、10000）。系統會即時計算並顯示換算結果。',
      image: '/screenshots/step5-enter-amount.png',
    },
    {
      position: 6,
      name: '選擇匯率類型',
      text: '切換「現金匯率」或「即期匯率」。現金匯率適用於實體換匯，即期匯率適用於銀行轉帳。',
      image: '/screenshots/step6-rate-type.png',
    },
    {
      position: 7,
      name: '查看歷史趨勢',
      text: '點擊匯率卡片展開詳細資訊，查看過去 30 天的匯率趨勢圖，包括最高點、最低點與平均值標記。',
      image: '/screenshots/step7-trend-chart.png',
    },
    {
      position: 8,
      name: '收藏常用貨幣',
      text: '點擊貨幣卡片的星號圖示，將常用貨幣加入收藏。收藏的貨幣會顯示在「常用貨幣」區塊，方便快速存取。',
      image: '/screenshots/step8-favorites.png',
    },
  ];

  return (
    <>
      <SEOHelmet
        title="使用指南 - 如何使用 RateWise 進行匯率換算 | RateWise 匯率好工具"
        description="完整 8 步驟教學，快速學會使用 RateWise 進行單幣別和多幣別匯率換算。包含模式選擇、匯率類型切換、歷史趨勢查看、收藏功能等完整操作指南。"
        canonical="https://app.haotool.org/ratewise/guide/"
        pathname="/guide"
        breadcrumb={[
          { name: 'RateWise 首頁', item: '/' },
          { name: '使用教學', item: '/guide/' },
        ]}
        howTo={{
          name: '如何使用 RateWise 進行匯率換算',
          description:
            '完整 8 步驟教學，快速學會使用 RateWise 進行單幣別和多幣別匯率換算，包含進階功能操作指南',
          steps: howToSteps,
          totalTime: 'PT2M', // 2 分鐘完成
        }}
      />

      <main className="min-h-screen bg-gradient-to-br from-neutral-light via-violet-50 to-neutral-light">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* 返回首頁 */}
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

          {/* Breadcrumb Navigation */}
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '使用指南', href: '/guide/' },
            ]}
          />

          {/* 標題 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-text mb-2">
              如何使用 RateWise 進行匯率換算
            </h1>
            <p className="text-neutral-text-secondary">
              完整 8 步驟教學，快速學會使用 RateWise 進行單幣別和多幣別匯率換算
            </p>
            <div className="mt-2 flex items-center text-sm text-neutral-text-muted">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              預估完成時間：約 2 分鐘
            </div>
          </div>

          {/* 快速導航 */}
          <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-text mb-3">快速導航</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {howToSteps.map((step) => (
                <a
                  key={step.position}
                  href={`#step-${step.position}`}
                  className="text-sm text-violet-600 hover:text-violet-700 hover:underline"
                >
                  {step.position}. {step.name}
                </a>
              ))}
            </div>
          </div>

          {/* 步驟說明 */}
          <div className="space-y-6">
            {howToSteps.map((step) => (
              <div
                key={step.position}
                id={`step-${step.position}`}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow scroll-mt-4"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                    {step.position}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-neutral-text mb-2">{step.name}</h2>
                    <p className="text-neutral-text-secondary leading-relaxed">{step.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 進階功能 */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-neutral-text mb-4">進階功能</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">多幣別換算</h3>
                <p className="text-neutral-text-secondary leading-relaxed">
                  點選「多幣別換算」模式，可同時查看一個基準貨幣對所有支援貨幣的換算結果。適合出國旅遊比價、國際貿易報價比較。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">歷史匯率趨勢</h3>
                <p className="text-neutral-text-secondary leading-relaxed">
                  在單幣別換算模式下，匯率卡片會自動顯示該貨幣對過去 30
                  天的歷史趨勢線圖，包括最高點、最低點與平均值標記。幫助您選擇最佳換匯時機。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">收藏常用貨幣</h3>
                <p className="text-neutral-text-secondary leading-relaxed">
                  點擊貨幣卡片的星號圖示，將常用貨幣加入收藏。收藏的貨幣會顯示在「常用貨幣」區塊，方便快速存取。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">離線使用</h3>
                <p className="text-neutral-text-secondary leading-relaxed">
                  RateWise 採用 PWA
                  技術，支援離線使用。即使沒有網路連線，也能使用最後一次更新的匯率資料進行換算。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">計算機功能</h3>
                <p className="text-neutral-text-secondary leading-relaxed">
                  點擊金額輸入框旁的計算機圖示，可開啟內建計算機進行複雜運算。支援加減乘除、百分比等基本運算。
                </p>
              </div>
            </div>
          </div>

          {/* 提示與技巧 */}
          <div className="mt-8 p-6 bg-violet-50 rounded-lg border border-violet-100">
            <h2 className="text-xl font-semibold text-neutral-text mb-2">💡 提示與技巧</h2>
            <ul className="space-y-2 text-neutral-text-secondary">
              <li className="flex items-start">
                <span className="text-violet-600 mr-2">•</span>
                <span>下拉重新整理可手動更新匯率至最新數據（每 5 分鐘自動更新）</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-2">•</span>
                <span>點擊匯率卡片可展開查看詳細資訊與 30 天趨勢圖</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-2">•</span>
                <span>使用快速金額按鈕（100、1000、10000）可快速輸入常用金額</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-2">•</span>
                <span>切換「現金匯率」與「即期匯率」以查看不同匯率類型</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-2">•</span>
                <span>匯率資料 100% 來自臺灣銀行牌告匯率，每 5 分鐘同步一次</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-2">•</span>
                <span>將 RateWise 加入手機主畫面，可獲得接近原生 App 的使用體驗</span>
              </li>
            </ul>
          </div>

          {/* 常見問題 */}
          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-text mb-4">❓ 常見問題</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-neutral-text">匯率多久更新一次？</h3>
                <p className="text-neutral-text-secondary text-sm mt-1">
                  匯率資料每 5 分鐘自動同步臺灣銀行牌告匯率，您也可以下拉頁面手動更新。
                </p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-text">現金匯率和即期匯率有什麼差別？</h3>
                <p className="text-neutral-text-secondary text-sm mt-1">
                  現金匯率適用於實體現金兌換（如銀行臨櫃換匯），即期匯率適用於銀行帳戶間轉帳。一般來說，即期匯率較優惠。
                </p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-text">離線時可以使用嗎？</h3>
                <p className="text-neutral-text-secondary text-sm mt-1">
                  可以！RateWise 採用 PWA
                  技術，會快取最近的匯率資料。離線時會使用最後一次更新的匯率進行換算。
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/faq" className="text-violet-600 hover:text-violet-700 text-sm font-medium">
                查看更多常見問題 →
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-md hover:shadow-lg"
            >
              開始使用 RateWise
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default Guide;
