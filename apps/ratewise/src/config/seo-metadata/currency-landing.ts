/**
 * L2 純組裝生成器（E5 copy 四層架構）。
 * 敘述性文字 100% 來自 L1 persona（currency-personas.ts）；本檔模板只做：
 * 數字注入（SEO_RATE_EXAMPLES）、欄位拼接與結構生成（FAQ／階梯表／schema）。
 * 禁止在本檔新增任何敘述性中文句子常數。
 */

import { CURRENCY_DEFINITIONS } from '../../features/ratewise/constants';
import { APP_INFO } from '../app-info';
import {
  SEO_RATE_EXAMPLES,
  SEO_RATE_EXAMPLES_DATE,
  type RateExample,
} from '../generated/seo-rate-examples';
import { INDEXABLE_FORWARD_AMOUNTS, INDEXABLE_REVERSE_TWD_AMOUNTS } from '../seo-paths';
import { CURRENCY_PERSONAS, type CurrencyPersonaCode } from './currency-personas';
import {
  type FAQEntry,
  type RelatedGuideLink,
  type CommonAmountEntry,
  type CurrencyLandingPageContent,
  buildCanonicalUrl,
  buildAlternativeProviderFaq,
  buildExchangeRateSpecificationJsonLd,
  buildShareImageJsonLd,
  buildWebPageJsonLd,
  MID_RATE_SPREAD_NOTE,
  GUIDE_LINK_SELL_RATE_VS_MID_RATE,
  GUIDE_LINK_CASH_VS_SPOT_RATE,
  GUIDE_LINK_CARD_RATE_GUIDE,
} from './core';

export { CURRENCY_PERSONAS } from './currency-personas';

const RELATED_GUIDES_TO_TWD: RelatedGuideLink[] = [
  GUIDE_LINK_SELL_RATE_VS_MID_RATE,
  GUIDE_LINK_CASH_VS_SPOT_RATE,
];

/** 台幣→外幣方向的相關攻略連結（出國換匯場景）。 */
const RELATED_GUIDES_TWD_TO_FOREIGN: RelatedGuideLink[] = [
  GUIDE_LINK_SELL_RATE_VS_MID_RATE,
  GUIDE_LINK_CASH_VS_SPOT_RATE,
  GUIDE_LINK_CARD_RATE_GUIDE,
];

export type CurrencyLandingCode = CurrencyPersonaCode;
export type ReverseCurrencyLandingCode = CurrencyPersonaCode;

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-TW');
}

/** 中文金額別名：萬進位（50000 → 「5 萬」；1000 → 「1,000」）。 */
export function formatZhAmount(amount: number): string {
  if (amount >= 10000 && amount % 10000 === 0) {
    return `${(amount / 10000).toLocaleString('zh-TW')} 萬`;
  }
  return formatAmount(amount);
}

// 以台銀自身現金中間價反推現金買入率（bankMid = (買入+賣出)/2）。
function estimateCashBuy(ex: RateExample): number | null {
  if (ex.bankMid == null) return null;
  const buy = 2 * ex.bankMid - ex.cashSell;
  return buy > 0 ? buy : null;
}

export const DEFAULT_EXAMPLE_AMOUNTS = {
  USD: 1000,
  JPY: 100000,
  EUR: 1000,
  KRW: 100000,
  HKD: 10000,
  THB: 10000,
  VND: 1000000,
} as const;

export function getDefaultExampleAmount(currencyCode: string): number {
  return Object.prototype.hasOwnProperty.call(DEFAULT_EXAMPLE_AMOUNTS, currencyCode)
    ? DEFAULT_EXAMPLE_AMOUNTS[currencyCode as keyof typeof DEFAULT_EXAMPLE_AMOUNTS]
    : 1000;
}

export interface RateDifferenceSentenceInput {
  currencyCode: string;
  currencyName: string;
  direction: 'to-twd' | 'twd-to-foreign';
  exampleAmount?: number;
  bankMid?: number | null;
  cashSell?: number | null;
}

export function buildRateDifferenceSentence(input: RateDifferenceSentenceInput): string {
  const { currencyCode, currencyName, direction, exampleAmount, bankMid, cashSell } = input;
  const amount = exampleAmount && exampleAmount > 0 ? exampleAmount : 1000;

  if (bankMid == null || cashSell == null) {
    return '中間價只適合觀察市場方向，實際換匯仍應以銀行牌告買入價或賣出價為準。換匯金額越大，買賣價差的影響越明顯。';
  }

  if (direction === 'twd-to-foreign') {
    const foreignAtMid = amount / bankMid;
    const foreignAtSell = amount / cashSell;
    const diffForeign = Math.abs(foreignAtMid - foreignAtSell);
    return `差距有多大？以 ${formatAmount(amount)} 台幣估算 TWD→${currencyCode}，若用中間價推算約可換得 ${formatAmount(
      foreignAtMid,
    )} ${currencyCode}，實際台銀賣出價約可換得 ${formatAmount(
      foreignAtSell,
    )} ${currencyCode}，少換約 ${formatAmount(diffForeign)} ${currencyCode}。換匯金額越大，差距越明顯。`;
  }

  const midCost = amount * bankMid;
  const sellCost = amount * cashSell;
  const diff = Math.abs(sellCost - midCost);

  return `差距有多大？以買 ${formatAmount(amount)} ${currencyName} 所需台幣估算，中間價與台銀實際賣出價約相差 ${Math.round(
    diff,
  ).toLocaleString('zh-TW')} 元台幣；金額越大，差距越明顯。`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 金額頁 v2（answer-first）：title 中文別名公式、description 首句給答案、階梯表
// ─────────────────────────────────────────────────────────────────────────────

export interface PairAmountSeoCopy {
  title: string;
  description: string;
}

// title/H1/description 共用的「中文別名（阿拉伯數字 code）」雙寫法標籤。
function buildAmountLabel(amount: number, currencyCode: string, currencyName: string): string {
  const formatted = formatAmount(amount);
  const alias = formatZhAmount(amount);
  return alias === formatted
    ? `${formatted} ${currencyName}（${currencyCode}）`
    : `${alias}${currencyName}（${formatted} ${currencyCode}）`;
}

export function buildPairAmountSeo(
  amount: number,
  currencyCode: string,
  currencyName: string,
  direction: 'to-twd' | 'twd-to-foreign' = 'to-twd',
): PairAmountSeoCopy {
  const formatted = formatAmount(amount);
  const ex = SEO_RATE_EXAMPLES[currencyCode];

  if (direction === 'twd-to-foreign') {
    const title = `${formatted} 台幣換多少${currencyName}？今日台銀實際價（TWD/${currencyCode}） | ${APP_INFO.shortName}`;
    if (!ex) {
      return {
        title,
        description: `${formatted} 台幣可以換多少${currencyName}？${APP_INFO.shortName} 直接顯示台銀牌告現金賣出價（非中間價），出國換匯前先掌握實際能換到的金額。`,
      };
    }
    const foreignAtSell = Math.round(amount / ex.cashSell);
    return {
      title,
      description: `${formatted} 台幣以台銀現金賣出價約可換 ${formatAmount(foreignAtSell)} ${currencyCode}（${SEO_RATE_EXAMPLES_DATE} 牌告，每日更新）。用 Google 中間價估算會高估實際能換到的金額，${APP_INFO.shortName} 直接給你台銀實際牌告與金額階梯對照。`,
    };
  }

  const label = buildAmountLabel(amount, currencyCode, currencyName);
  const title = `${label}換台幣是多少？今日台銀實際價 | ${APP_INFO.shortName}`;
  if (!ex) {
    return {
      title,
      description: `${label}換台幣是多少？${APP_INFO.shortName} 同時顯示台銀現金買入（換回台幣）與現金賣出（買外幣現鈔）兩個方向的實際牌告，非 Google 中間價。`,
    };
  }
  const sellCost = Math.round(amount * ex.cashSell);
  const cashBuy = estimateCashBuy(ex);
  const buyBack = cashBuy != null ? Math.round(amount * cashBuy) : null;
  const buyBackClause =
    buyBack != null
      ? `${label}換回台幣約 ${formatAmount(buyBack)} 元（台銀現金買入）；`
      : `${label}換台幣看台銀現金買入價；`;
  return {
    title,
    description: `${buyBackClause}要買 ${formatted} ${currencyName}現鈔約需 ${formatAmount(sellCost)} 元（現金賣出，${SEO_RATE_EXAMPLES_DATE} 牌告，每日更新）。${APP_INFO.shortName} 顯示台銀實際牌告，非 Google 中間價。`,
  };
}

/** 金額頁 Answer Block 資料（雙向答案＋中間價對比，純計算）。 */
export interface AmountAnswerData {
  cashSell: number;
  /** 由台銀現金中間價反推的現金買入率；無現金買入資料時為 null。 */
  cashBuyEstimate: number | null;
  marketMid: number;
  rateDate: string;
}

export function getAmountAnswerData(currencyCode: string): AmountAnswerData | null {
  const ex = SEO_RATE_EXAMPLES[currencyCode];
  if (!ex) return null;
  return {
    cashSell: ex.cashSell,
    cashBuyEstimate: estimateCashBuy(ex),
    marketMid: ex.marketMid,
    rateDate: SEO_RATE_EXAMPLES_DATE,
  };
}

/** 金額階梯表（外幣→TWD）：由 INDEXABLE_FORWARD_AMOUNTS 純計算生成，零硬編碼。 */
export interface ForwardLadderRow {
  amount: number;
  twdAtCashBuy: number | null;
  twdAtCashSell: number;
}

export function buildForwardAmountLadder(currencyCode: string): ForwardLadderRow[] {
  const ex = SEO_RATE_EXAMPLES[currencyCode];
  const amounts = INDEXABLE_FORWARD_AMOUNTS[currencyCode.toLowerCase()];
  if (!ex || !amounts) return [];
  const cashBuy = estimateCashBuy(ex);
  return amounts.map((amount) => ({
    amount,
    twdAtCashBuy: cashBuy != null ? Math.round(amount * cashBuy) : null,
    twdAtCashSell: Math.round(amount * ex.cashSell),
  }));
}

/** 金額階梯表（TWD→外幣）：由 INDEXABLE_REVERSE_TWD_AMOUNTS 純計算生成。 */
export interface ReverseLadderRow {
  twdAmount: number;
  foreignAtCashSell: number;
}

export function buildReverseAmountLadder(currencyCode: string): ReverseLadderRow[] {
  const ex = SEO_RATE_EXAMPLES[currencyCode];
  const amounts = INDEXABLE_REVERSE_TWD_AMOUNTS[currencyCode.toLowerCase()];
  if (!ex || !amounts) return [];
  return amounts.map((twdAmount) => ({
    twdAmount,
    foreignAtCashSell: Math.round(twdAmount / ex.cashSell),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 幣別頁組裝（正向 / 反向）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 根據每日更新的匯差數據，產生具體落差敘述句。
 * 同時顯示外幣數量（實際 vs 中間價預期）與台幣差距，提升 LLM 引用精確度。
 */
function buildRateExampleSentence(code: string, displayName: string): string {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return '換匯金額越大、落差越明顯。';
  // 整萬數格式：30000 → "3 萬"，以符合中文閱讀習慣。
  const twdLabel =
    ex.exampleTWD % 10000 === 0 ? `${ex.exampleTWD / 10000} 萬` : formatAmount(ex.exampleTWD);
  const fCash = formatAmount(ex.foreignAtCash);
  const fMid = formatAmount(ex.foreignAtMarketMid);
  const fDiff = formatAmount(ex.diffForeign);
  return `以換 ${twdLabel}元新台幣的${displayName}為例：台灣銀行臨櫃現金實際只能換到 ${fCash} ${code}，而 Google（資料來源：Morningstar）、XE、Wise、Apple 計算機（資料來源：Yahoo Finance）等工具顯示的市場中間價換算結果約為 ${fMid} ${code}，兩者相差約 ${fDiff} ${code}（差距 ${ex.diffPct}%）。若先用中間價估算再去台銀換匯，實際會比預期少換 ${fDiff} ${code}，等於多花了 ${ex.diffTWD} 元新台幣的匯差。（匯差數據每日自動更新，最後更新：${SEO_RATE_EXAMPLES_DATE}）`;
}

/**
 * 在 FAQ 答案中嵌入靜態匯率數字，讓 Googlebot 原始 HTML 層次即可讀到匯率。
 * 數據來自 SEO_RATE_EXAMPLES（每日 GitHub Actions 自動更新）。
 */
function buildCashSellRateSentence(code: string, baseAmount: number): string {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return '';
  const result = Math.round(baseAmount * ex.cashSell);
  return `以台銀現金賣出匯率換算，${formatAmount(baseAmount)} ${code} ≈ ${formatAmount(result)} 元台幣（台銀現金賣出 1 ${code} = ${ex.cashSell} TWD，匯率每日自動更新，最後更新：${SEO_RATE_EXAMPLES_DATE}）。`;
}

/** 反向頁（TWD→外幣）FAQ：嵌入台幣換外幣的靜態換算結果。 */
function buildTwdToForeignRateSentence(code: string, twdAmount: number): string {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return '';
  const result = Math.round(twdAmount / ex.cashSell);
  return `以台銀現金賣出匯率換算，${formatAmount(twdAmount)} 台幣 ≈ ${formatAmount(result)} ${code}（台銀現金賣出 1 ${code} = ${ex.cashSell} TWD，匯率每日自動更新，最後更新：${SEO_RATE_EXAMPLES_DATE}）。`;
}

/**
 * 幣對頁 Answer Capsule：40-60 字直接答案段落，供 AI 引擎直接引用。
 */
function buildCurrencyAnswerCapsule(
  code: string,
  displayName: string,
  direction: 'to-twd' | 'twd-to-foreign',
): FAQEntry[] {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return [];

  if (direction === 'to-twd') {
    return [
      {
        question: `買${displayName}今日台銀賣出價是多少？`,
        answer: `台銀現金賣出價：1 ${code} = ${ex.cashSell} TWD（${SEO_RATE_EXAMPLES_DATE} 更新）。${APP_INFO.shortName} 直接顯示臺灣銀行牌告的實際賣出價，非中間價，換匯前可精準估算所需台幣。`,
      },
      {
        question: `為什麼 ${APP_INFO.shortName} 顯示的${displayName}匯率和 Google 不一樣？`,
        answer: `Google 顯示的是市場中間價（批發參考價），一般人換不到。${APP_INFO.shortName} 顯示的是台銀牌告的現金賣出價，是你臨櫃換匯的實際匯率，兩者差距可達 ${ex.diffPct}%。`,
      },
    ];
  }

  // twd-to-foreign
  const exampleTwd = ex.exampleTWD;
  const foreignResult = Math.round(exampleTwd / ex.cashSell);
  return [
    {
      question: `台幣換${displayName}今日匯率是多少？`,
      answer: `台銀現金賣出價：1 ${code} = ${ex.cashSell} TWD（${SEO_RATE_EXAMPLES_DATE} 更新）。${formatAmount(exampleTwd)} 台幣約可換 ${formatAmount(foreignResult)} ${code}。${APP_INFO.shortName} 顯示臺灣銀行牌告實際賣出價，出國換匯前可精準估算。`,
    },
    {
      question: `出國前換${displayName}，該用哪個匯率？`,
      answer: `臨櫃換現鈔看「現金賣出」，網銀外幣帳戶看「即期賣出」。${APP_INFO.shortName} 同時顯示兩種匯率，讓你依換匯情境選擇正確報價。`,
    },
  ];
}

export function getCurrencyLandingPageContent(
  code: CurrencyLandingCode,
): CurrencyLandingPageContent {
  const persona = CURRENCY_PERSONAS[code];
  const definition = CURRENCY_DEFINITIONS[code];
  const pathname = `/${code.toLowerCase()}-twd`;
  const displayName = persona.displayName;

  const indexablePopularAmounts = INDEXABLE_FORWARD_AMOUNTS[code.toLowerCase()] ?? [
    ...persona.popularAmounts,
  ];

  const commonAmounts: CommonAmountEntry[] = indexablePopularAmounts.map((amount) => ({
    amount,
    label: `${formatAmount(amount)} ${code}`,
    question: `買 ${formatAmount(amount)} ${displayName}要多少台幣？`,
  }));

  const canonicalUrl = buildCanonicalUrl(pathname);
  const rateExample = SEO_RATE_EXAMPLES[code];
  const spotAvailable = rateExample?.spotAvailable ?? true;

  const faqEntries: FAQEntry[] = [
    {
      question: `為什麼 Google、XE、Wise、Apple 計算機顯示的${displayName}換算金額，和台灣銀行臨櫃換匯的實際結果不同？`,
      answer: `Google 匯率（資料來源：Morningstar）、XE、Wise 及 Apple 計算機（資料來源：Yahoo Finance）顯示的是「市場中間價」，也就是銀行同業批發交易的參考基準，一般消費者換不到這個價格；臨櫃現金換匯適用的是台銀「現金賣出」牌告價。${MID_RATE_SPREAD_NOTE}${buildRateExampleSentence(code, displayName)} ${APP_INFO.name}直接顯示臺灣銀行牌告的${spotAvailable ? '現金賣出與即期賣出價' : '現金賣出價'}，換匯前即可掌握真實兌換金額。`,
    },
    // L1 persona 特化 FAQ：每幣別 ≥3 題、含可驗證在地事實。
    ...persona.faqSpecific,
    ...(spotAvailable
      ? [
          {
            question: `${displayName}現金賣出和即期賣出有什麼差別？怎麼選？`,
            answer: `「現金賣出」適合臨櫃換外幣現鈔，「即期賣出」適合網銀外幣帳戶轉換或匯款。現金匯率通常比即期差，因為銀行需負擔現鈔的保管、運送與保險成本。出國旅遊前換現金看「現金賣出」，線上外幣轉換看「即期賣出」。`,
          },
        ]
      : []),
    {
      question: `買${displayName}今日台銀賣出價是多少？`,
      answer: `${buildCashSellRateSentence(code, indexablePopularAmounts[0] ?? 1)}使用本工具可查看 5 分鐘即時更新匯率，點擊「開始換算」輸入任意金額查看結果。`,
    },
    {
      question: `${formatAmount(indexablePopularAmounts.at(-1) ?? 0)} ${displayName}大約等於多少台幣？`,
      answer: `${buildCashSellRateSentence(code, indexablePopularAmounts.at(-1) ?? 0)}實際匯率以台銀牌告為準，請使用本工具查看 5 分鐘即時更新結果。`,
    },
    {
      question: `出國刷卡的匯率跟 ${APP_INFO.shortName} 顯示的${displayName}台銀牌告匯率一樣嗎？`,
      answer: `不一樣。出國刷卡使用的是發卡組織（Visa、Mastercard）的清算匯率，再加上發卡銀行的海外交易手續費（通常 1.5%），與臺灣銀行牌告匯率是不同體系。本工具顯示的台銀牌告匯率適用於臨櫃換鈔或外幣帳戶匯款，不代表你出國刷卡時的實際扣款匯率。若出國以刷卡為主，建議另行查詢發卡銀行的海外手續費規定。`,
    },
    // 替代換匯管道 FAQ（如明洞換匯所），僅有 alternativeProviders 的幣別（KRW）會產生條目
    // /krw-twd/ 頁方向為 to-twd（旅客持 KRW 換 TWD），使用 rateBuy 版本 FAQ
    ...buildAlternativeProviderFaq(code, rateExample ?? ({} as RateExample), 'to-twd'),
  ];

  const title = `即時${displayName}對台幣匯率 — 今日台銀實際賣出價 | ${code}/TWD`;
  // description 首句直接給答案（即時賣出價數字＋牌告日期），提升 SERP CTR 與 AI 引用密度。
  const description = rateExample
    ? `台銀${displayName}現金賣出 1 ${code} = ${rateExample.cashSell} TWD（${SEO_RATE_EXAMPLES_DATE} 牌告，每日更新）。換匯前先確認實際要付多少台幣（非中間價）。${persona.hook}${spotAvailable ? '支援現金與即期匯率切換，' : ''}附快速金額按鈕與 7～30 天歷史趨勢圖。`
    : spotAvailable
      ? `即時查看台銀${displayName}現金賣出價（非中間價），換匯前先確認實際要付多少台幣。${persona.hook}支援現金與即期匯率切換，附快速金額按鈕與 7～30 天歷史趨勢圖。`
      : `即時查看台銀${displayName}現金賣出價（非中間價），換匯前先確認實際要付多少台幣。${persona.hook}附快速金額按鈕與 7～30 天歷史趨勢圖。`;

  return {
    currencyCode: code,
    currencyFlag: definition.flag,
    currencyName: displayName,
    title,
    description,
    pathname,
    canonical: canonicalUrl,
    keywords: [
      `${code} TWD 匯率`,
      persona.keyword,
      `${displayName}匯率`,
      `${displayName}換台幣`,
      ...persona.searchQueries,
      '匯率換算',
      APP_INFO.name,
    ],
    jsonLd: [
      buildShareImageJsonLd(
        `${displayName}兌台幣匯率分享圖片`,
        `${APP_INFO.name} ${code}/TWD 即時匯率換算與趨勢`,
      ),
      // WebPage + speakable：標記 answer-first 區塊（h1 與快速答案 h3）供語音搜尋引用。
      buildWebPageJsonLd(title, description, pathname, {
        speakableCssSelectors: ['h1', 'h3'],
      }),
      // 幣別頁只輸出可稽核的匯率數值 schema，避免把 FAQ rich result 訊號擴散到金融頁。
      ...(rateExample
        ? [
            buildExchangeRateSpecificationJsonLd(
              code,
              'TWD',
              rateExample.cashSell,
              `臺灣銀行現金賣出價（買${displayName}所需台幣匯率）`,
            ),
          ]
        : []),
    ],
    faqEntries,
    howToSteps: [
      {
        position: 1,
        name: '選擇原始貨幣',
        text: `在首頁將來源貨幣設定為 ${code}，再選擇 TWD 或其他目標貨幣。可點擊星號收藏常用幣別。`,
      },
      {
        position: 2,
        name: '輸入金額',
        text: `輸入 ${code} 金額、使用計算機鍵盤或點擊快速金額按鈕（如 ${indexablePopularAmounts.slice(0, 3).map(formatAmount).join('、')}），系統即時計算換算結果。`,
      },
      {
        position: 3,
        name: '切換匯率類型',
        text: spotAvailable
          ? '依換匯情境切換現金匯率或即期匯率。臨櫃換鈔選現金，匯款轉帳選即期。'
          : '此幣別以現金牌告為主，換匯前請直接確認現金賣出價並搭配歷史趨勢判斷預算。',
      },
      {
        position: 4,
        name: '查看趨勢與歷史',
        text: '往下捲動即可查看 30 天歷史趨勢卡，幫助判斷換匯時機。',
      },
    ],
    // A03 修正：highlights 收斂為 3 條，其中 2 條來自 persona 特化欄位。
    highlights: [
      persona.cashCulture,
      persona.exchangeChannel,
      spotAvailable
        ? `資料來源：臺灣銀行牌告匯率，現金與即期買入賣出四種報價完整呈現。`
        : `資料來源：臺灣銀行牌告匯率，以${displayName}實際可查得的現金買入賣出報價為準。`,
    ],
    commonAmounts,
    travelTip: persona.travelTip,
    faqTitle: `${displayName}換匯常見問題`,
    direction: 'to-twd' as const,
    // 首位放反向幣對頁互鏈（雙向 URL 互相導流），其後接主題攻略連結。
    relatedGuides: [
      {
        href: `/twd-${code.toLowerCase()}/`,
        label: `台幣換${displayName}`,
        description: `反向查詢：出國前用台幣換${displayName}，以台銀實際賣出價估算換匯預算`,
      },
      ...RELATED_GUIDES_TO_TWD,
    ],
    answerCapsule: buildCurrencyAnswerCapsule(code, displayName, 'to-twd'),
    ...(rateExample?.alternativeProviders
      ? { alternativeProviders: rateExample.alternativeProviders }
      : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 反向幣別頁（TWD→外幣）：出國換匯場景 SSOT
// ─────────────────────────────────────────────────────────────────────────────

export function getReverseCurrencyLandingPageContent(
  code: ReverseCurrencyLandingCode,
): CurrencyLandingPageContent {
  const persona = CURRENCY_PERSONAS[code];
  const reverse = persona.reverse;
  const definition = CURRENCY_DEFINITIONS[code];
  const pathname = `/twd-${code.toLowerCase()}`;
  const displayName = persona.displayName;

  const popularTwdAmounts = INDEXABLE_REVERSE_TWD_AMOUNTS[code.toLowerCase()] ?? [
    ...reverse.popularTwdAmounts,
  ];

  const commonAmounts: CommonAmountEntry[] = popularTwdAmounts.map((amount) => ({
    amount,
    label: `${formatAmount(amount)} TWD`,
    question: `${formatAmount(amount)} 台幣可以換多少${displayName}？`,
  }));

  const canonicalUrl = buildCanonicalUrl(pathname);
  const rateExample = SEO_RATE_EXAMPLES[code];
  const spotAvailable = rateExample?.spotAvailable ?? true;

  const faqEntries: FAQEntry[] = [
    // L1 persona 反向特化 FAQ：出國換匯場景在地事實。
    ...reverse.faqSpecific,
    {
      question: `帶台幣去銀行換${displayName}，要看哪個匯率？`,
      answer: `你帶台幣去銀行買${displayName}現鈔，銀行是在「賣出」外幣給你，需參考台銀牌告的「現金賣出」價。${APP_INFO.shortName} 直接顯示此數字，這才是你實際要付的台幣金額，而非 Google 或 XE 顯示的市場中間價。`,
    },
    {
      question: `${formatAmount(popularTwdAmounts[2] ?? 30000)} 台幣可以換多少${displayName}？`,
      answer: `${buildTwdToForeignRateSentence(code, popularTwdAmounts[2] ?? 30000)}實際匯率以台銀牌告為準，請使用本工具查看 5 分鐘即時更新結果。`,
    },
    {
      question: `出國刷卡跟換現金哪個比較省？`,
      answer: `取決於發卡銀行的海外手續費。部分無手續費卡片搭配Visa/Mastercard清算匯率，整體成本可能低於現金換匯。但現金在特定地區（如泰國、日本）更實用。建議同時準備少量現金加信用卡。`,
    },
    ...(spotAvailable
      ? [
          {
            question: `換${displayName}現金和外幣帳戶匯款哪種匯率較好？`,
            answer: `外幣帳戶使用「即期賣出」匯率，通常優於「現金賣出」，因為銀行省去了現鈔保管與運送成本。如不急需現鈔，透過網銀外幣帳戶換匯通常可省下一些匯差。${APP_INFO.shortName} 可一鍵切換查看兩種報價。`,
          },
        ]
      : []),
    // 替代換匯管道 FAQ（如明洞換匯所），僅 KRW 等有 alternativeProviders 的幣別會產生條目
    // /twd-krw/ 頁方向為 twd-to-foreign（旅客持 TWD 換 KRW），使用 rate（sell 率）版本 FAQ
    ...buildAlternativeProviderFaq(code, rateExample ?? ({} as RateExample), 'twd-to-foreign'),
  ];

  const title = `台幣換${displayName}即時匯率 — 今日台銀現金賣出價 | TWD/${code}`;
  // description 首句直接給答案（即時賣出價＋常見金額換算結果），提升 SERP CTR 與 AI 引用密度。
  const description = rateExample
    ? `台銀現金賣出 1 ${code} = ${rateExample.cashSell} TWD（${SEO_RATE_EXAMPLES_DATE} 牌告），${formatAmount(rateExample.exampleTWD)} 台幣約可換 ${formatAmount(Math.round(rateExample.exampleTWD / rateExample.cashSell))} ${code}。出國換${displayName}前先用實際賣出價（非中間價）估算預算。${persona.hook}${spotAvailable ? '支援現金與即期匯率切換，' : ''}附快速金額按鈕與 7～30 天歷史趨勢圖。`
    : spotAvailable
      ? `出國換${displayName}前，先用台銀實際現金賣出價（非中間價）估算換匯預算。${persona.hook}支援現金與即期匯率切換，附快速金額按鈕與 7～30 天歷史趨勢圖。`
      : `出國換${displayName}前，先用台銀實際現金賣出價（非中間價）估算換匯預算。${persona.hook}附快速金額按鈕與 7～30 天歷史趨勢圖。`;

  return {
    currencyCode: code,
    currencyFlag: definition.flag,
    currencyName: displayName,
    title,
    description,
    pathname,
    canonical: canonicalUrl,
    keywords: [
      reverse.keyword,
      `TWD ${code} 匯率`,
      `台幣換${displayName}`,
      `${displayName}匯率今日`,
      ...reverse.searchQueries,
      '換匯計算',
      APP_INFO.name,
    ],
    jsonLd: [
      buildShareImageJsonLd(
        `台幣換${displayName}匯率分享圖片`,
        `${APP_INFO.name} TWD/${code} 出國換匯即時計算`,
      ),
      // WebPage + speakable：標記 answer-first 區塊（h1 與快速答案 h3）供語音搜尋引用。
      buildWebPageJsonLd(title, description, pathname, {
        speakableCssSelectors: ['h1', 'h3'],
      }),
      // 反向幣別頁同樣只輸出可稽核的匯率數值 schema。
      // 反向頁（TWD→外幣）：currency 為 TWD，priceCurrency 為外幣代碼。
      ...(rateExample
        ? [
            buildExchangeRateSpecificationJsonLd(
              'TWD',
              code,
              Number((1 / rateExample.cashSell).toFixed(6)),
              `臺灣銀行現金賣出價（台幣換${displayName}匯率）`,
            ),
          ]
        : []),
    ],
    faqEntries,
    howToSteps: [
      {
        position: 1,
        name: '選擇換算方向',
        text: `進入 ${APP_INFO.shortName} 首頁，設定來源貨幣為 TWD，目標貨幣選 ${code}。`,
      },
      {
        position: 2,
        name: '輸入台幣金額',
        text: `輸入你想換出的台幣金額，或使用快速金額按鈕（如 ${popularTwdAmounts.slice(0, 3).map(formatAmount).join('、')} 台幣），系統即時顯示可換到的${displayName}。`,
      },
      {
        position: 3,
        name: '確認匯率類型',
        text: spotAvailable
          ? '確認使用「現金匯率」（臨櫃換鈔）或「即期匯率」（網銀外幣帳戶）。兩者費率不同，請依換匯方式選擇。'
          : '此幣別以現金牌告為主，出國前請直接確認現金賣出價並搭配歷史趨勢安排換匯節奏。',
      },
      {
        position: 4,
        name: '觀察趨勢，決定換匯時機',
        text: '往下捲動查看 30 天歷史趨勢卡，了解近期匯率高低區間，協助判斷換匯時機。',
      },
    ],
    // A03 修正：highlights 收斂為 3 條，其中 2 條來自 persona 特化欄位。
    highlights: [
      `帶台幣換${displayName}現鈔看台銀「現金賣出」價：這是實際費率，不是 Google 顯示的中間價。`,
      persona.denominationTip,
      persona.exchangeChannel,
    ],
    commonAmounts,
    travelTip: reverse.travelTip,
    faqTitle: `台幣換${displayName}常見問題`,
    direction: 'twd-to-foreign' as const,
    // 首位放正向幣對頁互鏈（雙向 URL 互相導流），其後接主題攻略連結。
    relatedGuides: [
      {
        href: `/${code.toLowerCase()}-twd/`,
        label: `${displayName}換台幣`,
        description: `反向查詢：${displayName}對台幣即時匯率，換回台幣看台銀現金買入價`,
      },
      ...RELATED_GUIDES_TWD_TO_FOREIGN,
    ],
    answerCapsule: buildCurrencyAnswerCapsule(code, displayName, 'twd-to-foreign'),
    ...(rateExample?.alternativeProviders
      ? { alternativeProviders: rateExample.alternativeProviders }
      : {}),
  };
}
