---
'@app/ratewise': patch
---

fix(a11y,csp): 修正 W3C 驗證問題與 CSP 報告機制

- 修正 BottomNavigation 的 A11y 違規：motion.div tabIndex 問題
- 升級 CSP 報告：新增 Reporting-Endpoints，report-to 優先
- 新增 BottomNavigation A11y 測試
