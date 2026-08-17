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
 * 匯率時間：2026/08/17 06:32:27
 * 生成日期：2026-08-17
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
    foreignAtCash: 929,
    foreignAtMarketMid: 938,
    foreignAtBankMid: 939,
    diffForeign: 9,
    diffTWD: 296,
    diffPct: 1,
    cashSell: 32.285,
    marketMid: 31.966244,
    bankMid: 31.95,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146628,
    foreignAtMarketMid: 149255,
    foreignAtBankMid: 151362,
    diffForeign: 2627,
    diffTWD: 528,
    diffPct: 1.8,
    cashSell: 0.2046,
    marketMid: 0.200999,
    bankMid: 0.1982,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 799,
    foreignAtMarketMid: 810,
    foreignAtBankMid: 813,
    diffForeign: 11,
    diffTWD: 426,
    diffPct: 1.4,
    cashSell: 37.57,
    marketMid: 37.037037,
    bankMid: 36.9,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 678,
    foreignAtMarketMid: 692,
    foreignAtBankMid: 694,
    diffForeign: 14,
    diffTWD: 634,
    diffPct: 2.2,
    cashSell: 44.28,
    marketMid: 43.344458,
    bankMid: 43.22,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6232,
    foreignAtMarketMid: 6300,
    foreignAtBankMid: 6338,
    diffForeign: 68,
    diffTWD: 325,
    diffPct: 1.1,
    cashSell: 4.814,
    marketMid: 4.761905,
    bankMid: 4.733,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1211143,
    foreignAtMarketMid: 1328677,
    foreignAtBankMid: 1314636,
    diffForeign: 117534,
    diffTWD: 2654,
    diffPct: 9.7,
    cashSell: 0.02477,
    marketMid: 0.022579,
    bankMid: 0.02282,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43,
        rateBuy: 43.1,
        rateInverse: 0.023256,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-17',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7267,
    foreignAtMarketMid: 7358,
    foreignAtBankMid: 7452,
    diffForeign: 91,
    diffTWD: 368,
    diffPct: 1.2,
    cashSell: 4.128,
    marketMid: 4.077405,
    bankMid: 4.026,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1300,
    foreignAtMarketMid: 1325,
    foreignAtBankMid: 1322,
    diffForeign: 25,
    diffTWD: 570,
    diffPct: 1.9,
    cashSell: 23.08,
    marketMid: 22.641851,
    bankMid: 22.69,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1277,
    foreignAtMarketMid: 1301,
    foreignAtBankMid: 1302,
    diffForeign: 24,
    diffTWD: 560,
    diffPct: 1.9,
    cashSell: 23.5,
    marketMid: 23.061135,
    bankMid: 23.045,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1182,
    foreignAtMarketMid: 1199,
    foreignAtBankMid: 1204,
    diffForeign: 17,
    diffTWD: 415,
    diffPct: 1.4,
    cashSell: 25.37,
    marketMid: 25.01939,
    bankMid: 24.915,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 755,
    foreignAtMarketMid: 762,
    foreignAtBankMid: 766,
    diffForeign: 7,
    diffTWD: 281,
    diffPct: 0.9,
    cashSell: 39.75,
    marketMid: 39.37783,
    bankMid: 39.15,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1560,
    foreignAtMarketMid: 1594,
    foreignAtBankMid: 1595,
    diffForeign: 34,
    diffTWD: 630,
    diffPct: 2.1,
    cashSell: 19.23,
    marketMid: 18.82601,
    bankMid: 18.805,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29191,
    foreignAtMarketMid: 31069,
    foreignAtBankMid: 32165,
    diffForeign: 1878,
    diffTWD: 1813,
    diffPct: 6.4,
    cashSell: 1.0277,
    marketMid: 0.965605,
    bankMid: 0.9327,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51107,
    foreignAtMarketMid: 57740,
    foreignAtBankMid: 57582,
    diffForeign: 6633,
    diffTWD: 3446,
    diffPct: 13,
    cashSell: 0.587,
    marketMid: 0.519567,
    bankMid: 0.521,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16730321,
    foreignAtBankMid: 17341040,
    diffForeign: 2307244,
    diffTWD: 4137,
    diffPct: 16,
    cashSell: 0.00208,
    marketMid: 0.001793,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3599,
    foreignAtMarketMid: 3832,
    foreignAtBankMid: 3962,
    diffForeign: 233,
    diffTWD: 1821,
    diffPct: 6.5,
    cashSell: 8.335,
    marketMid: 7.828953,
    bankMid: 7.5725,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24286346,
    foreignAtBankMid: 25316456,
    diffForeign: 2703612,
    diffTWD: 3340,
    diffPct: 12.5,
    cashSell: 0.00139,
    marketMid: 0.001235,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/17 06:32:27';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-17';
