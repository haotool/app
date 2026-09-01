# Monorepo 靜態站台部署指南（含 Park-Keeper）

> 最小可行部署方案 - 基於 Docker 多階段構建與 Nginx

## 快速開始

### 本地開發

```bash
# 安裝依賴
pnpm install

# 開發模式
pnpm dev

# 執行測試
pnpm test

# 建置生產版本（可單獨建置 Park-Keeper）
pnpm build:ratewise
pnpm build:park-keeper
```

### Docker 部署

#### 1. 建置 Docker 映像

```bash
# 建置映像
docker build -t ratewise:latest .

# 或使用 docker-compose
docker-compose build
```

#### 2. 啟動容器

```bash
# 使用 docker-compose (推薦)
docker-compose up -d

# 或直接使用 docker
docker run -d -p 8080:8080 --name ratewise ratewise:latest
```

#### 3. 驗證部署

```bash
# 檢查容器狀態
docker ps

# 檢查健康狀態
curl http://localhost:8080/health

# 訪問應用
open http://localhost:8080
open http://localhost:8080/park-keeper/
```

#### 4. 停止容器

```bash
# 使用 docker-compose
docker-compose down

# 或直接使用 docker
docker stop ratewise && docker rm ratewise
```

### Vercel Docker 部署（GitHub monorepo）

Vercel 使用根目錄的 `Dockerfile.vercel` 建置同一個多 app Nginx image；不要把
`docker-compose.yml` 當成 Vercel 部署目標。Vercel container 使用 port `80`，而 Zeabur
既有 Dockerfile 維持 port `8080`，兩者共用同一份 `nginx.conf` 路由政策。

#### Vercel Project 設定

1. 從 GitHub 匯入 `haotool/app`，Root Directory 保持 repo root。
2. Framework Preset 選 `Other`，讓 Vercel 使用 `Dockerfile.vercel`。
3. Production Branch 設為 `main`；Pull Request 與其他 branch 保留 Preview Deployment。
4. 僅設定必要的公開 build variables；不得放入 Cloudflare token、KV secret 或其他私密值。
5. 先使用 Vercel `*.vercel.app` Production URL 做 origin 驗證，不要先把公開網域直連 Vercel。

#### GitHub 自動部署

連結 GitHub 後，Vercel 會在 push 與 Pull Request 建立 deployment。主網域仍由 Cloudflare
`security-headers` Worker 接收；完成 Preview／Production 驗證後，才在 Worker Variables
設定非機密的 `VERCEL_ORIGIN=https://<vercel-project>.vercel.app`。

#### Vercel origin 切換與回退

```text
使用者 → Cloudflare security-headers → Vercel Dockerfile.vercel → Nginx 多 app 靜態站
                         └──────────→ Cloudflare rating-api Worker + KV
```

切換前必須驗證根站、所有子 app、SEO 文件、PWA service worker、`/health`、404、redirect、
CSP／HSTS 與 `/ratewise/api/ratings`。移除 `VERCEL_ORIGIN` 並重新部署
`security-headers` 即可回到原 Zeabur origin。

### Cloudflare Pages Direct Upload（目前遷移目標）

靜態前端使用根目錄 `scripts/build-pages.mjs` 將 8 個 app 組裝至單一
`.pages-dist/`，再由 GitHub Actions 以 Wrangler Pages Direct Upload 部署至
`haotool-static`。這條流程不使用 `docker-compose.yml`，也不把
`rating-api` 或 Cloudflare KV 搬入 Pages。

```bash
pnpm install --frozen-lockfile
pnpm build:pages
npx wrangler pages deploy .pages-dist \
  --project-name haotool-static \
  --branch main
```

`.github/workflows/deploy-pages.yml` 僅讓 `main` push 建立 production deployment，
同 repo 非 Dependabot Pull Request 建立 preview deployment；`data` branch、單獨的 Worker／API、
Docker 或其他 CI workflow 變更不會觸發 Pages 前端部署。Fork 與 Dependabot PR 會安全略過部署，
避免把 Cloudflare secret 暴露給無法取得或不受信任的工作流程；Cloudflare secrets 只在實際
Wrangler deploy step 注入，Wrangler 安裝／驗證、build 與 parity step 無法讀取。main push
會先部署 `candidate-<commit-sha>` branch，contract-only parity 通過後才第二次部署 `main` production，
避免未驗證產物先成為正式 alias。

`haotool-static` 保留 GitHub repository 連線作為狀態與權限整合，但 Cloudflare Pages Git
integration 的自動 Production／Preview deployment 必須停用；否則會與本 workflow 產生
雙重 build。需要手動重跑目前 `main` 時，使用 workflow dispatch 並限定 `main` ref。
Pages Git integration 的保留設定仍對齊 `pnpm build:pages` 與 `.pages-dist/`，避免日後誤開自動部署時
回到錯誤的 root `npm run build`／`dist`。

Vercel 仍可在觀察期保留原有 GitHub deployment；根目錄 `vercel.json` 會讓
`data` branch 的 Vercel build 以 exit code 0 略過，其他 branch 維持建置。這個設定
必須在變更合併至 GitHub 後才會對遠端 Vercel 專案生效。

Pages 不直接接正式 DNS。正式請求仍由 Cloudflare `security-headers` Worker
接收，Worker 的靜態 origin 在 preview、SEO、PWA、header 與 API 驗證完成後才切換；
`STATIC_ORIGIN` 保留前一個 origin 作為回退，且 Vercel 與 Zeabur 至少觀察 24–48 小時。

Pages assembly 另外保留 `/health` 的 `healthy` 回應，與現有 Nginx health check 相容；此端點
不代表 Worker、Rating API 或 KV 已健康，三者仍須分開驗證。

Cloudflare Web Analytics 必須在 Cloudflare Dashboard 的 Pages project → Metrics → Web Analytics
啟用；Cloudflare 會在下一次 Pages deployment 自動注入 beacon。由於正式流量仍會經過
`security-headers` Worker，切換後必須以公開網域的 GET 確認 beacon、CSP 與 `/cdn-cgi/rum` 沒有被
Worker 的 HTML rewrite 或快取政策阻擋。這個 infrastructure 變更保留既有隱私文案以維持 SEO
parity；Analytics 供應商文案應在實際啟用 Pages Analytics 後另開內容變更同步。

### Pages 驗證

```bash
node scripts/build-pages.mjs
pnpm exec node scripts/verify-pages-seo-parity.mjs \
  --candidate-url=https://<pages-preview>.pages.dev \
  --contract-only \
  --api-url=https://app.haotool.org/ratewise/api/ratings
```

驗證器從各 app config 與 RateWise SEO SSOT 動態取得 URL，contract-only 模式檢查
canonical／og:url host、狀態碼、HTML metadata 存在性、sitemap、robots、llms、PWA、
precache 與安全標頭；它不以 Pages hostname 取代正式 canonical，也不將未知路徑導向首頁。
不帶 `--contract-only` 時仍可做一次性 candidate 與既有 production 的內容 parity 比對；CI
不使用該模式，避免合法的同 PR SEO 內容變更被 live baseline 錯誤阻擋。

## 技術規格

### 環境要求

- **Node.js**: >= 24.0.0
- **pnpm**: 9.10.0
- **Docker**: >= 20.10 (可選)

### 建置產物

| 檔案       | 大小      | Gzip 大小 |
| ---------- | --------- | --------- |
| index.html | 0.48 KB   | 0.31 KB   |
| CSS        | 17.76 KB  | 3.81 KB   |
| JavaScript | 214.82 KB | 67.02 KB  |

### Docker 映像

- **Base Image**: node:24-alpine (建置), nginx:alpine (生產)
- **Final Image Size**: ~50 MB
- **Build Time**: ~30 秒
- **Security**: Non-root user (nodejs:1001)

## 生產環境配置

### Nginx 配置重點

- ✅ SPA 路由支援 (fallback to index.html)
- ✅ Gzip 壓縮啟用
- ✅ 靜態資源快取 (1 year immutable)
- ✅ **[critical] Service Worker 零快取** (sw.js, workbox-\*.js 永遠不快取)
- ✅ **[critical] PWA Manifest 動態更新** (manifest.webmanifest 不快取)
- ✅ Health check endpoint (/health)
- ✅ 最小安全標頭 (X-Content-Type-Options, X-Frame-Options)
- ✅ 子路徑靜態檔（`/ratewise/*`、`/nihonname/*`、`/quake-school/*`、`/park-keeper/*` 的 `manifest.webmanifest` / `robots.txt` / `llms.txt` / `sitemap.xml`）具專屬 `location` 規則，避免被 SPA fallback 攔截
- ✅ `/ratewise`（無尾斜線）直返 SPA 入口，避免 Nginx 自動 301 導至 `:8080`

### Cache 驗證流程

依照 [web.dev Service Worker Lifecycle][ref:web.dev-service-worker:2025-11-09] 與 [nginx add_header 指南][ref:nginx-headers:2025-11-09]，所有 Service Worker 腳本與 `index.html` 必須以 `Cache-Control: no-cache` 送出。部署前請在 Docker 容器內實際驗證（以下示範 RateWise 與 Park-Keeper）：

```bash
docker build -t ratewise:test .
docker run -d --rm -p 8080:8080 --name ratewise-test ratewise:test

# Service Worker / registerSW / manifest
curl -I http://localhost:8080/ratewise/sw.js | grep -i cache-control
curl -I http://localhost:8080/ratewise/registerSW.js | grep -i cache-control
curl -I http://localhost:8080/ratewise/manifest.webmanifest | grep -i cache-control

# 入口文件
curl -I http://localhost:8080/ratewise/index.html | grep -i cache-control

# Park-Keeper Service Worker / registerSW / manifest
curl -I http://localhost:8080/park-keeper/sw.js | grep -i cache-control
curl -I http://localhost:8080/park-keeper/registerSW.js | grep -i cache-control
curl -I http://localhost:8080/park-keeper/manifest.webmanifest | grep -i cache-control

# Park-Keeper 入口文件與 SSG 子頁面
curl -I http://localhost:8080/park-keeper/index.html | grep -i cache-control
curl -I http://localhost:8080/park-keeper/settings/ | head -n 5
curl -I http://localhost:8080/park-keeper/about/ | head -n 5
```

預期輸出：

- `sw.js` / `registerSW.js`: `Cache-Control: no-cache, no-store, must-revalidate`
- `manifest.webmanifest` 與 `index.html`: `Cache-Control: no-cache, must-revalidate`

若未符合，請確認 `nginx.conf` 的 Service Worker / `index.html` 正則是否包含對應子路徑（例如 `/park-keeper/*`），再行建置。

### CDN Purge 需求

`pnpm purge:cdn` 會根據 `zeabur` CLI 或 Cloudflare API 清除 `/ratewise/sw.js`、`registerSW.js`、`manifest.webmanifest`、`index.html` 與 `workbox-*` 前綴。未設定認證時指令會以非 0 結束並列出需手動清除的 URL，避免錯誤的成功訊息。

- Zeabur：請先安裝 CLI 並登入。
- Cloudflare：設定 `CLOUDFLARE_ZONE_ID` 與 `CLOUDFLARE_API_TOKEN`。
- 無 API 時：依腳本輸出清單於 CDN 後台手動操作。

### Zeabur 服務層 Dockerfile 覆寫治理

> 2026-07-14 P0 事故：Zeabur service `app` 的 `spec.source.dockerfile` 殘留排障期間貼入的舊版覆寫，完全取代 repo `Dockerfile`，導致 main 新程式碼（如 `apps/starpuff`）未進入生產映像而 404。

- **必須（MUST）**：Zeabur 服務層 `spec.source.dockerfile` 非空時，**完全覆蓋** repo 根目錄 `Dockerfile` 與 `zbpack.json` 指向的建置定義；平台不會合併兩者，也不會自動同步 repo 更新。
- **必須（MUST）**：排障期間若曾透過 Dashboard 或 GraphQL 貼入臨時 Dockerfile，收工時必須清空覆寫以恢復 repo SSOT，再觸發 redeploy。清空範例（不含 token）：
  ```graphql
  mutation {
    updateDockerfile(serviceID: "<SERVICE_ID>", dockerfile: "") {
      ok
    }
  }
  ```
- **必須（MUST）**：部署異常（GH/Zeabur 顯示 success 但新路徑 404、或 build log 與預期不符）時，比對 Zeabur build log 建置鏈與 repo `Dockerfile`：以 `rg "pnpm build:" Dockerfile` 列出預期步驟，對照 log 是否缺漏（例如缺 `pnpm build:starpuff` 或 stage-1 `COPY` 步數不符）。
- **建議（RECOMMENDED）**：變更 Zeabur 服務設定（Dockerfile 覆寫、環境變數、build 參數）前，先讀出並保存當前設定備份（例如 GraphQL `service { spec { source { dockerfile } } }` 或 Dashboard 匯出），以便事故後比對與還原。

### Release Workflow 與 Cloudflare Worker 同步

- `Release` workflow 在 `main` push 時，會先嘗試部署 `security-headers/wrangler.jsonc` 對應的 Cloudflare Worker，再執行 CDN purge；有版本變更時則會一併建立 GitHub release/tag。
- Release workflow 會先完成 root 與 `security-headers` 依賴安裝；Cloudflare secrets 只注入 Worker deploy／cache purge step，且手動 `workflow_dispatch` 僅允許 `main` ref。
- 依 Cloudflare Workers CI/CD 官方做法，非互動部署必須提供 `CLOUDFLARE_API_TOKEN` 與 `CLOUDFLARE_ACCOUNT_ID`；缺任一 secret 時 workflow 會明確 `skip`，不會假裝正式站標頭已同步。
- 若只看到 app release 成功，但正式站 `Permissions-Policy` / CSP 等標頭仍為舊值，優先檢查 `security-headers` worker 是否已成功部署，而不是誤判為 app bundle 回退。
- 正式站若出現重複 `CSP Report-Only`、舊 `Permissions-Policy` 或 `__network_probe__` 重導，請依 [038_ratewise_cloudflare_audit_workflow.md](/Users/azlife.eth/Tools/app/docs/dev/038_ratewise_cloudflare_audit_workflow.md) 逐步稽核 Worker、Transform Rules、Snippets 與 Cache Rules。

### Precache 資產驗證

- 依 [Workbox Precaching 文檔][ref:workbox-precaching:2025-11-09]，Service Worker 安裝前必須確保清單內所有資產皆可 200 回應，否則會出現 `bad-precaching-response`。
- 部署完成後執行 `VERIFY_BASE_URL=https://app.haotool.org/ratewise/ pnpm verify:precache`，逐一以 HEAD/GET 檢查 `dist/sw.js` 中列出的 `assets/*` 是否已同步至 CDN。
- 若任何檔案 404，代表部署不完整或 CDN 仍保留舊版本，請重新上傳整個 `apps/ratewise/dist` 並再次清除 CDN 快取。

### 安全標頭策略

**應用層** (nginx.conf):

- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN

**邊緣層** (Cloudflare 管理):

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- Permissions-Policy
- Referrer-Policy

> 🎯 **Linus 原則**: 可交由 Cloudflare 的不在程式重複

## 健康檢查

### Docker Health Check

```yaml
healthcheck:
  test: ['CMD', 'wget', '--quiet', '--tries=1', '--spider', 'http://localhost:8080/health']
  interval: 30s
  timeout: 3s
  start_period: 10s
  retries: 3
```

### HTTP 端點

```bash
GET /health
HTTP/1.1 200 OK
Content-Type: text/plain

healthy
```

## E2E 驗證結果

### Playwright 測試 (2025-10-13)

✅ **單幣別轉換**:

- 導航至首頁正常
- 快速金額按鈕 (5,000) 功能正常
- 匯率計算準確 (TWD 5,000 → USD 162.47)

✅ **多幣別轉換**:

- 模式切換正常
- 顯示 12 種貨幣即時匯率
- 常用貨幣星號標記正常

✅ **UI/UX**:

- 頁面標題: "好工具匯率"
- 響應式設計正常
- 漸層背景與元件陰影正常

### 截圖

- `ratewise-homepage.png`: 單幣別轉換模式
- `ratewise-multi-currency.png`: 多幣別轉換模式

## 故障排除

### 常見問題

**Q: 404 錯誤 (字體檔案)**

- 這是正常的，Noto Sans TC 字體由 Google Fonts 提供
- 不影響應用功能

**Q: Docker 建置失敗**

- 確認 Node 版本 >= 24.0.0
- 確認 pnpm-lock.yaml 存在
- 執行 `pnpm install` 重新生成 lock file
- 若版本號仍顯示 `1.1.0`，請確保 builder 映像已安裝 `git` 並保留 `.git` 目錄，供 `git rev-list --count` 取得 Commit 數（參考 MDN start_url、W3C App Manifest、web.dev Learn PWA Update — 擷取於 2025-11-05）
- 建置時請傳入或使用預設 `VITE_RATEWISE_BASE_PATH=/ratewise/`，避免 PWA `start_url` 回退至根目錄導致安裝後連結錯誤
- Dockerfile 會在複製編譯結果後建立符號連結 `ratewise -> /usr/share/nginx/html`，確保 `/ratewise/assets/*` 與 `/assets/*` 指向同一份靜態檔案，避免子目錄部署時出現 404
- `park-keeper` 建置時請傳入或使用預設 `VITE_PARK_KEEPER_BASE_PATH=/park-keeper/`，避免容器中 PWA 與路由資產路徑錯誤
- Dockerfile 會建立 `park-keeper -> /usr/share/nginx/html/park-keeper-app` 符號連結，搭配 `nginx.conf` 子路徑規則提供 `/park-keeper/` 多頁面 SSG

**Q: 容器無法啟動**

- 檢查 8080 端口是否被佔用
- 查看容器日誌: `docker logs ratewise-app`

## 效能基準

### 建置效能

- TypeScript 編譯: ~1s
- Vite 建置: ~970ms
- Docker 建置: ~30s (首次), ~5s (快取)

### 執行期效能

- 首頁載入: < 1s (本地)
- 健康檢查: < 10ms
- 記憶體使用: ~20 MB (Nginx)

## 持續整合

### GitHub Actions (已配置)

```yaml
- Phase 0.2: CI/CD Pipeline ✅
  - Lint 檢查
  - TypeScript 型別檢查
  - 單元測試（coverage）
  - 建置驗證
  - SEO workflows（seo-audit / seo-e2e-tests / seo-health-check）
```

## 版本資訊

- **應用版本**: 0.0.0
- **Node.js**: v24.0.1
- **pnpm**: 9.10.0
- **React**: 19.0.0
- **Vite**: 5.4.6
- **部署日期**: 2025-10-13

## 參考資料

- [web.dev Service Worker Lifecycle][ref:web.dev-service-worker:2025-11-09]
- [nginx add_header 模組][ref:nginx-headers:2025-11-09]
- [web.dev HTTP Cache](https://web.dev/articles/http-cache)
- [Vite PWA Auto Update](https://vite-pwa-org.netlify.app/guide/auto-update.html)

---

**🤖 Generated with Claude Code**

_最後更新: 2026-01-29 01:39 UTC+8_

[ref:web.dev-service-worker:2025-11-09]: https://web.dev/articles/service-worker-lifecycle
[ref:nginx-headers:2025-11-09]: https://nginx.org/en/docs/http/ngx_http_headers_module.html
[ref:workbox-precaching:2025-11-09]: https://developer.chrome.com/docs/workbox/modules/workbox-precaching/
