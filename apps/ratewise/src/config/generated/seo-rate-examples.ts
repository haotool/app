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
 * 匯率時間：2026/05/09 06:14:04
 * 生成日期：2026-05-09
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
    foreignAtCash: 947,
    foreignAtMarketMid: 957,
    foreignAtBankMid: 957,
    diffForeign: 10,
    diffTWD: 333,
    diffPct: 1.1,
    cashSell: 31.695,
    marketMid: 31.34305,
    bankMid: 31.36,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146915,
    foreignAtMarketMid: 149800,
    foreignAtBankMid: 151668,
    diffForeign: 2885,
    diffTWD: 578,
    diffPct: 2,
    cashSell: 0.2042,
    marketMid: 0.200267,
    bankMid: 0.1978,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 799,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 813,
    diffForeign: 14,
    diffTWD: 530,
    diffPct: 1.8,
    cashSell: 37.57,
    marketMid: 36.905816,
    bankMid: 36.9,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 685,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 702,
    diffForeign: 18,
    diffTWD: 742,
    diffPct: 2.5,
    cashSell: 43.78,
    marketMid: 42.696725,
    bankMid: 42.72,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6395,
    foreignAtMarketMid: 6495,
    foreignAtBankMid: 6508,
    diffForeign: 100,
    diffTWD: 461,
    diffPct: 1.6,
    cashSell: 4.691,
    marketMid: 4.618938,
    bankMid: 4.61,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1267963,
    foreignAtMarketMid: 1398919,
    foreignAtBankMid: 1381852,
    diffForeign: 130956,
    diffTWD: 2808,
    diffPct: 10.3,
    cashSell: 0.02366,
    marketMid: 0.021445,
    bankMid: 0.02171,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45,
        rateBuy: 45.2,
        rateInverse: 0.022222,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-09',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7386,
    foreignAtMarketMid: 7496,
    foreignAtBankMid: 7576,
    diffForeign: 110,
    diffTWD: 443,
    diffPct: 1.5,
    cashSell: 4.062,
    marketMid: 4.002049,
    bankMid: 3.96,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1295,
    foreignAtMarketMid: 1321,
    foreignAtBankMid: 1317,
    diffForeign: 26,
    diffTWD: 595,
    diffPct: 2,
    cashSell: 23.17,
    marketMid: 22.710756,
    bankMid: 22.78,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1282,
    foreignAtMarketMid: 1309,
    foreignAtBankMid: 1307,
    diffForeign: 27,
    diffTWD: 620,
    diffPct: 2.1,
    cashSell: 23.4,
    marketMid: 22.916332,
    bankMid: 22.945,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1193,
    foreignAtMarketMid: 1213,
    foreignAtBankMid: 1215,
    diffForeign: 20,
    diffTWD: 485,
    diffPct: 1.6,
    cashSell: 25.14,
    marketMid: 24.733497,
    bankMid: 24.685,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 734,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 745,
    diffForeign: 10,
    diffTWD: 401,
    diffPct: 1.4,
    cashSell: 40.87,
    marketMid: 40.324207,
    bankMid: 40.27,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1568,
    foreignAtMarketMid: 1605,
    foreignAtBankMid: 1604,
    diffForeign: 37,
    diffTWD: 684,
    diffPct: 2.3,
    cashSell: 19.13,
    marketMid: 18.693685,
    bankMid: 18.705,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28921,
    foreignAtMarketMid: 30847,
    foreignAtBankMid: 31837,
    diffForeign: 1926,
    diffTWD: 1873,
    diffPct: 6.7,
    cashSell: 1.0373,
    marketMid: 0.972536,
    bankMid: 0.9423,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51238,
    foreignAtMarketMid: 57905,
    foreignAtBankMid: 57748,
    diffForeign: 6667,
    diffTWD: 3454,
    diffPct: 13,
    cashSell: 0.5855,
    marketMid: 0.518092,
    bankMid: 0.5195,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16584416,
    foreignAtBankMid: 16393443,
    diffForeign: 2822948,
    diffTWD: 5107,
    diffPct: 20.5,
    cashSell: 0.00218,
    marketMid: 0.001809,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3524,
    foreignAtMarketMid: 3752,
    foreignAtBankMid: 3870,
    diffForeign: 228,
    diffTWD: 1826,
    diffPct: 6.5,
    cashSell: 8.514,
    marketMid: 7.995906,
    bankMid: 7.7515,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 25009243,
    foreignAtBankMid: 25974026,
    diffForeign: 2950419,
    diffTWD: 3539,
    diffPct: 13.4,
    cashSell: 0.00136,
    marketMid: 0.0012,
    bankMid: 0.001155,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/09 06:14:04';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-09';
