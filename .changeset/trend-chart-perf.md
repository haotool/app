---
'@app/ratewise': patch
---

趨勢圖載入極速化：30 筆 API 請求合併為 1 筆、移除 10 秒硬延遲改用 requestIdleCallback、PWA 導覽加入 3 秒 timeout fallback 與 cache 預算控制。趨勢圖可見時間從 10.9 秒降至 820 毫秒。
