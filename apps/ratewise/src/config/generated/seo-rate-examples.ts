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
 * 匯率時間：2026/04/09 12:14:51
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
    foreignAtCash: 935,
    foreignAtMarketMid: 945,
    foreignAtBankMid: 944,
    diffForeign: 10,
    diffTWD: 322,
    diffPct: 1.1,
    cashSell: 32.1,
    marketMid: 31.755105,
    bankMid: 31.765,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146987,
    foreignAtMarketMid: 149765,
    foreignAtBankMid: 151745,
    diffForeign: 2778,
    diffTWD: 556,
    diffPct: 1.9,
    cashSell: 0.2041,
    marketMid: 0.200314,
    bankMid: 0.1977,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 797,
    foreignAtMarketMid: 809,
    foreignAtBankMid: 811,
    diffForeign: 12,
    diffTWD: 478,
    diffPct: 1.6,
    cashSell: 37.66,
    marketMid: 37.060371,
    bankMid: 36.99,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 704,
    foreignAtBankMid: 706,
    diffForeign: 16,
    diffTWD: 676,
    diffPct: 2.3,
    cashSell: 43.58,
    marketMid: 42.598509,
    bankMid: 42.52,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6352,
    foreignAtMarketMid: 6459,
    foreignAtBankMid: 6463,
    diffForeign: 107,
    diffTWD: 497,
    diffPct: 1.7,
    cashSell: 4.723,
    marketMid: 4.644682,
    bankMid: 4.642,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1267427,
    foreignAtMarketMid: 1397156,
    foreignAtBankMid: 1381215,
    diffForeign: 129729,
    diffTWD: 2786,
    diffPct: 10.2,
    cashSell: 0.02367,
    marketMid: 0.021472,
    bankMid: 0.02172,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.7,
        rateBuy: 46,
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
    foreignAtCash: 7299,
    foreignAtMarketMid: 7403,
    foreignAtBankMid: 7485,
    diffForeign: 104,
    diffTWD: 421,
    diffPct: 1.4,
    cashSell: 4.11,
    marketMid: 4.052373,
    bankMid: 4.008,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1316,
    foreignAtMarketMid: 1341,
    foreignAtBankMid: 1339,
    diffForeign: 25,
    diffTWD: 562,
    diffPct: 1.9,
    cashSell: 22.8,
    marketMid: 22.372866,
    bankMid: 22.41,
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
    foreignAtCash: 1185,
    foreignAtMarketMid: 1204,
    foreignAtBankMid: 1207,
    diffForeign: 19,
    diffTWD: 472,
    diffPct: 1.6,
    cashSell: 25.31,
    marketMid: 24.912185,
    bankMid: 24.855,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 738,
    foreignAtMarketMid: 747,
    foreignAtBankMid: 749,
    diffForeign: 9,
    diffTWD: 343,
    diffPct: 1.2,
    cashSell: 40.63,
    marketMid: 40.165482,
    bankMid: 40.03,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1584,
    foreignAtMarketMid: 1622,
    foreignAtBankMid: 1620,
    diffForeign: 38,
    diffTWD: 696,
    diffPct: 2.4,
    cashSell: 18.94,
    marketMid: 18.500703,
    bankMid: 18.515,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28431,
    foreignAtMarketMid: 30323,
    foreignAtBankMid: 31243,
    diffForeign: 1892,
    diffTWD: 1872,
    diffPct: 6.7,
    cashSell: 1.0552,
    marketMid: 0.989351,
    bankMid: 0.9602,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50033,
    foreignAtMarketMid: 56300,
    foreignAtBankMid: 56222,
    diffForeign: 6267,
    diffTWD: 3339,
    diffPct: 12.5,
    cashSell: 0.5996,
    marketMid: 0.532856,
    bankMid: 0.5336,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 16098877,
    foreignAtBankMid: 15957447,
    diffForeign: 2645962,
    diffTWD: 4931,
    diffPct: 19.7,
    cashSell: 0.00223,
    marketMid: 0.001863,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3533,
    foreignAtMarketMid: 3762,
    foreignAtBankMid: 3882,
    diffForeign: 229,
    diffTWD: 1821,
    diffPct: 6.5,
    cashSell: 8.491,
    marketMid: 7.975499,
    bankMid: 7.7285,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24806446,
    foreignAtBankMid: 25104603,
    diffForeign: 3377875,
    diffTWD: 4085,
    diffPct: 15.8,
    cashSell: 0.0014,
    marketMid: 0.001209,
    bankMid: 0.001195,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/09 12:14:51';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-09';
