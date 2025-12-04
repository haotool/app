/**
 * Guide Page - 使用指南
 * [BDD Implementation: Green Light]
 * [Created: 2025-12-04] 8 步驟完整教學
 *
 * Feature: HowTo Schema for AI Search Optimization
 * 依據: docs/dev/019_optional_features_spec.md
 */
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';

const Guide = () => {
  const howToSteps = [
    {
      position: 1,
      name: '開啟日本名字產生器',
      text: '在瀏覽器中開啟日本名字產生器（app.haotool.org/nihonname），或將其加入手機主畫面作為 PWA 應用程式使用。',
    },
    {
      position: 2,
      name: '輸入你的中文姓氏',
      text: '在「你的姓」欄位輸入你的中文姓氏（例如：林、陳、王）。系統會自動根據發音匹配最適合的日文姓氏。',
    },
    {
      position: 3,
      name: '查看日文姓氏結果',
      text: '系統會顯示與你中文姓氏發音相近的日文姓氏（例如：林 → 林 Hayashi、陳 → 陳 Chin）。',
    },
    {
      position: 4,
      name: '產生諧音梗名字',
      text: '點擊「名字」區域或骰子按鈕，系統會隨機產生一個有趣的諧音梗日文名字，讓你的日本名字更有趣味。',
    },
    {
      position: 5,
      name: '查看羅馬拼音',
      text: '每個名字都會顯示對應的羅馬拼音（Romaji），方便你正確發音和拼寫你的日本名字。',
    },
    {
      position: 6,
      name: '了解諧音含義',
      text: '每個諧音梗名字都附有解釋，告訴你這個名字的有趣諧音含義，讓你更了解名字背後的笑點。',
    },
    {
      position: 7,
      name: '使用截圖模式',
      text: '點擊右上角的「截圖模式」按鈕，可以隱藏多餘元素，方便你截圖分享你的日本名字給朋友。',
    },
    {
      position: 8,
      name: '自訂諧音梗名字',
      text: '點擊「+」按鈕可以新增你自己創作的諧音梗名字，這些名字會儲存在你的瀏覽器中，下次使用時還能看到。',
    },
  ];

  // HowTo Schema JSON-LD
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '如何使用日本名字產生器',
    description:
      '完整 8 步驟教學，快速學會使用日本名字產生器，根據你的中文姓氏產生有趣的諧音梗日本名字。',
    totalTime: 'PT2M',
    step: howToSteps.map((step) => ({
      '@type': 'HowToStep',
      position: step.position,
      name: step.name,
      text: step.text,
    })),
  };

  return (
    <>
      <SEOHelmet
        title="使用指南 - 日本名字產生器"
        description="完整 8 步驟教學，快速學會使用日本名字產生器，根據你的中文姓氏產生有趣的諧音梗日本名字。"
        keywords={[
          '日本名字教學',
          '諧音梗名字產生器使用方法',
          '日文名字怎麼取',
          '日本名字產生器教學',
          '皇民化改姓教學',
        ]}
        pathname="/guide"
        jsonLd={howToSchema}
        breadcrumbs={[
          { name: '首頁', url: '/' },
          { name: '使用指南', url: '/guide' },
        ]}
      />

      <main className="min-h-screen bg-gradient-to-br from-stone-50 via-red-50/30 to-stone-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* 返回首頁 */}
          <Link
            to="/"
            className="inline-flex items-center text-red-700 hover:text-red-800 mb-4 transition-colors"
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
            <h1 className="text-4xl font-bold text-stone-800 mb-2 font-jp">
              如何使用日本名字產生器
            </h1>
            <p className="text-stone-600">完整 8 步驟教學，快速學會產生有趣的諧音梗日本名字</p>
            <div className="mt-2 flex items-center text-sm text-stone-500">
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
          <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-stone-200">
            <h2 className="text-lg font-bold text-stone-800 mb-3">快速導航</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {howToSteps.map((step) => (
                <a
                  key={step.position}
                  href={`#step-${step.position}`}
                  className="text-sm text-stone-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded transition-colors"
                >
                  {step.position}. {step.name}
                </a>
              ))}
            </div>
          </div>

          {/* 步驟列表 */}
          <div className="space-y-6">
            {howToSteps.map((step) => (
              <article
                key={step.position}
                id={`step-${step.position}`}
                className="bg-white rounded-lg shadow-sm p-6 border border-stone-200 scroll-mt-20"
              >
                <div className="flex items-start gap-4">
                  {/* 步驟編號 */}
                  <div className="flex-shrink-0 w-10 h-10 bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {step.position}
                  </div>

                  {/* 步驟內容 */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-stone-800 mb-2">{step.name}</h3>
                    <p className="text-stone-600 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* 常見問題 */}
          <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-stone-200">
            <h2 className="text-2xl font-bold text-stone-800 mb-4">常見問題</h2>

            <div className="space-y-4">
              <details className="group">
                <summary className="cursor-pointer text-stone-700 font-medium hover:text-red-700 transition-colors">
                  為什麼我的姓氏找不到對應的日文姓氏？
                </summary>
                <p className="mt-2 text-stone-600 pl-4 border-l-2 border-red-200">
                  目前資料庫收錄了約 500
                  個台灣常見姓氏的對應日文姓氏。如果你的姓氏較為罕見，可能暫時沒有收錄。歡迎透過
                  About 頁面聯繫我們補充。
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-stone-700 font-medium hover:text-red-700 transition-colors">
                  諧音梗名字是怎麼產生的？
                </summary>
                <p className="mt-2 text-stone-600 pl-4 border-l-2 border-red-200">
                  我們收集了約 500
                  個有趣的諧音梗日文名字，這些名字的日文發音與中文、台語或其他語言的詞彙相似，產生有趣的雙關效果。
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-stone-700 font-medium hover:text-red-700 transition-colors">
                  自訂的諧音梗名字會保存在哪裡？
                </summary>
                <p className="mt-2 text-stone-600 pl-4 border-l-2 border-red-200">
                  自訂的諧音梗名字會儲存在你的瀏覽器 localStorage
                  中，不會上傳到伺服器。清除瀏覽器資料會同時清除這些自訂名字。
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-stone-700 font-medium hover:text-red-700 transition-colors">
                  可以用這個名字當作正式的日本名字嗎？
                </summary>
                <p className="mt-2 text-stone-600 pl-4 border-l-2 border-red-200">
                  這個產生器主要是娛樂用途，產生的諧音梗名字可能不適合正式場合。如果需要正式的日本名字，建議諮詢專業的翻譯或命名服務。
                </p>
              </details>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              開始產生日本名字
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default Guide;
