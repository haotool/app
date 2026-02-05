---
'@app/ratewise': patch
---

fix(pwa): 舊用戶更新偵測 + 路由錯誤恢復 + Safari chunk 修復

- UpdatePrompt 加入 visibilitychange 監聽，iOS PWA 從背景恢復時主動檢查更新
- 新增 RouteErrorBoundary 包裝路由內容，頁面錯誤時保留底部導覽可切換
- ErrorBoundary handleReset 改為 window.location.reload() 修復 chunk 錯誤循環
- chunkLoadRecovery 精確匹配 Safari TypeError("Load failed") 動態 import 失敗
