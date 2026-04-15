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
 * 匯率時間：2026/04/15 11:40:53
 * 生成日期：2026-04-15
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
    foreignAtCash: 941,
    foreignAtMarketMid: 950,
    foreignAtBankMid: 951,
    diffForeign: 9,
    diffTWD: 303,
    diffPct: 1,
    cashSell: 31.885,
    marketMid: 31.562668,
    bankMid: 31.55,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148221,
    foreignAtMarketMid: 150975,
    foreignAtBankMid: 153061,
    diffForeign: 2754,
    diffTWD: 547,
    diffPct: 1.9,
    cashSell: 0.2024,
    marketMid: 0.198709,
    bankMid: 0.196,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 794,
    foreignAtMarketMid: 806,
    foreignAtBankMid: 808,
    diffForeign: 12,
    diffTWD: 452,
    diffPct: 1.5,
    cashSell: 37.79,
    marketMid: 37.220382,
    bankMid: 37.12,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 685,
    foreignAtMarketMid: 701,
    foreignAtBankMid: 702,
    diffForeign: 16,
    diffTWD: 678,
    diffPct: 2.3,
    cashSell: 43.81,
    marketMid: 42.819217,
    bankMid: 42.75,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6378,
    foreignAtMarketMid: 6468,
    foreignAtBankMid: 6489,
    diffForeign: 90,
    diffTWD: 420,
    diffPct: 1.4,
    cashSell: 4.704,
    marketMid: 4.638219,
    bankMid: 4.623,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1269573,
    foreignAtMarketMid: 1399604,
    foreignAtBankMid: 1383764,
    diffForeign: 130031,
    diffTWD: 2787,
    diffPct: 10.2,
    cashSell: 0.02363,
    marketMid: 0.021435,
    bankMid: 0.02168,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.7,
        rateBuy: 45,
        rateInverse: 0.022371,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-15',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7351,
    foreignAtMarketMid: 7447,
    foreignAtBankMid: 7540,
    diffForeign: 96,
    diffTWD: 386,
    diffPct: 1.3,
    cashSell: 4.081,
    marketMid: 4.028441,
    bankMid: 3.979,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1308,
    foreignAtMarketMid: 1334,
    foreignAtBankMid: 1331,
    diffForeign: 26,
    diffTWD: 571,
    diffPct: 1.9,
    cashSell: 22.93,
    marketMid: 22.493646,
    bankMid: 22.54,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1284,
    foreignAtMarketMid: 1307,
    foreignAtBankMid: 1310,
    diffForeign: 23,
    diffTWD: 531,
    diffPct: 1.8,
    cashSell: 23.36,
    marketMid: 22.946832,
    bankMid: 22.905,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1208,
    foreignAtBankMid: 1212,
    diffForeign: 18,
    diffTWD: 446,
    diffPct: 1.5,
    cashSell: 25.2,
    marketMid: 24.824984,
    bankMid: 24.745,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 735,
    foreignAtMarketMid: 742,
    foreignAtBankMid: 746,
    diffForeign: 7,
    diffTWD: 314,
    diffPct: 1.1,
    cashSell: 40.84,
    marketMid: 40.412204,
    bankMid: 40.24,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1576,
    foreignAtMarketMid: 1611,
    foreignAtBankMid: 1612,
    diffForeign: 35,
    diffTWD: 639,
    diffPct: 2.2,
    cashSell: 19.03,
    marketMid: 18.624749,
    bankMid: 18.605,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28571,
    foreignAtMarketMid: 30432,
    foreignAtBankMid: 31414,
    diffForeign: 1861,
    diffTWD: 1834,
    diffPct: 6.5,
    cashSell: 1.05,
    marketMid: 0.985799,
    bankMid: 0.955,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50565,
    foreignAtMarketMid: 56921,
    foreignAtBankMid: 56894,
    diffForeign: 6356,
    diffTWD: 3350,
    diffPct: 12.6,
    cashSell: 0.5933,
    marketMid: 0.527046,
    bankMid: 0.5273,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 16298122,
    foreignAtBankMid: 15957447,
    diffForeign: 2845207,
    diffTWD: 5237,
    diffPct: 21.1,
    cashSell: 0.00223,
    marketMid: 0.001841,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3527,
    foreignAtMarketMid: 3756,
    foreignAtBankMid: 3874,
    diffForeign: 229,
    diffTWD: 1831,
    diffPct: 6.5,
    cashSell: 8.506,
    marketMid: 7.98671,
    bankMid: 7.7435,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24592192,
    foreignAtBankMid: 25316456,
    diffForeign: 3009458,
    diffTWD: 3671,
    diffPct: 13.9,
    cashSell: 0.00139,
    marketMid: 0.00122,
    bankMid: 0.001185,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/15 11:40:53';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-15';
