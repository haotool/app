import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { Breadcrumb } from '../components/Breadcrumb';

const FAQ_ENTRIES = [
  {
    question: '匯率數據來源與更新頻率？',
    answer:
      '資料 100% 參考臺灣銀行牌告匯率（現金/即期買入賣出價），每 5 分鐘自動同步一次，首頁會顯示最近更新時間。',
  },
  {
    question: '換算結果與實際交易是否相同？',
    answer:
      'RateWise 提供牌告參考匯率，實際交易匯率可能因銀行或線上換匯平台產生 0.5%~2% 價差，請以交易方公告為準。',
  },
  {
    question: '可以離線使用嗎？',
    answer:
      '可以。PWA 首次開啟會快取資源與最近匯率，離線時仍可用上次更新的數據進行換算，恢復上網後會自動刷新。',
  },
  {
    question: '如何同時查看多種貨幣？',
    answer:
      '切換到「多幣別」模式即可同時看到 USD 對所有支援貨幣的換算；也可收藏常用貨幣，快速對照台幣匯率。',
  },
];

const HOW_TO_STEPS = [
  {
    position: 1,
    name: '選擇原始貨幣',
    text: '在首頁將「從」設定為 USD，美金對台幣或其他貨幣都可在同一介面切換。',
  },
  {
    position: 2,
    name: '輸入金額',
    text: '輸入 USD 金額後即時計算對 TWD 的換算結果；多幣別模式可同時查看 30+ 貨幣。',
  },
  {
    position: 3,
    name: '查看趨勢與模式',
    text: '展開卡片可查看 7~30 天歷史趨勢圖，也可切換現金/即期匯率或啟用離線快取。',
  },
];

export default function USDToTWD() {
  return (
    <>
      <SEOHelmet
        title="USD 對 TWD 匯率換算器 | 即時台幣匯率"
        description="USD 對 TWD 即時匯率換算，參考臺灣銀行牌告匯率，每 5 分鐘更新。支援現金/即期匯率、離線 PWA、多幣別同時換算。"
        pathname="/usd-twd"
        canonical="https://app.haotool.org/ratewise/usd-twd/"
        keywords={['USD TWD 匯率', '美金換台幣', '美金匯率', '匯率換算', '匯率好工具', 'RateWise']}
        breadcrumb={[
          { name: 'RateWise 首頁', item: '/' },
          { name: 'USD → TWD 匯率', item: '/usd-twd/' },
        ]}
        faq={FAQ_ENTRIES}
        howTo={{
          name: '如何查看 USD 對 TWD 匯率',
          description: '使用 RateWise 3 步驟快速換算美金對台幣，並查看歷史趨勢與多幣別。',
          steps: HOW_TO_STEPS,
          totalTime: 'PT30S',
        }}
      />

      <main className="min-h-screen bg-gradient-to-br from-neutral-light via-indigo-50 to-white">
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: 'USD → TWD', href: '/usd-twd/' },
            ]}
          />

          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-text">
                USD 對 TWD 匯率換算器
              </h1>
              <p className="text-neutral-text-secondary mt-2">
                即時美金對台幣匯率，參考臺灣銀行牌告，每 5 分鐘更新。支援現金/即期匯率、離線
                PWA、多幣別模式。
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
            >
              返回主換算器
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow p-5 border border-neutral-dark">
              <h2 className="text-xl font-semibold text-neutral-text mb-3">匯率快速重點</h2>
              <ul className="space-y-3 text-neutral-text">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">•</span>
                  <span>資料來源：臺灣銀行牌告匯率，現金/即期買入賣出價完整呈現。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">•</span>
                  <span>更新頻率：每 5 分鐘自動同步，首頁顯示最近更新時間。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">•</span>
                  <span>模式：單幣別/多幣別切換，支援 30+ 貨幣同時換算。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">•</span>
                  <span>離線：PWA 快取資源與最近匯率，無網路仍可換算。</span>
                </li>
              </ul>
            </div>

            <div className="bg-indigo-600 text-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-3">如何快速使用</h2>
              <ol className="space-y-3">
                {HOW_TO_STEPS.map((step) => (
                  <li key={step.position} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                      {step.position}
                    </div>
                    <div>
                      <p className="font-semibold">{step.name}</p>
                      <p className="text-white/90">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-4">
                <Link
                  to="/guide/"
                  className="inline-flex items-center gap-2 text-white font-semibold underline underline-offset-4 decoration-white/60 hover:decoration-white"
                >
                  查看完整使用指南
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <section className="bg-white rounded-2xl shadow p-6 border border-neutral-dark">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                ?
              </div>
              <div>
                <h2 className="text-2xl font-bold text-neutral-text">常見問題</h2>
                <p className="text-sm text-neutral-text-muted">
                  對齊 FAQPage 結構化資料，涵蓋離線、來源、模式與價差提示。
                </p>
              </div>
            </div>
            <dl className="space-y-4">
              {FAQ_ENTRIES.map((faq) => (
                <div
                  key={faq.question}
                  className="border border-neutral-dark rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <dt className="text-lg font-semibold text-neutral-text mb-1">{faq.question}</dt>
                  <dd className="text-neutral-text-secondary leading-relaxed">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </main>
    </>
  );
}
