# Plan 007: Cloudflare security-headers 可維護性（wrangler、observability、deploy SOP）

> **Drift check**: `git diff --stat e7b7f1ec..HEAD -- security-headers/wrangler.jsonc security-headers/src/worker.js docs/DEPLOYMENT.md`

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: MED
- **Depends on**: none（可與 UX Epic 並行）
- **Category**: dx | **Planned at**: `e7b7f1ec`, 2026-06-27
- **Audit**（2026-06-27, stream 4）：**PARTIAL PASS** — worker v5.4 四處同步、COEP 邊界 live 驗證 OK、observability 0.1；gap：`release.yml` Worker 步驟在 Wait 之前（L197 vs L213）、`045` checklist 未建、`release.yml` 未用 `--minify`。DEPLOY.md 已補 release 順序與 COEP curl。

## Why this matters

RateWise release 必須 **app（Zeabur）→ app-version probe → Worker deploy → CF purge → live precache**（AGENTS.md）。Worker v5.4 處理 CSP/COEP（HTML only，v3.9 修 PWA precache）；observability 已設 10% 取樣（044 治理）。SOP 分散於 AGENTS.md、DEPLOYMENT.md、release.yml，UX experiment→main gate G3 需可執行 checklist。

## Current state

**wrangler.jsonc** (`security-headers/wrangler.jsonc`):

- routes: `app.haotool.org/*`, `haotool.org/*`, `www.haotool.org/*`
- `observability.head_sampling_rate: 0.1`（L23-36）
- `compatibility_date: "2026-06-01"`

**worker.js** (`security-headers/src/worker.js`):

- L33: `SECURITY_POLICY_VERSION = '5.4'`
- L650: HTML branch `Cross-Origin-Embedder-Policy: require-corp`
- 變更記錄 v5.4: SW 檔 no-store

**release.yml** L200-211: wrangler deploy；缺 secret 則 skip（**不得假設 edge 已同步**）

**Context7**（wrangler deploy/observability）: Cloudflare 官方 wrangler-action / Pages action 文件存在；observability 取樣應保持 ≤10% 以符合 Workers 配額（`docs/dev/044_workers_quota_governance_spec.md`）。

## Commands

| Purpose              | Command                                                                                                                                         | Expected                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --- | ----------------------------------- | ------------------ |
| Whoami               | `cd security-headers && npx wrangler whoami`                                                                                                    | 已登入或明確 token 錯誤   |
| Deploy（Maintainer） | `cd security-headers && npx wrangler deploy`                                                                                                    | Worker published          |
| 驗證 GET             | `curl -s --compressed https://app.haotool.org/ratewise/ -D - -o /dev/null \| rg -i 'x-security-policy-version\|cross-origin-embedder'`          | version 5.4；HTML 有 COEP |
| JS asset 無 COEP     | `curl -sI "https://app.haotool.org/ratewise/assets/$(curl -s https://app.haotool.org/ratewise/ \| rg -o 'assets/[^"]+\.js' \| head -1 \| sed 's | assets/                   |     | ')" \| rg -i cross-origin-embedder` | **無** COEP header |
| Precache             | `VERIFY_PRECACHE_SOURCE=live VERIFY_BASE_URL=https://app.haotool.org/ratewise/ node scripts/verify-precache-assets.mjs`                         | ≥50 items                 |

## Scope

**In**:

- `security-headers/wrangler.jsonc`（僅 observability 註解/文件化調整，**不**擅自改 0.1 取樣除非 044 修訂）
- `security-headers/src/worker.js` — 僅當 UX/CSP 需求明確（本 plan 預設 **docs-only + checklist**）
- 新增 `docs/dev/045_cf_worker_ux_release_checklist.md` 或擴充 DEPLOYMENT.md §Release（**docs only**）
- `scripts/ratewise-production-release.mjs` 註解（若缺 Worker 步驟說明）

**Out**:

- Cloudflare Dashboard Transform Rules（需人工 backup，user preference）
- 降低 observability 至 0.001 除非 044 修訂 PR
- RateWise app 原始碼

## Steps

### Step 1: 稽核 worker 版本四處同步

確認 v5.4 在：JSDoc 標題、變更記錄、`__network_probe__` header、主回應 `x-security-policy-version`（AGENTS.md Worker SOP）。

**Verify**: `rg '5\.4' security-headers/src/worker.js` 至少 2 處一致

### Step 2: 撰寫 UX Release CF Checklist（docs）

建立 checklist 含：

1. `curl` app-version probe
2. `wrangler deploy`（或 release.yml）
3. purge prefix 清單（`/ratewise/`, `sw.js`, `manifest.webmanifest`, `assets`, `workbox-`）
4. live precache 重跑
5. stale edge 404 判定（querystring 200 原 URL 404 → purge）

**Verify**: markdown 連結至現有 `038_ratewise_cloudflare_audit_workflow.md`

### Step 3: 驗證 COEP 邊界（PWA）

對 HTML vs hashed JS 各 curl 一次；記錄於 checklist。

**Verify**: JS 無 COEP；HTML 有 COEP（ratewise document）

### Step 4: release.yml 對齊檢查

確認 Worker deploy 在 **Wait for Zeabur** 之後、purge 之前（`.github/workflows/release.yml:209-234` 順序正確）。

若順序錯誤 → 最小 PR 修正 workflow（需 CI 驗證）

### Step 5: Observability 治理註記

wrangler.jsonc 註解引用 044；確認 `head_sampling_rate: 0.1` 與 AGENTS.md 一致。

**Verify**: 044 文件與 wrangler 數值一致

## Test plan

- 無 unit test；以 curl + verify-precache 為證據
- 可選：root `pnpm test:root` lighthouse-production 不受影響

## Done criteria

- [ ] CF UX release checklist 文件 merged
- [ ] COEP 邊界 curl 證據存於 PR 或 `screenshots/`（不 commit secret）
- [ ] worker 版本四處一致
- [ ] release workflow 順序已確認或修正

## STOP conditions

- `wrangler deploy` 需 production token 且 executor 無權 → 完成 docs + skip deploy，標 BLOCKED
- curl 顯示 worker 版本與 repo 不一致 → 停止，需 purge 後重測（勿盲目 bump 版本）

## Maintenance notes

- 任何 worker 行為變更 MUST 同步 4 處版本號
- UX experiment→main 仍走 plan 010 G3 live precache
