# SEO 網站提交指南

> **建立時間**: 2025-10-24T23:23:09+08:00  
> **最後更新**: 2025-10-30T04:03:03+08:00  
> **狀態**: ✅ 已更新 (Zeabur `/ratewise` 部署支援)  
> **適用對象**: 所有需要將網站提交到搜尋引擎的開發者

---

## 📋 提交流程總覽

```
1. Google Search Console (必做) ⭐
   ↓
2. Bing Webmaster Tools (必做) ⭐
   ↓
3. 社群媒體驗證 (建議)
   ↓
4. 其他搜尋引擎 (選做)
```

---

## 0️⃣ 部署前檢查（Zeabur `/ratewise`）

在提交搜尋引擎前，先確認子路徑靜態資產與環境變數。

```bash
# 1. 確認環境變數
echo $VITE_BASE_PATH  # 預期輸出 /ratewise/

# 2. 靜態資產狀態碼
curl -I https://app.haotool.org/ratewise/robots.txt
curl -I https://app.haotool.org/ratewise/sitemap.xml
curl -I https://app.haotool.org/ratewise/llms.txt
curl -I https://app.haotool.org/ratewise/manifest.webmanifest
curl -I https://app.haotool.org/ratewise/favicon.ico
```

若上述任何指令未回傳 `HTTP/2 200`，執行 `node scripts/update-release-metadata.js` 重新鏡像靜態資產並重新部署。

---

## 1️⃣ Google Search Console (必做)

### 🎯 為什麼重要？

- Google 佔全球搜尋市場 90%+
- 監控索引狀態、效能表現
- 修復爬取錯誤

### 📝 詳細步驟

#### 步驟 1: 註冊並新增網站

1. 前往 [Google Search Console](https://search.google.com/search-console)
2. 使用 Google 帳號登入
3. 點擊左上角「新增資源」
4. 選擇「**網址前置字元**」（推薦，較簡單）
5. 輸入完整網址：`https://app.haotool.org/ratewise/`

#### 步驟 2: 驗證網站擁有權

**方法 A：HTML 檔案上傳** ✅ 最簡單

```bash
# 1. 下載 Google 提供的 HTML 檔案（例如：google1234567890abcdef.html）
# 2. 放到專案的 public/ 資料夾
cp google1234567890abcdef.html /Users/azlife.eth/Tools/app/apps/ratewise/public/

# 3. 重新建置並部署
pnpm build
# 部署到 Cloudflare/Vercel/Netlify

# 4. 回到 Google Search Console 點擊「驗證」
```

**方法 B：HTML 標籤**

```html
<!-- 在 index.html 的 <head> 中加入 -->
<meta name="google-site-verification" content="你的驗證碼" />
```

**方法 C：DNS 驗證**（需要網域控制權）

```txt
# 在 DNS 設定中新增 TXT 記錄
名稱: @
類型: TXT
值: google-site-verification=你的驗證碼
```

#### 步驟 3: 提交 Sitemap

```
1. 驗證成功後，左側選單點擊「Sitemap」
2. 輸入：sitemap.xml
3. 點擊「提交」
4. 等待 Google 爬取（通常 1-7 天）
```

#### 步驟 4: 監控與優化

**每週檢查**:

- 左側選單 → **涵蓋範圍**：查看索引狀態
- 左側選單 → **成效**：查看點擊率、曝光次數
- 左側選單 → **Core Web Vitals**：查看效能指標

**修復常見問題**:

- ❌ 404 錯誤 → 修復或移除 Sitemap 中的網址
- ❌ Soft 404 → 確保頁面有實質內容
- ❌ 爬取錯誤 → 檢查 robots.txt 是否阻擋

---

## 2️⃣ Bing Webmaster Tools (必做)

### 🎯 為什麼重要？

- Bing 佔搜尋市場 3-5%
- 影響 Yahoo、DuckDuckGo 等搜尋引擎
- 設定比 Google 更簡單

### 📝 詳細步驟

#### 步驟 1: 註冊並新增網站

1. 前往 [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. 使用 Microsoft 帳號登入
3. 點擊「新增網站」
4. 輸入：`https://app.haotool.org/ratewise/`

#### 步驟 2: 匯入 Google Search Console 資料（快速）

```
✅ 推薦方式：直接從 Google Search Console 匯入

1. 在新增網站頁面選擇「從 Google Search Console 匯入」
2. 授權連結 Google 帳號
3. 自動匯入網站資料與驗證
4. 完成！（最快 5 分鐘）
```

#### 步驟 3: 手動驗證（如果不使用匯入）

**選項 1：XML 檔案**

```bash
# 下載 BingSiteAuth.xml
cp BingSiteAuth.xml /Users/azlife.eth/Tools/app/apps/ratewise/public/
pnpm build
# 部署後點擊「驗證」
```

**選項 2：Meta 標籤**

```html
<meta name="msvalidate.01" content="你的驗證碼" />
```

#### 步驟 4: 提交 Sitemap

```
1. 左側選單 → Sitemap
2. 輸入：https://app.haotool.org/ratewise/sitemap.xml
3. 點擊「提交」
```

#### 步驟 5: 手動提交 URL（加速索引）

```
工具 → 提交 URL
輸入重要頁面網址：
- https://app.haotool.org/ratewise/
- https://app.haotool.org/ratewise/faq
- https://app.haotool.org/ratewise/about
```

---

## 3️⃣ 社群媒體驗證（建議）

### Facebook Open Graph 除錯工具

**用途**: 確保 Facebook 正確抓取 OG 標籤

```
1. 前往 https://developers.facebook.com/tools/debug/
2. 輸入：https://app.haotool.org/ratewise/
3. 點擊「除錯」
4. 查看預覽圖片、標題、描述
5. 如果有錯誤，修正後點擊「重新抓取」
```

**注意事項**:

- Facebook 會快取 OG 資料（約 30 天）
- 更新後必須手動重新抓取

### Twitter Card 驗證工具

**用途**: 確保 Twitter 正確顯示卡片

```
1. 前往 https://cards-dev.twitter.com/validator
2. 輸入：https://app.haotool.org/ratewise/
3. 點擊「Preview card」
4. 查看卡片顯示效果
```

### LinkedIn Post Inspector

**用途**: 確保 LinkedIn 正確抓取資訊

```
1. 前往 https://www.linkedin.com/post-inspector/
2. 輸入：https://app.haotool.org/ratewise/
3. 查看預覽效果
```

---

## 4️⃣ 其他搜尋引擎（選做）

### Yandex (俄羅斯)

```
網址：https://webmaster.yandex.com/
步驟：
1. 註冊 Yandex 帳號
2. 新增網站：https://app.haotool.org/ratewise/
3. 驗證方式：HTML 檔案或 Meta 標籤
4. 提交 Sitemap
```

### Baidu (中國)

```
網址：https://ziyuan.baidu.com/
步驟：
1. 需要中國手機號碼註冊
2. 新增網站並驗證
3. 提交 Sitemap
注意：需要 ICP 備案才能完整使用
```

### Naver (韓國)

```
網址：https://searchadvisor.naver.com/
步驟：
1. 註冊 Naver 帳號
2. 新增網站
3. 驗證並提交 Sitemap
```

### DuckDuckGo

```
說明：DuckDuckGo 主要使用 Bing 的索引
操作：提交到 Bing 後會自動涵蓋
```

---

## 5️⃣ 提交後驗證

### 檢查索引狀態

**Google 搜尋測試**

```
1. 在 Google 搜尋框輸入：site:app.haotool.org/ratewise
2. 應該看到網站頁面列表
3. 如果沒有結果，等待 1-7 天
```

**Bing 搜尋測試**

```
1. 在 Bing 搜尋框輸入：site:app.haotool.org/ratewise
2. 查看索引頁面
```

### 手動請求索引（加速）

**Google Search Console**

```
1. 左上角「網址檢查」
2. 輸入：https://app.haotool.org/ratewise/
3. 點擊「要求建立索引」
4. 等待處理（通常幾小時到 1 天）
```

**Bing Webmaster Tools**

```
1. 工具 → 提交 URL
2. 輸入網址
3. 提交（每天最多 10 個 URL）
```

---

## 6️⃣ 進階：結構化資料驗證

### Rich Results Test (Google)

```
1. 前往 https://search.google.com/test/rich-results
2. 輸入：https://app.haotool.org/ratewise/
3. 點擊「測試網址」
4. 確認結構化資料無錯誤
```

**應該通過的 Schema 類型**:

- ✅ WebApplication
- ✅ Organization
- ✅ FAQPage (如有 FAQ 頁面)

### Schema Markup Validator

```
1. 前往 https://validator.schema.org/
2. 輸入網址或貼上程式碼
3. 驗證 JSON-LD 格式
```

---

## 7️⃣ 常見問題 FAQ

### Q1: 提交後多久會被索引？

**答**:

- **Google**: 通常 1-7 天，最快幾小時
- **Bing**: 通常 3-7 天
- **其他**: 1-4 週

**加速方法**:

1. 使用「要求建立索引」功能
2. 建立高品質反向連結
3. 在社群媒體分享網址

### Q2: 為什麼我的網站沒有出現在搜尋結果？

**可能原因**:

1. **robots.txt 阻擋**

   ```bash
   # 檢查
   curl https://app.haotool.org/ratewise/robots.txt

   # 確保有
   User-agent: *
   Allow: /
   ```

2. **網站太新**
   - 解決：耐心等待 1-2 週

3. **內容品質問題**
   - 解決：確保有實質內容（至少 300 字）

4. **技術問題**
   - 檢查：Google Search Console → 涵蓋範圍

### Q3: 如何提升搜尋排名？

**核心因素**:

1. **內容品質** (最重要)
   - 原創、有價值的內容
   - 清晰的標題與結構
   - 定期更新

2. **技術 SEO**
   - Core Web Vitals 通過
   - HTTPS 啟用
   - 行動裝置友善

3. **反向連結**
   - 從高權威網站獲得連結
   - 自然、相關的連結

4. **使用者體驗**
   - 低跳出率
   - 高停留時間
   - 良好的互動率

### Q4: 我需要付費給 Google 才能被索引嗎？

**答**: ❌ **完全不需要**

- Google Search Console 完全免費
- 索引是自動的，不收費
- Google Ads 不影響自然搜尋排名

---

## 8️⃣ 快速檢查清單

### 提交前準備

- [ ] Sitemap.xml 已建立並可存取
- [ ] Robots.txt 已設定正確
- [ ] Meta tags 完整（title, description）
- [ ] Open Graph 標籤正確
- [ ] 結構化資料通過驗證
- [ ] HTTPS 已啟用
- [ ] 網站速度良好（Lighthouse > 90）

### 提交流程

- [ ] Google Search Console 已驗證
- [ ] Google Sitemap 已提交
- [ ] Bing Webmaster Tools 已驗證
- [ ] Bing Sitemap 已提交
- [ ] Facebook OG 除錯完成
- [ ] Twitter Card 驗證完成

### 上線後監控

- [ ] 每週檢查 Google Search Console
- [ ] 每週檢查 Bing Webmaster Tools
- [ ] 每月分析搜尋關鍵字表現
- [ ] 每月檢查斷鏈 (broken links)

---

## 9️⃣ 實用連結整理

### 搜尋引擎工具

| 平台       | 工具連結                                                         | 用途           |
| ---------- | ---------------------------------------------------------------- | -------------- |
| Google     | [Search Console](https://search.google.com/search-console)       | 網站管理       |
| Google     | [Rich Results Test](https://search.google.com/test/rich-results) | 結構化資料測試 |
| Google     | [PageSpeed Insights](https://pagespeed.web.dev/)                 | 效能分析       |
| Bing       | [Webmaster Tools](https://www.bing.com/webmasters)               | 網站管理       |
| Facebook   | [Sharing Debugger](https://developers.facebook.com/tools/debug/) | OG 標籤除錯    |
| Twitter    | [Card Validator](https://cards-dev.twitter.com/validator)        | 卡片驗證       |
| LinkedIn   | [Post Inspector](https://www.linkedin.com/post-inspector/)       | 貼文預覽       |
| Schema.org | [Validator](https://validator.schema.org/)                       | Schema 驗證    |

### 分析工具

- [Google Analytics 4](https://analytics.google.com/) - 流量分析
- [Cloudflare Analytics](https://www.cloudflare.com/analytics/) - CDN 分析
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - 效能監控

---

## 🎉 總結

### 最少必做項目

```
✅ 1. Google Search Console 驗證並提交 Sitemap
✅ 2. Bing Webmaster Tools 驗證並提交 Sitemap
✅ 3. Facebook OG 除錯確認
✅ 4. 每週監控索引狀態
```

### 預期時程

```
當天：完成驗證與提交
3-7 天：開始出現在搜尋結果
2-4 週：索引穩定
2-3 個月：搜尋排名逐步提升
```

### 成功指標

```
✅ site:app.haotool.org/ratewise 有結果
✅ Google Search Console 涵蓋範圍 > 0
✅ 每週自然搜尋流量 > 0
✅ Core Web Vitals 全綠
```

---

> **持續優化**: SEO 是長期工作，需要持續監控和優化。建議每月檢視一次本指南，確保所有項目都已完成。

**最後更新**: 2025-10-24T23:23:09+08:00
