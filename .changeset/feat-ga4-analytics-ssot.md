---
'@app/ratewise': minor
---

整合 GA4 直接 gtag.js 追蹤，建立 SSOT 架構

- 新增 @app/shared/analytics：initGA / trackPageview / trackEvent / RouteAnalytics
- arguments 物件實作避免 GA4 靜默失效；transport_type: beacon 確保頁面卸載不丟失事件
- SPA 路由變更自動追蹤；初始 mount 跳過防止 SSG hydration 重複計算
- 新增 17 個單元測試全數通過
