# 039 RateWise SEO SSOT / TDD 重構規格

- 狀態：Active
- 建立日期：2026-03-08
- 適用範圍：`apps/ratewise`
- 關聯：`docs/dev/002_development_reward_penalty_log.md`

## 背景

RateWise 既有 SEO 架構已具備 canonical、Open Graph、Twitter Card、JSON-LD、sitemap 與 robots 控制，但仍存在以下維護風險：

1. FAQ 可見內容與 FAQ rich result schema 耦合在 `SEOHelmet`
2. fallback alternates 規則散落在 component，缺少單一 SSOT
3. 測試對 source implementation 字串耦合過深，不利重構

## 外部最佳實踐依據

1. FAQ rich results 僅適用於 Google 明確支持的高權威健康或政府站點
2. 多語 SEO 必須以獨立 URL、正確 canonical 與 `hreflang` 對應為前提
3. `noindex` 頁面不應依賴 client-only SEO 訊號補救

## 目標

1. 移除不適用的 `FAQPage` rich result schema
2. 保留 FAQ 可讀內容，不影響首頁與 FAQ 頁 UX
3. 建立 alternates / locale 單一真實來源（SSOT）
4. 用 TDD 思維把測試改為驗證行為，而不是綁定內部實作

## SSOT 定義

### 1. Locale / Alternates SSOT

- `DEFAULT_LOCALE`
- `SEO_INDEXABLE_LOCALES`
- `buildDefaultAlternates(pathname)`

### 2. 首頁內容 SSOT

- `HOMEPAGE_HOW_TO`
- `HOMEPAGE_FAQ_CONTENT`
- `HOMEPAGE_SEO`

### 3. 頁面 SEO Metadata SSOT

- `SEOPageMetadata.faqContent`
- `FAQ_PAGE_SEO.faqContent`
- `ABOUT_PAGE_SEO.faqContent`
- guide pages 的 `faqContent`

## 設計決策

### 決策 A：移除 `FAQPage` schema

- 原因：RateWise 不屬於政府或健康高權威 FAQ rich result 適用站型
- 結論：`SEOHelmet` 不再接受 FAQ schema input，也不再輸出 `FAQPage`

### 決策 B：FAQ 改為內容層欄位 `faqContent`

- 原因：避免開發者誤以為 FAQ 內容一定要映射成 rich result schema
- 結論：FAQ 只保留內容責任，由 UI 頁面自己顯示

### 決策 C：Fallback alternates 改由 helper 管理

- 原因：避免 component 內重複手寫 locale fallback 規則
- 結論：所有預設 alternates 一律經 `buildDefaultAlternates()` 生成

## TDD / 驗證策略

### RED

- 先捕捉既有 FAQPage 與 alternates 耦合問題

### GREEN

- source 改為 `faqContent` + alternates helper
- FAQ 頁維持內容輸出，不再輸出 FAQ rich result schema

### REFACTOR

- 測試改驗證公開行為：
  - helper 回傳值
  - prerender 結果
  - HTML / JSON-LD 實際輸出

## 驗收標準

1. `SEOHelmet` 不得出現 `FAQPage` schema builder
2. FAQ 頁 prerender HTML 不得出現 `FAQPage`
3. `HOMEPAGE_SEO` 必須使用 `faqContent`
4. fallback alternates 只能由 `x-default` + `zh-TW` 組成
5. 相關 Vitest 與 `pnpm build:ratewise` 必須通過
