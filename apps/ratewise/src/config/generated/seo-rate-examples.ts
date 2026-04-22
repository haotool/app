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
 * 匯率時間：2026/04/22 07:52:21
 * 生成日期：2026-04-22
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
    foreignAtCash: 945,
    foreignAtMarketMid: 953,
    foreignAtBankMid: 955,
    diffForeign: 8,
    diffTWD: 245,
    diffPct: 0.8,
    cashSell: 31.755,
    marketMid: 31.496063,
    bankMid: 31.42,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149105,
    foreignAtMarketMid: 151830,
    foreignAtBankMid: 154004,
    diffForeign: 2725,
    diffTWD: 538,
    diffPct: 1.8,
    cashSell: 0.2012,
    marketMid: 0.197589,
    bankMid: 0.1948,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 800,
    foreignAtMarketMid: 811,
    foreignAtBankMid: 814,
    diffForeign: 11,
    diffTWD: 418,
    diffPct: 1.4,
    cashSell: 37.51,
    marketMid: 36.98772,
    bankMid: 36.84,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 690,
    foreignAtMarketMid: 705,
    foreignAtBankMid: 707,
    diffForeign: 15,
    diffTWD: 649,
    diffPct: 2.2,
    cashSell: 43.47,
    marketMid: 42.529664,
    bankMid: 42.41,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6413,
    foreignAtMarketMid: 6504,
    foreignAtBankMid: 6526,
    diffForeign: 91,
    diffTWD: 420,
    diffPct: 1.4,
    cashSell: 4.678,
    marketMid: 4.612546,
    bankMid: 4.597,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1285347,
    foreignAtMarketMid: 1408274,
    foreignAtBankMid: 1402525,
    diffForeign: 122927,
    diffTWD: 2619,
    diffPct: 9.6,
    cashSell: 0.02334,
    marketMid: 0.021303,
    bankMid: 0.02139,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.1,
        rateBuy: 45.2,
        rateInverse: 0.022173,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-22',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7373,
    foreignAtMarketMid: 7468,
    foreignAtBankMid: 7562,
    diffForeign: 95,
    diffTWD: 381,
    diffPct: 1.3,
    cashSell: 4.069,
    marketMid: 4.017307,
    bankMid: 3.967,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1309,
    foreignAtMarketMid: 1330,
    foreignAtBankMid: 1332,
    diffForeign: 21,
    diffTWD: 484,
    diffPct: 1.6,
    cashSell: 22.92,
    marketMid: 22.549948,
    bankMid: 22.53,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1278,
    foreignAtMarketMid: 1301,
    foreignAtBankMid: 1303,
    diffForeign: 23,
    diffTWD: 534,
    diffPct: 1.8,
    cashSell: 23.47,
    marketMid: 23.052098,
    bankMid: 23.015,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1198,
    foreignAtMarketMid: 1213,
    foreignAtBankMid: 1220,
    diffForeign: 15,
    diffTWD: 382,
    diffPct: 1.3,
    cashSell: 25.05,
    marketMid: 24.73105,
    bankMid: 24.595,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 737,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 748,
    diffForeign: 7,
    diffTWD: 292,
    diffPct: 1,
    cashSell: 40.73,
    marketMid: 40.333965,
    bankMid: 40.13,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1584,
    foreignAtMarketMid: 1615,
    foreignAtBankMid: 1620,
    diffForeign: 31,
    diffTWD: 570,
    diffPct: 1.9,
    cashSell: 18.94,
    marketMid: 18.580453,
    bankMid: 18.515,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28866,
    foreignAtMarketMid: 30634,
    foreignAtBankMid: 31770,
    diffForeign: 1768,
    diffTWD: 1732,
    diffPct: 6.1,
    cashSell: 1.0393,
    marketMid: 0.979299,
    bankMid: 0.9443,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50744,
    foreignAtMarketMid: 57223,
    foreignAtBankMid: 57121,
    diffForeign: 6479,
    diffTWD: 3397,
    diffPct: 12.8,
    cashSell: 0.5912,
    marketMid: 0.524265,
    bankMid: 0.5252,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16304071,
    foreignAtBankMid: 16393443,
    diffForeign: 2542603,
    diffTWD: 4678,
    diffPct: 18.5,
    cashSell: 0.00218,
    marketMid: 0.00184,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3543,
    foreignAtMarketMid: 3775,
    foreignAtBankMid: 3893,
    diffForeign: 232,
    diffTWD: 1845,
    diffPct: 6.6,
    cashSell: 8.468,
    marketMid: 7.94723,
    bankMid: 7.7055,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 22058824,
    foreignAtMarketMid: 25007788,
    foreignAtBankMid: 25974026,
    diffForeign: 2948964,
    diffTWD: 3538,
    diffPct: 13.4,
    cashSell: 0.00136,
    marketMid: 0.0012,
    bankMid: 0.001155,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/22 07:52:21';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-22';
