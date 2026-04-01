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
 * 匯率時間：2026/04/01 12:22:20
 * 生成日期：2026-04-01
 */

/** 替代換匯管道資訊（如明洞換匯所） */
export interface AlternativeProvider {
  /** 換匯所名稱（繁體中文） */
  name: string;
  /** 換匯所英文名稱 */
  nameEn: string;
  /** 匯率：1 TWD 可換得多少外幣（以 KRW 為例：46.0 表示 1 TWD = 46 KRW） */
  rate: number;
  /** 反向匯率：1 單位外幣 = N TWD */
  rateInverse: number;
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
    foreignAtCash: 932,
    foreignAtMarketMid: 937,
    foreignAtBankMid: 941,
    diffForeign: 5,
    diffTWD: 164,
    diffPct: 0.6,
    cashSell: 32.2,
    marketMid: 32.023569,
    bankMid: 31.865,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146699,
    foreignAtMarketMid: 149076,
    foreignAtBankMid: 151439,
    diffForeign: 2377,
    diffTWD: 478,
    diffPct: 1.6,
    cashSell: 0.2045,
    marketMid: 0.20124,
    bankMid: 0.1981,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 801,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 816,
    diffForeign: 12,
    diffTWD: 429,
    diffPct: 1.5,
    cashSell: 37.44,
    marketMid: 36.904454,
    bankMid: 36.77,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 695,
    foreignAtMarketMid: 709,
    foreignAtBankMid: 712,
    diffForeign: 14,
    diffTWD: 589,
    diffPct: 2,
    cashSell: 43.18,
    marketMid: 42.331626,
    bankMid: 42.12,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6383,
    foreignAtMarketMid: 6471,
    foreignAtBankMid: 6495,
    diffForeign: 88,
    diffTWD: 408,
    diffPct: 1.4,
    cashSell: 4.7,
    marketMid: 4.636069,
    bankMid: 4.619,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1287001,
    foreignAtMarketMid: 1417474,
    foreignAtBankMid: 1404494,
    diffForeign: 130473,
    diffTWD: 2761,
    diffPct: 10.1,
    cashSell: 0.02331,
    marketMid: 0.021164,
    bankMid: 0.02136,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 46.5,
        rateInverse: 0.021505,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-01',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7280,
    foreignAtMarketMid: 7353,
    foreignAtBankMid: 7465,
    diffForeign: 73,
    diffTWD: 298,
    diffPct: 1,
    cashSell: 4.121,
    marketMid: 4.080034,
    bankMid: 4.019,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1337,
    foreignAtMarketMid: 1359,
    foreignAtBankMid: 1361,
    diffForeign: 22,
    diffTWD: 480,
    diffPct: 1.6,
    cashSell: 22.43,
    marketMid: 22.071157,
    bankMid: 22.04,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1284,
    foreignAtMarketMid: 1306,
    foreignAtBankMid: 1309,
    diffForeign: 22,
    diffTWD: 515,
    diffPct: 1.7,
    cashSell: 23.37,
    marketMid: 22.968969,
    bankMid: 22.915,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1192,
    foreignAtMarketMid: 1207,
    foreignAtBankMid: 1214,
    diffForeign: 15,
    diffTWD: 368,
    diffPct: 1.2,
    cashSell: 25.16,
    marketMid: 24.851512,
    bankMid: 24.705,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 743,
    foreignAtMarketMid: 750,
    foreignAtBankMid: 754,
    diffForeign: 7,
    diffTWD: 286,
    diffPct: 1,
    cashSell: 40.39,
    marketMid: 40.004801,
    bankMid: 39.79,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1606,
    foreignAtMarketMid: 1632,
    foreignAtBankMid: 1643,
    diffForeign: 26,
    diffTWD: 475,
    diffPct: 1.6,
    cashSell: 18.68,
    marketMid: 18.384381,
    bankMid: 18.255,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28921,
    foreignAtMarketMid: 30653,
    foreignAtBankMid: 31837,
    diffForeign: 1732,
    diffTWD: 1694,
    diffPct: 6,
    cashSell: 1.0373,
    marketMid: 0.978712,
    bankMid: 0.9423,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50463,
    foreignAtMarketMid: 56708,
    foreignAtBankMid: 56764,
    diffForeign: 6245,
    diffTWD: 3304,
    diffPct: 12.4,
    cashSell: 0.5945,
    marketMid: 0.529024,
    bankMid: 0.5285,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 15914752,
    foreignAtBankMid: 15957447,
    diffForeign: 2461837,
    diffTWD: 4641,
    diffPct: 18.3,
    cashSell: 0.00223,
    marketMid: 0.001885,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3566,
    foreignAtMarketMid: 3793,
    foreignAtBankMid: 3921,
    diffForeign: 227,
    diffTWD: 1792,
    diffPct: 6.4,
    cashSell: 8.413,
    marketMid: 7.910329,
    bankMid: 7.6505,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24645248,
    foreignAtBankMid: 25104603,
    diffForeign: 3216677,
    diffTWD: 3916,
    diffPct: 15,
    cashSell: 0.0014,
    marketMid: 0.001217,
    bankMid: 0.001195,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/01 12:22:20';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-01';
