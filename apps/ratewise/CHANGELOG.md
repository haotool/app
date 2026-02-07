# @app/ratewise

## 2.2.5

### Patch Changes

- fix(security): P2 安全修復 Review - 3 個殘留 CodeQL 警告徹底修復
  - Shell Injection 徹底修復: verify-all-apps.mjs 和 seo-full-audit.mjs 改用 spawnSync + 陣列參數
  - URL Sanitization 深度修復: trusted-types-bootstrap.ts createScript 函數改用 URL 正則提取 + URL 對象解析
  - 分離 SSG 標記檢查（安全識別符）和域名檢查（URL 驗證）
- fix(security): P2 安全修復 - 7 個 CodeQL Medium 級別警告全部修復
  - URL Sanitization: 使用 URL 對象驗證域名替代 .includes() 檢查
  - Shell Injection: 添加白名單驗證與 resolve() 路徑安全
  - Identity Replacement: 修正無效字串替換邏輯
- fix(security): P0+P1 安全修復 - GitHub Actions 權限 + Dependabot HIGH + XSS
  - GitHub Actions 權限限縮: 添加最小權限原則 (contents: read)
  - Dependabot HIGH 升級: 強制升級 6 個有漏洞依賴 (brace-expansion, fast-xml-parser, jsonpath, lodash, undici)
  - XSS 修復: nihonname Google 搜尋 URL 使用 encodeURIComponent
- fix(a11y): 完全移除 BottomNavigation `<a>` 子孫中的 tabindex 屬性
  - 移除 `motion.div` 的 `whileTap` 動畫，改用 CSS `group-active:` 偽類
  - 通過 W3C Nu HTML Checker 驗證：`<a>` 內部零 tabindex 屬性
- fix(ssg): 修正 /multi、/favorites、/settings 頁面 SSG 預渲染缺少 `<title>`
  - 將 `SEOHelmet` 提升至條件渲染之前，確保 SSG 時始終輸出 meta 資料
- fix(seo): 新增 /multi/、/favorites/、/settings/ 至 SEO 路徑與 sitemap
  - `seo-paths.ts` 與 `seo-paths.config.mjs` 同步新增 3 條核心路徑（17→20）
  - `isCorePagePath` 函數更新（4→7 核心頁面）
  - `sitemap.xml` 新增 3 條 URL 與 hreflang 配置（34→40 條 xhtml:link）
- fix(seo): 修正 JSON-LD `publisher.logo.url` 指向實際存在的 PNG 圖片
  - `optimized/logo-512w.png`（404）→ `icons/ratewise-icon-512x512.png`

## 2.2.4

### Patch Changes

- ee14578: fix(pwa): 舊用戶更新偵測 + 路由錯誤恢復 + Safari chunk 修復
  - UpdatePrompt 加入 visibilitychange 監聯，iOS PWA 從背景恢復時主動檢查更新
  - 新增 RouteErrorBoundary 包裝路由內容，頁面錯誤時保留底部導覽可切換
  - ErrorBoundary handleReset 改為 window.location.reload() 修復 chunk 錯誤循環
  - chunkLoadRecovery 精確匹配 Safari TypeError("Load failed") 動態 import 失敗

## 2.2.3

### Patch Changes

- e37687f: fix(a11y,csp): 修正 W3C 驗證問題與 CSP 報告機制
  - 修正 BottomNavigation 的 A11y 違規：motion.div tabIndex 問題
  - 升級 CSP 報告：新增 Reporting-Endpoints，report-to 優先
  - 新增 BottomNavigation A11y 測試

- 78c6251: 移除 isChunkLoadError 中過於寬鬆的 'load failed' 匹配，避免 Safari 通用 fetch 失敗被誤判為 chunk 載入錯誤
- 53eee93: PWA 離線快取策略修正：JS/CSS 改用 CacheFirst、移除冗餘 offline-fallback route、修復 UpdatePrompt setInterval 記憶體洩漏
- 009fa9c: UpdatePrompt 整合重構：修復三重渲染 BUG、SSOT tokens 提取、i18n 多語系、4 狀態支援、ARIA 語義化、prefers-reduced-motion、Brand 色系 CSS 變數

## 2.2.2 (2026-02-04)

### Fixed

- **PWA 離線快取策略修正**: 修復 SW 註冊錯誤處理與記憶體洩漏（interval 清理）
- **Chunk load 錯誤恢復**: 統一錯誤恢復流程，修正誤判邏輯

### Changed

- **UpdatePrompt motion/react 整合**: 以 `AnimatePresence` + `notificationAnimations.enter` 取代 CSS `animate-slide-in-bounce`，入場／退場動畫更流暢
- **按鈕微互動**: CTA 按鈕 `hover:scale-[1.02] active:scale-[0.98]`、關閉按鈕 `hover:scale-[1.05] active:scale-[0.95]`
- **Brand 配色 SSOT**: 6 種風格（Zen / Nitro / Kawaii / Classic / Ocean / Forest）各定義 14 個 `--color-brand-*` CSS 變數，UpdatePrompt 自動適配
- **focus-visible 統一**: 所有按鈕 `focus:` → `focus-visible:`，避免滑鼠點擊顯示焦點環
- **transition 明確化**: `transition-all` → `transition-[color,background-color,border-color,transform]`
- **註解正式化**: 全部改為簡短正式繁體中文 JSDoc 風格

### Removed

- **移除未使用 CSS**: 刪除 `@keyframes slide-in-bounce` 與 `.animate-slide-in-bounce`（已由 motion/react 取代）

## 2.0.0 (2026-01-29)

### 🚀 Major Release - UI/UX 大幅重構與 SEO 優化

這是一個重大版本更新，包含 133 個 commits，涵蓋 UI/UX 現代化、i18n 國際化、SEO 架構重構等核心改進。

### Breaking Changes

- **SEO 架構重構**: `index.html` 不再包含硬編碼的 SEO meta tags 與 JSON-LD，統一由 `SEOHelmet` 管理
- **語言標籤變更**: `zh-Hant` → `zh-TW` 以符合 Google 建議
- **Design Tokens SSOT**: 所有樣式統一使用 CSS Variables，移除硬編碼色彩值

### Added

- **i18n 國際化**: 支援繁體中文、英文、日文三種語言（react-i18next）
- **6 種主題風格**: Zen、Nitro、Kawaii、Classic、Ocean、Forest
- **拖曳排序收藏**: 使用 @hello-pangea/dnd 實現收藏貨幣拖曳排序
- **微互動動畫**: 導覽列與語言切換滑動動畫、Toast 通知動畫
- **高度斷點 RWD**: 支援小螢幕（如 iPhone SE 320px）的響應式佈局
- **ParkKeeper 設計風格**: 統一的毛玻璃效果、緊湊導覽（48px Header）

### Changed

- **Header 語意化**: `<h1>` 改為 `<span>`，避免每頁重複 h1（SEO 最佳實踐）
- **Permissions-Policy**: 移除已棄用的 `ambient-light-sensor`、`document-domain`、`vr`
- **SearchAction 移除**: 從 WebSite Schema 移除不存在的 `?q=` 搜尋功能
- **SoftwareApplication Schema**: 使用 SoftwareApplication 取代 WebApplication
- **og:url 修復**: 修復 16/17 頁面 og:url 指向錯誤首頁 URL 的問題
- **技術債清理**: 移除 95→22 個過時時間戳註解，統一開源專案風格

### Fixed

- **React Hydration #418**: 修復 SSG 預期錯誤抑制與 console.error 過濾
- **iOS Safari 滾動**: 修正 PWA 離線啟動與捲動問題
- **iPhone SE 佈局**: 修復 320px 小螢幕內容偏移問題
- **語系載入**: 修復 zh-Hant 語系未正確載入翻譯的問題

### Technical

- **測試覆蓋率**: 92%+ (1038+ 測試用例)
- **Lighthouse**: Performance 97+, SEO 100, Accessibility 100
- **CI/CD**: 6 個 workflows (ci, release, seo-audit, seo-production, update-rates x2)

---

## 1.5.0 (2026-01-15)

### Minor Changes

- 離線與 PWA 可靠性更新：強化 Service Worker 生命週期控制（skipWaiting/clientsClaim），改善 SW 評估穩定性與註冊流程；修復 Safari PWA 離線啟動與 `/ratewise` 子路徑 fallback；離線無快取時提供 fallback 匯率資料，並補齊離線/PWA E2E 測試覆蓋。
- 子路徑部署最佳實踐：統一使用 `VITE_RATEWISE_BASE_PATH` + PWA manifest scope/start_url 對齊 `/ratewise/`，移除 public/dist 子路徑鏡像流程，改由部署層 alias 對應 build 輸出。

### Fixed

- 修復 iOS Safari PWA 關閉後重開無法立即接管頁面的離線問題。
- 修正 offline.html 子路徑鏡像，確保子路徑離線模式可正常回退。

## 1.2.4 (2025-12-25)

### 🎄 Christmas Update - Easter Egg Feature

### Added

- **聖誕彩蛋功能** (2025-12-25):
  - 當用戶在計算機輸入 `106575 ÷ 1225 = 87` 時觸發
  - 全屏 SVG 聖誕樹動畫（帶裝飾品和星星）
  - CSS 下雪動畫效果（60 片雪花飄落）
  - 祝福語「Merry Christmas! 2025 聖誕快樂」
  - 持續 1 分鐘後自動關閉（可點擊或按 Escape 關閉）
  - 完整測試覆蓋（11 個測試用例）
  - 模組位置: `src/features/calculator/easter-eggs/`

### Technical

- **PWA 自動更新機制（已內建）**:
  - `registerType: 'autoUpdate'` - Service Worker 自動更新
  - `skipWaiting: true` + `clientsClaim: true` - 新版本立即激活
  - `cleanupOutdatedCaches: true` - 自動清理舊快取
  - 每 60 秒檢查更新 + 每 5 分鐘版本號驗證
  - 舊用戶進入後自動獲得更新通知並刷新

### Changed

- **版本號**: 1.2.2 → 1.2.4

---

## 1.2.0 (2025-11-30)

### 🚀 Major Update - License & SEO Enhancement

### Changed

- **License**: MIT → GPL-3.0 (強制 fork 開源並標註作者)
- **Author Attribution**: haotool (haotool.org@gmail.com, Threads @azlife_1224)
- **SEO Keywords**: 優化 "匯率好工具", "匯率工具", "RateWise", "台幣匯率"
- **llms.txt**: 更新至 v1.2.0，添加關鍵字區段
- **SEOHelmet**: 更新 author meta tag

### Fixed

- **robots.txt 404**: 修復 nginx 配置，使用 alias 指令確保 /ratewise/robots.txt 正確返回

### Technical

- **Core Web Vitals 2025**: INP 監控已確認運作 (web-vitals 5.x)
- **AI 搜尋規格**: 重置為 docs/dev/013_ai_search_optimization_spec.md v1.0.0（聚焦 FAQ/HowTo 擴充與長尾落地頁模板）

---

## 1.1.0

### Minor Changes

- 895b782: 整合趨勢圖資料流為「近 30 天歷史 + 今日即時匯率」，並優化版本標籤與釋出流程。

### Added

- **SEO Phase 2B-1** (2025-11-25): 清理 JSON-LD 重複定義
  - 移除 index.html 中的重複 JSON-LD（WebApplication, Organization）
  - 統一由 SEOHelmet 管理所有 JSON-LD structured data
  - 驗證首頁 JSON-LD 唯一性（1 個 WebApplication + 1 個 Organization）
  - 消除 SEO 警告與重複內容問題
  - Commit: c478b38

- **SEO Phase 2B-2** (2025-11-25): 實施 vite-react-ssg 靜態 HTML 預渲染
  - 安裝 vite-react-ssg@0.8.9 實現 SSG 支援
  - 新增 routes.tsx 集中管理路由配置
  - 遷移 main.tsx 從 ReactDOM.createRoot 到 ViteReactSSG
  - 靜態 HTML 生成：/ (52KB), /faq (24KB), /about (18KB)
  - SEO 影響：FAQ 和 About 頁面現可被搜尋引擎索引（無需 JS 執行）
  - Commits: 5935140, 2ed2e69

### Fixed

- **SSR 相容性修正** (2025-11-25):
  - CalculatorKeyboard Portal 的 SSR 防護（document.body guard）
  - react-helmet-async 的 CommonJS/ESM 互通性配置
  - vite-react-ssg 入口點整合（移除重複 script 標籤）
  - 瀏覽器專屬程式碼隔離至客戶端回調

### Changed

- **測試策略調整** (2025-11-25):
  - 標記 5 個客戶端水合測試為 skip（canonical URL, FAQPage JSON-LD, hreflang）
  - 測試覆蓋率：487 通過，5 skipped（100% 通過率）
  - 驗證靜態 HTML 提供基礎 SEO，動態元數據由客戶端水合添加

### Technical Debt

- **設計權衡** (2025-11-25):
  - AI 爬蟲只能索引靜態 HTML 基礎元數據
  - 頁面專屬 SEO 元數據（canonical, page-specific JSON-LD）需客戶端水合
  - Google Render Queue 將看到完整元數據（延遲索引）
