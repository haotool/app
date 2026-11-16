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
 * 匯率時間：2026/11/16 15:57:10
 * 生成日期：2026-11-16
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
    foreignAtCash: 904,
    foreignAtMarketMid: 911,
    foreignAtBankMid: 913,
    diffForeign: 7,
    diffTWD: 253,
    diffPct: 0.9,
    cashSell: 33.2,
    cashBuy: 32.53,
    marketMid: 32.919643,
    bankMid: 32.865,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 142721,
    foreignAtMarketMid: 145756,
    foreignAtBankMid: 147203,
    diffForeign: 3035,
    diffTWD: 625,
    diffPct: 2.1,
    cashSell: 0.2102,
    cashBuy: 0.1974,
    marketMid: 0.205823,
    bankMid: 0.2038,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 815,
    foreignAtMarketMid: 827,
    foreignAtBankMid: 830,
    diffForeign: 12,
    diffTWD: 431,
    diffPct: 1.5,
    cashSell: 36.82,
    cashBuy: 35.48,
    marketMid: 36.291054,
    bankMid: 36.15,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 676,
    foreignAtMarketMid: 690,
    foreignAtBankMid: 692,
    diffForeign: 14,
    diffTWD: 623,
    diffPct: 2.1,
    cashSell: 44.41,
    cashBuy: 42.29,
    marketMid: 43.487715,
    bankMid: 43.35,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 5999,
    foreignAtMarketMid: 6084,
    foreignAtBankMid: 6098,
    diffForeign: 85,
    diffTWD: 420,
    diffPct: 1.4,
    cashSell: 5.001,
    cashBuy: 4.839,
    marketMid: 4.930966,
    bankMid: 4.92,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1117735,
    foreignAtMarketMid: 1217428,
    foreignAtBankMid: 1205303,
    diffForeign: 99693,
    diffTWD: 2457,
    diffPct: 8.9,
    cashSell: 0.02684,
    cashBuy: 0.02294,
    marketMid: 0.024642,
    bankMid: 0.02489,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.55,
        rateBuy: 42,
        rateInverse: 0.024067,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-16',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7067,
    foreignAtMarketMid: 7154,
    foreignAtBankMid: 7241,
    diffForeign: 87,
    diffTWD: 366,
    diffPct: 1.2,
    cashSell: 4.245,
    cashBuy: 4.041,
    marketMid: 4.193241,
    bankMid: 4.143,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1325,
    foreignAtMarketMid: 1345,
    foreignAtBankMid: 1348,
    diffForeign: 20,
    diffTWD: 434,
    diffPct: 1.5,
    cashSell: 22.64,
    cashBuy: 21.86,
    marketMid: 22.312464,
    bankMid: 22.25,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1278,
    foreignAtMarketMid: 1301,
    foreignAtBankMid: 1303,
    diffForeign: 23,
    diffTWD: 537,
    diffPct: 1.8,
    cashSell: 23.48,
    cashBuy: 22.57,
    marketMid: 23.060071,
    bankMid: 23.025,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1159,
    foreignAtMarketMid: 1175,
    foreignAtBankMid: 1179,
    diffForeign: 16,
    diffTWD: 404,
    diffPct: 1.4,
    cashSell: 25.89,
    cashBuy: 24.98,
    marketMid: 25.541479,
    bankMid: 25.435,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 757,
    foreignAtMarketMid: 765,
    foreignAtBankMid: 768,
    diffForeign: 8,
    diffTWD: 323,
    diffPct: 1.1,
    cashSell: 39.64,
    cashBuy: 38.44,
    marketMid: 39.212611,
    bankMid: 39.04,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1617,
    foreignAtMarketMid: 1649,
    foreignAtBankMid: 1655,
    diffForeign: 32,
    diffTWD: 575,
    diffPct: 2,
    cashSell: 18.55,
    cashBuy: 17.7,
    marketMid: 18.194389,
    bankMid: 18.125,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29030,
    foreignAtMarketMid: 30915,
    foreignAtBankMid: 31969,
    diffForeign: 1885,
    diffTWD: 1829,
    diffPct: 6.5,
    cashSell: 1.0334,
    cashBuy: 0.8434,
    marketMid: 0.970397,
    bankMid: 0.9384,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51582,
    foreignAtMarketMid: 58257,
    foreignAtBankMid: 58185,
    diffForeign: 6675,
    diffTWD: 3437,
    diffPct: 12.9,
    cashSell: 0.5816,
    cashBuy: 0.4496,
    marketMid: 0.514959,
    bankMid: 0.5156,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16597502,
    foreignAtBankMid: 16853933,
    diffForeign: 2512995,
    diffTWD: 4542,
    diffPct: 17.8,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001808,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3510,
    foreignAtMarketMid: 3730,
    foreignAtBankMid: 3854,
    diffForeign: 220,
    diffTWD: 1770,
    diffPct: 6.3,
    cashSell: 8.547,
    cashBuy: 7.022,
    marketMid: 8.042788,
    bankMid: 7.7845,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20547945,
    foreignAtMarketMid: 23451185,
    foreignAtBankMid: 23904382,
    diffForeign: 2903240,
    diffTWD: 3714,
    diffPct: 14.1,
    cashSell: 0.00146,
    cashBuy: 0.00105,
    marketMid: 0.001279,
    bankMid: 0.001255,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/16 15:57:10';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-16';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-16';
