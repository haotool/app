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
 * 匯率時間：2026/04/09 22:30:01
 * 生成日期：2026-04-09
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
    foreignAtCash: 937,
    foreignAtMarketMid: 945,
    foreignAtBankMid: 947,
    diffForeign: 8,
    diffTWD: 248,
    diffPct: 0.8,
    cashSell: 32.02,
    marketMid: 31.755105,
    bankMid: 31.685,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147638,
    foreignAtMarketMid: 149765,
    foreignAtBankMid: 152439,
    diffForeign: 2127,
    diffTWD: 426,
    diffPct: 1.4,
    cashSell: 0.2032,
    marketMid: 0.200314,
    bankMid: 0.1968,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 797,
    foreignAtMarketMid: 809,
    foreignAtBankMid: 812,
    diffForeign: 12,
    diffTWD: 446,
    diffPct: 1.5,
    cashSell: 37.62,
    marketMid: 37.060371,
    bankMid: 36.95,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 704,
    foreignAtBankMid: 706,
    diffForeign: 15,
    diffTWD: 662,
    diffPct: 2.3,
    cashSell: 43.56,
    marketMid: 42.598509,
    bankMid: 42.5,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6368,
    foreignAtMarketMid: 6459,
    foreignAtBankMid: 6479,
    diffForeign: 91,
    diffTWD: 422,
    diffPct: 1.4,
    cashSell: 4.711,
    marketMid: 4.644682,
    bankMid: 4.63,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1270110,
    foreignAtMarketMid: 1397156,
    foreignAtBankMid: 1384402,
    diffForeign: 127046,
    diffTWD: 2728,
    diffPct: 10,
    cashSell: 0.02362,
    marketMid: 0.021472,
    bankMid: 0.02167,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.7,
        rateBuy: 45.4,
        rateInverse: 0.022371,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-09',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7315,
    foreignAtMarketMid: 7403,
    foreignAtBankMid: 7502,
    diffForeign: 88,
    diffTWD: 356,
    diffPct: 1.2,
    cashSell: 4.101,
    marketMid: 4.052373,
    bankMid: 3.999,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1316,
    foreignAtMarketMid: 1341,
    foreignAtBankMid: 1339,
    diffForeign: 25,
    diffTWD: 549,
    diffPct: 1.9,
    cashSell: 22.79,
    marketMid: 22.372866,
    bankMid: 22.4,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1282,
    foreignAtMarketMid: 1309,
    foreignAtBankMid: 1307,
    diffForeign: 27,
    diffTWD: 627,
    diffPct: 2.1,
    cashSell: 23.4,
    marketMid: 22.910557,
    bankMid: 22.945,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1189,
    foreignAtMarketMid: 1204,
    foreignAtBankMid: 1210,
    diffForeign: 15,
    diffTWD: 390,
    diffPct: 1.3,
    cashSell: 25.24,
    marketMid: 24.912185,
    bankMid: 24.785,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 740,
    foreignAtMarketMid: 747,
    foreignAtBankMid: 751,
    diffForeign: 7,
    diffTWD: 277,
    diffPct: 0.9,
    cashSell: 40.54,
    marketMid: 40.165482,
    bankMid: 39.94,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1588,
    foreignAtMarketMid: 1622,
    foreignAtBankMid: 1625,
    diffForeign: 34,
    diffTWD: 618,
    diffPct: 2.1,
    cashSell: 18.89,
    marketMid: 18.500703,
    bankMid: 18.465,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28555,
    foreignAtMarketMid: 30323,
    foreignAtBankMid: 31394,
    diffForeign: 1768,
    diffTWD: 1749,
    diffPct: 6.2,
    cashSell: 1.0506,
    marketMid: 0.989351,
    bankMid: 0.9556,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50285,
    foreignAtMarketMid: 56300,
    foreignAtBankMid: 56540,
    diffForeign: 6015,
    diffTWD: 3205,
    diffPct: 12,
    cashSell: 0.5966,
    marketMid: 0.532856,
    bankMid: 0.5306,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16098877,
    foreignAtBankMid: 16393443,
    diffForeign: 2337409,
    diffTWD: 4356,
    diffPct: 17,
    cashSell: 0.00218,
    marketMid: 0.001863,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3543,
    foreignAtMarketMid: 3762,
    foreignAtBankMid: 3893,
    diffForeign: 219,
    diffTWD: 1745,
    diffPct: 6.2,
    cashSell: 8.468,
    marketMid: 7.975499,
    bankMid: 7.7055,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21897810,
    foreignAtMarketMid: 24806446,
    foreignAtBankMid: 25751073,
    diffForeign: 2908636,
    diffTWD: 3518,
    diffPct: 13.3,
    cashSell: 0.00137,
    marketMid: 0.001209,
    bankMid: 0.001165,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/09 22:30:01';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-09';
