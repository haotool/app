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
 * 匯率時間：2026/10/15 12:30:27
 * 生成日期：2026-10-15
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
    foreignAtCash: 921,
    foreignAtMarketMid: 931,
    foreignAtBankMid: 931,
    diffForeign: 10,
    diffTWD: 331,
    diffPct: 1.1,
    cashSell: 32.57,
    cashBuy: 31.9,
    marketMid: 32.210269,
    bankMid: 32.235,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144092,
    foreignAtMarketMid: 147964,
    foreignAtBankMid: 148662,
    diffForeign: 3872,
    diffTWD: 785,
    diffPct: 2.7,
    cashSell: 0.2082,
    cashBuy: 0.1954,
    marketMid: 0.202752,
    bankMid: 0.2018,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 816,
    foreignAtMarketMid: 834,
    foreignAtBankMid: 831,
    diffForeign: 18,
    diffTWD: 659,
    diffPct: 2.2,
    cashSell: 36.76,
    cashBuy: 35.42,
    marketMid: 35.953117,
    bankMid: 36.09,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 686,
    foreignAtMarketMid: 704,
    foreignAtBankMid: 704,
    diffForeign: 18,
    diffTWD: 756,
    diffPct: 2.6,
    cashSell: 43.7,
    cashBuy: 41.58,
    marketMid: 42.598509,
    bankMid: 42.64,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6134,
    foreignAtMarketMid: 6243,
    foreignAtBankMid: 6237,
    diffForeign: 109,
    diffTWD: 525,
    diffPct: 1.8,
    cashSell: 4.891,
    cashBuy: 4.729,
    marketMid: 4.805382,
    bankMid: 4.81,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1149425,
    foreignAtMarketMid: 1248657,
    foreignAtBankMid: 1242236,
    diffForeign: 99232,
    diffTWD: 2384,
    diffPct: 8.6,
    cashSell: 0.0261,
    cashBuy: 0.0222,
    marketMid: 0.024026,
    bankMid: 0.02415,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.3,
        rateBuy: 41.5,
        rateInverse: 0.024213,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-15',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7205,
    foreignAtMarketMid: 7324,
    foreignAtBankMid: 7386,
    diffForeign: 119,
    diffTWD: 488,
    diffPct: 1.7,
    cashSell: 4.164,
    cashBuy: 3.96,
    marketMid: 4.096212,
    bankMid: 4.062,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1313,
    foreignAtMarketMid: 1335,
    foreignAtBankMid: 1336,
    diffForeign: 22,
    diffTWD: 475,
    diffPct: 1.6,
    cashSell: 22.84,
    cashBuy: 22.06,
    marketMid: 22.478477,
    bankMid: 22.45,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1296,
    foreignAtMarketMid: 1327,
    foreignAtBankMid: 1322,
    diffForeign: 31,
    diffTWD: 702,
    diffPct: 2.4,
    cashSell: 23.15,
    cashBuy: 22.24,
    marketMid: 22.608067,
    bankMid: 22.695,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1175,
    foreignAtMarketMid: 1197,
    foreignAtBankMid: 1196,
    diffForeign: 22,
    diffTWD: 550,
    diffPct: 1.9,
    cashSell: 25.53,
    cashBuy: 24.62,
    marketMid: 25.062029,
    bankMid: 25.075,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 763,
    foreignAtMarketMid: 778,
    foreignAtBankMid: 775,
    diffForeign: 15,
    diffTWD: 573,
    diffPct: 1.9,
    cashSell: 39.33,
    cashBuy: 38.13,
    marketMid: 38.578759,
    bankMid: 38.73,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1619,
    foreignAtMarketMid: 1663,
    foreignAtBankMid: 1657,
    diffForeign: 44,
    diffTWD: 795,
    diffPct: 2.7,
    cashSell: 18.53,
    cashBuy: 17.68,
    marketMid: 18.03882,
    bankMid: 18.105,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29277,
    foreignAtMarketMid: 31354,
    foreignAtBankMid: 32268,
    diffForeign: 2077,
    diffTWD: 1988,
    diffPct: 7.1,
    cashSell: 1.0247,
    cashBuy: 0.8347,
    marketMid: 0.956811,
    bankMid: 0.9297,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51903,
    foreignAtMarketMid: 58557,
    foreignAtBankMid: 58594,
    diffForeign: 6654,
    diffTWD: 3409,
    diffPct: 12.8,
    cashSell: 0.578,
    cashBuy: 0.446,
    marketMid: 0.512322,
    bankMid: 0.512,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16674653,
    foreignAtBankMid: 16853933,
    diffForeign: 2590146,
    diffTWD: 4660,
    diffPct: 18.4,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001799,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3567,
    foreignAtMarketMid: 3807,
    foreignAtBankMid: 3922,
    diffForeign: 240,
    diffTWD: 1894,
    diffPct: 6.7,
    cashSell: 8.411,
    cashBuy: 6.886,
    marketMid: 7.880096,
    bankMid: 7.6485,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 24129339,
    foreignAtBankMid: 24291498,
    diffForeign: 3296006,
    diffTWD: 4098,
    diffPct: 15.8,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001243,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/15 12:30:27';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-15';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-15';
