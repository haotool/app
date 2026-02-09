---
'@app/ratewise': patch
---

修正通知元件水平置中偏移問題

- 合併 position + container token 為單一定位 token
- 確保 translate-x-1/2 基於正確寬度計算
- 遵循 UI/UX 最佳實踐：固定定位 + 寬度約束在同一層
