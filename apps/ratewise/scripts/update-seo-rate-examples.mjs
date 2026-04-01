/**
 * 更新 SEO 匯差範例數據
 *
 * 計算換 3 萬元新台幣時，台灣銀行現金賣出匯率與市場中間價的實際差距，
 * 生成靜態常數供 seo-metadata.ts 的 FAQ 文案使用。
 *
 * 雙重驗證機制：
 *   1. open.er-api.com 市場中間價（與 Google Morningstar / XE / Wise / Apple Yahoo Finance 相同基準）
 *   2. 台灣銀行自身中間價：(現金買入 + 現金賣出) / 2
 *   兩個中間價應高度接近，差距過大時發出警告。
 *
 * 執行時機：
 *   - GitHub Actions 每日自動執行（.github/workflows/update-seo-rate-examples.yml）
 *   - 手動：node apps/ratewise/scripts/update-seo-rate-examples.mjs
 *
 * SSOT：
 *   - 台灣銀行匯率：https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
 *   - 市場中間價：https://open.er-api.com/v6/latest/TWD
 *   - 明洞換匯所匯率：https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/moneybox.json
 *   - 輸出：apps/ratewise/src/config/generated/seo-rate-examples.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT = resolve(ROOT, 'src/config/generated/seo-rate-examples.ts');

const CDN_URL = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json';
/** MoneyBox CDN URL（每5分鐘由 GitHub Actions 更新，見 update-moneybox-rates.yml） */
const MONEYBOX_CDN_URL = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/moneybox.json';
/**
 * 免費市場中間匯率 API（以 TWD 為基準，rates[code] = 1 TWD 可換多少 code）。
 * 與 Google（Morningstar）、XE、Wise、Apple Calculator（Yahoo Finance）使用相同的
 * 銀行間批發市場參考基準，適合作為「一般消費者在非銀行工具看到的匯率」驗證來源。
 */
const ER_API_URL = 'https://open.er-api.com/v6/latest/TWD';

/** 換匯情境用的台幣金額：換 3 萬元新台幣的外幣 */
const EXAMPLE_TWD = 30000;

/**
 * 雙重驗證容差：若兩個中間價差距超過此閾值（%），發出警告。
 * 正常情況下兩者應在 0.5% 以內，超過代表資料異常。
 */
const DUAL_VERIFY_WARN_PCT = 2.0;

/**
 * 明洞換匯所（MoneyBox）TWD↔KRW 匯率靜態後備值。
 * 每日 CI 嘗試從 MoneyBox 取得最新匯率，失敗時用此值。
 * rate：1 TWD 可換多少 KRW（sell 方向，旅客持 TWD 換 KRW）。
 * rateBuy：換匯所買入 KRW 的匯率（旅客持 KRW 換 TWD，每 rateBuy KRW = 1 TWD）。
 */
const MONEYBOX_FALLBACK = {
  name: '明洞換匯所',
  nameEn: 'Myeongdong Exchange',
  rate: 46.0,
  rateBuy: 46.7,
  source: 'MoneyBox',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  note: '適用：現場持 TWD 現金換 KRW，需親自前往',
};

/** 支援的幣別列表（17 個） */
const CURRENCIES = [
  'USD',
  'JPY',
  'EUR',
  'GBP',
  'CNY',
  'KRW',
  'HKD',
  'AUD',
  'CAD',
  'SGD',
  'CHF',
  'NZD',
  'THB',
  'PHP',
  'IDR',
  'MYR',
  'VND',
];

function fmt(n) {
  return n.toLocaleString('zh-TW');
}

/**
 * 從 CDN 取得 MoneyBox 最新 TWD↔KRW 雙向匯率。
 * 資料由 GitHub Actions update-moneybox-rates.yml 每5分鐘更新至 data 分支。
 * CDN URL: https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/moneybox.json
 *
 * sell：換匯所「賣出 KRW」給旅客（旅客持 TWD 換 KRW）的到手匯率。
 * buy：換匯所「買入 KRW」（旅客持 KRW 換 TWD）的匯率，即每 N KRW = 1 TWD。
 * 成功時回傳 { sell, buy }，失敗時回傳 null（觸發後備值）。
 */
async function fetchMoneyBoxKrwRate() {
  try {
    const res = await fetch(MONEYBOX_CDN_URL, {
      headers: { 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const sell = data?.rates?.TWD?.sell;
    const buy = data?.rates?.TWD?.buy;

    const sellValid = sell && typeof sell === 'number' && sell > 30 && sell < 100;
    const buyValid = buy && typeof buy === 'number' && buy > 30 && buy < 100;

    if (sellValid) {
      console.log(
        `[MoneyBox CDN] 成功取得 TWD↔KRW 匯率：sell=${sell}, buy=${buyValid ? buy : '無效'}（更新時間：${data.updateTime}）`,
      );
      return { sell, buy: buyValid ? buy : null };
    }
    console.warn(`[MoneyBox CDN] 回應格式不符，使用後備值。rates.TWD.sell=${sell}`);
    return null;
  } catch (e) {
    console.warn(
      `[MoneyBox CDN] 無法取得匯率（${e.message}），使用後備值 ${MONEYBOX_FALLBACK.rate}`,
    );
    return null;
  }
}

async function main() {
  console.log('=== 更新 SEO 匯差範例數據（雙重驗證模式）===\n');

  // 取得台灣銀行匯率。
  let twData;
  try {
    const res = await fetch(CDN_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    twData = await res.json();
  } catch (e) {
    console.error(`[錯誤] 無法取得台灣銀行匯率：${e.message}`);
    process.exit(1);
  }

  // 取得市場中間匯率（open.er-api.com，以 TWD 為基準）。
  let erData;
  try {
    const res = await fetch(ER_API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    erData = await res.json();
  } catch (e) {
    console.error(`[錯誤] 無法取得市場中間匯率：${e.message}`);
    process.exit(1);
  }

  const details = twData.details ?? {};
  // 移除不規則空白字元（台灣銀行 API 回傳的時間戳可能含 U+202F 窄不換行空格）。
  const updateTime = (twData.updateTime ?? new Date().toISOString()).replace(/\s/g, ' ').trim();

  console.log(`台灣銀行牌告時間：${updateTime}`);
  console.log(`open.er-api.com 更新時間：${erData.time_last_update_utc ?? 'unknown'}\n`);

  // 嘗試取得 MoneyBox 最新 TWD↔KRW 雙向匯率（優雅降級：失敗用後備值）。
  const moneyBoxRates = await fetchMoneyBoxKrwRate();
  const sell = moneyBoxRates?.sell ?? MONEYBOX_FALLBACK.rate;
  const buy = moneyBoxRates?.buy ?? MONEYBOX_FALLBACK.rateBuy;
  const moneyBoxProvider = {
    ...MONEYBOX_FALLBACK,
    rate: sell,
    rateBuy: buy,
    rateInverse: +(1 / sell).toFixed(6),
    rateDate: new Date().toISOString().slice(0, 10),
  };

  const results = {};
  const errors = [];
  const dualVerifyWarnings = [];

  console.log(
    `${'幣別'.padEnd(6)} ${'台銀現金賣出'.padStart(12)} ${'市場中間價(ER)'.padStart(14)} ${'台銀自身中間'.padStart(14)} ${'驗證差距'.padStart(10)} ${'可換外幣(實際)'.padStart(16)} ${'可換外幣(中間)'.padStart(16)} ${'短少外幣'.padStart(14)} ${'短少台幣'.padStart(10)} ${'差距%'.padStart(8)}`,
  );
  console.log('-'.repeat(120));

  for (const code of CURRENCIES) {
    const d = details[code];
    if (!d) {
      errors.push(`${code}: 找不到台灣銀行幣別資料`);
      continue;
    }

    const cashSell = d.cash?.sell;
    const cashBuy = d.cash?.buy;

    if (!cashSell) {
      errors.push(`${code}: 缺少 cash.sell`);
      continue;
    }

    // 驗證來源一：open.er-api.com 市場中間價（與 Google/XE/Wise/Apple 基準一致）。
    // rates[code] = 1 TWD = X units of code，取倒數得 1 unit = Y TWD。
    const erRate = erData.rates?.[code];
    if (!erRate) {
      errors.push(`${code}: open.er-api.com 無此幣別`);
      continue;
    }
    const marketMid = 1 / erRate;

    // 驗證來源二：台灣銀行自身現金中間價 (買入 + 賣出) / 2。
    const bankMid = cashBuy ? (cashBuy + cashSell) / 2 : null;

    // 雙重驗證：比較兩個中間價的差距。
    let dualVerifyPct = null;
    if (bankMid) {
      dualVerifyPct = Math.abs((marketMid - bankMid) / bankMid) * 100;
      if (dualVerifyPct > DUAL_VERIFY_WARN_PCT) {
        dualVerifyWarnings.push(
          `${code}: 雙重驗證差距 ${dualVerifyPct.toFixed(2)}% 超過閾值（ER=${marketMid.toFixed(5)} 台銀中間=${bankMid.toFixed(5)}）`,
        );
      }
    }

    // 換 EXAMPLE_TWD 元台幣，以現金賣出匯率可兌換的外幣數量（實際到手）。
    const foreignAtCash = Math.round(EXAMPLE_TWD / cashSell);
    // 以市場中間價換算，中間價工具（Google/XE/Wise/Apple）顯示的可兌換數量。
    const foreignAtMarketMid = Math.round(EXAMPLE_TWD / marketMid);
    // 以台銀自身中間價換算（雙重驗證用）。
    const foreignAtBankMid = bankMid ? Math.round(EXAMPLE_TWD / bankMid) : null;

    // 中間價高估的外幣數量（用戶預期多換到的外幣，實際拿不到）。
    const diffForeign = foreignAtMarketMid - foreignAtCash;
    // 多付的台幣金額。
    const diffTWD = Math.round(EXAMPLE_TWD - EXAMPLE_TWD * (marketMid / cashSell));
    // 差距百分比（以匯率本身的差距計算）。
    const diffPct = +((cashSell / marketMid - 1) * 100).toFixed(1);

    const dualStr = dualVerifyPct != null ? `${dualVerifyPct.toFixed(2)}%` : 'N/A';

    console.log(
      `${code.padEnd(6)} ${cashSell.toString().padStart(12)} ${marketMid.toFixed(5).padStart(14)} ${(bankMid ? bankMid.toFixed(5) : 'N/A').padStart(14)} ${dualStr.padStart(10)} ${fmt(foreignAtCash).padStart(16)} ${fmt(foreignAtMarketMid).padStart(16)} ${fmt(diffForeign).padStart(14)} ${fmt(diffTWD).padStart(10)} ${(diffPct + '%').padStart(8)}`,
    );

    results[code] = {
      exampleTWD: EXAMPLE_TWD,
      foreignAtCash,
      foreignAtMarketMid,
      foreignAtBankMid,
      diffForeign,
      diffTWD,
      diffPct,
      cashSell,
      marketMid: +marketMid.toFixed(6),
      bankMid: bankMid ? +bankMid.toFixed(6) : null,
    };
  }

  console.log('');

  if (errors.length > 0) {
    console.error('[中止] 以下幣別資料缺漏，終止生成以避免不完整資料污染生產 SEO 內容：');
    errors.forEach((e) => console.error(`  ${e}`));
    process.exit(1);
  }

  if (dualVerifyWarnings.length > 0) {
    console.warn('[警告] 雙重驗證差距異常（超過 2%），請人工確認：');
    dualVerifyWarnings.forEach((w) => console.warn(`  ${w}`));
    console.log('');
  } else {
    console.log('[通過] 雙重驗證：全部幣別兩個中間價差距均在 2% 以內，資料可信。\n');
  }

  // 生成 TypeScript 常數檔案。
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `/**`,
    ` * SEO 匯差範例數據（自動生成）`,
    ` *`,
    ` * 由 scripts/update-seo-rate-examples.mjs 生成，請勿手動編輯。`,
    ` * 每日由 GitHub Actions 自動更新並提交。`,
    ` *`,
    ` * 資料來源：`,
    ` *   - 台灣銀行牌告匯率（現金買入/賣出）`,
    ` *   - open.er-api.com 市場中間價（與 Google Morningstar / XE / Wise / Apple Yahoo Finance 基準一致）`,
    ` * 雙重驗證：open.er-api.com 中間價 vs 台銀自身 (買入+賣出)/2 中間價，差距須在 2% 以內。`,
    ` * 匯率時間：${updateTime}`,
    ` * 生成日期：${today}`,
    ` */`,
    ``,
    `/** 替代換匯管道資訊（如明洞換匯所） */`,
    `export interface AlternativeProvider {`,
    `  /** 換匯所名稱（繁體中文） */`,
    `  name: string;`,
    `  /** 換匯所英文名稱 */`,
    `  nameEn: string;`,
    `  /** 匯率：1 TWD 可換得多少外幣（以 KRW 為例：46.0 表示 1 TWD = 46 KRW） */`,
    `  rate: number;`,
    `  /** 反向匯率：1 單位外幣 = N TWD（= 1/rate，計算值，非換匯所實際買入報價） */`,
    `  rateInverse: number;`,
    `  /** 換匯所實際買入報價：持外幣換 TWD 的到手匯率（KRW→TWD 方向使用此欄位） */`,
    `  rateBuy?: number;`,
    `  /** 資料來源名稱 */`,
    `  source: string;`,
    `  /** 資料來源 URL */`,
    `  sourceUrl: string;`,
    `  /** 匯率更新日期（YYYY-MM-DD） */`,
    `  rateDate: string;`,
    `  /** 適用說明備注 */`,
    `  note: string;`,
    `}`,
    ``,
    `export interface RateExample {`,
    `  /** 換匯情境用的台幣金額（固定 30000） */`,
    `  exampleTWD: number;`,
    `  /** 以台銀現金賣出匯率可兌換的外幣數量（實際到手） */`,
    `  foreignAtCash: number;`,
    `  /** 以市場中間價換算的外幣數量（Google/XE/Wise/Apple 等工具顯示） */`,
    `  foreignAtMarketMid: number;`,
    `  /** 以台銀自身中間價換算的外幣數量（雙重驗證用，null 代表無現金買入資料） */`,
    `  foreignAtBankMid: number | null;`,
    `  /** 中間價高估的外幣數量（foreignAtMarketMid - foreignAtCash，使用者預期多換到但實際拿不到） */`,
    `  diffForeign: number;`,
    `  /** 現金賣出 vs 市場中間價，等值多付約 N 元新台幣 */`,
    `  diffTWD: number;`,
    `  /** 差距百分比（四捨五入到小數一位） */`,
    `  diffPct: number;`,
    `  /** 台灣銀行現金賣出匯率（每 1 單位外幣 = N 台幣） */`,
    `  cashSell: number;`,
    `  /** 市場中間匯率（open.er-api.com，每 1 單位外幣 = N 台幣） */`,
    `  marketMid: number;`,
    `  /** 台銀自身現金中間價（(買入+賣出)/2，雙重驗證用，null 代表無現金買入資料） */`,
    `  bankMid: number | null;`,
    `  /** 替代換匯管道（如明洞換匯所），僅特定幣別有此欄位 */`,
    `  alternativeProviders?: AlternativeProvider[];`,
    `}`,
    ``,
    `/** 各幣別匯差範例：換 3 萬元新台幣，台銀現金賣出 vs 市場中間價（Google/XE/Wise/Apple）差距 */`,
    `export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {`,
  ];

  for (const [code, ex] of Object.entries(results)) {
    lines.push(`  ${code}: {`);
    lines.push(`    exampleTWD: ${ex.exampleTWD},`);
    lines.push(`    foreignAtCash: ${ex.foreignAtCash},`);
    lines.push(`    foreignAtMarketMid: ${ex.foreignAtMarketMid},`);
    lines.push(`    foreignAtBankMid: ${ex.foreignAtBankMid ?? 'null'},`);
    lines.push(`    diffForeign: ${ex.diffForeign},`);
    lines.push(`    diffTWD: ${ex.diffTWD},`);
    lines.push(`    diffPct: ${ex.diffPct},`);
    lines.push(`    cashSell: ${ex.cashSell},`);
    lines.push(`    marketMid: ${ex.marketMid},`);
    lines.push(`    bankMid: ${ex.bankMid ?? 'null'},`);
    // KRW：注入明洞換匯所替代管道資料
    if (code === 'KRW') {
      const p = moneyBoxProvider;
      lines.push(`    alternativeProviders: [`);
      lines.push(`      {`);
      lines.push(`        name: '${p.name}',`);
      lines.push(`        nameEn: '${p.nameEn}',`);
      lines.push(`        rate: ${p.rate},`);
      lines.push(`        rateBuy: ${p.rateBuy},`);
      lines.push(`        rateInverse: ${p.rateInverse},`);
      lines.push(`        source: '${p.source}',`);
      lines.push(`        sourceUrl: '${p.sourceUrl}',`);
      lines.push(`        rateDate: '${p.rateDate}',`);
      lines.push(`        note: '${p.note}',`);
      lines.push(`      },`);
      lines.push(`    ],`);
    }
    lines.push(`  },`);
  }

  lines.push(`} as const;`);
  lines.push(``);
  lines.push(`/** 資料更新時間（台灣銀行） */`);
  lines.push(`export const SEO_RATE_EXAMPLES_UPDATE_TIME = '${updateTime}';`);
  lines.push(``);
  lines.push(`/** 生成日期 */`);
  lines.push(`export const SEO_RATE_EXAMPLES_DATE = '${today}';`);
  lines.push(``);

  mkdirSync(resolve(ROOT, 'src/config/generated'), { recursive: true });
  writeFileSync(OUTPUT, lines.join('\n'), 'utf-8');
  console.log(`[完成] 已生成：src/config/generated/seo-rate-examples.ts（${today}）`);
}

main();
