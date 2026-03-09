# Cloudflare 安全標頭分層重構 SPEC

> **狀態**: Active
> **最後更新**: 2026-03-10
> **適用範圍**: `security-headers/*`、`app.haotool.org/*`、`haotool.org/*`、`www.haotool.org/*`

## 背景

本次重構的核心不是「再多補幾個 header」，而是把 Cloudflare Edge、Worker、App build 的責任重新切清楚。

重構前的實際狀態：

- `Strict-Transport-Security` 已由 Cloudflare Edge 全域生效，但 Worker 仍重複寫入。
- Worker route 只覆蓋 `app.haotool.org/ratewise/*`，`nihonname`、`park-keeper`、`quake-school` 缺少統一安全標頭。
- `ratewise` 以逐請求讀完整 HTML + SHA-256 hash 建立 CSP，成本偏高，且不利長期維護。
- `/ratewise/csp-report` 對所有 method 都回 `204`，沒有最基本的 method / content-type 治理。
- RateWise 分享圖 SSOT 已改為 `.jpg`，但 Worker 白名單仍停留在 `.png`。

## 蒐證摘要

### Cloudflare / Worker 層

- `wrangler whoami`：CLI 已登入，可部署 `security-headers`。
- Cloudflare bindings MCP：帳號內存在 `security-headers` Worker，遠端 bundle 與 repo `security-headers/src/worker.js` 一致。
- Cloudflare API MCP：本輪查詢因 `Auth required` 無法直接列出 Rules/Headers，故以 bindings MCP + wrangler + curl 補強驗證。

### 正式站 curl / Browser MCP

- `https://app.haotool.org/ratewise/`
  - GET 具 CSP、Report-Only、COEP/COOP/CORP、`x-security-policy-version`
  - 舊版 CSP 為 hash-based，確實每次 GET 重新算 hash
- `https://app.haotool.org/nihonname/`、`/park-keeper/`、`/quake-school/`
  - 只有 HSTS，缺少 CSP、nosniff、X-Frame-Options、Referrer-Policy
- `https://app.haotool.org/ratewise/csp-report`
  - GET 與 POST 都回 `204`
- `https://app.haotool.org/ratewise/og-image.jpg`
  - 實際分享圖沒有 `Access-Control-Allow-Origin: *`

### App 真實輸出

- `haotool`、`nihonname`：正式輸出仍含 `media=print onload=...` preload handoff，暫時不能移除 `script-src 'unsafe-inline'`。
- `park-keeper`：正式輸出不含 inline event handler，可安全使用 nonce CSP。
- `quake-school`：正式輸出仍含 `onload=` preload handoff，暫時不能移除 `script-src 'unsafe-inline'`。
- `park-keeper`：必須保留 `geolocation=(self)` 與導航感測器白名單，否則直接破壞產品核心功能。

## 最終架構決策

### 1. Edge / Worker / Build 三層分工

- Cloudflare Edge
  - HSTS
  - HTTPS redirect / Always Use HTTPS
  - 任何真正固定、與路徑無關的站點級政策
- Cloudflare Worker
  - 依 app/path 套用不同 CSP 與 `Permissions-Policy`
  - RateWise HTML 跨域隔離（COEP/COOP/CORP）
  - 分享圖精準 CORS 白名單
  - CSP report endpoint 治理
  - Vite hashed asset immutable cache
- App build
  - 盡量消除 inline event handler
  - 維持 JSON-LD、hydration script 與 PWA 註冊腳本可被 nonce 安全允許

### 2. CSP 策略選型

- `ratewise`：改用 **nonce + HTMLRewriter 串流注入**
  - 保留 strict `script-src`
  - 移除逐請求全文讀取與 hash 計算
- `park-keeper`：採 **nonce 型 CSP**
  - 正式輸出不含 inline event handler，可安全移除 script `unsafe-inline`
- `haotool` / `nihonname` / `quake-school`：暫時維持 **legacy inline CSP**
  - 原因：正式輸出仍有 `onload=` preload handoff
  - 後續需先清掉 preload inline handler，才能升級到 nonce 型 CSP
- 未識別新 app 路徑：採 **保守 fallback policy**
  - 目的：避免未來新 app 一掛上 `app.haotool.org/*` 就因過度嚴格而白屏

### 3. CORS 策略

- 預設不開放跨來源讀取
- 僅對明確 public share asset 開放 `Access-Control-Allow-Origin: *`
- RateWise 分享圖白名單必須與 SEO SSOT 對齊：
  - `/ratewise/og-image.jpg`
  - `/ratewise/twitter-image.jpg`
  - 舊 `.png` redirect 路徑保留相容

### 4. HSTS 策略

- HSTS 保持由 Cloudflare Edge 管理
- Worker 不再寫入 HSTS，避免責任重疊與錯誤歸因

## Worker Profile Matrix

| 路徑 / Host                                                           | CSP 模式        | 特殊來源                                          | Permissions-Policy                                                                | 額外控制                                    |
| --------------------------------------------------------------------- | --------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| `/ratewise/*`                                                         | nonce           | GA、Cloudflare Insights、jsDelivr、raw GitHub     | 全部拒絕                                                                          | CSP report、COEP/COOP/CORP、HTML `no-cache` |
| `/nihonname/*`                                                        | legacy inline   | Google Fonts、Transparent Textures                | 全部拒絕                                                                          | 分享圖 CORS                                 |
| `/park-keeper/*`                                                      | nonce           | Google Fonts、Leaflet CSS、NLSC / Carto tile host | `geolocation=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self)` | 分享圖 CORS                                 |
| `/quake-school/*`                                                     | legacy inline   | Google Fonts                                      | 全部拒絕                                                                          | 後續移除 preload inline handler             |
| `haotool.org/*` / `www.haotool.org/*` / `app.haotool.org/` root pages | legacy inline   | Google Fonts                                      | 全部拒絕                                                                          | 分享圖 CORS                                 |
| 未知 `app.haotool.org/<future-app>/*`                                 | fallback inline | Google Fonts / unpkg / https images               | 全部拒絕                                                                          | 避免未上線前先白屏                          |

## 驗證與回歸準則

### 本地

```bash
pnpm --filter @app/ratewise exec vitest run src/__tests__/securityHeadersWorker.test.ts
pnpm exec prettier --check security-headers/src/worker.js security-headers/wrangler.jsonc apps/ratewise/src/__tests__/securityHeadersWorker.test.ts apps/ratewise/tests/e2e/cloudflare-cache.spec.ts docs/SECURITY_CSP_STRATEGY.md docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md security-headers/DEPLOY.md docs/dev/040_cloudflare_security_headers_refactor_spec.md
```

### 部署後

```bash
cd security-headers && pnpm exec wrangler deploy

curl -sSI https://app.haotool.org/ratewise/
curl -s --compressed https://app.haotool.org/ratewise/ | rg "nonce=|application/ld\\+json|__staticRouterHydrationData"
curl -sSI https://app.haotool.org/nihonname/
curl -sSI https://app.haotool.org/park-keeper/
curl -sSI https://app.haotool.org/quake-school/
curl -sSI -X GET https://app.haotool.org/ratewise/csp-report
curl -sSI -X POST https://app.haotool.org/ratewise/csp-report -H 'content-type: application/csp-report'
curl -sSI https://app.haotool.org/ratewise/og-image.jpg
```

### Browser MCP

- `ratewise` 首頁 console error = `0`
- `nihonname` 首頁 console error = `0`
- `park-keeper` 首頁 console error = `0`
- `quake-school` 首頁 console error = `0`

## 權威來源

以下來源為本次決策直接引用的權威依據，涵蓋 Cloudflare、標準規範、瀏覽器安全與框架最佳實踐：

1. [Cloudflare Workers security headers example](https://developers.cloudflare.com/workers/examples/security-headers/)
2. [Cloudflare HSTS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/)
3. [Cloudflare Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/)
4. [Cloudflare Response Header Transform Rules](https://developers.cloudflare.com/rules/transform/response-header-modification/)
5. [Cloudflare Transform Rules overview](https://developers.cloudflare.com/rules/transform/)
6. [Cloudflare Snippets: define CORS headers](https://developers.cloudflare.com/rules/snippets/examples/define-cors-headers/)
7. [Cloudflare Snippets: when to use](https://developers.cloudflare.com/rules/snippets/when-to-use/)
8. [Cloudflare Workers Headers API](https://developers.cloudflare.com/workers/runtime-apis/headers/)
9. [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
10. [MDN CSP `script-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)
11. [MDN Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
12. [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
13. [MDN Cross-Origin-Embedder-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy)
14. [MDN Cross-Origin-Opener-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
15. [MDN Cross-Origin-Resource-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy)
16. [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
17. [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
18. [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
19. [RFC 6797: HTTP Strict Transport Security](https://www.rfc-editor.org/rfc/rfc6797)
20. [W3C Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
21. [W3C Reporting API Level 1](https://www.w3.org/TR/reporting-1/)
22. [web.dev Strict CSP](https://web.dev/articles/strict-csp)
23. [web.dev PWA update patterns](https://web.dev/learn/pwa/update)
24. [Chrome Workbox precaching](https://developer.chrome.com/docs/workbox/modules/workbox-precaching)
25. [Chrome Workbox routing](https://developer.chrome.com/docs/workbox/modules/workbox-routing)
26. [Chrome Workbox strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies)
27. [Chrome handling service worker updates](https://developer.chrome.com/docs/workbox/handling-service-worker-updates)
28. [React `<script>` reference](https://react.dev/reference/react-dom/components/script)
29. [React `dangerouslySetInnerHTML` reference](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
30. [Vite shared config `base`](https://vite.dev/config/shared-options#base)
31. [vite-plugin-pwa update behavior](https://vite-pwa-org.netlify.app/guide/auto-update.html)
32. [HSTS preload requirements](https://hstspreload.org/)
