import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { Breadcrumb } from '../components/Breadcrumb';
import { APP_INFO } from '../config/app-info';
import { FAQ_PAGE_SEO, SITE_SEO } from '../config/seo-metadata';

const FAQ_ENTRIES = FAQ_PAGE_SEO.faq ?? [];
const LAST_UPDATED = new Date(SITE_SEO.updatedTime).toLocaleDateString('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export default function FAQ() {
  return (
    <>
      <SEOHelmet
        title={FAQ_PAGE_SEO.title}
        description={FAQ_PAGE_SEO.description}
        pathname={FAQ_PAGE_SEO.pathname}
        breadcrumb={FAQ_PAGE_SEO.breadcrumb}
        faq={FAQ_ENTRIES}
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
                { label: '常見問題', href: '/faq/' },
              ]}
            />

            <h1 className="mb-2 text-4xl font-bold text-text">常見問題</h1>
            <p className="text-text-muted">
              集中整理台銀牌告匯率、買入賣出、現金與即期、刷卡匯率與 DCC 等核心問題。
            </p>
            <p className="mt-2 text-sm text-text-muted">
              作者：{APP_INFO.author} ・ 最後更新：{LAST_UPDATED}
            </p>
          </div>

          <section className="card mb-6 p-6">
            <h2 className="mb-3 text-2xl font-bold text-text">先掌握三個重點</h2>
            <ul className="space-y-3 text-text-muted">
              <li>
                <strong className="text-text">看賣出價，不看中間價：</strong>
                你拿台幣買外幣時，要看的通常是銀行賣出價，而不是中間價。
              </li>
              <li>
                <strong className="text-text">現金與即期是不同場景：</strong>
                臨櫃換鈔看現金匯率，外幣帳戶轉換或匯款看即期匯率。
              </li>
              <li>
                <strong className="text-text">刷卡匯率不是台銀牌告：</strong>
                海外刷卡會走卡組織清算匯率，另加發卡銀行海外手續費。
              </li>
            </ul>
          </section>

          <div className="space-y-4">
            {FAQ_ENTRIES.map((entry) => (
              <details
                key={entry.question}
                className="group card p-0 hover:shadow-md transition-shadow"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between p-6 transition-colors hover:text-primary">
                  <h2 className="text-lg font-semibold text-text group-hover:text-primary">
                    {entry.question}
                  </h2>
                  <svg
                    className="ml-4 h-5 w-5 flex-shrink-0 text-text-muted transition-transform group-open:rotate-180"
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
                <div className="border-t border-border px-6 pb-6 pt-4 leading-relaxed text-text-muted">
                  {entry.answer}
                </div>
              </details>
            ))}
          </div>

          <section className="card mt-10 bg-primary/5 p-6 border-primary/20">
            <h2 className="mb-2 text-xl font-semibold text-text">還需要更多幫助？</h2>
            <p className="text-text-muted">
              可先查看
              <Link to="/guide/" className="mx-1 text-primary underline">
                使用指南
              </Link>
              與
              <Link to="/about/" className="mx-1 text-primary underline">
                關於頁面
              </Link>
              ，若仍有問題可直接寄信至
              <a href={`mailto:${APP_INFO.email}`} className="ml-1 text-primary underline">
                {APP_INFO.email}
              </a>
              。
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
