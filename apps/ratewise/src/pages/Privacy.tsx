/**
 * Privacy Policy Page - 隱私政策頁面
 */
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { Breadcrumb } from '../components/Breadcrumb';
import { getCopyrightYears } from '../config/app-info';

export default function Privacy() {
  return (
    <>
      <SEOHelmet
        title="隱私政策 - RateWise 個人資料保護說明"
        description="RateWise 匯率好工具隱私政策。我們不收集個人資料、不使用追蹤 Cookie、所有資料僅存儲於您的裝置本地。完全免費、無廣告、完全透明的隱私保護說明。資料 100% 存在您的裝置，絕不上傳伺服器，符合個資保護原則，請安心使用我們的服務。"
        pathname="/privacy"
        breadcrumb={[
          { name: 'RateWise 首頁', item: '/' },
          { name: '隱私政策', item: '/privacy/' },
        ]}
      />
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <Breadcrumb
              items={[
                { label: '首頁', href: '/' },
                { label: '隱私政策', href: '/privacy/' },
              ]}
            />
            <h1 className="text-3xl font-bold text-text mb-2">隱私政策</h1>
            <p className="text-text-muted">最後更新：2026 年 2 月 11 日</p>
          </div>

          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">概述</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              RateWise
              匯率好工具（以下簡稱「本服務」）非常重視您的隱私。本隱私政策說明我們如何處理您在使用本服務時的相關資訊。
            </p>
            <p className="text-text-muted leading-relaxed">
              <strong className="text-text">
                核心原則：我們不收集、不儲存、不出售您的個人資料。
              </strong>
              所有應用程式資料（如收藏貨幣、介面設定、換算歷史）均儲存在您自己的裝置本地，不會上傳至任何伺服器。
            </p>
          </section>

          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">我們收集的資訊</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">❌ 我們不收集</h3>
                <ul className="text-text-muted space-y-1 list-disc list-inside">
                  <li>個人身份資訊（姓名、電子郵件、電話）</li>
                  <li>位置資訊</li>
                  <li>使用行為追蹤資料</li>
                  <li>第三方廣告 Cookie</li>
                  <li>跨站追蹤識別碼</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ✅ 本地儲存資料（僅在您的裝置）
                </h3>
                <ul className="text-text-muted space-y-1 list-disc list-inside">
                  <li>收藏貨幣清單（localStorage）</li>
                  <li>介面風格偏好（localStorage）</li>
                  <li>語言設定（localStorage）</li>
                  <li>匯率快取資料（有效期 5 分鐘，可清除）</li>
                  <li>換算歷史記錄（localStorage）</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">第三方服務</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">臺灣銀行匯率 API</h3>
                <p className="text-text-muted leading-relaxed">
                  本服務透過 GitHub raw.githubusercontent.com
                  獲取臺灣銀行牌告匯率數據。此請求僅包含技術性的 HTTP 請求標頭，不包含個人資訊。
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Cloudflare</h3>
                <p className="text-text-muted leading-relaxed">
                  本服務使用 Cloudflare 提供 CDN 加速與 DDoS 防護。Cloudflare
                  可能會記錄匿名的存取日誌，詳見{' '}
                  <a
                    href="https://www.cloudflare.com/privacypolicy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Cloudflare 隱私政策
                  </a>
                  。
                </p>
              </div>
            </div>
          </section>

          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">Cookie 使用</h2>
            <p className="text-text-muted leading-relaxed">
              本服務<strong className="text-text">不使用任何追蹤 Cookie 或廣告 Cookie</strong>。
              我們僅使用瀏覽器的 localStorage
              儲存您的應用程式偏好設定，這些資料完全在您的裝置本地，不會傳輸至任何伺服器。
            </p>
          </section>

          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">您的權利</h2>
            <ul className="text-text-muted space-y-3 list-none">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>
                  <strong className="text-text">清除資料</strong>
                  ：您可在「設定」頁面清除所有本地快取資料，或透過瀏覽器設定清除所有本地儲存資料。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>
                  <strong className="text-text">資料可攜性</strong>
                  ：您的所有資料都存儲在裝置本地，您可隨時透過瀏覽器開發者工具查看或匯出。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>
                  <strong className="text-text">聯繫我們</strong>：如有任何隱私相關問題，請透過{' '}
                  <Link to="/about/" className="text-primary underline">
                    關於頁面
                  </Link>{' '}
                  聯繫我們。
                </span>
              </li>
            </ul>
          </section>

          <section className="card p-6 mb-6">
            <h2 className="text-2xl font-bold text-text mb-4">政策更新</h2>
            <p className="text-text-muted leading-relaxed">
              我們可能不定期更新本隱私政策。重大變更時，我們會在應用程式中提供通知。繼續使用本服務即表示您同意更新後的隱私政策。
            </p>
          </section>

          <div className="text-center text-text-muted text-sm">
            <p>© {getCopyrightYears()} RateWise 匯率好工具</p>
          </div>
        </div>
      </div>
    </>
  );
}
