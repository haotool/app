---
'@app/ratewise': patch
---

修正冷啟動 watchdog 抹除 SSG 預渲染內容的反模式。當 JS chunk 載入失敗時，若 `#root` 已含 vite-react-ssg 預渲染樹，watchdog 改採 floating banner 模式並附加在 `<body>`，使用者仍可閱讀靜態頁；無 SSG 內容時沿用原本全屏 fallback。
