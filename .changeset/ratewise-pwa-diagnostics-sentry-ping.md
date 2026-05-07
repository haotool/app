---
'@app/ratewise': patch
---

冷啟動白屏 P1：`recordPwaDiagnostic` warn/error 事件 fire-and-forget 轉發到 Sentry（error→`captureMessage`、warn→`addBreadcrumb`）與 GA4（`pwa_diagnostic` event），加 5 秒 dedup 與環境變數開關（`VITE_PWA_DIAGNOSTIC_FORWARDING`）；info 不轉發以保護 quota。把冷啟動觀察性從盲修改為數據驅動。
