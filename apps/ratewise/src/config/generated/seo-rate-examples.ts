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
 * 匯率時間：2026/11/24 18:17:10
 * 生成日期：2026-11-24
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
    foreignAtCash: 903,
    foreignAtMarketMid: 913,
    foreignAtBankMid: 913,
    diffForeign: 10,
    diffTWD: 321,
    diffPct: 1.1,
    cashSell: 33.21,
    cashBuy: 32.54,
    marketMid: 32.854749,
    bankMid: 32.875,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142789,
    foreignAtMarketMid: 144897,
    foreignAtBankMid: 147275,
    diffForeign: 2108,
    diffTWD: 436,
    diffPct: 1.5,
    cashSell: 0.2101,
    cashBuy: 0.1973,
    marketMid: 0.207044,
    bankMid: 0.2037,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 821,
    foreignAtMarketMid: 834,
    foreignAtBankMid: 836,
    diffForeign: 13,
    diffTWD: 464,
    diffPct: 1.6,
    cashSell: 36.54,
    cashBuy: 35.2,
    marketMid: 35.975105,
    bankMid: 35.87,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 682,
    foreignAtMarketMid: 698,
    foreignAtBankMid: 699,
    diffForeign: 16,
    diffTWD: 677,
    diffPct: 2.3,
    cashSell: 43.97,
    cashBuy: 41.85,
    marketMid: 42.97748,
    bankMid: 42.91,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5990,
    foreignAtMarketMid: 6078,
    foreignAtBankMid: 6089,
    diffForeign: 88,
    diffTWD: 432,
    diffPct: 1.5,
    cashSell: 5.008,
    cashBuy: 4.846,
    marketMid: 4.935834,
    bankMid: 4.927,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1124438,
    foreignAtMarketMid: 1227665,
    foreignAtBankMid: 1213101,
    diffForeign: 103227,
    diffTWD: 2523,
    diffPct: 9.2,
    cashSell: 0.02668,
    cashBuy: 0.02278,
    marketMid: 0.024437,
    bankMid: 0.02473,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.2,
        rateBuy: 41.5,
        rateInverse: 0.024272,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-24',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7060,
    foreignAtMarketMid: 7148,
    foreignAtBankMid: 7234,
    diffForeign: 88,
    diffTWD: 365,
    diffPct: 1.2,
    cashSell: 4.249,
    cashBuy: 4.045,
    marketMid: 4.197254,
    bankMid: 4.147,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1350,
    foreignAtMarketMid: 1378,
    foreignAtBankMid: 1374,
    diffForeign: 28,
    diffTWD: 626,
    diffPct: 2.1,
    cashSell: 22.23,
    cashBuy: 21.45,
    marketMid: 21.766101,
    bankMid: 21.84,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1283,
    foreignAtMarketMid: 1309,
    foreignAtBankMid: 1309,
    diffForeign: 26,
    diffTWD: 584,
    diffPct: 2,
    cashSell: 23.38,
    cashBuy: 22.47,
    marketMid: 22.924738,
    bankMid: 22.925,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1161,
    foreignAtMarketMid: 1177,
    foreignAtBankMid: 1181,
    diffForeign: 16,
    diffTWD: 414,
    diffPct: 1.4,
    cashSell: 25.85,
    cashBuy: 24.94,
    marketMid: 25.493295,
    bankMid: 25.395,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 758,
    foreignAtMarketMid: 766,
    foreignAtBankMid: 770,
    diffForeign: 8,
    diffTWD: 312,
    diffPct: 1.1,
    cashSell: 39.56,
    cashBuy: 38.36,
    marketMid: 39.148137,
    bankMid: 38.96,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1637,
    foreignAtMarketMid: 1677,
    foreignAtBankMid: 1676,
    diffForeign: 40,
    diffTWD: 714,
    diffPct: 2.4,
    cashSell: 18.33,
    cashBuy: 17.48,
    marketMid: 17.893889,
    bankMid: 17.905,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29047,
    foreignAtMarketMid: 31017,
    foreignAtBankMid: 31990,
    diffForeign: 1970,
    diffTWD: 1905,
    diffPct: 6.8,
    cashSell: 1.0328,
    cashBuy: 0.8428,
    marketMid: 0.967226,
    bankMid: 0.9378,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51493,
    foreignAtMarketMid: 58348,
    foreignAtBankMid: 58072,
    diffForeign: 6855,
    diffTWD: 3524,
    diffPct: 13.3,
    cashSell: 0.5826,
    cashBuy: 0.4506,
    marketMid: 0.514161,
    bankMid: 0.5166,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16631724,
    foreignAtBankMid: 16393443,
    diffForeign: 2870256,
    diffTWD: 5177,
    diffPct: 20.9,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001804,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3527,
    foreignAtMarketMid: 3762,
    foreignAtBankMid: 3875,
    diffForeign: 235,
    diffTWD: 1875,
    diffPct: 6.7,
    cashSell: 8.505,
    cashBuy: 6.98,
    marketMid: 7.973464,
    bankMid: 7.7425,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23526421,
    foreignAtBankMid: 24291498,
    diffForeign: 2693088,
    diffTWD: 3434,
    diffPct: 12.9,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001275,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/24 18:17:10';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-24';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-24';
