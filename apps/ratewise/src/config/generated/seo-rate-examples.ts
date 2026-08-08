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
 * 匯率時間：2026/08/08 04:08:20
 * 生成日期：2026-08-08
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
    foreignAtCash: 921,
    foreignAtMarketMid: 932,
    foreignAtBankMid: 931,
    diffForeign: 11,
    diffTWD: 337,
    diffPct: 1.1,
    cashSell: 32.56,
    marketMid: 32.194714,
    bankMid: 32.225,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 143816,
    foreignAtMarketMid: 146687,
    foreignAtBankMid: 148368,
    diffForeign: 2871,
    diffTWD: 587,
    diffPct: 2,
    cashSell: 0.2086,
    marketMid: 0.204517,
    bankMid: 0.2022,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 792,
    foreignAtMarketMid: 805,
    foreignAtBankMid: 806,
    diffForeign: 13,
    diffTWD: 470,
    diffPct: 1.6,
    cashSell: 37.87,
    marketMid: 37.277268,
    bankMid: 37.2,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 674,
    foreignAtMarketMid: 690,
    foreignAtBankMid: 690,
    diffForeign: 16,
    diffTWD: 691,
    diffPct: 2.4,
    cashSell: 44.53,
    marketMid: 43.504742,
    bankMid: 43.47,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6177,
    foreignAtMarketMid: 6288,
    foreignAtBankMid: 6281,
    diffForeign: 111,
    diffTWD: 531,
    diffPct: 1.8,
    cashSell: 4.857,
    marketMid: 4.770992,
    bankMid: 4.776,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1194743,
    foreignAtMarketMid: 1312819,
    foreignAtBankMid: 1295337,
    diffForeign: 118076,
    diffTWD: 2698,
    diffPct: 9.9,
    cashSell: 0.02511,
    marketMid: 0.022852,
    bankMid: 0.02316,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 42.4,
        rateBuy: 42.8,
        rateInverse: 0.023585,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-08',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7203,
    foreignAtMarketMid: 7298,
    foreignAtBankMid: 7384,
    diffForeign: 95,
    diffTWD: 390,
    diffPct: 1.3,
    cashSell: 4.165,
    marketMid: 4.110794,
    bankMid: 4.063,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1320,
    foreignAtBankMid: 1313,
    diffForeign: 29,
    diffTWD: 648,
    diffPct: 2.2,
    cashSell: 23.23,
    marketMid: 22.728306,
    bankMid: 22.84,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1272,
    foreignAtMarketMid: 1297,
    foreignAtBankMid: 1297,
    diffForeign: 25,
    diffTWD: 593,
    diffPct: 2,
    cashSell: 23.59,
    marketMid: 23.124061,
    bankMid: 23.135,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1172,
    foreignAtMarketMid: 1189,
    foreignAtBankMid: 1194,
    diffForeign: 17,
    diffTWD: 431,
    diffPct: 1.5,
    cashSell: 25.59,
    marketMid: 25.222589,
    bankMid: 25.135,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 743,
    foreignAtMarketMid: 752,
    foreignAtBankMid: 754,
    diffForeign: 9,
    diffTWD: 353,
    diffPct: 1.2,
    cashSell: 40.39,
    marketMid: 39.915379,
    bankMid: 39.79,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1546,
    foreignAtMarketMid: 1583,
    foreignAtBankMid: 1580,
    diffForeign: 37,
    diffTWD: 705,
    diffPct: 2.4,
    cashSell: 19.41,
    marketMid: 18.954112,
    bankMid: 18.985,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28788,
    foreignAtMarketMid: 30673,
    foreignAtBankMid: 31676,
    diffForeign: 1885,
    diffTWD: 1844,
    diffPct: 6.5,
    cashSell: 1.0421,
    marketMid: 0.978058,
    bankMid: 0.9471,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50243,
    foreignAtMarketMid: 56729,
    foreignAtBankMid: 56487,
    diffForeign: 6486,
    diffTWD: 3430,
    diffPct: 12.9,
    cashSell: 0.5971,
    marketMid: 0.528829,
    bankMid: 0.5311,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 16635709,
    foreignAtBankMid: 16393443,
    diffForeign: 2874241,
    diffTWD: 5183,
    diffPct: 20.9,
    cashSell: 0.00218,
    marketMid: 0.001803,
    bankMid: 0.00183,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3574,
    foreignAtMarketMid: 3806,
    foreignAtBankMid: 3931,
    diffForeign: 232,
    diffTWD: 1830,
    diffPct: 6.5,
    cashSell: 8.395,
    marketMid: 7.88283,
    bankMid: 7.6325,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24320660,
    foreignAtBankMid: 25104603,
    diffForeign: 2892089,
    diffTWD: 3567,
    diffPct: 13.5,
    cashSell: 0.0014,
    marketMid: 0.001234,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/08 04:08:20';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-08';
