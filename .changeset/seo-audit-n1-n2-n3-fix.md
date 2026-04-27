---
'@app/ratewise': patch
---

修復 2026-04-27 Live SEO 稽核發現的三個問題（N1 CDN 快取、N2 description 截斷、N3 H1/H2 重複）

- N2：縮短 34 幣對頁 meta description 模板（最差情況 ≤57 全形字，符合 Google SERP 65 字上限）；保留「台銀現金賣出價（非中間價）」核心差異化訊息
- N3：`HomepageContent` 新增 `sectionHeading` 欄位，首頁卡片 H2 改用 `'台銀牌告實際買賣價，換匯不必猜'`，消除與 sr-only H1 的文字重複
- N1（Worker）：security-headers v4.9 新增 `CDN-Cache-Control / Cloudflare-CDN-Cache-Control: max-age=300, stale-while-revalidate=3600`（僅 ratewise HTML profile），預期 TTFB 從 438ms 降至 ~50ms（edge 命中）
