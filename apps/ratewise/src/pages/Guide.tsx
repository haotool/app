/**
 * Guide Page - 使用指南
 * [BDD Implementation: Green Light]
 *
 * Feature: HowTo Schema for AI Search Optimization
 * 依據: docs/dev/013_ai_search_optimization_spec.md
 */
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';

const Guide = () => {
  const howToSteps = [
    {
      position: 1,
      name: '選擇原始貨幣',
      text: '在「從」欄位選擇您要兌換的貨幣（例如：TWD 台幣）',
      image: '/screenshots/step1-select-from.png',
    },
    {
      position: 2,
      name: '選擇目標貨幣',
      text: '在「到」欄位選擇您要兌換成的貨幣（例如：USD 美元）',
      image: '/screenshots/step2-select-to.png',
    },
    {
      position: 3,
      name: '輸入金額',
      text: '在原始貨幣欄位輸入金額，系統會自動計算並顯示目標貨幣金額',
      image: '/screenshots/step3-enter-amount.png',
    },
  ];

  return (
    <>
      <SEOHelmet
        title="使用指南 - 如何使用 RateWise 進行匯率換算 | RateWise 匯率好工具"
        description="快速學會使用 RateWise 進行單幣別和多幣別匯率換算。簡單 3 步驟：選擇原始貨幣、選擇目標貨幣、輸入金額，系統自動計算結果。"
        canonical="https://app.haotool.org/ratewise/guide/"
        pathname="/guide"
        howTo={{
          name: '如何使用 RateWise 進行匯率換算',
          description: '快速學會使用 RateWise 進行單幣別和多幣別匯率換算',
          steps: howToSteps,
          totalTime: 'PT30S', // 30 秒完成
        }}
      />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-slate-50">
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

          {/* 標題 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              如何使用 RateWise 進行匯率換算
            </h1>
            <p className="text-slate-600">快速學會使用 RateWise 進行單幣別和多幣別匯率換算</p>
          </div>

          {/* 步驟說明 */}
          <div className="space-y-6">
            {howToSteps.map((step) => (
              <div
                key={step.position}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                    {step.position}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">{step.name}</h2>
                    <p className="text-slate-600 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 進階功能 */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">進階功能</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">多幣別換算</h3>
                <p className="text-slate-600 leading-relaxed">
                  點選「多幣別換算」模式，可同時查看一個基準貨幣對所有支援貨幣的換算結果。適合出國旅遊比價、國際貿易報價比較。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">歷史匯率趨勢</h3>
                <p className="text-slate-600 leading-relaxed">
                  在單幣別換算模式下，匯率卡片會自動顯示該貨幣對的歷史趨勢線圖，包括最高點、最低點與平均值標記。幫助您選擇最佳換匯時機。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">收藏常用貨幣</h3>
                <p className="text-slate-600 leading-relaxed">
                  點擊貨幣卡片的星號圖示，將常用貨幣加入收藏。收藏的貨幣會顯示在「常用貨幣」區塊，方便快速存取。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">離線使用</h3>
                <p className="text-slate-600 leading-relaxed">
                  RateWise 採用 PWA
                  技術，支援離線使用。即使沒有網路連線，也能使用最後一次更新的匯率資料進行換算。
                </p>
              </div>
            </div>
          </div>

          {/* 提示與技巧 */}
          <div className="mt-8 p-6 bg-violet-50 rounded-lg border border-violet-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">💡 提示與技巧</h2>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start">
                <span className="text-violet-600 mr-2">•</span>
                <span>下拉重新整理可手動更新匯率至最新數據</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-2">•</span>
                <span>點擊匯率卡片可展開查看詳細資訊與趨勢圖</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-2">•</span>
                <span>使用快速金額按鈕（100、1000、10000）可快速輸入常用金額</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-2">•</span>
                <span>切換「現金匯率」與「即期匯率」以查看不同匯率類型</span>
              </li>
            </ul>
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
