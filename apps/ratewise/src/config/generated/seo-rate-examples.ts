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
 * 匯率時間：2026/09/23 13:09:19
 * 生成日期：2026-09-23
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
    foreignAtCash: 939,
    foreignAtMarketMid: 946,
    foreignAtBankMid: 949,
    diffForeign: 7,
    diffTWD: 239,
    diffPct: 0.8,
    cashSell: 31.96,
    marketMid: 31.70577,
    bankMid: 31.625,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146628,
    foreignAtMarketMid: 148998,
    foreignAtBankMid: 151362,
    diffForeign: 2370,
    diffTWD: 477,
    diffPct: 1.6,
    cashSell: 0.2046,
    marketMid: 0.201346,
    bankMid: 0.1982,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 817,
    foreignAtMarketMid: 827,
    foreignAtBankMid: 832,
    diffForeign: 10,
    diffTWD: 367,
    diffPct: 1.2,
    cashSell: 36.74,
    marketMid: 36.291054,
    bankMid: 36.07,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 696,
    foreignAtMarketMid: 709,
    foreignAtBankMid: 713,
    diffForeign: 13,
    diffTWD: 566,
    diffPct: 1.9,
    cashSell: 43.12,
    marketMid: 42.306553,
    bankMid: 42.06,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6263,
    foreignAtMarketMid: 6342,
    foreignAtBankMid: 6371,
    diffForeign: 79,
    diffTWD: 373,
    diffPct: 1.3,
    cashSell: 4.79,
    marketMid: 4.730369,
    bankMid: 4.709,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1171875,
    foreignAtMarketMid: 1282096,
    foreignAtBankMid: 1268499,
    diffForeign: 110221,
    diffTWD: 2579,
    diffPct: 9.4,
    cashSell: 0.0256,
    marketMid: 0.023399,
    bankMid: 0.02365,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.6,
        rateBuy: 41.9,
        rateInverse: 0.024038,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-23',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7339,
    foreignAtMarketMid: 7426,
    foreignAtBankMid: 7526,
    diffForeign: 87,
    diffTWD: 353,
    diffPct: 1.2,
    cashSell: 4.088,
    marketMid: 4.039865,
    bankMid: 3.986,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1311,
    foreignAtMarketMid: 1331,
    foreignAtBankMid: 1333,
    diffForeign: 20,
    diffTWD: 459,
    diffPct: 1.6,
    cashSell: 22.89,
    marketMid: 22.539783,
    bankMid: 22.5,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1309,
    foreignAtMarketMid: 1331,
    foreignAtBankMid: 1335,
    diffForeign: 22,
    diffTWD: 491,
    diffPct: 1.7,
    cashSell: 22.92,
    marketMid: 22.544864,
    bankMid: 22.465,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1192,
    foreignAtMarketMid: 1207,
    foreignAtBankMid: 1214,
    diffForeign: 15,
    diffTWD: 384,
    diffPct: 1.3,
    cashSell: 25.17,
    marketMid: 24.847807,
    bankMid: 24.715,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 770,
    foreignAtMarketMid: 777,
    foreignAtBankMid: 782,
    diffForeign: 7,
    diffTWD: 266,
    diffPct: 0.9,
    cashSell: 38.96,
    marketMid: 38.614511,
    bankMid: 38.36,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1626,
    foreignAtMarketMid: 1654,
    foreignAtBankMid: 1664,
    diffForeign: 28,
    diffTWD: 499,
    diffPct: 1.7,
    cashSell: 18.45,
    marketMid: 18.143223,
    bankMid: 18.025,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29530,
    foreignAtMarketMid: 31427,
    foreignAtBankMid: 32577,
    diffForeign: 1897,
    diffTWD: 1810,
    diffPct: 6.4,
    cashSell: 1.0159,
    marketMid: 0.954594,
    bankMid: 0.9209,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52420,
    foreignAtMarketMid: 59252,
    foreignAtBankMid: 59253,
    diffForeign: 6832,
    diffTWD: 3459,
    diffPct: 13,
    cashSell: 0.5723,
    marketMid: 0.506311,
    bankMid: 0.5063,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16877095,
    foreignAtBankMid: 16853933,
    diffForeign: 2792588,
    diffTWD: 4964,
    diffPct: 19.8,
    cashSell: 0.00213,
    marketMid: 0.001778,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3625,
    foreignAtMarketMid: 3857,
    foreignAtBankMid: 3993,
    diffForeign: 232,
    diffTWD: 1808,
    diffPct: 6.4,
    cashSell: 8.276,
    marketMid: 7.777259,
    bankMid: 7.5135,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24583360,
    foreignAtBankMid: 24896266,
    diffForeign: 3306764,
    diffTWD: 4035,
    diffPct: 15.5,
    cashSell: 0.00141,
    marketMid: 0.00122,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/23 13:09:19';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-23';
