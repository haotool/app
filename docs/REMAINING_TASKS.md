# RateWise 剩餘待辦事項清單

> **建立時間**: 2025-10-21T03:24:23+08:00  
> **專案狀態**: 開發環境已就緒，等待部署配置  
> **預估總時間**: 30-45 分鐘

---

## 📋 總覽

✅ **已完成**:

- 版本管理系統整合
- `__APP_VERSION__` 錯誤修復
- SEO 檔案更新（已在 `feat/seo-domain-migration` 分支）
- TypeScript 編譯錯誤修復
- 開發伺服器測試通過
- 生產建置測試通過

⏳ **待完成** (本清單):

1. 合併 SEO 遷移分支
2. Zeabur 自訂網域設定
3. Zeabur 環境變數配置
4. 測試部署
5. Google Search Console 設定

---

## 🎯 任務 1: 合併 SEO 遷移分支

**預估時間**: 2 分鐘  
**前置條件**: 無  
**優先級**: P0 - 必須先完成

### 操作步驟

```bash
# 1. 確認當前在 main 分支
git status

# 2. 合併 SEO 遷移分支
git merge feat/seo-domain-migration --no-ff -m "feat: 合併 SEO 網域遷移至 app.haotool.org/ratewise

- 更新所有 SEO 檔案至新網域
- 新增環境變數配置指南
- 新增完整 SEO 遷移文檔"

# 3. 推送至遠端
git push origin main

# 4. 驗證合併成功
git log --oneline -3
```

### 預期結果

```
✅ 分支合併成功
✅ 遠端推送完成
✅ 新增檔案：
   - docs/ENVIRONMENT_VARIABLES.md
   - docs/SEO_MIGRATION_GUIDE.md
✅ 更新檔案：
   - apps/ratewise/public/sitemap.xml
   - apps/ratewise/public/robots.txt
   - apps/ratewise/public/llms.txt
   - apps/ratewise/src/components/SEOHelmet.tsx
```

### 疑難排解

**如果出現合併衝突**:

```bash
# 查看衝突檔案
git status

# 手動解決衝突後
git add .
git commit -m "fix: 解決合併衝突"
git push origin main
```

---

## 🎯 任務 2: Zeabur 自訂網域設定

**預估時間**: 15 分鐘  
**前置條件**: 任務 1 完成  
**優先級**: P0 - 核心功能

### 步驟 2.1: 在 Zeabur 新增自訂網域

1. **登入 Zeabur Dashboard**
   - 前往: https://zeabur.com/dashboard
   - 使用您的帳號登入

2. **選擇專案**
   - 找到 RateWise 專案
   - 點擊進入專案詳情頁

3. **選擇服務**
   - 在服務列表中找到 `ratewise` 服務
   - 點擊服務卡片進入設定

4. **新增網域**
   - 點擊 **Domains** 頁籤
   - 點擊 **+ Add Domain** 按鈕
   - 輸入: `app.haotool.org`
   - 點擊 **Add** 確認

5. **記錄 CNAME 目標**
   - Zeabur 會顯示一個 CNAME 目標
   - 格式類似: `cname-xxxxx.zeabur.app`
   - **請記下這個值**，下一步需要使用

### 步驟 2.2: 配置 DNS 記錄

**前往您的 DNS 服務商** (例如 Cloudflare、GoDaddy、Namecheap 等)

#### 如果使用 Cloudflare:

1. 登入 Cloudflare Dashboard
2. 選擇 `haotool.org` 網域
3. 點擊 **DNS** 頁籤
4. 點擊 **Add record**
5. 填寫資料:
   ```
   Type: CNAME
   Name: app
   Target: [Zeabur 提供的 CNAME，例如 cname-xxxxx.zeabur.app]
   TTL: Auto
   Proxy status: DNS only (灰色雲朵 ⚪)
   ```
6. 點擊 **Save**

**重要**:

- ⚪ **初次設定時 Proxy 必須關閉**（灰色雲朵）
- 🟠 等 SSL 證書生效後可重新開啟 Proxy（橘色雲朵）

#### 如果使用其他 DNS 服務商:

1. 登入您的 DNS 管理面板
2. 新增 CNAME 記錄:
   ```
   Host/Name: app
   Type: CNAME
   Value/Target: [Zeabur 提供的 CNAME]
   TTL: 自動 或 3600
   ```
3. 儲存變更

### 步驟 2.3: 驗證 DNS 生效

**在終端機執行**:

```bash
# 檢查 CNAME 記錄
dig app.haotool.org CNAME

# 或使用 nslookup
nslookup app.haotool.org
```

**預期結果**:

```
app.haotool.org    CNAME    cname-xxxxx.zeabur.app.
```

**DNS 生效時間**: 1-10 分鐘（通常 2-3 分鐘）

### 步驟 2.4: 等待 SSL 證書生成

1. **回到 Zeabur Dashboard**
2. 在 Domains 頁面查看網域狀態
3. 等待狀態從 `Pending` 變為 `Active`
4. 看到綠色勾勾 ✅ 表示 SSL 證書已生成

**SSL 生成時間**: 2-5 分鐘

### 驗證網域設定

```bash
# 測試 HTTPS 連線
curl -I https://app.haotool.org

# 預期: HTTP/2 200 OK
```

---

## 🎯 任務 3: Zeabur 環境變數配置

**預估時間**: 5 分鐘  
**前置條件**: 任務 2 完成  
**優先級**: P0 - 必須設定

### 操作步驟

1. **在 Zeabur Dashboard 中**
   - 確保在 RateWise 專案的 `ratewise` 服務頁面
   - 點擊 **Variables** 頁籤

2. **新增環境變數**
   - 點擊 **Add Variable** 按鈕
   - 輸入以下資訊:
     ```
     Key: VITE_SITE_URL
     Value: https://app.haotool.org/ratewise
     ```
   - 點擊 **Save** 或 **Add**

3. **觸發重新部署**
   - Zeabur 會自動偵測到環境變數變更
   - 自動觸發重新建置和部署
   - 等待部署完成（約 3-5 分鐘）

4. **監控部署日誌**
   - 點擊 **Logs** 頁籤
   - 查看建置和部署日誌
   - 確認沒有錯誤訊息

### 驗證環境變數

部署完成後:

```bash
# 1. 訪問網站
curl https://app.haotool.org/ratewise | grep -i "app.haotool.org"

# 2. 檢查 meta tags
curl -s https://app.haotool.org/ratewise | grep -i "canonical"

# 預期輸出包含:
# <link rel="canonical" href="https://app.haotool.org/ratewise" />
```

---

## 🎯 任務 4: 測試部署

**預估時間**: 5-10 分鐘  
**前置條件**: 任務 3 完成  
**優先級**: P0 - 必須驗證

### 測試清單

#### 4.1 基本功能測試

**在瀏覽器中訪問**: https://app.haotool.org/ratewise

✅ **檢查項目**:

- [ ] 頁面正常載入（無 404 錯誤）
- [ ] 匯率資料顯示正常
- [ ] 匯率轉換功能正常
- [ ] 沒有 console 錯誤
- [ ] 版本資訊顯示正確（v1.0.0）

#### 4.2 SEO 檢查

**開啟瀏覽器開發者工具** (F12):

1. **檢查 Head 區塊**:

   ```html
   <!-- 應該包含 -->
   <link rel="canonical" href="https://app.haotool.org/ratewise" />
   <meta property="og:url" content="https://app.haotool.org/ratewise" />
   ```

2. **檢查 Sitemap**:
   - 訪問: https://app.haotool.org/ratewise/sitemap.xml
   - 確認所有 URL 都是 `app.haotool.org/ratewise`

3. **檢查 Robots.txt**:
   - 訪問: https://app.haotool.org/ratewise/robots.txt
   - 確認 Sitemap URL 正確

#### 4.3 PWA 功能測試

1. **在 Chrome 中**:
   - 訪問 https://app.haotool.org/ratewise
   - 查看網址列是否出現安裝圖示 ➕
   - 嘗試安裝 PWA

2. **離線測試**:
   - 開啟開發者工具 → Application → Service Workers
   - 勾選 "Offline"
   - 重新整理頁面
   - 確認應用程式仍可運作

#### 4.4 效能測試

**執行 Lighthouse 測試**:

```bash
# 在本地執行
npx lighthouse https://app.haotool.org/ratewise --view

# 或使用線上工具
# 訪問: https://pagespeed.web.dev/
# 輸入: https://app.haotool.org/ratewise
```

**目標分數**:

- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

### 發現問題時的處理

**如果頁面無法載入**:

1. 檢查 Zeabur 部署日誌
2. 確認 DNS 已生效
3. 確認 SSL 證書已啟用

**如果 URL 仍顯示舊網域**:

1. 清除瀏覽器快取（Cmd+Shift+R / Ctrl+Shift+F5）
2. 檢查環境變數是否正確設定
3. 確認部署已完成

**如果出現 CORS 錯誤**:

1. 檢查 nginx.conf 配置
2. 確認 Cloudflare 設定

---

## 🎯 任務 5: Google Search Console 設定

**預估時間**: 10-15 分鐘  
**前置條件**: 任務 4 完成（網站正常運作）  
**優先級**: P1 - 重要但非緊急

### 步驟 5.1: 驗證網域所有權

#### 選項 A: 網域驗證（推薦）

**優點**: 涵蓋所有子域名和協議

1. **前往 Google Search Console**
   - 訪問: https://search.google.com/search-console
   - 使用 Google 帳號登入

2. **新增資源**
   - 點擊左上角的資源選擇器
   - 點擊 **新增資源**
   - 選擇 **網域** 類型

3. **輸入網域**
   - 輸入: `haotool.org`（不含 https://）
   - 點擊 **繼續**

4. **驗證所有權 - DNS 驗證**
   - Google 會提供一個 TXT 記錄
   - 格式: `google-site-verification=XXXXXXXXXXXXXX`

5. **新增 DNS TXT 記錄**

   **在 Cloudflare**:

   ```
   Type: TXT
   Name: @
   Content: google-site-verification=XXXXXXXXXXXXXX
   TTL: Auto
   ```

   **在其他 DNS 服務商**:

   ```
   Type: TXT
   Host: @
   Value: google-site-verification=XXXXXXXXXXXXXX
   ```

6. **等待 DNS 生效**
   - 等待 2-5 分鐘
   - 回到 Google Search Console
   - 點擊 **驗證**

#### 選項 B: URL 前置字元驗證（精準控制）

1. **新增資源**
   - 選擇 **網址前置字元** 類型
   - 輸入: `https://app.haotool.org/ratewise`

2. **選擇驗證方式**
   - 推薦: **HTML 檔案上傳**

3. **HTML 檔案驗證**

   ```bash
   # 1. 下載驗證檔案（例如 googleXXXXXX.html）
   # 2. 將檔案放到專案的 public 目錄
   cp ~/Downloads/googleXXXXXX.html /Users/azlife.eth/Tools/app/apps/ratewise/public/

   # 3. 提交到 Git
   cd /Users/azlife.eth/Tools/app
   git add apps/ratewise/public/googleXXXXXX.html
   git commit -m "chore(seo): 新增 Google Search Console 驗證檔案"
   git push origin main

   # 4. 等待 Zeabur 部署完成（2-3 分鐘）
   # 5. 驗證檔案可訪問
   curl https://app.haotool.org/ratewise/googleXXXXXX.html

   # 6. 回到 Google Search Console 點擊「驗證」
   ```

### 步驟 5.2: 提交 Sitemap

**驗證成功後**:

1. **在 Search Console 左側選單**
   - 點擊 **Sitemap**

2. **新增 Sitemap**
   - 在「新增 Sitemap」欄位輸入:
     ```
     https://app.haotool.org/ratewise/sitemap.xml
     ```
   - 點擊 **提交**

3. **確認狀態**
   - 等待幾分鐘
   - 狀態應顯示「成功」
   - 顯示發現的 URL 數量：3 個
     - `/` (首頁)
     - `/faq`
     - `/about`

### 步驟 5.3: 手動提交重要頁面（加速索引）

**使用 URL 檢查工具**:

1. **在 Search Console 頂部搜尋框**
   - 輸入完整 URL
   - 點擊搜尋

2. **請求建立索引**
   - 點擊 **要求建立索引** 按鈕
   - 等待 Google 確認

3. **依序提交以下頁面**:
   ```
   https://app.haotool.org/ratewise          # 首頁 - 最高優先
   https://app.haotool.org/ratewise/faq       # FAQ 頁面
   https://app.haotool.org/ratewise/about     # 關於頁面
   ```

**每日配額**: 約 10 個 URL

### 步驟 5.4: 監控索引狀態

**定期檢查** (建議每 2-3 天):

1. **查看索引覆蓋率**
   - 點擊 **索引** > **網頁**
   - 查看「已建立索引」的頁面數量
   - 目標: 3/3 頁面已索引

2. **檢查錯誤**
   - 查看「未建立索引」區塊
   - 如有錯誤，點擊查看詳情並修正

3. **查看效能報告**
   - 點擊 **效能**
   - 查看點擊次數、曝光次數、平均排名

### 預期時程

- **首次爬取**: 1-3 天
- **完整索引**: 3-7 天
- **搜尋結果顯示**: 7-14 天

### 驗證索引狀態

**使用 site: 搜尋**:

```
在 Google 搜尋框輸入: site:app.haotool.org/ratewise
```

預期在 7-14 天內看到結果。

---

## 🎯 任務 6: 最終驗證（選用但建議）

### 6.1 驗證舊網域重新導向（如適用）

**如果您有 ratewise.app 網域**:

1. 設定 301 重新導向至新網域
2. 在 Google Search Console 使用「變更網址工具」

### 6.2 設定分析工具（選用）

**Google Analytics**:

1. 建立 GA4 資源
2. 設定追蹤代碼
3. 監控流量

**其他建議工具**:

- Google Tag Manager
- Hotjar (使用者行為分析)
- Sentry (錯誤追蹤 - 已整合)

---

## 📊 完成度追蹤表

使用此表追蹤進度:

| 任務                     | 狀態 | 完成時間 | 備註 |
| ------------------------ | ---- | -------- | ---- |
| 1. 合併 SEO 分支         | ⏳   | -        | -    |
| 2. Zeabur 網域設定       | ⏳   | -        | -    |
| 3. 環境變數配置          | ⏳   | -        | -    |
| 4. 測試部署              | ⏳   | -        | -    |
| 5. Google Search Console | ⏳   | -        | -    |
| 6. 最終驗證              | ⏳   | -        | -    |

---

## 🆘 遇到問題時的處理

### 問題回報格式

如果遇到問題，請提供以下資訊:

```
**問題描述**: [簡短描述問題]
**發生在哪個任務**: [任務編號]
**錯誤訊息**: [完整錯誤訊息]
**已嘗試的解決方法**: [列出嘗試過的方法]
**截圖**: [如果適用]
```

### 快速參考連結

- **Zeabur 文檔**: https://zeabur.com/docs
- **Google Search Console 說明**: https://support.google.com/webmasters/
- **完整 SEO 遷移指南**: `docs/SEO_MIGRATION_GUIDE.md`
- **環境變數指南**: `docs/ENVIRONMENT_VARIABLES.md`

---

## 🎉 完成後的檢查清單

**全部完成後，確認以下項目**:

- [ ] 網站可透過 `https://app.haotool.org/ratewise` 訪問
- [ ] 所有功能正常運作
- [ ] SEO meta tags 包含新網域
- [ ] Google Search Console 驗證成功
- [ ] Sitemap 提交成功
- [ ] 首頁已請求索引
- [ ] Lighthouse 分數符合目標
- [ ] PWA 可正常安裝
- [ ] 版本資訊顯示正確

---

**預祝部署順利！如有任何問題，請隨時提出。** 🚀

**文檔維護**: RateWise Team  
**最後更新**: 2025-10-21T03:24:23+08:00
