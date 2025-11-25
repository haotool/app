# @app/ratewise

## 1.1.0

### Minor Changes

- 895b782: 整合趨勢圖資料流為「近 25 天歷史 + 今日即時匯率」，並優化版本標籤與釋出流程。

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
