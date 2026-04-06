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
 * 匯率時間：2026/04/06 07:55:03
 * 生成日期：2026-04-06
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
    foreignAtCash: 930,
    foreignAtMarketMid: 936,
    foreignAtBankMid: 940,
    diffForeign: 6,
    diffTWD: 199,
    diffPct: 0.7,
    cashSell: 32.25,
    marketMid: 32.03588,
    bankMid: 31.915,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147203,
    foreignAtMarketMid: 149816,
    foreignAtBankMid: 151976,
    diffForeign: 2613,
    diffTWD: 523,
    diffPct: 1.8,
    cashSell: 0.2038,
    marketMid: 0.200245,
    bankMid: 0.1974,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 803,
    foreignAtMarketMid: 814,
    foreignAtBankMid: 818,
    diffForeign: 11,
    diffTWD: 419,
    diffPct: 1.4,
    cashSell: 37.36,
    marketMid: 36.83784,
    bankMid: 36.69,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 696,
    foreignAtMarketMid: 711,
    foreignAtBankMid: 713,
    diffForeign: 15,
    diffTWD: 634,
    diffPct: 2.2,
    cashSell: 43.12,
    marketMid: 42.20834,
    bankMid: 42.06,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6369,
    foreignAtMarketMid: 6468,
    foreignAtBankMid: 6481,
    diffForeign: 99,
    diffTWD: 457,
    diffPct: 1.5,
    cashSell: 4.71,
    marketMid: 4.638219,
    bankMid: 4.629,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1285347,
    foreignAtMarketMid: 1413449,
    foreignAtBankMid: 1402525,
    diffForeign: 128102,
    diffTWD: 2719,
    diffPct: 10,
    cashSell: 0.02334,
    marketMid: 0.021225,
    bankMid: 0.02139,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.5,
        rateBuy: 46.8,
        rateInverse: 0.021978,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-04-06',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7266,
    foreignAtMarketMid: 7353,
    foreignAtBankMid: 7450,
    diffForeign: 87,
    diffTWD: 357,
    diffPct: 1.2,
    cashSell: 4.129,
    marketMid: 4.079884,
    bankMid: 4.027,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1338,
    foreignAtMarketMid: 1360,
    foreignAtBankMid: 1362,
    diffForeign: 22,
    diffTWD: 473,
    diffPct: 1.6,
    cashSell: 22.42,
    marketMid: 22.066774,
    bankMid: 22.03,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1285,
    foreignAtMarketMid: 1308,
    foreignAtBankMid: 1310,
    diffForeign: 23,
    diffTWD: 525,
    diffPct: 1.8,
    cashSell: 23.35,
    marketMid: 22.941042,
    bankMid: 22.895,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1192,
    foreignAtMarketMid: 1208,
    foreignAtBankMid: 1214,
    diffForeign: 16,
    diffTWD: 388,
    diffPct: 1.3,
    cashSell: 25.17,
    marketMid: 24.84472,
    bankMid: 24.715,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 744,
    foreignAtMarketMid: 751,
    foreignAtBankMid: 755,
    diffForeign: 7,
    diffTWD: 269,
    diffPct: 0.9,
    cashSell: 40.32,
    marketMid: 39.958443,
    bankMid: 39.72,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1616,
    foreignAtMarketMid: 1646,
    foreignAtBankMid: 1653,
    diffForeign: 30,
    diffTWD: 556,
    diffPct: 1.9,
    cashSell: 18.57,
    marketMid: 18.225892,
    bankMid: 18.145,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28863,
    foreignAtMarketMid: 30630,
    foreignAtBankMid: 31766,
    diffForeign: 1767,
    diffTWD: 1731,
    diffPct: 6.1,
    cashSell: 1.0394,
    marketMid: 0.979424,
    bankMid: 0.9444,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 50234,
    foreignAtMarketMid: 56555,
    foreignAtBankMid: 56476,
    diffForeign: 6321,
    diffTWD: 3353,
    diffPct: 12.6,
    cashSell: 0.5972,
    marketMid: 0.530453,
    bankMid: 0.5312,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 13761468,
    foreignAtMarketMid: 15920057,
    foreignAtBankMid: 16393443,
    diffForeign: 2158589,
    diffTWD: 4068,
    diffPct: 15.7,
    cashSell: 0.00218,
    marketMid: 0.001884,
    bankMid: 0.00183,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3557,
    foreignAtMarketMid: 3782,
    foreignAtBankMid: 3911,
    diffForeign: 225,
    diffTWD: 1778,
    diffPct: 6.3,
    cashSell: 8.433,
    marketMid: 7.933234,
    bankMid: 7.6705,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24504767,
    foreignAtBankMid: 25531915,
    diffForeign: 2765637,
    diffTWD: 3386,
    diffPct: 12.7,
    cashSell: 0.00138,
    marketMid: 0.001224,
    bankMid: 0.001175,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/04/06 07:55:03';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-04-06';
