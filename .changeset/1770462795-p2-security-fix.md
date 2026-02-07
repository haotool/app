---
'@app/ratewise': patch
'@app/haotool': patch
---

fix(security): P2 安全修復 - 7 個 CodeQL Medium 級別警告全部修復

- URL Sanitization: 使用 URL 對象驗證域名替代 .includes() 檢查
- Shell Injection: 添加白名單驗證與 resolve() 路徑安全
- Identity Replacement: 修正無效字串替換邏輯
