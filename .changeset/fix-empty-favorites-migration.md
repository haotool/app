---
'@app/ratewise': patch
---

修復 legacy localStorage 遷移時空收藏陣列被預設值覆蓋的問題

- 舊版 favorites key 為 `[]`（使用者刻意清空）時，遷移後應保留空收藏
- 修正 buildMigrationPatch 的 `if (sanitized.length > 0)` 條件判斷
- 新增 3 個遷移模擬測試：空陣列保留、全無效代碼、混合有效/無效代碼
