# Plan 009: Agent 編排（20 agents、gh issue/PR、Composer 2.5 Fast 派發序）

> **Drift check**: `git diff --stat e7b7f1ec..HEAD -- docs/superpowers/specs/2026-06-26-ratewise-2026-product-ux-spec.md .github/`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: LOW
- **Depends on**: plans/001-experiment-branch-bootstrap.md
- **Category**: dx | **Planned at**: `e7b7f1ec`, 2026-06-27

## Why this matters

Spec v2.3.0 定義 **20 具名 Agent L01–L20**、§三 Agent 協作管線、§3.10 `gh` playbook、Composer 2.5 Fast 強制、implementer→reviewer 迴圈。無編排則 parallel worktree 會 spec Status 衝突、PR base 錯指向 main、或 lens 缺 review。

## Current state

- Roster: spec §四 L01–L20（林安答…馮驗收）
- Progress SSOT: spec §六 Master Index — **全部 Status=pending**
- Labels: spec §3.10（`ux-lens:L01`, `epic:*`, `experiment:ux-2026`）— plan 001 建立
- Skills 矩陣: spec §二十二 × `.agents/skills/`
- **禁止**: 平行 spreadsheet；禁止直推 main（§五）

## Commands

| Purpose      | Command                                               | Expected     |
| ------------ | ----------------------------------------------------- | ------------ |
| Issues       | `gh issue list --label 'epic:hero-trust' --limit 20`  | Epic backlog |
| Create issue | 見 spec §3.10 `gh issue create` 範本                  | issue #      |
| PR           | `gh pr create --base experiment/ratewise-ux-2026 ...` | PR URL       |
| Review audit | `pnpm review:codex:audit`                             | thread 清單  |

## Scope

**In**:

- GitHub issues 建立（Epic + P0 backlog IDs：HERO-P0-001, QA-P0-001 等，spec §十二）
- Issue/PR 模板片段（`.github/ISSUE_TEMPLATE/` 或 docs-only playbook 若 repo 無 template）
- `docs/superpowers/specs/...` §六 初始 Status 更新為 `in_progress` 當 issue 開立
- Agent dispatch 順序文件（本 plan 輸出或 `plans/agent-dispatch-order.md` — 可併入 README）

**Out**:

- 功能程式碼（plan 002–005）
- `gh pr merge` 未批准 PR
- 修改 Cursor 產品本身

## Agent 派發順序（Composer 2.5 Fast — spec §3.7）

| Wave   | Agents        | Plan      | 解鎖條件                  |
| ------ | ------------- | --------- | ------------------------- |
| W0     | Tech Lead     | 001       | experiment 存在           |
| W1     | L06 蔡穩屏    | 002 E1-T5 | 可與 W2 並行              |
| W1     | L14 朴顯赫    | 002 E1-T2 | —                         |
| W2     | L01 林安答    | 002 E1-T1 | L14 token draft           |
| W2     | L08 金墨字    | 002       | L01 DOM 方向定案          |
| W3     | L11 方觸達    | 002+010   | E1 互動元件就緒           |
| W3     | L17 高信任    | 002 E1-T3 | L06 console=0             |
| W4     | L09 白精煉    | 004       | 獨立 worktree             |
| W4     | L12/L15       | 003       | 獨立 worktree             |
| W5     | L03/L05       | 005       | E1 merged to experiment   |
| W6     | L20 馮驗收    | 010       | E1–E4 on experiment       |
| Review | code-reviewer | 各 PR     | implementer self-check 後 |

**Prompt 前綴**（spec §3.8 — 每 Task MUST 包含）:

```text
[Agent Contract]
- Model: Composer 2.5 Fast（強制）
- Lens: L0N · {Codename} · {姓名}
- Spec SSOT: docs/superpowers/specs/2026-06-26-ratewise-2026-product-ux-spec.md
- Branch: experiment/ratewise-ux-2026
- Handoff: §3.6 YAML schema
```

## Steps

### Step 1: 建立 Epic issues（4 + P0）

依 spec §3.10 範本建立：

- `HERO-P0-001` → L01, epic:hero-trust, severity:p0
- `QA-P0-001` → L06, severity:p0
- `TYP-P2-001` / display → L14, severity:p0
- Epic 2–4 umbrella issues

**Verify**: `gh issue list --label severity:p0` ≥3

### Step 2: 建立 Agent dispatch 對照表

寫入 `plans/README.md` 或 spec §六 旁註 — Plan ID ↔ Lens ↔ Issue #

### Step 3: PR 模板強制欄位

PR body MUST 含：Lens IDs、spec §引用、Test plan checkbox、handoff YAML

### Step 4: Review 迴圈 SOP

每 Epic PR ready 前：

1. implementer self-check §七 Acceptance
2. Task `code-reviewer` readonly（spec §3.9）
3. `pnpm review:codex:audit` → resolve threads

**Verify**: 試跑 audit script exit 0

### Step 5: Spec progress 治理

PM 規則：多 worktree 改 spec → **串行 merge**（§14.7）

## Test plan

- 無 code test；驗證 gh issue/label 存在

## Done criteria

- [ ] P0 issues 已建立並連結 plan 002
- [ ] Labels 完整（001 或本 plan）
- [ ] Dispatch order 文件化
- [ ] §3.10 gh 範本可複製執行
- [ ] 001 experiment 已完成

## STOP conditions

- 無 `gh auth` → 輸出 markdown 範本供 Maintainer 手動建立
- org 禁止 bulk label create → 逐一手動

## Maintenance notes

- Sprint gate §3.5：L01/L06/L14 全 done 才 minor release
- Transcript 索引可選：`agent-transcripts/<uuid>.jsonl`（spec §3.6）
