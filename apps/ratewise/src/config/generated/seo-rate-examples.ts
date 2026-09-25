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
 * 匯率時間：2026/09/25 08:43:43
 * 生成日期：2026-09-25
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
    foreignAtMarketMid: 943,
    foreignAtBankMid: 946,
    diffForeign: 7,
    diffTWD: 211,
    diffPct: 0.7,
    cashSell: 32.05,
    marketMid: 31.824836,
    bankMid: 31.715,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147131,
    foreignAtMarketMid: 149731,
    foreignAtBankMid: 151899,
    diffForeign: 2600,
    diffTWD: 521,
    diffPct: 1.8,
    cashSell: 0.2039,
    marketMid: 0.200359,
    bankMid: 0.1975,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 818,
    foreignAtMarketMid: 829,
    foreignAtBankMid: 833,
    diffForeign: 11,
    diffTWD: 423,
    diffPct: 1.4,
    cashSell: 36.69,
    marketMid: 36.172906,
    bankMid: 36.02,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 699,
    foreignAtMarketMid: 713,
    foreignAtBankMid: 717,
    diffForeign: 14,
    diffTWD: 617,
    diffPct: 2.1,
    cashSell: 42.93,
    marketMid: 42.04684,
    bankMid: 41.87,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6251,
    foreignAtMarketMid: 6330,
    foreignAtBankMid: 6359,
    diffForeign: 79,
    diffTWD: 373,
    diffPct: 1.3,
    cashSell: 4.799,
    marketMid: 4.739336,
    bankMid: 4.718,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1181568,
    foreignAtMarketMid: 1289249,
    foreignAtBankMid: 1279863,
    diffForeign: 107681,
    diffTWD: 2506,
    diffPct: 9.1,
    cashSell: 0.02539,
    marketMid: 0.023269,
    bankMid: 0.02344,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.8,
        rateBuy: 42,
        rateInverse: 0.023923,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-25',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7315,
    foreignAtMarketMid: 7396,
    foreignAtBankMid: 7502,
    diffForeign: 81,
    diffTWD: 326,
    diffPct: 1.1,
    cashSell: 4.101,
    marketMid: 4.05645,
    bankMid: 3.999,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1324,
    foreignAtMarketMid: 1343,
    foreignAtBankMid: 1347,
    diffForeign: 19,
    diffTWD: 436,
    diffPct: 1.5,
    cashSell: 22.66,
    marketMid: 22.330899,
    bankMid: 22.27,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1311,
    foreignAtMarketMid: 1333,
    foreignAtBankMid: 1337,
    diffForeign: 22,
    diffTWD: 508,
    diffPct: 1.7,
    cashSell: 22.89,
    marketMid: 22.502757,
    bankMid: 22.435,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1192,
    foreignAtMarketMid: 1206,
    foreignAtBankMid: 1214,
    diffForeign: 14,
    diffTWD: 360,
    diffPct: 1.2,
    cashSell: 25.17,
    marketMid: 24.868199,
    bankMid: 24.715,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 774,
    foreignAtMarketMid: 779,
    foreignAtBankMid: 786,
    diffForeign: 5,
    diffTWD: 226,
    diffPct: 0.8,
    cashSell: 38.78,
    marketMid: 38.488184,
    bankMid: 38.18,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1633,
    foreignAtMarketMid: 1665,
    foreignAtBankMid: 1672,
    diffForeign: 32,
    diffTWD: 570,
    diffPct: 1.9,
    cashSell: 18.37,
    marketMid: 18.021265,
    bankMid: 17.945,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29679,
    foreignAtMarketMid: 31537,
    foreignAtBankMid: 32758,
    diffForeign: 1858,
    diffTWD: 1767,
    diffPct: 6.3,
    cashSell: 1.0108,
    marketMid: 0.951263,
    bankMid: 0.9158,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52402,
    foreignAtMarketMid: 59191,
    foreignAtBankMid: 59230,
    diffForeign: 6789,
    diffTWD: 3441,
    diffPct: 13,
    cashSell: 0.5725,
    marketMid: 0.506832,
    bankMid: 0.5065,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16868117,
    foreignAtBankMid: 17341040,
    diffForeign: 2445040,
    diffTWD: 4349,
    diffPct: 17,
    cashSell: 0.00208,
    marketMid: 0.001779,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3618,
    foreignAtMarketMid: 3854,
    foreignAtBankMid: 3984,
    diffForeign: 236,
    diffTWD: 1842,
    diffPct: 6.5,
    cashSell: 8.293,
    marketMid: 7.783737,
    bankMid: 7.5305,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24494391,
    foreignAtBankMid: 25316456,
    diffForeign: 2911657,
    diffTWD: 3566,
    diffPct: 13.5,
    cashSell: 0.00139,
    marketMid: 0.001225,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/25 08:43:43';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-25';
