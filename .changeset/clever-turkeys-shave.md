---
'@app/ratewise': patch
---

修正 PWA 冷啟動白屏的成功判定、app-ready 時序與可觀性。

改以明確 app-ready 訊號解除冷啟動 watchdog，並將 ready 時機延到首次 React commit 後，避免 bootstrap 成功但首屏 render 失敗時被誤判為已完成掛載；同時補上持久化 PWA 診斷事件與冷啟動 E2E，讓離線/快取/啟動失敗不再只剩無聲白屏。

另外將延後修復的 skip 條件收斂為「早期 prime 實際成功」才跳過，避免使用者啟動當下離線、稍後恢復網路時，仍錯失同 session 的 chunk 補救機會。
