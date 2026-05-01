---
'@app/ratewise': patch
---

perf: 將 vendor-motion（138KB）與 vendor-dnd（95KB）移出初始 modulepreload

透過 manualChunks 將 react-dom 主命名空間與 jsx-runtime 的 CJS factory 置入 vendor-commons，
切斷 app chunk → vendor-motion 及 vendor-router-runtime → vendor-dnd 的靜態依賴鏈。
初始下載減少約 60KB brotli；vendor-motion 與 vendor-dnd 改為按需延遲載入。
