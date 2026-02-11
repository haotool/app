/**
 * About Page - 關於我們頁面
 * 提供 E-E-A-T 信號、組織資訊與資料來源說明
 */
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { Breadcrumb } from '../components/Breadcrumb';
import { getDisplayVersion } from '../config/version';
import { APP_INFO, getCopyrightYears } from '../config/app-info';

export default function About() {
  return (
    <>
      <SEOHelmet
        title="關於 RateWise 匯率好工具 - 資料來源與技術特色"
        description="RateWise 是專為台灣用戶設計的即時匯率 PWA 工具，100% 基於臺灣銀行官方牌告匯率，支援 30+ 種貨幣換算，離線可用。了解我們的資料來源、Lighthouse Performance 97+ 的技術優勢與聯繫方式。完全免費、無廣告。"
        pathname="/about"
        breadcrumb={[
          { name: 'RateWise 首頁', item: '/' },
          { name: '關於我們', item: '/about/' },
        ]}
      />
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-primary hover:text-primary-hover mb-4 transition-colors"
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
                { label: '關於我們', href: '/about/' },
              ]}
            />

            <h1 className="text-3xl font-bold text-text mb-2">關於 RateWise 匯率好工具</h1>
            <p className="text-text-muted">台灣最快的即時匯率換算工具</p>
          </div>

          {/* Mission */}
          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">我們的使命</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              <strong className="text-text">
                RateWise 致力於為台灣用戶提供最快速、準確且易用的匯率換算服務。
              </strong>
              我們相信匯率查詢應該是簡單、即時且可靠的，因此我們打造了這個完全免費、無廣告的 PWA
              應用程式。
            </p>
            <p className="text-text-muted leading-relaxed">
              無論您是出國旅遊、海外購物、國際匯款，或是進行外匯投資，RateWise
              都能為您提供準確的匯率參考， 幫助您做出更明智的決策。
            </p>
          </section>

          {/* Data Source */}
          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">資料來源</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">臺灣銀行牌告匯率</h3>
                <p className="text-text-muted leading-relaxed">
                  <strong className="text-text">我們的匯率數據來源為臺灣銀行官方牌告匯率</strong>，
                  這是台灣最權威的匯率參考指標之一。臺灣銀行作為台灣最大的公營銀行，
                  其牌告匯率被廣泛用作市場參考標準。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">更新頻率</h3>
                <p className="text-text-muted leading-relaxed">
                  <strong className="text-text">匯率數據每 5 分鐘自動更新一次</strong>
                  ，確保您隨時獲得最新的匯率資訊。
                  我們的系統會持續監控臺灣銀行的匯率變動，並即時同步到應用程式中。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">重要聲明</h3>
                <p className="text-text-muted leading-relaxed">
                  RateWise
                  提供的匯率數據僅供參考用途。實際交易匯率可能因銀行、兌換商或交易時間而有所差異。
                  進行實際交易前，請務必以金融機構提供的即時匯率為準。
                </p>
              </div>
            </div>
          </section>

          {/* Technical Advantages */}
          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">技術優勢</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="text-lg font-semibold text-primary mb-2">⚡ 極致效能</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  <strong className="text-text">Lighthouse Performance 97+/100</strong>， LCP 低於
                  500ms，CLS 趨近於 0，遠優於業界標準。 使用 React 19 + Vite 7
                  打造，提供流暢的使用體驗。
                </p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="text-lg font-semibold text-primary mb-2">📱 PWA 技術</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  <strong className="text-text">支援離線使用，可安裝至桌面</strong>。 採用
                  Progressive Web App 技術，即使沒有網路連線， 也能使用最近更新的匯率資料進行換算。
                </p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="text-lg font-semibold text-primary mb-2">🎨 響應式設計</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  <strong className="text-text">完美支援桌面與行動裝置</strong>。
                  無論您使用手機、平板或電腦，都能獲得最佳的使用體驗。
                </p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="text-lg font-semibold text-primary mb-2">🔒 隱私保護</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  <strong className="text-text">完全免費、無廣告、不追蹤</strong>。
                  我們不收集個人資訊，所有數據僅存儲在您的裝置上。
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">核心功能</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">✓</span>
                <div>
                  <strong className="text-text">單幣別換算</strong>
                  <p className="text-text-muted text-sm">
                    雙向即時換算，支援快速金額選擇、貨幣交換、歷史趨勢圖
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">✓</span>
                <div>
                  <strong className="text-text">多幣別換算</strong>
                  <p className="text-text-muted text-sm">
                    一個基準貨幣同時對 30+ 種目標貨幣換算，一次查看所有結果
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">✓</span>
                <div>
                  <strong className="text-text">收藏與歷史</strong>
                  <p className="text-text-muted text-sm">
                    收藏常用貨幣、查看轉換歷史、追蹤匯率趨勢
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">✓</span>
                <div>
                  <strong className="text-text">匯率類型切換</strong>
                  <p className="text-text-muted text-sm">
                    支援現金匯率與即期匯率，滿足不同換匯需求
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">✓</span>
                <div>
                  <strong className="text-text">下拉刷新</strong>
                  <p className="text-text-muted text-sm">
                    手勢下拉即可刷新匯率，清除快取並更新到最新數據
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3 mt-1">✓</span>
                <div>
                  <strong className="text-text">離線可用</strong>
                  <p className="text-text-muted text-sm">
                    PWA 技術，無網路環境下也能使用最近更新的匯率資料
                  </p>
                </div>
              </li>
            </ul>
          </section>

          {/* Technology Stack */}
          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">技術架構</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-text-muted font-semibold w-32">前端框架</span>
                <span className="text-text">React 19 + TypeScript 5</span>
              </div>
              <div className="flex items-center">
                <span className="text-text-muted font-semibold w-32">建置工具</span>
                <span className="text-text">Vite 7 + vite-react-ssg (SSG)</span>
              </div>
              <div className="flex items-center">
                <span className="text-text-muted font-semibold w-32">PWA</span>
                <span className="text-text">vite-plugin-pwa + Workbox</span>
              </div>
              <div className="flex items-center">
                <span className="text-text-muted font-semibold w-32">樣式</span>
                <span className="text-text">Tailwind CSS 4 + SSOT Design Tokens</span>
              </div>
              <div className="flex items-center">
                <span className="text-text-muted font-semibold w-32">圖表</span>
                <span className="text-text">lightweight-charts (TradingView)</span>
              </div>
              <div className="flex items-center">
                <span className="text-text-muted font-semibold w-32">國際化</span>
                <span className="text-text">react-i18next (繁中/英/日)</span>
              </div>
              <div className="flex items-center">
                <span className="text-text-muted font-semibold w-32">SEO</span>
                <span className="text-text">SSG + JSON-LD Schema (Lighthouse SEO 100/100)</span>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">聯繫我們</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">一般支援</h3>
                <p className="text-text-muted">
                  如有任何問題或建議，歡迎透過{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `mailto:${APP_INFO.email}`;
                    }}
                    className="text-primary hover:text-primary/80 underline"
                  >
                    {APP_INFO.email}
                  </a>{' '}
                  與我們聯繫。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">安全問題</h3>
                <p className="text-text-muted">
                  若發現安全漏洞，請透過{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `mailto:${APP_INFO.email}`;
                    }}
                    className="text-primary hover:text-primary/80 underline"
                  >
                    {APP_INFO.email}
                  </a>{' '}
                  回報，我們會在 48 小時內回應。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">開放原始碼</h3>
                <p className="text-text-muted">
                  {APP_INFO.name} 是開放原始碼專案，歡迎在{' '}
                  <a
                    href={APP_INFO.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline"
                  >
                    GitHub
                  </a>{' '}
                  上查看程式碼或貢獻改善建議。
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center text-text-muted text-sm">
            <p>
              © {getCopyrightYears()} {APP_INFO.name}. 採用 {APP_INFO.license} 授權。
            </p>
            <p className="mt-2">版本：{getDisplayVersion()}</p>
          </div>
        </div>
      </div>
    </>
  );
}
