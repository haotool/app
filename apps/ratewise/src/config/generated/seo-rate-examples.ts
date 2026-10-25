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
 * 匯率時間：2026/10/24 06:37:07
 * 生成日期：2026-10-25
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
  /** 台灣銀行現金買入匯率（未提供時省略） */
  cashBuy?: number;
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
    foreignAtCash: 915,
    foreignAtMarketMid: 921,
    foreignAtBankMid: 925,
    diffForeign: 6,
    diffTWD: 175,
    diffPct: 0.6,
    cashSell: 32.775,
    cashBuy: 32.105,
    marketMid: 32.583904,
    bankMid: 32.44,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142248,
    foreignAtMarketMid: 144457,
    foreignAtBankMid: 146699,
    diffForeign: 2209,
    diffTWD: 459,
    diffPct: 1.6,
    cashSell: 0.2109,
    cashBuy: 0.1981,
    marketMid: 0.207674,
    bankMid: 0.2045,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 812,
    foreignAtMarketMid: 822,
    foreignAtBankMid: 827,
    diffForeign: 10,
    diffTWD: 369,
    diffPct: 1.2,
    cashSell: 36.95,
    cashBuy: 35.61,
    marketMid: 36.495018,
    bankMid: 36.28,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 676,
    foreignAtMarketMid: 689,
    foreignAtBankMid: 692,
    diffForeign: 13,
    diffTWD: 565,
    diffPct: 1.9,
    cashSell: 44.41,
    cashBuy: 42.29,
    marketMid: 43.572985,
    bankMid: 43.35,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6072,
    foreignAtMarketMid: 6150,
    foreignAtBankMid: 6173,
    diffForeign: 78,
    diffTWD: 382,
    diffPct: 1.3,
    cashSell: 4.941,
    cashBuy: 4.779,
    marketMid: 4.878049,
    bankMid: 4.86,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1122754,
    foreignAtMarketMid: 1219502,
    foreignAtBankMid: 1211143,
    diffForeign: 96748,
    diffTWD: 2380,
    diffPct: 8.6,
    cashSell: 0.02672,
    cashBuy: 0.02282,
    marketMid: 0.0246,
    bankMid: 0.02477,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.3,
        rateBuy: 41,
        rateInverse: 0.024814,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-25',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7155,
    foreignAtMarketMid: 7222,
    foreignAtBankMid: 7333,
    diffForeign: 67,
    diffTWD: 278,
    diffPct: 0.9,
    cashSell: 4.193,
    cashBuy: 3.989,
    marketMid: 4.154135,
    bankMid: 4.091,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1290,
    foreignAtMarketMid: 1309,
    foreignAtBankMid: 1312,
    diffForeign: 19,
    diffTWD: 445,
    diffPct: 1.5,
    cashSell: 23.26,
    cashBuy: 22.48,
    marketMid: 22.915282,
    bankMid: 22.87,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1269,
    foreignAtMarketMid: 1289,
    foreignAtBankMid: 1294,
    diffForeign: 20,
    diffTWD: 474,
    diffPct: 1.6,
    cashSell: 23.64,
    cashBuy: 22.73,
    marketMid: 23.266094,
    bankMid: 23.185,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1165,
    foreignAtMarketMid: 1177,
    foreignAtBankMid: 1186,
    diffForeign: 12,
    diffTWD: 319,
    diffPct: 1.1,
    cashSell: 25.76,
    cashBuy: 24.85,
    marketMid: 25.486148,
    bankMid: 25.305,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 754,
    foreignAtMarketMid: 759,
    foreignAtBankMid: 766,
    diffForeign: 5,
    diffTWD: 204,
    diffPct: 0.7,
    cashSell: 39.79,
    cashBuy: 38.59,
    marketMid: 39.519444,
    bankMid: 39.19,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1587,
    foreignAtMarketMid: 1616,
    foreignAtBankMid: 1624,
    diffForeign: 29,
    diffTWD: 525,
    diffPct: 1.8,
    cashSell: 18.9,
    cashBuy: 18.05,
    marketMid: 18.569412,
    bankMid: 18.475,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29294,
    foreignAtMarketMid: 31087,
    foreignAtBankMid: 32289,
    diffForeign: 1793,
    diffTWD: 1730,
    diffPct: 6.1,
    cashSell: 1.0241,
    cashBuy: 0.8341,
    marketMid: 0.965044,
    bankMid: 0.9291,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51975,
    foreignAtMarketMid: 58601,
    foreignAtBankMid: 58685,
    diffForeign: 6626,
    diffTWD: 3392,
    diffPct: 12.7,
    cashSell: 0.5772,
    cashBuy: 0.4452,
    marketMid: 0.511937,
    bankMid: 0.5112,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16652040,
    foreignAtBankMid: 16393443,
    diffForeign: 2890572,
    diffTWD: 5208,
    diffPct: 21,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001802,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3548,
    foreignAtMarketMid: 3764,
    foreignAtBankMid: 3899,
    diffForeign: 216,
    diffTWD: 1720,
    diffPct: 6.1,
    cashSell: 8.456,
    cashBuy: 6.931,
    marketMid: 7.971176,
    bankMid: 7.6935,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 23787174,
    foreignAtBankMid: 24691358,
    diffForeign: 2660413,
    diffTWD: 3355,
    diffPct: 12.6,
    cashSell: 0.00142,
    cashBuy: 0.00101,
    marketMid: 0.001261,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/24 06:37:07';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-24';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-25';
