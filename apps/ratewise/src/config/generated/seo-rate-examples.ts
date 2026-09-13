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
 * 匯率時間：2026/09/13 06:35:16
 * 生成日期：2026-09-13
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
    foreignAtCash: 940,
    foreignAtMarketMid: 950,
    foreignAtBankMid: 950,
    diffForeign: 10,
    diffTWD: 317,
    diffPct: 1.1,
    cashSell: 31.91,
    marketMid: 31.572633,
    bankMid: 31.575,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143062,
    foreignAtMarketMid: 145807,
    foreignAtBankMid: 147565,
    diffForeign: 2745,
    diffTWD: 565,
    diffPct: 1.9,
    cashSell: 0.2097,
    marketMid: 0.205751,
    bankMid: 0.2033,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 806,
    foreignAtMarketMid: 818,
    foreignAtBankMid: 820,
    diffForeign: 12,
    diffTWD: 457,
    diffPct: 1.5,
    cashSell: 37.24,
    marketMid: 36.673023,
    bankMid: 36.57,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 686,
    foreignAtMarketMid: 702,
    foreignAtBankMid: 703,
    diffForeign: 16,
    diffTWD: 677,
    diffPct: 2.3,
    cashSell: 43.71,
    marketMid: 42.724088,
    bankMid: 42.65,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6272,
    foreignAtMarketMid: 6369,
    foreignAtBankMid: 6380,
    diffForeign: 97,
    diffTWD: 456,
    diffPct: 1.5,
    cashSell: 4.783,
    marketMid: 4.710316,
    bankMid: 4.702,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1165049,
    foreignAtMarketMid: 1274724,
    foreignAtBankMid: 1260504,
    diffForeign: 109675,
    diffTWD: 2581,
    diffPct: 9.4,
    cashSell: 0.02575,
    marketMid: 0.023535,
    bankMid: 0.0238,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.7,
        rateBuy: 42,
        rateInverse: 0.023981,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-13',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7348,
    foreignAtMarketMid: 7449,
    foreignAtBankMid: 7536,
    diffForeign: 101,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 4.083,
    marketMid: 4.027548,
    bankMid: 3.981,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1300,
    foreignAtMarketMid: 1324,
    foreignAtBankMid: 1322,
    diffForeign: 24,
    diffTWD: 540,
    diffPct: 1.8,
    cashSell: 23.08,
    marketMid: 22.664944,
    bankMid: 22.69,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1315,
    foreignAtBankMid: 1317,
    diffForeign: 24,
    diffTWD: 545,
    diffPct: 1.8,
    cashSell: 23.23,
    marketMid: 22.808138,
    bankMid: 22.775,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1186,
    foreignAtMarketMid: 1202,
    foreignAtBankMid: 1207,
    diffForeign: 16,
    diffTWD: 399,
    diffPct: 1.3,
    cashSell: 25.3,
    marketMid: 24.963802,
    bankMid: 24.845,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 766,
    foreignAtMarketMid: 771,
    foreignAtBankMid: 778,
    diffForeign: 5,
    diffTWD: 173,
    diffPct: 0.6,
    cashSell: 39.15,
    marketMid: 38.924137,
    bankMid: 38.55,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1598,
    foreignAtMarketMid: 1633,
    foreignAtBankMid: 1635,
    diffForeign: 35,
    diffTWD: 632,
    diffPct: 2.2,
    cashSell: 18.77,
    marketMid: 18.374584,
    bankMid: 18.345,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29481,
    foreignAtMarketMid: 31323,
    foreignAtBankMid: 32517,
    diffForeign: 1842,
    diffTWD: 1764,
    diffPct: 6.2,
    cashSell: 1.0176,
    marketMid: 0.957774,
    bankMid: 0.9226,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52521,
    foreignAtMarketMid: 59583,
    foreignAtBankMid: 59382,
    diffForeign: 7062,
    diffTWD: 3556,
    diffPct: 13.4,
    cashSell: 0.5712,
    marketMid: 0.503496,
    bankMid: 0.5052,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14423077,
    foreignAtMarketMid: 16701679,
    foreignAtBankMid: 17341040,
    diffForeign: 2278602,
    diffTWD: 4093,
    diffPct: 15.8,
    cashSell: 0.00208,
    marketMid: 0.001796,
    bankMid: 0.00173,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3626,
    foreignAtMarketMid: 3862,
    foreignAtBankMid: 3994,
    diffForeign: 236,
    diffTWD: 1831,
    diffPct: 6.5,
    cashSell: 8.273,
    marketMid: 7.768016,
    bankMid: 7.5105,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21582734,
    foreignAtMarketMid: 24559108,
    foreignAtBankMid: 25316456,
    diffForeign: 2976374,
    diffTWD: 3636,
    diffPct: 13.8,
    cashSell: 0.00139,
    marketMid: 0.001222,
    bankMid: 0.001185,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/13 06:35:16';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-13';
