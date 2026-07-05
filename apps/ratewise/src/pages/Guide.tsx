import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { AnswerCapsule } from '../components/AnswerCapsule';
import { ContentPageLayout } from '../components/content/ContentPageLayout';
import {
  ContentPageHeader,
  ContentSectionCard,
  ContentSections,
  type ContentSection,
} from '../components/content/ContentSections';
import { GUIDE_PAGE_SEO, SITE_SEO } from '../config/seo-metadata';
import { APP_INFO } from '../config/app-info';

const HOW_TO = GUIDE_PAGE_SEO.howTo;
const HOW_TO_STEPS = HOW_TO?.steps ?? [];

const LAST_UPDATED = new Date(SITE_SEO.updatedTime).toLocaleDateString('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Taipei',
});

const RATE_READING_TIPS = [
  {
    title: '先判斷你是買外幣還是賣外幣',
    description: '拿台幣買外幣時，通常要看銀行賣出價；把外幣換回台幣時，則看銀行買入價。',
  },
  {
    title: '現金與即期不是同一種匯率',
    description: '臨櫃換現鈔看現金匯率，外幣帳戶、網銀或匯款看即期匯率。現金匯率通常會比即期差。',
  },
  {
    title: '海外刷卡不等於台銀牌告',
    description:
      '海外刷卡會走 Visa、Mastercard 等卡組織清算匯率，再加發卡銀行海外手續費，與牌告匯率不同。',
  },
] as const;

// 內容驅動渲染：進階功能／判讀技巧／提示／FAQ 走共用 section renderer。
const FEATURE_SECTIONS: readonly ContentSection[] = [
  {
    kind: 'cards',
    title: '進階功能',
    cards: [
      {
        title: '多幣別換算',
        description: '一次比較同一基準貨幣對多個幣別的換算結果，適合旅遊預算與跨境報價比對。',
      },
      {
        title: '歷史匯率趨勢',
        description: '展開匯率卡片即可查看近 7~30 天走勢，快速理解最近的波動方向。',
      },
      {
        title: '收藏常用貨幣',
        description: '可在收藏頁面集中管理常用幣別，並透過拖曳手柄重新排序。',
      },
      {
        title: '離線使用',
        description: 'PWA 會保存最近一次資料快取，沒有網路時仍可用於估算。',
      },
      {
        title: '計算機功能',
        description: '點擊金額區即可開啟計算機鍵盤，支援加減乘除、百分比與快速修正輸入。',
      },
    ],
  },
  {
    kind: 'cards',
    title: '判讀匯率的小技巧',
    cards: RATE_READING_TIPS.map((tip) => ({ title: tip.title, description: tip.description })),
  },
  {
    kind: 'list',
    title: '💡 提示與技巧',
    items: [
      { description: '首頁下拉可重新整理匯率資料並同步最新牌告。' },
      { description: '快速金額按鈕適合旅遊與常見消費場景，可大幅減少重複輸入。' },
      { description: '若主要情境是海外刷卡，請額外留意發卡銀行手續費與 DCC。' },
    ],
  },
  {
    kind: 'faq',
    title: '❓ 常見問題',
    items: [
      {
        question: '匯率多久更新一次？',
        answer: '匯率資料每 5 分鐘自動同步臺灣銀行牌告匯率，也可在首頁下拉手動更新。',
      },
      {
        question: '現金匯率和即期匯率有什麼差別？',
        answer: '現金匯率適用於臨櫃換鈔，即期匯率適用於帳戶轉換與匯款。一般來說，即期匯率較佳。',
      },
      {
        question: '離線時可以使用嗎？',
        answer: `可以。${APP_INFO.shortName} 會快取最近一次更新的資料，離線時仍可進行換算。`,
      },
    ],
  },
];

const Guide = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEOHelmet
        title={GUIDE_PAGE_SEO.title}
        description={GUIDE_PAGE_SEO.description}
        pathname={GUIDE_PAGE_SEO.pathname}
        breadcrumb={GUIDE_PAGE_SEO.breadcrumb}
        howTo={HOW_TO}
        jsonLd={GUIDE_PAGE_SEO.jsonLd}
        ogType="article"
      />

      <ContentPageLayout
        width="wide"
        breadcrumbItems={[
          { label: t('nav.home'), href: '/' },
          { label: t('settings.usageGuide'), href: '/guide/' },
        ]}
      >
        <ContentPageHeader
          title={`如何使用 ${APP_INFO.shortName} 進行匯率換算`}
          lead={`完整 8 步驟教學，快速學會使用 ${APP_INFO.shortName} 進行單幣別和多幣別匯率換算。`}
          meta={
            <>
              預估完成時間：約 2 分鐘 ・ 作者：<span itemProp="author">{APP_INFO.author}</span> ・
              最後更新：
              <time dateTime={new Date(SITE_SEO.updatedTime).toISOString()} itemProp="dateModified">
                {LAST_UPDATED}
              </time>
            </>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-16 lg:self-start">
            <ContentSectionCard title="快速導航">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {HOW_TO_STEPS.map((step) => (
                  <a
                    key={step.position}
                    href={`#step-${step.position}`}
                    className="inline-flex min-h-11 items-center text-sm text-primary transition-colors hover:underline"
                  >
                    {step.position}. {step.name}
                  </a>
                ))}
              </div>
            </ContentSectionCard>
          </aside>

          <div className="space-y-6">
            <AnswerCapsule items={GUIDE_PAGE_SEO.answerCapsule ?? []} />

            {/* 8 步驟教學：頁面專屬結構（號碼徽章＋錨點） */}
            {HOW_TO_STEPS.map((step) => (
              <section
                key={step.position}
                id={`step-${step.position}`}
                className="scroll-mt-[calc(5rem+env(safe-area-inset-top,0px))] rounded-card border border-border/60 bg-surface p-5 shadow-card"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-strong text-lg font-bold text-white">
                    {step.position}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="mb-2 text-xl font-bold leading-tight text-text">{step.name}</h2>
                    <p className="text-base leading-relaxed text-text-muted">{step.text}</p>
                  </div>
                </div>
              </section>
            ))}

            <ContentSections sections={FEATURE_SECTIONS} />

            <div className="text-center">
              <Link
                to="/faq/"
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
              >
                查看更多常見問題 →
              </Link>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-control bg-primary-strong px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                開始使用 {APP_INFO.shortName}
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
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
        </div>
      </ContentPageLayout>
    </>
  );
};

export default Guide;
