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
 * 匯率時間：2026/04/23 12:22:40
 * 生成日期：2026-04-23
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
  /** 替代換匯管道（如明洞換匯所），僅特定幣別有此欄位 */
  alternativeProviders?: AlternativeProvider[];
}

/** 各幣別匯差範例：換 3 萬元新台幣，台銀現金賣出 vs 市場中間價（Google/XE/Wise/Apple）差距 */
export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {
  USD: {
    exampleTWD: 30000,
    foreignAtCash: 943,
    foreignAtMarketMid: 953,
    foreignAtBankMid: 953,
    diffForeign: 10,
    diffTWD: 310,
    diffPct: 1,
    cashSell: 31.82,
    marketMid: 31.491104,
    bankMid: 31.485,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149031,
    foreignAtMarketMid: 151876,
    foreignAtBankMid: 153925,
    diffForeign: 2845,
    diffTWD: 562,
    diffPct: 1.9,
    cashSell: 0.2013,
    marketMid: 0.19753,
    bankMid: 0.1949,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 802,
    foreignAtMarketMid: 812,
    foreignAtBankMid: 816,
    diffForeign: 10,
    diffTWD: 373,
    diffPct: 1.3,
    cashSell: 37.42,
    marketMid: 36.954915,
    bankMid: 36.75,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 690,
    foreignAtMarketMid: 705,
    foreignAtBankMid: 707,
    diffForeign: 15,
    diffTWD: 650,
    diffPct: 2.2,
    cashSell: 43.47,
    marketMid: 42.527856,
    bankMid: 42.41,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6410,
    foreignAtMarketMid: 6510,
    foreignAtBankMid: 6523,
    diffForeign: 100,
    diffTWD: 460,
    diffPct: 1.6,
    cashSell: 4.68,
    marketMid: 4.608295,
    bankMid: 4.599,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1280410,
    foreignAtMarketMid: 1408472,
    foreignAtBankMid: 1396648,
    diffForeign: 128062,
    diffTWD: 2728,
    diffPct: 10,
    cashSell: 0.02343,
    marketMid: 0.0213,
    bankMid: 0.02148,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.15,
        rateBuy: 45.4,
        rateInverse: 0.022148,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-23',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7360,
    foreignAtMarketMid: 7463,
    foreignAtBankMid: 7549,
    diffForeign: 103,
    diffTWD: 413,
    diffPct: 1.4,
    cashSell: 4.076,
    marketMid: 4.019939,
    bankMid: 3.974,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1309,
    foreignAtMarketMid: 1331,
    foreignAtBankMid: 1332,
    diffForeign: 22,
    diffTWD: 475,
    diffPct: 1.6,
    cashSell: 22.91,
    marketMid: 22.547406,
    bankMid: 22.52,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1278,
    foreignAtMarketMid: 1302,
    foreignAtBankMid: 1303,
    diffForeign: 24,
    diffTWD: 554,
    diffPct: 1.9,
    cashSell: 23.48,
    marketMid: 23.046785,
    bankMid: 23.025,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1198,
    foreignAtMarketMid: 1215,
    foreignAtBankMid: 1220,
    diffForeign: 17,
    diffTWD: 411,
    diffPct: 1.4,
    cashSell: 25.04,
    marketMid: 24.696846,
    bankMid: 24.585,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 740,
    foreignAtMarketMid: 745,
    foreignAtBankMid: 751,
    diffForeign: 5,
    diffTWD: 199,
    diffPct: 0.7,
    cashSell: 40.54,
    marketMid: 40.270619,
    bankMid: 39.94,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1586,
    foreignAtMarketMid: 1613,
    foreignAtBankMid: 1622,
    diffForeign: 27,
    diffTWD: 508,
    diffPct: 1.7,
    cashSell: 18.92,
    marketMid: 18.599461,
    bankMid: 18.495,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28969,
    foreignAtMarketMid: 30698,
    foreignAtBankMid: 31895,
    diffForeign: 1729,
    diffTWD: 1690,
    diffPct: 6,
    cashSell: 1.0356,
    marketMid: 0.977262,
    bankMid: 0.9406,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51081,
    foreignAtMarketMid: 57345,
    foreignAtBankMid: 57548,
    diffForeign: 6264,
    diffTWD: 3277,
    diffPct: 12.3,
    cashSell: 0.5873,
    marketMid: 0.52315,
    bankMid: 0.5213,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16360124,
    foreignAtBankMid: 16393443,
    diffForeign: 2598656,
    diffTWD: 4765,
    diffPct: 18.9,
    cashSell: 0.00218,
    marketMid: 0.001834,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3548,
    foreignAtMarketMid: 3768,
    foreignAtBankMid: 3899,
    diffForeign: 220,
    diffTWD: 1753,
    diffPct: 6.2,
    cashSell: 8.456,
    marketMid: 7.96191,
    bankMid: 7.6935,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24996547,
    foreignAtBankMid: 25531915,
    diffForeign: 3257417,
    diffTWD: 3909,
    diffPct: 15,
    cashSell: 0.00138,
    marketMid: 0.0012,
    bankMid: 0.001175,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/23 12:22:40';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-23';
