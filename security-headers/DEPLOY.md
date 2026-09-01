# Security Headers Worker 部署指引

## 作用範圍

- `app.haotool.org/*`
- `haotool.org/*`
- `www.haotool.org/*`

## 前置檢查

```bash
cd security-headers
pnpm exec wrangler whoami
```

若 `whoami` 失敗，先重新登入 `wrangler` 或補齊 Cloudflare token。

## 部署

```bash
cd security-headers
pnpm exec wrangler deploy
```

## 本版重點

- Worker 版本：`6.5`
- HSTS 改由 Cloudflare Edge 管理，Worker 不再寫入
- `app.haotool.org/*` 全域納入 Worker
- `www.haotool.org/*` 由 Worker 永久轉址到 apex
- `ratewise` 改為 nonce 型 CSP
- `csp-report` 改為 `POST` only
- 分享圖 CORS 白名單改為精準檔名
- `haotool` 首頁改為程序化 3D environment，避免執行期依賴遠端 HDR preset
- Pages 由 Cloudflare Web Analytics 自動注入 beacon；前端不再載入失效的 Vercel Analytics 路由

## 靜態 origin 切換（Cloudflare Pages／Vercel）

`STATIC_ORIGIN` 是非機密的 Cloudflare Worker plain variable，用來在不改變公開網域與
既有 route 的情況下切換至 Cloudflare Pages。值必須是沒有 path、帳號或密碼的 HTTPS
origin，例如 `https://<pages-project>.pages.dev`。`STATIC_ORIGIN` 優先於舊的
`VERCEL_ORIGIN`；未設定前者時，後者仍可作為 Vercel 觀察期回退。

設定前先以 Pages Preview 驗證完整路由；正式值由 `wrangler.jsonc` 的 `vars` 固定，部署 Worker
後再執行下列檢查。移除 `STATIC_ORIGIN` 或回滾 Worker 版本即可回退至
`VERCEL_ORIGIN`，若兩者皆未設定則回到原 origin。

若 Vercel origin 未設定或格式不合法，Worker 會保留原 origin 並記錄警告，方便安全回退。
兩者是公開 origin 名稱，不是 secret；可以存在 Worker 的 `wrangler.jsonc`，但不可放入
`.env`、Vercel 前端環境變數或 client bundle。Cloudflare API token 與 KV secret 仍不可進 repo。

### Vercel 自訂網域 vs Cloudflare 代理（重要）

本架構的公開網域 **必須** 維持 Cloudflare 橘雲（Proxied），由 `security-headers` Worker
接收流量；靜態內容則透過 Worker 變數 `STATIC_ORIGIN=https://<project>.pages.dev` 回源。

因此：

- Vercel Dashboard 若顯示「偵測到代理／Invalid Configuration」，在 **未直連 Vercel DNS**
  的遷移期是預期現象，**不要** 為了消除警告而把 `www` CNAME 改成灰雲直連 Vercel。
- **不要** 在 Vercel 專案加入 `haotool.org` / `www.haotool.org` 作為對外自訂網域，
  除非已完全移除 Worker 前置層；否則 Vercel 會將 apex 308 到 www，與 Worker 的
  `www → haotool.org` 規則互撞，造成無限重導。
- 正確做法：Pages 僅用 `*.pages.dev` 作為 `STATIC_ORIGIN`；Cloudflare DNS 維持現狀。
- 觀察期可保留 `VERCEL_ORIGIN`；回退時移除 `STATIC_ORIGIN` 即恢復 Vercel origin。

## 部署後驗證

```bash
# 1. 版本號
curl -sSI https://app.haotool.org/ratewise/ | grep -i 'x-security-policy-version'

# 2. RateWise nonce CSP（必須用 GET）
curl -s --compressed https://app.haotool.org/ratewise/ | grep -Eo 'nonce=\"[^\"]+\"' | head
curl -sSI https://app.haotool.org/ratewise/ | grep -i 'content-security-policy'

# 3. 其他子 app 已被覆蓋
curl -sSI https://app.haotool.org/nihonname/ | grep -i 'content-security-policy\|x-frame-options\|x-content-type-options'
curl -sSI https://app.haotool.org/park-keeper/ | grep -i 'content-security-policy\|permissions-policy'
curl -sSI https://app.haotool.org/quake-school/ | grep -i 'content-security-policy'
curl -sSI https://www.haotool.org/ | grep -i '^location:'

# 4. CSP report endpoint
curl -sSI -X GET https://app.haotool.org/ratewise/csp-report
curl -sSI -X POST https://app.haotool.org/ratewise/csp-report -H 'content-type: application/csp-report'

# 5. 分享圖 CORS
curl -sSI https://app.haotool.org/ratewise/og-image.jpg | grep -i 'access-control-allow-origin\|cross-origin-resource-policy'

# 6. Edge HSTS（確認仍存在，來源應為 Edge 而非 Worker）
curl -sSI https://app.haotool.org/ratewise/ | grep -i 'strict-transport-security'
```

## 已知例外

- `haotool` 與 `nihonname` 目前仍保留 `script-src 'unsafe-inline'`
  - 原因：正式輸出仍含 CSS preload `onload=` handoff
- `haotool` 首頁不得再引入遠端 HDR preset / texture runtime 來源
  - 如需新外域，必須先完成資產自管或明確更新 CSP 決策文件
- `quake-school` 目前仍保留 `script-src 'unsafe-inline'`
  - 原因：正式輸出仍含 preload `onload=` handoff
- `ratewise` 只對 HTML 啟用 COEP / COOP
  - 非 HTML 靜態資源僅保留 `Cross-Origin-Resource-Policy: same-origin`
  - 目的是避免再次破壞 PWA precache 與離線冷啟動

## 相關文件

- `/Users/azlife.eth/Tools/app/docs/SECURITY_CSP_STRATEGY.md`
- `/Users/azlife.eth/Tools/app/docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md`
- `/Users/azlife.eth/Tools/app/docs/dev/040_cloudflare_security_headers_refactor_spec.md`
