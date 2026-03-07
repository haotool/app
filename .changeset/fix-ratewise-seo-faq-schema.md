---
'@app/ratewise': patch
---

修復 FAQ schema 重複與 head hydration 後 metadata 重複問題

- SEOHelmet: 保留 SSG shim，改由 client effect 接管 title、canonical、meta 與 JSON-LD 去重，修復 hydration 後重複 head tags
- SEO metadata: FAQPage schema 收斂到真正 FAQ 頁，移除首頁、幣別頁與 About/AuthorityGuide 的重複 FAQ 標記
- ImageObject: 補齊 `license` 與 `acquireLicensePage`，統一由 APP_INFO / seo-metadata SSOT 管理
- Tests: 補強 prerender、JSON-LD 與 client-side head reconciliation 驗證
- SEOHelmet: 補上 unmount cleanup，避免跨頁殘留 canonical、description 與 JSON-LD metadata
- SEOHelmet: 以穩定 signature 取代陣列依賴，避免同 props rerender 時重跑整份 head 去重流程
