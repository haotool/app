---
'@app/ratewise': patch
---

修復 PWA 骨架屏卡住與下拉強制刷新失效問題

- AppLayout: 接線 usePullToRefresh + PullToRefreshIndicator，使用者可下拉強制清快取並重載
- SkeletonLoader: 新增 10 秒 watchdog，客戶端卡住時自動轉為錯誤復原 UI（強制重新載入 + 聯絡資訊）
- sw.ts: 新增 FORCE_HARD_RESET message handler，客戶端可命令 SW 清除所有快取後回報重載
- swUtils.ts: performFullRefresh 改為優先透過 SW 訊息清快取（forceHardReset），確保 SW 與 client 兩端快取均被清除；3 秒 timeout 兜底強制重載
