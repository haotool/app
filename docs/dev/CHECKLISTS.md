# 品質檢查清單

## Quick Wins (立即可做)

- [ ] 補齊 README.md
- [ ] 補齊 .editorconfig
- [ ] 修正 PostCSS → ESM
- [ ] 補齊 Error Boundary
- [ ] 補齊 .env.example

## 阻擋項 (必須修復才能上線)

- [ ] **測試覆蓋率 ≥80%**
- [ ] **CI/CD Pipeline**
- [ ] **Docker 化**
- [ ] **安全標頭**
- [ ] **觀測性 (Logger + Error Tracking)**

## 長期改善

- [ ] 拆分 RateWise 元件
- [ ] TypeScript 嚴格化
- [ ] Vite Build 優化
- [ ] 依賴鎖版策略
- [ ] E2E 測試

## 命令快查

```bash
# 開發
pnpm dev

# 測試
pnpm test
pnpm test --coverage

# 建置
pnpm build

# 類型檢查
pnpm typecheck

# Lint
pnpm lint
```

---

_詳細說明參見 TECH_DEBT_AUDIT.md & REFACTOR_PLAN.md_
