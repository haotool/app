# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 歷史匯率功能（30 天資料追蹤）
- 歷史匯率自動化更新 GitHub Actions workflow
- 歷史匯率服務 (`exchangeRateHistoryService.ts`)
- 完整的文檔維護規範（AGENTS.md § 6）
- KISS 原則開發指南（AGENTS.md § 3）
- 原子化提交原則（AGENTS.md § 4）
- 貢獻指南（CONTRIBUTING.md）
- GitHub Issue 範本（Bug Report, Feature Request, Documentation）
- GitHub PR 範本
- 行為準則（CODE_OF_CONDUCT.md）
- 安全政策（SECURITY.md）
- 環境變數範例檔案（.env.example）

### Changed

- 更新 README.md 文檔連結，更清晰的分類
- 改善 .gitignore 涵蓋更多臨時檔案類型
- 優化 TypeScript 類型定義，移除 `rate` 屬性從 `CURRENCY_DEFINITIONS`
- 增強 `useCurrencyConverter` hook 的 null 安全檢查

### Removed

- 移除根目錄重複的 `RateWise.tsx` 檔案
- 移除 `ZEABUR_CHECKLIST.md`（已有完整的 ZEABUR_DEPLOYMENT.md）
- 移除過時的臨時報告文檔
  - `IMPLEMENTATION_STATUS.md`
  - `docs/dev/TECH_DEBT_AUDIT.md`
  - `docs/dev/REFACTOR_PLAN.md`
  - `docs/dev/HISTORICAL_RATES_DEPLOYMENT_PLAN.md`

### Fixed

- 修正 TypeScript 類型錯誤（TS2322）：`exchangeRates` 支援 `number | null`
- 修正 `exchangeRateHistoryService.ts` 中 logger API 使用錯誤
- 修正 Docker health check 在非 root 使用者環境下的問題
- 修正所有元件使用真實匯率資料而非硬編碼假資料

---

## [0.0.0] - 2025-10-13

### Added

- 初始專案建立
- 單幣別與多幣別匯率轉換功能
- 整合台灣銀行牌告匯率 API
- 自動化匯率更新（GitHub Actions，每 30 分鐘）
- Docker 多階段建置配置
- Nginx 生產環境配置
- 完整的 TypeScript 類型系統
- 測試套件（Vitest + React Testing Library）
- 測試覆蓋率 89.8%
- ESLint + Prettier 程式碼品質工具
- Husky + lint-staged Git hooks
- Commitlint 提交訊息規範
- 完整的文檔系統
  - AGENTS.md - Agent 操作守則
  - LINUS_GUIDE.md - 開發哲學
  - SETUP.md - 快速開始
  - DEPLOYMENT.md - Docker 部署指南
  - ZEABUR_DEPLOYMENT.md - Zeabur 部署指南
  - SECURITY_BASELINE.md - 安全基線
  - ARCHITECTURE_BASELINE.md - 架構設計
  - CITATIONS.md - 技術引用來源
  - CHECKLISTS.md - 品質檢查清單
  - DEPENDENCY_UPGRADE_PLAN.md - 依賴升級策略

### Technical Details

- React 19.0.0
- Vite 5.4.6
- TypeScript 5.6.2
- Tailwind CSS 3.4.14
- pnpm 9.10.0
- Node.js >= 24.0.0
- Docker multi-stage build
- Nginx Alpine
- 支援 14 種貨幣

---

## 版本說明

- **Unreleased**: 尚未發布的變更
- **[0.0.0]**: 初始版本

## 連結

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**最後更新**: 2025-10-13
