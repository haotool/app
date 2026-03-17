/**
 * 更新 SEO 匯差範例數據
 *
 * 從臺灣銀行牌告匯率計算每幣別「現金賣出 vs 即期賣出（或中間價）」的差距，
 * 生成靜態常數供 seo-metadata.ts 的 FAQ 文案使用。
 *
 * 執行時機：
 *   - GitHub Actions 每週一自動執行（.github/workflows/update-seo-rate-examples.yml）
 *   - 手動：node apps/ratewise/scripts/update-seo-rate-examples.mjs
 *
 * SSOT：
 *   - 匯率來源：https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
 *   - 輸出：apps/ratewise/src/config/generated/seo-rate-examples.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT = resolve(ROOT, 'src/config/generated/seo-rate-examples.ts');

const CDN_URL = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json';

/** 每幣別代表性換匯金額（符合一般旅遊習慣的整數） */
const REPRESENTATIVE_AMOUNTS = {
  USD: 100,
  JPY: 10000,
  EUR: 100,
  GBP: 100,
  CNY: 100,
  KRW: 100000,
  HKD: 1000,
  AUD: 100,
  CAD: 100,
  SGD: 100,
  CHF: 100,
  NZD: 100,
  THB: 1000,
  PHP: 1000,
  IDR: 1000000,
  MYR: 100,
  VND: 1000000,
};

function formatTWD(n) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: 0 });
}

function formatAmount(amount) {
  return amount.toLocaleString('zh-TW');
}

async function main() {
  console.log('📊 更新 SEO 匯差範例數據...');

  let data;
  try {
    const res = await fetch(CDN_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    console.error(`❌ 無法取得匯率資料：${e.message}`);
    process.exit(1);
  }

  const details = data.details ?? {};
  // 移除不規則空白字元（臺灣銀行 API 回傳的時間戳可能含 U+202F 窄不換行空格）。
  const updateTime = (data.updateTime ?? new Date().toISOString()).replace(/\s/g, ' ').trim();

  const results = {};
  const errors = [];

  for (const [code, repAmt] of Object.entries(REPRESENTATIVE_AMOUNTS)) {
    const d = details[code];
    if (!d) {
      errors.push(`${code}: 找不到幣別資料`);
      continue;
    }

    const cashSell = d.cash?.sell;
    const spotSell = d.spot?.sell;
    const cashBuy = d.cash?.buy;

    if (!cashSell) {
      errors.push(`${code}: 缺少 cash_sell`);
      continue;
    }

    // 參考價：有即期賣出就用即期，否則用現金中間價（僅現金幣別如 KRW、PHP 等）。
    let refRate, refType;
    if (spotSell) {
      refRate = spotSell;
      refType = 'spot';
    } else if (cashBuy) {
      refRate = (cashBuy + cashSell) / 2;
      refType = 'mid';
    } else {
      errors.push(`${code}: 無參考匯率`);
      continue;
    }

    const twdAtCash = cashSell * repAmt;
    const twdAtRef = refRate * repAmt;
    const diffTWD = Math.round(twdAtCash - twdAtRef);
    const diffPct = +((diffTWD / twdAtRef) * 100).toFixed(1);

    results[code] = {
      exampleAmount: repAmt,
      diffTWD,
      diffPct,
      refType,
      cashSell,
      refRate: +refRate.toFixed(5),
    };

    console.log(
      `  ${code}: ${formatAmount(repAmt)} → 多付 ${diffTWD} TWD（${diffPct}%）[${refType}]`,
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
    ` * 資料來源：臺灣銀行牌告匯率`,
    ` * 匯率時間：${updateTime}`,
    ` * 生成日期：${today}`,
    ` */`,
    ``,
    `export interface RateExample {`,
    `  /** 代表性換匯金額 */`,
    `  exampleAmount: number;`,
    `  /** 現金賣出 vs 參考匯率，多付約 N 元台幣 */`,
    `  diffTWD: number;`,
    `  /** 差距百分比（四捨五入到小數一位） */`,
    `  diffPct: number;`,
    `  /** 參考匯率類型：'spot' = 即期賣出；'mid' = 現金中間價（純現金幣別） */`,
    `  refType: 'spot' | 'mid';`,
    `  /** 現金賣出匯率 */`,
    `  cashSell: number;`,
    `  /** 參考匯率 */`,
    `  refRate: number;`,
    `}`,
    ``,
    `/** 各幣別匯差範例，以常見換匯金額計算 */`,
    `export const SEO_RATE_EXAMPLES: Record<string, RateExample> = {`,
  ];

  for (const [code, ex] of Object.entries(results)) {
    lines.push(`  ${code}: {`);
    lines.push(`    exampleAmount: ${ex.exampleAmount},`);
    lines.push(`    diffTWD: ${ex.diffTWD},`);
    lines.push(`    diffPct: ${ex.diffPct},`);
    lines.push(`    refType: '${ex.refType}',`);
    lines.push(`    cashSell: ${ex.cashSell},`);
    lines.push(`    refRate: ${ex.refRate},`);
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
