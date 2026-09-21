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
 * 匯率時間：2026/09/21 14:26:43
 * 生成日期：2026-09-21
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
    foreignAtCash: 937,
    foreignAtMarketMid: 942,
    foreignAtBankMid: 947,
    diffForeign: 5,
    diffTWD: 156,
    diffPct: 0.5,
    cashSell: 32.025,
    marketMid: 31.858294,
    bankMid: 31.69,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145773,
    foreignAtMarketMid: 147878,
    foreignAtBankMid: 150451,
    diffForeign: 2105,
    diffTWD: 427,
    diffPct: 1.4,
    cashSell: 0.2058,
    marketMid: 0.20287,
    bankMid: 0.1994,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 812,
    foreignAtMarketMid: 821,
    foreignAtBankMid: 827,
    diffForeign: 9,
    diffTWD: 350,
    diffPct: 1.2,
    cashSell: 36.96,
    marketMid: 36.528346,
    bankMid: 36.29,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 691,
    foreignAtMarketMid: 704,
    foreignAtBankMid: 709,
    diffForeign: 13,
    diffTWD: 563,
    diffPct: 1.9,
    cashSell: 43.4,
    marketMid: 42.58581,
    bankMid: 42.34,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6240,
    foreignAtMarketMid: 6315,
    foreignAtBankMid: 6347,
    diffForeign: 75,
    diffTWD: 358,
    diffPct: 1.2,
    cashSell: 4.808,
    marketMid: 4.750594,
    bankMid: 4.727,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1192369,
    foreignAtMarketMid: 1305876,
    foreignAtBankMid: 1292546,
    diffForeign: 113507,
    diffTWD: 2608,
    diffPct: 9.5,
    cashSell: 0.02516,
    marketMid: 0.022973,
    bankMid: 0.02321,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.6,
        rateBuy: 42.8,
        rateInverse: 0.023474,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-21',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7326,
    foreignAtMarketMid: 7393,
    foreignAtBankMid: 7513,
    diffForeign: 67,
    diffTWD: 273,
    diffPct: 0.9,
    cashSell: 4.095,
    marketMid: 4.057701,
    bankMid: 3.993,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1304,
    foreignAtMarketMid: 1323,
    foreignAtBankMid: 1326,
    diffForeign: 19,
    diffTWD: 430,
    diffPct: 1.5,
    cashSell: 23.01,
    marketMid: 22.680366,
    bankMid: 22.62,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1300,
    foreignAtMarketMid: 1319,
    foreignAtBankMid: 1327,
    diffForeign: 19,
    diffTWD: 425,
    diffPct: 1.4,
    cashSell: 23.07,
    marketMid: 22.743296,
    bankMid: 22.615,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1189,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1211,
    diffForeign: 14,
    diffTWD: 359,
    diffPct: 1.2,
    cashSell: 25.23,
    marketMid: 24.92771,
    bankMid: 24.775,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 770,
    foreignAtMarketMid: 776,
    foreignAtBankMid: 782,
    diffForeign: 6,
    diffTWD: 226,
    diffPct: 0.8,
    cashSell: 38.96,
    marketMid: 38.66677,
    bankMid: 38.36,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1619,
    foreignAtMarketMid: 1647,
    foreignAtBankMid: 1657,
    diffForeign: 28,
    diffTWD: 508,
    diffPct: 1.7,
    cashSell: 18.53,
    marketMid: 18.215932,
    bankMid: 18.105,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29557,
    foreignAtMarketMid: 31422,
    foreignAtBankMid: 32609,
    diffForeign: 1865,
    diffTWD: 1781,
    diffPct: 6.3,
    cashSell: 1.015,
    marketMid: 0.954742,
    bankMid: 0.92,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52493,
    foreignAtMarketMid: 59253,
    foreignAtBankMid: 59347,
    diffForeign: 6760,
    diffTWD: 3422,
    diffPct: 12.9,
    cashSell: 0.5715,
    marketMid: 0.506307,
    bankMid: 0.5055,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16753795,
    foreignAtBankMid: 16853933,
    diffForeign: 2669288,
    diffTWD: 4780,
    diffPct: 19,
    cashSell: 0.00213,
    marketMid: 0.001791,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3621,
    foreignAtMarketMid: 3850,
    foreignAtBankMid: 3988,
    diffForeign: 229,
    diffTWD: 1785,
    diffPct: 6.3,
    cashSell: 8.286,
    marketMid: 7.792896,
    bankMid: 7.5235,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24482041,
    foreignAtBankMid: 24896266,
    diffForeign: 3205445,
    diffTWD: 3928,
    diffPct: 15.1,
    cashSell: 0.00141,
    marketMid: 0.001225,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/21 14:26:43';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-21';
