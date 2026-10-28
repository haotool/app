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
 * 匯率時間：2026/10/28 13:58:39
 * 生成日期：2026-10-28
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
    foreignAtCash: 916,
    foreignAtMarketMid: 925,
    foreignAtBankMid: 925,
    diffForeign: 9,
    diffTWD: 289,
    diffPct: 1,
    cashSell: 32.755,
    cashBuy: 32.085,
    marketMid: 32.439096,
    bankMid: 32.42,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143198,
    foreignAtMarketMid: 146056,
    foreignAtBankMid: 147710,
    diffForeign: 2858,
    diffTWD: 587,
    diffPct: 2,
    cashSell: 0.2095,
    cashBuy: 0.1967,
    marketMid: 0.2054,
    bankMid: 0.2031,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 819,
    foreignAtMarketMid: 830,
    foreignAtBankMid: 834,
    diffForeign: 11,
    diffTWD: 420,
    diffPct: 1.4,
    cashSell: 36.65,
    cashBuy: 35.31,
    marketMid: 36.136306,
    bankMid: 35.98,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 680,
    foreignAtMarketMid: 695,
    foreignAtBankMid: 697,
    diffForeign: 15,
    diffTWD: 615,
    diffPct: 2.1,
    cashSell: 44.1,
    cashBuy: 41.98,
    marketMid: 43.196544,
    bankMid: 43.04,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6075,
    foreignAtMarketMid: 6150,
    foreignAtBankMid: 6177,
    diffForeign: 75,
    diffTWD: 364,
    diffPct: 1.2,
    cashSell: 4.938,
    cashBuy: 4.776,
    marketMid: 4.878049,
    bankMid: 4.857,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1135074,
    foreignAtMarketMid: 1227069,
    foreignAtBankMid: 1225490,
    diffForeign: 91995,
    diffTWD: 2249,
    diffPct: 8.1,
    cashSell: 0.02643,
    cashBuy: 0.02253,
    marketMid: 0.024448,
    bankMid: 0.02448,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.3,
        rateBuy: 40.5,
        rateInverse: 0.024814,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-28',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7163,
    foreignAtMarketMid: 7255,
    foreignAtBankMid: 7342,
    diffForeign: 92,
    diffTWD: 377,
    diffPct: 1.3,
    cashSell: 4.188,
    cashBuy: 3.984,
    marketMid: 4.135359,
    bankMid: 4.086,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1316,
    foreignAtBankMid: 1313,
    diffForeign: 25,
    diffTWD: 550,
    diffPct: 1.9,
    cashSell: 23.23,
    cashBuy: 22.45,
    marketMid: 22.803977,
    bankMid: 22.84,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1276,
    foreignAtMarketMid: 1298,
    foreignAtBankMid: 1301,
    diffForeign: 22,
    diffTWD: 514,
    diffPct: 1.7,
    cashSell: 23.51,
    cashBuy: 22.6,
    marketMid: 23.107496,
    bankMid: 23.055,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1168,
    foreignAtMarketMid: 1185,
    foreignAtBankMid: 1189,
    diffForeign: 17,
    diffTWD: 423,
    diffPct: 1.4,
    cashSell: 25.68,
    cashBuy: 24.77,
    marketMid: 25.317738,
    bankMid: 25.225,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 759,
    foreignAtMarketMid: 767,
    foreignAtBankMid: 771,
    diffForeign: 8,
    diffTWD: 290,
    diffPct: 1,
    cashSell: 39.52,
    cashBuy: 38.32,
    marketMid: 39.137411,
    bankMid: 38.92,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1614,
    foreignAtMarketMid: 1626,
    foreignAtBankMid: 1652,
    diffForeign: 12,
    diffTWD: 227,
    diffPct: 0.8,
    cashSell: 18.59,
    cashBuy: 17.74,
    marketMid: 18.449163,
    bankMid: 18.165,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29348,
    foreignAtMarketMid: 31235,
    foreignAtBankMid: 32355,
    diffForeign: 1887,
    diffTWD: 1812,
    diffPct: 6.4,
    cashSell: 1.0222,
    cashBuy: 0.8322,
    marketMid: 0.960449,
    bankMid: 0.9272,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52301,
    foreignAtMarketMid: 59129,
    foreignAtBankMid: 59102,
    diffForeign: 6828,
    diffTWD: 3464,
    diffPct: 13.1,
    cashSell: 0.5736,
    cashBuy: 0.4416,
    marketMid: 0.507368,
    bankMid: 0.5076,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16812853,
    foreignAtBankMid: 16853933,
    diffForeign: 2728346,
    diffTWD: 4868,
    diffPct: 19.4,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001784,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3546,
    foreignAtMarketMid: 3782,
    foreignAtBankMid: 3897,
    diffForeign: 236,
    diffTWD: 1872,
    diffPct: 6.7,
    cashSell: 8.46,
    cashBuy: 6.935,
    marketMid: 7.932101,
    bankMid: 7.6975,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23857449,
    foreignAtBankMid: 24291498,
    diffForeign: 3024116,
    diffTWD: 3803,
    diffPct: 14.5,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001257,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/28 13:58:39';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-28';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-28';
