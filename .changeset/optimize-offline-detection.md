---
'@app/ratewise': patch
---

fix(offline): 優化離線檢測響應速度

**優化項目**:

- 降低網路驗證超時從 5000ms → 3000ms
- 優化檢測邏輯：navigator.onLine 為 false 時立即響應
- 修復單元測試時序問題

**技術細節**:

- checkNetworkConnectivity 默認超時 3000ms
- navigator.onLine 為 false 時跳過混合驗證（立即標記離線）
- 改善 E2E 測試兼容性

**測試結果**:

- 單元測試：11/11 通過 ✅
- E2E 測試：持續優化中
