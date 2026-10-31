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
 * 匯率時間：2026/10/31 05:32:32
 * 生成日期：2026-10-31
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
    foreignAtMarketMid: 920,
    foreignAtBankMid: 925,
    diffForeign: 4,
    diffTWD: 120,
    diffPct: 0.4,
    cashSell: 32.75,
    cashBuy: 32.08,
    marketMid: 32.618978,
    bankMid: 32.415,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142993,
    foreignAtMarketMid: 144901,
    foreignAtBankMid: 147493,
    diffForeign: 1908,
    diffTWD: 395,
    diffPct: 1.3,
    cashSell: 0.2098,
    cashBuy: 0.197,
    marketMid: 0.207038,
    bankMid: 0.2034,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 816,
    foreignAtMarketMid: 824,
    foreignAtBankMid: 831,
    diffForeign: 8,
    diffTWD: 321,
    diffPct: 1.1,
    cashSell: 36.78,
    cashBuy: 35.44,
    marketMid: 36.38613,
    bankMid: 36.11,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 675,
    foreignAtMarketMid: 687,
    foreignAtBankMid: 692,
    diffForeign: 12,
    diffTWD: 525,
    diffPct: 1.8,
    cashSell: 44.43,
    cashBuy: 42.31,
    marketMid: 43.652872,
    bankMid: 43.37,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6062,
    foreignAtMarketMid: 6135,
    foreignAtBankMid: 6163,
    diffForeign: 73,
    diffTWD: 358,
    diffPct: 1.2,
    cashSell: 4.949,
    cashBuy: 4.787,
    marketMid: 4.889976,
    bankMid: 4.868,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1131222,
    foreignAtMarketMid: 1227162,
    foreignAtBankMid: 1221001,
    diffForeign: 95940,
    diffTWD: 2345,
    diffPct: 8.5,
    cashSell: 0.02652,
    cashBuy: 0.02262,
    marketMid: 0.024447,
    bankMid: 0.02457,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.5,
        rateBuy: 41,
        rateInverse: 0.024691,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-31',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7162,
    foreignAtMarketMid: 7219,
    foreignAtBankMid: 7340,
    diffForeign: 57,
    diffTWD: 240,
    diffPct: 0.8,
    cashSell: 4.189,
    cashBuy: 3.985,
    marketMid: 4.155551,
    bankMid: 4.087,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1308,
    foreignAtBankMid: 1313,
    diffForeign: 17,
    diffTWD: 391,
    diffPct: 1.3,
    cashSell: 23.24,
    cashBuy: 22.46,
    marketMid: 22.937358,
    bankMid: 22.85,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1267,
    foreignAtMarketMid: 1285,
    foreignAtBankMid: 1292,
    diffForeign: 18,
    diffTWD: 416,
    diffPct: 1.4,
    cashSell: 23.67,
    cashBuy: 22.76,
    marketMid: 23.342126,
    bankMid: 23.215,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1165,
    foreignAtMarketMid: 1176,
    foreignAtBankMid: 1186,
    diffForeign: 11,
    diffTWD: 286,
    diffPct: 1,
    cashSell: 25.75,
    cashBuy: 24.84,
    marketMid: 25.504348,
    bankMid: 25.295,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 755,
    foreignAtMarketMid: 759,
    foreignAtBankMid: 766,
    diffForeign: 4,
    diffTWD: 173,
    diffPct: 0.6,
    cashSell: 39.76,
    cashBuy: 38.56,
    marketMid: 39.530379,
    bankMid: 39.16,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1608,
    foreignAtMarketMid: 1633,
    foreignAtBankMid: 1645,
    diffForeign: 25,
    diffTWD: 470,
    diffPct: 1.6,
    cashSell: 18.66,
    cashBuy: 17.81,
    marketMid: 18.367497,
    bankMid: 18.235,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29311,
    foreignAtMarketMid: 31050,
    foreignAtBankMid: 32310,
    diffForeign: 1739,
    diffTWD: 1680,
    diffPct: 5.9,
    cashSell: 1.0235,
    cashBuy: 0.8335,
    marketMid: 0.966171,
    bankMid: 0.9285,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52083,
    foreignAtMarketMid: 58584,
    foreignAtBankMid: 58824,
    diffForeign: 6501,
    diffTWD: 3329,
    diffPct: 12.5,
    cashSell: 0.576,
    cashBuy: 0.444,
    marketMid: 0.512086,
    bankMid: 0.51,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16669517,
    foreignAtBankMid: 17341040,
    diffForeign: 2246440,
    diffTWD: 4043,
    diffPct: 15.6,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.0018,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3527,
    foreignAtMarketMid: 3739,
    foreignAtBankMid: 3875,
    diffForeign: 212,
    diffTWD: 1696,
    diffPct: 6,
    cashSell: 8.505,
    cashBuy: 6.98,
    marketMid: 8.024137,
    bankMid: 7.7425,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 23751163,
    foreignAtBankMid: 24691358,
    diffForeign: 2624402,
    diffTWD: 3315,
    diffPct: 12.4,
    cashSell: 0.00142,
    cashBuy: 0.00101,
    marketMid: 0.001263,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/31 05:32:32';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-31';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-31';
