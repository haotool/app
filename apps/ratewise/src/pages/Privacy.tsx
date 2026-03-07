import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { Breadcrumb } from '../components/Breadcrumb';
import { APP_INFO, getCopyrightYears } from '../config/app-info';
import { PRIVACY_PAGE_SEO, SITE_SEO } from '../config/seo-metadata';

const LAST_UPDATED = new Date(SITE_SEO.updatedTime).toLocaleDateString('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Taipei',
});

export default function Privacy() {
  return (
    <>
      <SEOHelmet
        title={PRIVACY_PAGE_SEO.title}
        description={PRIVACY_PAGE_SEO.description}
        pathname={PRIVACY_PAGE_SEO.pathname}
        breadcrumb={PRIVACY_PAGE_SEO.breadcrumb}
        robots={PRIVACY_PAGE_SEO.robots}
      />

      <div className="min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8">
            <Link
              to="/"
              className="mb-4 inline-flex items-center text-primary transition-colors hover:text-primary-hover"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <h1 className="mb-2 text-3xl font-bold text-text">隱私政策</h1>
            <p className="text-text-muted">最後更新：{LAST_UPDATED}</p>
          </div>

          <section className="card mb-6 p-6">
            <h2 className="mb-4 text-2xl font-bold text-text">概述</h2>
            <p className="mb-4 leading-relaxed text-text-muted">
              RateWise 重視資料最小化原則。本服務不要求註冊帳號，也不建立可識別個人的會員資料。
            </p>
            <p className="leading-relaxed text-text-muted">
              收藏貨幣、介面設定與換算歷史會保存在您的裝置本地；站點營運另使用第三方分析與安全服務處理匿名流量與防護資訊。
            </p>
          </section>

          <section className="card mb-6 p-6">
            <h2 className="mb-4 text-2xl font-bold text-text">本地儲存資料</h2>
            <ul className="list-inside list-disc space-y-2 text-text-muted">
              <li>收藏貨幣清單</li>
              <li>介面風格與語言設定</li>
              <li>換算歷史記錄</li>
              <li>最近一次匯率快取資料</li>
            </ul>
            <p className="mt-4 text-text-muted">
              以上資料主要透過瀏覽器的 `localStorage` 與快取機制儲存，不會由 RateWise
              自建伺服器集中保存。
            </p>
          </section>

          <section className="card mb-6 p-6">
            <h2 className="mb-4 text-2xl font-bold text-text">第三方服務</h2>
            <div className="space-y-4 text-text-muted">
              <p>
                <strong className="text-text">臺灣銀行牌告匯率：</strong>
                本服務會讀取公開匯率資料，用於顯示現金與即期報價。
              </p>
              <p>
                <strong className="text-text">Google Analytics：</strong>
                用於匿名流量分析與功能使用統計，協助了解頁面瀏覽與產品改善方向。Google
                可能依其服務機制設定分析所需 Cookie 或識別資訊。
              </p>
              <p>
                <strong className="text-text">Cloudflare：</strong>
                用於 CDN 加速、安全防護與基礎營運記錄。Cloudflare
                可能記錄匿名技術資訊以支援流量管理與防護。
              </p>
            </div>
          </section>

          <section className="card mb-6 p-6">
            <h2 className="mb-4 text-2xl font-bold text-text">你可以怎麼管理資料</h2>
            <ul className="space-y-3 text-text-muted">
              <li>
                你可以在
                <Link to="/settings/" className="mx-1 text-primary underline">
                  設定頁
                </Link>
                重設部分本地偏好與快取資料。
              </li>
              <li>你也可以透過瀏覽器設定清除站點資料、Cookie 與本地儲存內容。</li>
              <li>
                若對隱私有疑問，可來信
                <a href={`mailto:${APP_INFO.email}`} className="ml-1 text-primary underline">
                  {APP_INFO.email}
                </a>
                。
              </li>
            </ul>
          </section>

          <div className="text-center text-sm text-text-muted">
            <p>© {getCopyrightYears()} RateWise 匯率好工具</p>
          </div>
        </div>
      </div>
    </>
  );
}
