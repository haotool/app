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
 * 匯率時間：2026/07/15 11:55:51
 * 生成日期：2026-07-15
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
    foreignAtMarketMid: 933,
    foreignAtBankMid: 934,
    diffForeign: 9,
    diffTWD: 293,
    diffPct: 1,
    cashSell: 32.465,
    marketMid: 32.148139,
    bankMid: 32.13,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148441,
    foreignAtMarketMid: 151294,
    foreignAtBankMid: 153296,
    diffForeign: 2853,
    diffTWD: 566,
    diffPct: 1.9,
    cashSell: 0.2021,
    marketMid: 0.19829,
    bankMid: 0.1957,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 803,
    foreignAtMarketMid: 817,
    foreignAtBankMid: 818,
    diffForeign: 14,
    diffTWD: 486,
    diffPct: 1.6,
    cashSell: 37.34,
    marketMid: 36.734994,
    bankMid: 36.67,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 681,
    foreignAtMarketMid: 697,
    foreignAtBankMid: 698,
    diffForeign: 16,
    diffTWD: 686,
    diffPct: 2.3,
    cashSell: 44.07,
    marketMid: 43.062613,
    bankMid: 43.01,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6224,
    foreignAtMarketMid: 6324,
    foreignAtBankMid: 6330,
    diffForeign: 100,
    diffTWD: 474,
    diffPct: 1.6,
    cashSell: 4.82,
    marketMid: 4.743833,
    bankMid: 4.739,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1263690,
    foreignAtMarketMid: 1388857,
    foreignAtBankMid: 1376778,
    diffForeign: 125167,
    diffTWD: 2704,
    diffPct: 9.9,
    cashSell: 0.02374,
    marketMid: 0.0216,
    bankMid: 0.02179,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.85,
        rateBuy: 45.1,
        rateInverse: 0.022297,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-07-15',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7220,
    foreignAtMarketMid: 7313,
    foreignAtBankMid: 7402,
    diffForeign: 93,
    diffTWD: 380,
    diffPct: 1.3,
    cashSell: 4.155,
    marketMid: 4.102429,
    bankMid: 4.053,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1312,
    foreignAtMarketMid: 1339,
    foreignAtBankMid: 1335,
    diffForeign: 27,
    diffTWD: 615,
    diffPct: 2.1,
    cashSell: 22.87,
    marketMid: 22.401434,
    bankMid: 22.48,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1286,
    foreignAtMarketMid: 1313,
    foreignAtBankMid: 1311,
    diffForeign: 27,
    diffTWD: 623,
    diffPct: 2.1,
    cashSell: 23.33,
    marketMid: 22.845655,
    bankMid: 22.875,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1186,
    foreignAtMarketMid: 1205,
    foreignAtBankMid: 1208,
    diffForeign: 19,
    diffTWD: 459,
    diffPct: 1.6,
    cashSell: 25.29,
    marketMid: 24.902879,
    bankMid: 24.835,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 747,
    foreignAtMarketMid: 755,
    foreignAtBankMid: 758,
    diffForeign: 8,
    diffTWD: 326,
    diffPct: 1.1,
    cashSell: 40.16,
    marketMid: 39.723524,
    bankMid: 39.56,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1572,
    foreignAtMarketMid: 1606,
    foreignAtBankMid: 1607,
    diffForeign: 34,
    diffTWD: 647,
    diffPct: 2.2,
    cashSell: 19.09,
    marketMid: 18.678322,
    bankMid: 18.665,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29346,
    foreignAtMarketMid: 31233,
    foreignAtBankMid: 32352,
    diffForeign: 1887,
    diffTWD: 1813,
    diffPct: 6.4,
    cashSell: 1.0223,
    marketMid: 0.960535,
    bankMid: 0.9273,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50994,
    foreignAtMarketMid: 57568,
    foreignAtBankMid: 57438,
    diffForeign: 6574,
    diffTWD: 3426,
    diffPct: 12.9,
    cashSell: 0.5883,
    marketMid: 0.521121,
    bankMid: 0.5223,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16863455,
    foreignAtBankMid: 16853933,
    diffForeign: 2778948,
    diffTWD: 4944,
    diffPct: 19.7,
    cashSell: 0.00213,
    marketMid: 0.001779,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3568,
    foreignAtMarketMid: 3806,
    foreignAtBankMid: 3923,
    diffForeign: 238,
    diffTWD: 1879,
    diffPct: 6.7,
    cashSell: 8.409,
    marketMid: 7.882333,
    bankMid: 7.6465,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24349569,
    foreignAtBankMid: 24896266,
    diffForeign: 3072973,
    diffTWD: 3786,
    diffPct: 14.4,
    cashSell: 0.00141,
    marketMid: 0.001232,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/07/15 11:55:51';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-07-15';
