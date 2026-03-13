---
'@app/ratewise': patch
---

fix(sw): 修復 setCatchHandler JS/CSS 三層快取回退策略防止新安裝冷啟動黑屏

- setCatchHandler script/style 回退：新增 ignoreSearch 與 matchPrecache 策略
- verifyAndRepairPrecache：修復 non-hashed 資源 revision-keyed URL 比對邏輯
- E2E：新增新安裝場景（precache-only）離線就緒驗證測試
- E2E：新增 setCatchHandler JS 回退命中驗證測試
- E2E：新增 Cloudflare COEP/CORP sub-resource 隔離驗證（防止 SW precache 被阻擋）
