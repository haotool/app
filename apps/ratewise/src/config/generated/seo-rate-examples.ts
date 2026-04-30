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
 * 匯率時間：2026/04/30 12:53:20
 * 生成日期：2026-04-30
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
    foreignAtMarketMid: 948,
    foreignAtBankMid: 949,
    diffForeign: 9,
    diffTWD: 284,
    diffPct: 1,
    cashSell: 31.955,
    marketMid: 31.652581,
    bankMid: 31.62,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149328,
    foreignAtMarketMid: 151893,
    foreignAtBankMid: 154242,
    diffForeign: 2565,
    diffTWD: 507,
    diffPct: 1.7,
    cashSell: 0.2009,
    marketMid: 0.197508,
    bankMid: 0.1945,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 801,
    foreignAtMarketMid: 811,
    foreignAtBankMid: 815,
    diffForeign: 10,
    diffTWD: 391,
    diffPct: 1.3,
    cashSell: 37.46,
    marketMid: 36.97131,
    bankMid: 36.79,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 706,
    diffForeign: 14,
    diffTWD: 623,
    diffPct: 2.1,
    cashSell: 43.57,
    marketMid: 42.665756,
    bankMid: 42.51,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6391,
    foreignAtMarketMid: 6495,
    foreignAtBankMid: 6503,
    diffForeign: 104,
    diffTWD: 480,
    diffPct: 1.6,
    cashSell: 4.694,
    marketMid: 4.618938,
    bankMid: 4.613,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1277139,
    foreignAtMarketMid: 1407649,
    foreignAtBankMid: 1392758,
    diffForeign: 130510,
    diffTWD: 2781,
    diffPct: 10.2,
    cashSell: 0.02349,
    marketMid: 0.021312,
    bankMid: 0.02154,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.3,
        rateBuy: 45.4,
        rateInverse: 0.022075,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-30',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7333,
    foreignAtMarketMid: 7434,
    foreignAtBankMid: 7521,
    diffForeign: 101,
    diffTWD: 406,
    diffPct: 1.4,
    cashSell: 4.091,
    marketMid: 4.035594,
    bankMid: 3.989,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1308,
    foreignAtMarketMid: 1329,
    foreignAtBankMid: 1330,
    diffForeign: 21,
    diffTWD: 485,
    diffPct: 1.6,
    cashSell: 22.94,
    marketMid: 22.568778,
    bankMid: 22.55,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1273,
    foreignAtMarketMid: 1299,
    foreignAtBankMid: 1298,
    diffForeign: 26,
    diffTWD: 590,
    diffPct: 2,
    cashSell: 23.56,
    marketMid: 23.096288,
    bankMid: 23.105,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1198,
    foreignAtMarketMid: 1214,
    foreignAtBankMid: 1220,
    diffForeign: 16,
    diffTWD: 402,
    diffPct: 1.4,
    cashSell: 25.05,
    marketMid: 24.713936,
    bankMid: 24.595,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 743,
    foreignAtMarketMid: 750,
    foreignAtBankMid: 754,
    diffForeign: 7,
    diffTWD: 274,
    diffPct: 0.9,
    cashSell: 40.38,
    marketMid: 40.011203,
    bankMid: 39.78,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1592,
    foreignAtMarketMid: 1623,
    foreignAtBankMid: 1629,
    diffForeign: 31,
    diffTWD: 566,
    diffPct: 1.9,
    cashSell: 18.84,
    marketMid: 18.48463,
    bankMid: 18.415,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29234,
    foreignAtMarketMid: 31043,
    foreignAtBankMid: 32216,
    diffForeign: 1809,
    diffTWD: 1748,
    diffPct: 6.2,
    cashSell: 1.0262,
    marketMid: 0.966392,
    bankMid: 0.9312,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51653,
    foreignAtMarketMid: 58481,
    foreignAtBankMid: 58275,
    diffForeign: 6828,
    diffTWD: 3503,
    diffPct: 13.2,
    cashSell: 0.5808,
    marketMid: 0.512988,
    bankMid: 0.5148,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16427702,
    foreignAtBankMid: 16393443,
    diffForeign: 2666234,
    diffTWD: 4869,
    diffPct: 19.4,
    cashSell: 0.00218,
    marketMid: 0.001826,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3538,
    foreignAtMarketMid: 3751,
    foreignAtBankMid: 3887,
    diffForeign: 213,
    diffTWD: 1708,
    diffPct: 6,
    cashSell: 8.48,
    marketMid: 7.997121,
    bankMid: 7.7175,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24953621,
    foreignAtBankMid: 25316456,
    diffForeign: 3370887,
    diffTWD: 4053,
    diffPct: 15.6,
    cashSell: 0.00139,
    marketMid: 0.001202,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/30 12:53:20';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-30';
