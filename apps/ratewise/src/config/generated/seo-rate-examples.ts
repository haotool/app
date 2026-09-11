/**
 * SEO 匯差範例數據（自動生成）
 *
 * 由 scripts/update-seo-rate-examples.mjs 生成，請勿手動編輯。
 * 每日由 GitHub Actions 自動更新並提交。
 *
 * 資料來源：
 *   - 台灣銀行牌告匯率（現金買入/賣出）
 *   - open.er-api.com 市場中間價（與 Google Morningstar / XE / Wise / Apple Yahoo Finance 基準一致）
 * 雙重驗證：open.er-api.com 中間價 vs 台銀自身 (買入+賣出)/2 中間價，差距須在 2% 以內。
 * 匯率時間：2026/09/11 08:29:20
 * 生成日期：2026-09-11
 */

/** 替代換匯管道資訊（如明洞換匯所） */
export interface AlternativeProvider {
  /** 換匯所名稱（繁體中文） */
  name: string;
  /** 換匯所英文名稱 */
  nameEn: string;
  /** 匯率：1 TWD 可換得多少外幣（以 KRW 為例：46.0 表示 1 TWD = 46 KRW） */
  rate: number;
  /** 反向匯率：1 單位外幣 = N TWD（= 1/rate，計算值，非換匯所實際買入報價） */
  rateInverse: number;
  /** 換匯所實際買入報價：持外幣換 TWD 的到手匯率（KRW→TWD 方向使用此欄位） */
  rateBuy?: number;
  /** 資料來源名稱 */
  source: string;
  /** 資料來源 URL */
  sourceUrl: string;
  /** 匯率更新日期（YYYY-MM-DD） */
  rateDate: string;
  /** 適用說明備注 */
  note: string;
}

export interface RateExample {
  /** 換匯情境用的台幣金額（固定 30000） */
  exampleTWD: number;
  /** 以台銀現金賣出匯率可兌換的外幣數量（實際到手） */
  foreignAtCash: number;
  /** 以市場中間價換算的外幣數量（Google/XE/Wise/Apple 等工具顯示） */
  foreignAtMarketMid: number;
  /** 以台銀自身中間價換算的外幣數量（雙重驗證用，null 代表無現金買入資料） */
  foreignAtBankMid: number | null;
  /** 中間價高估的外幣數量（foreignAtMarketMid - foreignAtCash，使用者預期多換到但實際拿不到） */
  diffForeign: number;
  /** 現金賣出 vs 市場中間價，等值多付約 N 元新台幣 */
  diffTWD: number;
  /** 差距百分比（四捨五入到小數一位） */
  diffPct: number;
  /** 台灣銀行現金賣出匯率（每 1 單位外幣 = N 台幣） */
  cashSell: number;
  /** 市場中間匯率（open.er-api.com，每 1 單位外幣 = N 台幣） */
  marketMid: number;
  /** 台銀自身現金中間價（(買入+賣出)/2，雙重驗證用，null 代表無現金買入資料） */
  bankMid: number | null;
  /** 台灣銀行是否提供即期賣出匯率（true = 有即期報價；false = 現金專屬幣別） */
  spotAvailable: boolean;
  /** 替代換匯管道（如明洞換匯所），僅特定幣別有此欄位 */
  alternativeProviders?: AlternativeProvider[];
}

/** 各幣別匯差範例：換 3 萬元新台幣，台銀現金賣出 vs 市場中間價（Google/XE/Wise/Apple）差距 */
export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {
  USD: {
    exampleTWD: 30000,
    foreignAtCash: 943,
    foreignAtMarketMid: 949,
    foreignAtBankMid: 953,
    diffForeign: 6,
    diffTWD: 189,
    diffPct: 0.6,
    cashSell: 31.82,
    marketMid: 31.619554,
    bankMid: 31.485,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144370,
    foreignAtMarketMid: 146287,
    foreignAtBankMid: 148957,
    diffForeign: 1917,
    diffTWD: 393,
    diffPct: 1.3,
    cashSell: 0.2078,
    marketMid: 0.205076,
    bankMid: 0.2014,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 807,
    foreignAtMarketMid: 817,
    foreignAtBankMid: 822,
    diffForeign: 10,
    diffTWD: 344,
    diffPct: 1.2,
    cashSell: 37.16,
    marketMid: 36.733644,
    bankMid: 36.49,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 702,
    foreignAtBankMid: 706,
    diffForeign: 13,
    diffTWD: 550,
    diffPct: 1.9,
    cashSell: 43.55,
    marketMid: 42.751486,
    bankMid: 42.49,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6293,
    foreignAtMarketMid: 6399,
    foreignAtBankMid: 6402,
    diffForeign: 106,
    diffTWD: 496,
    diffPct: 1.7,
    cashSell: 4.767,
    marketMid: 4.688233,
    bankMid: 4.686,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1174168,
    foreignAtMarketMid: 1278043,
    foreignAtBankMid: 1271186,
    diffForeign: 103875,
    diffTWD: 2438,
    diffPct: 8.8,
    cashSell: 0.02555,
    marketMid: 0.023473,
    bankMid: 0.0236,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.6,
        rateBuy: 42,
        rateInverse: 0.024038,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-11',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7367,
    foreignAtMarketMid: 7439,
    foreignAtBankMid: 7557,
    diffForeign: 72,
    diffTWD: 291,
    diffPct: 1,
    cashSell: 4.072,
    marketMid: 4.032567,
    bankMid: 3.97,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1305,
    foreignAtMarketMid: 1323,
    foreignAtBankMid: 1328,
    diffForeign: 18,
    diffTWD: 406,
    diffPct: 1.4,
    cashSell: 22.98,
    marketMid: 22.669054,
    bankMid: 22.59,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1312,
    foreignAtBankMid: 1317,
    diffForeign: 21,
    diffTWD: 479,
    diffPct: 1.6,
    cashSell: 23.24,
    marketMid: 22.869166,
    bankMid: 22.785,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1202,
    foreignAtBankMid: 1212,
    diffForeign: 12,
    diffTWD: 303,
    diffPct: 1,
    cashSell: 25.21,
    marketMid: 24.955704,
    bankMid: 24.755,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 765,
    foreignAtMarketMid: 770,
    foreignAtBankMid: 777,
    diffForeign: 5,
    diffTWD: 189,
    diffPct: 0.6,
    cashSell: 39.2,
    marketMid: 38.952945,
    bankMid: 38.6,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1605,
    foreignAtMarketMid: 1632,
    foreignAtBankMid: 1642,
    diffForeign: 27,
    diffTWD: 502,
    diffPct: 1.7,
    cashSell: 18.69,
    marketMid: 18.377286,
    bankMid: 18.265,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29618,
    foreignAtMarketMid: 31324,
    foreignAtBankMid: 32683,
    diffForeign: 1706,
    diffTWD: 1634,
    diffPct: 5.8,
    cashSell: 1.0129,
    marketMid: 0.957738,
    bankMid: 0.9179,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52641,
    foreignAtMarketMid: 59445,
    foreignAtBankMid: 59536,
    diffForeign: 6804,
    diffTWD: 3434,
    diffPct: 12.9,
    cashSell: 0.5699,
    marketMid: 0.504666,
    bankMid: 0.5039,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16641344,
    foreignAtBankMid: 17341040,
    diffForeign: 2218267,
    diffTWD: 3999,
    diffPct: 15.4,
    cashSell: 0.00208,
    marketMid: 0.001803,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3632,
    foreignAtMarketMid: 3862,
    foreignAtBankMid: 4001,
    diffForeign: 230,
    diffTWD: 1788,
    diffPct: 6.3,
    cashSell: 8.26,
    marketMid: 7.767775,
    bankMid: 7.4975,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24518252,
    foreignAtBankMid: 25531915,
    diffForeign: 2779122,
    diffTWD: 3400,
    diffPct: 12.8,
    cashSell: 0.00138,
    marketMid: 0.001224,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/11 08:29:20';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-11';
