# RateWise UX 2026 實作計畫索引

由 **improve skill** 於 **2026-06-27** 產生，對齊 commit **`e7b7f1ec`** 與 UX spec **v2.3.0**（`docs/superpowers/specs/2026-06-26-ratewise-2026-product-ux-spec.md`）。

**執行方式**：每份計畫為獨立 handoff；executor 僅需該 plan 檔 + repo。完成後更新本表 Status 欄。實作請用 `execute plans/NNN-*.md` 或手動依步驟執行——**本 improve 回合不修改原始碼**。

## 建議執行順序與狀態

| Plan                                        | 標題                      | Priority | Effort | Depends on        | Spec Epic             | Status      |
| ------------------------------------------- | ------------------------- | -------- | ------ | ----------------- | --------------------- | ----------- |
| [001](./001-experiment-branch-bootstrap.md) | 實驗分支 bootstrap        | P1       | S      | —                 | §十四.12              | DONE        |
| [009](./009-agent-orchestration.md)         | Agent 編排與 gh playbook  | P1       | M      | 001               | §三                   | TODO        |
| [002](./002-epic1-hero-trust.md)            | Epic 1 Hero + Trust       | P1       | L      | 001, 009          | E1 / L01,L06,L14      | IN PROGRESS |
| [003](./003-epic2-settings-ssot.md)         | Epic 2 Settings SSOT      | P1       | M      | 001               | E2 / L12,L15          | TODO        |
| [004](./004-epic3-content-distill.md)       | Epic 3 Content Distill    | P1       | M      | 001               | E3 / L09,L13          | IN PROGRESS |
| [005](./005-epic4-multi-ia.md)              | Epic 4 Multi + IA         | P2       | M      | 001, 002          | E4 / L03,L05          | TODO        |
| [006](./006-api-semantics-v2.md)            | API 語意 v2 加法遷移      | P2       | M      | 001               | §二十一               | IN PROGRESS |
| [007](./007-cf-security-headers.md)         | CF Worker 可維護性        | P2       | M      | —                 | Release gate          | IN PROGRESS |
| [008](./008-zeabur-deployment.md)           | Zeabur 部署與 race 防護   | P2       | M      | —                 | §3.5 / Release        | TODO        |
| [010](./010-qa-gate.md)                     | QA 閘門（390×844 + live） | P1       | M      | 002–005, 007, 008 | §十六 / §十四.12 Gate | TODO        |

Status 值：`TODO` | `IN PROGRESS` | `DONE` | `BLOCKED` | `REJECTED`

## 依賴關係圖

```mermaid
flowchart TB
  P001[001 Experiment Bootstrap]
  P009[009 Agent Orchestration]
  P002[002 Epic 1 Hero+Trust]
  P003[003 Epic 2 Settings]
  P004[004 Epic 3 Content]
  P005[005 Epic 4 Multi+IA]
  P006[006 API Semantics v2]
  P007[007 CF Worker]
  P008[008 Zeabur Deploy]
  P010[010 QA Gate]
  MAIN[experiment → main Gate]
  REL[Release + CF purge]

  P001 --> P009
  P001 --> P002
  P001 --> P003
  P001 --> P004
  P001 --> P005
  P001 --> P006
  P009 --> P002
  P002 --> P005
  P002 --> P010
  P003 --> P010
  P004 --> P010
  P005 --> P010
  P007 --> P010
  P008 --> P010
  P010 --> MAIN
  MAIN --> REL

  subgraph parallel["可並行 worktree（001 完成後）"]
    P002
    P003
    P004
    P006
    P007
  end
```

## Plan ↔ Spec ↔ Agent ↔ Experiment 合併序

| 合併序 | experiment 累積                   | Plan         | Spec Epic      | 主責 Agent Lenses                  |
| ------ | --------------------------------- | ------------ | -------------- | ---------------------------------- |
| 0      | rebase `main`                     | 001          | §十四.12       | Tech Lead                          |
| 1      | hotfix hydration（若獨立 PR）     | 002（E1-T5） | E1             | L06 蔡穩屏                         |
| 2      | Epic 1 squash                     | 002          | E1             | L01 林安答、L14 朴顯赫、L08 金墨字 |
| 3      | Epic 2 或 Epic 3（少衝突優先 E3） | 003 / 004    | E2 / E3        | L12/L15、L09/L13                   |
| 4      | Epic 4                            | 005          | E4             | L03 韓多理、L05 羅導航             |
| 5      | API v2（可與 E3 並行開發）        | 006          | §二十一        | Release / Backend                  |
| 6      | Infra 驗證                        | 007, 008     | §3.5 Release   | Release / DevOps                   |
| 7      | Experiment→Main Gate              | 010          | §十四.12 G1–G5 | L06, L20, PM                       |

## 平行 worktree 建議

| Worktree 路徑                                    | Plan          | 分支                             | 可與誰並行                                       |
| ------------------------------------------------ | ------------- | -------------------------------- | ------------------------------------------------ |
| `../ratewise-ux-worktrees/epic1-hero-trust`      | 002           | `feat/ratewise-epic1-hero-trust` | E3、E6、CF（007）                                |
| `../ratewise-ux-worktrees/epic2-settings-ssot`   | 003           | `feat/ratewise-epic2-settings`   | E3、E6；**避免**與 E1 同改 `SingleConverter.tsx` |
| `../ratewise-ux-worktrees/epic3-content-distill` | 004           | `feat/ratewise-epic3-content`    | E1、E2、E6                                       |
| `../ratewise-ux-worktrees/epic4-multi-ia`        | 005           | `feat/ratewise-epic4-multi-ia`   | 需 E1 token 就緒後開工                           |
| `../ratewise-ux-worktrees/api-semantics-v2`      | 006           | `feat/ratewise-api-semantics-v2` | 全 Epic（無 UI 衝突）                            |
| `../ratewise-ux-worktrees/hotfix-hydration`      | 002（子任務） | `fix/ratewise-QA-P0-001`         | 優先 merge 至 experiment                         |

**衝突熱點 SSOT**：`design-tokens.ts`、`SingleConverter.tsx`、`seo-metadata.ts`、`BottomNavigation.tsx`（spec §十四.5）。

## 稽核摘要（vetted findings — commit e7b7f1ec）

| #   | Finding                               | Category       | Impact                                                | Effort | Risk | Evidence                                                                                               |
| --- | ------------------------------------- | -------------- | ----------------------------------------------------- | ------ | ---- | ------------------------------------------------------------------------------------------------------ |
| F1  | ~~實驗分支尚未建立~~ **已 bootstrap** | direction      | experiment @ `567ebd4d`；worktrees epic1/epic3/api/cf | S      | LOW  | `git ls-remote origin experiment/ratewise-ux-2026` 有 ref                                              |
| F2  | 首屏 answer-first 倒置                | direction      | 0 tap 可讀匯率但視線先落金額列                        | L      | MED  | `SingleConverter.tsx:398-422` 早於 `:486+`；`design-tokens.ts:678-709` 同 `text-2xl`                   |
| F3  | Hydration P0 未解                     | correctness    | React #418 阻斷 trust / release gate                  | M      | MED  | `main.tsx:9-10` import `suppress-hydration-warning`                                                    |
| F4  | API buy/sell 銀行視角                 | correctness    | 整合方易反解 customer action                          | M      | LOW  | `latest.json:14-22` `fromCurrencyField: "{rateType}.buy"`；無 `schemaVersion`/`customerBuyForeignRate` |
| F5  | Release 邊界分散                      | architecture   | Zeabur→CF→precache 順序錯易 stale 404                 | M      | MED  | `release.yml:213-241`；`Dockerfile:73-78` 多 app 單映像                                                |
| F6  | 觸控 / nav 未達 44px                  | direction      | WCAG 2.5.8、韓系對標 gap                              | M      | LOW  | `BottomNavigation.tsx:105` `text-[8px]`；`PwaInstallGuide.tsx:16` `1800ms`                             |
| F7  | 內容 thesis 重複                      | docs/direction | curl 賣出價/中間價 keyword=2（目標 ≤1）               | M      | LOW  | spec §十；`seo-metadata.ts` SSOT                                                                       |
| F8  | CF observability 已取樣 10%           | dx             | 符合 044 治理；deploy SOP 需與 UX gate 綁定           | S      | LOW  | `wrangler.jsonc:23-36` `head_sampling_rate: 0.1`                                                       |

## 已考慮並拒絕

- **全面重寫 SingleConverter 為 KoreaTravel fork**：spec §十一 要求 feature flag `legacy|hero-v2`，禁止一次性替換（UX-INC-005）。
- **experiment 直接合 main 跳過 Gate**：違反 §十四.12 G1–G5 與 §3.5 P0 透鏡規則。
- **移除 legacy API buy/sell（M5）**：§二十一 明確 M1–M4 為 additive；breaking 需 Maintainer 另案批准。

## 未稽核範圍

- 各 app 非 ratewise 的 UX（nihonname、split-meow 等）
- 完整 Dependabot / secret scan 細項（CI 已有 gitleaks）
- KoreaTravel 原始碼本體（僅 spec 引用路徑，未納入 repo）
