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
 * 匯率時間：2026/11/27 07:09:07
 * 生成日期：2026-11-27
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
    foreignAtMarketMid: 911,
    foreignAtBankMid: 912,
    diffForeign: 8,
    diffTWD: 250,
    diffPct: 0.8,
    cashSell: 33.225,
    cashBuy: 32.555,
    marketMid: 32.947844,
    bankMid: 32.89,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142518,
    foreignAtMarketMid: 145004,
    foreignAtBankMid: 146987,
    diffForeign: 2486,
    diffTWD: 514,
    diffPct: 1.7,
    cashSell: 0.2105,
    cashBuy: 0.1977,
    marketMid: 0.20689,
    bankMid: 0.2041,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 818,
    foreignAtMarketMid: 830,
    foreignAtBankMid: 833,
    diffForeign: 12,
    diffTWD: 425,
    diffPct: 1.4,
    cashSell: 36.68,
    cashBuy: 35.34,
    marketMid: 36.159826,
    bankMid: 36.01,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 680,
    foreignAtMarketMid: 695,
    foreignAtBankMid: 697,
    diffForeign: 15,
    diffTWD: 636,
    diffPct: 2.2,
    cashSell: 44.13,
    cashBuy: 42.01,
    marketMid: 43.194678,
    bankMid: 43.07,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5983,
    foreignAtMarketMid: 6039,
    foreignAtBankMid: 6081,
    diffForeign: 56,
    diffTWD: 277,
    diffPct: 0.9,
    cashSell: 5.014,
    cashBuy: 4.852,
    marketMid: 4.96771,
    bankMid: 4.933,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1123596,
    foreignAtMarketMid: 1223273,
    foreignAtBankMid: 1212121,
    diffForeign: 99677,
    diffTWD: 2445,
    diffPct: 8.9,
    cashSell: 0.0267,
    cashBuy: 0.0228,
    marketMid: 0.024524,
    bankMid: 0.02475,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.8,
        rateBuy: 41.1,
        rateInverse: 0.02451,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-27',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7052,
    foreignAtMarketMid: 7135,
    foreignAtBankMid: 7225,
    diffForeign: 83,
    diffTWD: 348,
    diffPct: 1.2,
    cashSell: 4.254,
    cashBuy: 4.05,
    marketMid: 4.204596,
    bankMid: 4.152,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1348,
    foreignAtMarketMid: 1373,
    foreignAtBankMid: 1372,
    diffForeign: 25,
    diffTWD: 547,
    diffPct: 1.9,
    cashSell: 22.26,
    cashBuy: 21.48,
    marketMid: 21.854102,
    bankMid: 21.87,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1274,
    foreignAtMarketMid: 1296,
    foreignAtBankMid: 1299,
    diffForeign: 22,
    diffTWD: 521,
    diffPct: 1.8,
    cashSell: 23.55,
    cashBuy: 22.64,
    marketMid: 23.140649,
    bankMid: 23.095,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1160,
    foreignAtMarketMid: 1175,
    foreignAtBankMid: 1180,
    diffForeign: 15,
    diffTWD: 385,
    diffPct: 1.3,
    cashSell: 25.87,
    cashBuy: 24.96,
    marketMid: 25.538218,
    bankMid: 25.415,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 752,
    foreignAtMarketMid: 759,
    foreignAtBankMid: 764,
    diffForeign: 7,
    diffTWD: 287,
    diffPct: 1,
    cashSell: 39.89,
    cashBuy: 38.69,
    marketMid: 39.508514,
    bankMid: 39.29,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1630,
    foreignAtMarketMid: 1664,
    foreignAtBankMid: 1668,
    diffForeign: 34,
    diffTWD: 619,
    diffPct: 2.1,
    cashSell: 18.41,
    cashBuy: 17.56,
    marketMid: 18.030038,
    bankMid: 17.985,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29126,
    foreignAtMarketMid: 30989,
    foreignAtBankMid: 32086,
    diffForeign: 1863,
    diffTWD: 1803,
    diffPct: 6.4,
    cashSell: 1.03,
    cashBuy: 0.84,
    marketMid: 0.968099,
    bankMid: 0.935,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51423,
    foreignAtMarketMid: 58086,
    foreignAtBankMid: 57982,
    diffForeign: 6663,
    diffTWD: 3441,
    diffPct: 13,
    cashSell: 0.5834,
    cashBuy: 0.4514,
    marketMid: 0.516476,
    bankMid: 0.5174,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16701502,
    foreignAtBankMid: 17341040,
    diffForeign: 2278425,
    diffTWD: 4093,
    diffPct: 15.8,
    cashSell: 0.00208,
    cashBuy: 0.00138,
    marketMid: 0.001796,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3528,
    foreignAtMarketMid: 3749,
    foreignAtBankMid: 3876,
    diffForeign: 221,
    diffTWD: 1766,
    diffPct: 6.3,
    cashSell: 8.503,
    cashBuy: 6.978,
    marketMid: 8.002561,
    bankMid: 7.7405,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23494275,
    foreignAtBankMid: 24291498,
    diffForeign: 2660942,
    diffTWD: 3398,
    diffPct: 12.8,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001277,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/27 07:09:07';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-27';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-27';
