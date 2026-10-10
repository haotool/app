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
 * 匯率時間：2026/10/10 10:22:36
 * 生成日期：2026-10-10
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
    foreignAtCash: 933,
    foreignAtMarketMid: 939,
    foreignAtBankMid: 943,
    diffForeign: 6,
    diffTWD: 173,
    diffPct: 0.6,
    cashSell: 32.15,
    cashBuy: 31.48,
    marketMid: 31.9642,
    bankMid: 31.815,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146341,
    foreignAtMarketMid: 148656,
    foreignAtBankMid: 151057,
    diffForeign: 2315,
    diffTWD: 467,
    diffPct: 1.6,
    cashSell: 0.205,
    cashBuy: 0.1922,
    marketMid: 0.201808,
    bankMid: 0.1986,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 828,
    foreignAtMarketMid: 839,
    foreignAtBankMid: 843,
    diffForeign: 11,
    diffTWD: 393,
    diffPct: 1.3,
    cashSell: 36.25,
    cashBuy: 34.91,
    marketMid: 35.775615,
    bankMid: 35.58,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 696,
    foreignAtMarketMid: 710,
    foreignAtBankMid: 713,
    diffForeign: 14,
    diffTWD: 596,
    diffPct: 2,
    cashSell: 43.12,
    cashBuy: 41,
    marketMid: 42.263641,
    bankMid: 42.06,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6211,
    foreignAtMarketMid: 6297,
    foreignAtBankMid: 6317,
    diffForeign: 86,
    diffTWD: 409,
    diffPct: 1.4,
    cashSell: 4.83,
    cashBuy: 4.668,
    marketMid: 4.764173,
    bankMid: 4.749,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1156515,
    foreignAtMarketMid: 1259242,
    foreignAtBankMid: 1250521,
    diffForeign: 102727,
    diffTWD: 2447,
    diffPct: 8.9,
    cashSell: 0.02594,
    cashBuy: 0.02204,
    marketMid: 0.023824,
    bankMid: 0.02399,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.1,
        rateBuy: 41.5,
        rateInverse: 0.024331,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-10',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7297,
    foreignAtMarketMid: 7371,
    foreignAtBankMid: 7483,
    diffForeign: 74,
    diffTWD: 298,
    diffPct: 1,
    cashSell: 4.111,
    cashBuy: 3.907,
    marketMid: 4.070203,
    bankMid: 4.009,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1324,
    foreignAtMarketMid: 1345,
    foreignAtBankMid: 1347,
    diffForeign: 21,
    diffTWD: 471,
    diffPct: 1.6,
    cashSell: 22.66,
    cashBuy: 21.88,
    marketMid: 22.304501,
    bankMid: 22.27,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1316,
    foreignAtMarketMid: 1340,
    foreignAtBankMid: 1343,
    diffForeign: 24,
    diffTWD: 521,
    diffPct: 1.8,
    cashSell: 22.79,
    cashBuy: 21.88,
    marketMid: 22.39441,
    bankMid: 22.335,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1189,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1211,
    diffForeign: 14,
    diffTWD: 345,
    diffPct: 1.2,
    cashSell: 25.23,
    cashBuy: 24.32,
    marketMid: 24.939522,
    bankMid: 24.775,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 773,
    foreignAtMarketMid: 781,
    foreignAtBankMid: 786,
    diffForeign: 8,
    diffTWD: 288,
    diffPct: 1,
    cashSell: 38.79,
    cashBuy: 37.59,
    marketMid: 38.417211,
    bankMid: 38.19,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1643,
    foreignAtMarketMid: 1673,
    foreignAtBankMid: 1682,
    diffForeign: 30,
    diffTWD: 535,
    diffPct: 1.8,
    cashSell: 18.26,
    cashBuy: 17.41,
    marketMid: 17.934646,
    bankMid: 17.835,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29621,
    foreignAtMarketMid: 31584,
    foreignAtBankMid: 32687,
    diffForeign: 1963,
    diffTWD: 1864,
    diffPct: 6.6,
    cashSell: 1.0128,
    cashBuy: 0.8228,
    marketMid: 0.949858,
    bankMid: 0.9178,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52247,
    foreignAtMarketMid: 59032,
    foreignAtBankMid: 59032,
    diffForeign: 6785,
    diffTWD: 3448,
    diffPct: 13,
    cashSell: 0.5742,
    cashBuy: 0.4422,
    marketMid: 0.508198,
    bankMid: 0.5082,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16785496,
    foreignAtBankMid: 17341040,
    diffForeign: 2362419,
    diffTWD: 4222,
    diffPct: 16.4,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.001787,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3613,
    foreignAtMarketMid: 3840,
    foreignAtBankMid: 3978,
    diffForeign: 227,
    diffTWD: 1773,
    diffPct: 6.3,
    cashSell: 8.304,
    cashBuy: 6.779,
    marketMid: 7.81311,
    bankMid: 7.5415,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24200182,
    foreignAtBankMid: 25104603,
    diffForeign: 2771611,
    diffTWD: 3436,
    diffPct: 12.9,
    cashSell: 0.0014,
    cashBuy: 0.00099,
    marketMid: 0.00124,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/10 10:22:36';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-10';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-10';
