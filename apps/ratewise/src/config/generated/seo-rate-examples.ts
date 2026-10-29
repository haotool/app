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
 * 匯率時間：2026/10/29 09:58:09
 * 生成日期：2026-10-29
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
    foreignAtCash: 917,
    foreignAtMarketMid: 925,
    foreignAtBankMid: 926,
    diffForeign: 8,
    diffTWD: 283,
    diffPct: 1,
    cashSell: 32.725,
    cashBuy: 32.055,
    marketMid: 32.415962,
    bankMid: 32.39,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143403,
    foreignAtMarketMid: 146184,
    foreignAtBankMid: 147929,
    diffForeign: 2781,
    diffTWD: 571,
    diffPct: 1.9,
    cashSell: 0.2092,
    cashBuy: 0.1964,
    marketMid: 0.205221,
    bankMid: 0.2028,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 818,
    foreignAtMarketMid: 830,
    foreignAtBankMid: 833,
    diffForeign: 12,
    diffTWD: 461,
    diffPct: 1.6,
    cashSell: 36.69,
    cashBuy: 35.35,
    marketMid: 36.125863,
    bankMid: 36.02,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 679,
    foreignAtMarketMid: 695,
    foreignAtBankMid: 696,
    diffForeign: 16,
    diffTWD: 687,
    diffPct: 2.3,
    cashSell: 44.16,
    cashBuy: 42.04,
    marketMid: 43.148084,
    bankMid: 43.1,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6078,
    foreignAtMarketMid: 6177,
    foreignAtBankMid: 6179,
    diffForeign: 99,
    diffTWD: 482,
    diffPct: 1.6,
    cashSell: 4.936,
    cashBuy: 4.774,
    marketMid: 4.856727,
    bankMid: 4.855,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1131648,
    foreignAtMarketMid: 1241473,
    foreignAtBankMid: 1221498,
    diffForeign: 109825,
    diffTWD: 2654,
    diffPct: 9.7,
    cashSell: 0.02651,
    cashBuy: 0.02261,
    marketMid: 0.024165,
    bankMid: 0.02456,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.3,
        rateBuy: 40.8,
        rateInverse: 0.024814,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-29',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7168,
    foreignAtMarketMid: 7262,
    foreignAtBankMid: 7348,
    diffForeign: 94,
    diffTWD: 386,
    diffPct: 1.3,
    cashSell: 4.185,
    cashBuy: 3.981,
    marketMid: 4.131139,
    bankMid: 4.083,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1288,
    foreignAtMarketMid: 1314,
    foreignAtBankMid: 1310,
    diffForeign: 26,
    diffTWD: 589,
    diffPct: 2,
    cashSell: 23.29,
    cashBuy: 22.51,
    marketMid: 22.832614,
    bankMid: 22.9,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1270,
    foreignAtMarketMid: 1299,
    foreignAtBankMid: 1294,
    diffForeign: 29,
    diffTWD: 690,
    diffPct: 2.4,
    cashSell: 23.63,
    cashBuy: 22.72,
    marketMid: 23.086691,
    bankMid: 23.175,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1168,
    foreignAtMarketMid: 1186,
    foreignAtBankMid: 1189,
    diffForeign: 18,
    diffTWD: 458,
    diffPct: 1.5,
    cashSell: 25.68,
    cashBuy: 24.77,
    marketMid: 25.288286,
    bankMid: 25.225,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 758,
    foreignAtMarketMid: 767,
    foreignAtBankMid: 770,
    diffForeign: 9,
    diffTWD: 357,
    diffPct: 1.2,
    cashSell: 39.57,
    cashBuy: 38.37,
    marketMid: 39.099155,
    bankMid: 38.97,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1609,
    foreignAtMarketMid: 1646,
    foreignAtBankMid: 1647,
    diffForeign: 37,
    diffTWD: 662,
    diffPct: 2.3,
    cashSell: 18.64,
    cashBuy: 17.79,
    marketMid: 18.22855,
    bankMid: 18.215,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29291,
    foreignAtMarketMid: 31258,
    foreignAtBankMid: 32286,
    diffForeign: 1967,
    diffTWD: 1888,
    diffPct: 6.7,
    cashSell: 1.0242,
    cashBuy: 0.8342,
    marketMid: 0.95975,
    bankMid: 0.9292,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52210,
    foreignAtMarketMid: 59204,
    foreignAtBankMid: 58985,
    diffForeign: 6994,
    diffTWD: 3544,
    diffPct: 13.4,
    cashSell: 0.5746,
    cashBuy: 0.4426,
    marketMid: 0.506722,
    bankMid: 0.5086,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16838129,
    foreignAtBankMid: 16853933,
    diffForeign: 2753622,
    diffTWD: 4906,
    diffPct: 19.6,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001782,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3539,
    foreignAtMarketMid: 3775,
    foreignAtBankMid: 3888,
    diffForeign: 236,
    diffTWD: 1878,
    diffPct: 6.7,
    cashSell: 8.478,
    cashBuy: 6.953,
    marketMid: 7.947357,
    bankMid: 7.7155,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23923079,
    foreignAtBankMid: 24291498,
    diffForeign: 3089746,
    diffTWD: 3875,
    diffPct: 14.8,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001254,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/29 09:58:09';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-29';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-29';
