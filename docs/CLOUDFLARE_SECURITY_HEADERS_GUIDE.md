# Cloudflare 安全標頭配置指南

> **最後更新**: 2026-03-10
> **適用範圍**: `haotool.org`、`www.haotool.org`、`app.haotool.org/*`
> **SSOT**: `security-headers/src/worker.js`、Cloudflare Edge HSTS 設定

## 分層原則

### Cloudflare Edge

放固定、站點級、與路徑無關的政策：

- HSTS
- HTTPS redirect / Always Use HTTPS
- 其他不需程式判斷的固定 response headers

### Cloudflare Worker

放需要路由或 app 判斷的政策：

- app/path 分層 CSP
- `ratewise` 的 CSP report endpoint
- `ratewise` 的 COEP / COOP / CORP
- 分享圖精準 CORS 白名單
- Vite hashed asset immutable cache

### App / Build

負責降低 Worker 複雜度：

- 移除不必要的 inline event handler
- 優先清除 `media=print onload=...` 這類 inline handoff，之後再升級 strict nonce CSP

## 目前正式做法

### HSTS

HSTS 已由 Cloudflare Edge 提供。Worker 不再寫入 `Strict-Transport-Security`。

建議設定：

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Worker route

```jsonc
{
  "routes": [
    { "pattern": "app.haotool.org/*", "zone_name": "haotool.org" },
    { "pattern": "haotool.org/*", "zone_name": "haotool.org" },
    { "pattern": "www.haotool.org/*", "zone_name": "haotool.org" },
  ],
}
```

### CSP 分層

- `/ratewise/*`
  - nonce CSP
  - GA / Cloudflare Insights connect/script allowlist
  - CSP report endpoint
  - HTML `no-cache, must-revalidate`
  - COEP / COOP / CORP
- `/nihonname/*`
  - 暫時 legacy inline CSP
  - Google Fonts + Transparent Textures allowlist
- `haotool.org/*` / `www.haotool.org/*` / `app.haotool.org/` root pages
  - 暫時 legacy inline CSP
  - 原因：正式輸出仍有 CSS preload `onload=` handoff
- `/park-keeper/*`
  - nonce CSP
  - Google Fonts + Leaflet CSS + map tile host allowlist
  - `geolocation=(self)`, `accelerometer=(self)`, `gyroscope=(self)`, `magnetometer=(self)`
- `/quake-school/*`
  - 暫時 `script-src 'unsafe-inline'`
  - 原因：正式輸出仍有 preload `onload=` handoff

## CORS 原則

- 預設不加 `Access-Control-Allow-Origin`
- 只對明確 public share asset 開 `*`
- RateWise 分享圖 SSOT：
  - `/ratewise/og-image.jpg`
  - `/ratewise/twitter-image.jpg`
  - 舊 `.png` redirect 路徑保留相容

## 部署後最小驗證

```bash
curl -sSI https://app.haotool.org/ratewise/
curl -s --compressed https://app.haotool.org/ratewise/ | rg "nonce=|application/ld\\+json"
curl -sSI https://app.haotool.org/nihonname/
curl -sSI https://app.haotool.org/park-keeper/
curl -sSI https://app.haotool.org/quake-school/
curl -sSI -X GET https://app.haotool.org/ratewise/csp-report
curl -sSI -X POST https://app.haotool.org/ratewise/csp-report -H 'content-type: application/csp-report'
curl -sSI https://app.haotool.org/ratewise/og-image.jpg
```

## 注意事項

1. 不要把 HSTS、CSP、CORS 全部塞進 Worker 當萬用膠水。
2. `park-keeper` 不可沿用 deny-all 的 sensor policy；地理定位與導航感測器都必須按需白名單化。
3. `haotool`、`nihonname`、`quake-school` 若未先清掉 preload inline handler，不可直接切到 strict nonce CSP。
4. 分享圖檔名改動時，必須同步更新 Worker 白名單與 SEO SSOT。

## 主要依據

- [Cloudflare HSTS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/)
- [Cloudflare Response Header Transform Rules](https://developers.cloudflare.com/rules/transform/response-header-modification/)
- [Cloudflare Workers security headers example](https://developers.cloudflare.com/workers/examples/security-headers/)
- [Cloudflare CORS snippets](https://developers.cloudflare.com/rules/snippets/examples/define-cors-headers/)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
