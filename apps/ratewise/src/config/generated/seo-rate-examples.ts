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
 * 匯率時間：2026/05/13 13:36:09
 * 生成日期：2026-05-13
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
    foreignAtCash: 944,
    foreignAtMarketMid: 951,
    foreignAtBankMid: 954,
    diffForeign: 7,
    diffTWD: 229,
    diffPct: 0.8,
    cashSell: 31.795,
    marketMid: 31.552709,
    bankMid: 31.46,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147493,
    foreignAtMarketMid: 149881,
    foreignAtBankMid: 152284,
    diffForeign: 2388,
    diffTWD: 478,
    diffPct: 1.6,
    cashSell: 0.2034,
    marketMid: 0.200159,
    bankMid: 0.197,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 800,
    foreignAtMarketMid: 811,
    foreignAtBankMid: 814,
    diffForeign: 11,
    diffTWD: 421,
    diffPct: 1.4,
    cashSell: 37.52,
    marketMid: 36.993193,
    bankMid: 36.85,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 688,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 705,
    diffForeign: 15,
    diffTWD: 637,
    diffPct: 2.2,
    cashSell: 43.61,
    marketMid: 42.683968,
    bankMid: 42.55,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6373,
    foreignAtMarketMid: 6483,
    foreignAtBankMid: 6485,
    diffForeign: 110,
    diffTWD: 507,
    diffPct: 1.7,
    cashSell: 4.707,
    marketMid: 4.627487,
    bankMid: 4.626,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1289214,
    foreignAtMarketMid: 1418495,
    foreignAtBankMid: 1407129,
    diffForeign: 129281,
    diffTWD: 2734,
    diffPct: 10,
    cashSell: 0.02327,
    marketMid: 0.021149,
    bankMid: 0.02132,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.2,
        rateBuy: 45.5,
        rateInverse: 0.022124,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-13',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7364,
    foreignAtMarketMid: 7447,
    foreignAtBankMid: 7553,
    diffForeign: 83,
    diffTWD: 334,
    diffPct: 1.1,
    cashSell: 4.074,
    marketMid: 4.028587,
    bankMid: 3.972,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1293,
    foreignAtMarketMid: 1315,
    foreignAtBankMid: 1315,
    diffForeign: 22,
    diffTWD: 507,
    diffPct: 1.7,
    cashSell: 23.2,
    marketMid: 22.808138,
    bankMid: 22.81,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1280,
    foreignAtMarketMid: 1305,
    foreignAtBankMid: 1305,
    diffForeign: 25,
    diffTWD: 576,
    diffPct: 2,
    cashSell: 23.44,
    marketMid: 22.989563,
    bankMid: 22.985,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1194,
    foreignAtMarketMid: 1211,
    foreignAtBankMid: 1216,
    diffForeign: 17,
    diffTWD: 418,
    diffPct: 1.4,
    cashSell: 25.12,
    marketMid: 24.770256,
    bankMid: 24.665,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 736,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 747,
    diffForeign: 8,
    diffTWD: 314,
    diffPct: 1.1,
    cashSell: 40.77,
    marketMid: 40.343729,
    bankMid: 40.17,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1571,
    foreignAtMarketMid: 1599,
    foreignAtBankMid: 1606,
    diffForeign: 28,
    diffTWD: 540,
    diffPct: 1.8,
    cashSell: 19.1,
    marketMid: 18.756448,
    bankMid: 18.675,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28935,
    foreignAtMarketMid: 30845,
    foreignAtBankMid: 31854,
    diffForeign: 1910,
    diffTWD: 1858,
    diffPct: 6.6,
    cashSell: 1.0368,
    marketMid: 0.97259,
    bankMid: 0.9418,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51840,
    foreignAtMarketMid: 58497,
    foreignAtBankMid: 58514,
    diffForeign: 6657,
    diffTWD: 3414,
    diffPct: 12.8,
    cashSell: 0.5787,
    marketMid: 0.512848,
    bankMid: 0.5127,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16655480,
    foreignAtBankMid: 16853933,
    diffForeign: 2570973,
    diffTWD: 4631,
    diffPct: 18.3,
    cashSell: 0.00213,
    marketMid: 0.001801,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3518,
    foreignAtMarketMid: 3747,
    foreignAtBankMid: 3863,
    diffForeign: 229,
    diffTWD: 1837,
    diffPct: 6.5,
    cashSell: 8.528,
    marketMid: 8.005828,
    bankMid: 7.7655,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24930006,
    foreignAtBankMid: 25531915,
    diffForeign: 3190876,
    diffTWD: 3840,
    diffPct: 14.7,
    cashSell: 0.00138,
    marketMid: 0.001203,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/13 13:36:09';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-13';
