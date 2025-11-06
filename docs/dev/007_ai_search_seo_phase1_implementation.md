# 007 - AI 搜尋 SEO Phase 1 實施記錄

> **建立時間**: 2025-11-07
> **版本**: v1.0.0
> **狀態**: 🔄 進行中
> **負責人**: Claude Code
> **依據**: AI_SEARCH_OPTIMIZATION_SPEC.md Phase 1 P0

---

## 目標

實施 AI 搜尋優化 Phase 1 P0 任務，完成：

- Open Graph tags（社交媒體分享）
- Twitter Card tags
- JSON-LD 結構化資料（WebApplication + Organization）
- 基礎 SEO 補強（robots, canonical, locale）

---

## Linus 三問驗證

### 1. "這是個真問題還是臆想出來的？"

✅ **真問題**

- AI_SEARCH_OPTIMIZATION_SPEC.md 明確要求 Phase 1 P0 任務
- 社交媒體分享目前無 rich preview（實際用戶體驗問題）
- AI 搜尋引擎（ChatGPT, Claude, Perplexity）無法識別應用資訊

### 2. "有更簡單的方法嗎？"

✅ **最簡方案**

- **採用**：靜態 HTML（index.html）直接添加 meta tags
- **理由**：React SPA 無 SSR → AI 爬蟲不執行 JS
- **對比**：React Helmet 需要安裝依賴 + SSR 才有效（過度設計）

### 3. "會破壞什麼嗎？"

✅ **向後相容**

- 只添加 meta tags，不修改現有功能
- 不影響現有 PWA 功能
- 不需要額外測試（靜態 HTML）

---

## 技術決策

### 策略：靜態 HTML 優先

**依據**：

- [AI_SEARCH_OPTIMIZATION_SPEC.md:149] "靜態內容優先"
- [Context7: @dr.pogodin/react-helmet] React 19 最佳選擇（但需 SSR）
- [Google Search Central 2025] JSON-LD 在靜態 HTML 有效
- [Web.dev 2025] Open Graph + Twitter Card 標準實踐

**架構現實**：

```
React SPA (無 SSR)
  → AI 爬蟲不執行 JavaScript
  → 動態 meta tags 無效
  → 靜態 HTML 是唯一有效方案
```

---

## 實施內容

### 1. Open Graph Tags

**目的**：Facebook, LinkedIn 社交媒體分享 rich preview

**實施**：在 `apps/ratewise/index.html` 的 `<head>` 中添加

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://app.haotool.org/ratewise" />
<meta property="og:title" content="RateWise - 匯率好工具 | 即時匯率換算" />
<meta
  property="og:description"
  content="RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR、GBP 等 30+ 種貨幣。快速、準確、離線可用的 PWA 匯率工具。"
/>
<meta property="og:image" content="https://app.haotool.org/ratewise/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="RateWise 匯率轉換器應用截圖" />
<meta property="og:locale" content="zh_TW" />
<meta property="og:site_name" content="RateWise" />
```

**圖片規格**（Open Graph Protocol 標準）：

- 尺寸: 1200×630 px
- 格式: PNG 或 JPG
- 大小: <8 MB
- 比例: 1.91:1

### 2. Twitter Card Tags

**目的**：Twitter/X 社交媒體分享 rich preview

```html
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="RateWise - 匯率好工具 | 即時匯率換算" />
<meta name="twitter:description" content="快速、準確的匯率換算工具，支援 30+ 種貨幣" />
<meta name="twitter:image" content="https://app.haotool.org/ratewise/twitter-image.png" />
<meta name="twitter:image:alt" content="RateWise 匯率轉換器" />
```

**Fallback 行為**（Twitter Cards 2025 標準）：

- 若 `twitter:title` 缺失 → 使用 `og:title`
- 若 `twitter:description` 缺失 → 使用 `og:description`
- 圖片可共用 Open Graph 圖片（1200×630）

### 3. 基礎 SEO 補強

```html
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://app.haotool.org/ratewise" />
<meta http-equiv="content-language" content="zh-TW" />
```

### 4. JSON-LD 結構化資料

**目的**：Google Rich Results + AI 搜尋引擎理解

**WebApplication Schema**：

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "RateWise",
    "alternateName": "匯率好工具",
    "description": "即時匯率轉換器，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR 等 30+ 種貨幣換算",
    "url": "https://app.haotool.org/ratewise",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "即時匯率查詢",
      "單幣別換算",
      "多幣別同時換算",
      "歷史匯率趨勢",
      "離線使用",
      "PWA 支援"
    ]
  }
</script>
```

**Organization Schema**：

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "RateWise",
    "url": "https://app.haotool.org/ratewise",
    "logo": "https://app.haotool.org/ratewise/logo-192.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "haotool.org@gmail.com"
    },
    "sameAs": ["https://www.threads.net/@azlife_1224", "https://github.com/haotool/app"]
  }
</script>
```

---

## 驗證計劃

### 線上工具驗證（生產環境）

1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - 驗證: WebApplication + Organization schema

2. **Schema.org Validator**
   - URL: https://validator.schema.org/
   - 驗證: JSON-LD 語法正確性

3. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - 驗證: Open Graph tags 顯示

4. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - 驗證: Twitter Card 顯示

### CLI 工具驗證（本地）

```bash
# 檢查 HTML 結構
curl -I https://app.haotool.org/ratewise

# 提取 meta tags
curl -s https://app.haotool.org/ratewise | grep -E "property=|name=.twitter:|type=.application/ld"
```

---

## 預期效果

- ✅ AI 搜尋引擎（ChatGPT, Claude, Perplexity）可識別和引用
- ✅ 社交媒體分享顯示 rich preview
- ✅ Google Rich Results 機會增加
- ✅ **完成 AI_SEARCH_OPTIMIZATION_SPEC.md Phase 1 P0 任務**

---

## 權威來源

- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Guide](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org - WebApplication](https://schema.org/WebApplication)
- [Context7: @dr.pogodin/react-helmet](https://github.com/birdofpreyru/react-helmet) (Trust Score: 9.7)
- [Web.dev - React SEO Best Practices](https://web.dev/articles/optimize-lcp)

---

## 實施步驟

- [ ] 修改 `apps/ratewise/index.html` 添加 meta tags
- [ ] 生成社交媒體圖片（og-image.png, twitter-image.png）
- [ ] 執行 `pnpm build` 驗證編譯
- [ ] 部署到生產環境
- [ ] 使用線上工具驗證
- [ ] 更新 `docs/dev/002_development_reward_penalty_log.md`

---

**最後更新**: 2025-11-07
**狀態**: 🔄 進行中
