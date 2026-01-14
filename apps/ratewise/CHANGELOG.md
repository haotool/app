# @app/ratewise

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
