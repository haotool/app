---
'@app/ratewise': patch
---

修復 Cloudflare Email Obfuscation 破壞 mailto 連結問題

新增 `MailtoLink` 元件，在 SSG 輸出中不含 `href` 屬性，避免 Cloudflare 在邊緣將 `mailto:` 改寫為 `/cdn-cgi/l/email-protection#…`（無 JS 爬蟲存取返回 404）。水合後由 `useEffect` 注入正確 href，對使用者透明。

影響頁面：FAQ、About、Privacy、SkeletonLoader、ErrorBoundary。
