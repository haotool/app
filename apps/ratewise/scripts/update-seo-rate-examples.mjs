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
 *   - GitHub Actions 每週一自動執行（.github/workflows/update-seo-rate-examples.yml）
 *   - 手動：node apps/ratewise/scripts/update-seo-rate-examples.mjs
 *
 * SSOT：
 *   - 台灣銀行匯率：https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
 *   - 市場中間價：https://open.er-api.com/v6/latest/TWD
 *   - 輸出：apps/ratewise/src/config/generated/seo-rate-examples.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT = resolve(ROOT, 'src/config/generated/seo-rate-examples.ts');

const CDN_URL = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json';
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
    console.warn('[警告] 跳過部分幣別：');
    errors.forEach((e) => console.warn(`  ${e}`));
    console.log('');
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
    ` * 每週一由 GitHub Actions 自動更新並提交。`,
    ` *`,
    ` * 資料來源：`,
    ` *   - 台灣銀行牌告匯率（現金買入/賣出）`,
    ` *   - open.er-api.com 市場中間價（與 Google Morningstar / XE / Wise / Apple Yahoo Finance 基準一致）`,
    ` * 雙重驗證：open.er-api.com 中間價 vs 台銀自身 (買入+賣出)/2 中間價，差距須在 2% 以內。`,
    ` * 匯率時間：${updateTime}`,
    ` * 生成日期：${today}`,
    ` */`,
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
