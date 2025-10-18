# 品質檢查清單

> **最後更新**: 2025-10-19T02:54:31+08:00  
> **狀態**: 持續更新  
> **參考**: TECH_DEBT_AUDIT.md, REFACTOR_PLAN.md

---

## Quick Wins (立即可做)

### 已完成 ✅

- [x] 補齊 README.md
- [x] 補齊 .editorconfig
- [x] 修正 PostCSS → ESM
- [x] 補齊 Error Boundary
- [x] 補齊 .env.example

### 本週完成（M0 - 清理與基礎強化）

- [x] 建立 `apps/ratewise/public/robots.txt`、`sitemap.xml`
- [ ] 刪除臨時報告文檔（E2E_FIXES_SUMMARY.md 等）
- [ ] 刪除 ReloadPrompt.tsx（未使用，測試覆蓋率 0%）
- [ ] 提升測試覆蓋率門檻至 80%
- [ ] ESLint `any` 規則改為 `error`
- [ ] 建立品質門檻自動化檢查腳本

---

## 阻擋項 (必須修復才能上線)

### 已完成 ✅

- [x] **測試覆蓋率 ≥80%** (目前 89.8%)
- [x] **CI/CD Pipeline**
- [x] **Docker 化**
- [x] **安全標頭**（Cloudflare/Nginx 層）
- [x] **基礎觀測性 (Logger + Error Boundary)**

### 待完成（M1 - 觀測性）⚠️

- [ ] **Sentry 正確配置並測試**（目前測試覆蓋率 0%）
- [ ] **Web Vitals 整合至監控平台**（目前測試覆蓋率 0%）
- [ ] **Logger 整合遠端服務**（目前僅 console 輸出）

---

## 長期改善

### 已完成 ✅

- [x] 拆分 RateWise 元件
- [x] TypeScript 嚴格化
- [x] 依賴鎖版策略
- [x] E2E 測試基礎建立

### 進行中 🔄

- [ ] **Vite 7 Build 優化**（目前 6.4.0，可升級至 7.1.10）
- [ ] **Tailwind 4 升級**（目前 3.4.18，可升級至 4.1.14）
- [ ] **E2E 測試穩定性**（目前有 retry，需降至 0）
- [ ] **Lighthouse CI 整合**（自動化效能監控）

### 規劃中 📋

- [ ] TODO 項目完成（5 個待處理）
  - Logger 整合遠端服務
  - Safari 404 修復
  - 歷史匯率數據整合
- [ ] 測試覆蓋率達 95%
- [ ] Commitlint 20 升級
- [ ] Husky 9 升級

---

## 命令快查

### 開發

```bash
# 啟動開發伺服器
pnpm dev

# 建置生產版本
pnpm build

# 預覽生產版本
pnpm preview
```

### 測試

```bash
# 執行單元測試
pnpm test

# 執行測試並產生覆蓋率報告
pnpm test:coverage

# 執行 E2E 測試
pnpm --filter @app/ratewise test:e2e

# 查看 E2E 測試報告
pnpm --filter @app/ratewise test:e2e:report
```

### 品質檢查

```bash
# 類型檢查
pnpm typecheck

# Lint 檢查
pnpm lint

# 格式檢查
pnpm format

# 完整品質檢查（建議在 commit 前執行）
bash scripts/verify-quality.sh
```

### 依賴管理

```bash
# 檢查過時依賴
pnpm -r outdated

# 安全審計
pnpm audit --prod --audit-level=high

# 升級依賴（謹慎執行）
pnpm -w up --interactive --latest
```

---

## 品質門檻

| 項目                | 目標  | 現況   | 狀態        |
| ------------------- | ----- | ------ | ----------- |
| 測試覆蓋率（lines） | ≥80%  | 89.8%  | ✅          |
| 測試覆蓋率門檻      | ≥80%  | 60%    | ⚠️ 需提升   |
| TypeScript Strict   | 啟用  | 啟用   | ✅          |
| ESLint `any` 規則   | Error | Warn   | ⚠️ 需強化   |
| Lighthouse 分數     | ≥90   | 未測量 | ⚠️ 需整合   |
| CI 通過率           | ≥95%  | ~85%   | ⚠️ 有 retry |
| 技術債項目          | 0     | 10     | ⚠️ 需清理   |
| TODO 數量           | 0     | 5      | ⚠️ 需完成   |

---

## 重構里程碑追蹤

詳見 `REFACTOR_PLAN.md`

- **M0**: 清理與基礎強化（1週）- 🔄 進行中
- **M1**: 觀測性建立（1週）- 📋 待開始
- **M2**: 依賴升級（2週）- 📋 待開始
- **M3**: 測試強化與 TODO 清理（2週）- 📋 待開始
- **M4**: 架構演進（4週）- 📋 可選

---

_詳細說明參見 `TECH_DEBT_AUDIT.md` & `REFACTOR_PLAN.md`_
