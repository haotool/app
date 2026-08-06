// 量測基準新鮮度守門 CLI：掃描 .claude/product-intel/level-audits/*.json，
// 比對各報告的機制指紋與當前值，過時即 exit 1 並列出讓它失效的提交。
//
// 動機：audit 數字被當成平衡決策依據，但機制變更後報告不會自曝過時。
// 實例——l28-tf-high 測於 8c389ec04，其後 #953 放寬變身資格、#965 修好
// 「星暴對魔王恆 0 傷」，TTK 已不可比，報告卻仍被引用為現況。
//
// 用法：node scripts/verify-audit-freshness.mjs [--list]
//   預設：有過時報告即 exit 1（CI／pre-push 守門）
//   --list：只列出狀態，恆 exit 0（本機盤點）
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  currentMechanicsSha,
  freshnessVerdict,
  mechanicCommitsSince,
} from './lib/audit-freshness.mjs';

const listOnly = process.argv.includes('--list');
const AUDIT_DIR = fileURLToPath(
  new URL('../../../.claude/product-intel/level-audits/', import.meta.url),
);
const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

let files = [];
try {
  files = readdirSync(AUDIT_DIR).filter((f) => f.endsWith('.json'));
} catch {
  console.log('audit 目錄不存在，無報告可驗證。');
  process.exit(0);
}

if (files.length === 0) {
  console.log('無 audit 報告，略過。');
  process.exit(0);
}

const current = currentMechanicsSha(REPO_ROOT);
console.log(`當前機制指紋：${current}\n`);

const stale = [];
const unknown = [];
for (const file of files.sort()) {
  let report;
  try {
    report = JSON.parse(readFileSync(`${AUDIT_DIR}${file}`, 'utf8'));
  } catch {
    unknown.push({ file, reason: 'JSON 解析失敗' });
    continue;
  }
  const reportSha = report.mechanicsSha;
  const commits = reportSha ? mechanicCommitsSince(reportSha, REPO_ROOT) : null;
  const verdict = freshnessVerdict(reportSha, current, commits);
  if (verdict === 'fresh') {
    console.log(`  ✓ ${file}（機制 ${reportSha}）`);
  } else if (verdict === 'stale') {
    console.log(`  ✗ ${file}（機制 ${reportSha}）落後 ${commits.length} 個機制提交`);
    for (const c of commits.slice(0, 3)) console.log(`      ${c.sha} ${c.subject}`);
    if (commits.length > 3) console.log(`      …另 ${commits.length - 3} 筆`);
    stale.push(file);
  } else {
    console.log(`  ? ${file}（無機制指紋，早於守門導入）`);
    unknown.push({ file, reason: '無 mechanicsSha' });
  }
}

console.log(
  `\n合計 ${files.length} 份：新鮮 ${files.length - stale.length - unknown.length}｜過時 ${stale.length}｜無指紋 ${unknown.length}`,
);

if (listOnly) process.exit(0);
if (stale.length > 0 || unknown.length > 0) {
  console.error(
    `\n量測基準過時：請以最新 main 重跑上列關卡（pnpm --filter @app/starpuff audit:level <id>），\n` +
      `或刪除不再引用的報告。禁止在失效基準上做平衡決策。`,
  );
  process.exit(1);
}
console.log('\n全部量測基準新鮮。');
