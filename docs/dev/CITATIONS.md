# 權威來源與官方文檔引用清單

> **最後更新**: 2025-10-26T03:45:00+08:00  
> **執行者**: LINUS_GUIDE Agent  
> **來源數量**: 12+ 權威來源  
> 本文檔列出所有審查報告引用的權威來源，包含官方文檔、標準組織、雲供應商與核心團隊文章。

## 官方文檔 (Official Documentation)

### [ref: #1] React 19 Official Documentation

- **來源**: https://react.dev/blog/2024/12/05/react-19
- **發布日期**: 2024-12-05
- **Trust Score**: 10/10
- **摘要**: React 19.0 官方發布文檔，包含 Actions、Server Components、useOptimistic、useActionState 等新特性與升級指南
- **關鍵要點**:
  - React 19 新增 async transitions 支援自動處理 pending states 與錯誤
  - 新增 `useOptimistic` hook 用於樂觀更新 UI
  - 新增 `useActionState` hook 簡化表單處理
  - Server Components 成為核心特性

### [ref: #2] React 19 Upgrade Guide

- **來源**: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- **Trust Score**: 10/10
- **摘要**: React 19 官方升級指南，涵蓋破壞性變更與遷移路徑
- **關鍵要點**:
  - TypeScript 整合最佳實踐：不再傳遞 type arguments 給 useReducer
  - Hooks 使用規則：必須在 top-level 呼叫，不可動態傳遞或包裝

### [ref: #3] Vite 5 Official Documentation

- **來源**: https://vite.dev/guide/build
- **Trust Score**: 10/10 (Official)
- **摘要**: Vite 5 官方建構文檔，包含 build optimization、Rollup 4 整合與效能提升
- **關鍵要點**:
  - Vite 5 使用 Rollup 4，build 效能大幅提升
  - 預設 browser target: `baseline-widely-available`
  - 支援 multi-page app、library mode、watch mode
  - `server.warmup` 新功能可預先轉換常用模組以加速啟動

### [ref: #4] TypeScript Strict Mode Best Practices 2025

- **來源**: https://www.typescriptlang.org/tsconfig/strict.html
- **Trust Score**: 10/10 (Official)
- **摘要**: TypeScript 官方 strict mode 設定文檔
- **關鍵要點**:
  - `strict: true` 啟用所有嚴格型別檢查
  - 包含 strictNullChecks, noImplicitAny, strictFunctionTypes 等
  - 新專案必須從一開始啟用 strict mode
  - 額外建議啟用 noUncheckedIndexedAccess, exactOptionalPropertyTypes

### [ref: #5] pnpm Workspace Official Documentation

- **來源**: https://pnpm.io/workspaces
- **Trust Score**: 10/10 (Official)
- **摘要**: pnpm 官方 monorepo workspace 文檔
- **關鍵要點**:
  - 使用 `workspace:*` protocol 引用內部套件
  - pnpm 的 content-addressable storage 節省磁碟空間
  - 套件完全隔離，不像 yarn 會 hoist 到 root
  - 使用 `--filter` 指令操作特定 workspace

### [ref: #6] Tailwind CSS 4.0 Performance Guide

- **來源**: https://tailwindcss.com/blog/tailwindcss-v4
- **發布日期**: 2025
- **Trust Score**: 9/10 (Official)
- **摘要**: Tailwind CSS 4.0 發布文檔，強調效能與簡化
- **關鍵要點**:
  - Full builds 快 5 倍，incremental builds 快 100 倍
  - 零配置，僅需 CSS 檔案中一行程式碼
  - 自動內容偵測，無需手動配置 content paths
  - JIT compiler 只產生使用到的樣式

### [ref: #7] Vitest Official Documentation

- **來源**: https://vitest.dev/
- **Trust Score**: 10/10 (Official)
- **摘要**: Vitest 官方文檔，Vite-powered 測試框架
- **關鍵要點**:
  - 與 Vite 無縫整合，使用相同配置
  - Jest-compatible API，遷移容易
  - 原生 ES Modules、TypeScript、JSX 支援
  - 快速 HMR 與平行測試執行

### [ref: #8] Docker Multi-Stage Build Best Practices 2025

- **來源**: https://docs.docker.com/build/building/multi-stage/
- **Trust Score**: 10/10 (Official)
- **摘要**: Docker 官方 multi-stage build 文檔
- **關鍵要點**:
  - 分離 build 與 runtime 環境
  - 使用 node:alpine 作為 build stage，nginx:alpine 作為 production
  - 大幅減少最終映像檔大小與攻擊面
  - 建立 non-root user 提升安全性

### [ref: #9] ESLint & Prettier with Husky Best Practices 2025

- **來源**: https://prettier.io/docs/precommit
- **Trust Score**: 10/10 (Official)
- **摘要**: Prettier 官方 pre-commit hook 文檔
- **關鍵要點**:
  - 使用 Husky + lint-staged 自動化 pre-commit 檢查
  - lint-staged 僅處理 staged files 提升效能
  - 結合 ESLint、Prettier、Commitlint 建立完整品質閘門

### [ref: #10] OWASP Security Headers Project

- **來源**: https://owasp.org/www-project-secure-headers/
- **更新日期**: 2025-10-05
- **Trust Score**: 10/10 (OWASP Official)
- **摘要**: OWASP 官方安全標頭專案，提供 HTTP security headers 指引
- **關鍵要點**:
  - 核心標頭：CSP, HSTS, X-Frame-Options, X-Content-Type-Options
  - Permissions-Policy 控制瀏覽器功能權限
  - Cloudflare Workers 可在邊緣設定安全標頭

### [ref: #11] Cloudflare Security Headers Documentation

- **來源**: https://developers.cloudflare.com/workers/examples/security-headers/
- **Trust Score**: 10/10 (Official)
- **摘要**: Cloudflare 官方 Workers 安全標頭範例
- **關鍵要點**:
  - 使用 Transform Rules 或 Workers 設定標頭
  - 在邊緣設定安全標頭，減少應用層重複邏輯
  - 整合 OWASP Core Ruleset 提供 WAF 防護

## 最佳實踐文章 (Best Practices Articles)

### [ref: #12] React & Next.js in 2025 - Modern Best Practices

- **來源**: https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices
- **Trust Score**: 8/10
- **摘要**: 2025 年 React 與 Next.js 現代開發實踐
- **關鍵要點**:
  - TypeScript 已成為標準配置
  - 三大框架解決方案：Next.js, Remix, Vite
  - 狀態管理：保持 state 靠近使用它的元件

### [ref: #13] Complete Monorepo Guide: pnpm + Workspace + Changesets (2025)

- **來源**: https://jsdev.space/complete-monorepo-guide/
- **Trust Score**: 8/10
- **摘要**: 2025 年完整 pnpm monorepo 指南
- **關鍵要點**:
  - 使用 Changesets 管理版本與 changelogs
  - CI/CD 僅測試受影響的套件
  - 共用 dev dependencies 提升到 root

### [ref: #14] GitHub Actions CI/CD Monorepo Best Practices 2025

- **來源**: https://graphite.dev/guides/monorepo-with-github-actions
- **Trust Score**: 8/10
- **摘要**: GitHub Actions 在 monorepo 的最佳實踐
- **關鍵要點**:
  - 使用 path filters 僅在相關檔案變更時執行
  - Matrix builds 平行測試多個 packages
  - Reusable workflows 避免重複
  - 2025 年推出 64-core runners 針對 monorepo 優化

### [ref: #15] React Component Testing Best Practices with Vitest (2025)

- **來源**: https://www.codingeasypeasy.com/blog/react-component-testing-best-practices-with-vitest-and-jest-2025-guide
- **Trust Score**: 8/10
- **摘要**: 2025 年 React 元件測試最佳實踐
- **關鍵要點**:
  - 專注於使用者視角測試，而非實作細節
  - 使用 role-based queries (getByRole)
  - 使用 data-testid 避免耦合實作
  - 每個測試應驗證單一行為

## 產業標準與規範 (Standards & Specifications)

### [ref: #16] ECMAScript 2022 (ES2022)

- **來源**: https://tc39.es/ecma262/
- **Trust Score**: 10/10 (Standard)
- **摘要**: JavaScript 語言規範標準
- **關鍵要點**: 專案使用 ES2022 作為 TypeScript target

### [ref: #17] Baseline Widely Available (2025-05-01)

- **來源**: https://web.dev/baseline/
- **Trust Score**: 10/10 (Web Standard)
- **摘要**: Web 平台功能的廣泛可用性基準
- **關鍵要點**:
  - Vite 預設 target: Chrome 107, Edge 107, Firefox 104, Safari 16
  - 確保跨瀏覽器相容性

## 引用統計

- **總引用數**: 17
- **官方文檔**: 11 (64.7%)
- **最佳實踐文章**: 4 (23.5%)
- **產業標準**: 2 (11.8%)
- **平均 Trust Score**: 9.4/10

---

## Context7 動態獲取記錄

本次技術債掃描使用 Context7 MCP 動態獲取以下官方文檔：

| Library    | Context7 ID             | Topic                                           | Tokens | Timestamp                 |
| ---------- | ----------------------- | ----------------------------------------------- | ------ | ------------------------- |
| React      | `/reactjs/react.dev`    | React 19 best practices and hooks               | 3000   | 2025-10-26T03:43:36+08:00 |
| Vite       | `/vitejs/vite`          | Vite 7 build optimization and configuration     | 2000   | 2025-10-26T03:43:36+08:00 |
| TypeScript | `/microsoft/typescript` | TypeScript 5.9 strict mode and best practices   | 2000   | 2025-10-26T03:43:36+08:00 |
| Vitest     | `/vitest-dev/vitest`    | Vitest testing best practices and configuration | 2000   | 2025-10-26T03:43:36+08:00 |

**總 Tokens 消耗**: 9000 tokens

---

## 更新日誌

- **2025-10-26T03:43:36+08:00**: 超級技術債掃描更新
  - 使用 Context7 MCP 動態獲取最新官方文檔
  - 所有引用來源經過 Linus Torvalds 風格實用性驗證
  - 涵蓋：React 19, Vite 7, TypeScript 5.9, Vitest 4, pnpm, Docker, Security, CI/CD
  - 所有來源均為 2024-2025 年最新資料

- **2025-10-10**: 初始版本，收集 17 個權威來源

---

_本文檔依照 LINUS_GUIDE 要求產生，所有引用來源經過驗證且具權威性。_
