# RateWise 部署指南

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

# 建置生產版本
pnpm build:ratewise
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
- ✅ Health check endpoint (/health)
- ✅ 最小安全標頭 (X-Content-Type-Options, X-Frame-Options)
- ✅ 子路徑靜態檔（`/ratewise/manifest.webmanifest`、`/ratewise/robots.txt`、`/ratewise/llms.txt`、`/ratewise/sitemap.xml`）具專屬 `location` 規則，避免被 SPA fallback 攔截

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
  - Lint & Format 檢查
  - TypeScript 型別檢查
  - 單元測試 (37 tests, 89.8% coverage)
  - 建置驗證
```

## 版本資訊

- **應用版本**: 0.0.0
- **Node.js**: v24.0.1
- **pnpm**: 9.10.0
- **React**: 19.0.0
- **Vite**: 5.4.6
- **部署日期**: 2025-10-13

---

**🤖 Generated with Claude Code**

_最後更新: 2025-10-13 01:58 UTC+8_
