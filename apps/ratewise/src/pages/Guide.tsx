import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { Breadcrumb } from '../components/Breadcrumb';
import { GUIDE_PAGE_SEO } from '../config/seo-metadata';

const HOW_TO = GUIDE_PAGE_SEO.howTo;
const HOW_TO_STEPS = HOW_TO?.steps ?? [];

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
];

const FAQ_ITEMS = [
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
    answer: '可以。RateWise 會快取最近一次更新的資料，離線時仍可進行換算。',
  },
];

const Guide = () => {
  return (
    <>
      <SEOHelmet
        title={GUIDE_PAGE_SEO.title}
        description={GUIDE_PAGE_SEO.description}
        canonical="https://app.haotool.org/ratewise/guide/"
        pathname={GUIDE_PAGE_SEO.pathname}
        breadcrumb={GUIDE_PAGE_SEO.breadcrumb}
        howTo={HOW_TO}
        jsonLd={GUIDE_PAGE_SEO.jsonLd}
      />

      <div className="min-h-screen bg-page-gradient">
        <div className="container mx-auto max-w-5xl px-4 py-8">
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
              { label: '使用指南', href: '/guide/' },
            ]}
          />

          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-text">如何使用 RateWise 進行匯率換算</h1>
            <p className="text-text-muted">
              完整 8 步驟教學，快速學會使用 RateWise 進行單幣別和多幣別匯率換算。
            </p>
            <div className="mt-2 flex items-center text-sm text-text-muted">
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="card p-4">
                <h2 className="mb-3 text-lg font-semibold text-text">快速導航</h2>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                  {HOW_TO_STEPS.map((step) => (
                    <a
                      key={step.position}
                      href={`#step-${step.position}`}
                      className="text-sm text-primary hover:text-primary/80 hover:underline"
                    >
                      {step.position}. {step.name}
                    </a>
                  ))}
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              {HOW_TO_STEPS.map((step) => (
                <div
                  key={step.position}
                  id={`step-${step.position}`}
                  className="card scroll-mt-4 p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start">
                    <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                      {step.position}
                    </div>
                    <div className="flex-1">
                      <h2 className="mb-2 text-2xl font-semibold text-text">{step.name}</h2>
                      <p className="leading-relaxed text-text-muted">{step.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="card p-6">
                <h2 className="mb-4 text-2xl font-bold text-text">進階功能</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-primary">多幣別換算</h3>
                    <p className="leading-relaxed text-text-muted">
                      一次比較同一基準貨幣對多個幣別的換算結果，適合旅遊預算與跨境報價比對。
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-primary">歷史匯率趨勢</h3>
                    <p className="leading-relaxed text-text-muted">
                      展開匯率卡片即可查看近 7~30 天走勢，快速理解最近的波動方向。
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-primary">收藏常用貨幣</h3>
                    <p className="leading-relaxed text-text-muted">
                      可在收藏頁面集中管理常用幣別，並透過拖曳手柄重新排序。
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-primary">離線使用</h3>
                    <p className="leading-relaxed text-text-muted">
                      PWA 會保存最近一次資料快取，沒有網路時仍可用於估算。
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-primary">計算機功能</h3>
                    <p className="leading-relaxed text-text-muted">
                      點擊金額區即可開啟計算機鍵盤，支援加減乘除、百分比與快速修正輸入。
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="mb-4 text-2xl font-bold text-text">判讀匯率的小技巧</h2>
                <div className="space-y-4">
                  {RATE_READING_TIPS.map((tip) => (
                    <div key={tip.title}>
                      <h3 className="mb-1 text-lg font-semibold text-primary">{tip.title}</h3>
                      <p className="leading-relaxed text-text-muted">{tip.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card border-primary/20 bg-primary/5 p-6">
                <h2 className="mb-2 text-xl font-semibold text-text">💡 提示與技巧</h2>
                <ul className="space-y-2 text-text-muted">
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>首頁下拉可重新整理匯率資料並同步最新牌告。</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>快速金額按鈕適合旅遊與常見消費場景，可大幅減少重複輸入。</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>若主要情境是海外刷卡，請額外留意發卡銀行手續費與 DCC。</span>
                  </li>
                </ul>
              </div>

              <div className="card p-6">
                <h2 className="mb-4 text-xl font-semibold text-text">❓ 常見問題</h2>
                <div className="space-y-4">
                  {FAQ_ITEMS.map((item) => (
                    <div key={item.question}>
                      <h3 className="font-medium text-text">{item.question}</h3>
                      <p className="mt-1 text-sm text-text-muted">{item.answer}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link
                    to="/faq/"
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    查看更多常見問題 →
                  </Link>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/"
                  className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-primary/90 hover:shadow-lg"
                >
                  開始使用 RateWise
                  <svg
                    className="ml-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
        </div>
      </div>
    </>
  );
};

export default Guide;
