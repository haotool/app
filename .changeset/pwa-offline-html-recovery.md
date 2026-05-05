---
'@app/ratewise': patch
---

PWA 冷啟動離線回退強化：新增 activate 階段 offline.html 補救快取機制，確保 iOS Safari cache eviction 或 precache 失敗後仍能正常離線回退。
