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
 * 匯率時間：2026/04/20 07:52:29
 * 生成日期：2026-04-20
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
    foreignAtCash: 942,
    foreignAtMarketMid: 953,
    foreignAtBankMid: 952,
    diffForeign: 11,
    diffTWD: 336,
    diffPct: 1.1,
    cashSell: 31.85,
    marketMid: 31.493087,
    bankMid: 31.515,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148515,
    foreignAtMarketMid: 151226,
    foreignAtBankMid: 153374,
    diffForeign: 2711,
    diffTWD: 538,
    diffPct: 1.8,
    cashSell: 0.202,
    marketMid: 0.198378,
    bankMid: 0.1956,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 798,
    foreignAtMarketMid: 807,
    foreignAtBankMid: 812,
    diffForeign: 9,
    diffTWD: 357,
    diffPct: 1.2,
    cashSell: 37.6,
    marketMid: 37.152623,
    bankMid: 36.93,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 690,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 707,
    diffForeign: 13,
    diffTWD: 588,
    diffPct: 2,
    cashSell: 43.5,
    marketMid: 42.647561,
    bankMid: 42.44,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6394,
    foreignAtMarketMid: 6483,
    foreignAtBankMid: 6506,
    diffForeign: 89,
    diffTWD: 412,
    diffPct: 1.4,
    cashSell: 4.692,
    marketMid: 4.627487,
    bankMid: 4.611,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1265823,
    foreignAtMarketMid: 1395334,
    foreignAtBankMid: 1379310,
    diffForeign: 129511,
    diffTWD: 2785,
    diffPct: 10.2,
    cashSell: 0.0237,
    marketMid: 0.0215,
    bankMid: 0.02175,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.5,
        rateBuy: 45.5,
        rateInverse: 0.022472,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-20',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7349,
    foreignAtMarketMid: 7459,
    foreignAtBankMid: 7538,
    diffForeign: 110,
    diffTWD: 443,
    diffPct: 1.5,
    cashSell: 4.082,
    marketMid: 4.021782,
    bankMid: 3.98,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1309,
    foreignAtMarketMid: 1333,
    foreignAtBankMid: 1332,
    diffForeign: 24,
    diffTWD: 535,
    diffPct: 1.8,
    cashSell: 22.92,
    marketMid: 22.511368,
    bankMid: 22.53,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1278,
    foreignAtMarketMid: 1306,
    foreignAtBankMid: 1303,
    diffForeign: 28,
    diffTWD: 632,
    diffPct: 2.2,
    cashSell: 23.47,
    marketMid: 22.975829,
    bankMid: 23.015,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1194,
    foreignAtMarketMid: 1210,
    foreignAtBankMid: 1216,
    diffForeign: 16,
    diffTWD: 405,
    diffPct: 1.4,
    cashSell: 25.13,
    marketMid: 24.791135,
    bankMid: 24.675,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 737,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 748,
    diffForeign: 7,
    diffTWD: 293,
    diffPct: 1,
    cashSell: 40.7,
    marketMid: 40.303079,
    bankMid: 40.1,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1588,
    foreignAtMarketMid: 1623,
    foreignAtBankMid: 1625,
    diffForeign: 35,
    diffTWD: 636,
    diffPct: 2.2,
    cashSell: 18.89,
    marketMid: 18.489415,
    bankMid: 18.465,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28711,
    foreignAtMarketMid: 30531,
    foreignAtBankMid: 31582,
    diffForeign: 1820,
    diffTWD: 1789,
    diffPct: 6.3,
    cashSell: 1.0449,
    marketMid: 0.982603,
    bankMid: 0.9499,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50386,
    foreignAtMarketMid: 56871,
    foreignAtBankMid: 56668,
    diffForeign: 6485,
    diffTWD: 3421,
    diffPct: 12.9,
    cashSell: 0.5954,
    marketMid: 0.527513,
    bankMid: 0.5294,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16331136,
    foreignAtBankMid: 16393443,
    diffForeign: 2569668,
    diffTWD: 4720,
    diffPct: 18.7,
    cashSell: 0.00218,
    marketMid: 0.001837,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3534,
    foreignAtMarketMid: 3764,
    foreignAtBankMid: 3883,
    diffForeign: 230,
    diffTWD: 1835,
    diffPct: 6.5,
    cashSell: 8.489,
    marketMid: 7.969779,
    bankMid: 7.7265,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 24978568,
    foreignAtBankMid: 25974026,
    diffForeign: 2919744,
    diffTWD: 3507,
    diffPct: 13.2,
    cashSell: 0.00136,
    marketMid: 0.001201,
    bankMid: 0.001155,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/20 07:52:29';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-20';
