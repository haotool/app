/** 幣別 SEO 頁面共用元件：17 組幣對頁 SSOT 渲染，含 JSON-LD、常見金額操作與旅遊提示 */

import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  HelpCircle,
  BookOpen,
  Sparkles,
  Calculator,
  Lightbulb,
  Repeat2,
  Scale,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from './SEOHelmet';
import { PageNavHeader } from './PageNavHeader';
import { AnswerCapsule } from './AnswerCapsule';
import { usePairAmountSEO } from '../hooks/usePairAmountSEO';
import { SEO_RATE_EXAMPLES, SEO_RATE_EXAMPLES_DATE } from '../config/generated/seo-rate-examples';
import type { AlternativeProvider } from '../config/generated/seo-rate-examples';
import { APP_INFO, getCopyrightNotice } from '../config/app-info';
import { contentPageTokens } from '../config/design-tokens';
import {
  buildAmountExchangeRateSpecificationJsonLd,
  buildRateDifferenceSentence,
  getDefaultExampleAmount,
  type FAQEntry,
  type HowToStep,
  type CommonAmountEntry,
  type JsonLdBlock,
  type RelatedGuideLink,
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
  /** AEO/GEO 快速答案區塊：AI 引擎直接引用的問答對。 */
  answerCapsule?: FAQEntry[];
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
  answerCapsule = [],
}: CurrencyLandingPageProps) {
  const { t } = useTranslation();
  const isTwdToForeign = direction === 'twd-to-foreign';
  // Wise-pattern：?amount=X 時覆蓋金額專屬 SEO。
  const { seoTitle, seoDescription, seoCanonical, amount, isIndexableAmount } = usePairAmountSEO({
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
  const rateDifferenceSentence = buildRateDifferenceSentence({
    currencyCode,
    currencyName,
    direction: isTwdToForeign ? 'twd-to-foreign' : 'to-twd',
    exampleAmount: getDefaultExampleAmount(currencyCode),
    bankMid: rateExample?.bankMid ?? null,
    cashSell,
  });

  const formatNum = (n: number) => n.toLocaleString('zh-TW');
  // 換算器 CTA 深連結格式：/?amount=X&from=CODE&to=TWD（或反向）。
  const converterHref =
    amount !== null
      ? isTwdToForeign
        ? `/?amount=${amount}&from=TWD&to=${currencyCode}`
        : `/?amount=${amount}&from=${currencyCode}&to=TWD`
      : '/';

  // 金額頁以金額專用 ExchangeRateSpecification 取代幣對頁基礎匯率 schema，避免同頁重複同型節點。
  const resolvedJsonLd = (() => {
    if (amount === null || !jsonLd) return jsonLd;

    // 金額頁加入 ExchangeRateSpecification（含換算金額）。
    if (amountResult !== null && cashSell !== null) {
      const amountSchema = isTwdToForeign
        ? buildAmountExchangeRateSpecificationJsonLd(
            'TWD',
            currencyCode,
            Number((1 / cashSell).toFixed(6)),
            amount,
            amountResult,
            'twd-to-foreign',
          )
        : buildAmountExchangeRateSpecificationJsonLd(
            currencyCode,
            'TWD',
            cashSell,
            amount,
            amountResult,
            'to-twd',
          );
      const nonExchangeRateSchemas = jsonLd.filter(
        (schema) => schema['@type'] !== 'ExchangeRateSpecification',
      );
      return [...nonExchangeRateSchemas, amountSchema];
    }

    return jsonLd;
  })();

  const robotsDirective =
    amount !== null && !isIndexableAmount
      ? 'noindex, follow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const seoProps = {
    title: seoTitle,
    description: seoDescription,
    pathname,
    canonical: seoCanonical,
    keywords,
    jsonLd: resolvedJsonLd,
    robots: robotsDirective,
    // 僅索引金額頁加入金額層麵包屑。
    breadcrumb: [
      { name: `${APP_INFO.shortName} 首頁`, item: '/' },
      {
        name: isTwdToForeign ? `TWD → ${currencyCode} 匯率` : `${currencyCode} → TWD 匯率`,
        item: `${pathname}/`,
      },
      ...(amount !== null && isIndexableAmount
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
      description: `使用 ${APP_INFO.shortName} ${howToSteps.length} 步驟快速換算${currencyName}對台幣，並查看歷史趨勢與多幣別。`,
      steps: howToSteps,
      totalTime: 'PT30S',
    },
  };

  return (
    <>
      <SEOHelmet {...seoProps} />

      <div className="min-h-full">
        <div className={contentPageTokens.shell}>
          <PageNavHeader
            breadcrumbItems={[
              { label: t('nav.home'), href: '/' },
              {
                label: isTwdToForeign ? `TWD → ${currencyCode}` : `${currencyCode} → TWD`,
                href: `${pathname}/`,
              },
            ]}
          />

          <header className={contentPageTokens.hero.wrapper}>
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="text-4xl sm:text-5xl">{currencyFlag}</span>
              <div className="min-w-0 flex-1">
                <h1 className={contentPageTokens.hero.compactTitle}>
                  {isTwdToForeign
                    ? `台幣換${currencyName}匯率換算器`
                    : `${currencyName}對台幣匯率換算器`}
                </h1>
                <p className={contentPageTokens.hero.description}>{description}</p>
                <p className={contentPageTokens.hero.metaRow}>
                  <span className={contentPageTokens.hero.statusDot} />
                  最後更新：
                  <time dateTime={SEO_RATE_EXAMPLES_DATE}>{SEO_RATE_EXAMPLES_DATE}</time>
                </p>
              </div>
            </div>
          </header>

          <AnswerCapsule items={answerCapsule} />

          {amount !== null && amountResult !== null && cashSell !== null && (
            <section className={contentPageTokens.result.section}>
              <div className={contentPageTokens.result.card}>
                <div className={contentPageTokens.result.eyebrowRow}>
                  <Calculator className="h-3.5 w-3.5" />
                  <span>換算結果（台銀現金賣出參考）</span>
                </div>
                <div className={contentPageTokens.result.amountRow}>
                  <span className={contentPageTokens.result.sourceAmount}>
                    {isTwdToForeign
                      ? `${formatNum(amount)} TWD`
                      : `${formatNum(amount)} ${currencyCode}`}
                  </span>
                  <span className={contentPageTokens.result.operator}>≈</span>
                  <span className={contentPageTokens.result.value}>
                    {isTwdToForeign
                      ? `${formatNum(amountResult)} ${currencyCode}`
                      : `${formatNum(amountResult)} TWD`}
                  </span>
                </div>
                <p className={contentPageTokens.result.note}>
                  {isTwdToForeign
                    ? `參考台銀現金賣出 1 ${currencyCode} = ${cashSell} TWD（每日更新）。實際匯率以台銀牌告為準。`
                    : `參考台銀現金賣出 1 ${currencyCode} = ${cashSell} TWD（每日更新）。實際匯率以台銀牌告為準。`}
                </p>
                <Link to={converterHref} className={contentPageTokens.buttons.primary}>
                  在換算器查看最新匯率
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>
              </div>
            </section>
          )}

          <section className={contentPageTokens.section.block}>
            <div className={contentPageTokens.callouts.warning}>
              <div className="flex items-start gap-3">
                <div className={`${contentPageTokens.callouts.icon} bg-warning/15 text-warning`}>
                  <Scale className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className={contentPageTokens.article.titleCompact}>
                    為什麼牌告賣出價更接近臨櫃換匯成本？
                  </h2>
                  <p className="mb-3 text-xs leading-relaxed text-text-muted sm:text-sm">
                    多數匯率工具顯示「中間價」（mid-rate），是買入與賣出的平均值，不是你實際換匯的價格。
                    {APP_INFO.shortName} 直接顯示臺灣銀行牌告的「
                    <strong className="text-text font-semibold">現金賣出</strong>
                    」價格，代表你去銀行換 {currencyName} 現鈔時實際要付的台幣金額。
                  </p>
                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                    <div className={`${contentPageTokens.callouts.danger} text-center`}>
                      <div className="font-bold text-text mb-0.5">中間價（Google／XE）</div>
                      <div className="text-text-muted">買入與賣出的平均值</div>
                      <div className="text-text-muted mt-0.5">≠ 實際換匯金額</div>
                    </div>
                    <div className={`${contentPageTokens.callouts.success} text-center`}>
                      <div className="font-bold text-text mb-0.5">
                        賣出價（{APP_INFO.shortName}）
                      </div>
                      <div className="text-text-muted">臺灣銀行牌告實際報價</div>
                      <div className="text-text-muted mt-0.5">= 銀行實際收你的台幣</div>
                    </div>
                  </div>
                  <p className={contentPageTokens.callouts.note}>{rateDifferenceSentence}</p>
                </div>
              </div>
            </div>
          </section>

          <div className={`${contentPageTokens.article.card} mb-6`}>
            <div className="mb-3 flex items-center gap-2 text-text-muted/70">
              <Sparkles className="h-3.5 w-3.5 text-primary/70" />
              <h2 className={contentPageTokens.sectionHeader.eyebrow}>立即換算</h2>
            </div>
            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
              立即查看{currencyName}
              賣出價，以台銀實際牌告為準，非中間價，換匯前先估算接近臨櫃牌告的台幣成本。
            </p>
            <Link to={converterHref} className={contentPageTokens.buttons.primary}>
              {isTwdToForeign ? `開始換算 TWD → ${currencyCode}` : `開始換算 ${currencyCode} → TWD`}
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>

          <section className={contentPageTokens.section.block}>
            <div className={contentPageTokens.sectionHeader.row}>
              <BookOpen className="h-3.5 w-3.5" />
              <h2 className={contentPageTokens.sectionHeader.eyebrow}>{currencyName}匯率重點</h2>
            </div>

            <div className={contentPageTokens.article.card}>
              <ul className="space-y-3 md:grid md:grid-cols-3 md:gap-3 md:space-y-0">
                {highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 md:rounded-lg md:bg-surface md:p-3"
                  >
                    <span className={contentPageTokens.article.numberBadge}>{index + 1}</span>
                    <span className="text-sm leading-relaxed text-text sm:text-base">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={contentPageTokens.section.block}>
            <div className={contentPageTokens.sectionHeader.row}>
              <Sparkles className="h-3.5 w-3.5" />
              <h2 className={contentPageTokens.sectionHeader.eyebrow}>使用步驟</h2>
            </div>

            <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {howToSteps.map((step) => (
                <div
                  key={step.position}
                  className={`${contentPageTokens.article.card} flex items-start gap-3 sm:gap-4`}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground sm:h-12 sm:w-12 sm:text-xl">
                    {step.position}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <h3 className="mb-1 text-sm font-bold text-text sm:text-base">{step.name}</h3>
                    <p className="text-xs leading-relaxed text-text-muted sm:text-sm">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {commonAmounts.length > 0 && (
            <section className={contentPageTokens.section.block}>
              <div className={contentPageTokens.sectionHeader.row}>
                <Calculator className="h-3.5 w-3.5" />
                <h2 className={contentPageTokens.sectionHeader.eyebrow}>常見金額換算</h2>
              </div>

              <div className={contentPageTokens.article.card}>
                <p className="mb-4 text-xs text-text-muted sm:text-sm">
                  點擊常見金額，即可在本頁查看台銀現金賣出參考換算結果，或前往換算器取得最新即時匯率：
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {commonAmounts.map((entry) => (
                    // Wise-pattern：路徑型 URL（/usd-twd/500/），可被 SSG 預渲染，Googlebot 直接索引靜態 HTML。
                    <Link
                      key={entry.amount}
                      to={`${pathname.replace(/\/$/, '')}/${entry.amount}/`}
                      className={`${contentPageTokens.links.row} text-left`}
                    >
                      <h3 className="text-sm font-medium text-text group-hover:text-primary transition-colors">
                        {entry.question}
                      </h3>
                      <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0 rotate-180 text-text-muted transition-colors group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {travelTip && (
            <section className={contentPageTokens.section.block}>
              <div className={contentPageTokens.callouts.warning}>
                <div className="flex items-start gap-3">
                  <div
                    className={`${contentPageTokens.callouts.icon} h-9 w-9 bg-warning/15 text-warning`}
                  >
                    <Lightbulb className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-text sm:text-base">
                      旅遊換匯小提示
                    </h3>
                    <p className="text-xs leading-relaxed text-text-muted sm:text-sm">
                      {travelTip}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {alternativeProviders && alternativeProviders.length > 0 && (
            <section
              className={contentPageTokens.section.block}
              data-testid="provider-comparison-card"
            >
              <div className={contentPageTokens.sectionHeader.row}>
                <Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />
                <h2 className={contentPageTokens.sectionHeader.eyebrow}>換匯管道比較</h2>
              </div>
              <div className={contentPageTokens.article.card}>
                <h3 className="mb-3 text-sm font-bold text-text sm:text-base">
                  台銀 vs 現場換匯所比較
                </h3>
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* 臺灣銀行欄：TWD→KRW 顯示現金賣出；KRW→TWD 顯示估算買入率 */}
                  <div className={contentPageTokens.callouts.neutral}>
                    <div className="mb-1 text-xs font-bold text-text-muted">
                      {isTwdToForeign ? '臺灣銀行（現金賣出）' : '臺灣銀行（現金買入估算）'}
                    </div>
                    <div className="text-lg font-black text-text">
                      {taiwanBankKrwPerTwd !== null ? taiwanBankKrwPerTwd.toFixed(2) : '未提供'}{' '}
                      <span className="text-xs font-normal text-text-muted">KRW / TWD</span>
                    </div>
                    <div className="mt-1 text-xs text-text-muted">
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
                      <div key={provider.source} className={contentPageTokens.callouts.success}>
                        <div className="mb-1 text-xs font-bold text-text">{provider.name}</div>
                        <div className="text-lg font-black text-text">
                          {displayRate.toFixed(2)}{' '}
                          <span className="text-xs font-normal text-text-muted">{rateLabel}</span>
                        </div>
                        {exampleAmount !== null && rateExample && (
                          <div className="mt-1 text-xs text-text-muted">
                            {rateExample.exampleTWD.toLocaleString()} TWD ≈{' '}
                            {exampleAmount.toLocaleString()} KRW
                          </div>
                        )}
                        <div className={`${contentPageTokens.article.finePrint} mt-2`}>
                          {provider.source} · {provider.rateDate}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className={contentPageTokens.article.finePrint}>
                  {isTwdToForeign
                    ? alternativeProviders[0]?.note
                    : `${alternativeProviders[0]?.name ?? '明洞換匯所'}亦提供韓元換台幣服務，現場持韓元現鈔可直接兌換。買入估算匯率，實際以換匯所現場報價為準。`}
                </p>
              </div>
            </section>
          )}

          <section className={contentPageTokens.section.block}>
            <div className={contentPageTokens.sectionHeader.row}>
              <HelpCircle className="h-3.5 w-3.5" />
              <h2 className={contentPageTokens.sectionHeader.eyebrow}>{faqTitle}</h2>
            </div>

            <div className={contentPageTokens.article.faqStack}>
              {faqEntries.map((faq, index) => (
                <details
                  key={index}
                  className={contentPageTokens.article.faqItem}
                  open={index === 0}
                >
                  <summary className={contentPageTokens.article.faqSummary}>
                    <div className={`${contentPageTokens.article.iconBadge} h-8 w-8`}>
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="pr-4 text-sm font-bold leading-snug text-text sm:text-base">
                        {faq.question}
                      </h3>
                    </div>
                    <span className="text-text-muted group-open:rotate-180 transition-transform duration-200 flex-shrink-0">
                      ▼
                    </span>
                  </summary>
                  <div className="ml-11">
                    <p className={contentPageTokens.article.faqAnswer}>{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {relatedGuides.length > 0 && (
            <section className="mb-6">
              <h2
                className={`${contentPageTokens.sectionHeader.row} ${contentPageTokens.sectionHeader.eyebrow}`}
              >
                <BookOpen className="w-4 h-4" />
                相關攻略
              </h2>
              <div className="flex flex-col gap-2">
                {relatedGuides.map((guide) => (
                  <Link
                    key={guide.href}
                    to={guide.href}
                    className={`group ${contentPageTokens.surfaces.quietInteractive} sm:p-5`}
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

          <footer className="text-center text-xs text-text-muted/70">
            <p>資料來源：臺灣銀行牌告匯率 · 約每 5 分鐘檢查更新</p>
            <p className="mt-1">{getCopyrightNotice()}</p>
          </footer>
        </div>
      </div>
    </>
  );
}

export default CurrencyLandingPage;
