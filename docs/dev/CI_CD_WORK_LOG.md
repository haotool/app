### 5. E2E 測試啟用

- **行動**: 移除 `tests/e2e/calculator-fix-verification.spec.ts` 中的 `.skip` 標記。
- **原因**: 依賴的 `data-testid="amount-input"` 已存在，且 PWA manifest 重複問題已修復，預期環境已穩定。
- **預期結果**: CI 應能正確運行此測試集，驗證計算機修復。

---
