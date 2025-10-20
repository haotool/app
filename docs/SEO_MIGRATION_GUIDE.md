# RateWise SEO 遷移與 Google 索引設定指南

> **最後更新**: 2025-10-21T02:58:57+08:00  
> **版本**: v1.0  
> **狀態**: ✅ 已完成

## 目錄

- [遷移概述](#遷移概述)
- [網域架構決策](#網域架構決策)
- [SEO 檔案更新清單](#seo-檔案更新清單)
- [Zeabur 自訂網域設定](#zeabur-自訂網域設定)
- [Google Search Console 設定](#google-search-console-設定)
- [立即執行項目](#立即執行項目)
- [SEO 最佳實踐](#seo-最佳實踐)

---

## 遷移概述

### 舊網域 vs 新網域

| 項目       | 舊配置                 | 新配置                             |
| ---------- | ---------------------- | ---------------------------------- |
| 網域       | `https://ratewise.app` | `https://app.haotool.org/ratewise` |
| 部署平台   | Zeabur (預設網域)      | Zeabur (自訂網域)                  |
| SEO 狀態   | 已索引                 | 需重新提交                         |
| Sitemap    | ✅ 已更新              | ✅ 已更新至新網域                  |
| robots.txt | ✅ 已更新              | ✅ 已更新至新網域                  |

### 遷移日期

- **開始日期**: 2025-10-21
- **預計完成**: 2025-10-21（同日完成）
- **索引生效**: 1-7 天（Google 索引時間）

---

## 網域架構決策

### 為什麼選擇 `app.haotool.org/ratewise`？

經過深度研究 2025 年 SEO 最佳實踐，我們選擇 **子域名 + 子路徑** 的混合架構：

#### ✅ 優勢

1. **品牌統一**
   - 所有工具都在 `haotool.org` 主網域下
   - 建立品牌信任度與權威性
   - 未來可擴展至 `api.haotool.org`、`blog.haotool.org` 等

2. **SEO 優勢**
   - 子域名 `app` 可獨立累積 SEO 權重
   - 主網域 `haotool.org` 的權重可部分傳遞至子域名
   - 適合多專案結構，避免單一網域過度複雜

3. **技術彈性**
   - 不同子域名可部署至不同平台
   - 獨立的 SSL 證書管理
   - 方便進行 A/B 測試與灰度發布

4. **未來擴展性**
   ```
   主網域: haotool.org (官網/落地頁)
   ├── app.haotool.org/ratewise (匯率工具)
   ├── app.haotool.org/budget (預算工具 - 未來)
   ├── api.haotool.org (API 服務 - 未來)
   └── blog.haotool.org (部落格 - 未來)
   ```

#### ⚠️ 注意事項

- 子域名被 Google 視為「相對獨立」的網站
- 需在 Google Search Console 分別驗證 `haotool.org` 和 `app.haotool.org`
- 初期 SEO 權重較低，需時間累積

### 替代方案比較

| 架構            | 範例                       | SEO        | 管理複雜度 | 推薦度     |
| --------------- | -------------------------- | ---------- | ---------- | ---------- |
| 獨立網域        | `ratewise.app`             | ⭐⭐⭐⭐⭐ | 低         | ⭐⭐⭐     |
| 子目錄          | `haotool.org/ratewise`     | ⭐⭐⭐⭐⭐ | 中         | ⭐⭐⭐⭐   |
| 子域名 + 子路徑 | `app.haotool.org/ratewise` | ⭐⭐⭐⭐   | 中         | ⭐⭐⭐⭐⭐ |
| 純子域名        | `ratewise.haotool.org`     | ⭐⭐⭐⭐   | 中         | ⭐⭐⭐     |

**最終決策**: `app.haotool.org/ratewise` ✅

**理由**: 平衡 SEO 效果、品牌統一與未來擴展性。

---

## SEO 檔案更新清單

### ✅ 已完成

以下檔案已更新至新網域 `https://app.haotool.org/ratewise`：

#### 1. Sitemap（網站地圖）

**檔案**: `apps/ratewise/public/sitemap.xml`

**變更內容**:

```xml
<!-- 舊 -->
<loc>https://ratewise.app/</loc>

<!-- 新 -->
<loc>https://app.haotool.org/ratewise/</loc>
```

**更新頁面**:

- 首頁: `/`
- FAQ: `/faq`
- 關於: `/about`

**最後更新日期**: 2025-10-21

#### 2. Robots.txt

**檔案**: `apps/ratewise/public/robots.txt`

**變更內容**:

```txt
# 舊
Sitemap: https://ratewise.app/sitemap.xml

# 新
Sitemap: https://app.haotool.org/ratewise/sitemap.xml
```

#### 3. AI 搜尋優化檔案（llms.txt）

**檔案**: `apps/ratewise/public/llms.txt`

**變更內容**:

- 所有 URL 參考更新至新網域
- GitHub 連結更新至 `https://github.com/haotool/app`

#### 4. SEO Helmet 組件

**檔案**: `apps/ratewise/src/components/SEOHelmet.tsx`

**變更內容**:

```typescript
// 舊
const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://ratewise.app';

// 新
const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://app.haotool.org/ratewise';
```

**影響**:

- Canonical URLs
- Open Graph URLs
- Twitter Card URLs
- JSON-LD structured data

### 📋 待更新（需手動處理）

以下項目需要您手動處理：

#### 1. 環境變數設定

**平台**: Zeabur Dashboard

**操作步驟**: 見 [Zeabur 自訂網域設定](#zeabur-自訂網域設定)

#### 2. Google Search Console

**操作步驟**: 見 [Google Search Console 設定](#google-search-console-設定)

#### 3. 社交媒體連結（如適用）

如您有在以下平台分享過 RateWise：

- Facebook、Twitter、LinkedIn 等
- 部落格文章
- 論壇貼文

建議更新連結為新網域。

---

## Zeabur 自訂網域設定

### 步驟 1: 新增自訂網域

1. 登入 [Zeabur Dashboard](https://zeabur.com/dashboard)
2. 選擇您的專案（RateWise）
3. 選擇服務（ratewise）
4. 點擊 **Domains** 頁籤
5. 點擊 **+ Add Domain**
6. 輸入: `app.haotool.org`
7. 記下 Zeabur 提供的 CNAME 目標（類似 `cname.zeabur.app`）

### 步驟 2: 配置 DNS 記錄

前往您的 DNS 服務商（如 Cloudflare、GoDaddy 等）：

#### 新增 CNAME 記錄

| 類型  | 名稱  | 目標                  | TTL  | Proxy             |
| ----- | ----- | --------------------- | ---- | ----------------- |
| CNAME | `app` | `[Zeabur提供的CNAME]` | Auto | ⚪ 關閉（灰色雲） |

**重要**:

- **Proxy 設定**: 初次設定建議關閉 Cloudflare Proxy（灰色雲），讓 Zeabur 直接處理 SSL
- **Cloudflare 用戶**: 待 SSL 證書生效後可重新開啟 Proxy（橘色雲）以啟用 CDN 加速

#### 驗證 DNS 生效

```bash
# 檢查 CNAME 記錄
dig app.haotool.org CNAME

# 或使用
nslookup app.haotool.org
```

預期結果：

```
app.haotool.org    CNAME    cname.zeabur.app.
```

**DNS 生效時間**: 1-10 分鐘（通常 2-3 分鐘）

### 步驟 3: 等待 SSL 證書生成

Zeabur 會自動使用 Let's Encrypt 生成 SSL 證書：

1. 在 Zeabur Dashboard 中查看網域狀態
2. 等待狀態從 `Pending` 變為 `Active`（通常 2-5 分鐘）
3. 看到綠色勾勾 ✅ 表示成功

### 步驟 4: 設定子路徑（如需要）

如需要將應用程式部署至 `/ratewise` 子路徑：

#### 方法 A: 使用 Nginx（推薦）

1. 在 Zeabur 中新增 Nginx 服務
2. 配置 `nginx.conf`：

   ```nginx
   server {
       listen 80;
       server_name app.haotool.org;

       location /ratewise/ {
           proxy_pass http://ratewise-service:3000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location / {
           return 404;  # 其他路徑返回 404
       }
   }
   ```

#### 方法 B: 使用 Vite base 配置

更新 `apps/ratewise/vite.config.ts`：

```typescript
export default defineConfig({
  base: '/ratewise/', // 新增此行
  // ... 其他配置
});
```

**注意**: 此方法會影響所有資源路徑，需確保所有 assets 路徑正確。

### 步驟 5: 設定環境變數

在 Zeabur Dashboard 中：

1. 前往 **Variables** 頁籤
2. 新增環境變數：
   - **Key**: `VITE_SITE_URL`
   - **Value**: `https://app.haotool.org/ratewise`
3. 點擊 **Save**
4. Zeabur 會自動觸發重新部署

### 步驟 6: 驗證部署

部署完成後（約 2-3 分鐘）：

```bash
# 測試網站可訪問性
curl -I https://app.haotool.org/ratewise/

# 預期: HTTP/2 200
```

在瀏覽器中訪問: https://app.haotool.org/ratewise/

檢查項目：

- ✅ 頁面正常載入
- ✅ 匯率資料顯示正確
- ✅ PWA 功能正常
- ✅ 所有內部連結指向新網域

---

## Google Search Console 設定

### 步驟 1: 新增資源（Property）

#### 選項 A: 網域資源（推薦）

**優點**: 涵蓋所有子域名和協議（http/https）

1. 前往 [Google Search Console](https://search.google.com/search-console)
2. 點擊 **新增資源**
3. 選擇 **網域** 類型
4. 輸入: `haotool.org`（不含 `https://`）
5. 按照指示新增 DNS TXT 記錄驗證

**DNS TXT 記錄範例**:

```
類型: TXT
名稱: @
值: google-site-verification=xxxxxxxxxxxxxxxx
```

#### 選項 B: 網址前置字元（精準控制）

**優點**: 精準控制特定子域名或子路徑

1. 選擇 **網址前置字元** 類型
2. 輸入: `https://app.haotool.org/ratewise`
3. 選擇驗證方式（推薦 HTML 檔案上傳）

**HTML 檔案驗證**:

1. 下載 `googleXXXXXXXX.html` 檔案
2. 放置於 `apps/ratewise/public/` 目錄
3. 提交 Git：
   ```bash
   git add apps/ratewise/public/googleXXXXXXXX.html
   git commit -m "chore: 新增 Google Search Console 驗證檔案"
   git push
   ```
4. 等待部署完成後，在 Google Search Console 點擊 **驗證**

### 步驟 2: 提交 Sitemap

驗證成功後：

1. 在左側選單點擊 **Sitemap**
2. 在「新增 Sitemap」欄位輸入:
   ```
   https://app.haotool.org/ratewise/sitemap.xml
   ```
3. 點擊 **提交**

**預期結果**: 狀態顯示「成功」，並顯示發現的 URL 數量（應為 3）

### 步驟 3: 提交主要頁面至索引（加速索引）

使用 **URL 檢查工具** 手動提交關鍵頁面：

1. 在 Search Console 頂部搜尋框輸入 URL
2. 點擊 **要求建立索引**
3. 等待 Google 確認

**立即提交的頁面**:

- `https://app.haotool.org/ratewise/`（首頁 - 最高優先）
- `https://app.haotool.org/ratewise/faq`
- `https://app.haotool.org/ratewise/about`

**每日配額**: 每個資源每日約可提交 10 個 URL

### 步驟 4: 設定索引偏好

#### 設定慣用網域（如適用）

如您同時擁有 `ratewise.app` 和 `app.haotool.org/ratewise`：

1. 在舊網域（`ratewise.app`）設定 301 重新導向至新網域
2. 使用 **變更網址工具**（Change of Address Tool）通知 Google

**Nginx 301 重新導向範例**:

```nginx
server {
    listen 80;
    server_name ratewise.app;
    return 301 https://app.haotool.org/ratewise$request_uri;
}
```

### 步驟 5: 監控索引狀態

#### 檢查索引覆蓋率

1. 前往 **索引** > **網頁**
2. 查看「已建立索引」頁面數量
3. 檢查「未建立索引」原因（如有）

**預期時程**:

- **首次爬取**: 1-3 天
- **完整索引**: 3-7 天
- **搜尋結果顯示**: 7-14 天

#### 使用 Rich Results 測試

測試 Structured Data 是否正確：

1. 前往 [Rich Results Test](https://search.google.com/test/rich-results)
2. 輸入: `https://app.haotool.org/ratewise/`
3. 查看是否偵測到：
   - WebApplication schema
   - Organization schema
   - FAQPage schema（FAQ 頁面）

---

## 立即執行項目

### 🔥 高優先級（今日完成）

1. **✅ 合併版本管理分支** - 已完成
2. **⏳ 設定 Zeabur 自訂網域** - 待執行
   - 新增 `app.haotool.org` 網域
   - 配置 DNS CNAME 記錄
   - 等待 SSL 證書生成
3. **⏳ 設定環境變數** - 待執行
   - 在 Zeabur 設定 `VITE_SITE_URL`
   - 觸發重新部署
4. **⏳ Google Search Console 設定** - 待執行
   - 驗證網域所有權
   - 提交 sitemap
   - 手動提交首頁至索引

### ⚡ 中優先級（本週完成）

1. **監控 Google 索引狀態**
   - 每日檢查 Search Console
   - 查看爬取錯誤
   - 修正發現的問題

2. **更新外部連結**（如適用）
   - 社交媒體檔案
   - 部落格文章
   - 論壇簽名檔

3. **效能監控**
   - 執行 Lighthouse 測試
   - 檢查 Core Web Vitals
   - 驗證 PWA 功能

### 📊 低優先級（未來 2 週）

1. **SEO 優化**
   - 新增更多 structured data
   - 優化 meta descriptions
   - 新增 FAQ schema

2. **內容行銷**
   - 撰寫部落格文章
   - 社群媒體推廣
   - 建立反向連結

---

## SEO 最佳實踐

### 網域遷移 Checklist

- ✅ 所有內部連結使用相對路徑或新網域
- ✅ Canonical URLs 指向新網域
- ✅ Open Graph URLs 使用新網域
- ✅ Sitemap 包含所有頁面
- ✅ robots.txt 允許爬取
- ⏳ 舊網域設定 301 重新導向（如適用）
- ⏳ Google Search Console 驗證完成
- ⏳ Sitemap 提交成功

### 避免常見錯誤

#### ❌ 錯誤 1: 混合使用新舊網域

**問題**: 部分連結仍指向 `ratewise.app`

**解決方案**: 全域搜尋並替換

```bash
cd /Users/azlife.eth/Tools/app
grep -r "ratewise.app" apps/ratewise/src/
```

#### ❌ 錯誤 2: Sitemap 未更新

**問題**: sitemap.xml 仍包含舊網域

**解決方案**: 本指南已完成更新 ✅

#### ❌ 錯誤 3: 環境變數未設定

**問題**: 建置時仍使用預設的舊網域

**解決方案**:

1. 在 Zeabur 設定 `VITE_SITE_URL`
2. 觸發重新部署
3. 檢查 `dist/index.html` 中的 canonical URLs

#### ❌ 錯誤 4: 子路徑路由問題

**問題**: 訪問 `/ratewise/about` 回傳 404

**解決方案**:

- 確認 Nginx 配置正確
- 或在 Vite 設定 `base: '/ratewise/'`

### 監控指標

#### Google Search Console

- **索引覆蓋率**: 目標 100%（3/3 頁面）
- **爬取錯誤**: 0 個
- **安全性問題**: 0 個
- **Core Web Vitals**: 全綠

#### Lighthouse 分數

- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

#### 搜尋結果

使用 `site:` 搜尋確認索引：

```
site:app.haotool.org/ratewise
```

預期在 7-14 天內看到結果。

---

## 參考資料

### 官方文檔

- [Google Search Console 說明](https://support.google.com/webmasters/)
- [Google 網站遷移指南](https://developers.google.com/search/docs/advanced/crawling/site-move-with-url-changes)
- [Zeabur 自訂網域文檔](https://zeabur.com/docs/deploy/domain-binding)

### SEO 工具

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Ahrefs Webmaster Tools](https://ahrefs.com/webmaster-tools)（免費）

### 延伸閱讀

- [Subdomain vs Subdirectory for SEO (2025)](https://moz.com/blog/subdomains-vs-subfolders-which-is-better-for-seo)
- [移動網站：SEO 最佳做法](https://developers.google.com/search/docs/advanced/mobile/mobile-sites-mobile-first-indexing)

---

## 總結

### 完成狀態

| 任務                  | 狀態      | 負責人 | 預計完成   |
| --------------------- | --------- | ------ | ---------- |
| SEO 檔案更新          | ✅ 完成   | Agent  | 2025-10-21 |
| Zeabur 網域設定       | ⏳ 待執行 | 使用者 | 2025-10-21 |
| Google Search Console | ⏳ 待執行 | 使用者 | 2025-10-21 |
| Google 索引生效       | ⏳ 進行中 | Google | 2025-10-28 |

### 下一步行動

1. **立即執行**: 按照 [Zeabur 自訂網域設定](#zeabur-自訂網域設定) 完成網域綁定
2. **今日內完成**: 設定 Google Search Console 並提交 sitemap
3. **本週監控**: 每日檢查 Search Console 索引狀態
4. **兩週後評估**: 檢查搜尋結果排名與流量

### 需要協助？

如遇到問題，請參考：

- [環境變數配置指南](./ENVIRONMENT_VARIABLES.md)
- [Zeabur 部署指南](./ZEABUR_DEPLOYMENT.md)
- 或聯絡: haotool.org@gmail.com

---

**文檔維護**: RateWise Team  
**最後審查**: 2025-10-21T02:58:57+08:00
