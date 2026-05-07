---
'@app/ratewise': patch
---

修正冷啟動 watchdog 抹除 SSG 預渲染內容的反模式。當 JS chunk 載入失敗時，若 `#root` 已含 vite-react-ssg 預渲染樹，watchdog 改採 floating banner 模式並附加在 `<body>`，使用者仍可閱讀靜態頁；診斷視窗改用 design token 色彩與純文字標籤，並明確提示「Service Worker 未註冊但舊快取仍存在」的修復路徑。
