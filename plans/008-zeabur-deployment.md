# Plan 008: Zeabur 生產部署（Dockerfile、deployment race 防護）

> **Drift check**: `git diff --stat e7b7f1ec..HEAD -- Dockerfile nginx.conf .github/workflows/release.yml scripts/ratewise-production-release.mjs`

## Status

- **Priority**: P2 | **Effort**: M | **Risk**: MED
- **Depends on**: none
- **Category**: architecture | **Planned at**: `e7b7f1ec`, 2026-06-27
- **Audit**（2026-06-27, stream 4）：**PARTIAL PASS** — Dockerfile/nginx 結構 OK、wait script 以 app-version probe + exit 1；gap：`docs/ZEABUR_DEPLOYMENT.md` 仍為 generic 模板、`DEPLOYMENT.md` base image 敘述過時（alpine vs stable）、HEALTHCHECK 測 `/` 非 `/ratewise/`、wait 未比對 GitHub deployments active SHA。

## Why this matters

正式站 `app.haotool.org` 由 **Zeabur Docker** 托管（`Dockerfile` 多 stage build 6 apps）；Cloudflare Worker 在前。Release workflow 已含 `Wait for RateWise production deployment`（`release.yml:213-218`）以防 **deployment race**（較舊 SHA 覆蓋 release SHA，AGENTS.md UX-INC 類問題）。`docs/ZEABUR_DEPLOYMENT.md` 為通用模板，與 repo 實際 Dockerfile/nginx 部分脫節。

## Current state

**Dockerfile**:

- builder: Node 24 alpine, `pnpm build:ratewise` 等（L73-78）
- runtime: nginx:stable, ratewise at `/usr/share/nginx/html/ratewise-app` → symlink `/ratewise`（L106-125）
- HEALTHCHECK wget `:8080/`（L139-140）
- `HUSKY=0`, `NODE_ENV=` 於 install（L53-54）— Zeabur production 陷阱已註解

**nginx.conf**: SPA rewrites（DEPLOYMENT.md 引用）

**release.yml**: `scripts/ratewise-production-release.mjs` — wait / purge actions

**Zeabur config**: repo **無** `zeabur.json`；部署偵測 Dockerfile（ZEABUR_DEPLOYMENT.md L35）

## Commands

| Purpose            | Command                                                                                                           | Expected |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | -------- |
| Local docker build | `docker build -t ratewise:local .`                                                                                | exit 0   |
| Health             | `docker run --rm -p 8080:8080 ratewise:local & sleep 5 && curl -sI http://127.0.0.1:8080/ratewise/`               | 200      |
| Deployments API    | `gh api repos/haotool/app/deployments --jq '.[0:3] \| .[] \| {sha: .sha[0:7], env: .environment, state: .state}'` | 最新 SHA |
| Wait script        | `RATEWISE_RELEASE_ACTION=wait RATEWISE_EXPECTED_VERSION=x.y.z node scripts/ratewise-production-release.mjs`       | 依版本   |

## Scope

**In**:

- `docs/ZEABUR_DEPLOYMENT.md` 或 `docs/DEPLOYMENT.md` — 對齊實際 Dockerfile/nginx/ratewise path
- `scripts/ratewise-production-release.mjs` — 若 wait logic 缺 active SHA 比對，最小修正
- `.github/workflows/release.yml` 註解/clarify（若 race 仍發生）
- 可選：`Dockerfile` HEALTHCHECK 改測 `/ratewise/`（若 `/` 非 ratewise）

**Out**:

- Zeabur 控制台手動改 region/scale
- experiment 分支部署（experiment 用 preview CI 即可）

## Steps

### Step 1: 文件 SSOT 對齊

更新 Zeabur 章節：

- 建置命令 = Dockerfile 自動
- 端口 8080
- ratewise 路徑 `/ratewise/` symlink 機制
- 環境變數：`GIT_COMMIT_*`, `BUILD_TIME`, `VITE_RATEWISE_BASE_PATH=/ratewise/`
- 與 release race SOP 交叉連結 AGENTS.md

**Verify**: 文件中的 path 與 `Dockerfile:121-125` 一致

### Step 2: 稽核 ratewise-production-release.mjs

讀 script：wait 是否比對 GitHub deployments **active SHA** vs release tag SHA；失敗時是否 exit 1（非 warn）

**Verify**: 乾跑 `--help` 或讀源碼確認 `RATEWISE_RELEASE_ACTION=wait` 行為

### Step 3: Deployment race 演練（read-only）

release 後執行：

```bash
gh api repos/haotool/app/deployments --jq '.[] | select(.environment=="Production" or .environment=="production") | {sha: .sha[0:7], created_at, state}' | head
curl -sI https://app.haotool.org/ratewise/ | rg -i app-version
```

記錄是否一致。

### Step 4: Docker build smoke（CI 已有 scan job）

本地或 rely on `ci.yml` docker scan job（L474+）

**Verify**: `ci.yml` security scan job 仍 build `ratewise:ci-scan`

### Step 5: Experiment 與 main 解耦確認

文件註明：UX experiment **不**觸發 production Zeabur；僅 main release push 部署。

## Test plan

- Docker build + curl `/ratewise/`
- 無新增 vitest unless script 變更 → 加 script unit test

## Done criteria

- [ ] DEPLOYMENT/Zeabur 文件與 Dockerfile 一致
- [ ] deployment race 診斷步驟可執行
- [ ] release wait 步驟行為已文件化或修正
- [ ] 無 secrets 寫入 docs

## STOP conditions

- wait script 需 GitHub secret 不可用 → 文件化 manual SOP only
- docker build 失敗需改 monorepo 依賴 → 停止，另開 build fix PR

## Maintenance notes

- 連續 merge release PR + 一般 PR 前必須確認前一 deployment 完成（AGENTS.md）
- UX minor release 走 experiment→main 後才 Zeabur（plan 010）
