---
'@app/ratewise': patch
---

修正 PWA 冷啟動白屏的成功判定與可觀性。

改以明確 app-ready 訊號解除冷啟動 watchdog，避免被早期 DOM 變動誤判為已完成掛載；同時補上持久化 PWA 診斷事件與冷啟動 E2E，讓離線/快取/啟動失敗不再只剩無聲白屏。
