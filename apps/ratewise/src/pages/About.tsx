import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { Breadcrumb } from '../components/Breadcrumb';
import { getDisplayVersion } from '../config/version';
import { APP_INFO, getCopyrightYears } from '../config/app-info';
import { ABOUT_PAGE_SEO, SITE_SEO } from '../config/seo-metadata';
import { SUPPORTED_CURRENCY_COUNT } from '../features/ratewise/constants';

const LAST_UPDATED = new Date(SITE_SEO.updatedTime).toLocaleDateString('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Taipei',
});

export default function About() {
  return (
    <>
      <SEOHelmet
        title={ABOUT_PAGE_SEO.title}
        description={ABOUT_PAGE_SEO.description}
        pathname={ABOUT_PAGE_SEO.pathname}
        breadcrumb={ABOUT_PAGE_SEO.breadcrumb}
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
                { label: '關於我們', href: '/about/' },
              ]}
            />

            <h1 className="mb-2 text-3xl font-bold text-text">關於 RateWise 匯率好工具</h1>
            <p className="text-text-muted">
              專注提供台灣用戶更接近實際換匯情境的匯率資訊，而不是只顯示中間價。
            </p>
            <p className="mt-2 text-sm text-text-muted">
              作者：{APP_INFO.author} ・ 版本：{getDisplayVersion()} ・ 最後更新：{LAST_UPDATED}
            </p>
          </div>

          <section className="card mb-6 p-6">
            <h2 className="mb-4 text-2xl font-bold text-text">我們的定位</h2>
            <p className="mb-4 leading-relaxed text-text-muted">
              RateWise
              的重點不是展示漂亮的中間價，而是協助你在換匯前快速判讀「實際比較接近會發生的金額」。
              當你拿台幣去買外幣時，真正影響成本的通常是銀行賣出價；當你把外幣換回台幣時，則要看銀行買入價。
            </p>
            <p className="leading-relaxed text-text-muted">
              這也是我們把「買入 / 賣出」與「現金 /
              即期」區分清楚的原因。目標不是取代銀行成交畫面，而是提供更符合台灣使用情境的牌告判讀工具。
            </p>
          </section>

          <section className="card mb-6 p-6">
            <h2 className="mb-4 text-2xl font-bold text-text">資料方法與範圍</h2>
            <div className="space-y-4 text-text-muted">
              <p>
                <strong className="text-text">資料來源：</strong>
                臺灣銀行官方牌告匯率，涵蓋現金買入、現金賣出、即期買入、即期賣出四種報價。
              </p>
              <p>
                <strong className="text-text">更新頻率：</strong>每 5
                分鐘同步一次，畫面會顯示最近更新時間。
              </p>
              <p>
                <strong className="text-text">支援範圍：</strong>
                目前支援 {SUPPORTED_CURRENCY_COUNT} 種貨幣，包含 TWD
                與主要旅遊、留學、跨境付款常用幣別。
              </p>
              <p>
                <strong className="text-text">使用提醒：</strong>
                牌告匯率僅供參考，實際成交仍會受銀行、手續費、刷卡清算規則與交易時間影響。
              </p>
            </div>
          </section>

          <section className="card mb-6 p-6">
            <h2 className="mb-4 text-2xl font-bold text-text">技術與資料面能力</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="mb-2 text-lg font-semibold text-primary">精準換算</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  單幣別換算、快速金額按鈕、計算機鍵盤、現金與即期切換、7~30 天趨勢圖。
                </p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="mb-2 text-lg font-semibold text-primary">日常管理</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  多幣別比較、收藏管理、拖曳排序、換算歷史、主題風格與三語介面設定。
                </p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="mb-2 text-lg font-semibold text-primary">可驗證資料面</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  提供 `latest.json`、`openapi.json`、`llms.txt` 與 `llms-full.txt`，方便開發者與 AI
                  agent 使用。
                </p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="mb-2 text-lg font-semibold text-primary">PWA 能力</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  可加入主畫面、支援離線讀取最近快取資料，重新連線後再同步最新匯率。
                </p>
              </div>
            </div>
          </section>

          <section className="card mb-6 p-6">
            <h2 className="mb-4 text-2xl font-bold text-text">透明與聯絡方式</h2>
            <div className="space-y-3 text-text-muted">
              <p>
                <strong className="text-text">原始碼：</strong>
                <a
                  href={APP_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-primary underline"
                >
                  {APP_INFO.github}
                </a>
              </p>
              <p>
                <strong className="text-text">聯絡信箱：</strong>
                <a href={`mailto:${APP_INFO.email}`} className="ml-1 text-primary underline">
                  {APP_INFO.email}
                </a>
              </p>
              <p>
                <strong className="text-text">延伸閱讀：</strong>
                <Link to="/faq/" className="ml-1 text-primary underline">
                  常見問題
                </Link>
                <span className="mx-1">·</span>
                <Link to="/guide/" className="text-primary underline">
                  使用指南
                </Link>
              </p>
            </div>
          </section>

          <div className="text-center text-sm text-text-muted">
            <p>
              © {getCopyrightYears()} {APP_INFO.name}．採用 {APP_INFO.license} 授權
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
