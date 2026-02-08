---
'@app/ratewise': patch
---

fix(safari): Safari 頁面切換錯誤修復 - 移除 web-vitals attribution 建構

- 修復切換頁面時出現 "The string did not match the expected pattern" 錯誤
- 改用標準 web-vitals 建構替代 attribution 建構，避免 Safari performance.mark() SyntaxError
- 測試: reportWebVitals 11/11 通過
