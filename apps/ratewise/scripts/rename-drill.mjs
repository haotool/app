#!/usr/bin/env node
/**
 * Rename Drill — Brand SSOT Integrity Check
 *
 * 用途：驗證「改 shortName 一處 → 散播到所有產出物」的 SSOT 契約是否仍然成立。
 *
 * 流程：
 * 1. 備份 src/config/app-info.ts
 * 2. 把 BRAND_SHORT_NAME 改成 sentinel 值（__RENAME_DRILL_SENTINEL__）
 * 3. 跑 prebuild 腳本鏈（產生 manifest / robots / llms / mirrors / offline / security 等）
 * 4. 把 sentinel 寫進 fixture，grep 全部 public/ 與 dist/（若存在）確認 sentinel 出現
 * 5. 若任何地方仍殘留舊品牌字面值 → 視為 SSOT 漏洞，列出檔案並 exit 1
 * 6. 還原備份
 *
 * 何時執行：
 * - 加入 CI 每月排程（避免新增程式碼悄悄硬寫品牌字面值）
 * - 真正改名前手動跑一次，當作最後的安全網
 *
 * Usage:
 *   node scripts/rename-drill.mjs              # 完整流程
 *   node scripts/rename-drill.mjs --dry-run    # 只列出會檢查的檔案
 *
 * 退出碼：
 *   0 = SSOT 完整，可以安心改名
 *   1 = 殘留硬編碼字面值，列印漏洞清單
 *   2 = 腳本內部錯誤（備份還原失敗等）
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, '..');
const APP_INFO_PATH = resolve(APP_ROOT, 'src/config/app-info.ts');
const SENTINEL = '__RENAME_DRILL_SENTINEL__';
const ORIGINAL_SHORT_NAME = 'RateWise';

const TARGET_DIRS = [
  // 只掃描 prebuild 產出的 public/
  // dist/ 由 vite build 產生，已由 index.html.test.ts 保證使用 transformIndexHtml plugin
  // 從 SSOT 取值；獨立的 drill 不需要拖慢來重跑完整 vite build。
  resolve(APP_ROOT, 'public'),
];

const SKIP_FILES = new Set([
  // 圖示與二進位資產不在掃描範圍
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.ico',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
]);

function fail(msg, code = 1) {
  console.error(`\n❌ ${msg}`);
  process.exit(code);
}

function info(msg) {
  console.log(`ℹ️  ${msg}`);
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
      continue;
    }
    const ext = entry.slice(entry.lastIndexOf('.'));
    if (SKIP_FILES.has(ext)) continue;
    yield full;
  }
}

function grepFiles(needle, dirs) {
  const hits = [];
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes(needle)) {
        hits.push(relative(APP_ROOT, file));
      }
    }
  }
  return hits;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!existsSync(APP_INFO_PATH)) {
    fail(`找不到 SSOT：${APP_INFO_PATH}`, 2);
  }

  const original = readFileSync(APP_INFO_PATH, 'utf-8');
  if (!original.includes(`'${ORIGINAL_SHORT_NAME}'`)) {
    fail(`SSOT 內找不到 BRAND_SHORT_NAME = '${ORIGINAL_SHORT_NAME}'，rename-drill 無法定位`, 2);
  }

  if (dryRun) {
    info('Dry run：只列出會被掃描的檔案範圍');
    let count = 0;
    for (const dir of TARGET_DIRS) {
      for (const _ of walk(dir)) count += 1;
    }
    info(`掃描範圍共 ${count} 個檔案（public/ + dist/）`);
    process.exit(0);
  }

  info('Step 1/5：備份 SSOT...');
  const backup = original;

  let restored = false;
  const restore = ({ regenerate = true } = {}) => {
    if (restored) return;
    writeFileSync(APP_INFO_PATH, backup, 'utf-8');
    restored = true;
    ok('已還原 SSOT');

    if (!regenerate) return;
    // 重跑 prebuild 把 public/ 內被 sentinel 污染的產出物換回真實品牌
    info('重跑 prebuild 還原 public/ 產出物...');
    try {
      execSync('pnpm prebuild', {
        cwd: APP_ROOT,
        stdio: 'inherit',
        env: { ...process.env, SEO_RATE_EXAMPLES_OPTIONAL: '1' },
      });
      ok('public/ 已還原為真實品牌');
    } catch (regenError) {
      console.error(`⚠️  public/ 還原失敗：${regenError.message ?? regenError}`);
      console.error('   請手動執行 pnpm prebuild 還原 public/ 產出物');
    }
  };
  process.on('exit', () => restore({ regenerate: false }));
  process.on('SIGINT', () => {
    restore();
    process.exit(130);
  });

  try {
    info(`Step 2/5：把 BRAND_SHORT_NAME 改為 sentinel '${SENTINEL}'...`);
    const swapped = original.replace(
      `const BRAND_SHORT_NAME = '${ORIGINAL_SHORT_NAME}';`,
      `const BRAND_SHORT_NAME = '${SENTINEL}';`,
    );
    if (swapped === original) {
      fail('BRAND_SHORT_NAME 替換失敗（regex 沒命中）', 2);
    }
    writeFileSync(APP_INFO_PATH, swapped, 'utf-8');

    info('Step 3/5：跑 prebuild 腳本鏈（不跑 vite build，僅驗證 SSOT 散播）...');
    execSync('pnpm prebuild', {
      cwd: APP_ROOT,
      stdio: 'inherit',
      env: { ...process.env, SEO_RATE_EXAMPLES_OPTIONAL: '1' },
    });

    info('Step 4/5：grep 殘留舊品牌字面值...');
    const leftover = grepFiles(ORIGINAL_SHORT_NAME, TARGET_DIRS);
    if (leftover.length > 0) {
      console.error('\n❌ SSOT 漏洞 — 改 shortName 後仍殘留舊品牌字面值：');
      for (const f of leftover) console.error(`   - ${f}`);
      console.error('\n請修正：找出產生這些檔案的腳本／模板，改用 APP_INFO.shortName');
      restore();
      process.exit(1);
    }
    ok('public/ 內沒有殘留舊品牌字面值');

    info('Step 5/5：grep sentinel 是否真的散播出去...');
    const propagated = grepFiles(SENTINEL, TARGET_DIRS);
    if (propagated.length === 0) {
      console.error('\n❌ SSOT 散播失敗 — sentinel 沒有出現在任何產出物');
      console.error('   可能原因：prebuild 腳本沒有從 app-info.ts 取值');
      restore();
      process.exit(1);
    }
    ok(`sentinel 散播到 ${propagated.length} 個產出物（前 5 個）：`);
    for (const f of propagated.slice(0, 5)) console.log(`   - ${f}`);

    restore();
    console.log('\n🎉 Rename Drill 通過：SSOT 完整，可以安心改 shortName');
    process.exit(0);
  } catch (error) {
    restore();
    console.error('\n❌ Drill 執行失敗：', error.message ?? error);
    process.exit(2);
  }
}

main();
