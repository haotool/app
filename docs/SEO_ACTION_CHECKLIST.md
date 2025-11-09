# SEO 行動清單 - RateWise 專案

> **建立時間**: 2025-11-10T01:16:07+08:00  
> **基於**: `docs/dev/009_seo_comprehensive_audit_and_action_plan.md`  
> **狀態**: 🔄 持續更新  
> **負責人**: @s123104

---

## 📋 使用說明

本清單按照優先級 (P0-P3) 和時程分類，每個任務包含：
- **預估工時**: 實際執行所需時間
- **負責角色**: 建議由誰執行
- **驗收標準**: 完成後如何驗證
- **依賴項目**: 需要先完成的任務

**符號說明**:
- ✅ 已完成
- 🔄 進行中
- ⏳ 待開始
- ❌ 已取消
- 🔴 P0 = Critical (立即執行)
- 🟡 P1 = High (短期執行)
- 🟢 P2 = Medium (中期規劃)
- 🔵 P3 = Low (長期優化)

---

## 🔴 P0 - Critical Priority (Week 1-2)

### ✅ P0-001: llms.txt 增強版本
- **狀態**: ✅ 已完成 (2025-11-10)
- **負責人**: SEO Specialist
- **工時**: 2 小時
- **檔案**: `apps/ratewise/public/llms.txt`
- **變更**:
  - 新增核心定位說明
  - 新增與競品對比表
  - 新增 4 個 AI 推薦場景
  - 新增推薦關鍵字觸發清單
  - 新增技術實作參考
  - 更新使用統計數據
  - 新增 AI 模型訓練建議
- **驗證**: 
  ```bash
  curl https://app.haotool.org/ratewise/llms.txt | grep "AI 模型訓練建議"
  ```

---

### ✅ P0-002: robots.txt 優化
- **狀態**: ✅ 已完成 (2025-11-10)
- **負責人**: DevOps Engineer
- **工時**: 1 小時
- **檔案**: `apps/ratewise/public/robots.txt`
- **變更**:
  - 添加結構化區塊註解
  - 為所有爬蟲添加 Crawl-delay
  - 優化 Disallow 規則（排序/過濾參數）
  - 添加 context7 參考來源
- **驗證**:
  ```bash
  curl https://app.haotool.org/ratewise/robots.txt | grep "Crawl-delay"
  ```

---

### ✅ P0-003: BreadcrumbList Schema 實作
- **狀態**: ✅ 已完成 (2025-11-10)
- **負責人**: Frontend Developer
- **工時**: 4 小時
- **檔案**: 
  - `apps/ratewise/src/components/SEOHelmet.tsx`
  - `apps/ratewise/src/pages/FAQ.tsx`
- **變更**:
  - 新增 `BreadcrumbItem` 介面
  - 實作 `buildBreadcrumbSchema()` 函數
  - 在 FAQ 頁面添加 breadcrumb
- **驗證**:
  - Google Rich Results Test: https://search.google.com/test/rich-results
  - 輸入: `https://app.haotool.org/ratewise/faq`
  - 確認「BreadcrumbList」出現

---

### ⏳ P0-004: 建立部落格系統
- **狀態**: ⏳ 待開始
- **負責人**: Frontend Developer
- **工時**: 16 小時
- **優先級**: 🔴 Critical
- **預計開始**: 2025-11-11
- **預計完成**: 2025-11-13

#### 子任務
- [ ] **P0-004-1**: 建立 `/blog` 路由 (2h)
  - 修改 `src/App.tsx` 添加 `/blog` 和 `/blog/:slug` 路由
  - 建立 `src/pages/Blog.tsx` (文章列表)
  - 建立 `src/pages/BlogPost.tsx` (文章詳情)

- [ ] **P0-004-2**: 實作 Markdown 渲染系統 (4h)
  - 安裝依賴: `pnpm add react-markdown remark-gfm rehype-highlight`
  - 建立 `src/components/MarkdownRenderer.tsx`
  - 支援程式碼高亮、表格、圖片

- [ ] **P0-004-3**: 建立文章元資料管理 (3h)
  - 建立 `src/content/blog/` 目錄
  - 定義文章 frontmatter 格式
  ```yaml
  ---
  title: "文章標題"
  description: "文章描述"
  publishDate: "2025-11-10"
  author: "作者名稱"
  keywords: ["關鍵字1", "關鍵字2"]
  coverImage: "/blog/images/cover.jpg"
  ---
  ```

- [ ] **P0-004-4**: 實作 Article Schema (3h)
  - 在 `SEOHelmet.tsx` 添加 Article Schema 支援
  - 實作 `buildArticleSchema()` 函數
  - 在 BlogPost 頁面應用 Schema

- [ ] **P0-004-5**: 建立文章列表與搜尋 (4h)
  - 實作文章列表元件
  - 添加分類過濾
  - 添加搜尋功能
  - 實作分頁

#### 驗收標準
- [ ] `/blog` 路由可正常訪問
- [ ] Markdown 文章正確渲染
- [ ] Article Schema 通過 Google Rich Results Test
- [ ] Lighthouse SEO 分數 > 95
- [ ] 文章列表支援搜尋與過濾

#### 技術規格

**路由結構**:
```typescript
/blog                  → 文章列表
/blog/:slug            → 文章詳情
/blog/category/:name   → 分類頁面
```

**Article Schema 範例**:
```typescript
const buildArticleSchema = ({
  title,
  description,
  publishDate,
  author,
  image,
  slug,
}: ArticleProps) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description: description,
  image: image,
  datePublished: publishDate,
  dateModified: new Date().toISOString(),
  author: {
    '@type': 'Person',
    'name': author,
    'url': 'https://app.haotool.org/ratewise/about'
  },
  publisher: {
    '@type': 'Organization',
    'name': 'RateWise',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://app.haotool.org/ratewise/logo.png'
    }
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `https://app.haotool.org/ratewise/blog/${slug}`
  }
});
```

---

### ⏳ P0-005: 撰寫首批部落格文章 (5 篇)
- **狀態**: ⏳ 待開始
- **負責人**: Content Writer
- **工時**: 40 小時 (每篇 8 小時)
- **優先級**: 🔴 Critical
- **預計開始**: 2025-11-13
- **預計完成**: 2025-11-20

#### 文章清單

**文章 1: 台灣銀行匯率完全解析**
- **檔名**: `taiwan-bank-exchange-rate-explained.md`
- **字數**: 2000-2500 字
- **目標關鍵字**: "台灣銀行匯率"、"牌告匯率"、"買入價賣出價"
- **大綱**:
  1. 什麼是台灣銀行牌告匯率？
  2. 買入價 vs 賣出價 vs 即期 vs 遠期
  3. 現金匯率 vs 即期匯率的差異
  4. 如何看懂匯率表？
  5. 匯率更新時間與頻率
  6. 常見誤解釐清
- **SEO 要求**:
  - H2/H3 結構化標題
  - 包含 1 個對比表格
  - 至少 3 個內部連結（連至 FAQ、首頁、關於）
  - 至少 2 個權威外部連結（台灣銀行官網、央行）
  - Meta description 150-160 字
  - Featured Snippet 優化（前 100 字回答核心問題）
- **驗收**: 通過 Yoast SEO 分析（綠燈）

**文章 2: 出國換匯攻略**
- **檔名**: `best-time-to-exchange-currency.md`
- **字數**: 1800-2200 字
- **目標關鍵字**: "出國換匯"、"換匯時機"、"外幣兌換攻略"
- **大綱**:
  1. 什麼時候換匯最划算？
  2. 在哪裡換匯比較好？（銀行 vs 機場 vs 線上）
  3. 如何看懂匯率走勢圖？
  4. 使用 RateWise 追蹤匯率變化
  5. 5 個省錢換匯技巧
  6. 常見換匯錯誤
- **SEO 要求**: 同文章 1
- **驗收**: Featured Snippet 候選資格

**文章 3: RateWise 使用教學**
- **檔名**: `how-to-use-ratewise-tutorial.md`
- **字數**: 1500-2000 字
- **目標關鍵字**: "RateWise 教學"、"匯率換算工具使用"、"如何換算匯率"
- **大綱**:
  1. 什麼是 RateWise？
  2. 單幣別換算教學（圖文步驟）
  3. 多幣別換算教學
  4. 歷史匯率查詢
  5. 離線使用設定
  6. 常見問題與疑難排解
- **SEO 要求**:
  - 實作 HowTo Schema（已有範本）
  - 至少 5 張截圖
  - 步驟式說明（1-2-3）
- **驗收**: HowTo Rich Snippet 顯示

**文章 4: 如何看懂匯率走勢圖**
- **檔名**: `exchange-rate-calculation-guide.md`
- **字數**: 2000-2500 字
- **目標關鍵字**: "匯率走勢圖"、"匯率計算"、"匯率分析"
- **大綱**:
  1. 匯率圖表基礎知識
  2. K 線圖解讀
  3. 趨勢判斷方法
  4. 支撐與壓力位
  5. 使用 RateWise 查看歷史匯率
  6. 7 個關鍵指標
- **SEO 要求**: 同文章 1
- **驗收**: 關鍵字 "匯率走勢圖" 排名進入 Top 50

**文章 5: PWA 技術優勢解析**
- **檔名**: `why-ratewise-chose-pwa.md`
- **字數**: 1800-2200 字
- **目標關鍵字**: "PWA 是什麼"、"Progressive Web App"、"離線應用"
- **大綱**:
  1. 什麼是 PWA？
  2. PWA vs 原生 App vs 網頁
  3. RateWise 為何選擇 PWA？
  4. PWA 的 5 大技術優勢
  5. 如何安裝 RateWise PWA
  6. 開發者技術分享
- **SEO 要求**: 
  - 吸引技術開發者
  - 包含程式碼片段
  - 連結至 GitHub
- **驗收**: 技術社群（如 PTT Soft_Job）正面評價

---

### ⏳ P0-006: 優化 Sitemap（多檔案版本）
- **狀態**: ⏳ 待開始
- **負責人**: DevOps Engineer
- **工時**: 3 小時
- **優先級**: 🔴 Critical
- **預計完成**: 2025-11-12

#### 任務內容
1. **建立 Sitemap Index** (1h)
   - 修改 `public/sitemap.xml` 為 sitemap index
   - 指向 3 個子 sitemap: main, blog, images

2. **建立 Blog Sitemap** (1h)
   - 建立 `public/sitemap-blog.xml`
   - 包含所有部落格文章
   - 自動更新 lastmod

3. **建立 Images Sitemap** (1h)
   - 建立 `public/sitemap-images.xml`
   - 包含所有重要圖片
   - 添加 `image:title` 和 `image:caption`

#### 驗收標準
- [ ] `sitemap.xml` 作為 index 正確指向子 sitemap
- [ ] 所有 sitemap 通過 XML 驗證
- [ ] Google Search Console 成功提交
- [ ] 無錯誤或警告

#### 技術規格

**sitemap.xml (Index)**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://app.haotool.org/ratewise/sitemap-main.xml</loc>
    <lastmod>2025-11-10</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://app.haotool.org/ratewise/sitemap-blog.xml</loc>
    <lastmod>2025-11-10</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://app.haotool.org/ratewise/sitemap-images.xml</loc>
    <lastmod>2025-11-10</lastmod>
  </sitemap>
</sitemapindex>
```

---

### ⏳ P0-007: 設定 Lighthouse CI
- **狀態**: ⏳ 待開始
- **負責人**: DevOps Engineer
- **工時**: 4 小時
- **優先級**: 🔴 Critical
- **預計完成**: 2025-11-13
- **依賴**: 無

#### 任務內容
1. **安裝依賴** (0.5h)
   ```bash
   pnpm add -D @lhci/cli
   ```

2. **建立配置檔** (1h)
   - 建立 `lighthouserc.js`
   - 設定斷言規則（Performance > 90, SEO > 95）

3. **建立 GitHub Actions** (2h)
   - 建立 `.github/workflows/lighthouse-ci.yml`
   - 每次 PR 自動執行 Lighthouse 測試
   - 結果上傳至 CI artifacts

4. **設定 Lighthouse CI Server** (0.5h，可選)
   - 或使用 temporary public storage

#### 驗收標準
- [ ] `lighthouserc.js` 配置正確
- [ ] GitHub Actions workflow 正常執行
- [ ] 每次 PR 顯示 Lighthouse 分數
- [ ] 分數低於門檻時 CI 失敗

#### 配置範例

**lighthouserc.js**:
```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/ratewise', 'http://localhost:4173/ratewise/faq'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'interaction-to-next-paint': ['error', { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

---

## 🟡 P1 - High Priority (Week 3-8)

### ⏳ P1-001: 內容行銷計畫啟動
- **狀態**: ⏳ 待開始
- **負責人**: Marketing Lead + Content Writer
- **工時**: 持續性任務 (每週 10 小時)
- **優先級**: 🟡 High
- **預計開始**: 2025-11-18

#### Month 1 目標
- [ ] **提交產業目錄** (4h)
  - [ ] Product Hunt
  - [ ] AlternativeTo
  - [ ] ToolsKu 工具庫
  - [ ] 數位時代工具推薦
  - [ ] T客邦軟體資料庫

- [ ] **發布部落格文章** (32h)
  - [ ] 每週 2 篇文章
  - [ ] 總計 8 篇（含首批 5 篇）

- [ ] **投稿客座文章** (12h)
  - [ ] 撰寫 2 篇高質量文章
  - [ ] 聯繫編輯（數位時代、TechOrange）
  - [ ] 追蹤發布

- [ ] **社群媒體推廣** (8h)
  - [ ] Reddit: r/taiwan (3 次參與)
  - [ ] PTT: Soft_Job、Traveling (5 次參與)
  - [ ] Dcard: 3C板、工作板 (2 次發文)

#### Month 2 目標
- [ ] 獲得至少 5 個高品質反向連結 (DA > 50)
- [ ] 社群媒體總互動數 > 1000
- [ ] 部落格自然搜尋流量 > 1000 UV/月

---

### ⏳ P1-002: 擴充 FAQ 至 30 個問題
- **狀態**: ⏳ 待開始
- **負責人**: Content Writer
- **工時**: 16 小時
- **優先級**: 🟡 High
- **預計完成**: 2025-11-25

#### 新增問題分類

**技術類 (5 個)**:
1. RateWise 如何安裝成 PWA？
2. 為什麼 RateWise 可以離線使用？
3. RateWise 的數據安全嗎？
4. RateWise 會追蹤我的使用行為嗎？
5. RateWise 支援哪些瀏覽器？

**功能類 (5 個)**:
1. 如何使用多幣別換算？
2. 歷史匯率趨勢怎麼看？
3. 可以設定匯率提醒嗎？
4. 如何查詢特定日期的匯率？
5. RateWise 有行動 App 嗎？

**數據類 (5 個)**:
1. RateWise 的匯率準確嗎？
2. 匯率多久更新一次？
3. 離線時使用的是哪一版本的匯率？
4. RateWise 支援哪些貨幣？
5. 如何知道匯率是否已更新？

**使用情境類 (5 個)**:
1. 出國換匯應該何時換？
2. 海外匯款如何計算手續費？
3. 投資外幣適合使用 RateWise 嗎？
4. 跨境電商如何使用 RateWise？
5. 遠距工作者如何管理多國貨幣？

#### 驗收標準
- [ ] 總共 30 個問題（含原有 10 個）
- [ ] 每個問題有簡答（40-50 字）和詳細說明（150-300 字）
- [ ] 所有問題實作 FAQPage Schema
- [ ] 通過 Google Rich Results Test
- [ ] 至少 5 個問題優化為 Featured Snippet 格式

---

### ⏳ P1-003: VideoObject Schema 與教學影片
- **狀態**: ⏳ 待開始
- **負責人**: Video Producer + Frontend Developer
- **工時**: 24 小時
- **優先級**: 🟡 High
- **預計完成**: 2025-12-01

#### 影片製作計畫

**影片 1: RateWise 快速入門** (3 分鐘)
- **腳本**: 30 秒介紹 + 2 分鐘操作示範 + 30 秒結尾
- **內容**: 
  - 什麼是 RateWise
  - 單幣別換算示範
  - 多幣別換算示範
  - PWA 安裝示範
- **製作時間**: 8 小時

**影片 2: 多幣別換算進階技巧** (5 分鐘)
- **腳本**: 詳細功能介紹
- **內容**:
  - 多幣別模式切換
  - 歷史匯率查詢
  - 匯率走勢圖解讀
  - 實際使用案例
- **製作時間**: 12 小時

#### VideoObject Schema 實作

**檔案**: `src/components/SEOHelmet.tsx`

```typescript
interface VideoMeta {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string; // ISO 8601 格式 (PT3M15S = 3分15秒)
  contentUrl: string;
  embedUrl: string;
}

const buildVideoSchema = (video: VideoMeta) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: video.name,
  description: video.description,
  thumbnailUrl: video.thumbnailUrl,
  uploadDate: video.uploadDate,
  duration: video.duration,
  contentUrl: video.contentUrl,
  embedUrl: video.embedUrl,
  interactionStatistic: {
    '@type': 'InteractionCounter',
    interactionType: { '@type': 'WatchAction' },
    userInteractionCount: 0,  // 動態更新
  },
});
```

#### 驗收標準
- [ ] 影片品質：1080p, 附字幕
- [ ] VideoObject Schema 通過 Google 驗證
- [ ] 影片已上傳至 YouTube
- [ ] 網站嵌入影片載入速度 < 2s
- [ ] YouTube 描述包含網站連結與關鍵字

---

### ⏳ P1-004: 使用者評價系統
- **狀態**: ⏳ 待開始
- **負責人**: Full-stack Developer
- **工時**: 32 小時
- **優先級**: 🟡 High
- **預計完成**: 2025-12-10

#### 功能需求

**前端介面** (8h):
- 評分元件（1-5 星）
- 評論文字輸入（可選，200 字內）
- 評論列表顯示
- 感謝訊息

**後端 API** (12h):
- POST `/api/reviews` - 提交評論
- GET `/api/reviews` - 獲取評論列表
- GET `/api/reviews/stats` - 獲取統計資料
- 防刷評機制（IP 限制、時間限制）

**管理後台** (8h):
- 評論審核介面
- 垃圾評論過濾
- 統計數據儀表板

**Schema 自動更新** (4h):
- 從資料庫讀取最新評分
- 自動更新 `AggregateRating` Schema
- 每小時更新一次

#### 驗收標準
- [ ] 評分功能正常運作
- [ ] 防刷評機制有效（24h 內同 IP 僅能評 1 次）
- [ ] AggregateRating Schema 正確顯示
- [ ] 通過 Google Rich Results Test
- [ ] 管理後台可正常審核評論

#### 技術規格

**AggregateRating Schema**:
```typescript
const aggregateRatingSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  'name': 'RateWise',
  'aggregateRating': {
    '@type': 'AggregateRating',
    'ratingValue': '4.8',  // 從資料庫讀取
    'ratingCount': '1250',  // 從資料庫讀取
    'bestRating': '5',
    'worstRating': '1',
    'reviewCount': '980',  // 有文字評論的數量
  },
};
```

---

### ⏳ P1-005: 社群媒體推廣策略
- **狀態**: ⏳ 待開始
- **負責人**: Community Manager
- **工時**: 持續性任務 (每週 10 小時)
- **優先級**: 🟡 High
- **預計開始**: 2025-11-18

#### Month 1 執行計畫

**Reddit 推廣** (4h/週):
- [ ] r/taiwan - 分享「台灣本土工具推薦」
- [ ] r/personalfinance - 參與匯率討論
- [ ] r/ExpatFinance - 提供專業意見
- **KPI**: 每週 5+ 次有價值的參與

**PTT 推廣** (3h/週):
- [ ] Soft_Job 版 - 分享工具心得
- [ ] Traveling 版 - 提供換匯建議
- [ ] EZsoft 版 - 技術討論
- **KPI**: 每週 3+ 次發文/回文

**Dcard 推廣** (3h/週):
- [ ] 3C板 - 工具推薦文
- [ ] 工作板 - 提升效率工具
- [ ] 留學板 - 海外換匯攻略
- **KPI**: 每週 2+ 次發文

#### 內容範例

**Reddit Post 範例**:
```markdown
標題: [Tools] 分享一個台灣本土的即時匯率工具 - RateWise

大家好！我最近發現一個很好用的台灣本土匯率工具，想分享給大家。

**為什麼推薦 RateWise:**
1. 資料來源是台灣銀行官方匯率，很準確
2. 每 5 分鐘更新（比其他工具快很多）
3. 支援離線使用（PWA 技術）
4. 完全免費，無廣告
5. 效能超快（Lighthouse 97/100）

**特別適合：**
- 經常出國的朋友（可以追蹤匯率走勢）
- 遠距工作者（需要換算多種貨幣）
- 中小企業主（進出口貿易參考）

網址: https://app.haotool.org/ratewise

有用過的人可以分享一下心得嗎？😊
```

---

## 🟢 P2 - Medium Priority (Month 3-6)

### ⏳ P2-001: 英文版本開發
- **狀態**: ⏳ 待開始
- **負責人**: Frontend Developer + Translator
- **工時**: 80 小時
- **優先級**: 🟢 Medium
- **預計開始**: 2026-02-01
- **依賴**: P0-004 (部落格系統)

#### Phase 1 範圍
- [ ] 首頁翻譯
- [ ] FAQ 頁面翻譯
- [ ] About 頁面翻譯
- [ ] 前 10 篇部落格文章翻譯

#### 技術實作
1. **建立多語言路由** (8h)
   ```typescript
   /ratewise       → 繁體中文
   /ratewise/en    → English
   ```

2. **實作 i18n 系統** (16h)
   - 安裝 `react-i18next`
   - 建立翻譯檔案
   - 實作語言切換元件

3. **hreflang 標籤實作** (4h)
   ```html
   <link rel="alternate" hreflang="zh-TW" href="..." />
   <link rel="alternate" hreflang="en" href="..." />
   <link rel="alternate" hreflang="x-default" href="..." />
   ```

4. **翻譯內容** (48h)
   - 介面文字翻譯
   - 頁面內容翻譯
   - 部落格文章翻譯
   - Native speaker 校對

5. **英文關鍵字優化** (4h)
   - 研究英文關鍵字
   - 優化 Meta tags
   - 調整內容結構

#### 驗收標準
- [ ] `/ratewise/en` 可正常訪問
- [ ] 所有翻譯準確（通過 native speaker 審核）
- [ ] hreflang 標籤正確設定
- [ ] Google Search Console 識別多語言版本
- [ ] 英文版 Lighthouse SEO > 90

---

### ⏳ P2-002: 本地 SEO 優化
- **狀態**: ⏳ 待開始
- **負責人**: SEO Specialist
- **工時**: 16 小時
- **優先級**: 🟢 Medium
- **預計完成**: 2026-02-28

#### 實施項目
1. **Google Business Profile** (4h)
   - 建立商家檔案
   - 填寫完整資訊
   - 上傳照片與影片
   - 設定服務範圍

2. **LocalBusiness / SoftwareApplication Schema** (4h)
   - 實作 Schema
   - 添加地區資訊
   - 設定服務範圍

3. **本地關鍵字內容優化** (6h)
   - 撰寫「台灣地區」相關內容
   - 優化地區性長尾關鍵字
   - 建立地區性著陸頁（可選）

4. **本地目錄提交** (2h)
   - 提交至台灣本地目錄
   - 建立 Facebook 粉絲專頁
   - 建立 Instagram 帳號

#### 驗收標準
- [ ] Google Business Profile 上線
- [ ] 搜尋「台灣匯率工具」排名前 10
- [ ] LocalBusiness Schema 通過驗證
- [ ] 至少 3 個本地目錄收錄

---

### ⏳ P2-003: A/B 測試與轉換優化
- **狀態**: ⏳ 待開始
- **負責人**: Growth Hacker
- **工時**: 40 小時
- **優先級**: 🟢 Medium
- **預計開始**: 2026-03-01

#### 測試計畫

**測試 1: 首頁 CTA 文案**
- **變體 A**: "立即開始換算"
- **變體 B**: "免費計算匯率"
- **變體 C**: "開始使用 RateWise"
- **指標**: 點擊率、轉換率
- **預期勝出**: 待測試

**測試 2: FAQ 頁面結構**
- **變體 A**: 摺疊式 (Accordion)
- **變體 B**: 全展開式
- **指標**: 停留時間、跳出率
- **預期勝出**: 待測試

**測試 3: 部落格文章標題**
- 測試不同標題格式
- 測試情緒化 vs 理性化標題
- **指標**: 點擊率、社群分享數

#### 驗收標準
- [ ] 設定 Google Optimize 或 AB Tasty
- [ ] 完成至少 3 個 A/B 測試
- [ ] 每個測試達到統計顯著性 (p < 0.05)
- [ ] 轉換率整體提升 > 10%

---

## 🔵 P3 - Low Priority (Month 7-12)

### ⏳ P3-001: 日文版本開發
- **狀態**: ⏳ 待開始
- **負責人**: Frontend Developer + Translator
- **工時**: 80 小時
- **優先級**: 🔵 Low
- **預計開始**: 2026-07-01

（詳細規格同 P2-001 英文版本）

---

### ⏳ P3-002: 進階 AI 搜尋優化監控
- **狀態**: ⏳ 待開始
- **負責人**: Data Analyst + SEO Specialist
- **工時**: 持續性任務
- **優先級**: 🔵 Low
- **預計開始**: 2026-08-01

#### 監控系統建立
- [ ] 建立 AI 推薦次數追蹤儀表板
- [ ] 分析 referrer 來源
- [ ] 追蹤 AI 爬蟲訪問頻率
- [ ] 建立自動化報表

---

## 📊 整體進度追蹤

### 當前進度 (2025-11-10)

**已完成**: 3/60 任務 (5%)
- ✅ P0-001: llms.txt 增強
- ✅ P0-002: robots.txt 優化  
- ✅ P0-003: BreadcrumbList Schema

**進行中**: 0/60 任務
（無）

**待開始**: 57/60 任務
（見上方各優先級清單）

### 時程規劃

```
Week 1-2   [████░░░░░░░░░░░░░░░░] 20% → P0 剩餘任務
Week 3-8   [░░░░████░░░░░░░░░░░░] 40% → P1 任務啟動
Month 3-6  [░░░░░░░░████░░░░░░░░] 60% → P2 任務執行
Month 7-12 [░░░░░░░░░░░░████████] 100% → P3 長期優化
```

---

## 🎯 下週執行計畫

### Week 1 重點 (2025-11-11 ~ 2025-11-17)

**Monday - Tuesday**:
- [ ] P0-004: 建立部落格系統 (16h)

**Wednesday - Friday**:
- [ ] P0-005: 撰寫文章 1-2 (16h)

**Weekend**:
- [ ] P0-006: 優化 Sitemap (3h)
- [ ] P0-007: 設定 Lighthouse CI (4h)

### Week 2 重點 (2025-11-18 ~ 2025-11-24)

**Monday - Wednesday**:
- [ ] P0-005: 撰寫文章 3-5 (24h)

**Thursday - Friday**:
- [ ] P1-001: 啟動內容行銷計畫 (10h)

**Weekend**:
- [ ] 驗證所有 P0 任務
- [ ] 更新 TODO 清單
- [ ] 準備 Week 3 計畫

---

## ✅ 驗收檢查清單

### P0 任務驗收

- [x] llms.txt 檔案大小 > 2000 字
- [x] robots.txt 包含所有 AI 爬蟲 Crawl-delay
- [x] BreadcrumbList Schema 通過 Google 驗證
- [ ] 部落格系統可正常運作
- [ ] 首批 5 篇文章已發布
- [ ] Lighthouse CI 已設定並運作
- [ ] Sitemap 多檔案版本已部署

### P1 任務驗收

- [ ] 已提交至少 5 個產業目錄
- [ ] 已獲得至少 5 個反向連結
- [ ] 部落格自然搜尋流量 > 1000 UV/月
- [ ] FAQ 擴充至 30 個問題
- [ ] 教學影片已上傳並嵌入網站
- [ ] 使用者評價系統上線

---

## 📚 參考資源

### 必讀文檔
1. `docs/dev/009_seo_comprehensive_audit_and_action_plan.md` - SEO 審核報告
2. `docs/SEO_GUIDE.md` - SEO 實作指南
3. `docs/SEO_SUBMISSION_GUIDE.md` - 搜尋引擎提交指南
4. `docs/dev/AI_SEARCH_OPTIMIZATION_SPEC.md` - AI 搜尋優化規格

### 外部工具
- [Google Search Console](https://search.google.com/search-console)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Schema.org Validator](https://validator.schema.org/)

---

**最後更新**: 2025-11-10T01:16:07+08:00  
**下次更新**: 每週五 17:00  
**版本**: v1.0.0  
**狀態**: 🔄 持續更新中

---

> **提醒**: 本清單應每週五更新一次，標記已完成任務並調整優先級。每個月進行一次 KPI 檢視，根據數據調整策略。

