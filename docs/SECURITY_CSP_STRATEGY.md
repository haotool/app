# Content Security Policy 策略基線

> **最後更新**: 2026-03-10
> **Worker 版本**: v4.0
> **SSOT**: `security-headers/src/worker.js`
> **詳細 SPEC**: `/Users/azlife.eth/Tools/app/docs/dev/040_cloudflare_security_headers_refactor_spec.md`

## 核心原則

- HSTS 由 Cloudflare Edge 管理，Worker 不重複寫入。
- CSP 依 app/path 分層，不再用單一寬鬆政策硬套整站。
- `ratewise` 改用 **nonce + HTMLRewriter 串流注入**，移除逐請求全文讀取與 SHA-256 hash 計算。
- `park-keeper` 採 **nonce 型 CSP**。
- `haotool`、`nihonname`、`quake-school` 因正式輸出仍有 preload `onload=` handoff，暫時保留 `script-src 'unsafe-inline'`。

## 路徑矩陣

| 路徑 / Host                                                           | CSP 模式        | 目的                                            |
| --------------------------------------------------------------------- | --------------- | ----------------------------------------------- |
| `/ratewise/*`                                                         | nonce           | 最嚴格；含 CSP report 與跨域隔離                |
| `/nihonname/*`                                                        | legacy inline   | 正式輸出仍有 preload handoff，先保證功能不被擋  |
| `/park-keeper/*`                                                      | nonce           | 保留 geolocation 與導航感測器，允許地圖資源來源 |
| `/quake-school/*`                                                     | legacy inline   | 避免 preload inline handler 直接失效            |
| `haotool.org/*` / `www.haotool.org/*` / `app.haotool.org/` root pages | legacy inline   | 作品集正式輸出仍有 preload handoff              |
| 未知 `app.haotool.org/<future-app>/*`                                 | fallback inline | 保守相容，避免新 app 尚未建檔前先白屏           |

## 為什麼淘汰 hash-based CSP

舊版 `ratewise` 使用 hash-based CSP，優點是能在不改 HTML 的情況下阻擋 `unsafe-inline`。但在 Cloudflare Worker 上，它有三個結構性問題：

1. 每次 HTML GET 都必須讀完整 body。
2. 每次都要重算 inline script hash，CPU 與記憶體成本高。
3. CSP 維護邏輯與 HTML 真相耦合過深，難以擴展到其他 app。

v4.0 對 `ratewise` 與 `park-keeper` 改為 nonce 後，Worker 只需串流為 inline script 補 `nonce`，不再需要全文緩衝與 hash 計算。

## 目前保留的例外

### `style-src 'unsafe-inline'`

此 repo 仍有：

- inline critical CSS
- prerender 後的大型 `<style>` 區塊
- Tailwind / critical CSS inlining

因此目前只把 script policy 拉到 strict，style policy 暫時保留 `unsafe-inline`。

### `haotool`、`nihonname`、`quake-school` 仍保留 `script-src 'unsafe-inline'`

正式輸出目前仍包含：

- `haotool` / `nihonname` 的 `media=print onload=...` CSS handoff
- Google Fonts preload `onload=` handoff
- CSS preload `onload=` handoff

在這些 inline event handler 清理完成前，不能把這些 app 升級到 nonce script policy。

## 維護規則

1. 新增 app 路徑時，先在 `security-headers/src/worker.js` 建立專屬 profile，再調整 `wrangler.jsonc` route 或 fallback。
2. 若分享圖檔名改動，必須同步更新 Worker 的 public share asset 白名單。
3. 若 `park-keeper` 權限需求變更，必須同步更新 `Permissions-Policy`，不可沿用預設 deny-all；目前最小白名單為 geolocation、accelerometer、gyroscope、magnetometer。
4. 修改 `haotool` / `nihonname` / `quake-school` preload 策略後，應立即評估移除 legacy inline policy。
5. 任何 CSP 變更都要用 `curl` 與瀏覽器 console 雙重驗證。

## 驗證命令

```bash
pnpm --filter @app/ratewise exec vitest run src/__tests__/securityHeadersWorker.test.ts

curl -sSI https://app.haotool.org/ratewise/
curl -s --compressed https://app.haotool.org/ratewise/ | rg "nonce=|application/ld\\+json"
curl -sSI https://app.haotool.org/nihonname/
curl -sSI https://app.haotool.org/park-keeper/
curl -sSI https://app.haotool.org/quake-school/
curl -sSI -X GET https://app.haotool.org/ratewise/csp-report
curl -sSI https://app.haotool.org/ratewise/og-image.jpg
```

## 主要依據

- [Cloudflare Workers security headers example](https://developers.cloudflare.com/workers/examples/security-headers/)
- [Cloudflare HSTS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/)
- [Cloudflare Response Header Transform Rules](https://developers.cloudflare.com/rules/transform/response-header-modification/)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [web.dev Strict CSP](https://web.dev/articles/strict-csp)
