/** 幣別 SEO 頁面共用元件：17 組幣對頁 SSOT 渲染，含 JSON-LD、常見金額操作與旅遊提示 */

import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, BookOpen, Sparkles, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from './SEOHelmet';
import { PageNavHeader } from './PageNavHeader';
import { usePairAmountSEO } from '../hooks/usePairAmountSEO';
import { SEO_RATE_EXAMPLES } from '../config/generated/seo-rate-examples';
import type { AlternativeProvider } from '../config/generated/seo-rate-examples';
import { getCopyrightNotice } from '../config/app-info';
import type {
  FAQEntry,
  HowToStep,
  CommonAmountEntry,
  JsonLdBlock,
  RelatedGuideLink,
} from '../config/seo-metadata';

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
  direction?: 'to-twd' | 'twd-to-foreign';
  alternativeProviders?: AlternativeProvider[];
  /** 相關攻略連結（hub-and-spoke 內部鏈接，提升主題叢集 SEO）。 */
  relatedGuides?: RelatedGuideLink[];
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
  direction = 'to-twd',
  alternativeProviders,
  relatedGuides = [],
}: CurrencyLandingPageProps) {
  const { t } = useTranslation();
  const isTwdToForeign = direction === 'twd-to-foreign';
  // Wise-pattern：?amount=X 存在時，以金額專屬 title / description / canonical 覆蓋預設值。
  const { seoTitle, seoDescription, seoCanonical, amount } = usePairAmountSEO({
    currencyCode,
    currencyName,
    pathname,
    defaultTitle: title,
    defaultDescription: description,
    defaultCanonical: canonical,
    direction,
  });

  // 靜態匯率（SSG 預渲染用）：供爬蟲在 ?amount= 頁讀取換算結果。
  const rateExample = SEO_RATE_EXAMPLES[currencyCode];
  const cashSell = rateExample?.cashSell ?? null;
  // KRW→TWD 方向台銀比較：估算現金買入率（= 2×bankMid - cashSell）倒數，即 KRW/TWD
  const taiwanBankKrwPerTwd = isTwdToForeign
    ? cashSell !== null
      ? 1 / cashSell
      : null
    : (() => {
        const bankMid = rateExample?.bankMid ?? null;
        const cs = rateExample?.cashSell ?? null;
        if (bankMid === null || cs === null) return null;
        const cashBuy = 2 * bankMid - cs;
        return cashBuy > 0 ? 1 / cashBuy : null;
      })();

  // 計算換算結果：to-twd = amount * cashSell；twd-to-foreign = amount / cashSell。
  const amountResult =
    amount !== null && cashSell !== null
      ? isTwdToForeign
        ? Math.round((amount / cashSell) * 100) / 100
        : Math.round(amount * cashSell)
      : null;

  const formatNum = (n: number) => n.toLocaleString('zh-TW');

  // 換算器 CTA 深連結格式：/?amount=X&from=CODE&to=TWD（或反向）。
  const converterHref =
    amount !== null
      ? isTwdToForeign
        ? `/?amount=${amount}&from=TWD&to=${currencyCode}`
        : `/?amount=${amount}&from=${currencyCode}&to=TWD`
      : '/';

  // 金額頁必須讓 FinancialService schema 指向 self-canonical，避免 rich result 與 index URL 漂移。
  const resolvedJsonLd =
    amount === null || !jsonLd
      ? jsonLd
      : jsonLd.map((block) => {
          if (block['@type'] !== 'FinancialService') return block;

          const availableChannel =
            block['availableChannel'] &&
            typeof block['availableChannel'] === 'object' &&
            !Array.isArray(block['availableChannel'])
              ? {
                  ...block['availableChannel'],
                  serviceUrl: seoCanonical,
                }
              : block['availableChannel'];

          return {
            ...block,
            url: seoCanonical,
            availableChannel,
          };
        });

  const seoProps = {
    title: seoTitle,
    description: seoDescription,
    pathname,
    canonical: seoCanonical,
    keywords,
    jsonLd: resolvedJsonLd,
    // 金額頁（/usd-twd/500/）加入第 3 層麵包屑，強化 Google 導覽面板顯示。
    breadcrumb: [
      { name: 'RateWise 首頁', item: '/' },
      {
        name: isTwdToForeign ? `TWD → ${currencyCode} 匯率` : `${currencyCode} → TWD 匯率`,
        item: `${pathname}/`,
      },
      ...(amount !== null
        ? [
            {
              name: isTwdToForeign
                ? `${amount.toLocaleString('zh-TW')} TWD → ${currencyCode}`
                : `${amount.toLocaleString('zh-TW')} ${currencyCode} → TWD`,
              item: seoCanonical,
            },
          ]
        : []),
    ],
    howTo: {
      name: isTwdToForeign
        ? `如何查看 TWD 對 ${currencyCode} 匯率`
        : `如何查看 ${currencyCode} 對 TWD 匯率`,
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
          {/* 頁面頂部導航：返回 + 麵包屑（PageNavHeader SSOT 模組）。 */}
          <PageNavHeader
            breadcrumbItems={[
              { label: t('nav.home'), href: '/' },
              {
                label: isTwdToForeign ? `TWD → ${currencyCode}` : `${currencyCode} → TWD`,
                href: `${pathname}/`,
              },
            ]}
          />

          {/* Header Section */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="text-4xl sm:text-5xl">{currencyFlag}</span>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text leading-tight">
                  {isTwdToForeign
                    ? `台幣換${currencyName}匯率換算器`
                    : `${currencyName}對台幣匯率換算器`}
                </h1>
                <p className="text-text-muted text-sm sm:text-base mt-2 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </header>

          {/* 金額換算結果卡（Wise-pattern）：?amount=X 存在時顯示靜態換算結果，爬蟲可索引。 */}
          {amount !== null && amountResult !== null && cashSell !== null && (
            <section className="mb-6 sm:mb-8">
              <div className="card p-4 sm:p-5 bg-primary/5 border border-primary/30">
                <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-wider text-primary/60">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>換算結果（台銀現金賣出參考）</span>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className="text-[10px] text-text-muted">
                    {isTwdToForeign
                      ? `${formatNum(amount)} TWD`
                      : `${formatNum(amount)} ${currencyCode}`}
                  </span>
                  <span className="text-text-muted text-sm">≈</span>
                  <span className="text-2xl sm:text-3xl font-black text-primary">
                    {isTwdToForeign
                      ? `${formatNum(amountResult)} ${currencyCode}`
                      : `${formatNum(amountResult)} TWD`}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted mb-4">
                  {isTwdToForeign
                    ? `參考台銀現金賣出 1 ${currencyCode} = ${cashSell} TWD（每日更新）。實際匯率以台銀牌告為準。`
                    : `參考台銀現金賣出 1 ${currencyCode} = ${cashSell} TWD（每日更新）。實際匯率以台銀牌告為準。`}
                </p>
                <Link
                  to={converterHref}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  在換算器查看最新匯率
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </section>
          )}

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
              to={converterHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-semibold text-sm transition-colors"
            >
              {isTwdToForeign ? `開始換算 TWD → ${currencyCode}` : `開始換算 ${currencyCode} → TWD`}
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
                  點擊常見金額，即可在本頁查看台銀現金賣出參考換算結果，或前往換算器取得最新即時匯率：
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {commonAmounts.map((entry) => (
                    // Wise-pattern：路徑型 URL（/usd-twd/500/），可被 SSG 預渲染，Googlebot 直接索引靜態 HTML。
                    <Link
                      key={entry.amount}
                      to={`${pathname.replace(/\/$/, '')}/${entry.amount}/`}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface hover:bg-primary/10 transition-colors group text-left"
                    >
                      <h3 className="text-sm font-medium text-text group-hover:text-primary transition-colors">
                        {entry.question}
                      </h3>
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
                    </Link>
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

          {/* 替代換匯管道比較卡（明洞換匯所等） */}
          {alternativeProviders && alternativeProviders.length > 0 && (
            <section className="mb-6 sm:mb-8" data-testid="provider-comparison-card">
              <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
                <span className="text-xs">💱</span>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">換匯管道比較</h2>
              </div>
              <div className="card p-4 sm:p-5">
                <h3 className="font-bold text-text text-sm sm:text-base mb-3">
                  台銀 vs 現場換匯所比較
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* 臺灣銀行欄：TWD→KRW 顯示現金賣出；KRW→TWD 顯示估算買入率 */}
                  <div className="rounded-xl bg-surface border border-border p-3">
                    <div className="text-xs font-bold text-text-muted mb-1">
                      {isTwdToForeign ? '臺灣銀行（現金賣出）' : '臺灣銀行（現金買入估算）'}
                    </div>
                    <div className="text-lg font-black text-text">
                      {taiwanBankKrwPerTwd !== null ? taiwanBankKrwPerTwd.toFixed(2) : '—'}{' '}
                      <span className="text-xs font-normal text-text-muted">KRW / TWD</span>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {isTwdToForeign
                        ? `${rateExample?.exampleTWD.toLocaleString()} TWD ≈ ${rateExample?.foreignAtCash.toLocaleString()} KRW`
                        : '估算值；以台銀牌告現金買入率為準'}
                    </div>
                  </div>
                  {/* 替代換匯管道欄 */}
                  {alternativeProviders.map((provider) => {
                    // TWD→KRW: 使用 sell 率（provider.rate），KRW→TWD: 使用 buy 率（provider.rateBuy）
                    // 兩者單位均為 KRW/TWD（46.0 = 1 TWD 換 46 KRW；46.7 = 需 46.7 KRW 換 1 TWD）
                    const displayRate = isTwdToForeign
                      ? provider.rate
                      : (provider.rateBuy ?? provider.rate);
                    const rateLabel = 'KRW / TWD';
                    const exampleAmount = rateExample
                      ? isTwdToForeign
                        ? Math.floor(rateExample.exampleTWD * displayRate)
                        : null // KRW→TWD 方向不顯示台幣換算範例
                      : null;
                    return (
                      <div
                        key={provider.source}
                        className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/30 p-3"
                      >
                        <div className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">
                          {provider.name}
                        </div>
                        <div className="text-lg font-black text-green-700 dark:text-green-400">
                          {displayRate.toFixed(2)}{' '}
                          <span className="text-xs font-normal text-text-muted">{rateLabel}</span>
                        </div>
                        {exampleAmount !== null && rateExample && (
                          <div className="text-xs text-text-muted mt-1">
                            {rateExample.exampleTWD.toLocaleString()} TWD ≈{' '}
                            {exampleAmount.toLocaleString()} KRW
                          </div>
                        )}
                        <div className="text-[10px] text-text-muted mt-2">
                          {provider.source} · {provider.rateDate}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  {isTwdToForeign
                    ? alternativeProviders[0]?.note
                    : `${alternativeProviders[0]?.name ?? '明洞換匯所'}亦提供韓元換台幣服務，現場持韓元現鈔可直接兌換。買入估算匯率，實際以換匯所現場報價為準。`}
                </p>
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

          {/* 相關攻略（hub-and-spoke 內部鏈接）：依幣別方向提供匯率知識攻略連結 */}
          {relatedGuides.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider px-2 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                相關攻略
              </h2>
              <div className="flex flex-col gap-2">
                {relatedGuides.map((guide) => (
                  <Link
                    key={guide.href}
                    to={guide.href}
                    className="card p-4 sm:p-5 bg-surface border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-primary/60 flex-shrink-0 group-hover:text-primary transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text text-sm sm:text-base group-hover:text-primary transition-colors">
                          {guide.label}
                        </p>
                        <p className="text-text-muted text-xs sm:text-sm mt-0.5 leading-relaxed">
                          {guide.description}
                        </p>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-text-muted rotate-180 flex-shrink-0 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Data Source Notice */}
          <footer className="text-center text-text-muted text-xs opacity-60">
            <p>資料來源：臺灣銀行牌告匯率 · 每 5 分鐘自動更新</p>
            <p className="mt-1">{getCopyrightNotice()}</p>
          </footer>
        </div>
      </div>
    </>
  );
}

export default CurrencyLandingPage;
