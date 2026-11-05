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
 * 匯率時間：2026/11/05 09:43:47
 * 生成日期：2026-11-05
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
    foreignAtMarketMid: 914,
    foreignAtBankMid: 913,
    diffForeign: 11,
    diffTWD: 348,
    diffPct: 1.2,
    cashSell: 33.21,
    cashBuy: 32.54,
    marketMid: 32.824553,
    bankMid: 32.875,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 141509,
    foreignAtMarketMid: 144716,
    foreignAtBankMid: 145914,
    diffForeign: 3207,
    diffTWD: 665,
    diffPct: 2.3,
    cashSell: 0.212,
    cashBuy: 0.1992,
    marketMid: 0.207302,
    bankMid: 0.2056,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 798,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 813,
    diffForeign: 15,
    diffTWD: 543,
    diffPct: 1.8,
    cashSell: 37.59,
    cashBuy: 36.25,
    marketMid: 36.909903,
    bankMid: 36.92,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 662,
    foreignAtMarketMid: 678,
    foreignAtBankMid: 677,
    diffForeign: 16,
    diffTWD: 723,
    diffPct: 2.5,
    cashSell: 45.35,
    cashBuy: 43.23,
    marketMid: 44.257579,
    bankMid: 44.29,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5996,
    foreignAtMarketMid: 6087,
    foreignAtBankMid: 6095,
    diffForeign: 91,
    diffTWD: 447,
    diffPct: 1.5,
    cashSell: 5.003,
    cashBuy: 4.841,
    marketMid: 4.928536,
    bankMid: 4.922,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1122754,
    foreignAtMarketMid: 1225559,
    foreignAtBankMid: 1211143,
    diffForeign: 102805,
    diffTWD: 2517,
    diffPct: 9.2,
    cashSell: 0.02672,
    cashBuy: 0.02282,
    marketMid: 0.024479,
    bankMid: 0.02477,
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
        rateDate: '2026-11-05',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7065,
    foreignAtMarketMid: 7164,
    foreignAtBankMid: 7239,
    diffForeign: 99,
    diffTWD: 414,
    diffPct: 1.4,
    cashSell: 4.246,
    cashBuy: 4.042,
    marketMid: 4.187359,
    bankMid: 4.144,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1277,
    foreignAtMarketMid: 1306,
    foreignAtBankMid: 1299,
    diffForeign: 29,
    diffTWD: 669,
    diffPct: 2.3,
    cashSell: 23.49,
    cashBuy: 22.71,
    marketMid: 22.965804,
    bankMid: 23.1,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1249,
    foreignAtMarketMid: 1276,
    foreignAtBankMid: 1273,
    diffForeign: 27,
    diffTWD: 627,
    diffPct: 2.1,
    cashSell: 24.02,
    cashBuy: 23.11,
    marketMid: 23.517791,
    bankMid: 23.565,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1149,
    foreignAtMarketMid: 1168,
    foreignAtBankMid: 1169,
    diffForeign: 19,
    diffTWD: 499,
    diffPct: 1.7,
    cashSell: 26.12,
    cashBuy: 25.21,
    marketMid: 25.685151,
    bankMid: 25.665,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 735,
    foreignAtMarketMid: 746,
    foreignAtBankMid: 746,
    diffForeign: 11,
    diffTWD: 441,
    diffPct: 1.5,
    cashSell: 40.82,
    cashBuy: 39.62,
    marketMid: 40.220408,
    bankMid: 40.22,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1585,
    foreignAtMarketMid: 1625,
    foreignAtBankMid: 1621,
    diffForeign: 40,
    diffTWD: 745,
    diffPct: 2.5,
    cashSell: 18.93,
    cashBuy: 18.08,
    marketMid: 18.459721,
    bankMid: 18.505,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28722,
    foreignAtMarketMid: 30727,
    foreignAtBankMid: 31596,
    diffForeign: 2005,
    diffTWD: 1958,
    diffPct: 7,
    cashSell: 1.0445,
    cashBuy: 0.8545,
    marketMid: 0.976325,
    bankMid: 0.9495,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51116,
    foreignAtMarketMid: 57956,
    foreignAtBankMid: 57593,
    diffForeign: 6840,
    diffTWD: 3541,
    diffPct: 13.4,
    cashSell: 0.5869,
    cashBuy: 0.4549,
    marketMid: 0.517635,
    bankMid: 0.5209,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16576364,
    foreignAtBankMid: 16853933,
    diffForeign: 2491857,
    diffTWD: 4510,
    diffPct: 17.7,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.00181,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3476,
    foreignAtMarketMid: 3714,
    foreignAtBankMid: 3813,
    diffForeign: 238,
    diffTWD: 1921,
    diffPct: 6.8,
    cashSell: 8.631,
    cashBuy: 7.106,
    marketMid: 8.078262,
    bankMid: 7.8685,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20408163,
    foreignAtMarketMid: 23461792,
    foreignAtBankMid: 23715415,
    diffForeign: 3053629,
    diffTWD: 3905,
    diffPct: 15,
    cashSell: 0.00147,
    cashBuy: 0.00106,
    marketMid: 0.001279,
    bankMid: 0.001265,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/05 09:43:47';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-05';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-05';
