import { execSync } from 'node:child_process';
// 純規則（機制路徑、排除、裁決）住 src/game/core/auditFreshness.ts——沿 repo SSOT
// 慣例經 ts-bridge 引用，禁止在腳本內維護第二份。本檔只負責 git I/O。
import './ts-bridge.mjs';

const { mechanicPathspec } = await import('../../src/game/core/auditFreshness.ts');

export {
  MECHANIC_PATHS,
  MECHANIC_EXCLUDES,
  freshnessVerdict,
} from '../../src/game/core/auditFreshness.ts';

// repo 根解析：pathspec 預設相對 cwd，而 level-audit 自 apps/starpuff 執行、
// verify CLI 自 repo 根執行——不統一錨點會讓機制路徑比對不到任何提交而靜默回
// 'unknown'（守門形同關閉）。一律以 git 自報的 toplevel 為錨。
function resolveRepoRoot(repoRoot) {
  if (repoRoot) return repoRoot;
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch {
    return process.cwd();
  }
}

function git(command, repoRoot) {
  return execSync(command, { encoding: 'utf8', cwd: resolveRepoRoot(repoRoot) }).trim();
}

// 當前機制指紋：最近一次觸及機制路徑的提交短 SHA。無 git 時回 'unknown'
// （沿 level-audit baseSha 慣例，不讓量測因環境缺 git 而中斷）。
export function currentMechanicsSha(repoRoot) {
  try {
    return git(`git log -1 --format=%h -- ${mechanicPathspec()}`, repoRoot) || 'unknown';
  } catch {
    return 'unknown';
  }
}

// 自報告指紋以來的機制提交清單（新到舊）。報告指紋等於當前值時回空陣列。
export function mechanicCommitsSince(reportSha, repoRoot) {
  if (!reportSha || reportSha === 'unknown') return null;
  try {
    // format 需引號：未引時 shell 會把 `|%s` 解讀為管線接指令 `%s`（實測噴
    // `%s: command not found`，提交主旨遂全數遺失只剩 SHA）。
    const out = git(
      `git log --format='%h|%s' ${reportSha}..HEAD -- ${mechanicPathspec()}`,
      repoRoot,
    );
    if (!out) return [];
    return out.split('\n').map((line) => {
      const [sha, ...rest] = line.split('|');
      return { sha, subject: rest.join('|') };
    });
  } catch {
    return null;
  }
}
