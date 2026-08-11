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
 * 匯率時間：2026/08/11 10:20:19
 * 生成日期：2026-08-11
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
    foreignAtCash: 924,
    foreignAtMarketMid: 931,
    foreignAtBankMid: 933,
    diffForeign: 7,
    diffTWD: 234,
    diffPct: 0.8,
    cashSell: 32.485,
    marketMid: 32.232071,
    bankMid: 32.15,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145773,
    foreignAtMarketMid: 147515,
    foreignAtBankMid: 150451,
    diffForeign: 1742,
    diffTWD: 354,
    diffPct: 1.2,
    cashSell: 0.2058,
    marketMid: 0.203369,
    bankMid: 0.1994,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 796,
    foreignAtMarketMid: 805,
    foreignAtBankMid: 810,
    diffForeign: 9,
    diffTWD: 370,
    diffPct: 1.2,
    cashSell: 37.71,
    marketMid: 37.245335,
    bankMid: 37.04,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 675,
    foreignAtMarketMid: 689,
    foreignAtBankMid: 691,
    diffForeign: 14,
    diffTWD: 602,
    diffPct: 2,
    cashSell: 44.45,
    marketMid: 43.557801,
    bankMid: 43.39,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6197,
    foreignAtMarketMid: 6276,
    foreignAtBankMid: 6303,
    diffForeign: 79,
    diffTWD: 377,
    diffPct: 1.3,
    cashSell: 4.841,
    marketMid: 4.780115,
    bankMid: 4.76,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1203369,
    foreignAtMarketMid: 1319841,
    foreignAtBankMid: 1305483,
    diffForeign: 116472,
    diffTWD: 2647,
    diffPct: 9.7,
    cashSell: 0.02493,
    marketMid: 0.02273,
    bankMid: 0.02298,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.65,
        rateBuy: 42.8,
        rateInverse: 0.023447,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-11',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7222,
    foreignAtMarketMid: 7298,
    foreignAtBankMid: 7404,
    diffForeign: 76,
    diffTWD: 311,
    diffPct: 1,
    cashSell: 4.154,
    marketMid: 4.110929,
    bankMid: 4.052,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1298,
    foreignAtMarketMid: 1319,
    foreignAtBankMid: 1320,
    diffForeign: 21,
    diffTWD: 487,
    diffPct: 1.7,
    cashSell: 23.12,
    marketMid: 22.744331,
    bankMid: 22.73,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1274,
    foreignAtMarketMid: 1297,
    foreignAtBankMid: 1300,
    diffForeign: 23,
    diffTWD: 514,
    diffPct: 1.7,
    cashSell: 23.54,
    marketMid: 23.136366,
    bankMid: 23.085,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1176,
    foreignAtMarketMid: 1191,
    foreignAtBankMid: 1198,
    diffForeign: 15,
    diffTWD: 362,
    diffPct: 1.2,
    cashSell: 25.5,
    marketMid: 25.192724,
    bankMid: 25.045,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 747,
    foreignAtMarketMid: 752,
    foreignAtBankMid: 759,
    diffForeign: 5,
    diffTWD: 210,
    diffPct: 0.7,
    cashSell: 40.15,
    marketMid: 39.869229,
    bankMid: 39.55,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1551,
    foreignAtMarketMid: 1582,
    foreignAtBankMid: 1586,
    diffForeign: 31,
    diffTWD: 582,
    diffPct: 2,
    cashSell: 19.34,
    marketMid: 18.964536,
    bankMid: 18.915,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28905,
    foreignAtMarketMid: 30709,
    foreignAtBankMid: 31817,
    diffForeign: 1804,
    diffTWD: 1763,
    diffPct: 6.2,
    cashSell: 1.0379,
    marketMid: 0.976901,
    bankMid: 0.9429,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50480,
    foreignAtMarketMid: 56655,
    foreignAtBankMid: 56786,
    diffForeign: 6175,
    diffTWD: 3270,
    diffPct: 12.2,
    cashSell: 0.5943,
    marketMid: 0.529524,
    bankMid: 0.5283,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16513231,
    foreignAtBankMid: 16853933,
    diffForeign: 2428724,
    diffTWD: 4412,
    diffPct: 17.2,
    cashSell: 0.00213,
    marketMid: 0.001817,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3585,
    foreignAtMarketMid: 3806,
    foreignAtBankMid: 3945,
    diffForeign: 221,
    diffTWD: 1738,
    diffPct: 6.2,
    cashSell: 8.368,
    marketMid: 7.883078,
    bankMid: 7.6055,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 24318251,
    foreignAtBankMid: 24691358,
    diffForeign: 3191490,
    diffTWD: 3937,
    diffPct: 15.1,
    cashSell: 0.00142,
    marketMid: 0.001234,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/11 10:20:19';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-11';
