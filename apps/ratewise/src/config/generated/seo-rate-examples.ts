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
 * 匯率時間：2026/09/18 14:01:40
 * 生成日期：2026-09-18
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
    diffTWD: 151,
    diffPct: 0.5,
    cashSell: 32.025,
    marketMid: 31.86337,
    bankMid: 31.69,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 145843,
    foreignAtMarketMid: 146775,
    foreignAtBankMid: 150527,
    diffForeign: 932,
    diffTWD: 190,
    diffPct: 0.6,
    cashSell: 0.2057,
    marketMid: 0.204395,
    bankMid: 0.1993,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 811,
    foreignAtMarketMid: 819,
    foreignAtBankMid: 826,
    diffForeign: 8,
    diffTWD: 308,
    diffPct: 1,
    cashSell: 36.99,
    marketMid: 36.609921,
    bankMid: 36.32,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 692,
    foreignAtMarketMid: 704,
    foreignAtBankMid: 709,
    diffForeign: 12,
    diffTWD: 518,
    diffPct: 1.8,
    cashSell: 43.36,
    marketMid: 42.611215,
    bankMid: 42.3,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6241,
    foreignAtMarketMid: 6312,
    foreignAtBankMid: 6348,
    diffForeign: 71,
    diffTWD: 338,
    diffPct: 1.1,
    cashSell: 4.807,
    marketMid: 4.752852,
    bankMid: 4.726,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1193792,
    foreignAtMarketMid: 1299678,
    foreignAtBankMid: 1294219,
    diffForeign: 105886,
    diffTWD: 2444,
    diffPct: 8.9,
    cashSell: 0.02513,
    marketMid: 0.023083,
    bankMid: 0.02318,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.2,
        rateBuy: 42.5,
        rateInverse: 0.023697,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-18',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7326,
    foreignAtMarketMid: 7385,
    foreignAtBankMid: 7513,
    diffForeign: 59,
    diffTWD: 241,
    diffPct: 0.8,
    cashSell: 4.095,
    marketMid: 4.062118,
    bankMid: 3.993,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1304,
    foreignAtMarketMid: 1323,
    foreignAtBankMid: 1327,
    diffForeign: 19,
    diffTWD: 432,
    diffPct: 1.5,
    cashSell: 23,
    marketMid: 22.668541,
    bankMid: 22.61,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1298,
    foreignAtMarketMid: 1316,
    foreignAtBankMid: 1324,
    diffForeign: 18,
    diffTWD: 418,
    diffPct: 1.4,
    cashSell: 23.11,
    marketMid: 22.787868,
    bankMid: 22.655,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1190,
    foreignAtMarketMid: 1201,
    foreignAtBankMid: 1211,
    diffForeign: 11,
    diffTWD: 279,
    diffPct: 0.9,
    cashSell: 25.22,
    marketMid: 24.985633,
    bankMid: 24.765,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 771,
    foreignAtMarketMid: 776,
    foreignAtBankMid: 783,
    diffForeign: 5,
    diffTWD: 192,
    diffPct: 0.6,
    cashSell: 38.92,
    marketMid: 38.671256,
    bankMid: 38.32,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1616,
    foreignAtMarketMid: 1642,
    foreignAtBankMid: 1654,
    diffForeign: 26,
    diffTWD: 465,
    diffPct: 1.6,
    cashSell: 18.56,
    marketMid: 18.272516,
    bankMid: 18.135,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29530,
    foreignAtMarketMid: 31314,
    foreignAtBankMid: 32577,
    diffForeign: 1784,
    diffTWD: 1709,
    diffPct: 6,
    cashSell: 1.0159,
    marketMid: 0.958031,
    bankMid: 0.9209,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52383,
    foreignAtMarketMid: 59091,
    foreignAtBankMid: 59207,
    diffForeign: 6708,
    diffTWD: 3405,
    diffPct: 12.8,
    cashSell: 0.5727,
    marketMid: 0.507689,
    bankMid: 0.5067,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16697874,
    foreignAtBankMid: 16853933,
    diffForeign: 2613367,
    diffTWD: 4695,
    diffPct: 18.6,
    cashSell: 0.00213,
    marketMid: 0.001797,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3623,
    foreignAtMarketMid: 3855,
    foreignAtBankMid: 3990,
    diffForeign: 232,
    diffTWD: 1804,
    diffPct: 6.4,
    cashSell: 8.281,
    marketMid: 7.782949,
    bankMid: 7.5185,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24437501,
    foreignAtBankMid: 24896266,
    diffForeign: 3160905,
    diffTWD: 3880,
    diffPct: 14.9,
    cashSell: 0.00141,
    marketMid: 0.001228,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/18 14:01:40';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-18';
