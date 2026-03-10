---
'@app/ratewise': patch
'@app/park-keeper': patch
---

修復 RateWise 的 Cloudflare 安全標頭分層與正式站驗證流程，並讓 ParkKeeper 的裝置方向感測器只在 Quick Entry 面板可見時啟用，降低正式站權限警告與 console 噪音。
