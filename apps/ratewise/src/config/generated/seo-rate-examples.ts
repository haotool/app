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
 * 匯率時間：2026/10/06 14:37:59
 * 生成日期：2026-10-06
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
    foreignAtCash: 936,
    foreignAtMarketMid: 943,
    foreignAtBankMid: 945,
    diffForeign: 7,
    diffTWD: 250,
    diffPct: 0.8,
    cashSell: 32.065,
    cashBuy: 31.395,
    marketMid: 31.797513,
    bankMid: 31.73,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 146699,
    foreignAtMarketMid: 149278,
    foreignAtBankMid: 151439,
    diffForeign: 2579,
    diffTWD: 518,
    diffPct: 1.8,
    cashSell: 0.2045,
    cashBuy: 0.1917,
    marketMid: 0.200968,
    bankMid: 0.1981,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 830,
    foreignAtMarketMid: 843,
    foreignAtBankMid: 845,
    diffForeign: 13,
    diffTWD: 470,
    diffPct: 1.6,
    cashSell: 36.16,
    cashBuy: 34.82,
    marketMid: 35.593522,
    bankMid: 35.49,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 699,
    foreignAtMarketMid: 715,
    foreignAtBankMid: 717,
    diffForeign: 16,
    diffTWD: 663,
    diffPct: 2.3,
    cashSell: 42.92,
    cashBuy: 40.8,
    marketMid: 41.970956,
    bankMid: 41.86,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6242,
    foreignAtMarketMid: 6315,
    foreignAtBankMid: 6349,
    diffForeign: 73,
    diffTWD: 346,
    diffPct: 1.2,
    cashSell: 4.806,
    cashBuy: 4.644,
    marketMid: 4.750594,
    bankMid: 4.725,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1161440,
    foreignAtMarketMid: 1267127,
    foreignAtBankMid: 1256281,
    diffForeign: 105687,
    diffTWD: 2502,
    diffPct: 9.1,
    cashSell: 0.02583,
    cashBuy: 0.02193,
    marketMid: 0.023676,
    bankMid: 0.02388,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 41.2,
        rateBuy: 41.8,
        rateInverse: 0.024272,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-10-06',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7319,
    foreignAtMarketMid: 7411,
    foreignAtBankMid: 7506,
    diffForeign: 92,
    diffTWD: 374,
    diffPct: 1.3,
    cashSell: 4.099,
    cashBuy: 3.895,
    marketMid: 4.047862,
    bankMid: 3.997,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1332,
    foreignAtMarketMid: 1355,
    foreignAtBankMid: 1355,
    diffForeign: 23,
    diffTWD: 526,
    diffPct: 1.8,
    cashSell: 22.53,
    cashBuy: 21.75,
    marketMid: 22.135157,
    bankMid: 22.14,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1323,
    foreignAtMarketMid: 1347,
    foreignAtBankMid: 1350,
    diffForeign: 24,
    diffTWD: 537,
    diffPct: 1.8,
    cashSell: 22.68,
    cashBuy: 21.77,
    marketMid: 22.273699,
    bankMid: 22.225,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1191,
    foreignAtMarketMid: 1209,
    foreignAtBankMid: 1213,
    diffForeign: 18,
    diffTWD: 438,
    diffPct: 1.5,
    cashSell: 25.18,
    cashBuy: 24.27,
    marketMid: 24.812664,
    bankMid: 24.725,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 777,
    foreignAtMarketMid: 785,
    foreignAtBankMid: 789,
    diffForeign: 8,
    diffTWD: 311,
    diffPct: 1,
    cashSell: 38.61,
    cashBuy: 37.41,
    marketMid: 38.210233,
    bankMid: 38.01,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1653,
    foreignAtMarketMid: 1687,
    foreignAtBankMid: 1693,
    diffForeign: 34,
    diffTWD: 602,
    diffPct: 2,
    cashSell: 18.15,
    cashBuy: 17.3,
    marketMid: 17.785683,
    bankMid: 17.725,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29860,
    foreignAtMarketMid: 31825,
    foreignAtBankMid: 32978,
    diffForeign: 1965,
    diffTWD: 1853,
    diffPct: 6.6,
    cashSell: 1.0047,
    cashBuy: 0.8147,
    marketMid: 0.942651,
    bankMid: 0.9097,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 52429,
    foreignAtMarketMid: 59105,
    foreignAtBankMid: 59265,
    diffForeign: 6676,
    diffTWD: 3389,
    diffPct: 12.7,
    cashSell: 0.5722,
    cashBuy: 0.4402,
    marketMid: 0.507568,
    bankMid: 0.5062,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16875004,
    foreignAtBankMid: 16853933,
    diffForeign: 2790497,
    diffTWD: 4961,
    diffPct: 19.8,
    cashSell: 0.00213,
    cashBuy: 0.00143,
    marketMid: 0.001778,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3623,
    foreignAtMarketMid: 3861,
    foreignAtBankMid: 3990,
    diffForeign: 238,
    diffTWD: 1851,
    diffPct: 6.6,
    cashSell: 8.281,
    cashBuy: 6.756,
    marketMid: 7.770008,
    bankMid: 7.5185,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24510113,
    foreignAtBankMid: 24896266,
    diffForeign: 3233517,
    diffTWD: 3958,
    diffPct: 15.2,
    cashSell: 0.00141,
    cashBuy: 0.001,
    marketMid: 0.001224,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/10/06 14:37:59';

export const SEO_RATE_EXAMPLES_BOARD_DATE: string | null = '2026-10-06';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-10-06';
