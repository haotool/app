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
 * 匯率時間：2026/05/14 11:54:51
 * 生成日期：2026-05-14
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
    foreignAtCash: 944,
    foreignAtMarketMid: 951,
    foreignAtBankMid: 954,
    diffForeign: 7,
    diffTWD: 213,
    diffPct: 0.7,
    cashSell: 31.775,
    marketMid: 31.549722,
    bankMid: 31.44,
    spotAvailable: true,
  },
  JPY: {
    exampleTWD: 30000,
    foreignAtCash: 147783,
    foreignAtMarketMid: 150092,
    foreignAtBankMid: 152594,
    diffForeign: 2309,
    diffTWD: 461,
    diffPct: 1.6,
    cashSell: 0.203,
    marketMid: 0.199878,
    bankMid: 0.1966,
    spotAvailable: true,
  },
  EUR: {
    exampleTWD: 30000,
    foreignAtCash: 801,
    foreignAtMarketMid: 812,
    foreignAtBankMid: 816,
    diffForeign: 11,
    diffTWD: 379,
    diffPct: 1.3,
    cashSell: 37.43,
    marketMid: 36.957647,
    bankMid: 36.76,
    spotAvailable: true,
  },
  GBP: {
    exampleTWD: 30000,
    foreignAtCash: 689,
    foreignAtMarketMid: 703,
    foreignAtBankMid: 706,
    diffForeign: 14,
    diffTWD: 619,
    diffPct: 2.1,
    cashSell: 43.55,
    marketMid: 42.651198,
    bankMid: 42.49,
    spotAvailable: true,
  },
  CNY: {
    exampleTWD: 30000,
    foreignAtCash: 6372,
    foreignAtMarketMid: 6456,
    foreignAtBankMid: 6484,
    diffForeign: 84,
    diffTWD: 390,
    diffPct: 1.3,
    cashSell: 4.708,
    marketMid: 4.64684,
    bankMid: 4.627,
    spotAvailable: true,
  },
  KRW: {
    exampleTWD: 30000,
    foreignAtCash: 1289768,
    foreignAtMarketMid: 1416368,
    foreignAtBankMid: 1407790,
    diffForeign: 126600,
    diffTWD: 2682,
    diffPct: 9.8,
    cashSell: 0.02326,
    marketMid: 0.021181,
    bankMid: 0.02131,
    spotAvailable: false,
    alternativeProviders: [
      {
        name: '明洞換匯所',
        nameEn: 'Myeongdong Exchange',
        rate: 45.25,
        rateBuy: 45.5,
        rateInverse: 0.022099,
        source: 'MoneyBox',
        sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
        rateDate: '2026-05-14',
        note: '適用：現場持 TWD 現金換 KRW，需親自前往',
      },
    ],
  },
  HKD: {
    exampleTWD: 30000,
    foreignAtCash: 7371,
    foreignAtMarketMid: 7451,
    foreignAtBankMid: 7560,
    diffForeign: 80,
    diffTWD: 322,
    diffPct: 1.1,
    cashSell: 4.07,
    marketMid: 4.026381,
    bankMid: 3.968,
    spotAvailable: true,
  },
  AUD: {
    exampleTWD: 30000,
    foreignAtCash: 1291,
    foreignAtMarketMid: 1311,
    foreignAtBankMid: 1313,
    diffForeign: 20,
    diffTWD: 446,
    diffPct: 1.5,
    cashSell: 23.23,
    marketMid: 22.884866,
    bankMid: 22.84,
    spotAvailable: true,
  },
  CAD: {
    exampleTWD: 30000,
    foreignAtCash: 1282,
    foreignAtMarketMid: 1304,
    foreignAtBankMid: 1307,
    diffForeign: 22,
    diffTWD: 499,
    diffPct: 1.7,
    cashSell: 23.4,
    marketMid: 23.010723,
    bankMid: 22.945,
    spotAvailable: true,
  },
  SGD: {
    exampleTWD: 30000,
    foreignAtCash: 1196,
    foreignAtMarketMid: 1211,
    foreignAtBankMid: 1218,
    diffForeign: 15,
    diffTWD: 376,
    diffPct: 1.3,
    cashSell: 25.09,
    marketMid: 24.775779,
    bankMid: 24.635,
    spotAvailable: true,
  },
  CHF: {
    exampleTWD: 30000,
    foreignAtCash: 737,
    foreignAtMarketMid: 744,
    foreignAtBankMid: 748,
    diffForeign: 7,
    diffTWD: 259,
    diffPct: 0.9,
    cashSell: 40.69,
    marketMid: 40.338846,
    bankMid: 40.09,
    spotAvailable: true,
  },
  NZD: {
    exampleTWD: 30000,
    foreignAtCash: 1575,
    foreignAtMarketMid: 1602,
    foreignAtBankMid: 1611,
    diffForeign: 27,
    diffTWD: 518,
    diffPct: 1.8,
    cashSell: 19.05,
    marketMid: 18.721333,
    bankMid: 18.625,
    spotAvailable: true,
  },
  THB: {
    exampleTWD: 30000,
    foreignAtCash: 28974,
    foreignAtMarketMid: 30799,
    foreignAtBankMid: 31901,
    diffForeign: 1825,
    diffTWD: 1778,
    diffPct: 6.3,
    cashSell: 1.0354,
    marketMid: 0.974052,
    bankMid: 0.9404,
    spotAvailable: true,
  },
  PHP: {
    exampleTWD: 30000,
    foreignAtCash: 51858,
    foreignAtMarketMid: 58372,
    foreignAtBankMid: 58537,
    diffForeign: 6514,
    diffTWD: 3348,
    diffPct: 12.6,
    cashSell: 0.5785,
    marketMid: 0.513949,
    bankMid: 0.5125,
    spotAvailable: false,
  },
  IDR: {
    exampleTWD: 30000,
    foreignAtCash: 14084507,
    foreignAtMarketMid: 16643146,
    foreignAtBankMid: 16853933,
    diffForeign: 2558639,
    diffTWD: 4612,
    diffPct: 18.2,
    cashSell: 0.00213,
    marketMid: 0.001803,
    bankMid: 0.00178,
    spotAvailable: false,
  },
  MYR: {
    exampleTWD: 30000,
    foreignAtCash: 3521,
    foreignAtMarketMid: 3739,
    foreignAtBankMid: 3867,
    diffForeign: 218,
    diffTWD: 1747,
    diffPct: 6.2,
    cashSell: 8.52,
    marketMid: 8.02375,
    bankMid: 7.7575,
    spotAvailable: false,
  },
  VND: {
    exampleTWD: 30000,
    foreignAtCash: 21739130,
    foreignAtMarketMid: 24977381,
    foreignAtBankMid: 25531915,
    diffForeign: 3238251,
    diffTWD: 3889,
    diffPct: 14.9,
    cashSell: 0.00138,
    marketMid: 0.001201,
    bankMid: 0.001175,
    spotAvailable: false,
  },
} as const;

/** 資料更新時間（台灣銀行） */
export const SEO_RATE_EXAMPLES_UPDATE_TIME = '2026/05/14 11:54:51';

/** 生成日期 */
export const SEO_RATE_EXAMPLES_DATE = '2026-05-14';
