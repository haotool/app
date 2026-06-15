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
 * 匯率時間：2026/06/15 15:02:08
 * 生成日期：2026-06-15
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
    foreignAtCash: 943,
    foreignAtMarketMid: 950,
    foreignAtBankMid: 953,
    diffForeign: 7,
    diffTWD: 208,
    diffPct: 0.7,
    cashSell: 31.815,
    marketMid: 31.594578,
    bankMid: 31.48,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149626,
    foreignAtMarketMid: 151780,
    foreignAtBankMid: 154560,
    diffForeign: 2154,
    diffTWD: 426,
    diffPct: 1.4,
    cashSell: 0.2005,
    marketMid: 0.197654,
    bankMid: 0.1941,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 808,
    foreignAtMarketMid: 818,
    foreignAtBankMid: 823,
    diffForeign: 10,
    diffTWD: 374,
    diffPct: 1.3,
    cashSell: 37.14,
    marketMid: 36.677058,
    bankMid: 36.47,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 692,
    foreignAtMarketMid: 706,
    foreignAtBankMid: 710,
    diffForeign: 14,
    diffTWD: 574,
    diffPct: 2,
    cashSell: 43.33,
    marketMid: 42.500744,
    bankMid: 42.27,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6341,
    foreignAtMarketMid: 6429,
    foreignAtBankMid: 6452,
    diffForeign: 88,
    diffTWD: 410,
    diffPct: 1.4,
    cashSell: 4.731,
    marketMid: 4.666356,
    bankMid: 4.65,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1303215,
    foreignAtMarketMid: 1441409,
    foreignAtBankMid: 1423825,
    diffForeign: 138194,
    diffTWD: 2876,
    diffPct: 10.6,
    cashSell: 0.02302,
    marketMid: 0.020813,
    bankMid: 0.02107,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 46.65,
        rateBuy: 47,
        rateInverse: 0.021436,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-06-15',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7366,
    foreignAtMarketMid: 7432,
    foreignAtBankMid: 7555,
    diffForeign: 66,
    diffTWD: 266,
    diffPct: 0.9,
    cashSell: 4.073,
    marketMid: 4.036832,
    bankMid: 3.971,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1322,
    foreignAtMarketMid: 1343,
    foreignAtBankMid: 1345,
    diffForeign: 21,
    diffTWD: 481,
    diffPct: 1.6,
    cashSell: 22.7,
    marketMid: 22.336386,
    bankMid: 22.31,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1305,
    foreignAtMarketMid: 1325,
    foreignAtBankMid: 1331,
    diffForeign: 20,
    diffTWD: 446,
    diffPct: 1.5,
    cashSell: 22.99,
    marketMid: 22.648005,
    bankMid: 22.535,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1202,
    foreignAtMarketMid: 1216,
    foreignAtBankMid: 1225,
    diffForeign: 14,
    diffTWD: 334,
    diffPct: 1.1,
    cashSell: 24.95,
    marketMid: 24.671864,
    bankMid: 24.495,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 748,
    foreignAtMarketMid: 754,
    foreignAtBankMid: 759,
    diffForeign: 6,
    diffTWD: 245,
    diffPct: 0.8,
    cashSell: 40.13,
    marketMid: 39.802579,
    bankMid: 39.53,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1593,
    foreignAtMarketMid: 1623,
    foreignAtBankMid: 1630,
    diffForeign: 30,
    diffTWD: 550,
    diffPct: 1.9,
    cashSell: 18.83,
    marketMid: 18.484972,
    bankMid: 18.405,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29146,
    foreignAtMarketMid: 30964,
    foreignAtBankMid: 32110,
    diffForeign: 1818,
    diffTWD: 1762,
    diffPct: 6.2,
    cashSell: 1.0293,
    marketMid: 0.968854,
    bankMid: 0.9343,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51099,
    foreignAtMarketMid: 57673,
    foreignAtBankMid: 57571,
    diffForeign: 6574,
    diffTWD: 3420,
    diffPct: 12.9,
    cashSell: 0.5871,
    marketMid: 0.520178,
    bankMid: 0.5211,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16939660,
    foreignAtBankMid: 16853933,
    diffForeign: 2855153,
    diffTWD: 5056,
    diffPct: 20.3,
    cashSell: 0.00213,
    marketMid: 0.001771,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3619,
    foreignAtMarketMid: 3850,
    foreignAtBankMid: 3986,
    diffForeign: 231,
    diffTWD: 1801,
    diffPct: 6.4,
    cashSell: 8.289,
    marketMid: 7.791317,
    bankMid: 7.5265,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24892606,
    foreignAtBankMid: 25531915,
    diffForeign: 3153476,
    diffTWD: 3800,
    diffPct: 14.5,
    cashSell: 0.00138,
    marketMid: 0.001205,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/06/15 15:02:08';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-06-15';
