# Plan 001: 建立 experiment/ratewise-ux-2026 實驗分支與 worktree 閘門

> **Executor instructions**: 依序執行每步；每步 verification 通過後再進下一步。若觸發 STOP conditions，停止並回報，勿自行改規格。
>
> **Drift check (run first)**: `git diff --stat e7b7f1ec..HEAD -- docs/superpowers/specs/2026-06-26-ratewise-2026-product-ux-spec.md .github/workflows/ci.yml`
> 若 in-scope 檔案已大幅變更，比對本 plan「Current state」後再執行。

## Status

- **Status**: DONE（Stream 0 bootstrap 2026-06-27）
- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `e7b7f1ec`, 2026-06-27

## Why this matters

UX spec v2.3.0 §十四.12 規定：**所有 Epic PR 的 base 必須是 `experiment/ratewise-ux-2026`，而非 `main`**，直至 Experiment→Main Gate 全 Pass。截至 plan 撰寫時，`git ls-remote origin experiment/ratewise-ux-2026` **無輸出**——實驗線尚未 bootstrap，後續 20 agent / 4 Epic 無法依 SSOT 合流。

## Current state

- **Spec SSOT**: `docs/superpowers/specs/2026-06-26-ratewise-2026-product-ux-spec.md` §十四.12 含建立命令與 merge order。
- **遠端分支**: `experiment/ratewise-ux-2026` **不存在**（recon 時 `git ls-remote` 空）。
- **Worktree 根目錄 SSOT**: `../ratewise-ux-worktrees/`（相對 repo root `Tools/app`）。
- **Open PR 與 main 線**（spec §十三）：#446 release、#433 Lighthouse blocking——experiment 應自 **最新 main** 建立，release 合併後 rebase experiment（spec Q1 建議 A）。

## Commands you will need

| Purpose       | Command                                                    | Expected on success     |
| ------------- | ---------------------------------------------------------- | ----------------------- |
| Install       | `pnpm install --frozen-lockfile`                           | exit 0                  |
| Typecheck     | `pnpm typecheck`                                           | exit 0                  |
| 確認分支      | `git ls-remote --heads origin experiment/ratewise-ux-2026` | 一行 SHA ref            |
| Worktree 列表 | `git worktree list`                                        | 含 experiment base path |

## Scope

**In scope**:

- 建立並 push `experiment/ratewise-ux-2026`
- 新增 `.github/workflows/` 或 `docs/` 中 **experiment 分支保護說明**（若 repo 尚無 CI 對 experiment 的 path filter，僅加 README 片段於 `plans/` 或更新 spec 進度——**本 plan 優先最小 diff：只建分支 + 可選 issue template labels 文件**）
- 建立第一個 worktree 範例（epic1）供後續 plan 002 使用
- 更新 `plans/README.md` 001 列 Status

**Out of scope**:

- Epic 功能實作（plan 002–005）
- 修改 `main` 上已 open 的 PR base
- `gh pr merge` 任何 PR（需 Maintainer）
- 修改 ratewise 原始碼

## Git workflow

- **建立 experiment**（Maintainer 或具 push 權限者）:
  ```bash
  git fetch origin main
  git checkout -b experiment/ratewise-ux-2026 origin/main
  git push -u origin experiment/ratewise-ux-2026
  ```
- **Epic feature 分支**（executor 後續）: `feat/ratewise-epic{N}-{slug}` from `origin/experiment/ratewise-ux-2026`
- Commit 範例（repo 慣例）:

  ```
  chore(ci): 新增 UX experiment 分支保護說明

  - 建立 experiment/ratewise-ux-2026 tracking
  - 文件化 worktree SSOT 路徑

  測試：git ls-remote 確認遠端分支存在
  ```

## Steps

### Step 1: 確認 main 與 open release 狀態

```bash
git fetch origin main
git rev-parse --short origin/main
gh pr list --state open --limit 10 --json number,title,headRefName,baseRefName
```

記錄 origin/main SHA；若 #446 已 merge，experiment 應基於該 SHA 建立。

**Verify**: `git log -1 --oneline origin/main` 有輸出

### Step 2: 建立並 push experiment 分支

```bash
cd /path/to/Tools/app  # 替換為實際 repo root
git fetch origin main
git branch experiment/ratewise-ux-2026 origin/main 2>/dev/null || git checkout experiment/ratewise-ux-2026
git push -u origin experiment/ratewise-ux-2026
```

**Verify**: `git ls-remote --heads origin experiment/ratewise-ux-2026` → 非空

### Step 3: 建立 worktree 目錄與 Epic 1 範例

```bash
REPO=$(git rev-parse --show-toplevel)
WT="$REPO/../ratewise-ux-worktrees"
mkdir -p "$WT"
git fetch origin experiment/ratewise-ux-2026
git worktree add "$WT/epic1-hero-trust" -b feat/ratewise-epic1-hero-trust origin/experiment/ratewise-ux-2026
cd "$WT/epic1-hero-trust" && pnpm install --frozen-lockfile
```

**Verify**: `git worktree list | rg epic1-hero-trust` 有列；`pnpm --filter @app/ratewise typecheck` exit 0

### Step 4: 建立 GitHub labels（可選但 spec §3.10 建議）

```bash
gh label create "experiment:ux-2026" --description "UX 2026 experiment branch work" --color "5319E7" 2>/dev/null || true
gh label create "epic:hero-trust" --color "0E8A16" 2>/dev/null || true
gh label create "epic:settings-ssot" --color "0E8A16" 2>/dev/null || true
gh label create "epic:content-distill" --color "0E8A16" 2>/dev/null || true
gh label create "epic:multi-ia" --color "0E8A16" 2>/dev/null || true
for i in $(seq -w 1 20); do gh label create "ux-lens:L$i" --color "1D76DB" 2>/dev/null || true; done
```

**Verify**: `gh label list | rg 'experiment:ux-2026|epic:hero-trust'` 有匹配

### Step 5: 更新 plans 索引

將 `plans/README.md` plan 001 Status 改為 `DONE`（若由 reviewer 維護則跳過）。

**Verify**: README 001 列為 DONE

## Test plan

- 無新增 vitest；驗證以 git/gh 命令為主。
- 可選：在 epic1 worktree 跑 `pnpm --filter @app/ratewise test -- seo-ssot` 確認 baseline 綠。

## Done criteria

- [ ] `git ls-remote --heads origin experiment/ratewise-ux-2026` 非空
- [ ] `../ratewise-ux-worktrees/epic1-hero-trust` 存在且 typecheck 通過
- [ ] 未修改 `apps/ratewise/src/**`（除非僅 docs）
- [ ] `plans/README.md` 001 = DONE

## STOP conditions

- 無權 `git push origin experiment/ratewise-ux-2026` → 停止，請 Maintainer 執行 Step 2
- `origin/main` 與本地 main 嚴重分歧且無法 fast-forward → 停止，回報 merge 策略
- worktree path 已存在且指向錯誤分支 → 停止，列出 `git worktree list` 供人工決策

## Maintenance notes

- 每次 #446 或 #433 merge 至 main 後，Tech Lead 應 `git fetch && git rebase origin/main` on experiment（spec §14.3）。
- experiment→main 單 PR 由 plan 010 gate 通過後執行，禁止跳過。
