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
 * 匯率時間：2026/04/30 01:53:44
 * 生成日期：2026-04-29
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
    foreignAtCash: 943,
    foreignAtMarketMid: 950,
    foreignAtBankMid: 953,
    diffForeign: 7,
    diffTWD: 246,
    diffPct: 0.8,
    cashSell: 31.83,
    marketMid: 31.568646,
    bankMid: 31.495,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149626,
    foreignAtMarketMid: 151815,
    foreignAtBankMid: 154560,
    diffForeign: 2189,
    diffTWD: 433,
    diffPct: 1.5,
    cashSell: 0.2005,
    marketMid: 0.197609,
    bankMid: 0.1941,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 801,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 815,
    diffForeign: 12,
    diffTWD: 437,
    diffPct: 1.5,
    cashSell: 37.46,
    marketMid: 36.91399,
    bankMid: 36.79,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 704,
    foreignAtBankMid: 706,
    diffForeign: 16,
    diffTWD: 676,
    diffPct: 2.3,
    cashSell: 43.58,
    marketMid: 42.598509,
    bankMid: 42.52,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6412,
    foreignAtMarketMid: 6501,
    foreignAtBankMid: 6525,
    diffForeign: 89,
    diffTWD: 412,
    diffPct: 1.4,
    cashSell: 4.679,
    marketMid: 4.614675,
    bankMid: 4.598,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1277139,
    foreignAtMarketMid: 1399989,
    foreignAtBankMid: 1392758,
    diffForeign: 122850,
    diffTWD: 2633,
    diffPct: 9.6,
    cashSell: 0.02349,
    marketMid: 0.021429,
    bankMid: 0.02154,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.2,
        rateBuy: 45.5,
        rateInverse: 0.022124,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-29',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7360,
    foreignAtMarketMid: 7454,
    foreignAtBankMid: 7549,
    diffForeign: 94,
    diffTWD: 379,
    diffPct: 1.3,
    cashSell: 4.076,
    marketMid: 4.024453,
    bankMid: 3.974,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1310,
    foreignAtMarketMid: 1324,
    foreignAtBankMid: 1333,
    diffForeign: 14,
    diffTWD: 317,
    diffPct: 1.1,
    cashSell: 22.9,
    marketMid: 22.657755,
    bankMid: 22.51,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1277,
    foreignAtMarketMid: 1301,
    foreignAtBankMid: 1302,
    diffForeign: 24,
    diffTWD: 548,
    diffPct: 1.9,
    cashSell: 23.49,
    marketMid: 23.061135,
    bankMid: 23.035,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1200,
    foreignAtMarketMid: 1215,
    foreignAtBankMid: 1222,
    diffForeign: 15,
    diffTWD: 371,
    diffPct: 1.3,
    cashSell: 25.01,
    marketMid: 24.700506,
    bankMid: 24.555,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 743,
    foreignAtMarketMid: 751,
    foreignAtBankMid: 754,
    diffForeign: 8,
    diffTWD: 311,
    diffPct: 1,
    cashSell: 40.37,
    marketMid: 39.952058,
    bankMid: 39.77,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1591,
    foreignAtMarketMid: 1615,
    foreignAtBankMid: 1627,
    diffForeign: 24,
    diffTWD: 457,
    diffPct: 1.5,
    cashSell: 18.86,
    marketMid: 18.572861,
    bankMid: 18.435,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29234,
    foreignAtMarketMid: 30913,
    foreignAtBankMid: 32216,
    diffForeign: 1679,
    diffTWD: 1629,
    diffPct: 5.7,
    cashSell: 1.0262,
    marketMid: 0.970481,
    bankMid: 0.9312,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51876,
    foreignAtMarketMid: 58101,
    foreignAtBankMid: 58559,
    diffForeign: 6225,
    diffTWD: 3214,
    diffPct: 12,
    cashSell: 0.5783,
    marketMid: 0.516342,
    bankMid: 0.5123,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16392745,
    foreignAtBankMid: 16393443,
    diffForeign: 2631277,
    diffTWD: 4815,
    diffPct: 19.1,
    cashSell: 0.00218,
    marketMid: 0.00183,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3535,
    foreignAtMarketMid: 3761,
    foreignAtBankMid: 3884,
    diffForeign: 226,
    diffTWD: 1798,
    diffPct: 6.4,
    cashSell: 8.486,
    marketMid: 7.977344,
    bankMid: 7.7235,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 24985142,
    foreignAtBankMid: 25974026,
    diffForeign: 2926318,
    diffTWD: 3514,
    diffPct: 13.3,
    cashSell: 0.00136,
    marketMid: 0.001201,
    bankMid: 0.001155,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/30 01:53:44';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-29';
