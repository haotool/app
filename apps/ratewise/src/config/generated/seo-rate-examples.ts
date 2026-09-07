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
 * 匯率時間：2026/09/07 12:37:04
 * 生成日期：2026-09-07
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
    foreignAtCash: 941,
    foreignAtMarketMid: 948,
    foreignAtBankMid: 951,
    diffForeign: 7,
    diffTWD: 229,
    diffPct: 0.8,
    cashSell: 31.875,
    marketMid: 31.631556,
    bankMid: 31.54,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145631,
    foreignAtMarketMid: 148059,
    foreignAtBankMid: 150301,
    diffForeign: 2428,
    diffTWD: 492,
    diffPct: 1.7,
    cashSell: 0.206,
    marketMid: 0.202623,
    bankMid: 0.1996,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 806,
    foreignAtMarketMid: 816,
    foreignAtBankMid: 821,
    diffForeign: 10,
    diffTWD: 369,
    diffPct: 1.2,
    cashSell: 37.22,
    marketMid: 36.762003,
    bankMid: 36.55,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 701,
    foreignAtBankMid: 705,
    diffForeign: 13,
    diffTWD: 587,
    diffPct: 2,
    cashSell: 43.62,
    marketMid: 42.766112,
    bankMid: 42.56,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6284,
    foreignAtMarketMid: 6363,
    foreignAtBankMid: 6392,
    diffForeign: 79,
    diffTWD: 372,
    diffPct: 1.3,
    cashSell: 4.774,
    marketMid: 4.714757,
    bankMid: 4.693,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1171417,
    foreignAtMarketMid: 1276814,
    foreignAtBankMid: 1267963,
    diffForeign: 105397,
    diffTWD: 2476,
    diffPct: 9,
    cashSell: 0.02561,
    marketMid: 0.023496,
    bankMid: 0.02366,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.6,
        rateBuy: 41.7,
        rateInverse: 0.024038,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-07',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7355,
    foreignAtMarketMid: 7433,
    foreignAtBankMid: 7543,
    diffForeign: 78,
    diffTWD: 315,
    diffPct: 1.1,
    cashSell: 4.079,
    marketMid: 4.036131,
    bankMid: 3.977,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1296,
    foreignAtMarketMid: 1316,
    foreignAtBankMid: 1318,
    diffForeign: 20,
    diffTWD: 467,
    diffPct: 1.6,
    cashSell: 23.15,
    marketMid: 22.789945,
    bankMid: 22.76,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1290,
    foreignAtMarketMid: 1311,
    foreignAtBankMid: 1316,
    diffForeign: 21,
    diffTWD: 481,
    diffPct: 1.6,
    cashSell: 23.26,
    marketMid: 22.886961,
    bankMid: 22.805,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1187,
    foreignAtMarketMid: 1201,
    foreignAtBankMid: 1209,
    diffForeign: 14,
    diffTWD: 346,
    diffPct: 1.2,
    cashSell: 25.27,
    marketMid: 24.978768,
    bankMid: 24.815,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 762,
    foreignAtMarketMid: 768,
    foreignAtBankMid: 774,
    diffForeign: 6,
    diffTWD: 218,
    diffPct: 0.7,
    cashSell: 39.37,
    marketMid: 39.083874,
    bankMid: 38.77,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1584,
    foreignAtMarketMid: 1613,
    foreignAtBankMid: 1620,
    diffForeign: 29,
    diffTWD: 536,
    diffPct: 1.8,
    cashSell: 18.94,
    marketMid: 18.601536,
    bankMid: 18.515,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29366,
    foreignAtMarketMid: 31205,
    foreignAtBankMid: 32376,
    diffForeign: 1839,
    diffTWD: 1769,
    diffPct: 6.3,
    cashSell: 1.0216,
    marketMid: 0.961374,
    bankMid: 0.9266,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52678,
    foreignAtMarketMid: 59482,
    foreignAtBankMid: 59583,
    diffForeign: 6804,
    diffTWD: 3432,
    diffPct: 12.9,
    cashSell: 0.5695,
    marketMid: 0.504352,
    bankMid: 0.5035,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16739922,
    foreignAtBankMid: 16853933,
    diffForeign: 2655415,
    diffTWD: 4759,
    diffPct: 18.9,
    cashSell: 0.00213,
    marketMid: 0.001792,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3613,
    foreignAtMarketMid: 3836,
    foreignAtBankMid: 3978,
    diffForeign: 223,
    diffTWD: 1746,
    diffPct: 6.2,
    cashSell: 8.304,
    marketMid: 7.82081,
    bankMid: 7.5415,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24629334,
    foreignAtBankMid: 25104603,
    diffForeign: 3200763,
    diffTWD: 3899,
    diffPct: 14.9,
    cashSell: 0.0014,
    marketMid: 0.001218,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/07 12:37:04';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-07';
