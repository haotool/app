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
 * 匯率時間：2026/09/30 10:24:05
 * 生成日期：2026-09-30
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
    foreignAtCash: 933,
    foreignAtMarketMid: 942,
    foreignAtBankMid: 943,
    diffForeign: 9,
    diffTWD: 288,
    diffPct: 1,
    cashSell: 32.15,
    cashBuy: 31.48,
    marketMid: 31.841049,
    bankMid: 31.815,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 144718,
    foreignAtMarketMid: 148320,
    foreignAtBankMid: 149328,
    diffForeign: 3602,
    diffTWD: 729,
    diffPct: 2.5,
    cashSell: 0.2073,
    cashBuy: 0.1945,
    marketMid: 0.202266,
    bankMid: 0.2009,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 818,
    foreignAtMarketMid: 831,
    foreignAtBankMid: 833,
    diffForeign: 13,
    diffTWD: 458,
    diffPct: 1.6,
    cashSell: 36.67,
    cashBuy: 35.33,
    marketMid: 36.110208,
    bankMid: 36,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 696,
    foreignAtMarketMid: 712,
    foreignAtBankMid: 714,
    diffForeign: 16,
    diffTWD: 674,
    diffPct: 2.3,
    cashSell: 43.1,
    cashBuy: 40.98,
    marketMid: 42.131873,
    bankMid: 42.04,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6225,
    foreignAtMarketMid: 6330,
    foreignAtBankMid: 6332,
    diffForeign: 105,
    diffTWD: 496,
    diffPct: 1.7,
    cashSell: 4.819,
    cashBuy: 4.657,
    marketMid: 4.739336,
    bankMid: 4.738,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1167770,
    foreignAtMarketMid: 1275742,
    foreignAtBankMid: 1263690,
    diffForeign: 107972,
    diffTWD: 2539,
    diffPct: 9.2,
    cashSell: 0.02569,
    cashBuy: 0.02179,
    marketMid: 0.023516,
    bankMid: 0.02374,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.5,
        rateBuy: 41.8,
        rateInverse: 0.024096,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-09-30',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7297,
    foreignAtMarketMid: 7396,
    foreignAtBankMid: 7483,
    diffForeign: 99,
    diffTWD: 398,
    diffPct: 1.3,
    cashSell: 4.111,
    cashBuy: 3.907,
    marketMid: 4.056417,
    bankMid: 4.009,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1329,
    foreignAtMarketMid: 1348,
    foreignAtBankMid: 1352,
    diffForeign: 19,
    diffTWD: 436,
    diffPct: 1.5,
    cashSell: 22.58,
    cashBuy: 21.8,
    marketMid: 22.251891,
    bankMid: 22.19,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1312,
    foreignAtMarketMid: 1337,
    foreignAtBankMid: 1338,
    diffForeign: 25,
    diffTWD: 565,
    diffPct: 1.9,
    cashSell: 22.87,
    cashBuy: 21.96,
    marketMid: 22.439637,
    bankMid: 22.415,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1186,
    foreignAtMarketMid: 1204,
    foreignAtBankMid: 1208,
    diffForeign: 18,
    diffTWD: 454,
    diffPct: 1.5,
    cashSell: 25.29,
    cashBuy: 24.38,
    marketMid: 24.907221,
    bankMid: 24.835,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 777,
    foreignAtMarketMid: 786,
    foreignAtBankMid: 789,
    diffForeign: 9,
    diffTWD: 347,
    diffPct: 1.2,
    cashSell: 38.62,
    cashBuy: 37.42,
    marketMid: 38.173767,
    bankMid: 38.02,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1634,
    foreignAtMarketMid: 1670,
    foreignAtBankMid: 1673,
    diffForeign: 36,
    diffTWD: 648,
    diffPct: 2.2,
    cashSell: 18.36,
    cashBuy: 17.51,
    marketMid: 17.963319,
    bankMid: 17.935,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29627,
    foreignAtMarketMid: 31631,
    foreignAtBankMid: 32694,
    diffForeign: 2004,
    diffTWD: 1901,
    diffPct: 6.8,
    cashSell: 1.0126,
    cashBuy: 0.8226,
    marketMid: 0.948426,
    bankMid: 0.9176,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52138,
    foreignAtMarketMid: 58987,
    foreignAtBankMid: 58893,
    diffForeign: 6849,
    diffTWD: 3483,
    diffPct: 13.1,
    cashSell: 0.5754,
    cashBuy: 0.4434,
    marketMid: 0.508589,
    bankMid: 0.5094,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16918220,
    foreignAtBankMid: 16853933,
    diffForeign: 2833713,
    diffTWD: 5025,
    diffPct: 20.1,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001773,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3608,
    foreignAtMarketMid: 3847,
    foreignAtBankMid: 3972,
    diffForeign: 239,
    diffTWD: 1870,
    diffPct: 6.6,
    cashSell: 8.316,
    cashBuy: 6.791,
    marketMid: 7.797636,
    bankMid: 7.5535,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21126761,
    foreignAtMarketMid: 24430384,
    foreignAtBankMid: 24691358,
    diffForeign: 3303623,
    diffTWD: 4057,
    diffPct: 15.6,
    cashSell: 0.00142,
    cashBuy: 0.00101,
    marketMid: 0.001228,
    bankMid: 0.001215,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/09/30 10:24:05';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-09-30';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-09-30';
