import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { PageNavHeader } from '../components/PageNavHeader';
import { APP_INFO } from '../config/app-info';
import { MailtoLink } from '../components/MailtoLink';
import { AnswerCapsule } from '../components/AnswerCapsule';
import { FAQ_PAGE_SEO, SITE_SEO } from '../config/seo-metadata';
import { formatLocalizedDate } from '../utils/timeFormatter';

// 將 FAQ 答案中的 email 位址替換為 MailtoLink，防止 CF Email Obfuscation 將其改寫為爬蟲不可讀的 /cdn-cgi/... 連結。
const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
function renderFaqAnswer(answer: string): React.ReactNode {
  const parts = answer.split(EMAIL_RE);
  if (parts.length === 1) return answer;
  return (
    <>
      {parts.map((part, i) => (EMAIL_RE.test(part) ? <MailtoLink key={i} email={part} /> : part))}
    </>
  );
}

const FAQ_ENTRIES = FAQ_PAGE_SEO.faqContent ?? [];

export default function FAQ() {
  const { t, i18n } = useTranslation();
  const lastUpdated = formatLocalizedDate(
    SITE_SEO.updatedTime,
    i18n.resolvedLanguage ?? i18n.language,
  );

  return (
    <>
      <SEOHelmet
        title={FAQ_PAGE_SEO.title}
        description={FAQ_PAGE_SEO.description}
        pathname={FAQ_PAGE_SEO.pathname}
        breadcrumb={FAQ_PAGE_SEO.breadcrumb}
        jsonLd={FAQ_PAGE_SEO.jsonLd}
        ogType="article"
      />

      <div className="min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <PageNavHeader
            breadcrumbItems={[
              { label: t('nav.home'), href: '/' },
              { label: t('settings.faq'), href: '/faq/' },
            ]}
          />

          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-text">{t('supportPages.faq.title')}</h1>
            <p className="text-text-muted">{t('supportPages.faq.subtitle')}</p>
            <p className="mt-2 text-sm text-text-muted">
              {t('supportPages.common.author')}：<span itemProp="author">{APP_INFO.author}</span> ・{' '}
              {t('supportPages.common.lastUpdated')}：
              <time dateTime={new Date(SITE_SEO.updatedTime).toISOString()} itemProp="dateModified">
                {lastUpdated}
              </time>
            </p>
          </div>

          {/* AEO/GEO 快速答案：AI 引擎直接引用的核心問答，放在 FAQ 頂部提升引用率。 */}
          <AnswerCapsule items={FAQ_PAGE_SEO.answerCapsule ?? []} />

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
                  {renderFaqAnswer(entry.answer)}
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
              <MailtoLink email={APP_INFO.email} className="ml-1 text-primary underline" />。
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
