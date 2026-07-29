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
 * 匯率時間：2026/07/29 12:31:31
 * 生成日期：2026-07-29
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
    foreignAtCash: 916,
    foreignAtMarketMid: 926,
    foreignAtBankMid: 925,
    diffForeign: 10,
    diffTWD: 338,
    diffPct: 1.1,
    cashSell: 32.755,
    marketMid: 32.385517,
    bankMid: 32.42,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148368,
    foreignAtMarketMid: 151792,
    foreignAtBankMid: 153218,
    diffForeign: 3424,
    diffTWD: 677,
    diffPct: 2.3,
    cashSell: 0.2022,
    marketMid: 0.197638,
    bankMid: 0.1958,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 799,
    foreignAtMarketMid: 814,
    foreignAtBankMid: 813,
    diffForeign: 15,
    diffTWD: 551,
    diffPct: 1.9,
    cashSell: 37.55,
    marketMid: 36.860924,
    bankMid: 36.88,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 680,
    foreignAtMarketMid: 697,
    foreignAtBankMid: 697,
    diffForeign: 17,
    diffTWD: 735,
    diffPct: 2.5,
    cashSell: 44.12,
    marketMid: 43.038519,
    bankMid: 43.06,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6172,
    foreignAtMarketMid: 6279,
    foreignAtBankMid: 6276,
    diffForeign: 107,
    diffTWD: 513,
    diffPct: 1.7,
    cashSell: 4.861,
    marketMid: 4.777831,
    bankMid: 4.78,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1217532,
    foreignAtMarketMid: 1348718,
    foreignAtBankMid: 1322168,
    diffForeign: 131186,
    diffTWD: 2918,
    diffPct: 10.8,
    cashSell: 0.02464,
    marketMid: 0.022243,
    bankMid: 0.02269,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43.7,
        rateBuy: 44,
        rateInverse: 0.022883,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-07-29',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7162,
    foreignAtMarketMid: 7264,
    foreignAtBankMid: 7340,
    diffForeign: 102,
    diffTWD: 424,
    diffPct: 1.4,
    cashSell: 4.189,
    marketMid: 4.129774,
    bankMid: 4.087,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1308,
    foreignAtMarketMid: 1328,
    foreignAtBankMid: 1330,
    diffForeign: 20,
    diffTWD: 466,
    diffPct: 1.6,
    cashSell: 22.94,
    marketMid: 22.583559,
    bankMid: 22.55,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1279,
    foreignAtMarketMid: 1307,
    foreignAtBankMid: 1304,
    diffForeign: 28,
    diffTWD: 637,
    diffPct: 2.2,
    cashSell: 23.46,
    marketMid: 22.961585,
    bankMid: 23.005,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1177,
    foreignAtMarketMid: 1198,
    foreignAtBankMid: 1199,
    diffForeign: 21,
    diffTWD: 504,
    diffPct: 1.7,
    cashSell: 25.48,
    marketMid: 25.051983,
    bankMid: 25.025,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 748,
    foreignAtMarketMid: 759,
    foreignAtBankMid: 759,
    diffForeign: 11,
    diffTWD: 441,
    diffPct: 1.5,
    cashSell: 40.12,
    marketMid: 39.530379,
    bankMid: 39.52,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1566,
    foreignAtMarketMid: 1603,
    foreignAtBankMid: 1601,
    diffForeign: 37,
    diffTWD: 692,
    diffPct: 2.4,
    cashSell: 19.16,
    marketMid: 18.717829,
    bankMid: 18.735,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29067,
    foreignAtMarketMid: 31091,
    foreignAtBankMid: 32014,
    diffForeign: 2024,
    diffTWD: 1953,
    diffPct: 7,
    cashSell: 1.0321,
    marketMid: 0.964912,
    bankMid: 0.9371,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50429,
    foreignAtMarketMid: 57050,
    foreignAtBankMid: 56721,
    diffForeign: 6621,
    diffTWD: 3482,
    diffPct: 13.1,
    cashSell: 0.5949,
    marketMid: 0.525853,
    bankMid: 0.5289,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16774052,
    foreignAtBankMid: 16853933,
    diffForeign: 2689545,
    diffTWD: 4810,
    diffPct: 19.1,
    cashSell: 0.00213,
    marketMid: 0.001788,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3553,
    foreignAtMarketMid: 3792,
    foreignAtBankMid: 3906,
    diffForeign: 239,
    diffTWD: 1886,
    diffPct: 6.7,
    cashSell: 8.443,
    marketMid: 7.912331,
    bankMid: 7.6805,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 24269055,
    foreignAtBankMid: 24691358,
    diffForeign: 3142294,
    diffTWD: 3884,
    diffPct: 14.9,
    cashSell: 0.00142,
    marketMid: 0.001236,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/07/29 12:31:31';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-07-29';
