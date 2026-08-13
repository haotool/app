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
 * 匯率時間：2026/08/13 11:15:43
 * 生成日期：2026-08-13
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
    foreignAtCash: 925,
    foreignAtMarketMid: 932,
    foreignAtBankMid: 934,
    diffForeign: 7,
    diffTWD: 219,
    diffPct: 0.7,
    cashSell: 32.44,
    marketMid: 32.203008,
    bankMid: 32.105,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146128,
    foreignAtMarketMid: 148289,
    foreignAtBankMid: 150830,
    diffForeign: 2161,
    diffTWD: 437,
    diffPct: 1.5,
    cashSell: 0.2053,
    marketMid: 0.202308,
    bankMid: 0.1989,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 798,
    foreignAtMarketMid: 807,
    foreignAtBankMid: 813,
    diffForeign: 9,
    diffTWD: 340,
    diffPct: 1.1,
    cashSell: 37.59,
    marketMid: 37.163669,
    bankMid: 36.92,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 677,
    foreignAtMarketMid: 689,
    foreignAtBankMid: 693,
    diffForeign: 12,
    diffTWD: 545,
    diffPct: 1.9,
    cashSell: 44.32,
    marketMid: 43.514207,
    bankMid: 43.26,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6206,
    foreignAtMarketMid: 6282,
    foreignAtBankMid: 6312,
    diffForeign: 76,
    diffTWD: 363,
    diffPct: 1.2,
    cashSell: 4.834,
    marketMid: 4.775549,
    bankMid: 4.753,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1205303,
    foreignAtMarketMid: 1320440,
    foreignAtBankMid: 1307759,
    diffForeign: 115137,
    diffTWD: 2616,
    diffPct: 9.6,
    cashSell: 0.02489,
    marketMid: 0.02272,
    bankMid: 0.02294,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.9,
        rateBuy: 43.3,
        rateInverse: 0.02331,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-13',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7234,
    foreignAtMarketMid: 7305,
    foreignAtBankMid: 7417,
    diffForeign: 71,
    diffTWD: 293,
    diffPct: 1,
    cashSell: 4.147,
    marketMid: 4.10654,
    bankMid: 4.045,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1300,
    foreignAtMarketMid: 1319,
    foreignAtBankMid: 1323,
    diffForeign: 19,
    diffTWD: 416,
    diffPct: 1.4,
    cashSell: 23.07,
    marketMid: 22.750023,
    bankMid: 22.68,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1278,
    foreignAtMarketMid: 1297,
    foreignAtBankMid: 1303,
    diffForeign: 19,
    diffTWD: 455,
    diffPct: 1.5,
    cashSell: 23.48,
    marketMid: 23.124061,
    bankMid: 23.025,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1178,
    foreignAtMarketMid: 1192,
    foreignAtBankMid: 1200,
    diffForeign: 14,
    diffTWD: 334,
    diffPct: 1.1,
    cashSell: 25.46,
    marketMid: 25.176234,
    bankMid: 25.005,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 752,
    foreignAtMarketMid: 756,
    foreignAtBankMid: 763,
    diffForeign: 4,
    diffTWD: 197,
    diffPct: 0.7,
    cashSell: 39.92,
    marketMid: 39.65736,
    bankMid: 39.32,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1565,
    foreignAtMarketMid: 1589,
    foreignAtBankMid: 1600,
    diffForeign: 24,
    diffTWD: 457,
    diffPct: 1.5,
    cashSell: 19.17,
    marketMid: 18.877898,
    bankMid: 18.745,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29028,
    foreignAtMarketMid: 30806,
    foreignAtBankMid: 31966,
    diffForeign: 1778,
    diffTWD: 1732,
    diffPct: 6.1,
    cashSell: 1.0335,
    marketMid: 0.973849,
    bankMid: 0.9385,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50744,
    foreignAtMarketMid: 57106,
    foreignAtBankMid: 57121,
    diffForeign: 6362,
    diffTWD: 3342,
    diffPct: 12.5,
    cashSell: 0.5912,
    marketMid: 0.525335,
    bankMid: 0.5252,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16646969,
    foreignAtBankMid: 16853933,
    diffForeign: 2562462,
    diffTWD: 4618,
    diffPct: 18.2,
    cashSell: 0.00213,
    marketMid: 0.001802,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3585,
    foreignAtMarketMid: 3805,
    foreignAtBankMid: 3945,
    diffForeign: 220,
    diffTWD: 1732,
    diffPct: 6.1,
    cashSell: 8.368,
    marketMid: 7.884756,
    bankMid: 7.6055,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 24228871,
    foreignAtBankMid: 24691358,
    diffForeign: 3102110,
    diffTWD: 3841,
    diffPct: 14.7,
    cashSell: 0.00142,
    marketMid: 0.001238,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/13 11:15:43';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-13';
