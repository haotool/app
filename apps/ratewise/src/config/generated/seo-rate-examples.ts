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
 * 匯率時間：2026/04/02 11:23:50
 * 生成日期：2026-04-02
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
    foreignAtCash: 931,
    foreignAtMarketMid: 937,
    foreignAtBankMid: 940,
    diffForeign: 6,
    diffTWD: 189,
    diffPct: 0.6,
    cashSell: 32.235,
    marketMid: 32.031776,
    bankMid: 31.9,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146987,
    foreignAtMarketMid: 148800,
    foreignAtBankMid: 151745,
    diffForeign: 1813,
    diffTWD: 366,
    diffPct: 1.2,
    cashSell: 0.2041,
    marketMid: 0.201613,
    bankMid: 0.1977,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 801,
    foreignAtMarketMid: 809,
    foreignAtBankMid: 816,
    diffForeign: 8,
    diffTWD: 269,
    diffPct: 0.9,
    cashSell: 37.43,
    marketMid: 37.09474,
    bankMid: 36.76,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 694,
    foreignAtMarketMid: 705,
    foreignAtBankMid: 711,
    diffForeign: 11,
    diffTWD: 476,
    diffPct: 1.6,
    cashSell: 43.25,
    marketMid: 42.564059,
    bankMid: 42.19,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6375,
    foreignAtMarketMid: 6480,
    foreignAtBankMid: 6486,
    diffForeign: 105,
    diffTWD: 487,
    diffPct: 1.6,
    cashSell: 4.706,
    marketMid: 4.62963,
    bankMid: 4.625,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1294778,
    foreignAtMarketMid: 1417279,
    foreignAtBankMid: 1413761,
    diffForeign: 122501,
    diffTWD: 2593,
    diffPct: 9.5,
    cashSell: 0.02317,
    marketMid: 0.021167,
    bankMid: 0.02122,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 46.6,
        rateBuy: 47,
        rateInverse: 0.021459,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-02',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7269,
    foreignAtMarketMid: 7349,
    foreignAtBankMid: 7453,
    diffForeign: 80,
    diffTWD: 327,
    diffPct: 1.1,
    cashSell: 4.127,
    marketMid: 4.082016,
    bankMid: 4.025,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1339,
    foreignAtMarketMid: 1351,
    foreignAtBankMid: 1363,
    diffForeign: 12,
    diffTWD: 269,
    diffPct: 0.9,
    cashSell: 22.4,
    marketMid: 22.199037,
    bankMid: 22.01,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1282,
    foreignAtMarketMid: 1304,
    foreignAtBankMid: 1307,
    diffForeign: 22,
    diffTWD: 520,
    diffPct: 1.8,
    cashSell: 23.41,
    marketMid: 23.003842,
    bankMid: 22.955,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1192,
    foreignAtMarketMid: 1203,
    foreignAtBankMid: 1214,
    diffForeign: 11,
    diffTWD: 284,
    diffPct: 1,
    cashSell: 25.17,
    marketMid: 24.93206,
    bankMid: 24.715,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 741,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 753,
    diffForeign: 3,
    diffTWD: 112,
    diffPct: 0.4,
    cashSell: 40.46,
    marketMid: 40.309578,
    bankMid: 39.86,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1609,
    foreignAtMarketMid: 1627,
    foreignAtBankMid: 1646,
    diffForeign: 18,
    diffTWD: 345,
    diffPct: 1.2,
    cashSell: 18.65,
    marketMid: 18.435219,
    bankMid: 18.225,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28879,
    foreignAtMarketMid: 30581,
    foreignAtBankMid: 31786,
    diffForeign: 1702,
    diffTWD: 1669,
    diffPct: 5.9,
    cashSell: 1.0388,
    marketMid: 0.981017,
    bankMid: 0.9438,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50573,
    foreignAtMarketMid: 56396,
    foreignAtBankMid: 56904,
    diffForeign: 5823,
    diffTWD: 3097,
    diffPct: 11.5,
    cashSell: 0.5932,
    marketMid: 0.531956,
    bankMid: 0.5272,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13452915,
    foreignAtMarketMid: 15872871,
    foreignAtBankMid: 15957447,
    diffForeign: 2419956,
    diffTWD: 4574,
    diffPct: 18,
    cashSell: 0.00223,
    marketMid: 0.00189,
    bankMid: 0.00188,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3557,
    foreignAtMarketMid: 3789,
    foreignAtBankMid: 3911,
    diffForeign: 232,
    diffTWD: 1832,
    diffPct: 6.5,
    cashSell: 8.433,
    marketMid: 7.917907,
    bankMid: 7.6705,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24640785,
    foreignAtBankMid: 25104603,
    diffForeign: 3212214,
    diffTWD: 3911,
    diffPct: 15,
    cashSell: 0.0014,
    marketMid: 0.001217,
    bankMid: 0.001195,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/02 11:23:50';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-02';
