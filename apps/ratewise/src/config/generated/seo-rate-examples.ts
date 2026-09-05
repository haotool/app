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
 * 匯率時間：2026/09/05 06:11:24
 * 生成日期：2026-09-05
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
    foreignAtCash: 940,
    foreignAtMarketMid: 948,
    foreignAtBankMid: 950,
    diffForeign: 8,
    diffTWD: 254,
    diffPct: 0.9,
    cashSell: 31.9,
    marketMid: 31.629555,
    bankMid: 31.565,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145560,
    foreignAtMarketMid: 147952,
    foreignAtBankMid: 150225,
    diffForeign: 2392,
    diffTWD: 485,
    diffPct: 1.6,
    cashSell: 0.2061,
    marketMid: 0.202768,
    bankMid: 0.1997,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 805,
    foreignAtMarketMid: 817,
    foreignAtBankMid: 820,
    diffForeign: 12,
    diffTWD: 430,
    diffPct: 1.5,
    cashSell: 37.27,
    marketMid: 36.736343,
    bankMid: 36.6,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 686,
    foreignAtMarketMid: 702,
    foreignAtBankMid: 703,
    diffForeign: 16,
    diffTWD: 658,
    diffPct: 2.2,
    cashSell: 43.71,
    marketMid: 42.751486,
    bankMid: 42.65,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6274,
    foreignAtMarketMid: 6363,
    foreignAtBankMid: 6382,
    diffForeign: 89,
    diffTWD: 422,
    diffPct: 1.4,
    cashSell: 4.782,
    marketMid: 4.714757,
    bankMid: 4.701,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1167770,
    foreignAtMarketMid: 1278491,
    foreignAtBankMid: 1263690,
    diffForeign: 110721,
    diffTWD: 2598,
    diffPct: 9.5,
    cashSell: 0.02569,
    marketMid: 0.023465,
    bankMid: 0.02374,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.55,
        rateBuy: 41.8,
        rateInverse: 0.024067,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-05',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7348,
    foreignAtMarketMid: 7437,
    foreignAtBankMid: 7536,
    diffForeign: 89,
    diffTWD: 359,
    diffPct: 1.2,
    cashSell: 4.083,
    marketMid: 4.034112,
    bankMid: 3.981,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1294,
    foreignAtMarketMid: 1317,
    foreignAtBankMid: 1316,
    diffForeign: 23,
    diffTWD: 517,
    diffPct: 1.8,
    cashSell: 23.18,
    marketMid: 22.7806,
    bankMid: 22.79,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1289,
    foreignAtMarketMid: 1312,
    foreignAtBankMid: 1314,
    diffForeign: 23,
    diffTWD: 544,
    diffPct: 1.8,
    cashSell: 23.28,
    marketMid: 22.858188,
    bankMid: 22.825,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1186,
    foreignAtMarketMid: 1202,
    foreignAtBankMid: 1207,
    diffForeign: 16,
    diffTWD: 394,
    diffPct: 1.3,
    cashSell: 25.3,
    marketMid: 24.967542,
    bankMid: 24.845,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 760,
    foreignAtMarketMid: 768,
    foreignAtBankMid: 772,
    diffForeign: 8,
    diffTWD: 309,
    diffPct: 1,
    cashSell: 39.46,
    marketMid: 39.053347,
    bankMid: 38.86,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1581,
    foreignAtMarketMid: 1613,
    foreignAtBankMid: 1617,
    diffForeign: 32,
    diffTWD: 605,
    diffPct: 2.1,
    cashSell: 18.98,
    marketMid: 18.597385,
    bankMid: 18.555,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29348,
    foreignAtMarketMid: 31220,
    foreignAtBankMid: 32355,
    diffForeign: 1872,
    diffTWD: 1798,
    diffPct: 6.4,
    cashSell: 1.0222,
    marketMid: 0.960924,
    bankMid: 0.9272,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52530,
    foreignAtMarketMid: 59462,
    foreignAtBankMid: 59394,
    diffForeign: 6932,
    diffTWD: 3497,
    diffPct: 13.2,
    cashSell: 0.5711,
    marketMid: 0.504521,
    bankMid: 0.5051,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16768852,
    foreignAtBankMid: 17341040,
    diffForeign: 2345775,
    diffTWD: 4197,
    diffPct: 16.3,
    cashSell: 0.00208,
    marketMid: 0.001789,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3606,
    foreignAtMarketMid: 3837,
    foreignAtBankMid: 3970,
    diffForeign: 231,
    diffTWD: 1808,
    diffPct: 6.4,
    cashSell: 8.32,
    marketMid: 7.818547,
    bankMid: 7.5575,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24622814,
    foreignAtBankMid: 25531915,
    diffForeign: 2883684,
    diffTWD: 3513,
    diffPct: 13.3,
    cashSell: 0.00138,
    marketMid: 0.001218,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/05 06:11:24';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-05';
