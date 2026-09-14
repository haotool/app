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
 * 匯率時間：2026/09/14 15:09:44
 * 生成日期：2026-09-14
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
    foreignAtCash: 936,
    foreignAtMarketMid: 949,
    foreignAtBankMid: 946,
    diffForeign: 13,
    diffTWD: 412,
    diffPct: 1.4,
    cashSell: 32.035,
    marketMid: 31.595577,
    bankMid: 31.7,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143266,
    foreignAtMarketMid: 145511,
    foreignAtBankMid: 147783,
    diffForeign: 2245,
    diffTWD: 463,
    diffPct: 1.6,
    cashSell: 0.2094,
    marketMid: 0.206169,
    bankMid: 0.203,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 806,
    foreignAtMarketMid: 817,
    foreignAtBankMid: 821,
    diffForeign: 11,
    diffTWD: 417,
    diffPct: 1.4,
    cashSell: 37.22,
    marketMid: 36.702635,
    bankMid: 36.55,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 685,
    foreignAtMarketMid: 702,
    foreignAtBankMid: 702,
    diffForeign: 17,
    diffTWD: 724,
    diffPct: 2.5,
    cashSell: 43.78,
    marketMid: 42.724088,
    bankMid: 42.72,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6250,
    foreignAtMarketMid: 6369,
    foreignAtBankMid: 6357,
    diffForeign: 119,
    diffTWD: 561,
    diffPct: 1.9,
    cashSell: 4.8,
    marketMid: 4.710316,
    bankMid: 4.719,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1165954,
    foreignAtMarketMid: 1274391,
    foreignAtBankMid: 1261564,
    diffForeign: 108437,
    diffTWD: 2553,
    diffPct: 9.3,
    cashSell: 0.02573,
    marketMid: 0.023541,
    bankMid: 0.02378,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.7,
        rateBuy: 42,
        rateInverse: 0.023981,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-14',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7321,
    foreignAtMarketMid: 7429,
    foreignAtBankMid: 7508,
    diffForeign: 108,
    diffTWD: 439,
    diffPct: 1.5,
    cashSell: 4.098,
    marketMid: 4.038038,
    bankMid: 3.996,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1302,
    foreignAtMarketMid: 1326,
    foreignAtBankMid: 1324,
    diffForeign: 24,
    diffTWD: 563,
    diffPct: 1.9,
    cashSell: 23.05,
    marketMid: 22.617782,
    bankMid: 22.66,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1288,
    foreignAtMarketMid: 1314,
    foreignAtBankMid: 1313,
    diffForeign: 26,
    diffTWD: 604,
    diffPct: 2.1,
    cashSell: 23.3,
    marketMid: 22.830529,
    bankMid: 22.845,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1183,
    foreignAtMarketMid: 1201,
    foreignAtBankMid: 1205,
    diffForeign: 18,
    diffTWD: 428,
    diffPct: 1.4,
    cashSell: 25.35,
    marketMid: 24.988755,
    bankMid: 24.895,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 766,
    foreignAtMarketMid: 773,
    foreignAtBankMid: 778,
    diffForeign: 7,
    diffTWD: 258,
    diffPct: 0.9,
    cashSell: 39.17,
    marketMid: 38.833443,
    bankMid: 38.57,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1601,
    foreignAtMarketMid: 1634,
    foreignAtBankMid: 1638,
    diffForeign: 33,
    diffTWD: 601,
    diffPct: 2,
    cashSell: 18.74,
    marketMid: 18.364798,
    bankMid: 18.315,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29461,
    foreignAtMarketMid: 31343,
    foreignAtBankMid: 32492,
    diffForeign: 1882,
    diffTWD: 1801,
    diffPct: 6.4,
    cashSell: 1.0183,
    marketMid: 0.957152,
    bankMid: 0.9233,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52475,
    foreignAtMarketMid: 59518,
    foreignAtBankMid: 59324,
    diffForeign: 7043,
    diffTWD: 3550,
    diffPct: 13.4,
    cashSell: 0.5717,
    marketMid: 0.504048,
    bankMid: 0.5057,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16703522,
    foreignAtBankMid: 16853933,
    diffForeign: 2619015,
    diffTWD: 4704,
    diffPct: 18.6,
    cashSell: 0.00213,
    marketMid: 0.001796,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3618,
    foreignAtMarketMid: 3857,
    foreignAtBankMid: 3985,
    diffForeign: 239,
    diffTWD: 1859,
    diffPct: 6.6,
    cashSell: 8.291,
    marketMid: 7.777138,
    bankMid: 7.5285,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24508601,
    foreignAtBankMid: 24896266,
    diffForeign: 3232005,
    diffTWD: 3956,
    diffPct: 15.2,
    cashSell: 0.00141,
    marketMid: 0.001224,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/14 15:09:44';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-14';
