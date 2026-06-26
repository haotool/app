# RateWise UX Release — Cloudflare Worker 檢查清單

> 版本：v1.0 | 2026-06-27 | 對齊 `AGENTS.md` security-headers SOP、`038_ratewise_cloudflare_audit_workflow.md`、UX spec §十四.12 Gate G3

## 適用時機

- `experiment/ratewise-ux-2026` → main Gate 通過後
- RateWise semver release 涉及正式站資產更新

## 順序（MUST）

1. **Zeabur app 部署完成** — 確認 GitHub deployment active SHA = release SHA
2. **app-version probe** — cache-busting 確認 `/ratewise/` 已切到目標版本
3. **`wrangler deploy`**（`security-headers/`）— 缺 secret 須明確 skip，不可假設 edge 已同步
4. **Cloudflare purge** — prefix：`/ratewise/`、`sw.js`、`registerSW.js`、`manifest.webmanifest`、`offline.html`、`assets`、`workbox-`、`static-loader-data-manifest`
5. **live precache 驗證**

## 命令

```bash
# 1. app-version（替換 TARGET_VERSION）
curl -s "https://app.haotool.org/ratewise/?v=$(date +%s)" | rg -o 'app-version[^<]+'

# 2. Worker 版本（GET，非 HEAD）
curl -s --compressed https://app.haotool.org/ratewise/ -D - -o /dev/null | rg -i 'x-security-policy-version|cross-origin-embedder'

# 3. HTML 有 COEP；hashed JS 無 COEP（PWA precache 關鍵）
curl -sI "https://app.haotool.org/ratewise/assets/<hash>.js" | rg -i cross-origin-embedder || echo "OK: JS 無 COEP"

# 4. live precache
VERIFY_PRECACHE_SOURCE=live VERIFY_BASE_URL=https://app.haotool.org/ratewise/ node scripts/verify-precache-assets.mjs
```

## stale edge 404 判定

- 原 URL **404**，加 querystring 後 **200** → Cloudflare stale edge 404
- **修法**：purge 後重跑 live precache；未 purge 前不得視為 release 完成

## observability（044 治理）

- `wrangler.jsonc` `head_sampling_rate: 0.1` 為現行 SSOT
- 本 checklist **不**擅自調低取樣；變更需 `044_workers_quota_governance_spec.md` 修訂 PR

## Worker 版本四處同步

變更 `security-headers/src/worker.js` 時 MUST 同步：JSDoc 標題、變更記錄、`__network_probe__` header、主回應 `x-security-policy-version`。
