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
pnpm deploy   # wrangler deploy --minify（package.json script）
```

手動部署（不加 minify）：

```bash
pnpm exec wrangler deploy
```

> **CI**：`.github/workflows/release.yml` 於 Wait for RateWise 之後使用 `wrangler deploy --minify`；本地 Maintainer 部署建議同用 `pnpm deploy`。

## 本版重點

- Worker 版本：`5.4`（以 `X-Security-Policy-Version` 與 `worker.js` JSDoc 四處同步為準）
- `wrangler.jsonc` observability 取樣率：`0.1`（10%，對齊 Workers 配額治理）
- `compatibility_date`：`2026-06-01`（季度更新 runtime 基準）
- HSTS 改由 Cloudflare Edge 管理，Worker 不再寫入
- `app.haotool.org/*` 全域納入 Worker
- `www.haotool.org/*` 由 Worker 永久轉址到 apex
- `ratewise` 改為 nonce 型 CSP
- `csp-report` 改為 `POST` only
- 分享圖 CORS 白名單改為精準檔名
- `haotool` 首頁改為程序化 3D environment，避免執行期依賴遠端 HDR preset

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

# 7. COEP 邊界（PWA precache）：HTML 有 COEP，hashed JS 僅 CORP、無 COEP
curl -sSI https://app.haotool.org/ratewise/ | grep -i 'cross-origin-embedder'
JS=$(curl -s --compressed https://app.haotool.org/ratewise/ | grep -Eo 'assets/[^"]+\.js' | head -1)
curl -sSI "https://app.haotool.org/ratewise/${JS}" | grep -i 'cross-origin'
```

## RateWise UX Release 順序（SSOT）

對齊 UX spec §5.4 與 `AGENTS.md` Release SOP；**不可**在 Zeabur 正式站版本就緒前 purge。

1. **Zeabur app deploy**（`main` push 觸發 Dockerfile 建置）
2. **app-version probe**：`RATEWISE_RELEASE_ACTION=wait RATEWISE_EXPECTED_VERSION=x.y.z node scripts/ratewise-production-release.mjs`
3. **Worker deploy**：`cd security-headers && pnpm deploy`（或 release workflow）
4. **CF purge**（prefix 清單見 `scripts/ratewise-production-release.mjs` `buildRatewisePurgePayload`）
5. **live precache**：`VERIFY_PRECACHE_SOURCE=live VERIFY_BASE_URL=https://app.haotool.org/ratewise/ node scripts/verify-precache-assets.mjs`

**stale edge 404**：若原 URL 404、加 querystring 可 200 → 先 purge 再視為完成。

詳細稽核步驟見 [038_ratewise_cloudflare_audit_workflow.md](../docs/dev/038_ratewise_cloudflare_audit_workflow.md)。

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

- [docs/SECURITY_CSP_STRATEGY.md](../docs/SECURITY_CSP_STRATEGY.md)
- [docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md](../docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md)
- [docs/dev/038_ratewise_cloudflare_audit_workflow.md](../docs/dev/038_ratewise_cloudflare_audit_workflow.md)
- [docs/dev/040_cloudflare_security_headers_refactor_spec.md](../docs/dev/040_cloudflare_security_headers_refactor_spec.md)
