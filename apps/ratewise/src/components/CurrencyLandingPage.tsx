/**
 * 幣別 SEO 頁面共用元件：34 幣對頁＋金額頁 SSOT 渲染。
 * E5 wave-B 六段 IA：Answer Hero → 報價對比卡 → 階梯表/金額互鏈 → 在地情境卡片組 → FAQ 手風琴 → 相關連結。
 * 純呈現層：SEO head／JSON-LD／內容文字零變動，佈局與樣式全走 E1 token。
 * @see .claude/prds/ratewise-e5b-currency-page-uiux-design.md
 */

import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from './SEOHelmet';
import { ContentPageLayout } from './content/ContentPageLayout';
import { ContentFaqAccordion } from './content/ContentSections';
import { CurrencyAnswerHero } from './currency/CurrencyAnswerHero';
import { CurrencySectionHeading } from './currency/CurrencySectionHeading';
import { AmountAnswerCard } from './currency/AmountAnswerCard';
import { AmountLadderSection } from './currency/AmountLadderSection';
import { RateInsightSection } from './currency/RateInsightSection';
import { CommonAmountsSection } from './currency/CommonAmountsSection';
import { LocalInsightsSection } from './currency/LocalInsightsSection';
import { HowToStepsSection } from './currency/HowToStepsSection';
import { ProviderComparisonSection } from './currency/ProviderComparisonSection';
import { RelatedGuidesSection } from './currency/RelatedGuidesSection';
import { usePairAmountSEO } from '../hooks/usePairAmountSEO';
import { SEO_RATE_EXAMPLES, SEO_RATE_EXAMPLES_DATE } from '../config/generated/seo-rate-examples';
import type { AlternativeProvider } from '../config/generated/seo-rate-examples';
import { APP_INFO, getCopyrightNotice } from '../config/app-info';
import {
  buildAmountExchangeRateSpecificationJsonLd,
  buildRateDifferenceSentence,
  buildForwardAmountLadder,
  buildReverseAmountLadder,
  getAmountAnswerData,
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

  // 金額頁 v2 資料（雙向答案與階梯表）：全部由 config 純計算生成，元件不含文案邏輯。
  const answerData = getAmountAnswerData(currencyCode);
  const forwardLadder =
    !isTwdToForeign && amount !== null ? buildForwardAmountLadder(currencyCode) : [];
  const reverseLadder =
    isTwdToForeign && amount !== null ? buildReverseAmountLadder(currencyCode) : [];
  const ladderRows = isTwdToForeign ? reverseLadder : forwardLadder;

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

    // 金額頁 canonical 與幣對頁不同，移除幣對頁層級的 WebPage 節點避免 @id 錯置。
    const baseJsonLd = jsonLd.filter((schema) => schema['@type'] !== 'WebPage');

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
      const nonExchangeRateSchemas = baseJsonLd.filter(
        (schema) => schema['@type'] !== 'ExchangeRateSpecification',
      );
      return [...nonExchangeRateSchemas, amountSchema];
    }

    return baseJsonLd;
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

      <ContentPageLayout
        breadcrumbItems={[
          { label: t('nav.home'), href: '/' },
          {
            label: isTwdToForeign ? `TWD → ${currencyCode}` : `${currencyCode} → TWD`,
            href: `${pathname}/`,
          },
        ]}
        testId="currency-landing-page"
      >
        <div className="space-y-6">
          {/* 1. Answer Hero：頁面身分＋（金額頁換算結果）＋快速答案＋CTA。 */}
          <CurrencyAnswerHero
            flag={currencyFlag}
            heading={
              isTwdToForeign ? `台幣換${currencyName}匯率換算器` : `${currencyName}對台幣匯率換算器`
            }
            description={description}
            updatedDate={SEO_RATE_EXAMPLES_DATE}
            quickAnswers={answerCapsule}
            ctaTitle="立即換算"
            ctaLead={`立即查看${currencyName}賣出價：台銀實際牌告，非中間價，讓你換匯前就知道真正要付多少台幣。`}
            ctaLabel={
              isTwdToForeign ? `開始換算 TWD → ${currencyCode}` : `開始換算 ${currencyCode} → TWD`
            }
            ctaTo={converterHref}
          >
            {amount !== null && amountResult !== null && cashSell !== null && (
              <AmountAnswerCard
                amount={amount}
                amountResult={amountResult}
                cashSell={cashSell}
                currencyCode={currencyCode}
                isTwdToForeign={isTwdToForeign}
                answerData={answerData}
                converterHref={converterHref}
              />
            )}
          </CurrencyAnswerHero>

          {/* 2. 報價對比卡：中間價 vs 賣出價。 */}
          <RateInsightSection
            currencyName={currencyName}
            rateDifferenceSentence={rateDifferenceSentence}
          />

          {/* 3. 金額階梯表（金額頁）＋常見金額互鏈（Toss 列表式）。 */}
          {ladderRows.length > 0 && (
            <AmountLadderSection
              isTwdToForeign={isTwdToForeign}
              currencyCode={currencyCode}
              currencyName={currencyName}
              pathname={pathname}
              forwardLadder={forwardLadder}
              reverseLadder={reverseLadder}
            />
          )}
          {commonAmounts.length > 0 && (
            <CommonAmountsSection commonAmounts={commonAmounts} pathname={pathname} />
          )}

          {/* 4. 在地情境卡片組：匯率重點＋旅遊提示＋換匯管道比較。 */}
          {(highlights.length > 0 || travelTip) && (
            <LocalInsightsSection
              currencyName={currencyName}
              highlights={highlights}
              travelTip={travelTip}
            />
          )}
          {alternativeProviders && alternativeProviders.length > 0 && (
            <ProviderComparisonSection
              isTwdToForeign={isTwdToForeign}
              taiwanBankKrwPerTwd={taiwanBankKrwPerTwd}
              rateExample={rateExample}
              alternativeProviders={alternativeProviders}
            />
          )}
          {howToSteps.length > 0 && <HowToStepsSection howToSteps={howToSteps} />}

          {/* 5. FAQ 手風琴（E4 ContentFaqAccordion 範式）。 */}
          {faqEntries.length > 0 && (
            <section>
              <CurrencySectionHeading icon={HelpCircle}>{faqTitle}</CurrencySectionHeading>
              <ContentFaqAccordion items={faqEntries} />
            </section>
          )}

          {/* 6. 相關連結（hub-and-spoke 內部鏈接）。 */}
          {relatedGuides.length > 0 && <RelatedGuidesSection relatedGuides={relatedGuides} />}

          {/* Data Source Notice */}
          <footer className="text-center text-xs text-text-muted opacity-60">
            <p>資料來源：臺灣銀行牌告匯率 · 約每 5 分鐘檢查更新</p>
            <p className="mt-1">{getCopyrightNotice()}</p>
          </footer>
        </div>
      </ContentPageLayout>
    </>
  );
}

export default CurrencyLandingPage;
