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

- Worker 版本：`4.0`
- HSTS 改由 Cloudflare Edge 管理，Worker 不再寫入
- `app.haotool.org/*` 全域納入 Worker
- `ratewise` 改為 nonce 型 CSP
- `csp-report` 改為 `POST` only
- 分享圖 CORS 白名單改為精準檔名

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
- `quake-school` 目前仍保留 `script-src 'unsafe-inline'`
  - 原因：正式輸出仍含 preload `onload=` handoff
- `ratewise` 只對 HTML 啟用 COEP / COOP
  - 非 HTML 靜態資源僅保留 `Cross-Origin-Resource-Policy: same-origin`
  - 目的是避免再次破壞 PWA precache 與離線冷啟動

## 相關文件

- `/Users/azlife.eth/Tools/app/docs/SECURITY_CSP_STRATEGY.md`
- `/Users/azlife.eth/Tools/app/docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md`
- `/Users/azlife.eth/Tools/app/docs/dev/040_cloudflare_security_headers_refactor_spec.md`
