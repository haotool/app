# RateWise 環境變數配置指南

> **最後更新**: 2025-10-21T02:58:57+08:00  
> **版本**: v1.0

## 概述

本文檔說明 RateWise 應用程式所需的環境變數配置。

## 必要環境變數

### VITE_SITE_URL

**用途**: 設定網站的基礎 URL，用於 SEO meta tags、sitemap 和 Open Graph 標籤。

**範例**:

```bash
# 部署到 app.haotool.org/ratewise
VITE_SITE_URL=https://app.haotool.org/ratewise

# 部署到 ratewise.app（舊版）
VITE_SITE_URL=https://ratewise.app
```

**影響範圍**:

- SEO Helmet 組件的 canonical URL
- Open Graph URL
- sitemap.xml 中的 URL（需手動更新）
- robots.txt 中的 Sitemap URL（需手動更新）

## 選用環境變數

### VITE_SENTRY_DSN

**用途**: Sentry 錯誤追蹤服務的 DSN（Data Source Name）。

**範例**:

```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### VITE_SENTRY_DEBUG

**用途**: 啟用 Sentry 除錯模式。

**範例**:

```bash
VITE_SENTRY_DEBUG=false
```

### VITE_VITALS_ENDPOINT

**用途**: Web Vitals 效能指標上傳端點。

**範例**:

```bash
VITE_VITALS_ENDPOINT=https://your-analytics-endpoint.com/vitals
```

## Zeabur 部署配置

### 方法 1: 使用 Zeabur Dashboard

1. 登入 Zeabur Dashboard
2. 選擇您的專案和服務
3. 點擊 **Variables** 頁籤
4. 新增環境變數：
   - Key: `VITE_SITE_URL`
   - Value: `https://app.haotool.org/ratewise`
5. 儲存後 Zeabur 會自動重新部署

### 方法 2: 使用 Zeabur CLI

```bash
zeabur env set VITE_SITE_URL=https://app.haotool.org/ratewise
```

## 本地開發配置

在專案根目錄建立 `.env` 檔案（此檔案不應提交至版本控制）：

```bash
# .env
VITE_SITE_URL=http://localhost:5173
```

## 驗證配置

### 檢查環境變數是否生效

1. 啟動開發伺服器：

   ```bash
   pnpm --filter @app/ratewise dev
   ```

2. 在瀏覽器中開啟開發者工具
3. 檢查 `<head>` 中的 meta tags：
   ```html
   <link rel="canonical" href="https://app.haotool.org/ratewise/" />
   <meta property="og:url" content="https://app.haotool.org/ratewise/" />
   ```

### 建置時驗證

建置完成後檢查 `dist/index.html`：

```bash
pnpm --filter @app/ratewise build
grep -i "app.haotool.org" apps/ratewise/dist/index.html
```

## 注意事項

### URL 格式規範

- **結尾斜線**: 推薦使用 `https://app.haotool.org/ratewise`（不含結尾斜線）
  - SEOHelmet 組件會自動處理路徑拼接
  - 避免雙斜線問題（`//`）

- **子路徑**: 如使用子路徑部署，需同步更新：
  - `vite.config.ts` 中的 `base` 設定
  - Nginx 或 CDN 的路由配置

### SEO 相關檔案

環境變數 `VITE_SITE_URL` **不會**自動更新以下檔案，需手動修改：

- `apps/ratewise/public/sitemap.xml`
- `apps/ratewise/public/robots.txt`
- `apps/ratewise/public/llms.txt`

### 快取清理

變更 `VITE_SITE_URL` 後需清理：

1. **本地開發**:

   ```bash
   rm -rf apps/ratewise/dist
   rm -rf apps/ratewise/.vite
   pnpm --filter @app/ratewise build
   ```

2. **生產環境**: 觸發完整重新部署
   ```bash
   git commit --allow-empty -m "chore: 觸發重新部署以套用環境變數"
   git push
   ```

## 疑難排解

### 問題: SEO meta tags 仍顯示舊網域

**原因**: 瀏覽器快取或 CDN 快取未清除

**解決方案**:

1. 清除瀏覽器快取（Hard Reload: `Cmd+Shift+R` / `Ctrl+Shift+F5`）
2. 清除 CDN 快取（如使用 Cloudflare）
3. 檢查 Service Worker 快取（DevTools > Application > Clear storage）

### 問題: 環境變數在生產環境中未生效

**原因**: Vite 在建置時注入環境變數，而非執行時

**解決方案**:

1. 確認 Zeabur 中已正確設定環境變數
2. 觸發重新部署（任何 commit 都會觸發）
3. 檢查建置日誌確認變數已注入

## 參考資料

- [Vite 環境變數文檔](https://vitejs.dev/guide/env-and-mode.html)
- [Zeabur 環境變數設定](https://zeabur.com/docs/environment-variables)
- [Google Search Console 網站驗證](https://search.google.com/search-console)

---

**維護者**: RateWise Team  
**聯絡信箱**: haotool.org@gmail.com
