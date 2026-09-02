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
 * 匯率時間：2026/09/02 09:19:46
 * 生成日期：2026-09-02
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
    foreignAtCash: 939,
    foreignAtMarketMid: 946,
    foreignAtBankMid: 949,
    diffForeign: 7,
    diffTWD: 218,
    diffPct: 0.7,
    cashSell: 31.95,
    marketMid: 31.717838,
    bankMid: 31.615,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149105,
    foreignAtMarketMid: 151545,
    foreignAtBankMid: 154004,
    diffForeign: 2440,
    diffTWD: 483,
    diffPct: 1.6,
    cashSell: 0.2012,
    marketMid: 0.197961,
    bankMid: 0.1948,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 806,
    foreignAtMarketMid: 816,
    foreignAtBankMid: 821,
    diffForeign: 10,
    diffTWD: 384,
    diffPct: 1.3,
    cashSell: 37.22,
    marketMid: 36.743092,
    bankMid: 36.55,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 686,
    foreignAtMarketMid: 700,
    foreignAtBankMid: 703,
    diffForeign: 14,
    diffTWD: 565,
    diffPct: 1.9,
    cashSell: 43.71,
    marketMid: 42.887164,
    bankMid: 42.65,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6281,
    foreignAtMarketMid: 6369,
    foreignAtBankMid: 6390,
    diffForeign: 88,
    diffTWD: 413,
    diffPct: 1.4,
    cashSell: 4.776,
    marketMid: 4.710316,
    bankMid: 4.695,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1187648,
    foreignAtMarketMid: 1298769,
    foreignAtBankMid: 1287001,
    diffForeign: 111121,
    diffTWD: 2567,
    diffPct: 9.4,
    cashSell: 0.02526,
    marketMid: 0.023099,
    bankMid: 0.02331,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.1,
        rateBuy: 42.2,
        rateInverse: 0.023753,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-02',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7340,
    foreignAtMarketMid: 7424,
    foreignAtBankMid: 7528,
    diffForeign: 84,
    diffTWD: 336,
    diffPct: 1.1,
    cashSell: 4.087,
    marketMid: 4.041171,
    bankMid: 3.985,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1304,
    foreignAtMarketMid: 1323,
    foreignAtBankMid: 1326,
    diffForeign: 19,
    diffTWD: 434,
    diffPct: 1.5,
    cashSell: 23.01,
    marketMid: 22.676765,
    bankMid: 22.62,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1293,
    foreignAtMarketMid: 1315,
    foreignAtBankMid: 1319,
    diffForeign: 22,
    diffTWD: 503,
    diffPct: 1.7,
    cashSell: 23.2,
    marketMid: 22.810739,
    bankMid: 22.745,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1205,
    foreignAtBankMid: 1212,
    diffForeign: 15,
    diffTWD: 378,
    diffPct: 1.3,
    cashSell: 25.21,
    marketMid: 24.892341,
    bankMid: 24.755,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 762,
    foreignAtMarketMid: 768,
    foreignAtBankMid: 774,
    diffForeign: 6,
    diffTWD: 241,
    diffPct: 0.8,
    cashSell: 39.38,
    marketMid: 39.064026,
    bankMid: 38.78,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1576,
    foreignAtMarketMid: 1604,
    foreignAtBankMid: 1612,
    diffForeign: 28,
    diffTWD: 535,
    diffPct: 1.8,
    cashSell: 19.04,
    marketMid: 18.700677,
    bankMid: 18.615,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29659,
    foreignAtMarketMid: 31505,
    foreignAtBankMid: 32733,
    diffForeign: 1846,
    diffTWD: 1758,
    diffPct: 6.2,
    cashSell: 1.0115,
    marketMid: 0.952236,
    bankMid: 0.9165,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52411,
    foreignAtMarketMid: 59129,
    foreignAtBankMid: 59242,
    diffForeign: 6718,
    diffTWD: 3408,
    diffPct: 12.8,
    cashSell: 0.5724,
    marketMid: 0.507369,
    bankMid: 0.5064,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16799960,
    foreignAtBankMid: 16853933,
    diffForeign: 2715453,
    diffTWD: 4849,
    diffPct: 19.3,
    cashSell: 0.00213,
    marketMid: 0.001786,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3598,
    foreignAtMarketMid: 3823,
    foreignAtBankMid: 3960,
    diffForeign: 225,
    diffTWD: 1768,
    diffPct: 6.3,
    cashSell: 8.338,
    marketMid: 7.846645,
    bankMid: 7.5755,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24630799,
    foreignAtBankMid: 25104603,
    diffForeign: 3202228,
    diffTWD: 3900,
    diffPct: 14.9,
    cashSell: 0.0014,
    marketMid: 0.001218,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/02 09:19:46';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-02';
