---
'@app/ratewise': patch
---

fix(security): P2 安全修復 Review - 徹底修復 3 個殘留 CodeQL 警告

- Shell Injection 徹底修復: execSync 改用 spawnSync + 陣列參數，消除字串拼接風險
- URL Sanitization 深度修復: trusted-types-bootstrap.ts createScript 函數改用 URL 正則提取 + URL 對象解析
- 分離 SSG 標記檢查（安全識別符）和域名檢查（URL 驗證）
