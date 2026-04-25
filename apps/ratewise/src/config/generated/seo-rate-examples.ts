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
 * 匯率時間：2026/04/25 06:11:26
 * 生成日期：2026-04-25
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
  /** 替代換匯管道（如明洞換匯所），僅特定幣別有此欄位 */
  alternativeProviders?: AlternativeProvider[];
}

/** 各幣別匯差範例：換 3 萬元新台幣，台銀現金賣出 vs 市場中間價（Google/XE/Wise/Apple）差距 */
export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {
  USD: {
    exampleTWD: 30000,
    foreignAtCash: 944,
    foreignAtMarketMid: 952,
    foreignAtBankMid: 954,
    diffForeign: 8,
    diffTWD: 228,
    diffPct: 0.8,
    cashSell: 31.77,
    marketMid: 31.528833,
    bankMid: 31.435,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149031,
    foreignAtMarketMid: 151937,
    foreignAtBankMid: 153925,
    diffForeign: 2906,
    diffTWD: 574,
    diffPct: 1.9,
    cashSell: 0.2013,
    marketMid: 0.19745,
    bankMid: 0.1949,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 801,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 816,
    diffForeign: 12,
    diffTWD: 444,
    diffPct: 1.5,
    cashSell: 37.44,
    marketMid: 36.885397,
    bankMid: 36.77,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 705,
    foreignAtBankMid: 706,
    diffForeign: 16,
    diffTWD: 693,
    diffPct: 2.4,
    cashSell: 43.56,
    marketMid: 42.553191,
    bankMid: 42.5,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6416,
    foreignAtMarketMid: 6498,
    foreignAtBankMid: 6529,
    diffForeign: 82,
    diffTWD: 380,
    diffPct: 1.3,
    cashSell: 4.676,
    marketMid: 4.616805,
    bankMid: 4.595,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1276596,
    foreignAtMarketMid: 1405916,
    foreignAtBankMid: 1392111,
    diffForeign: 129320,
    diffTWD: 2759,
    diffPct: 10.1,
    cashSell: 0.0235,
    marketMid: 0.021338,
    bankMid: 0.02155,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.3,
        rateBuy: 45.5,
        rateInverse: 0.022075,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-25',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7373,
    foreignAtMarketMid: 7466,
    foreignAtBankMid: 7562,
    diffForeign: 93,
    diffTWD: 373,
    diffPct: 1.3,
    cashSell: 4.069,
    marketMid: 4.018469,
    bankMid: 3.967,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1308,
    foreignAtMarketMid: 1332,
    foreignAtBankMid: 1331,
    diffForeign: 24,
    diffTWD: 538,
    diffPct: 1.8,
    cashSell: 22.93,
    marketMid: 22.518972,
    bankMid: 22.54,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1278,
    foreignAtMarketMid: 1303,
    foreignAtBankMid: 1303,
    diffForeign: 25,
    diffTWD: 567,
    diffPct: 1.9,
    cashSell: 23.47,
    marketMid: 23.026089,
    bankMid: 23.015,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1199,
    foreignAtMarketMid: 1216,
    foreignAtBankMid: 1221,
    diffForeign: 17,
    diffTWD: 428,
    diffPct: 1.4,
    cashSell: 25.02,
    marketMid: 24.662737,
    bankMid: 24.565,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 741,
    foreignAtMarketMid: 749,
    foreignAtBankMid: 752,
    diffForeign: 8,
    diffTWD: 328,
    diffPct: 1.1,
    cashSell: 40.51,
    marketMid: 40.067313,
    bankMid: 39.91,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1588,
    foreignAtMarketMid: 1620,
    foreignAtBankMid: 1625,
    diffForeign: 32,
    diffTWD: 598,
    diffPct: 2,
    cashSell: 18.89,
    marketMid: 18.513376,
    bankMid: 18.465,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28986,
    foreignAtMarketMid: 30819,
    foreignAtBankMid: 31915,
    diffForeign: 1833,
    diffTWD: 1785,
    diffPct: 6.3,
    cashSell: 1.035,
    marketMid: 0.973419,
    bankMid: 0.94,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51273,
    foreignAtMarketMid: 57751,
    foreignAtBankMid: 57792,
    diffForeign: 6478,
    diffTWD: 3365,
    diffPct: 12.6,
    cashSell: 0.5851,
    marketMid: 0.519474,
    bankMid: 0.5191,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16356284,
    foreignAtBankMid: 16393443,
    diffForeign: 2594816,
    diffTWD: 4759,
    diffPct: 18.9,
    cashSell: 0.00218,
    marketMid: 0.001834,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3553,
    foreignAtMarketMid: 3776,
    foreignAtBankMid: 3905,
    diffForeign: 223,
    diffTWD: 1776,
    diffPct: 6.3,
    cashSell: 8.444,
    marketMid: 7.9442,
    bankMid: 7.6815,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 25032814,
    foreignAtBankMid: 25974026,
    diffForeign: 2973990,
    diffTWD: 3564,
    diffPct: 13.5,
    cashSell: 0.00136,
    marketMid: 0.001198,
    bankMid: 0.001155,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/25 06:11:26';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-25';
