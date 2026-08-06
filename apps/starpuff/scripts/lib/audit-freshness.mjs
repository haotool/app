import { execSync } from 'node:child_process';

// 量測基準新鮮度（#985 同源病根：隱性契約無守門）——魔王/變身/關卡機制一旦變更，
// 既有 audit 報告的數字即失效，但報告本身不會自曝過時，決策者遂在失效儀器上調參。
// 實例：l28-tf-high 測於 8c389ec04，其後 #953 放寬變身資格、#965 修好「星暴對魔王
// 恆 0 傷」——兩者都直接決定 TTK，報告卻仍被當成現況引用。
//
// 對策：報告寫入「機制指紋」＝最近一次觸及機制路徑的提交 SHA。之後只要比對指紋
// 是否仍等於當前值，即可機械判定報告是否過時，不依賴人工記憶。

// 機制路徑：決定戰鬥數值與時序的來源。呈現層（fx/hud/style）不影響量測結果，
// 故意不納入——否則純視覺改動會讓全部報告誤判過時而稀釋訊號。
export const MECHANIC_PATHS = [
  'apps/starpuff/src/game/logic',
  'apps/starpuff/src/game/systems',
  'apps/starpuff/src/game/core/config.ts',
];

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
    const sha = git(`git log -1 --format=%h -- ${MECHANIC_PATHS.join(' ')}`, repoRoot);
    return sha || 'unknown';
  } catch {
    return 'unknown';
  }
}

// 自報告指紋以來的機制提交清單（新到舊）。報告指紋等於當前值時回空陣列。
export function mechanicCommitsSince(reportSha, repoRoot) {
  if (!reportSha || reportSha === 'unknown') return null;
  try {
    const out = git(
      // format 需引號：未引時 shell 會把 `|%s` 解讀為管線接指令 `%s`（實測噴
      // `%s: command not found`，提交主旨遂全數遺失只剩 SHA）。
      `git log --format='%h|%s' ${reportSha}..HEAD -- ${MECHANIC_PATHS.join(' ')}`,
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

// 單份報告的新鮮度裁決（純函式，供 vitest：不碰 git，由呼叫端注入 commits）。
// fresh：指紋一致；stale：其後有機制提交；unknown：報告無指紋或無法比對。
export function freshnessVerdict(reportSha, currentSha, commitsSince) {
  if (!reportSha || reportSha === 'unknown') return 'unknown';
  if (reportSha === currentSha) return 'fresh';
  if (commitsSince === null) return 'unknown';
  return commitsSince.length > 0 ? 'stale' : 'fresh';
}
