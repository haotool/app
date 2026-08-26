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
 * 匯率時間：2026/08/26 04:11:27
 * 生成日期：2026-08-26
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
    foreignAtCash: 933,
    foreignAtMarketMid: 942,
    foreignAtBankMid: 943,
    diffForeign: 9,
    diffTWD: 272,
    diffPct: 0.9,
    cashSell: 32.14,
    marketMid: 31.848148,
    bankMid: 31.805,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147131,
    foreignAtMarketMid: 149886,
    foreignAtBankMid: 151899,
    diffForeign: 2755,
    diffTWD: 551,
    diffPct: 1.9,
    cashSell: 0.2039,
    marketMid: 0.200152,
    bankMid: 0.1975,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 795,
    foreignAtMarketMid: 807,
    foreignAtBankMid: 809,
    diffForeign: 12,
    diffTWD: 441,
    diffPct: 1.5,
    cashSell: 37.74,
    marketMid: 37.18578,
    bankMid: 37.07,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 675,
    foreignAtMarketMid: 690,
    foreignAtBankMid: 692,
    diffForeign: 15,
    diffTWD: 659,
    diffPct: 2.2,
    cashSell: 44.44,
    marketMid: 43.463143,
    bankMid: 43.38,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6238,
    foreignAtMarketMid: 6330,
    foreignAtBankMid: 6345,
    diffForeign: 92,
    diffTWD: 435,
    diffPct: 1.5,
    cashSell: 4.809,
    marketMid: 4.739336,
    bankMid: 4.728,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1189532,
    foreignAtMarketMid: 1302670,
    foreignAtBankMid: 1289214,
    diffForeign: 113138,
    diffTWD: 2606,
    diffPct: 9.5,
    cashSell: 0.02522,
    marketMid: 0.02303,
    bankMid: 0.02327,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43,
        rateBuy: 43.5,
        rateInverse: 0.023256,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-26',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7292,
    foreignAtMarketMid: 7380,
    foreignAtBankMid: 7478,
    diffForeign: 88,
    diffTWD: 357,
    diffPct: 1.2,
    cashSell: 4.114,
    marketMid: 4.065074,
    bankMid: 4.012,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1316,
    foreignAtBankMid: 1313,
    diffForeign: 25,
    diffTWD: 558,
    diffPct: 1.9,
    cashSell: 23.23,
    marketMid: 22.797738,
    bankMid: 22.84,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1278,
    foreignAtMarketMid: 1303,
    foreignAtBankMid: 1303,
    diffForeign: 25,
    diffTWD: 580,
    diffPct: 2,
    cashSell: 23.48,
    marketMid: 23.026089,
    bankMid: 23.025,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1179,
    foreignAtMarketMid: 1195,
    foreignAtBankMid: 1200,
    diffForeign: 16,
    diffTWD: 417,
    diffPct: 1.4,
    cashSell: 25.45,
    marketMid: 25.095992,
    bankMid: 24.995,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 747,
    foreignAtMarketMid: 756,
    foreignAtBankMid: 758,
    diffForeign: 9,
    diffTWD: 338,
    diffPct: 1.1,
    cashSell: 40.16,
    marketMid: 39.707751,
    bankMid: 39.56,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1545,
    foreignAtMarketMid: 1578,
    foreignAtBankMid: 1579,
    diffForeign: 33,
    diffTWD: 631,
    diffPct: 2.1,
    cashSell: 19.42,
    marketMid: 19.011407,
    bankMid: 18.995,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28958,
    foreignAtMarketMid: 30799,
    foreignAtBankMid: 31881,
    diffForeign: 1841,
    diffTWD: 1793,
    diffPct: 6.4,
    cashSell: 1.036,
    marketMid: 0.974069,
    bankMid: 0.941,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51502,
    foreignAtMarketMid: 58123,
    foreignAtBankMid: 58083,
    diffForeign: 6621,
    diffTWD: 3417,
    diffPct: 12.9,
    cashSell: 0.5825,
    marketMid: 0.516151,
    bankMid: 0.5165,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16684657,
    foreignAtBankMid: 17341040,
    diffForeign: 2261580,
    diffTWD: 4066,
    diffPct: 15.7,
    cashSell: 0.00208,
    marketMid: 0.001798,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3583,
    foreignAtMarketMid: 3810,
    foreignAtBankMid: 3941,
    diffForeign: 227,
    diffTWD: 1789,
    diffPct: 6.3,
    cashSell: 8.374,
    marketMid: 7.874636,
    bankMid: 7.6115,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24526314,
    foreignAtBankMid: 25316456,
    diffForeign: 2943580,
    diffTWD: 3601,
    diffPct: 13.6,
    cashSell: 0.00139,
    marketMid: 0.001223,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/26 04:11:27';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-26';
