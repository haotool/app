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
 * 匯率時間：2026/11/04 15:18:28
 * 生成日期：2026-11-04
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
  /** 台灣銀行現金買入匯率（未提供時省略） */
  cashBuy?: number;
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
    foreignAtCash: 906,
    foreignAtMarketMid: 915,
    foreignAtBankMid: 915,
    diffForeign: 9,
    diffTWD: 316,
    diffPct: 1.1,
    cashSell: 33.12,
    cashBuy: 32.45,
    marketMid: 32.770768,
    bankMid: 32.785,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 141978,
    foreignAtMarketMid: 144934,
    foreignAtBankMid: 146413,
    diffForeign: 2956,
    diffTWD: 612,
    diffPct: 2.1,
    cashSell: 0.2113,
    cashBuy: 0.1985,
    marketMid: 0.20699,
    bankMid: 0.2049,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 802,
    foreignAtMarketMid: 817,
    foreignAtBankMid: 817,
    diffForeign: 15,
    diffTWD: 562,
    diffPct: 1.9,
    cashSell: 37.4,
    cashBuy: 36.06,
    marketMid: 36.699941,
    bankMid: 36.73,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 665,
    foreignAtMarketMid: 682,
    foreignAtBankMid: 681,
    diffForeign: 17,
    diffTWD: 759,
    diffPct: 2.6,
    cashSell: 45.14,
    cashBuy: 43.02,
    marketMid: 43.998592,
    bankMid: 44.08,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6018,
    foreignAtMarketMid: 6114,
    foreignAtBankMid: 6117,
    diffForeign: 96,
    diffTWD: 471,
    diffPct: 1.6,
    cashSell: 4.985,
    cashBuy: 4.823,
    marketMid: 4.906771,
    bankMid: 4.904,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1126126,
    foreignAtMarketMid: 1229725,
    foreignAtBankMid: 1215067,
    diffForeign: 103599,
    diffTWD: 2527,
    diffPct: 9.2,
    cashSell: 0.02664,
    cashBuy: 0.02274,
    marketMid: 0.024396,
    bankMid: 0.02469,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 40.6,
        rateBuy: 41,
        rateInverse: 0.024631,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-11-04',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7085,
    foreignAtMarketMid: 7180,
    foreignAtBankMid: 7260,
    diffForeign: 95,
    diffTWD: 393,
    diffPct: 1.3,
    cashSell: 4.234,
    cashBuy: 4.03,
    marketMid: 4.178523,
    bankMid: 4.132,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1286,
    foreignAtMarketMid: 1313,
    foreignAtBankMid: 1308,
    diffForeign: 27,
    diffTWD: 614,
    diffPct: 2.1,
    cashSell: 23.33,
    cashBuy: 22.55,
    marketMid: 22.852442,
    bankMid: 22.94,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1254,
    foreignAtMarketMid: 1281,
    foreignAtBankMid: 1278,
    diffForeign: 27,
    diffTWD: 621,
    diffPct: 2.1,
    cashSell: 23.92,
    cashBuy: 23.01,
    marketMid: 23.425238,
    bankMid: 23.465,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1153,
    foreignAtMarketMid: 1172,
    foreignAtBankMid: 1174,
    diffForeign: 19,
    diffTWD: 476,
    diffPct: 1.6,
    cashSell: 26.01,
    cashBuy: 25.1,
    marketMid: 25.597706,
    bankMid: 25.555,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 739,
    foreignAtMarketMid: 750,
    foreignAtBankMid: 751,
    diffForeign: 11,
    diffTWD: 431,
    diffPct: 1.5,
    cashSell: 40.57,
    cashBuy: 39.37,
    marketMid: 39.987204,
    bankMid: 39.97,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1596,
    foreignAtMarketMid: 1635,
    foreignAtBankMid: 1633,
    diffForeign: 39,
    diffTWD: 712,
    diffPct: 2.4,
    cashSell: 18.8,
    cashBuy: 17.95,
    marketMid: 18.353675,
    bankMid: 18.375,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28935,
    foreignAtMarketMid: 30889,
    foreignAtBankMid: 31854,
    diffForeign: 1954,
    diffTWD: 1898,
    diffPct: 6.8,
    cashSell: 1.0368,
    cashBuy: 0.8468,
    marketMid: 0.971205,
    bankMid: 0.9418,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51423,
    foreignAtMarketMid: 58166,
    foreignAtBankMid: 57982,
    diffForeign: 6743,
    diffTWD: 3478,
    diffPct: 13.1,
    cashSell: 0.5834,
    cashBuy: 0.4514,
    marketMid: 0.515761,
    bankMid: 0.5174,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16608289,
    foreignAtBankMid: 16853933,
    diffForeign: 2523782,
    diffTWD: 4559,
    diffPct: 17.9,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001806,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3498,
    foreignAtMarketMid: 3732,
    foreignAtBankMid: 3839,
    diffForeign: 234,
    diffTWD: 1883,
    diffPct: 6.7,
    cashSell: 8.577,
    cashBuy: 7.052,
    marketMid: 8.038585,
    bankMid: 7.8145,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 20547945,
    foreignAtMarketMid: 23539098,
    foreignAtBankMid: 23904382,
    diffForeign: 2991153,
    diffTWD: 3812,
    diffPct: 14.6,
    cashSell: 0.00146,
    cashBuy: 0.00105,
    marketMid: 0.001274,
    bankMid: 0.001255,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/11/04 15:18:28';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-11-04';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-11-04';
