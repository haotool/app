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
 * 匯率時間：2026/11/07 09:57:47
 * 生成日期：2026-11-07
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
    foreignAtCash: 908,
    foreignAtMarketMid: 912,
    foreignAtBankMid: 917,
    diffForeign: 4,
    diffTWD: 142,
    diffPct: 0.5,
    cashSell: 33.035,
    cashBuy: 32.365,
    marketMid: 32.878514,
    bankMid: 32.7,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142586,
    foreignAtMarketMid: 144960,
    foreignAtBankMid: 147059,
    diffForeign: 2374,
    diffTWD: 491,
    diffPct: 1.7,
    cashSell: 0.2104,
    cashBuy: 0.1976,
    marketMid: 0.206954,
    bankMid: 0.204,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 810,
    foreignAtMarketMid: 820,
    foreignAtBankMid: 825,
    diffForeign: 10,
    diffTWD: 372,
    diffPct: 1.3,
    cashSell: 37.05,
    cashBuy: 35.71,
    marketMid: 36.591167,
    bankMid: 36.38,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 671,
    foreignAtMarketMid: 685,
    foreignAtBankMid: 688,
    diffForeign: 14,
    diffTWD: 579,
    diffPct: 2,
    cashSell: 44.68,
    cashBuy: 42.56,
    marketMid: 43.817369,
    bankMid: 43.62,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6029,
    foreignAtMarketMid: 6051,
    foreignAtBankMid: 6129,
    diffForeign: 22,
    diffTWD: 109,
    diffPct: 0.4,
    cashSell: 4.976,
    cashBuy: 4.814,
    marketMid: 4.957858,
    bankMid: 4.895,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1145475,
    foreignAtMarketMid: 1244483,
    foreignAtBankMid: 1237624,
    diffForeign: 99008,
    diffTWD: 2387,
    diffPct: 8.6,
    cashSell: 0.02619,
    cashBuy: 0.02229,
    marketMid: 0.024106,
    bankMid: 0.02424,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.1,
        rateBuy: 42,
        rateInverse: 0.024331,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-07',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7096,
    foreignAtMarketMid: 7173,
    foreignAtBankMid: 7271,
    diffForeign: 77,
    diffTWD: 326,
    diffPct: 1.1,
    cashSell: 4.228,
    cashBuy: 4.024,
    marketMid: 4.182106,
    bankMid: 4.126,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1311,
    foreignAtMarketMid: 1330,
    foreignAtBankMid: 1333,
    diffForeign: 19,
    diffTWD: 448,
    diffPct: 1.5,
    cashSell: 22.89,
    cashBuy: 22.11,
    marketMid: 22.548423,
    bankMid: 22.5,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1271,
    foreignAtMarketMid: 1287,
    foreignAtBankMid: 1296,
    diffForeign: 16,
    diffTWD: 371,
    diffPct: 1.3,
    cashSell: 23.61,
    cashBuy: 22.7,
    marketMid: 23.317633,
    bankMid: 23.155,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1160,
    foreignAtMarketMid: 1173,
    foreignAtBankMid: 1180,
    diffForeign: 13,
    diffTWD: 348,
    diffPct: 1.2,
    cashSell: 25.87,
    cashBuy: 24.96,
    marketMid: 25.570216,
    bankMid: 25.415,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 744,
    foreignAtMarketMid: 750,
    foreignAtBankMid: 755,
    diffForeign: 6,
    diffTWD: 263,
    diffPct: 0.9,
    cashSell: 40.33,
    cashBuy: 39.13,
    marketMid: 39.976014,
    bankMid: 39.73,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1617,
    foreignAtMarketMid: 1650,
    foreignAtBankMid: 1655,
    diffForeign: 33,
    diffTWD: 591,
    diffPct: 2,
    cashSell: 18.55,
    cashBuy: 17.7,
    marketMid: 18.184463,
    bankMid: 18.125,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28913,
    foreignAtMarketMid: 30699,
    foreignAtBankMid: 31827,
    diffForeign: 1786,
    diffTWD: 1745,
    diffPct: 6.2,
    cashSell: 1.0376,
    cashBuy: 0.8476,
    marketMid: 0.977235,
    bankMid: 0.9426,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51230,
    foreignAtMarketMid: 57503,
    foreignAtBankMid: 57737,
    diffForeign: 6273,
    diffTWD: 3273,
    diffPct: 12.2,
    cashSell: 0.5856,
    cashBuy: 0.4536,
    marketMid: 0.521714,
    bankMid: 0.5196,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16532169,
    foreignAtBankMid: 16393443,
    diffForeign: 2770701,
    diffTWD: 5028,
    diffPct: 20.1,
    cashSell: 0.00218,
    cashBuy: 0.00148,
    marketMid: 0.001815,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3500,
    foreignAtMarketMid: 3714,
    foreignAtBankMid: 3841,
    diffForeign: 214,
    diffTWD: 1734,
    diffPct: 6.1,
    cashSell: 8.572,
    cashBuy: 7.047,
    marketMid: 8.076631,
    bankMid: 7.8095,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20689655,
    foreignAtMarketMid: 23399783,
    foreignAtBankMid: 24096386,
    diffForeign: 2710128,
    diffTWD: 3475,
    diffPct: 13.1,
    cashSell: 0.00145,
    cashBuy: 0.00104,
    marketMid: 0.001282,
    bankMid: 0.001245,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/07 09:57:47';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-07';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-07';
