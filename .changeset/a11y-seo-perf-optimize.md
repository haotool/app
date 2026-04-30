---
'@app/ratewise': patch
---

- 無障礙：修正 HomepageSEOSection 眉標文字對比度（text-primary/80 → text-primary，3.97→5.71:1），a11y 96→100
- SEO：robots.txt 移除非標準 Content-Signal 指令（改為註解），seo 92→100
- 效能：logo.png 轉 WebP（25KB→7KB，節省 72%），AppLayout Logo 組件加 picture 元素
- 架構：趨勢圖資料載入改用 requestIdleCallback 取代 IntersectionObserver，真正延後到瀏覽器空閒
- 測試：setupTests 加入 requestIdleCallback 全域 mock，確保 jsdom 環境測試正確執行
