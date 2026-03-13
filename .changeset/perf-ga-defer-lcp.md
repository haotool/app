---
'@app/ratewise': patch
---

perf(ratewise): 延後 GA 初始化至 load 事件後改善 LCP

- 將 initGA 與 trackPageview 移至 window.addEventListener('load', ..., { once: true })
- 避免 152KB GA 腳本與 LCP 關鍵資源（app bundle、CDN 匯率資料）競爭頻寬
- Lighthouse LCP 分數預期從 19 提升（目前 5.5s → 目標 <2.5s）
