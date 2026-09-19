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
 * 匯率時間：2026/09/19 07:13:47
 * 生成日期：2026-09-19
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
    foreignAtCash: 935,
    foreignAtMarketMid: 942,
    foreignAtBankMid: 945,
    diffForeign: 7,
    diffTWD: 220,
    diffPct: 0.7,
    cashSell: 32.07,
    marketMid: 31.834968,
    bankMid: 31.735,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145419,
    foreignAtMarketMid: 147859,
    foreignAtBankMid: 150075,
    diffForeign: 2440,
    diffTWD: 495,
    diffPct: 1.7,
    cashSell: 0.2063,
    marketMid: 0.202896,
    bankMid: 0.1999,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 810,
    foreignAtMarketMid: 822,
    foreignAtBankMid: 825,
    diffForeign: 12,
    diffTWD: 434,
    diffPct: 1.5,
    cashSell: 37.05,
    marketMid: 36.513674,
    bankMid: 36.38,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 705,
    foreignAtBankMid: 706,
    diffForeign: 16,
    diffTWD: 663,
    diffPct: 2.3,
    cashSell: 43.53,
    marketMid: 42.567683,
    bankMid: 42.47,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6229,
    foreignAtMarketMid: 6315,
    foreignAtBankMid: 6336,
    diffForeign: 86,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 4.816,
    marketMid: 4.750594,
    bankMid: 4.735,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1194743,
    foreignAtMarketMid: 1307288,
    foreignAtBankMid: 1295337,
    diffForeign: 112545,
    diffTWD: 2583,
    diffPct: 9.4,
    cashSell: 0.02511,
    marketMid: 0.022948,
    bankMid: 0.02316,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.4,
        rateBuy: 42.7,
        rateInverse: 0.023585,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-19',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7314,
    foreignAtMarketMid: 7397,
    foreignAtBankMid: 7500,
    diffForeign: 83,
    diffTWD: 339,
    diffPct: 1.1,
    cashSell: 4.102,
    marketMid: 4.055693,
    bankMid: 4,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1303,
    foreignAtMarketMid: 1323,
    foreignAtBankMid: 1325,
    diffForeign: 20,
    diffTWD: 467,
    diffPct: 1.6,
    cashSell: 23.03,
    marketMid: 22.671624,
    bankMid: 22.64,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1295,
    foreignAtMarketMid: 1319,
    foreignAtBankMid: 1321,
    diffForeign: 24,
    diffTWD: 532,
    diffPct: 1.8,
    cashSell: 23.16,
    marketMid: 22.748988,
    bankMid: 22.705,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1188,
    foreignAtMarketMid: 1204,
    foreignAtBankMid: 1210,
    diffForeign: 16,
    diffTWD: 393,
    diffPct: 1.3,
    cashSell: 25.25,
    marketMid: 24.919013,
    bankMid: 24.795,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 768,
    foreignAtMarketMid: 776,
    foreignAtBankMid: 780,
    diffForeign: 8,
    diffTWD: 315,
    diffPct: 1.1,
    cashSell: 39.07,
    marketMid: 38.659296,
    bankMid: 38.47,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1616,
    foreignAtMarketMid: 1648,
    foreignAtBankMid: 1653,
    diffForeign: 32,
    diffTWD: 584,
    diffPct: 2,
    cashSell: 18.57,
    marketMid: 18.208303,
    bankMid: 18.145,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29533,
    foreignAtMarketMid: 31459,
    foreignAtBankMid: 32580,
    diffForeign: 1926,
    diffTWD: 1836,
    diffPct: 6.5,
    cashSell: 1.0158,
    marketMid: 0.953626,
    bankMid: 0.9208,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52448,
    foreignAtMarketMid: 59209,
    foreignAtBankMid: 59289,
    diffForeign: 6761,
    diffTWD: 3426,
    diffPct: 12.9,
    cashSell: 0.572,
    marketMid: 0.506676,
    bankMid: 0.506,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16748400,
    foreignAtBankMid: 17341040,
    diffForeign: 2325323,
    diffTWD: 4165,
    diffPct: 16.1,
    cashSell: 0.00208,
    marketMid: 0.001791,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3618,
    foreignAtMarketMid: 3852,
    foreignAtBankMid: 3984,
    diffForeign: 234,
    diffTWD: 1828,
    diffPct: 6.5,
    cashSell: 8.293,
    marketMid: 7.787737,
    bankMid: 7.5305,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24515879,
    foreignAtBankMid: 25316456,
    diffForeign: 2933145,
    diffTWD: 3589,
    diffPct: 13.6,
    cashSell: 0.00139,
    marketMid: 0.001224,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/19 07:13:47';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-19';
