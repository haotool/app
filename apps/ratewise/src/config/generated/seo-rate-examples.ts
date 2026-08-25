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
 * 匯率時間：2026/08/25 10:44:27
 * 生成日期：2026-08-25
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
    foreignAtCash: 933,
    foreignAtMarketMid: 943,
    foreignAtBankMid: 943,
    diffForeign: 10,
    diffTWD: 317,
    diffPct: 1.1,
    cashSell: 32.15,
    marketMid: 31.810663,
    bankMid: 31.815,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147275,
    foreignAtMarketMid: 149982,
    foreignAtBankMid: 152053,
    diffForeign: 2707,
    diffTWD: 541,
    diffPct: 1.8,
    cashSell: 0.2037,
    marketMid: 0.200024,
    bankMid: 0.1973,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 796,
    foreignAtMarketMid: 808,
    foreignAtBankMid: 810,
    diffForeign: 12,
    diffTWD: 460,
    diffPct: 1.6,
    cashSell: 37.71,
    marketMid: 37.13193,
    bankMid: 37.04,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 676,
    foreignAtMarketMid: 691,
    foreignAtBankMid: 692,
    diffForeign: 15,
    diffTWD: 672,
    diffPct: 2.3,
    cashSell: 44.39,
    marketMid: 43.395244,
    bankMid: 43.33,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6242,
    foreignAtMarketMid: 6342,
    foreignAtBankMid: 6349,
    diffForeign: 100,
    diffTWD: 472,
    diffPct: 1.6,
    cashSell: 4.806,
    marketMid: 4.730369,
    bankMid: 4.725,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1189061,
    foreignAtMarketMid: 1304095,
    foreignAtBankMid: 1288660,
    diffForeign: 115034,
    diffTWD: 2646,
    diffPct: 9.7,
    cashSell: 0.02523,
    marketMid: 0.023004,
    bankMid: 0.02328,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 43,
        rateBuy: 43.5,
        rateInverse: 0.023256,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-08-25',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7290,
    foreignAtMarketMid: 7387,
    foreignAtBankMid: 7476,
    diffForeign: 97,
    diffTWD: 393,
    diffPct: 1.3,
    cashSell: 4.115,
    marketMid: 4.061128,
    bankMid: 4.013,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1294,
    foreignAtMarketMid: 1318,
    foreignAtBankMid: 1316,
    diffForeign: 24,
    diffTWD: 562,
    diffPct: 1.9,
    cashSell: 23.19,
    marketMid: 22.7552,
    bankMid: 22.8,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1280,
    foreignAtMarketMid: 1304,
    foreignAtBankMid: 1306,
    diffForeign: 24,
    diffTWD: 553,
    diffPct: 1.9,
    cashSell: 23.43,
    marketMid: 22.998022,
    bankMid: 22.975,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1180,
    foreignAtMarketMid: 1197,
    foreignAtBankMid: 1201,
    diffForeign: 17,
    diffTWD: 442,
    diffPct: 1.5,
    cashSell: 25.43,
    marketMid: 25.055121,
    bankMid: 24.975,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 749,
    foreignAtMarketMid: 756,
    foreignAtBankMid: 760,
    diffForeign: 7,
    diffTWD: 297,
    diffPct: 1,
    cashSell: 40.07,
    marketMid: 39.673094,
    bankMid: 39.47,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1548,
    foreignAtMarketMid: 1582,
    foreignAtBankMid: 1583,
    diffForeign: 34,
    diffTWD: 641,
    diffPct: 2.2,
    cashSell: 19.38,
    marketMid: 18.965975,
    bankMid: 18.955,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28983,
    foreignAtMarketMid: 30817,
    foreignAtBankMid: 31911,
    diffForeign: 1834,
    diffTWD: 1785,
    diffPct: 6.3,
    cashSell: 1.0351,
    marketMid: 0.973495,
    bankMid: 0.9401,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51484,
    foreignAtMarketMid: 58262,
    foreignAtBankMid: 58061,
    diffForeign: 6778,
    diffTWD: 3490,
    diffPct: 13.2,
    cashSell: 0.5827,
    marketMid: 0.514915,
    bankMid: 0.5167,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16724376,
    foreignAtBankMid: 16853933,
    diffForeign: 2639869,
    diffTWD: 4735,
    diffPct: 18.7,
    cashSell: 0.00213,
    marketMid: 0.001794,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3581,
    foreignAtMarketMid: 3810,
    foreignAtBankMid: 3940,
    diffForeign: 229,
    diffTWD: 1804,
    diffPct: 6.4,
    cashSell: 8.377,
    marketMid: 7.873334,
    bankMid: 7.6145,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21276596,
    foreignAtMarketMid: 24566036,
    foreignAtBankMid: 24896266,
    diffForeign: 3289440,
    diffTWD: 4017,
    diffPct: 15.5,
    cashSell: 0.00141,
    marketMid: 0.001221,
    bankMid: 0.001205,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/08/25 10:44:27';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-08-25';
