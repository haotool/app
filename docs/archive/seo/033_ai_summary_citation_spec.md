# AI 摘要引用結構規範

> **建立日期**: 2026-01-04T00:35:00+08:00
> **最後更新**: 2026-01-04T00:35:00+08:00
> **版本**: v1.0
> **狀態**: ✅ 已完成
> **參考來源**: [context7:/websites/developers_google_search:2026-01-04]

---

## 📋 概述

本文檔定義提高內容被搜尋引擎 AI 摘要（如 Google AI Overview、Bing Copilot）引用機率的內容結構規範。

**核心原則**：根據 Google Search Central 官方文檔，AI 功能使用與一般搜尋相同的基礎 SEO 最佳實踐，無需額外的技術優化。

---

## 🎯 技術要求（必要條件）

### 1. 可收錄性要求

| 要求                     | 驗證方法                           | 狀態 |
| ------------------------ | ---------------------------------- | ---- |
| robots.txt 允許爬取      | `curl https://site.com/robots.txt` | ✅   |
| CDN/主機不阻擋 Googlebot | Search Console 涵蓋範圍報告        | ✅   |
| 頁面可索引               | `site:domain.com` 查詢             | ✅   |
| 允許顯示摘要             | 無 `nosnippet` meta                | ✅   |

### 2. 結構化資料要求

根據專案需求，推薦的 Schema.org 類型：

| 內容類型  | Schema 類型           | 必填欄位                          | 選填欄位                      |
| --------- | --------------------- | --------------------------------- | ----------------------------- |
| 網站首頁  | Organization, WebSite | name, url, logo                   | sameAs, contactPoint          |
| 工具/應用 | SoftwareApplication   | name, applicationCategory, offers | aggregateRating, screenshot   |
| 文章/教學 | Article               | headline, datePublished, author   | dateModified, image           |
| FAQ 頁面  | FAQPage               | mainEntity                        | -                             |
| 教學步驟  | HowTo                 | name, step                        | totalTime, supply             |
| 課程內容  | Course                | name, description, provider       | courseCode, hasCourseInstance |
| 測驗      | Quiz                  | name, about                       | numberOfQuestions             |

---

## 📝 內容結構最佳實踐

### 1. 定義句（Definition Sentence）

**目的**：讓 AI 可以直接抽取清晰的定義。

**格式**：

```
[術語]是[定義/說明]。
```

**範例**：

```
地震規模是用來衡量地震所釋放能量大小的指標。
匯率是一種貨幣兌換另一種貨幣的比率。
```

**驗收標準**：

- [ ] 每個核心概念有明確的定義句
- [ ] 定義句出現在段落開頭
- [ ] 使用專業但易懂的語言

### 2. 條列步驟（Numbered Steps）

**目的**：讓 AI 可以抽取步驟式說明。

**格式**：

```
如何[動作]：
1. [第一步]
2. [第二步]
3. [第三步]
```

**範例**：

```
如何換算匯率：
1. 選擇來源貨幣（如 TWD）
2. 輸入金額
3. 選擇目標貨幣（如 USD）
4. 查看換算結果
```

**驗收標準**：

- [ ] 使用有序清單 `<ol>` 或 JSON-LD HowToStep
- [ ] 每個步驟簡潔明確
- [ ] 步驟數量適中（3-7 步為佳）

### 3. FAQ 結構（Question-Answer Pairs）

**目的**：讓 AI 可以抽取問答對。

**格式**：

```
Q: [問題]
A: [答案]
```

**JSON-LD 範例**：

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "什麼是地震規模？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "地震規模是衡量地震釋放能量大小的指標，使用對數尺度計算。"
      }
    }
  ]
}
```

**驗收標準**：

- [ ] 問題使用自然語言
- [ ] 答案完整且簡潔（50-200 字）
- [ ] 使用 FAQPage schema 標記

### 4. 名詞表（Glossary）

**目的**：建立專業術語的清晰對照。

**格式**：
| 術語 | 定義 |
|------|------|
| [術語1] | [定義1] |
| [術語2] | [定義2] |

**驗收標準**：

- [ ] 使用表格或定義清單 `<dl>`
- [ ] 術語按字母/筆畫排序
- [ ] 定義精確且一致

---

## 🔒 可信度訊號

### 1. 作者/組織資訊

```json
{
  "@type": "Organization",
  "name": "haotool",
  "url": "https://haotool.org",
  "logo": "https://haotool.org/logo.png",
  "sameAs": ["https://github.com/haotool"]
}
```

### 2. 更新日期

- 使用 ISO-8601 格式含時區：`2026-01-04T00:35:00+08:00`
- 在 Article schema 中設置 `datePublished` 和 `dateModified`
- 頁面可見處顯示「最後更新」時間

### 3. 引用來源

- 標註資料來源（如：「參考臺灣銀行牌告匯率」）
- 使用 `citation` 或 `sameAs` 連結權威來源
- 提供聯絡方式（About/Contact 頁面）

### 4. 政策頁面

- 關於我們 (`/about/`)
- 聯絡我們 (`/contact/`)
- 隱私政策（如適用）

---

## 🚫 降低引用機率的因素

| 因素           | 說明                | 避免方式              |
| -------------- | ------------------- | --------------------- |
| 缺乏結構化資料 | AI 難以理解內容結構 | 實作相關 Schema       |
| 內容過於簡短   | 無法提供完整答案    | 每頁 ≥300 字          |
| 缺乏定義句     | AI 無法抽取摘要     | 開頭放定義句          |
| 過多廣告/彈窗  | 降低使用者體驗      | 最小化干擾            |
| 頁面載入過慢   | 爬蟲可能逾時        | Core Web Vitals 達標  |
| 資訊過時       | 可信度下降          | 定期更新 dateModified |

---

## ✅ 驗證清單

### 技術驗證

- [ ] Google Rich Results Test 通過
- [ ] Schema Markup Validator 無錯誤
- [ ] Search Console 無結構化資料錯誤
- [ ] 頁面已被 Google 索引

### 內容驗證

- [ ] 每個主題有定義句
- [ ] 步驟式內容使用有序清單
- [ ] FAQ 使用 FAQPage schema
- [ ] 作者/組織資訊完整
- [ ] 更新日期可見且準確

### 持續監控

- [ ] Search Console 效能報告
- [ ] 定期檢查索引狀態
- [ ] 監控 AI 摘要出現情況

---

## 📊 專案現況

| App          | 定義句 | 步驟 | FAQ | 作者資訊 | 更新日期 | 狀態 |
| ------------ | ------ | ---- | --- | -------- | -------- | ---- |
| RateWise     | ✅     | ✅   | ✅  | ✅       | ✅       | 🟢   |
| NihonName    | ✅     | ⚠️   | ⚠️  | ✅       | ✅       | 🟡   |
| Quake-School | ✅     | ✅   | ⚠️  | ✅       | ⚠️       | 🟡   |
| HaoTool      | ✅     | ⚠️   | ⚠️  | ✅       | ✅       | 🟡   |

---

## 📚 參考資料

1. [Google Search Central - AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
2. [Google Search Central - Structured data](https://developers.google.com/search/docs/appearance/structured-data)
3. [Schema.org - Full Hierarchy](https://schema.org/docs/full.html)

---

**維護者**: Agent
**下次審核**: 2026-04-04
