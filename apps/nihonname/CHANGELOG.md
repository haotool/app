# Changelog

All notable changes to NihonName will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **SEO**: 修復 robots.txt 引用不存在的 sitemap-index.xml 導致 404 錯誤 ([#SEO-001](docs/SEO_VALIDATION_REPORT_2025-12-05.md))
  - 移除 `sitemap-index.xml` 錯誤引用
  - NihonName 僅 8 頁，不需要 sitemap index
  - SEO 健康分數提升 7.5/10 → 9.0/10

### Changed

- **SEO**: 基於 2025 最新最佳實踐驗證 OG Image 策略
  - 確認 PNG 格式正確（社群媒體最佳相容性）
  - 發現尺寸問題：當前 408x216 → 建議 1200x630
  - 檔案大小 29KB 已達最優（<300KB 建議值）

### Improved

- **SEO**: Sitemap 動態 lastmod 實作 ([#SEO-002](scripts/generate-sitemap.js))
  - 新增 `getPageLastMod()` 函數，基於檔案實際修改時間生成 lastmod
  - 自動偵測 8 個頁面的來源檔案修改時間
  - 提升搜尋引擎爬取效率，準確反映內容更新狀態
  - Fallback 機制：檔案不存在時使用當前日期

- **內容**: FAQ 頁面擴展 ([#SEO-003](src/pages/FAQ.tsx))
  - 新增「隱私與技術」分類（3 個問題）
  - 資料來源分類新增 2 個問題
  - 涵蓋隱私保護、PWA 離線使用、瀏覽器支援說明
  - 總計 17 個 FAQ items（提升用戶理解與信任度）

### Verified

- **SEO**: 審查 Resource Hints 配置符合 2025 最佳實踐
  - ✅ Preconnect to Google Fonts (關鍵渲染路徑)
  - ✅ 非阻塞字體載入 (media="print" onload 技巧)
  - ✅ 無過度優化（符合「謹慎使用」原則）
  - 參考：[DebugBear Resource Hints](https://www.debugbear.com/blog/resource-hints-rel-preload-prefetch-preconnect)

### Documentation

- **SEO**: 新增 SEO 驗證報告 `docs/SEO_VALIDATION_REPORT_2025-12-05.md`
  - 完整記錄網路驗證結果與實作優化
  - 包含 2025 最新 SEO 最佳實踐引用來源
  - 待辦事項與後續建議清單

---

## [1.0.0] - 2025-12-05

### Added

- ✨ **FAQ 頁面** - 新增常見問題集中頁面 ([#FAQ-001](src/pages/FAQ.tsx))
  - 21 個 FAQ items，分 3 大類別（歷史背景、使用方法、資料來源）
  - FAQPage Schema 完整實作
  - 快速導航與錨點連結
  - Related Links (Guide, About, History)
  - SEO 優化關鍵字

### Improved

- 🎨 **UI 透明度改進** - 提升視覺清晰度與可讀性
  - 結果卡片背景透明度 90% → 95%
  - 諧音梗名字卡片透明度 85% → 90%
  - 來源說明 Accordion 背景透明度 85% → 92%

### Fixed

- 🐛 **測試覆蓋率** - surnameData.ts 測試覆蓋率提升至 100%
  - 補齊 parseSurnameRecord 函數測試
  - 新增邊界條件測試
  - 覆蓋率 80% → 100%

---

## [0.9.0] - 2025-12-04

### Added

- 📜 **歷史專區** - 新增 4 個歷史教育頁面
  - 皇民化運動 (`/history/kominka`)
  - 馬關條約 (`/history/shimonoseki`)
  - 舊金山和約 (`/history/san-francisco`)
  - 歷史專區首頁 (`/history`)
  - 每頁包含 10 個 FAQ items + Article Schema

- 🤖 **AI Crawlers 支援** - llms.txt 與 robots.txt 完善配置
  - llms.txt (124 lines, 4,687 bytes)
  - AI-readable 文檔結構
  - 目標關鍵字清單（主要 + 次要）

### Improved

- 🔍 **SEO 優化** - 完整 Structured Data 實作
  - 6 種 Schema Types (WebApplication, Organization, WebSite, FAQPage, BreadcrumbList, Article)
  - JSON-LD 格式
  - 自動化 sitemap 生成（prebuild script）
  - Canonical URLs 標準化

---

## [0.5.0] - 2025-11-30

### Added

- 🎭 **諧音梗名字功能** - 趣味日本名字生成
  - 500+ 諧音梗資料庫
  - 自訂諧音名功能
  - localStorage 本地儲存
  - 隨機生成與刪除功能

- 📚 **姓氏資料庫** - 1,700+ 筆歷史對照記錄
  - 90+ 台灣常見姓氏
  - 5 種變異法分類（明示法、拆字法、同音法、郡望法、暗示法）
  - 來源說明與歷史文獻引用

### Improved

- ⚡ **效能優化** - Core Web Vitals 達標
  - LCP ≤2.5s
  - FID ≤100ms
  - CLS ≤0.1
  - Lighthouse CI 品質門檻（SEO ≥90%, Accessibility ≥95%）

---

## [0.1.0] - 2025-11-15

### Added

- 🎉 **初始版本** - NihonName 皇民化改姓生成器
  - React 19 + TypeScript + Vite 7
  - Tailwind CSS 和紙質感設計
  - PWA 支援（offline-capable）
  - SSG 預渲染（8 個頁面）

---

[Unreleased]: https://github.com/haotool/app/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/haotool/app/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/haotool/app/compare/v0.5.0...v0.9.0
[0.5.0]: https://github.com/haotool/app/compare/v0.1.0...v0.5.0
[0.1.0]: https://github.com/haotool/app/releases/tag/v0.1.0
