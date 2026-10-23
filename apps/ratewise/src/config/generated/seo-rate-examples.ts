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
 * 匯率時間：2026/10/23 13:55:42
 * 生成日期：2026-10-23
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
    foreignAtBankMid: 925,
    diffForeign: 5,
    diffTWD: 168,
    diffPct: 0.6,
    cashSell: 32.775,
    cashBuy: 32.105,
    marketMid: 32.591337,
    bankMid: 32.44,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142383,
    foreignAtMarketMid: 144437,
    foreignAtBankMid: 146843,
    diffForeign: 2054,
    diffTWD: 427,
    diffPct: 1.4,
    cashSell: 0.2107,
    cashBuy: 0.1979,
    marketMid: 0.207703,
    bankMid: 0.2043,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 812,
    foreignAtMarketMid: 821,
    foreignAtBankMid: 827,
    diffForeign: 9,
    diffTWD: 341,
    diffPct: 1.1,
    cashSell: 36.96,
    cashBuy: 35.62,
    marketMid: 36.540359,
    bankMid: 36.29,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 675,
    foreignAtMarketMid: 688,
    foreignAtBankMid: 691,
    diffForeign: 13,
    diffTWD: 553,
    diffPct: 1.9,
    cashSell: 44.45,
    cashBuy: 42.33,
    marketMid: 43.630017,
    bankMid: 43.39,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6078,
    foreignAtMarketMid: 6171,
    foreignAtBankMid: 6179,
    diffForeign: 93,
    diffTWD: 453,
    diffPct: 1.5,
    cashSell: 4.936,
    cashBuy: 4.774,
    marketMid: 4.861449,
    bankMid: 4.855,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1124438,
    foreignAtMarketMid: 1219774,
    foreignAtBankMid: 1213101,
    diffForeign: 95336,
    diffTWD: 2345,
    diffPct: 8.5,
    cashSell: 0.02668,
    cashBuy: 0.02278,
    marketMid: 0.024595,
    bankMid: 0.02473,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.2,
        rateBuy: 40.8,
        rateInverse: 0.024876,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-23',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7155,
    foreignAtMarketMid: 7216,
    foreignAtBankMid: 7333,
    diffForeign: 61,
    diffTWD: 255,
    diffPct: 0.9,
    cashSell: 4.193,
    cashBuy: 3.989,
    marketMid: 4.15733,
    bankMid: 4.091,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1294,
    foreignAtMarketMid: 1312,
    foreignAtBankMid: 1316,
    diffForeign: 18,
    diffTWD: 416,
    diffPct: 1.4,
    cashSell: 23.18,
    cashBuy: 22.4,
    marketMid: 22.858188,
    bankMid: 22.79,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1271,
    foreignAtMarketMid: 1291,
    foreignAtBankMid: 1296,
    diffForeign: 20,
    diffTWD: 464,
    diffPct: 1.6,
    cashSell: 23.61,
    cashBuy: 22.7,
    marketMid: 23.244462,
    bankMid: 23.155,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1164,
    foreignAtMarketMid: 1176,
    foreignAtBankMid: 1185,
    diffForeign: 12,
    diffTWD: 306,
    diffPct: 1,
    cashSell: 25.77,
    cashBuy: 24.86,
    marketMid: 25.506951,
    bankMid: 25.315,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 751,
    foreignAtMarketMid: 756,
    foreignAtBankMid: 763,
    diffForeign: 5,
    diffTWD: 210,
    diffPct: 0.7,
    cashSell: 39.94,
    cashBuy: 38.74,
    marketMid: 39.660506,
    bankMid: 39.34,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1589,
    foreignAtMarketMid: 1620,
    foreignAtBankMid: 1626,
    diffForeign: 31,
    diffTWD: 582,
    diffPct: 2,
    cashSell: 18.88,
    cashBuy: 18.03,
    marketMid: 18.513719,
    bankMid: 18.455,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29254,
    foreignAtMarketMid: 31063,
    foreignAtBankMid: 32241,
    diffForeign: 1809,
    diffTWD: 1747,
    diffPct: 6.2,
    cashSell: 1.0255,
    cashBuy: 0.8355,
    marketMid: 0.965768,
    bankMid: 0.9305,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51858,
    foreignAtMarketMid: 58454,
    foreignAtBankMid: 58537,
    diffForeign: 6596,
    diffTWD: 3385,
    diffPct: 12.7,
    cashSell: 0.5785,
    cashBuy: 0.4465,
    marketMid: 0.513226,
    bankMid: 0.5125,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16636392,
    foreignAtBankMid: 16853933,
    diffForeign: 2551885,
    diffTWD: 4602,
    diffPct: 18.1,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001803,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3547,
    foreignAtMarketMid: 3761,
    foreignAtBankMid: 3898,
    diffForeign: 214,
    diffTWD: 1705,
    diffPct: 6,
    cashSell: 8.458,
    cashBuy: 6.933,
    marketMid: 7.977281,
    bankMid: 7.6955,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20833333,
    foreignAtMarketMid: 23783887,
    foreignAtBankMid: 24291498,
    diffForeign: 2950554,
    diffTWD: 3722,
    diffPct: 14.2,
    cashSell: 0.00144,
    cashBuy: 0.00103,
    marketMid: 0.001261,
    bankMid: 0.001235,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/23 13:55:42';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-23';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-23';
