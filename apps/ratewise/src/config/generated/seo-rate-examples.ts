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
 * 匯率時間：2026/09/16 13:08:21
 * 生成日期：2026-09-16
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
    foreignAtCash: 936,
    foreignAtMarketMid: 942,
    foreignAtBankMid: 945,
    diffForeign: 6,
    diffTWD: 210,
    diffPct: 0.7,
    cashSell: 32.065,
    marketMid: 31.840036,
    bankMid: 31.73,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144023,
    foreignAtMarketMid: 146194,
    foreignAtBankMid: 148588,
    diffForeign: 2171,
    diffTWD: 445,
    diffPct: 1.5,
    cashSell: 0.2083,
    marketMid: 0.205207,
    bankMid: 0.2019,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 806,
    foreignAtMarketMid: 817,
    foreignAtBankMid: 821,
    diffForeign: 11,
    diffTWD: 425,
    diffPct: 1.4,
    cashSell: 37.23,
    marketMid: 36.702635,
    bankMid: 36.56,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 685,
    foreignAtMarketMid: 699,
    foreignAtBankMid: 702,
    diffForeign: 14,
    diffTWD: 616,
    diffPct: 2.1,
    cashSell: 43.8,
    marketMid: 42.900043,
    bankMid: 42.74,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6246,
    foreignAtMarketMid: 6348,
    foreignAtBankMid: 6353,
    diffForeign: 102,
    diffTWD: 482,
    diffPct: 1.6,
    cashSell: 4.803,
    marketMid: 4.725898,
    bankMid: 4.722,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1178319,
    foreignAtMarketMid: 1281595,
    foreignAtBankMid: 1276053,
    diffForeign: 103276,
    diffTWD: 2418,
    diffPct: 8.8,
    cashSell: 0.02546,
    marketMid: 0.023408,
    bankMid: 0.02351,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.05,
        rateBuy: 42.2,
        rateInverse: 0.023781,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-16',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7315,
    foreignAtMarketMid: 7393,
    foreignAtBankMid: 7502,
    diffForeign: 78,
    diffTWD: 316,
    diffPct: 1.1,
    cashSell: 4.101,
    marketMid: 4.05775,
    bankMid: 3.999,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1302,
    foreignAtMarketMid: 1321,
    foreignAtBankMid: 1324,
    diffForeign: 19,
    diffTWD: 434,
    diffPct: 1.5,
    cashSell: 23.05,
    marketMid: 22.716431,
    bankMid: 22.66,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1312,
    foreignAtBankMid: 1317,
    diffForeign: 21,
    diffTWD: 482,
    diffPct: 1.6,
    cashSell: 23.24,
    marketMid: 22.866551,
    bankMid: 22.785,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1185,
    foreignAtMarketMid: 1199,
    foreignAtBankMid: 1207,
    diffForeign: 14,
    diffTWD: 355,
    diffPct: 1.2,
    cashSell: 25.31,
    marketMid: 25.01063,
    bankMid: 24.855,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 765,
    foreignAtMarketMid: 772,
    foreignAtBankMid: 777,
    diffForeign: 7,
    diffTWD: 262,
    diffPct: 0.9,
    cashSell: 39.22,
    marketMid: 38.877226,
    bankMid: 38.62,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1609,
    foreignAtMarketMid: 1635,
    foreignAtBankMid: 1647,
    diffForeign: 26,
    diffTWD: 472,
    diffPct: 1.6,
    cashSell: 18.64,
    marketMid: 18.346604,
    bankMid: 18.215,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29496,
    foreignAtMarketMid: 31377,
    foreignAtBankMid: 32534,
    diffForeign: 1881,
    diffTWD: 1799,
    diffPct: 6.4,
    cashSell: 1.0171,
    marketMid: 0.956111,
    bankMid: 0.9221,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52383,
    foreignAtMarketMid: 59163,
    foreignAtBankMid: 59207,
    diffForeign: 6780,
    diffTWD: 3438,
    diffPct: 12.9,
    cashSell: 0.5727,
    marketMid: 0.507077,
    bankMid: 0.5067,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16641552,
    foreignAtBankMid: 16853933,
    diffForeign: 2557045,
    diffTWD: 4610,
    diffPct: 18.2,
    cashSell: 0.00213,
    marketMid: 0.001803,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3624,
    foreignAtMarketMid: 3851,
    foreignAtBankMid: 3991,
    diffForeign: 227,
    diffTWD: 1771,
    diffPct: 6.3,
    cashSell: 8.279,
    marketMid: 7.790286,
    bankMid: 7.5165,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24415057,
    foreignAtBankMid: 24896266,
    diffForeign: 3138461,
    diffTWD: 3856,
    diffPct: 14.8,
    cashSell: 0.00141,
    marketMid: 0.001229,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/16 13:08:21';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-16';
