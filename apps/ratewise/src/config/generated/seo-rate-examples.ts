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
 * 匯率時間：2026/10/27 13:43:08
 * 生成日期：2026-10-27
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
    foreignAtMarketMid: 920,
    foreignAtBankMid: 924,
    diffForeign: 5,
    diffTWD: 190,
    diffPct: 0.6,
    cashSell: 32.8,
    cashBuy: 32.13,
    marketMid: 32.592399,
    bankMid: 32.465,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142925,
    foreignAtMarketMid: 144975,
    foreignAtBankMid: 147420,
    diffForeign: 2050,
    diffTWD: 424,
    diffPct: 1.4,
    cashSell: 0.2099,
    cashBuy: 0.1971,
    marketMid: 0.206932,
    bankMid: 0.2035,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 814,
    foreignAtMarketMid: 823,
    foreignAtBankMid: 829,
    diffForeign: 9,
    diffTWD: 310,
    diffPct: 1,
    cashSell: 36.85,
    cashBuy: 35.51,
    marketMid: 36.46973,
    bankMid: 36.18,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 677,
    foreignAtMarketMid: 690,
    foreignAtBankMid: 694,
    diffForeign: 13,
    diffTWD: 553,
    diffPct: 1.9,
    cashSell: 44.3,
    cashBuy: 42.18,
    marketMid: 43.483933,
    bankMid: 43.24,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6068,
    foreignAtMarketMid: 6144,
    foreignAtBankMid: 6169,
    diffForeign: 76,
    diffTWD: 371,
    diffPct: 1.3,
    cashSell: 4.944,
    cashBuy: 4.782,
    marketMid: 4.882813,
    bankMid: 4.863,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1121915,
    foreignAtMarketMid: 1220093,
    foreignAtBankMid: 1210165,
    diffForeign: 98178,
    diffTWD: 2414,
    diffPct: 8.8,
    cashSell: 0.02674,
    cashBuy: 0.02284,
    marketMid: 0.024588,
    bankMid: 0.02479,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.3,
        rateBuy: 41,
        rateInverse: 0.024814,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-27',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7153,
    foreignAtMarketMid: 7225,
    foreignAtBankMid: 7331,
    diffForeign: 72,
    diffTWD: 300,
    diffPct: 1,
    cashSell: 4.194,
    cashBuy: 3.99,
    marketMid: 4.152082,
    bankMid: 4.092,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1312,
    foreignAtBankMid: 1313,
    diffForeign: 21,
    diffTWD: 462,
    diffPct: 1.6,
    cashSell: 23.23,
    cashBuy: 22.45,
    marketMid: 22.872304,
    bankMid: 22.84,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1270,
    foreignAtMarketMid: 1291,
    foreignAtBankMid: 1295,
    diffForeign: 21,
    diffTWD: 491,
    diffPct: 1.7,
    cashSell: 23.62,
    cashBuy: 22.71,
    marketMid: 23.233121,
    bankMid: 23.165,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1166,
    foreignAtMarketMid: 1178,
    foreignAtBankMid: 1187,
    diffForeign: 12,
    diffTWD: 318,
    diffPct: 1.1,
    cashSell: 25.73,
    cashBuy: 24.82,
    marketMid: 25.456952,
    bankMid: 25.275,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 756,
    foreignAtMarketMid: 761,
    foreignAtBankMid: 768,
    diffForeign: 5,
    diffTWD: 168,
    diffPct: 0.6,
    cashSell: 39.67,
    cashBuy: 38.47,
    marketMid: 39.447732,
    bankMid: 39.07,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1588,
    foreignAtMarketMid: 1619,
    foreignAtBankMid: 1625,
    diffForeign: 31,
    diffTWD: 575,
    diffPct: 2,
    cashSell: 18.89,
    cashBuy: 18.04,
    marketMid: 18.528126,
    bankMid: 18.465,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29254,
    foreignAtMarketMid: 31118,
    foreignAtBankMid: 32241,
    diffForeign: 1864,
    diffTWD: 1797,
    diffPct: 6.4,
    cashSell: 1.0255,
    cashBuy: 0.8355,
    marketMid: 0.964082,
    bankMid: 0.9305,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52210,
    foreignAtMarketMid: 58874,
    foreignAtBankMid: 58985,
    diffForeign: 6664,
    diffTWD: 3396,
    diffPct: 12.8,
    cashSell: 0.5746,
    cashBuy: 0.4426,
    marketMid: 0.509564,
    bankMid: 0.5086,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16696416,
    foreignAtBankMid: 16853933,
    diffForeign: 2611909,
    diffTWD: 4693,
    diffPct: 18.5,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001797,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3546,
    foreignAtMarketMid: 3764,
    foreignAtBankMid: 3897,
    diffForeign: 218,
    diffTWD: 1737,
    diffPct: 6.1,
    cashSell: 8.46,
    cashBuy: 6.935,
    marketMid: 7.970223,
    bankMid: 7.6975,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20689655,
    foreignAtMarketMid: 23731919,
    foreignAtBankMid: 24096386,
    diffForeign: 3042264,
    diffTWD: 3846,
    diffPct: 14.7,
    cashSell: 0.00145,
    cashBuy: 0.00104,
    marketMid: 0.001264,
    bankMid: 0.001245,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/27 13:43:08';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-27';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-27';
