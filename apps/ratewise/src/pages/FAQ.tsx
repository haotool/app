import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { APP_INFO } from '../config/app-info';
import { MailtoLink } from '../components/MailtoLink';
import { AnswerCapsule } from '../components/AnswerCapsule';
import { ContentPageLayout } from '../components/content/ContentPageLayout';
import {
  ContentPageHeader,
  ContentSections,
  type ContentSection,
} from '../components/content/ContentSections';
import { FAQ_PAGE_SEO, SITE_SEO } from '../config/seo-metadata';

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
const LAST_UPDATED = new Date(SITE_SEO.updatedTime).toLocaleDateString('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Taipei',
});

// 內容驅動渲染：文案沿用現況來源，只重排呈現。
const SECTIONS: readonly ContentSection[] = [
  {
    kind: 'list',
    title: '先掌握三個重點',
    items: [
      {
        term: '看賣出價，不看中間價：',
        description: '你拿台幣買外幣時，要看的通常是銀行賣出價，而不是中間價。',
      },
      {
        term: '現金與即期是不同場景：',
        description: '臨櫃換鈔看現金匯率，外幣帳戶轉換或匯款看即期匯率。',
      },
      {
        term: '刷卡匯率不是台銀牌告：',
        description: '海外刷卡會走卡組織清算匯率，另加發卡銀行海外手續費。',
      },
    ],
  },
  {
    kind: 'faq',
    items: FAQ_ENTRIES.map((entry) => ({
      question: entry.question,
      answer: renderFaqAnswer(entry.answer),
    })),
  },
  {
    kind: 'text',
    title: '還需要更多幫助？',
    paragraphs: [
      <React.Fragment key="help">
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
      </React.Fragment>,
    ],
  },
];

export default function FAQ() {
  const { t } = useTranslation();
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

      <ContentPageLayout
        breadcrumbItems={[
          { label: t('nav.home'), href: '/' },
          { label: t('settings.faq'), href: '/faq/' },
        ]}
      >
        <ContentPageHeader
          title="常見問題"
          lead="集中整理台銀牌告匯率、買入賣出、現金與即期、刷卡匯率與 DCC 等核心問題。"
          meta={
            <>
              作者：<span itemProp="author">{APP_INFO.author}</span> ・ 最後更新：
              <time dateTime={new Date(SITE_SEO.updatedTime).toISOString()} itemProp="dateModified">
                {LAST_UPDATED}
              </time>
            </>
          }
        />

        {/* AEO/GEO 快速答案：AI 引擎直接引用的核心問答，放在 FAQ 頂部提升引用率。 */}
        <AnswerCapsule items={FAQ_PAGE_SEO.answerCapsule ?? []} />

        <ContentSections sections={SECTIONS} />
      </ContentPageLayout>
    </>
  );
}
