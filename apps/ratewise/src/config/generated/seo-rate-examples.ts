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
 * 匯率時間：2026/06/26 13:54:07
 * 生成日期：2026-06-26
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
    foreignAtMarketMid: 942,
    foreignAtBankMid: 943,
    diffForeign: 9,
    diffTWD: 270,
    diffPct: 0.9,
    cashSell: 32.15,
    marketMid: 31.860324,
    bankMid: 31.815,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 149328,
    foreignAtMarketMid: 152463,
    foreignAtBankMid: 154242,
    diffForeign: 3135,
    diffTWD: 617,
    diffPct: 2.1,
    cashSell: 0.2009,
    marketMid: 0.196769,
    bankMid: 0.1945,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 815,
    foreignAtMarketMid: 829,
    foreignAtBankMid: 830,
    diffForeign: 14,
    diffTWD: 508,
    diffPct: 1.7,
    cashSell: 36.8,
    marketMid: 36.176832,
    bankMid: 36.13,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 697,
    foreignAtMarketMid: 715,
    foreignAtBankMid: 715,
    diffForeign: 18,
    diffTWD: 723,
    diffPct: 2.5,
    cashSell: 43.02,
    marketMid: 41.983291,
    bankMid: 41.96,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6317,
    foreignAtMarketMid: 6429,
    foreignAtBankMid: 6427,
    diffForeign: 112,
    diffTWD: 522,
    diffPct: 1.8,
    cashSell: 4.749,
    marketMid: 4.666356,
    bankMid: 4.668,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1314636,
    foreignAtMarketMid: 1453588,
    foreignAtBankMid: 1437470,
    diffForeign: 138952,
    diffTWD: 2868,
    diffPct: 10.6,
    cashSell: 0.02282,
    marketMid: 0.020639,
    bankMid: 0.02087,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 47,
        rateBuy: 47.1,
        rateInverse: 0.021277,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-06-26',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7294,
    foreignAtMarketMid: 7388,
    foreignAtBankMid: 7479,
    diffForeign: 94,
    diffTWD: 384,
    diffPct: 1.3,
    cashSell: 4.113,
    marketMid: 4.060419,
    bankMid: 4.011,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1342,
    foreignAtMarketMid: 1363,
    foreignAtBankMid: 1365,
    diffForeign: 21,
    diffTWD: 478,
    diffPct: 1.6,
    cashSell: 22.36,
    marketMid: 22.003653,
    bankMid: 21.97,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1311,
    foreignAtMarketMid: 1339,
    foreignAtBankMid: 1337,
    diffForeign: 28,
    diffTWD: 637,
    diffPct: 2.2,
    cashSell: 22.89,
    marketMid: 22.403943,
    bankMid: 22.435,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1203,
    foreignAtMarketMid: 1222,
    foreignAtBankMid: 1225,
    diffForeign: 19,
    diffTWD: 466,
    diffPct: 1.6,
    cashSell: 24.94,
    marketMid: 24.55253,
    bankMid: 24.485,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 754,
    foreignAtMarketMid: 764,
    foreignAtBankMid: 765,
    diffForeign: 10,
    diffTWD: 407,
    diffPct: 1.4,
    cashSell: 39.8,
    marketMid: 39.260335,
    bankMid: 39.2,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1633,
    foreignAtMarketMid: 1668,
    foreignAtBankMid: 1672,
    diffForeign: 35,
    diffTWD: 624,
    diffPct: 2.1,
    cashSell: 18.37,
    marketMid: 17.987876,
    bankMid: 17.945,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 29542,
    foreignAtMarketMid: 31449,
    foreignAtBankMid: 32591,
    diffForeign: 1907,
    diffTWD: 1819,
    diffPct: 6.5,
    cashSell: 1.0155,
    marketMid: 0.95394,
    bankMid: 0.9205,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51168,
    foreignAtMarketMid: 57699,
    foreignAtBankMid: 57659,
    diffForeign: 6531,
    diffTWD: 3396,
    diffPct: 12.8,
    cashSell: 0.5863,
    marketMid: 0.51994,
    bankMid: 0.5203,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16927956,
    foreignAtBankMid: 16853933,
    diffForeign: 2843449,
    diffTWD: 5039,
    diffPct: 20.2,
    cashSell: 0.00213,
    marketMid: 0.001772,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3626,
    foreignAtMarketMid: 3881,
    foreignAtBankMid: 3994,
    diffForeign: 255,
    diffTWD: 1971,
    diffPct: 7,
    cashSell: 8.274,
    marketMid: 7.730425,
    bankMid: 7.5115,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21428571,
    foreignAtMarketMid: 24706550,
    foreignAtBankMid: 25104603,
    diffForeign: 3277979,
    diffTWD: 3980,
    diffPct: 15.3,
    cashSell: 0.0014,
    marketMid: 0.001214,
    bankMid: 0.001195,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/06/26 13:54:07';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-06-26';
