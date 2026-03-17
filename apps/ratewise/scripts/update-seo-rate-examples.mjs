/**
 * 更新 SEO 匯差範例數據
 *
 * 計算換 3 萬元台幣時，銀行現金賣出匯率 vs 市場中間價（open.er-api.com）的差距，
 * 生成靜態常數供 seo-metadata.ts 的 FAQ 文案使用。
 *
 * 執行時機：
 *   - GitHub Actions 每週一自動執行（.github/workflows/update-seo-rate-examples.yml）
 *   - 手動：node apps/ratewise/scripts/update-seo-rate-examples.mjs
 *
 * SSOT：
 *   - 臺灣銀行匯率：https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
 *   - 市場中間價：https://open.er-api.com/v6/latest/TWD（免費，每日更新，與 Google/XE 接近）
 *   - 輸出：apps/ratewise/src/config/generated/seo-rate-examples.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT = resolve(ROOT, 'src/config/generated/seo-rate-examples.ts');

const CDN_URL = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json';
/** 免費市場中間匯率 API（以 TWD 為基準，rates[code] = 1 TWD 能換多少 code） */
const ER_API_URL = 'https://open.er-api.com/v6/latest/TWD';

/** 換匯情境用的台幣金額：換 3 萬元台幣的外幣 */
const EXAMPLE_TWD = 30000;

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

async function main() {
  console.log('📊 更新 SEO 匯差範例數據（臺灣銀行現金 vs 市場中間價）...');

  // 取得臺灣銀行匯率。
  let twData;
  try {
    const res = await fetch(CDN_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    twData = await res.json();
  } catch (e) {
    console.error(`❌ 無法取得臺灣銀行匯率：${e.message}`);
    process.exit(1);
  }

  // 取得市場中間匯率（open.er-api.com，以 TWD 為基準）。
  let erData;
  try {
    const res = await fetch(ER_API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    erData = await res.json();
  } catch (e) {
    console.error(`❌ 無法取得市場中間匯率：${e.message}`);
    process.exit(1);
  }

  const details = twData.details ?? {};
  // 移除不規則空白字元（臺灣銀行 API 回傳的時間戳可能含 U+202F 窄不換行空格）。
  const updateTime = (twData.updateTime ?? new Date().toISOString()).replace(/\s/g, ' ').trim();

  const results = {};
  const errors = [];

  for (const code of CURRENCIES) {
    const d = details[code];
    if (!d) {
      errors.push(`${code}: 找不到臺灣銀行幣別資料`);
      continue;
    }

    const cashSell = d.cash?.sell;
    if (!cashSell) {
      errors.push(`${code}: 缺少 cash_sell`);
      continue;
    }

    // 市場中間價：open.er-api.com 回傳「1 TWD = X units of code」，取倒數得「1 unit = Y TWD」。
    const erRate = erData.rates?.[code];
    if (!erRate) {
      errors.push(`${code}: 市場中間價找不到`);
      continue;
    }
    const marketMid = 1 / erRate;

    // 換 EXAMPLE_TWD 元台幣，能買到的外幣數量（以現金賣出匯率計算）。
    const foreignUnits = EXAMPLE_TWD / cashSell;
    // 若以市場中間價購買相同數量外幣，需要的台幣金額。
    const twdAtMid = foreignUnits * marketMid;
    // 多付的台幣金額（四捨五入到整數）。
    const diffTWD = Math.round(EXAMPLE_TWD - twdAtMid);
    // 差距百分比（以 cashSell / marketMid - 1 計算，準確反映匯率本身的差距）。
    const diffPct = +((cashSell / marketMid - 1) * 100).toFixed(1);

    results[code] = {
      exampleTWD: EXAMPLE_TWD,
      diffTWD,
      diffPct,
      cashSell,
      marketMid: +marketMid.toFixed(6),
    };

    console.log(
      `  ${code}: 換 ${EXAMPLE_TWD.toLocaleString('zh-TW')} TWD → 多付 ${diffTWD} TWD（${diffPct}%）[cash=${cashSell} mid=${marketMid.toFixed(5)}]`,
    );
  }

  if (errors.length > 0) {
    console.warn('⚠️  跳過部分幣別：');
    errors.forEach((e) => console.warn(`   ${e}`));
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
    ` * 資料來源：臺灣銀行牌告匯率 + open.er-api.com 市場中間價`,
    ` * 匯率時間：${updateTime}`,
    ` * 生成日期：${today}`,
    ` */`,
    ``,
    `export interface RateExample {`,
    `  /** 換匯情境用的台幣金額（固定 30000） */`,
    `  exampleTWD: number;`,
    `  /** 現金賣出 vs 市場中間價，多付約 N 元台幣 */`,
    `  diffTWD: number;`,
    `  /** 差距百分比（四捨五入到小數一位） */`,
    `  diffPct: number;`,
    `  /** 現金賣出匯率（臺灣銀行） */`,
    `  cashSell: number;`,
    `  /** 市場中間匯率（open.er-api.com，1 TWD = X units 的倒數，即 1 unit = Y TWD） */`,
    `  marketMid: number;`,
    `}`,
    ``,
    `/** 各幣別匯差範例：換 3 萬元台幣，現金匯率 vs 市場中間價（Google/XE 顯示）差距 */`,
    `export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {`,
  ];

  for (const [code, ex] of Object.entries(results)) {
    lines.push(`  ${code}: {`);
    lines.push(`    exampleTWD: ${ex.exampleTWD},`);
    lines.push(`    diffTWD: ${ex.diffTWD},`);
    lines.push(`    diffPct: ${ex.diffPct},`);
    lines.push(`    cashSell: ${ex.cashSell},`);
    lines.push(`    marketMid: ${ex.marketMid},`);
    lines.push(`  },`);
  }

  lines.push(`} as const;`);
  lines.push(``);
  lines.push(`/** 資料更新時間（臺灣銀行） */`);
  lines.push(`export const SEO_RATE_EXAMPLES_UPDATE_TIME = '${updateTime}';`);
  lines.push(``);
  lines.push(`/** 生成日期 */`);
  lines.push(`export const SEO_RATE_EXAMPLES_DATE = '${today}';`);
  lines.push(``);

  mkdirSync(resolve(ROOT, 'src/config/generated'), { recursive: true });
  writeFileSync(OUTPUT, lines.join('\n'), 'utf-8');
  console.log(`✅ 已生成：src/config/generated/seo-rate-examples.ts（${today}）`);
}

main();
