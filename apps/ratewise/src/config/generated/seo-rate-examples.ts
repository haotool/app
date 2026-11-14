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
 * 匯率時間：2026/11/14 02:43:55
 * 生成日期：2026-11-14
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
    foreignAtCash: 906,
    foreignAtMarketMid: 911,
    foreignAtBankMid: 915,
    diffForeign: 5,
    diffTWD: 166,
    diffPct: 0.6,
    cashSell: 33.105,
    cashBuy: 32.435,
    marketMid: 32.921811,
    bankMid: 32.77,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143541,
    foreignAtMarketMid: 145667,
    foreignAtBankMid: 148075,
    diffForeign: 2126,
    diffTWD: 438,
    diffPct: 1.5,
    cashSell: 0.209,
    cashBuy: 0.1962,
    marketMid: 0.205949,
    bankMid: 0.2026,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 816,
    foreignAtMarketMid: 825,
    foreignAtBankMid: 831,
    diffForeign: 9,
    diffTWD: 322,
    diffPct: 1.1,
    cashSell: 36.75,
    cashBuy: 35.41,
    marketMid: 36.355704,
    bankMid: 36.08,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 677,
    foreignAtMarketMid: 690,
    foreignAtBankMid: 694,
    diffForeign: 13,
    diffTWD: 544,
    diffPct: 1.8,
    cashSell: 44.31,
    cashBuy: 42.19,
    marketMid: 43.506635,
    bankMid: 43.25,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6014,
    foreignAtMarketMid: 6084,
    foreignAtBankMid: 6114,
    diffForeign: 70,
    diffTWD: 343,
    diffPct: 1.2,
    cashSell: 4.988,
    cashBuy: 4.826,
    marketMid: 4.930966,
    bankMid: 4.907,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1122334,
    foreignAtMarketMid: 1218279,
    foreignAtBankMid: 1210654,
    diffForeign: 95945,
    diffTWD: 2363,
    diffPct: 8.5,
    cashSell: 0.02673,
    cashBuy: 0.02283,
    marketMid: 0.024625,
    bankMid: 0.02478,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.2,
        rateBuy: 42,
        rateInverse: 0.024272,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-14',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7085,
    foreignAtMarketMid: 7153,
    foreignAtBankMid: 7260,
    diffForeign: 68,
    diffTWD: 282,
    diffPct: 0.9,
    cashSell: 4.234,
    cashBuy: 4.03,
    marketMid: 4.194156,
    bankMid: 4.132,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1325,
    foreignAtMarketMid: 1344,
    foreignAtBankMid: 1348,
    diffForeign: 19,
    diffTWD: 444,
    diffPct: 1.5,
    cashSell: 22.65,
    cashBuy: 21.87,
    marketMid: 22.314455,
    bankMid: 22.26,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1279,
    foreignAtMarketMid: 1300,
    foreignAtBankMid: 1305,
    diffForeign: 21,
    diffTWD: 468,
    diffPct: 1.6,
    cashSell: 23.45,
    cashBuy: 22.54,
    marketMid: 23.084559,
    bankMid: 22.995,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1161,
    foreignAtMarketMid: 1174,
    foreignAtBankMid: 1182,
    diffForeign: 13,
    diffTWD: 328,
    diffPct: 1.1,
    cashSell: 25.83,
    cashBuy: 24.92,
    marketMid: 25.548005,
    bankMid: 25.375,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 759,
    foreignAtMarketMid: 764,
    foreignAtBankMid: 771,
    diffForeign: 5,
    diffTWD: 213,
    diffPct: 0.7,
    cashSell: 39.53,
    cashBuy: 38.33,
    marketMid: 39.249549,
    bankMid: 38.93,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1620,
    foreignAtMarketMid: 1649,
    foreignAtBankMid: 1658,
    diffForeign: 29,
    diffTWD: 523,
    diffPct: 1.8,
    cashSell: 18.52,
    cashBuy: 17.67,
    marketMid: 18.197038,
    bankMid: 18.095,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29106,
    foreignAtMarketMid: 30894,
    foreignAtBankMid: 32062,
    diffForeign: 1788,
    diffTWD: 1736,
    diffPct: 6.1,
    cashSell: 1.0307,
    cashBuy: 0.8407,
    marketMid: 0.97106,
    bankMid: 0.9357,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51680,
    foreignAtMarketMid: 58192,
    foreignAtBankMid: 58309,
    diffForeign: 6512,
    diffTWD: 3358,
    diffPct: 12.6,
    cashSell: 0.5805,
    cashBuy: 0.4485,
    marketMid: 0.515531,
    bankMid: 0.5145,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16614948,
    foreignAtBankMid: 16393443,
    diffForeign: 2853480,
    diffTWD: 5152,
    diffPct: 20.7,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001806,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3516,
    foreignAtMarketMid: 3729,
    foreignAtBankMid: 3861,
    diffForeign: 213,
    diffTWD: 1715,
    diffPct: 6.1,
    cashSell: 8.533,
    cashBuy: 7.008,
    marketMid: 8.045117,
    bankMid: 7.7705,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23464372,
    foreignAtBankMid: 24291498,
    diffForeign: 2631039,
    diffTWD: 3364,
    diffPct: 12.6,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001279,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/14 02:43:55';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-14';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-14';
