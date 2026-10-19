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
 * 匯率時間：2026/10/19 14:57:26
 * 生成日期：2026-10-19
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
    foreignAtMarketMid: 925,
    foreignAtBankMid: 924,
    diffForeign: 10,
    diffTWD: 323,
    diffPct: 1.1,
    cashSell: 32.8,
    cashBuy: 32.13,
    marketMid: 32.446463,
    bankMid: 32.465,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143266,
    foreignAtMarketMid: 146150,
    foreignAtBankMid: 147783,
    diffForeign: 2884,
    diffTWD: 592,
    diffPct: 2,
    cashSell: 0.2094,
    cashBuy: 0.1966,
    marketMid: 0.205269,
    bankMid: 0.203,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 810,
    foreignAtMarketMid: 824,
    foreignAtBankMid: 825,
    diffForeign: 14,
    diffTWD: 530,
    diffPct: 1.8,
    cashSell: 37.04,
    cashBuy: 35.7,
    marketMid: 36.38613,
    bankMid: 36.37,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 677,
    foreignAtMarketMid: 695,
    foreignAtBankMid: 694,
    diffForeign: 18,
    diffTWD: 746,
    diffPct: 2.5,
    cashSell: 44.29,
    cashBuy: 42.17,
    marketMid: 43.189082,
    bankMid: 43.23,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6080,
    foreignAtMarketMid: 6201,
    foreignAtBankMid: 6182,
    diffForeign: 121,
    diffTWD: 584,
    diffPct: 2,
    cashSell: 4.934,
    cashBuy: 4.772,
    marketMid: 4.837929,
    bankMid: 4.853,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1127820,
    foreignAtMarketMid: 1233602,
    foreignAtBankMid: 1217039,
    diffForeign: 105782,
    diffTWD: 2573,
    diffPct: 9.4,
    cashSell: 0.0266,
    cashBuy: 0.0227,
    marketMid: 0.024319,
    bankMid: 0.02465,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.7,
        rateBuy: 41.2,
        rateInverse: 0.02457,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-19',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7156,
    foreignAtMarketMid: 7264,
    foreignAtBankMid: 7335,
    diffForeign: 108,
    diffTWD: 444,
    diffPct: 1.5,
    cashSell: 4.192,
    cashBuy: 3.988,
    marketMid: 4.12991,
    bankMid: 4.09,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1300,
    foreignAtMarketMid: 1327,
    foreignAtBankMid: 1322,
    diffForeign: 27,
    diffTWD: 621,
    diffPct: 2.1,
    cashSell: 23.08,
    cashBuy: 22.3,
    marketMid: 22.601935,
    bankMid: 22.69,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1277,
    foreignAtMarketMid: 1309,
    foreignAtBankMid: 1302,
    diffForeign: 32,
    diffTWD: 730,
    diffPct: 2.5,
    cashSell: 23.49,
    cashBuy: 22.58,
    marketMid: 22.918433,
    bankMid: 23.035,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1165,
    foreignAtMarketMid: 1185,
    foreignAtBankMid: 1186,
    diffForeign: 20,
    diffTWD: 513,
    diffPct: 1.7,
    cashSell: 25.76,
    cashBuy: 24.85,
    marketMid: 25.319661,
    bankMid: 25.305,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 752,
    foreignAtMarketMid: 763,
    foreignAtBankMid: 764,
    diffForeign: 11,
    diffTWD: 426,
    diffPct: 1.4,
    cashSell: 39.88,
    cashBuy: 38.68,
    marketMid: 39.314358,
    bankMid: 39.28,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1596,
    foreignAtMarketMid: 1635,
    foreignAtBankMid: 1633,
    diffForeign: 39,
    diffTWD: 728,
    diffPct: 2.5,
    cashSell: 18.8,
    cashBuy: 17.95,
    marketMid: 18.343912,
    bankMid: 18.375,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29098,
    foreignAtMarketMid: 30950,
    foreignAtBankMid: 32051,
    diffForeign: 1852,
    diffTWD: 1795,
    diffPct: 6.4,
    cashSell: 1.031,
    cashBuy: 0.841,
    marketMid: 0.969316,
    bankMid: 0.936,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51529,
    foreignAtMarketMid: 58315,
    foreignAtBankMid: 58117,
    diffForeign: 6786,
    diffTWD: 3491,
    diffPct: 13.2,
    cashSell: 0.5822,
    cashBuy: 0.4502,
    marketMid: 0.514449,
    bankMid: 0.5162,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16689752,
    foreignAtBankMid: 16853933,
    diffForeign: 2605245,
    diffTWD: 4683,
    diffPct: 18.5,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001798,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3542,
    foreignAtMarketMid: 3780,
    foreignAtBankMid: 3892,
    diffForeign: 238,
    diffTWD: 1888,
    diffPct: 6.7,
    cashSell: 8.47,
    cashBuy: 6.945,
    marketMid: 7.936949,
    bankMid: 7.7075,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23890253,
    foreignAtBankMid: 24291498,
    diffForeign: 3056920,
    diffTWD: 3839,
    diffPct: 14.7,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001256,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/19 14:57:26';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-19';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-19';
