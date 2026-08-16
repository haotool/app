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
 * 匯率時間：2026/08/15 09:45:46
 * 生成日期：2026-08-16
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
    foreignAtCash: 929,
    foreignAtMarketMid: 938,
    foreignAtBankMid: 939,
    diffForeign: 9,
    diffTWD: 277,
    diffPct: 0.9,
    cashSell: 32.285,
    marketMid: 31.986694,
    bankMid: 31.95,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146628,
    foreignAtMarketMid: 149051,
    foreignAtBankMid: 151362,
    diffForeign: 2423,
    diffTWD: 488,
    diffPct: 1.7,
    cashSell: 0.2046,
    marketMid: 0.201273,
    bankMid: 0.1982,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 799,
    foreignAtMarketMid: 810,
    foreignAtBankMid: 813,
    diffForeign: 11,
    diffTWD: 431,
    diffPct: 1.5,
    cashSell: 37.57,
    marketMid: 37.03018,
    bankMid: 36.9,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 678,
    foreignAtMarketMid: 692,
    foreignAtBankMid: 694,
    diffForeign: 14,
    diffTWD: 628,
    diffPct: 2.1,
    cashSell: 44.26,
    marketMid: 43.333189,
    bankMid: 43.2,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6233,
    foreignAtMarketMid: 6300,
    foreignAtBankMid: 6340,
    diffForeign: 67,
    diffTWD: 318,
    diffPct: 1.1,
    cashSell: 4.813,
    marketMid: 4.761905,
    bankMid: 4.732,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1211632,
    foreignAtMarketMid: 1327798,
    foreignAtBankMid: 1315213,
    diffForeign: 116166,
    diffTWD: 2625,
    diffPct: 9.6,
    cashSell: 0.02476,
    marketMid: 0.022594,
    bankMid: 0.02281,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.8,
        rateBuy: 43.7,
        rateInverse: 0.023364,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-16',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7267,
    foreignAtMarketMid: 7356,
    foreignAtBankMid: 7452,
    diffForeign: 89,
    diffTWD: 363,
    diffPct: 1.2,
    cashSell: 4.128,
    marketMid: 4.078071,
    bankMid: 4.026,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1300,
    foreignAtMarketMid: 1325,
    foreignAtBankMid: 1323,
    diffForeign: 25,
    diffTWD: 555,
    diffPct: 1.9,
    cashSell: 23.07,
    marketMid: 22.642877,
    bankMid: 22.68,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1277,
    foreignAtMarketMid: 1302,
    foreignAtBankMid: 1302,
    diffForeign: 25,
    diffTWD: 578,
    diffPct: 2,
    cashSell: 23.5,
    marketMid: 23.047316,
    bankMid: 23.045,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1183,
    foreignAtMarketMid: 1199,
    foreignAtBankMid: 1205,
    diffForeign: 16,
    diffTWD: 401,
    diffPct: 1.4,
    cashSell: 25.36,
    marketMid: 25.020642,
    bankMid: 24.905,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 754,
    foreignAtMarketMid: 760,
    foreignAtBankMid: 766,
    diffForeign: 6,
    diffTWD: 242,
    diffPct: 0.8,
    cashSell: 39.77,
    marketMid: 39.449288,
    bankMid: 39.17,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1559,
    foreignAtMarketMid: 1594,
    foreignAtBankMid: 1594,
    diffForeign: 35,
    diffTWD: 656,
    diffPct: 2.2,
    cashSell: 19.24,
    marketMid: 18.819278,
    bankMid: 18.815,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29191,
    foreignAtMarketMid: 31054,
    foreignAtBankMid: 32165,
    diffForeign: 1863,
    diffTWD: 1799,
    diffPct: 6.4,
    cashSell: 1.0277,
    marketMid: 0.966065,
    bankMid: 0.9327,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51107,
    foreignAtMarketMid: 57676,
    foreignAtBankMid: 57582,
    diffForeign: 6569,
    diffTWD: 3417,
    diffPct: 12.9,
    cashSell: 0.587,
    marketMid: 0.520149,
    bankMid: 0.521,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16728434,
    foreignAtBankMid: 17341040,
    diffForeign: 2305357,
    diffTWD: 4134,
    diffPct: 16,
    cashSell: 0.00208,
    marketMid: 0.001793,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3599,
    foreignAtMarketMid: 3830,
    foreignAtBankMid: 3962,
    diffForeign: 231,
    diffTWD: 1808,
    diffPct: 6.4,
    cashSell: 8.335,
    marketMid: 7.832632,
    bankMid: 7.5725,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24006954,
    foreignAtBankMid: 25316456,
    diffForeign: 2424220,
    diffTWD: 3029,
    diffPct: 11.2,
    cashSell: 0.00139,
    marketMid: 0.00125,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/15 09:45:46';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-16';
