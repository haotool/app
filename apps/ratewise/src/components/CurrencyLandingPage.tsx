/** 幣別 SEO 頁面共用元件：17 組幣對頁 SSOT 渲染，含 JSON-LD、常見金額操作與旅遊提示 */

import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, BookOpen, Sparkles, Calculator } from 'lucide-react';
import { SEOHelmet } from './SEOHelmet';
import { Breadcrumb } from './Breadcrumb';
import type { FAQEntry, HowToStep, CommonAmountEntry, JsonLdBlock } from '../config/seo-metadata';

export interface CurrencyLandingPageProps {
  currencyCode: string;
  currencyFlag: string;
  currencyName: string;
  title: string;
  description: string;
  pathname: string;
  canonical: string;
  keywords: string[];
  faqEntries: FAQEntry[];
  howToSteps: HowToStep[];
  highlights: string[];
  faqTitle?: string;
  commonAmounts?: CommonAmountEntry[];
  travelTip?: string;
  jsonLd?: JsonLdBlock[];
}

export function CurrencyLandingPage({
  currencyCode,
  currencyFlag,
  currencyName,
  title,
  description,
  pathname,
  canonical,
  keywords,
  faqEntries,
  howToSteps,
  highlights,
  faqTitle = '常見問題',
  commonAmounts = [],
  travelTip,
  jsonLd,
}: CurrencyLandingPageProps) {
  const navigate = useNavigate();
  const seoProps = {
    title,
    description,
    pathname,
    canonical,
    keywords,
    jsonLd,
    breadcrumb: [
      { name: 'RateWise 首頁', item: '/' },
      { name: `${currencyCode} → TWD 匯率`, item: `${pathname}/` },
    ],
    faq: faqEntries,
    howTo: {
      name: `如何查看 ${currencyCode} 對 TWD 匯率`,
      description: `使用 RateWise ${howToSteps.length} 步驟快速換算${currencyName}對台幣，並查看歷史趨勢與多幣別。`,
      steps: howToSteps,
      totalTime: 'PT30S',
    },
  };

  return (
    <>
      <SEOHelmet {...seoProps} />

      {/* Main container - PWA optimized with safe area handling */}
      <div className="min-h-full">
        <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
          {/* Back Navigation */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-hover mb-4 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回主換算器</span>
          </Link>

          {/* Breadcrumb Navigation */}
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: `${currencyCode} → TWD`, href: `${pathname}/` },
            ]}
          />

          {/* Header Section */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="text-4xl sm:text-5xl">{currencyFlag}</span>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text leading-tight">
                  {currencyCode} 對 TWD 匯率換算器
                </h1>
                <p className="text-text-muted text-sm sm:text-base mt-2 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </header>

          {/* 精準換匯：為什麼看賣出價 */}
          <section className="mb-6 sm:mb-8">
            <div className="card p-4 sm:p-5 bg-surface border border-amber-500/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⚖️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-text text-sm sm:text-base mb-2">
                    為什麼 RateWise 比其他工具更精準？
                  </h2>
                  <p className="text-text-muted text-xs sm:text-sm leading-relaxed mb-3">
                    多數匯率工具顯示「中間價」（mid-rate），是買入與賣出的平均值，不是你實際換匯的價格。
                    RateWise 直接顯示臺灣銀行牌告的「
                    <strong className="text-text font-semibold">現金賣出</strong>」價格—— 你去銀行換{' '}
                    {currencyName} 現鈔時實際要付的台幣金額。
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/30 p-2 text-center">
                      <div className="font-bold text-red-600 dark:text-red-400 mb-0.5">
                        中間價（Google／XE）
                      </div>
                      <div className="text-text-muted">買入與賣出的平均值</div>
                      <div className="text-text-muted mt-0.5">≠ 實際換匯金額</div>
                    </div>
                    <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/30 p-2 text-center">
                      <div className="font-bold text-green-600 dark:text-green-400 mb-0.5">
                        賣出價（RateWise）
                      </div>
                      <div className="text-text-muted">臺灣銀行牌告實際報價</div>
                      <div className="text-text-muted mt-0.5">= 銀行實際收你的台幣</div>
                    </div>
                  </div>
                  <p className="text-text-muted text-xs leading-relaxed bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-2 border border-amber-200/30">
                    <strong className="text-text">差距有多大？</strong> 換 10
                    萬日圓，中間價與實際賣出價相差約{' '}
                    <strong className="text-text">1,500～3,000 元台幣</strong>。
                    換匯金額越大，差距越明顯。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Action Card */}
          <div className="card p-4 sm:p-5 mb-6 bg-primary text-white">
            <div className="flex items-center gap-2 mb-3 opacity-80">
              <Sparkles className="w-4 h-4" />
              <h2 className="text-xs font-black uppercase tracking-wider">立即換算</h2>
            </div>
            <p className="text-sm sm:text-base mb-4 opacity-90">
              立即查看{currencyName}
              賣出價——台銀實際牌告，非中間價，讓你換匯前就知道真正要付多少台幣。
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-semibold text-sm transition-colors"
            >
              開始換算 {currencyCode} → TWD
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>

          {/* Highlights Section */}
          <section className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
                {currencyName}匯率重點
              </h2>
            </div>

            <div className="card p-4 sm:p-5">
              <ul className="space-y-3 md:grid md:grid-cols-3 md:gap-3 md:space-y-0">
                {highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 md:rounded-xl md:bg-surface md:p-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-text text-sm sm:text-base leading-relaxed">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* How To Steps Section */}
          <section className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">使用步驟</h2>
            </div>

            <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {howToSteps.map((step) => (
                <div
                  key={step.position}
                  className="card p-4 sm:p-5 flex items-start gap-3 sm:gap-4"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0">
                    {step.position}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-bold text-text text-sm sm:text-base mb-1">{step.name}</h3>
                    <p className="text-text-muted text-xs sm:text-sm leading-relaxed">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Common Amounts Section */}
          {commonAmounts.length > 0 && (
            <section className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
                <Calculator className="w-3.5 h-3.5" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">常見金額換算</h2>
              </div>

              <div className="card p-4 sm:p-5">
                <p className="text-text-muted text-xs sm:text-sm mb-4">
                  以下為{currencyName}兌台幣的常見換算金額，點擊即可前往換算器查看最新匯率結果：
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {commonAmounts.map((entry) => (
                    <button
                      key={entry.amount}
                      type="button"
                      onClick={() =>
                        navigate(`/?amount=${entry.amount}&from=${currencyCode}&to=TWD`)
                      }
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface hover:bg-primary/10 transition-colors group text-left"
                    >
                      <h3 className="text-sm font-medium text-text group-hover:text-primary transition-colors">
                        {entry.question}
                      </h3>
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Travel Tip Section */}
          {travelTip && (
            <section className="mb-6 sm:mb-8">
              <div className="card p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/20 border-amber-200/30">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💡</span>
                  <div>
                    <h3 className="font-bold text-text text-sm sm:text-base mb-1">
                      旅遊換匯小提示
                    </h3>
                    <p className="text-text-muted text-xs sm:text-sm leading-relaxed">
                      {travelTip}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* FAQ Section */}
          <section className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">{faqTitle}</h2>
            </div>

            <div className="space-y-3 md:max-w-3xl md:mx-auto">
              {faqEntries.map((faq, index) => (
                <details key={index} className="card group" open={index === 0}>
                  <summary className="p-4 sm:p-5 cursor-pointer list-none flex items-start gap-3 hover:bg-surface/50 transition-colors rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text text-sm sm:text-base leading-snug pr-4">
                        {faq.question}
                      </h3>
                    </div>
                    <span className="text-text-muted group-open:rotate-180 transition-transform duration-200 flex-shrink-0">
                      ▼
                    </span>
                  </summary>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 ml-11">
                    <p className="text-text-muted text-xs sm:text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Guide Link Section */}
          <section className="mb-6">
            <div className="card p-4 sm:p-5 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text text-sm sm:text-base">需要更多幫助？</h3>
                  <p className="text-text-muted text-xs sm:text-sm mt-1">
                    查看完整使用指南，了解所有功能與技巧。
                  </p>
                </div>
                <Link
                  to="/guide/"
                  className="px-3 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                  使用指南
                </Link>
              </div>
            </div>
          </section>

          {/* Data Source Notice */}
          <footer className="text-center text-text-muted text-xs opacity-60">
            <p>資料來源：臺灣銀行牌告匯率 · 每 5 分鐘自動更新</p>
            <p className="mt-1">© 2026 RateWise 匯率好工具</p>
          </footer>
        </div>
      </div>
    </>
  );
}

export default CurrencyLandingPage;
