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
 * 匯率時間：2026/04/08 19:41:46
 * 生成日期：2026-04-08
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
    foreignAtCash: 936,
    foreignAtMarketMid: 939,
    foreignAtBankMid: 946,
    diffForeign: 3,
    diffTWD: 70,
    diffPct: 0.2,
    cashSell: 32.035,
    marketMid: 31.960114,
    bankMid: 31.7,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146915,
    foreignAtMarketMid: 150015,
    foreignAtBankMid: 151668,
    diffForeign: 3100,
    diffTWD: 620,
    diffPct: 2.1,
    cashSell: 0.2042,
    marketMid: 0.199979,
    bankMid: 0.1978,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 796,
    foreignAtMarketMid: 812,
    foreignAtBankMid: 810,
    diffForeign: 16,
    diffTWD: 601,
    diffPct: 2,
    cashSell: 37.7,
    marketMid: 36.945358,
    bankMid: 37.03,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 687,
    foreignAtMarketMid: 709,
    foreignAtBankMid: 704,
    diffForeign: 22,
    diffTWD: 921,
    diffPct: 3.2,
    cashSell: 43.67,
    marketMid: 42.329834,
    bankMid: 42.61,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6360,
    foreignAtMarketMid: 6462,
    foreignAtBankMid: 6471,
    diffForeign: 102,
    diffTWD: 474,
    diffPct: 1.6,
    cashSell: 4.717,
    marketMid: 4.642526,
    bankMid: 4.636,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1267963,
    foreignAtMarketMid: 1407066,
    foreignAtBankMid: 1381852,
    diffForeign: 139103,
    diffTWD: 2966,
    diffPct: 11,
    cashSell: 0.02366,
    marketMid: 0.021321,
    bankMid: 0.02171,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45,
        rateBuy: 46,
        rateInverse: 0.022222,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-08',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7310,
    foreignAtMarketMid: 7359,
    foreignAtBankMid: 7496,
    diffForeign: 49,
    diffTWD: 200,
    diffPct: 0.7,
    cashSell: 4.104,
    marketMid: 4.076641,
    bankMid: 4.002,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1318,
    foreignAtMarketMid: 1343,
    foreignAtBankMid: 1340,
    diffForeign: 25,
    diffTWD: 572,
    diffPct: 1.9,
    cashSell: 22.77,
    marketMid: 22.335887,
    bankMid: 22.38,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1286,
    foreignAtMarketMid: 1306,
    foreignAtBankMid: 1311,
    diffForeign: 20,
    diffTWD: 466,
    diffPct: 1.6,
    cashSell: 23.33,
    marketMid: 22.967914,
    bankMid: 22.875,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1188,
    foreignAtMarketMid: 1206,
    foreignAtBankMid: 1210,
    diffForeign: 18,
    diffTWD: 443,
    diffPct: 1.5,
    cashSell: 25.25,
    marketMid: 24.87686,
    bankMid: 24.795,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 737,
    foreignAtMarketMid: 751,
    foreignAtBankMid: 748,
    diffForeign: 14,
    diffTWD: 536,
    diffPct: 1.8,
    cashSell: 40.69,
    marketMid: 39.963234,
    bankMid: 40.09,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1589,
    foreignAtMarketMid: 1632,
    foreignAtBankMid: 1626,
    diffForeign: 43,
    diffTWD: 786,
    diffPct: 2.7,
    cashSell: 18.88,
    marketMid: 18.385395,
    bankMid: 18.455,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28412,
    foreignAtMarketMid: 30607,
    foreignAtBankMid: 31221,
    diffForeign: 2195,
    diffTWD: 2152,
    diffPct: 7.7,
    cashSell: 1.0559,
    marketMid: 0.980164,
    bankMid: 0.9609,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 49967,
    foreignAtMarketMid: 56552,
    foreignAtBankMid: 56138,
    diffForeign: 6585,
    diffTWD: 3494,
    diffPct: 13.2,
    cashSell: 0.6004,
    marketMid: 0.530481,
    bankMid: 0.5344,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16025625,
    foreignAtBankMid: 16393443,
    diffForeign: 2264157,
    diffTWD: 4239,
    diffPct: 16.5,
    cashSell: 0.00218,
    marketMid: 0.001872,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3534,
    foreignAtMarketMid: 3791,
    foreignAtBankMid: 3883,
    diffForeign: 257,
    diffTWD: 2034,
    diffPct: 7.3,
    cashSell: 8.489,
    marketMid: 7.913396,
    bankMid: 7.7265,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21897810,
    foreignAtMarketMid: 24647912,
    foreignAtBankMid: 25751073,
    diffForeign: 2750102,
    diffTWD: 3347,
    diffPct: 12.6,
    cashSell: 0.00137,
    marketMid: 0.001217,
    bankMid: 0.001165,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/08 19:41:46';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-08';
