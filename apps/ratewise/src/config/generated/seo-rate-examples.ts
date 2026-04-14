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
 * 匯率時間：2026/04/14 11:42:59
 * 生成日期：2026-04-14
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
    foreignAtCash: 939,
    foreignAtMarketMid: 946,
    foreignAtBankMid: 949,
    diffForeign: 7,
    diffTWD: 234,
    diffPct: 0.8,
    cashSell: 31.955,
    marketMid: 31.70577,
    bankMid: 31.62,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148002,
    foreignAtMarketMid: 150874,
    foreignAtBankMid: 152827,
    diffForeign: 2872,
    diffTWD: 571,
    diffPct: 1.9,
    cashSell: 0.2027,
    marketMid: 0.198842,
    bankMid: 0.1963,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 794,
    foreignAtMarketMid: 807,
    foreignAtBankMid: 808,
    diffForeign: 13,
    diffTWD: 493,
    diffPct: 1.7,
    cashSell: 37.79,
    marketMid: 37.169194,
    bankMid: 37.12,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 686,
    foreignAtMarketMid: 702,
    foreignAtBankMid: 703,
    diffForeign: 16,
    diffTWD: 686,
    diffPct: 2.3,
    cashSell: 43.73,
    marketMid: 42.729565,
    bankMid: 42.67,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6365,
    foreignAtMarketMid: 6453,
    foreignAtBankMid: 6477,
    diffForeign: 88,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 4.713,
    marketMid: 4.649,
    bankMid: 4.632,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1274968,
    foreignAtMarketMid: 1401909,
    foreignAtBankMid: 1390176,
    diffForeign: 126941,
    diffTWD: 2716,
    diffPct: 10,
    cashSell: 0.02353,
    marketMid: 0.021399,
    bankMid: 0.02158,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.8,
        rateBuy: 45.4,
        rateInverse: 0.022321,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-14',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7330,
    foreignAtMarketMid: 7411,
    foreignAtBankMid: 7517,
    diffForeign: 81,
    diffTWD: 330,
    diffPct: 1.1,
    cashSell: 4.093,
    marketMid: 4.04796,
    bankMid: 3.991,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1313,
    foreignAtMarketMid: 1336,
    foreignAtBankMid: 1336,
    diffForeign: 23,
    diffTWD: 507,
    diffPct: 1.7,
    cashSell: 22.84,
    marketMid: 22.453745,
    bankMid: 22.45,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1282,
    foreignAtMarketMid: 1307,
    foreignAtBankMid: 1307,
    diffForeign: 25,
    diffTWD: 565,
    diffPct: 1.9,
    cashSell: 23.4,
    marketMid: 22.958949,
    bankMid: 22.945,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1205,
    foreignAtBankMid: 1212,
    diffForeign: 15,
    diffTWD: 379,
    diffPct: 1.3,
    cashSell: 25.21,
    marketMid: 24.891101,
    bankMid: 24.755,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 735,
    foreignAtMarketMid: 745,
    foreignAtBankMid: 746,
    diffForeign: 10,
    diffTWD: 426,
    diffPct: 1.4,
    cashSell: 40.83,
    marketMid: 40.249547,
    bankMid: 40.23,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1582,
    foreignAtMarketMid: 1616,
    foreignAtBankMid: 1619,
    diffForeign: 34,
    diffTWD: 619,
    diffPct: 2.1,
    cashSell: 18.96,
    marketMid: 18.569068,
    bankMid: 18.535,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28588,
    foreignAtMarketMid: 30372,
    foreignAtBankMid: 31433,
    diffForeign: 1784,
    diffTWD: 1762,
    diffPct: 6.2,
    cashSell: 1.0494,
    marketMid: 0.987764,
    bankMid: 0.9544,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50412,
    foreignAtMarketMid: 56909,
    foreignAtBankMid: 56700,
    diffForeign: 6497,
    diffTWD: 3425,
    diffPct: 12.9,
    cashSell: 0.5951,
    marketMid: 0.527159,
    bankMid: 0.5291,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 16188130,
    foreignAtBankMid: 15957447,
    diffForeign: 2735215,
    diffTWD: 5069,
    diffPct: 20.3,
    cashSell: 0.00223,
    marketMid: 0.001853,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3527,
    foreignAtMarketMid: 3753,
    foreignAtBankMid: 3874,
    diffForeign: 226,
    diffTWD: 1808,
    diffPct: 6.4,
    cashSell: 8.507,
    marketMid: 7.994372,
    bankMid: 7.7445,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24813835,
    foreignAtBankMid: 25316456,
    diffForeign: 3231101,
    diffTWD: 3906,
    diffPct: 15,
    cashSell: 0.00139,
    marketMid: 0.001209,
    bankMid: 0.001185,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/14 11:42:59';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-14';
