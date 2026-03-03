# RateWise Cloudflare 稽核與驗證工作流

> **文件狀態**: Active
> **建立日期**: 2026-03-03
> **最後更新**: 2026-03-03T23:40:00+08:00
> **適用範圍**: `https://app.haotool.org/ratewise/`
> **目的**: 建立 RateWise 正式站在 Cloudflare 的安全標頭、快取、PWA 與驗證流程單一操作基準

---

## 1. 背景與問題定義

2026-03-03 針對 `RateWise` 進行正式站稽核時，確認 repo 與線上 Cloudflare 邊緣配置存在漂移：

- 正式站 `Permissions-Policy` 仍包含已移除的 `ambient-light-sensor`、`document-domain`、`vr`
- 正式站同時送出兩條 `Content-Security-Policy-Report-Only`
- 正式站 HTML `Cache-Control` 顯示為 `no-cache, no-cache, no-store, must-revalidate`
- `__network_probe__` 線上請求目前會 `301` 到尾斜線版本，代表 probe 路由仍需在部署層確認

同時，repo 內的 `security-headers` Worker 已是較新的預期值：

- [security-headers/src/worker.js](/Users/azlife.eth/Tools/app/security-headers/src/worker.js)
- [security-headers/wrangler.jsonc](/Users/azlife.eth/Tools/app/security-headers/wrangler.jsonc)

這代表問題不在 app 程式碼本身，而在 Cloudflare Dashboard 規則、Worker 部署版本、或多重規則疊加。

---

## 2. 單一真相來源

RateWise 的責任切分必須固定如下：

- `Cloudflare Worker`
  - `Content-Security-Policy`
  - `Content-Security-Policy-Report-Only`
  - `Strict-Transport-Security`
  - `Permissions-Policy`
  - `Referrer-Policy`
  - `Cross-Origin-*`
- `Cloudflare Cache Rules`
  - 邊緣快取策略
- `apps/ratewise/public/_headers`
  - 靜態檔與瀏覽器快取提示
  - `__network_probe__` `no-store`
  - Content-Type charset 備援
- `app 程式碼`
  - 不再管理 CSP
  - 不再注入 CSP meta
  - 不再初始化 runtime CSP reporter

不允許下列反模式：

- Worker、Transform Rules、Origin 同時設定同名安全標頭
- 以 `Transform Rules` 修改 `cache-control` 並誤認為等於控制 Cloudflare edge cache
- 將 `__network_probe__` 交給不存在或會被重導的路徑

---

## 3. 標準稽核順序

### Phase 1. 先確認線上實際回應

先以 `curl` 取得正式站真實回應，避免直接相信 Dashboard 畫面。

```bash
curl -sI https://app.haotool.org/ratewise/ | tr -d '\r'
curl -sI https://app.haotool.org/ratewise/sw.js | tr -d '\r'
curl -sI https://app.haotool.org/ratewise/manifest.webmanifest | tr -d '\r'
curl -sI https://app.haotool.org/ratewise/__network_probe__ | tr -d '\r'
```

至少檢查：

- `cache-control`
- `cf-cache-status`
- `content-security-policy`
- `content-security-policy-report-only`
- `permissions-policy`
- `strict-transport-security`
- `referrer-policy`

### Phase 2. 再核對 repo 預期基準

先核對以下檔案：

- [security-headers/src/worker.js](/Users/azlife.eth/Tools/app/security-headers/src/worker.js)
- [security-headers/wrangler.jsonc](/Users/azlife.eth/Tools/app/security-headers/wrangler.jsonc)
- [apps/ratewise/public/\_headers](/Users/azlife.eth/Tools/app/apps/ratewise/public/_headers)
- [docs/DEPLOYMENT.md](/Users/azlife.eth/Tools/app/docs/DEPLOYMENT.md)

判讀原則：

- repo 是預期配置
- `curl` 是正式站真實狀態
- 若兩者不一致，優先懷疑 Cloudflare 邊緣配置漂移，而不是 app bundle 回退

### Phase 3. 最後逐區檢查 Cloudflare Dashboard

依此順序檢查：

1. `Workers & Pages`
2. `Rules > Transform Rules`
3. `Rules > Snippets`
4. `Caching > Cache Rules`
5. `SSL/TLS`
6. `Speed > Optimization`
7. `Security > WAF / Bots`

---

## 4. Dashboard 詳細檢查清單

### 4.1 Workers & Pages

目標：確認 `security-headers` 是唯一安全標頭來源。

必查項：

- [ ] Worker 名稱與 repo 預期一致
- [ ] 最新部署時間晚於本次修正提交
- [ ] Route 為 `app.haotool.org/ratewise/*`
- [ ] 沒有其他舊 Worker 同時掛同一路徑
- [ ] Logs 可證明 `/ratewise/` 請求有命中該 Worker

判讀：

- 若線上 header 仍有舊 `Permissions-Policy`，但 repo Worker 已無該值，通常代表 Worker 未更新或 route 未命中

### 4.2 Rules > Transform Rules

目標：清除與 Worker 重疊的規則。

必查項：

- [ ] 是否仍有 `Set static Content-Security-Policy`
- [ ] 是否仍有 `Set static Content-Security-Policy-Report-Only`
- [ ] 是否仍有 `Set static Permissions-Policy`
- [ ] 是否仍有 `Set static Cache-Control`
- [ ] 是否有 `Remove response header` 作為舊規則補丁
- [ ] 規則順序是否導致後者覆蓋前者

最佳實踐：

- 已由 Worker 管理的安全標頭，不應再由 Transform Rules 設定
- 如需清理舊值，只能作為過渡措施，最終仍要收斂成單一來源

### 4.3 Rules > Snippets

目標：排除隱性 header 注入來源。

必查項：

- [ ] 是否有針對 `/ratewise/*` 的 header Snippet
- [ ] 是否有舊版 CSP、Permissions-Policy、Cache-Control 修補邏輯
- [ ] Snippet 內容是否已在 repo 有對應文件

### 4.4 Caching > Cache Rules

目標：讓 Cloudflare edge cache 與 app 責任邊界一致。

RateWise 預期：

- [ ] `/ratewise/` HTML 不做長時間 edge cache
- [ ] `/ratewise/sw.js` 不可快取
- [ ] `/ratewise/manifest.webmanifest` 僅短期快取
- [ ] `/ratewise/assets/*` 採長期快取
- [ ] `/ratewise/__network_probe__` 應避免快取與重導

判讀原則：

- `Transform Rules` 改 header 顯示
- `Cache Rules` 才是真的控制 Cloudflare 邊緣快取行為

### 4.5 SSL/TLS

必查項：

- [ ] `Encryption mode` 為 `Full (strict)`
- [ ] `Always Use HTTPS` 已開
- [ ] HSTS 設定與 repo 預期一致

### 4.6 Speed > Optimization

必查項：

- [ ] `Rocket Loader` 關閉
- [ ] `Auto Minify` 若開啟，已確認不會改壞 HTML / CSP / hydration

### 4.7 Security > WAF / Bots

必查項：

- [ ] 未誤攔 `/ratewise/api/*`
- [ ] 未對 SEO 與預覽用 bot 發送 challenge
- [ ] Rate limiting 不會誤傷公開匯率 JSON

---

## 5. 正式站驗證 TODO

### A. Header 收斂

- [ ] `Permissions-Policy` 移除 `ambient-light-sensor`
- [ ] `Permissions-Policy` 移除 `document-domain`
- [ ] `Permissions-Policy` 移除 `vr`
- [ ] `Content-Security-Policy-Report-Only` 收斂為單一回應
- [ ] `Cache-Control` 不再出現重複值

### B. Probe 路由

- [ ] `curl -I /ratewise/__network_probe__` 不再 301 到尾斜線
- [ ] probe 回應應為 `200` 或 `204`
- [ ] `Cache-Control: no-store`
- [ ] 本地 `localhost` / `127.0.0.1` 預覽已略過真實 probe

### C. PWA

- [ ] `sw.js` 為 `no-cache, no-store, must-revalidate`
- [ ] `manifest.webmanifest` 為短期快取
- [ ] 清除 site data 後重新註冊 Service Worker 正常

### D. Console

- [ ] security header warning = `0`
- [ ] `FetchEvent ... network error response` = `0`
- [ ] `__network_probe__ net::ERR_FAILED` = `0`

---

## 6. 標準操作工作流

### 6.1 修正前

1. 先記錄目前 `curl -I` 結果
2. 記錄 Cloudflare Dashboard 現有規則名稱與截圖
3. 確認 repo 預期值

### 6.2 修正中

1. 一次只改一個配置來源
2. 每改完一處就重新 `curl -I`
3. 若修改 Worker，確認 route 與 deploy 成功
4. 若修改 Cache Rules，必要時 purge CDN

### 6.3 修正後

1. 驗證首頁、`sw.js`、`manifest.webmanifest`、`__network_probe__`
2. 用無痕模式開站
3. `Unregister` 舊 Service Worker
4. 強制重整
5. 確認 console 乾淨
6. 回寫文件

---

## 7. 驗證命令

```bash
# 正式站 header
curl -sI https://app.haotool.org/ratewise/ | tr -d '\r'
curl -sI https://app.haotool.org/ratewise/sw.js | tr -d '\r'
curl -sI https://app.haotool.org/ratewise/manifest.webmanifest | tr -d '\r'
curl -sI https://app.haotool.org/ratewise/__network_probe__ | tr -d '\r'

# 只看關鍵 header
curl -sI https://app.haotool.org/ratewise/ | tr -d '\r' | grep -i "content-security-policy\\|permissions-policy\\|strict-transport-security\\|referrer-policy\\|cache-control\\|cf-cache-status"
```

本地驗證：

```bash
pnpm --filter @app/ratewise exec vitest run \
  src/config/__tests__/build-scripts.test.ts \
  src/utils/__tests__/networkStatus.test.ts \
  src/prerender.test.ts \
  src/pwa-offline.test.ts

pnpm --filter @app/ratewise build
pnpm --filter @app/ratewise preview --host 127.0.0.1 --port 4173
```

---

## 8. 驗收標準

全部完成後，正式站必須符合：

- [ ] 安全標頭只有單一有效來源
- [ ] 正式站 header 與 repo 預期一致
- [ ] probe 路由不重導、不噴錯
- [ ] PWA 相關資產快取可預期
- [ ] 瀏覽器 console 無安全標頭與 probe 噪音

---

## 9. 參考文件

- [docs/DEPLOYMENT.md](/Users/azlife.eth/Tools/app/docs/DEPLOYMENT.md)
- [docs/CLOUDFLARE_CONFIGURATION_GUIDE.md](/Users/azlife.eth/Tools/app/docs/CLOUDFLARE_CONFIGURATION_GUIDE.md)
- [docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md](/Users/azlife.eth/Tools/app/docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md)
- [security-headers/src/worker.js](/Users/azlife.eth/Tools/app/security-headers/src/worker.js)
- [apps/ratewise/public/\_headers](/Users/azlife.eth/Tools/app/apps/ratewise/public/_headers)
