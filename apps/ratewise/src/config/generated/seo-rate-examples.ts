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
 * 匯率時間：2026/05/05 12:29:44
 * 生成日期：2026-05-05
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
    foreignAtCash: 942,
    foreignAtMarketMid: 947,
    foreignAtBankMid: 952,
    diffForeign: 5,
    diffTWD: 157,
    diffPct: 0.5,
    cashSell: 31.845,
    marketMid: 31.678652,
    bankMid: 31.51,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146843,
    foreignAtMarketMid: 148958,
    foreignAtBankMid: 151592,
    diffForeign: 2115,
    diffTWD: 426,
    diffPct: 1.4,
    cashSell: 0.2043,
    marketMid: 0.201399,
    bankMid: 0.1979,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 802,
    foreignAtMarketMid: 810,
    foreignAtBankMid: 816,
    diffForeign: 8,
    diffTWD: 300,
    diffPct: 1,
    cashSell: 37.42,
    marketMid: 37.045269,
    bankMid: 36.75,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 700,
    foreignAtBankMid: 705,
    diffForeign: 12,
    diffTWD: 511,
    diffPct: 1.7,
    cashSell: 43.63,
    marketMid: 42.887164,
    bankMid: 42.57,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6402,
    foreignAtMarketMid: 6495,
    foreignAtBankMid: 6515,
    diffForeign: 93,
    diffTWD: 429,
    diffPct: 1.5,
    cashSell: 4.686,
    marketMid: 4.618938,
    bankMid: 4.605,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1273345,
    foreignAtMarketMid: 1396082,
    foreignAtBankMid: 1388246,
    diffForeign: 122737,
    diffTWD: 2637,
    diffPct: 9.6,
    cashSell: 0.02356,
    marketMid: 0.021489,
    bankMid: 0.02161,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.9,
        rateBuy: 45.2,
        rateInverse: 0.022272,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-05',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7358,
    foreignAtMarketMid: 7427,
    foreignAtBankMid: 7547,
    diffForeign: 69,
    diffTWD: 276,
    diffPct: 0.9,
    cashSell: 4.077,
    marketMid: 4.039457,
    bankMid: 3.975,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1305,
    foreignAtMarketMid: 1320,
    foreignAtBankMid: 1328,
    diffForeign: 15,
    diffTWD: 333,
    diffPct: 1.1,
    cashSell: 22.98,
    marketMid: 22.725207,
    bankMid: 22.59,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1272,
    foreignAtMarketMid: 1290,
    foreignAtBankMid: 1297,
    diffForeign: 18,
    diffTWD: 434,
    diffPct: 1.5,
    cashSell: 23.59,
    marketMid: 23.248785,
    bankMid: 23.135,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1197,
    foreignAtMarketMid: 1209,
    foreignAtBankMid: 1219,
    diffForeign: 12,
    diffTWD: 303,
    diffPct: 1,
    cashSell: 25.06,
    marketMid: 24.806509,
    bankMid: 24.605,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 738,
    foreignAtMarketMid: 743,
    foreignAtBankMid: 749,
    diffForeign: 5,
    diffTWD: 192,
    diffPct: 0.6,
    cashSell: 40.65,
    marketMid: 40.389353,
    bankMid: 40.05,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1587,
    foreignAtMarketMid: 1611,
    foreignAtBankMid: 1624,
    diffForeign: 24,
    diffTWD: 447,
    diffPct: 1.5,
    cashSell: 18.9,
    marketMid: 18.61816,
    bankMid: 18.475,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29265,
    foreignAtMarketMid: 30943,
    foreignAtBankMid: 32255,
    diffForeign: 1678,
    diffTWD: 1627,
    diffPct: 5.7,
    cashSell: 1.0251,
    marketMid: 0.96951,
    bankMid: 0.9301,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51894,
    foreignAtMarketMid: 58435,
    foreignAtBankMid: 58582,
    diffForeign: 6541,
    diffTWD: 3358,
    diffPct: 12.6,
    cashSell: 0.5781,
    marketMid: 0.513389,
    bankMid: 0.5121,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16480096,
    foreignAtBankMid: 16853933,
    diffForeign: 2395589,
    diffTWD: 4361,
    diffPct: 17,
    cashSell: 0.00213,
    marketMid: 0.00182,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3545,
    foreignAtMarketMid: 3750,
    foreignAtBankMid: 3896,
    diffForeign: 205,
    diffTWD: 1639,
    diffPct: 5.8,
    cashSell: 8.463,
    marketMid: 8.000576,
    bankMid: 7.7005,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24896351,
    foreignAtBankMid: 25531915,
    diffForeign: 3157221,
    diffTWD: 3804,
    diffPct: 14.5,
    cashSell: 0.00138,
    marketMid: 0.001205,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/05 12:29:44';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-05';
