---
'@app/ratewise': patch
---

修復內容頁（FAQ／指南／幣別／金額頁）與 404 頁載入時 console 出現的 React #418 hydration 錯誤：頁尾建置時間固定以台北時區顯示，未預渲染路徑改走乾淨的 client render 不再對錯誤快照 hydrate。
