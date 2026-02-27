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

### Release Workflow 與 Cloudflare Worker 同步

- `Release` workflow 在 `main` push 時，會先嘗試部署 `security-headers/wrangler.jsonc` 對應的 Cloudflare Worker，再執行 CDN purge；有版本變更時則會一併建立 GitHub release/tag。
- 依 Cloudflare Workers CI/CD 官方做法，非互動部署必須提供 `CLOUDFLARE_API_TOKEN` 與 `CLOUDFLARE_ACCOUNT_ID`；缺任一 secret 時 workflow 會明確 `skip`，不會假裝正式站標頭已同步。
- 若只看到 app release 成功，但正式站 `Permissions-Policy` / CSP 等標頭仍為舊值，優先檢查 `security-headers` worker 是否已成功部署，而不是誤判為 app bundle 回退。

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
