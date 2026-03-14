---
'@app/ratewise': patch
---

test(ratewise): 新增 GA4 延後初始化與 PWA 冷啟動 E2E 迴歸測試

- 驗證 GA4 script 不在 load 事件前注入 DOM（不影響 LCP）
- 驗證 document.readyState === 'complete' 競態防衛（readyState fix）
- 驗證 manifest.webmanifest Content-Type 為 application/manifest+json
- 驗證 dataLayer 不在 DOMContentLoaded 前初始化
- 驗證 precache 包含完整 JS/CSS/HTML（setCatchHandler 三層回退基礎）
- 驗證 precache 148 條目、45 JS chunks、offline.html、index.html 均存在
- 抽出 mockRatesApi 共用 helper 消除 DRY 違反
- 更新 playwright.config.ts 將 ga-defer-lcp.spec.ts 加入 offline-pwa-chromium testMatch
