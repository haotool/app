# @app/split-meow

## 0.0.2

### Patch Changes

- 修復 Service Worker 三個 PWA 離線 bug：setCatchHandler 導覽回退改用 matchPrecache 解決 revision-keyed 快取鍵查詢失敗、補上 JS/CSS chunk 三層快取回退避免離線黑屏、新增 clientsClaim 確保首次安裝後立即控制已開啟頁面。
