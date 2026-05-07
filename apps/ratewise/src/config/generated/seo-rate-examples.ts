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
 * 匯率時間：2026/05/07 12:00:10
 * 生成日期：2026-05-07
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
    foreignAtCash: 949,
    foreignAtMarketMid: 955,
    foreignAtBankMid: 959,
    diffForeign: 6,
    diffTWD: 199,
    diffPct: 0.7,
    cashSell: 31.625,
    marketMid: 31.414928,
    bankMid: 31.29,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146987,
    foreignAtMarketMid: 149355,
    foreignAtBankMid: 151745,
    diffForeign: 2368,
    diffTWD: 476,
    diffPct: 1.6,
    cashSell: 0.2041,
    marketMid: 0.200864,
    bankMid: 0.1977,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 803,
    foreignAtMarketMid: 813,
    foreignAtBankMid: 817,
    diffForeign: 10,
    diffTWD: 375,
    diffPct: 1.3,
    cashSell: 37.37,
    marketMid: 36.903092,
    bankMid: 36.7,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 702,
    foreignAtBankMid: 706,
    diffForeign: 13,
    diffTWD: 587,
    diffPct: 2,
    cashSell: 43.56,
    marketMid: 42.707666,
    bankMid: 42.5,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6420,
    foreignAtMarketMid: 6501,
    foreignAtBankMid: 6533,
    diffForeign: 81,
    diffTWD: 374,
    diffPct: 1.3,
    cashSell: 4.673,
    marketMid: 4.614675,
    bankMid: 4.592,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1264223,
    foreignAtMarketMid: 1382251,
    foreignAtBankMid: 1377410,
    diffForeign: 118028,
    diffTWD: 2562,
    diffPct: 9.3,
    cashSell: 0.02373,
    marketMid: 0.021704,
    bankMid: 0.02178,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 44.85,
        rateBuy: 45.1,
        rateInverse: 0.022297,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-07',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7406,
    foreignAtMarketMid: 7485,
    foreignAtBankMid: 7597,
    diffForeign: 79,
    diffTWD: 319,
    diffPct: 1.1,
    cashSell: 4.051,
    marketMid: 4.007904,
    bankMid: 3.949,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1299,
    foreignAtMarketMid: 1320,
    foreignAtBankMid: 1321,
    diffForeign: 21,
    diffTWD: 481,
    diffPct: 1.6,
    cashSell: 23.1,
    marketMid: 22.729339,
    bankMid: 22.71,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1282,
    foreignAtMarketMid: 1301,
    foreignAtBankMid: 1307,
    diffForeign: 19,
    diffTWD: 459,
    diffPct: 1.6,
    cashSell: 23.41,
    marketMid: 23.051566,
    bankMid: 22.955,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1197,
    foreignAtMarketMid: 1212,
    foreignAtBankMid: 1219,
    diffForeign: 15,
    diffTWD: 376,
    diffPct: 1.3,
    cashSell: 25.07,
    marketMid: 24.756152,
    bankMid: 24.615,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 738,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 749,
    diffForeign: 6,
    diffTWD: 244,
    diffPct: 0.8,
    cashSell: 40.63,
    marketMid: 40.299831,
    bankMid: 40.03,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1574,
    foreignAtMarketMid: 1604,
    foreignAtBankMid: 1610,
    diffForeign: 30,
    diffTWD: 557,
    diffPct: 1.9,
    cashSell: 19.06,
    marketMid: 18.705924,
    bankMid: 18.635,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29095,
    foreignAtMarketMid: 30797,
    foreignAtBankMid: 32048,
    diffForeign: 1702,
    diffTWD: 1658,
    diffPct: 5.8,
    cashSell: 1.0311,
    marketMid: 0.974119,
    bankMid: 0.9361,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51529,
    foreignAtMarketMid: 58019,
    foreignAtBankMid: 58117,
    diffForeign: 6490,
    diffTWD: 3356,
    diffPct: 12.6,
    cashSell: 0.5822,
    marketMid: 0.517072,
    bankMid: 0.5162,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16577959,
    foreignAtBankMid: 16853933,
    diffForeign: 2493452,
    diffTWD: 4512,
    diffPct: 17.7,
    cashSell: 0.00213,
    marketMid: 0.00181,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3522,
    foreignAtMarketMid: 3754,
    foreignAtBankMid: 3868,
    diffForeign: 232,
    diffTWD: 1853,
    diffPct: 6.6,
    cashSell: 8.518,
    marketMid: 7.992008,
    bankMid: 7.7555,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 25038556,
    foreignAtBankMid: 25531915,
    diffForeign: 3299426,
    diffTWD: 3953,
    diffPct: 15.2,
    cashSell: 0.00138,
    marketMid: 0.001198,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/07 12:00:10';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-07';
