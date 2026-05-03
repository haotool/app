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
 * 匯率時間：2026/05/02 06:01:18
 * 生成日期：2026-05-03
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
    diffTWD: 273,
    diffPct: 0.9,
    cashSell: 31.92,
    marketMid: 31.629555,
    bankMid: 31.585,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146199,
    foreignAtMarketMid: 148800,
    foreignAtBankMid: 150905,
    diffForeign: 2601,
    diffTWD: 524,
    diffPct: 1.8,
    cashSell: 0.2052,
    marketMid: 0.201613,
    bankMid: 0.1988,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 797,
    foreignAtMarketMid: 809,
    foreignAtBankMid: 812,
    diffForeign: 12,
    diffTWD: 443,
    diffPct: 1.5,
    cashSell: 37.63,
    marketMid: 37.074111,
    bankMid: 36.96,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 683,
    foreignAtMarketMid: 698,
    foreignAtBankMid: 700,
    diffForeign: 15,
    diffTWD: 639,
    diffPct: 2.2,
    cashSell: 43.9,
    marketMid: 42.964554,
    bankMid: 42.84,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6382,
    foreignAtMarketMid: 6495,
    foreignAtBankMid: 6494,
    diffForeign: 113,
    diffTWD: 524,
    diffPct: 1.8,
    cashSell: 4.701,
    marketMid: 4.618938,
    bankMid: 4.62,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1266892,
    foreignAtMarketMid: 1396809,
    foreignAtBankMid: 1380580,
    diffForeign: 129917,
    diffTWD: 2790,
    diffPct: 10.3,
    cashSell: 0.02368,
    marketMid: 0.021478,
    bankMid: 0.02173,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.7,
        rateBuy: 45.2,
        rateInverse: 0.022371,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-03',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7339,
    foreignAtMarketMid: 7435,
    foreignAtBankMid: 7526,
    diffForeign: 96,
    diffTWD: 391,
    diffPct: 1.3,
    cashSell: 4.088,
    marketMid: 4.034747,
    bankMid: 3.986,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1293,
    foreignAtMarketMid: 1317,
    foreignAtBankMid: 1315,
    diffForeign: 24,
    diffTWD: 544,
    diffPct: 1.8,
    cashSell: 23.2,
    marketMid: 22.779562,
    bankMid: 22.81,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1265,
    foreignAtMarketMid: 1290,
    foreignAtBankMid: 1289,
    diffForeign: 25,
    diffTWD: 584,
    diffPct: 2,
    cashSell: 23.72,
    marketMid: 23.258518,
    bankMid: 23.265,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1191,
    foreignAtMarketMid: 1209,
    foreignAtBankMid: 1213,
    diffForeign: 18,
    diffTWD: 436,
    diffPct: 1.5,
    cashSell: 25.19,
    marketMid: 24.823751,
    bankMid: 24.735,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 734,
    foreignAtMarketMid: 742,
    foreignAtBankMid: 745,
    diffForeign: 8,
    diffTWD: 311,
    diffPct: 1,
    cashSell: 40.88,
    marketMid: 40.456348,
    bankMid: 40.28,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1576,
    foreignAtMarketMid: 1608,
    foreignAtBankMid: 1612,
    diffForeign: 32,
    diffTWD: 597,
    diffPct: 2,
    cashSell: 19.04,
    marketMid: 18.661242,
    bankMid: 18.615,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28930,
    foreignAtMarketMid: 30858,
    foreignAtBankMid: 31847,
    diffForeign: 1928,
    diffTWD: 1875,
    diffPct: 6.7,
    cashSell: 1.037,
    marketMid: 0.972195,
    bankMid: 0.942,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51546,
    foreignAtMarketMid: 58128,
    foreignAtBankMid: 58140,
    diffForeign: 6582,
    diffTWD: 3397,
    diffPct: 12.8,
    cashSell: 0.582,
    marketMid: 0.516106,
    bankMid: 0.516,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16436101,
    foreignAtBankMid: 16393443,
    diffForeign: 2674633,
    diffTWD: 4882,
    diffPct: 19.4,
    cashSell: 0.00218,
    marketMid: 0.001825,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3541,
    foreignAtMarketMid: 3768,
    foreignAtBankMid: 3891,
    diffForeign: 227,
    diffTWD: 1806,
    diffPct: 6.4,
    cashSell: 8.472,
    marketMid: 7.96191,
    bankMid: 7.7095,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21897810,
    foreignAtMarketMid: 24911743,
    foreignAtBankMid: 25751073,
    diffForeign: 3013933,
    diffTWD: 3630,
    diffPct: 13.8,
    cashSell: 0.00137,
    marketMid: 0.001204,
    bankMid: 0.001165,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/02 06:01:18';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-03';
