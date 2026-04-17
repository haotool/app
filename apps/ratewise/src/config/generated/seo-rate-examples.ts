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
 * 匯率時間：2026/04/17 11:45:05
 * 生成日期：2026-04-17
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
    foreignAtCash: 942,
    foreignAtMarketMid: 950,
    foreignAtBankMid: 952,
    diffForeign: 8,
    diffTWD: 228,
    diffPct: 0.8,
    cashSell: 31.835,
    marketMid: 31.592582,
    bankMid: 31.5,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 148883,
    foreignAtMarketMid: 151228,
    foreignAtBankMid: 153767,
    diffForeign: 2345,
    diffTWD: 465,
    diffPct: 1.6,
    cashSell: 0.2015,
    marketMid: 0.198376,
    bankMid: 0.1951,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 796,
    foreignAtMarketMid: 806,
    foreignAtBankMid: 810,
    diffForeign: 10,
    diffTWD: 396,
    diffPct: 1.3,
    cashSell: 37.7,
    marketMid: 37.202381,
    bankMid: 37.03,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 701,
    foreignAtBankMid: 705,
    diffForeign: 13,
    diffTWD: 565,
    diffPct: 1.9,
    cashSell: 43.59,
    marketMid: 42.76977,
    bankMid: 42.53,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6398,
    foreignAtMarketMid: 6477,
    foreignAtBankMid: 6510,
    diffForeign: 79,
    diffTWD: 366,
    diffPct: 1.2,
    cashSell: 4.689,
    marketMid: 4.631774,
    bankMid: 4.608,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1277139,
    foreignAtMarketMid: 1404273,
    foreignAtBankMid: 1392758,
    diffForeign: 127134,
    diffTWD: 2716,
    diffPct: 10,
    cashSell: 0.02349,
    marketMid: 0.021363,
    bankMid: 0.02154,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.8,
        rateBuy: 45.5,
        rateInverse: 0.022321,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-17',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7353,
    foreignAtMarketMid: 7434,
    foreignAtBankMid: 7541,
    diffForeign: 81,
    diffTWD: 329,
    diffPct: 1.1,
    cashSell: 4.08,
    marketMid: 4.035268,
    bankMid: 3.978,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1305,
    foreignAtMarketMid: 1326,
    foreignAtBankMid: 1327,
    diffForeign: 21,
    diffTWD: 466,
    diffPct: 1.6,
    cashSell: 22.99,
    marketMid: 22.632627,
    bankMid: 22.6,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1279,
    foreignAtMarketMid: 1303,
    foreignAtBankMid: 1304,
    diffForeign: 24,
    diffTWD: 547,
    diffPct: 1.9,
    cashSell: 23.46,
    marketMid: 23.032453,
    bankMid: 23.005,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1194,
    foreignAtMarketMid: 1209,
    foreignAtBankMid: 1216,
    diffForeign: 15,
    diffTWD: 366,
    diffPct: 1.2,
    cashSell: 25.13,
    marketMid: 24.823751,
    bankMid: 24.675,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 738,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 749,
    diffForeign: 6,
    diffTWD: 253,
    diffPct: 0.8,
    cashSell: 40.66,
    marketMid: 40.317704,
    bankMid: 40.06,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1584,
    foreignAtMarketMid: 1612,
    foreignAtBankMid: 1620,
    diffForeign: 28,
    diffTWD: 527,
    diffPct: 1.8,
    cashSell: 18.94,
    marketMid: 18.607074,
    bankMid: 18.515,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28670,
    foreignAtMarketMid: 30416,
    foreignAtBankMid: 31532,
    diffForeign: 1746,
    diffTWD: 1722,
    diffPct: 6.1,
    cashSell: 1.0464,
    marketMid: 0.98633,
    bankMid: 0.9514,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50744,
    foreignAtMarketMid: 57015,
    foreignAtBankMid: 57121,
    diffForeign: 6271,
    diffTWD: 3299,
    diffPct: 12.4,
    cashSell: 0.5912,
    marketMid: 0.526181,
    bankMid: 0.5252,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 16279621,
    foreignAtBankMid: 15957447,
    diffForeign: 2826706,
    diffTWD: 5209,
    diffPct: 21,
    cashSell: 0.00223,
    marketMid: 0.001843,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3539,
    foreignAtMarketMid: 3757,
    foreignAtBankMid: 3889,
    diffForeign: 218,
    diffTWD: 1740,
    diffPct: 6.2,
    cashSell: 8.477,
    marketMid: 7.985435,
    bankMid: 7.7145,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24929415,
    foreignAtBankMid: 25531915,
    diffForeign: 3190285,
    diffTWD: 3839,
    diffPct: 14.7,
    cashSell: 0.00138,
    marketMid: 0.001203,
    bankMid: 0.001175,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/17 11:45:05';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-17';
