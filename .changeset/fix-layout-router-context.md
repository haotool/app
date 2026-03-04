---
'@app/ratewise': patch
---

修正 Layout.tsx 不應依賴 react-router context

移除 Layout.tsx 中的 RouteAnalytics（需要 useLocation），
RouteAnalytics 僅在 AppLayout.tsx（SSG router 內）保留。
修復 Layout.test.tsx 全數失敗的問題。
