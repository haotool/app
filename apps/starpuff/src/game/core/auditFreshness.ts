// 量測基準新鮮度判定（純邏輯，不碰 git／fs）——沿 repo SSOT 慣例：純函式住 src、
// 腳本經 ts-bridge 引用，禁止在 scripts 內維護第二份規則。
//
// 動機：audit 報告的數字是平衡決策依據，但機制變更後報告不會自曝過時。實例——
// l28-tf-high 測於 8c389ec04，其後 #953 放寬變身資格、#965 修好「星暴對魔王恆
// 0 傷」，TTK 已不可比，該報告的結論卻仍被當成現況引用。
//
// 刻意置於 core/ 而非 logic/：本檔若住在機制路徑內，改動守門定義本身就會作廢
// 全部基準（自我指涉）——而調整守門並不改變遊戲數值。

// 機制路徑：決定戰鬥數值與時序的來源。呈現層（fx/hud/style）不納入——純視覺
// 改動若作廢全部報告，訊號會被稀釋成雜訊。
export const MECHANIC_PATHS: readonly string[] = [
  'apps/starpuff/src/game/logic',
  'apps/starpuff/src/game/systems',
  'apps/starpuff/src/game/core/config.ts',
];

// 測試檔與機制同住 logic/、systems/，但不改變遊戲行為。若計入指紋，「補一個
// 測試」就會作廢全部基準——本守門導入當下即自證（新增 auditFreshness.test.ts
// 令 21 份報告全數誤判過時）。以 git 排除 pathspec 剔除。
export const MECHANIC_EXCLUDES: readonly string[] = [':(exclude)**/*.test.ts'];

export interface MechanicCommit {
  sha: string;
  subject: string;
}

export type FreshnessVerdict = 'fresh' | 'stale' | 'unknown';

// 單份報告的新鮮度裁決。fresh：指紋一致或其後無機制提交；stale：其後有機制提交；
// unknown：報告無指紋或無法比對——一律不得默認為新鮮（守門寧可誤報也不漏報）。
export function freshnessVerdict(
  reportSha: string | undefined,
  currentSha: string,
  commitsSince: readonly MechanicCommit[] | null,
): FreshnessVerdict {
  if (!reportSha || reportSha === 'unknown') return 'unknown';
  if (reportSha === currentSha) return 'fresh';
  if (commitsSince === null) return 'unknown';
  return commitsSince.length > 0 ? 'stale' : 'fresh';
}

// git pathspec 組裝：機制路徑 + 排除規則，各自加引號避免 shell 展開。
export function mechanicPathspec(): string {
  return [...MECHANIC_PATHS, ...MECHANIC_EXCLUDES].map((p) => `'${p}'`).join(' ');
}
