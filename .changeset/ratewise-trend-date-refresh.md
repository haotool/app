---
'@app/ratewise': patch
---

fix: 長時間開啟的 RateWise 分頁回前景時會重新檢查本地日期，避免趨勢圖停在舊歷史匯率日期；同時移除 SEO 頁面 hydration 初期的骨架替換、讓低優先級 PWA offline-ready 提示靜默化，並補強 SSG SEO regression gate，避免 Lighthouse CLS 與 SEO 測試被乾淨 checkout 略過。
