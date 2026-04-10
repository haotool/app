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
 * 匯率時間：2026/04/10 23:00:24
 * 生成日期：2026-04-10
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
    foreignAtCash: 938,
    foreignAtMarketMid: 944,
    foreignAtBankMid: 947,
    diffForeign: 6,
    diffTWD: 214,
    diffPct: 0.7,
    cashSell: 32,
    marketMid: 31.772256,
    bankMid: 31.665,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147783,
    foreignAtMarketMid: 150124,
    foreignAtBankMid: 152594,
    diffForeign: 2341,
    diffTWD: 468,
    diffPct: 1.6,
    cashSell: 0.203,
    marketMid: 0.199835,
    bankMid: 0.1966,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 796,
    foreignAtMarketMid: 808,
    foreignAtBankMid: 810,
    diffForeign: 12,
    diffTWD: 465,
    diffPct: 1.6,
    cashSell: 37.71,
    marketMid: 37.125037,
    bankMid: 37.04,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 706,
    diffForeign: 15,
    diffTWD: 634,
    diffPct: 2.2,
    cashSell: 43.58,
    marketMid: 42.658476,
    bankMid: 42.52,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6360,
    foreignAtMarketMid: 6444,
    foreignAtBankMid: 6471,
    diffForeign: 84,
    diffTWD: 391,
    diffPct: 1.3,
    cashSell: 4.717,
    marketMid: 4.655493,
    bankMid: 4.636,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1271725,
    foreignAtMarketMid: 1393796,
    foreignAtBankMid: 1386322,
    diffForeign: 122071,
    diffTWD: 2627,
    diffPct: 9.6,
    cashSell: 0.02359,
    marketMid: 0.021524,
    bankMid: 0.02164,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45,
        rateBuy: 45.4,
        rateInverse: 0.022222,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-10',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7319,
    foreignAtMarketMid: 7401,
    foreignAtBankMid: 7506,
    diffForeign: 82,
    diffTWD: 332,
    diffPct: 1.1,
    cashSell: 4.099,
    marketMid: 4.053703,
    bankMid: 3.997,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1311,
    foreignAtMarketMid: 1336,
    foreignAtBankMid: 1334,
    diffForeign: 25,
    diffTWD: 552,
    diffPct: 1.9,
    cashSell: 22.88,
    marketMid: 22.459293,
    bankMid: 22.49,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1283,
    foreignAtMarketMid: 1306,
    foreignAtBankMid: 1309,
    diffForeign: 23,
    diffTWD: 520,
    diffPct: 1.8,
    cashSell: 23.38,
    marketMid: 22.974774,
    bankMid: 22.925,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1188,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1210,
    diffForeign: 15,
    diffTWD: 364,
    diffPct: 1.2,
    cashSell: 25.25,
    marketMid: 24.943254,
    bankMid: 24.795,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 739,
    foreignAtMarketMid: 746,
    foreignAtBankMid: 750,
    diffForeign: 7,
    diffTWD: 268,
    diffPct: 0.9,
    cashSell: 40.59,
    marketMid: 40.22688,
    bankMid: 39.99,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1586,
    foreignAtMarketMid: 1614,
    foreignAtBankMid: 1623,
    diffForeign: 28,
    diffTWD: 511,
    diffPct: 1.7,
    cashSell: 18.91,
    marketMid: 18.588052,
    bankMid: 18.485,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28582,
    foreignAtMarketMid: 30285,
    foreignAtBankMid: 31427,
    diffForeign: 1703,
    diffTWD: 1686,
    diffPct: 6,
    cashSell: 1.0496,
    marketMid: 0.990598,
    bankMid: 0.9546,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50310,
    foreignAtMarketMid: 56398,
    foreignAtBankMid: 56572,
    diffForeign: 6088,
    diffTWD: 3238,
    diffPct: 12.1,
    cashSell: 0.5963,
    marketMid: 0.531931,
    bankMid: 0.5303,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16125216,
    foreignAtBankMid: 16393443,
    diffForeign: 2363748,
    diffTWD: 4398,
    diffPct: 17.2,
    cashSell: 0.00218,
    marketMid: 0.00186,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3529,
    foreignAtMarketMid: 3762,
    foreignAtBankMid: 3876,
    diffForeign: 233,
    diffTWD: 1858,
    diffPct: 6.6,
    cashSell: 8.502,
    marketMid: 7.975308,
    bankMid: 7.7395,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21897810,
    foreignAtMarketMid: 24769710,
    foreignAtBankMid: 25751073,
    diffForeign: 2871900,
    diffTWD: 3478,
    diffPct: 13.1,
    cashSell: 0.00137,
    marketMid: 0.001211,
    bankMid: 0.001165,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/10 23:00:24';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-10';
