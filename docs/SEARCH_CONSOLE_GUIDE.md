# Google Search Console 操作指南

> **建立時間**: 2025-12-13T02:51:00+08:00
> **最後更新**: 2025-12-14T03:30:00+08:00
> **狀態**: ✅ 已完成
> **適用專案**: HAOTOOL、RateWise、NihonName

---

## 📋 快速導航

```
1. 驗證網站 (5 分鐘) → 2. 提交 Sitemap (2 分鐘) → 3. 監控指標 (每週)
```

---

## 1️⃣ 網站驗證 (首次設定)

### HAOTOOL 作品集首頁 (新增 2025-12-14)

**網站 URL**: `https://app.haotool.org/`

**驗證方法 A: HTML 檔案上傳** ✅ 推薦

```bash
# 1. 從 Google Search Console 下載驗證檔案
# 例如: google1234567890abcdef.html

# 2. 放到 public/ 目錄
cp google1234567890abcdef.html apps/haotool/public/

# 3. 重新建置並部署
pnpm --filter @app/haotool build

# 4. 驗證檔案可訪問
curl -I https://app.haotool.org/google1234567890abcdef.html
# 預期: HTTP/2 200

# 5. 回到 Google Search Console 點擊「驗證」
```

**HAOTOOL 頁面清單**:

- `/` - 首頁
- `/projects/` - 作品集
- `/about/` - 關於
- `/contact/` - 聯絡

**Sitemap URL**: `https://app.haotool.org/sitemap.xml`

---

### RateWise 專案

**網站 URL**: `https://app.haotool.org/ratewise/`

**驗證方法 A: HTML 檔案上傳** ✅ 推薦

```bash
# 1. 從 Google Search Console 下載驗證檔案
# 例如: google1234567890abcdef.html

# 2. 放到 public/ 目錄
cp google1234567890abcdef.html apps/ratewise/public/

# 3. 重新建置並部署
pnpm --filter @app/ratewise build

# 4. 驗證檔案可訪問
curl -I https://app.haotool.org/ratewise/google1234567890abcdef.html
# 預期: HTTP/2 200

# 5. 回到 Google Search Console 點擊「驗證」
```

**驗證方法 B: HTML Meta 標籤**

```bash
# 1. 在 apps/ratewise/index.html 的 <head> 中加入
<meta name="google-site-verification" content="你的驗證碼" />

# 2. 重新建置並部署
pnpm --filter @app/ratewise build
```

### NihonName 專案

**網站 URL**: `https://app.haotool.org/nihonname/`

**步驟相同**，路徑改為：

```bash
# HTML 檔案
cp google1234567890abcdef.html apps/nihonname/public/

# 建置
pnpm --filter @app/nihonname build

# 驗證
curl -I https://app.haotool.org/nihonname/google1234567890abcdef.html
```

---

## 2️⃣ 提交 Sitemap

### RateWise

**Sitemap URL**: `https://app.haotool.org/ratewise/sitemap.xml`

```
1. 左側選單 → Sitemap
2. 輸入: sitemap.xml
3. 點擊「提交」
4. 狀態變為「成功」(通常幾小時內)
```

**驗證 Sitemap 可訪問**:

```bash
curl -I https://app.haotool.org/ratewise/sitemap.xml
# 預期: HTTP/2 200 + Content-Type: application/xml
```

### NihonName

**Sitemap URL**: `https://app.haotool.org/nihonname/sitemap.xml`

```
# 同樣步驟，提交 sitemap.xml
```

**驗證**:

```bash
curl -I https://app.haotool.org/nihonname/sitemap.xml
```

---

## 3️⃣ 手動請求索引 (加速收錄)

### 重要頁面優先索引

**RateWise**:

```
1. 左上角「網址檢查」
2. 輸入重要頁面:
   - https://app.haotool.org/ratewise/
   - https://app.haotool.org/ratewise/faq/
   - https://app.haotool.org/ratewise/about/
   - https://app.haotool.org/ratewise/guide/

3. 點擊「要求建立索引」
4. 等待處理 (通常 1-24 小時)
```

**NihonName**:

```
重要頁面:
- https://app.haotool.org/nihonname/
- https://app.haotool.org/nihonname/faq/
- https://app.haotool.org/nihonname/guide/
- https://app.haotool.org/nihonname/history/
```

### 限制

- 每個資源每天最多請求索引 **10 次**
- 優先處理新內容或重大更新

---

## 4️⃣ 每週監控檢查清單

### 核心指標 (每週一檢查)

**左側選單 → 涵蓋範圍**

```yaml
檢查項目:
  - ✅ 有效頁面數量 (應與 sitemap.xml 一致)
  - ❌ 錯誤數量 (應為 0)
  - ⚠️ 警告數量 (應為 0)

常見錯誤:
  - 404 Not Found → 修復連結或從 sitemap 移除
  - Soft 404 → 頁面內容不足，增加實質內容
  - 伺服器錯誤 (5xx) → 檢查伺服器日誌
  - robots.txt 封鎖 → 檢查 robots.txt 設定
```

**左側選單 → 成效**

```yaml
分析指標:
  - 總點擊次數 (Clicks)
  - 總曝光次數 (Impressions)
  - 平均點閱率 (CTR) - 目標 >2%
  - 平均排名 (Position) - 目標 <20

優化重點:
  - CTR <1% → 優化 title 和 description
  - 曝光高但點擊低 → 優化標題吸引力
  - 排名 >50 → 需要 SEO 優化
```

**左側選單 → Core Web Vitals**

```yaml
目標指標:
  - LCP (最大內容繪製) < 2.5s - ✅ 良好
  - FID (首次輸入延遲) < 100ms - ✅ 良好
  - CLS (累計版面配置位移) < 0.1 - ✅ 良好

全綠 = SEO 加分項
```

**左側選單 → 行動裝置可用性**

```yaml
檢查項目:
  - ❌ 文字太小而無法閱讀 → 調整 font-size
  - ❌ 可點擊元素距離太近 → 增加間距
  - ❌ 內容寬度超過螢幕 → 檢查 responsive 設計

目標: 0 個錯誤
```

---

## 5️⃣ 故障排除快速參考

### 問題 1: 網站未出現在搜尋結果

**檢查步驟**:

```bash
# 1. 確認索引狀態
# Google 搜尋: site:app.haotool.org/ratewise
# 有結果 = 已索引 | 無結果 = 未索引

# 2. 檢查 robots.txt
curl https://app.haotool.org/ratewise/robots.txt
# 確保有: User-agent: * 和 Allow: /

# 3. 檢查 Search Console 涵蓋範圍
# 左側選單 → 涵蓋範圍 → 查看錯誤詳情

# 4. 手動請求索引
# 網址檢查 → 輸入網址 → 要求建立索引
```

**常見原因**:

| 原因                     | 解決方案               | 預期時間 |
| ------------------------ | ---------------------- | -------- |
| 網站太新                 | 等待自然索引           | 3-7 天   |
| robots.txt 阻擋          | 修改 robots.txt        | 1-2 天   |
| Sitemap 未提交           | 提交 sitemap.xml       | 1-3 天   |
| 內容品質不足             | 增加實質內容 (≥300 字) | 1-2 週   |
| 技術問題 (404/5xx)       | 修復錯誤               | 1-3 天   |
| 手動操作 (Manual Action) | 提交重新審查請求       | 1-4 週   |

### 問題 2: Sitemap 提交失敗

**錯誤: "無法擷取"**

```bash
# 1. 驗證 sitemap.xml 可訪問
curl -I https://app.haotool.org/ratewise/sitemap.xml

# 2. 檢查 Content-Type
# 應為: application/xml 或 text/xml

# 3. 驗證 XML 格式
curl https://app.haotool.org/ratewise/sitemap.xml | head -20

# 4. 檢查 HTTPS 憑證
curl -I https://app.haotool.org/ratewise/ | grep -i "HTTP\|ssl"
```

**錯誤: "格式錯誤"**

```bash
# 使用線上驗證工具
# https://www.xml-sitemaps.com/validate-xml-sitemap.html

# 常見格式錯誤:
# - XML 標籤未閉合
# - 日期格式錯誤 (應為 YYYY-MM-DD)
# - URL 未使用絕對路徑
```

### 問題 3: 索引數量突然下降

**原因分析**:

```yaml
可能原因:
  1. robots.txt 誤阻擋:
    - 檢查: curl https://app.haotool.org/ratewise/robots.txt
    - 確保無誤擋重要頁面

  2. 網站改版:
    - 檢查: Search Console → 涵蓋範圍 → 404 錯誤
    - 設定 301 重新導向

  3. 手動操作懲罰:
    - 檢查: Search Console → 手動操作
    - 修正違規並提交重新審查

  4. 重複內容:
    - 檢查: canonical 標籤是否正確
    - 使用 rel="canonical" 指定主要版本
```

### 問題 4: Core Web Vitals 不佳

**優化步驟**:

```yaml
LCP (最大內容繪製) 優化:
  - 壓縮圖片 (WebP, AVIF)
  - 使用 CDN (Cloudflare)
  - 預載關鍵資源 (<link rel="preload">)
  - 移除渲染阻塞 CSS/JS

FID (首次輸入延遲) 優化:
  - 減少 JavaScript 執行時間
  - 程式碼分割 (Code Splitting)
  - 使用 Web Workers
  - 延遲載入非關鍵 JS

CLS (累計版面配置位移) 優化:
  - 為圖片設定明確尺寸
  - 預留廣告/嵌入內容空間
  - 避免在現有內容上方插入新內容
  - 使用 CSS aspect-ratio
```

---

## 6️⃣ 進階功能

### URL 參數處理

**用途**: 防止重複內容索引

```
設定 → URL 參數

範例:
- utm_source, utm_medium, utm_campaign → 不爬取
- ref, fbclid → 不爬取
```

### 國際化設定

**多語言網站**:

```html
<!-- 在 <head> 中加入 hreflang 標籤 -->
<link rel="alternate" hreflang="zh-TW" href="https://app.haotool.org/ratewise/" />
<link rel="alternate" hreflang="en" href="https://app.haotool.org/ratewise/en/" />
<link rel="alternate" hreflang="x-default" href="https://app.haotool.org/ratewise/" />
```

### 移除已刪除頁面

**步驟**:

```
1. 左側選單 → 移除
2. 點擊「新要求」
3. 輸入要移除的 URL
4. 選擇「暫時從搜尋結果中移除此網址」
5. 提交

注意:
- 暫時移除有效期 6 個月
- 永久移除需返回 404 或 410 狀態碼
```

---

## 7️⃣ 結構化資料驗證

### 驗證 JSON-LD Schema

**線上工具**:

```
1. Rich Results Test
   https://search.google.com/test/rich-results

2. Schema Markup Validator
   https://validator.schema.org/
```

**RateWise 應有 Schema**:

- ✅ WebApplication
- ✅ Organization
- ✅ FAQPage (faq 頁面)

**NihonName 應有 Schema**:

- ✅ WebApplication
- ✅ Organization
- ✅ FAQPage (faq 頁面)
- ✅ HowTo (guide 頁面)
- ✅ Article (history 相關頁面)

### 測試步驟

```bash
# 1. 開啟 Rich Results Test
# 2. 輸入頁面 URL
# 3. 等待測試完成
# 4. 確認無錯誤、無警告

# 範例
https://app.haotool.org/ratewise/faq/
https://app.haotool.org/nihonname/guide/
```

---

## 8️⃣ 自動化監控建議

### 設定警示通知

**Search Console → 設定 → 使用者和權限**

```
建議啟用:
- ✅ 涵蓋範圍問題通知
- ✅ 手動操作通知
- ✅ 安全性問題通知
- ✅ AMP 問題通知 (如有使用)
```

### Google Analytics 整合

```
1. Search Console → 設定 → 關聯
2. 選擇對應的 GA4 資源
3. 關聯後可在 GA4 中查看 Search Console 資料
```

---

## 9️⃣ 月度檢查清單

### 每月第一個週一執行

**效能檢查**:

- [ ] 涵蓋範圍錯誤數 = 0
- [ ] 索引頁面數與 sitemap 一致
- [ ] Core Web Vitals 全綠
- [ ] 行動裝置可用性無錯誤

**內容分析**:

- [ ] 檢視熱門查詢關鍵字
- [ ] 分析 CTR <1% 的頁面並優化
- [ ] 檢查排名下降的頁面
- [ ] 查看新索引的頁面

**安全性**:

- [ ] 無手動操作懲罰
- [ ] 無安全性問題
- [ ] HTTPS 憑證有效

**結構化資料**:

- [ ] Rich Results 無錯誤
- [ ] Schema 標記正確

---

## 🔟 常用指令速查

### 檢查網站索引狀態

```bash
# Google 搜尋
# RateWise
site:app.haotool.org/ratewise

# NihonName
site:app.haotool.org/nihonname

# 特定頁面
site:app.haotool.org/ratewise/faq
```

### 驗證靜態資源

```bash
# RateWise
curl -I https://app.haotool.org/ratewise/robots.txt
curl -I https://app.haotool.org/ratewise/sitemap.xml
curl -I https://app.haotool.org/ratewise/manifest.webmanifest

# NihonName
curl -I https://app.haotool.org/nihonname/robots.txt
curl -I https://app.haotool.org/nihonname/sitemap.xml
curl -I https://app.haotool.org/nihonname/manifest.webmanifest
```

### 檢查結構化資料

```bash
# 使用 curl + jq 提取 JSON-LD
curl -s https://app.haotool.org/ratewise/ | \
  grep -o '<script type="application/ld+json">.*</script>' | \
  sed 's/<script type="application\/ld+json">//;s/<\/script>//' | \
  jq .

# 檢查 schema type
curl -s https://app.haotool.org/nihonname/guide/ | \
  grep -o '<script type="application/ld+json">.*</script>' | \
  grep -o '"@type":"[^"]*"'
```

---

## 📊 成功指標

### 短期目標 (1-4 週)

```yaml
索引狀態:
  - ✅ 所有頁面已索引
  - ✅ 涵蓋範圍無錯誤
  - ✅ Sitemap 提交成功

技術指標:
  - ✅ Core Web Vitals 全綠
  - ✅ 行動裝置可用性 100%
  - ✅ 結構化資料無錯誤
```

### 中期目標 (2-3 個月)

```yaml
流量成長:
  - 自然搜尋點擊 >100/週
  - 曝光次數 >1000/週
  - 平均 CTR >2%

排名提升:
  - 品牌關鍵字排名 <5
  - 主要關鍵字排名 <20
  - 長尾關鍵字排名持續提升
```

### 長期目標 (6-12 個月)

```yaml
市場表現:
  - 自然搜尋流量佔比 >30%
  - 主要關鍵字排名 Top 10
  - 品牌搜尋量持續成長

業務影響:
  - 自然搜尋轉換率 >3%
  - SEO 帶來的收益穩定成長
  - 建立權威性和信任度
```

---

## 📚 延伸閱讀

### Google 官方資源

- [Search Console 說明中心](https://support.google.com/webmasters)
- [Google 搜尋中心](https://developers.google.com/search)
- [Core Web Vitals 指南](https://web.dev/vitals/)
- [結構化資料指南](https://developers.google.com/search/docs/appearance/structured-data)

### 專案相關文檔

- `SEO_SUBMISSION_GUIDE.md` - 完整 SEO 提交流程
- `SEO_GUIDE.md` - SEO 優化最佳實踐
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` - 部署檢查清單

---

## 🎯 總結

### 核心工作流程

```
每週一: 檢查涵蓋範圍、成效、Core Web Vitals
每月初: 執行完整檢查清單、分析趨勢、優化策略
有更新: 手動請求索引重要頁面
```

### 關鍵成功因素

1. **持續監控**: 每週檢查核心指標
2. **快速修復**: 發現錯誤立即處理
3. **內容優化**: 根據數據優化標題和描述
4. **技術卓越**: 維持 Core Web Vitals 全綠
5. **結構化資料**: 確保 Schema 正確無誤

---

> **提醒**: Search Console 資料有 1-3 天延遲，不要因為短期波動而過度反應。專注於長期趨勢和持續優化。

**最後更新**: 2025-12-13T02:51:00+08:00
