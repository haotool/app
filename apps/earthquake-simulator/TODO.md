# 地震小學堂 (Quake School) - 開發任務清單

> **建立時間**: 2025-12-29T02:49:00+08:00
> **專案版本**: v0.1.0
> **狀態**: 🔄 開發中

---

## Phase 0: 準備工作

- [x] 建立獨立分支 `feat/earthquake-simulator-integration`
- [x] 複製 `.example/earthquake-simulator` 到 `apps/earthquake-simulator`
- [x] 重構目錄結構符合 monorepo 規範
- [x] 建立 TODO.md

## Phase 1: 專案遷移與配置

- [ ] 調整 `package.json` 符合 monorepo 規範
- [ ] 配置 `vite.config.ts` (參考 nihonname SSG 配置)
- [ ] 配置 `tsconfig.json`
- [ ] 安裝所有依賴 (vite-react-ssg, vitest, etc.)
- [ ] 重構 `main.tsx` 使用 vite-react-ssg

## Phase 2: SEO 架構

- [ ] 建立 `src/seo/meta-tags.ts`
- [ ] 建立 `src/seo/jsonld.ts`
- [ ] 配置 vite-react-ssg 路由與預渲染
- [ ] 添加 `public/` 資源:
  - [ ] `robots.txt`
  - [ ] `sitemap.xml` (生成腳本)
  - [ ] `manifest.webmanifest`
  - [ ] `favicon.ico` / `icon.svg`
  - [ ] `og-image.png`
- [ ] 配置尾斜線處理 (trailing slash)
- [ ] 添加 Canonical URL
- [ ] 配置 hreflang

## Phase 3: 測試 (BDD 紅燈-綠燈-重構)

### 紅燈階段 (撰寫失敗測試)

- [ ] 建立測試基礎設施 (`vitest.config.ts`, `setup.ts`)
- [ ] 元件測試:
  - [ ] `App.test.tsx`
  - [ ] `EarthquakeSimulator.test.tsx`
  - [ ] `QuizWidget.test.tsx`
  - [ ] `IntensityGrid.test.tsx`
- [ ] SEO 測試:
  - [ ] `meta-tags.test.ts`
  - [ ] `jsonld.test.ts`

### 綠燈階段 (實現通過)

- [ ] 確保所有測試通過
- [ ] 測試覆蓋率 ≥ 80%

### 重構階段 (優化程式碼)

- [ ] 消除重複程式碼
- [ ] 優化效能
- [ ] 改善可讀性

## Phase 4: Lighthouse 優化

- [ ] 執行 Lighthouse CLI 測試
- [ ] Performance 優化:
  - [ ] Critical CSS
  - [ ] 圖片優化 (WebP/AVIF)
  - [ ] Code splitting
  - [ ] Preload 關鍵資源
- [ ] Accessibility 優化:
  - [ ] WCAG 2.1 AA 標準
  - [ ] 顏色對比度 ≥ 4.5:1
  - [ ] Keyboard navigation
- [ ] Best Practices 優化
- [ ] SEO 優化
- [ ] 目標: 所有指標達到 100 分

## Phase 5: 部署配置

- [ ] 更新 CI/CD workflow (`ci.yml`)
- [ ] 配置 Docker
- [ ] 配置 Nginx (尾斜線重定向)
- [ ] 驗證 RWD 和所有功能
- [ ] 透過 `gh` 監控 CI 狀態

---

## 技術棧

| 技術           | 版本      | 用途       |
| -------------- | --------- | ---------- |
| React          | ^19.2.3   | UI 框架    |
| TypeScript     | ~5.8.2    | 型別安全   |
| Vite           | ^6.2.0    | 建置工具   |
| vite-react-ssg | latest    | SSG 預渲染 |
| Framer Motion  | ^12.23.26 | 動畫       |
| Tailwind CSS   | ^4.x      | 樣式       |
| Vitest         | ^4.x      | 測試框架   |

---

## 參考資源

- [vite-react-ssg 官方文檔](https://github.com/daydreamer-riri/vite-react-ssg)
- [SEO 最佳實踐 2025](https://developers.google.com/search/docs)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [AGENTS.md](../../AGENTS.md) - Agent 操作守則
- [BDD.md](../../docs/prompt/BDD.md) - BDD 開發指南

---

**最後更新**: 2025-12-29T02:49:00+08:00
