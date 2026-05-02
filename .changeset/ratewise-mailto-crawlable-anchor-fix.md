---
'@app/ratewise': patch
---

修正 Lighthouse `crawlable-anchors` SEO 扣分：`MailtoLink` 改用 `<button>` 取代無 `href` 的 `<a>`，避免 `/about/`、`/faq/` 等含 email 的 SEO 頁面在 Lighthouse 被扣 5-8 分；同時保留繞過 Cloudflare Email Obfuscation 與防 email 收割的設計目的（SSG 仍輸出 `[at]` 形式、無 `mailto:`、hydration 後 click 開 `mailto:`）。
