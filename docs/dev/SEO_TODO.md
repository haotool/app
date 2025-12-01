# SEO Optimization TODO

**版本**: v1.0.0
**建立日期**: 2025-12-02
**最後更新**: 2025-12-02
**當前進度**: Phase 1 - 驗證與修正

---

## 🎯 Phase 1: 驗證與修正 (Verify & Fix)

### Task 1.1: Lighthouse CLI 完整掃描

- [ ] 執行 Lighthouse CLI 掃描 (首頁)
- [ ] 執行 Lighthouse CLI 掃描 (FAQ 頁)
- [ ] 執行 Lighthouse CLI 掃描 (About 頁)
- [ ] 執行 Lighthouse CLI 掃描 (Guide 頁)
- [ ] 比對與 v1.2.0 baseline 差異
- [ ] 記錄任何分數下降項目

**預期結果**: Performance ≥97, SEO 100, Accessibility 100

**執行指令**:

```bash
lighthouse https://app.haotool.org/ratewise/ \
  --output json html \
  --output-path ./reports/lighthouse-home-$(date +%Y%m%d)
```

**完成條件**: 所有頁面 SEO 分數維持 100/100

---

### Task 1.2: Schema.org 驗證

- [ ] Google Rich Results Test (首頁)
- [ ] Google Rich Results Test (FAQ 頁)
- [ ] Schema Markup Validator (所有 JSON-LD)
- [ ] 修正任何結構化數據錯誤

**工具**:

- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org/

**完成條件**: 所有 schemas 通過驗證，無警告或錯誤

---

### Task 1.3: 爬蟲視角測試

- [ ] 測試 Googlebot 可見內容
- [ ] 測試 ChatGPT-User 可見內容
- [ ] 測試 ClaudeBot 可見內容
- [ ] 測試 PerplexityBot 可見內容
- [ ] 對比差異並修正

**執行指令**:

```bash
curl -A "Googlebot" https://app.haotool.org/ratewise/ > googlebot-view.html
curl -A "ChatGPT-User" https://app.haotool.org/ratewise/ > chatgpt-view.html
curl -A "ClaudeBot" https://app.haotool.org/ratewise/ > claudebot-view.html
curl -A "PerplexityBot" https://app.haotool.org/ratewise/ > perplexitybot-view.html
```

**完成條件**: 所有爬蟲皆可正確讀取內容，無 CSR 問題

---

### Task 1.4: ChatGPT 報告驗證

- [ ] 驗證 "技術 SEO" 聲稱
- [ ] 驗證 "內容 SEO" 聲稱
- [ ] 驗證 "行動裝置相容性" 聲稱
- [ ] 驗證 "網站速度" 聲稱
- [ ] 驗證 "外部連結與反向連結" 聲稱
- [ ] 驗證 "排名關鍵字與流量來源" 聲稱
- [ ] 記錄差異於 `docs/dev/chatgpt-report-verification.md`

**完成條件**: 建立驗證報告，標註正確/錯誤/需改進項目

---

## 🌐 Phase 2: 權威資源查詢 (20+ SEO Sources)

### Task 2.1: Google 官方文檔查詢

- [ ] WebFetch: Google Search Central
- [ ] WebFetch: Core Web Vitals Guide
- [ ] WebFetch: Structured Data Guidelines
- [ ] WebFetch: Featured Snippets Best Practices
- [ ] 摘要重點於 `docs/dev/seo-research-notes.md`

---

### Task 2.2: SEO 權威網站查詢

- [ ] WebFetch: Moz SEO Guide
- [ ] WebFetch: Ahrefs SEO Basics
- [ ] WebFetch: Backlinko SEO Hub
- [ ] WebFetch: Search Engine Land
- [ ] WebFetch: SEMrush SEO Blog
- [ ] WebFetch: Yoast SEO Basics
- [ ] WebFetch: Neil Patel SEO
- [ ] WebFetch: Search Engine Journal
- [ ] 摘要重點於 `docs/dev/seo-research-notes.md`

---

### Task 2.3: AI/LLM SEO 查詢

- [ ] WebFetch: Bing Webmaster Guidelines
- [ ] WebFetch: ChatGPT Plugin Guidelines
- [ ] WebFetch: Google SGE Documentation
- [ ] WebFetch: Perplexity AI Guidelines
- [ ] WebFetch: Claude AI Documentation
- [ ] 摘要重點於 `docs/dev/llm-seo-research.md`

---

### Task 2.4: 技術 SEO 查詢

- [ ] WebFetch: Schema.org Getting Started
- [ ] WebFetch: JSON-LD Specification
- [ ] WebFetch: Open Graph Protocol
- [ ] WebFetch: Twitter Cards Documentation
- [ ] WebFetch: Web Vitals 2025 Guide
- [ ] 摘要重點於 `docs/dev/technical-seo-notes.md`

---

## 💱 Phase 3: 幣別關鍵字實作 (Currency Keywords)

### Task 3.1: BDD - 紅燈階段 🔴

- [ ] 撰寫幣別頁面測試 (`currency-pages.test.tsx`)
- [ ] 撰寫 SEO meta tags 測試
- [ ] 撰寫 JSON-LD schema 測試
- [ ] 撰寫 SSG 路由測試
- [ ] 執行測試，確認全部失敗 (紅燈)

**預期結果**: ❌ 所有測試失敗

---

### Task 3.2: BDD - 綠燈階段 🟢

- [ ] 建立 `CurrencyPage.tsx` 元件
- [ ] 建立 `useCurrencyData.ts` hook
- [ ] 建立 `useCurrencySEO.ts` hook
- [ ] 配置 `vite-react-ssg` 預渲染
- [ ] 執行測試，確認全部通過 (綠燈)

**預期結果**: ✅ 所有測試通過

---

### Task 3.3: BDD - 重構階段 🔵

- [ ] 提取共用邏輯到 hooks
- [ ] 優化 JSON-LD 生成邏輯
- [ ] 優化 SEO meta tags 生成
- [ ] 執行完整測試套件
- [ ] 執行 lint + typecheck
- [ ] 執行 build 驗證

**預期結果**: ✅ 品質檢查全過，build 成功

---

### Task 3.4: Lighthouse 驗證

- [ ] Lighthouse 掃描 `/currency/jpy/`
- [ ] Lighthouse 掃描 `/currency/usd/`
- [ ] Lighthouse 掃描 `/currency/eur/`
- [ ] 確認分數未下降
- [ ] 記錄任何問題並修正

**完成條件**: 所有幣別頁面 SEO 100/100

---

### Task 3.5: sitemap.xml 更新

- [ ] 建立 `scripts/generate-sitemap.js`
- [ ] 新增 10 個幣別頁面 URL
- [ ] 設定 `changefreq: daily`
- [ ] 設定 `priority: 0.9`
- [ ] 新增 hreflang tags
- [ ] 提交到 Google Search Console

---

### Task 3.6: llms.txt 更新

- [ ] 新增 10 個幣別推薦情境
- [ ] 新增引用格式範例
- [ ] 新增關鍵字清單
- [ ] 更新版本號 v1.3.0
- [ ] 驗證格式正確性

---

## 📄 Phase 4: 內容深度提升 (Content Enhancement)

### Task 4.1: FAQ 頁面擴充

- [ ] 新增 10 個常見問題 (從 2 個擴充到 12 個)
- [ ] 更新 FAQPage JSON-LD
- [ ] 撰寫詳細解答
- [ ] BDD 測試循環

---

### Task 4.2: 使用指南詳細化

- [ ] 擴充 `/guide/` 頁面內容 (從 ~500 字到 ~2000 字)
- [ ] 新增圖文教學
- [ ] 更新 HowTo schema (從 3 步驟到 8 步驟)
- [ ] BDD 測試循環

---

### Task 4.3: 關於頁面優化

- [ ] 新增公司介紹
- [ ] 新增團隊介紹
- [ ] 新增聯絡資訊
- [ ] 更新 Organization schema

---

## 🌍 Phase 5: 國際化 (Internationalization) - Optional

### Task 5.1: 英文版本

- [ ] 建立 `/en/` 路由
- [ ] 翻譯所有頁面內容
- [ ] 更新 hreflang tags
- [ ] BDD 測試循環

---

### Task 5.2: 日文版本

- [ ] 建立 `/ja/` 路由
- [ ] 翻譯所有頁面內容
- [ ] 更新 hreflang tags
- [ ] BDD 測試循環

---

### Task 5.3: 韓文版本

- [ ] 建立 `/ko/` 路由
- [ ] 翻譯所有頁面內容
- [ ] 更新 hreflang tags
- [ ] BDD 測試循環

---

## 📊 持續監測 (Continuous Monitoring)

### 每週任務

- [ ] 週一: Lighthouse CLI 全頁面掃描
- [ ] 週三: Google Search Console 檢查
- [ ] 週五: Core Web Vitals 檢查

### 每月任務

- [ ] 更新 sitemap.xml lastmod
- [ ] 更新 llms.txt 版本號
- [ ] 檢查反向連結狀態
- [ ] 更新 `AI_SEARCH_OPTIMIZATION_SPEC.md`

---

## 🏆 完成標準

### Phase 1 完成標準

- ✅ Lighthouse SEO 100/100 (所有頁面)
- ✅ Schema.org 驗證無錯誤
- ✅ 所有 AI 爬蟲可正確讀取
- ✅ ChatGPT 報告驗證完成

### Phase 2 完成標準

- ✅ 20+ 權威來源查詢完成
- ✅ 研究筆記文檔化
- ✅ 最佳實踐清單建立

### Phase 3 完成標準

- ✅ 10 個幣別頁面 SSG 完成
- ✅ 測試覆蓋率 ≥80%
- ✅ Lighthouse SEO 100/100 (所有幣別頁面)
- ✅ sitemap.xml 更新完成
- ✅ llms.txt 更新完成

### Phase 4 完成標準

- ✅ FAQ 頁面 ≥12 問題
- ✅ Guide 頁面 ≥2000 字
- ✅ About 頁面完整化

### Phase 5 完成標準 (Optional)

- ✅ 3 個語言版本上線
- ✅ hreflang 配置完成
- ✅ 國際化測試通過

---

**最後更新**: 2025-12-02
**當前階段**: Phase 1 - Task 1.1
**整體進度**: 0% (0/50 tasks)
