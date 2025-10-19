/**
 * About Page
 * E-E-A-T building page with organization info and data sources
 */
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';

export default function About() {
  return (
    <>
      <SEOHelmet
        title="關於我們"
        description="RateWise 是一個專為台灣用戶設計的即時匯率工具，提供準確、快速且支援離線使用的匯率換算服務。了解我們的資料來源、技術優勢與聯繫方式。"
        pathname="/about"
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
            <h1 className="text-4xl font-bold text-slate-800 mb-2">關於 RateWise</h1>
            <p className="text-slate-600">台灣最快的即時匯率換算工具</p>
          </div>

          {/* Mission */}
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">我們的使命</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>RateWise 致力於為台灣用戶提供最快速、準確且易用的匯率換算服務。</strong>
              我們相信匯率查詢應該是簡單、即時且可靠的，因此我們打造了這個完全免費、無廣告的 PWA
              應用程式。
            </p>
            <p className="text-slate-600 leading-relaxed">
              無論您是出國旅遊、海外購物、國際匯款，或是進行外匯投資，RateWise
              都能為您提供準確的匯率參考， 幫助您做出更明智的決策。
            </p>
          </section>

          {/* Data Source */}
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">資料來源</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">臺灣銀行牌告匯率</h3>
                <p className="text-slate-600 leading-relaxed">
                  <strong>我們的匯率數據來源為臺灣銀行官方牌告匯率</strong>，
                  這是台灣最權威的匯率參考指標之一。臺灣銀行作為台灣最大的公營銀行，
                  其牌告匯率被廣泛用作市場參考標準。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">更新頻率</h3>
                <p className="text-slate-600 leading-relaxed">
                  <strong>匯率數據每 5 分鐘自動更新一次</strong>，確保您隨時獲得最新的匯率資訊。
                  我們的系統會持續監控臺灣銀行的匯率變動，並即時同步到應用程式中。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">重要聲明</h3>
                <p className="text-slate-600 leading-relaxed">
                  RateWise
                  提供的匯率數據僅供參考用途。實際交易匯率可能因銀行、兌換商或交易時間而有所差異。
                  進行實際交易前，請務必以金融機構提供的即時匯率為準。
                </p>
              </div>
            </div>
          </section>

          {/* Technical Advantages */}
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">技術優勢</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                <h3 className="text-lg font-semibold text-violet-600 mb-2">⚡ 極致效能</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  <strong>Lighthouse Performance 97/100</strong>， LCP 僅 489ms，CLS
                  0.00046，遠優於業界標準。 使用 React + Vite 打造，提供流暢的使用體驗。
                </p>
              </div>
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                <h3 className="text-lg font-semibold text-violet-600 mb-2">📱 PWA 技術</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  <strong>支援離線使用，可安裝至桌面</strong>。 採用 Progressive Web App
                  技術，即使沒有網路連線， 也能使用最近更新的匯率資料進行換算。
                </p>
              </div>
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                <h3 className="text-lg font-semibold text-violet-600 mb-2">🎨 響應式設計</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  <strong>完美支援桌面與行動裝置</strong>。
                  無論您使用手機、平板或電腦，都能獲得最佳的使用體驗。
                </p>
              </div>
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                <h3 className="text-lg font-semibold text-violet-600 mb-2">🔒 隱私保護</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  <strong>完全免費、無廣告、不追蹤</strong>。
                  我們不收集個人資訊，所有數據僅存儲在您的裝置上。
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">核心功能</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-violet-600 mr-3 mt-1">✓</span>
                <div>
                  <strong className="text-slate-800">即時匯率換算</strong>
                  <p className="text-slate-600 text-sm">
                    支援 30+ 種主要貨幣，包括美元、日圓、歐元、英鎊、港幣、人民幣等
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-3 mt-1">✓</span>
                <div>
                  <strong className="text-slate-800">歷史匯率趨勢</strong>
                  <p className="text-slate-600 text-sm">
                    查看過去一段時間的匯率變化，幫助您了解匯率走勢
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-3 mt-1">✓</span>
                <div>
                  <strong className="text-slate-800">多幣別換算</strong>
                  <p className="text-slate-600 text-sm">
                    同時查看一個基準貨幣對多種目標貨幣的換算結果
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-violet-600 mr-3 mt-1">✓</span>
                <div>
                  <strong className="text-slate-800">離線可用</strong>
                  <p className="text-slate-600 text-sm">無網路環境下也能使用最近更新的匯率資料</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Technology Stack */}
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">技術架構</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-slate-600 font-semibold w-32">前端框架</span>
                <span className="text-slate-700">React 19 + TypeScript</span>
              </div>
              <div className="flex items-center">
                <span className="text-slate-600 font-semibold w-32">建置工具</span>
                <span className="text-slate-700">Vite 6</span>
              </div>
              <div className="flex items-center">
                <span className="text-slate-600 font-semibold w-32">PWA</span>
                <span className="text-slate-700">vite-plugin-pwa</span>
              </div>
              <div className="flex items-center">
                <span className="text-slate-600 font-semibold w-32">樣式</span>
                <span className="text-slate-700">Tailwind CSS 4</span>
              </div>
              <div className="flex items-center">
                <span className="text-slate-600 font-semibold w-32">圖表</span>
                <span className="text-slate-700">Recharts</span>
              </div>
              <div className="flex items-center">
                <span className="text-slate-600 font-semibold w-32">SEO</span>
                <span className="text-slate-700">react-helmet-async (Lighthouse SEO 100/100)</span>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">聯繫我們</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">一般支援</h3>
                <p className="text-slate-600">
                  如有任何問題或建議，歡迎透過{' '}
                  <a
                    href="mailto:haotool.org@gmail.com"
                    className="text-violet-600 hover:text-violet-700 underline"
                  >
                    haotool.org@gmail.com
                  </a>{' '}
                  與我們聯繫。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">安全問題</h3>
                <p className="text-slate-600">
                  若發現安全漏洞，請透過{' '}
                  <a
                    href="mailto:haotool.org@gmail.com"
                    className="text-violet-600 hover:text-violet-700 underline"
                  >
                    haotool.org@gmail.com
                  </a>{' '}
                  回報，我們會在 48 小時內回應。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-violet-600 mb-2">開放原始碼</h3>
                <p className="text-slate-600">
                  RateWise 是開放原始碼專案，歡迎在{' '}
                  <a
                    href="https://github.com/cnych/ratewise"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:text-violet-700 underline"
                  >
                    GitHub
                  </a>{' '}
                  上查看程式碼或貢獻改善建議。
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center text-slate-500 text-sm">
            <p>© 2025 RateWise. 保留所有權利。</p>
            <p className="mt-2">最後更新：2025-10-19 | 版本：v1.0</p>
          </div>
        </div>
      </main>
    </>
  );
}
