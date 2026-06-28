---
'@app/ratewise': patch
---

讓 PWA 修復更快傳播到既有使用者：連線恢復時偵測「舊版 SW 預快取缺少 app shell 或 legacy 膨脹 precache」等壞 SW 狀態，並在線上自動安全接管新版（SKIP_WAITING + 整頁重載一次）。健康 SW 仍維持 prompt 更新 UX，避免版本切換時的載入失敗。
