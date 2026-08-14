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
 * 匯率時間：2026/08/14 06:44:13
 * 生成日期：2026-08-14
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
    foreignAtCash: 925,
    foreignAtMarketMid: 934,
    foreignAtBankMid: 935,
    diffForeign: 9,
    diffTWD: 279,
    diffPct: 0.9,
    cashSell: 32.425,
    marketMid: 32.123354,
    bankMid: 32.09,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146128,
    foreignAtMarketMid: 148793,
    foreignAtBankMid: 150830,
    diffForeign: 2665,
    diffTWD: 537,
    diffPct: 1.8,
    cashSell: 0.2053,
    marketMid: 0.201622,
    bankMid: 0.1989,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 798,
    foreignAtMarketMid: 810,
    foreignAtBankMid: 812,
    diffForeign: 12,
    diffTWD: 441,
    diffPct: 1.5,
    cashSell: 37.61,
    marketMid: 37.057625,
    bankMid: 36.94,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 677,
    foreignAtMarketMid: 692,
    foreignAtBankMid: 694,
    diffForeign: 15,
    diffTWD: 649,
    diffPct: 2.2,
    cashSell: 44.31,
    marketMid: 43.351975,
    bankMid: 43.25,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6206,
    foreignAtMarketMid: 6288,
    foreignAtBankMid: 6312,
    diffForeign: 82,
    diffTWD: 391,
    diffPct: 1.3,
    cashSell: 4.834,
    marketMid: 4.770992,
    bankMid: 4.753,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1208216,
    foreignAtMarketMid: 1324477,
    foreignAtBankMid: 1311189,
    diffForeign: 116261,
    diffTWD: 2633,
    diffPct: 9.6,
    cashSell: 0.02483,
    marketMid: 0.02265,
    bankMid: 0.02288,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43,
        rateBuy: 43.3,
        rateInverse: 0.023256,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-14',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7236,
    foreignAtMarketMid: 7327,
    foreignAtBankMid: 7418,
    diffForeign: 91,
    diffTWD: 374,
    diffPct: 1.3,
    cashSell: 4.146,
    marketMid: 4.094317,
    bankMid: 4.044,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1299,
    foreignAtMarketMid: 1323,
    foreignAtBankMid: 1322,
    diffForeign: 24,
    diffTWD: 538,
    diffPct: 1.8,
    cashSell: 23.09,
    marketMid: 22.676251,
    bankMid: 22.7,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1276,
    foreignAtMarketMid: 1301,
    foreignAtBankMid: 1301,
    diffForeign: 25,
    diffTWD: 582,
    diffPct: 2,
    cashSell: 23.51,
    marketMid: 23.054224,
    bankMid: 23.055,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1179,
    foreignAtMarketMid: 1195,
    foreignAtBankMid: 1200,
    diffForeign: 16,
    diffTWD: 416,
    diffPct: 1.4,
    cashSell: 25.45,
    marketMid: 25.097252,
    bankMid: 24.995,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 752,
    foreignAtMarketMid: 759,
    foreignAtBankMid: 763,
    diffForeign: 7,
    diffTWD: 298,
    diffPct: 1,
    cashSell: 39.9,
    marketMid: 39.503832,
    bankMid: 39.3,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1564,
    foreignAtMarketMid: 1597,
    foreignAtBankMid: 1600,
    diffForeign: 33,
    diffTWD: 610,
    diffPct: 2.1,
    cashSell: 19.18,
    marketMid: 18.790282,
    bankMid: 18.755,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29112,
    foreignAtMarketMid: 30961,
    foreignAtBankMid: 32068,
    diffForeign: 1849,
    diffTWD: 1791,
    diffPct: 6.3,
    cashSell: 1.0305,
    marketMid: 0.968976,
    bankMid: 0.9355,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50822,
    foreignAtMarketMid: 57316,
    foreignAtBankMid: 57219,
    diffForeign: 6494,
    diffTWD: 3399,
    diffPct: 12.8,
    cashSell: 0.5903,
    marketMid: 0.523413,
    bankMid: 0.5243,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16692268,
    foreignAtBankMid: 17341040,
    diffForeign: 2269191,
    diffTWD: 4078,
    diffPct: 15.7,
    cashSell: 0.00208,
    marketMid: 0.001797,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3586,
    foreignAtMarketMid: 3817,
    foreignAtBankMid: 3945,
    diffForeign: 231,
    diffTWD: 1818,
    diffPct: 6.4,
    cashSell: 8.367,
    marketMid: 7.860029,
    bankMid: 7.6045,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24291827,
    foreignAtBankMid: 25104603,
    diffForeign: 2863256,
    diffTWD: 3536,
    diffPct: 13.4,
    cashSell: 0.0014,
    marketMid: 0.001235,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/14 06:44:13';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-14';
