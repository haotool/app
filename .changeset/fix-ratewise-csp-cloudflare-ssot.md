---
'@app/ratewise': patch
---

收斂 CSP 責任邊界並清理本地 preview 的網路探測噪音

- 移除 app 端 CSP build/runtime 管線，改由 Cloudflare 作為唯一安全標頭來源
- 新增 `__network_probe__` 靜態資產並修正 network probe 邏輯
- 避免 localhost 與 preview 環境出現假性 `FetchEvent` / `ERR_FAILED` console 噪音
