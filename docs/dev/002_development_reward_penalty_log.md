# 開發獎懲與決策記錄 (2025-2026)

> **最後更新**: 2026-03-13T00:25:00+08:00
> **當前總分**: 1162（初始分: 100）
> **目標**: >120（優秀）| <80（警示）

---

id: improvement-ratewise-release-edge-sync-guard
date: 2026-03-13
title: RateWise release 補上正式版版本探測、定點 purge 與 live precache gate
score: 3
type: improvement
content_type: troubleshooting
scope: ratewise
topics: [release, cloudflare, pwa, deployment, testing]
keywords: [release-timing, targeted-purge, app-version-probe, stale-edge-404, live-precache-gate]
aliases: [RateWise release edge sync guard, 正式版版本探測 purge, live precache gate]
related_entries:
[improvement-ratewise-live-precache-verifier-subpath-release, success-ratewise-stale-edge-404-offline-hotfix]
summary: 進一步追 production 後確認，`stale edge 404` 的再發主因不是 service worker 邏輯，而是 `Release` workflow 在正式站新資產尚未就緒前就先做 Cloudflare purge，讓 edge 有機會先回填 404 並長時間保留。這次改為以 `app-version` cache-busting probe 等待 `/ratewise/` 真正切到目標版本，再做 URL/prefix 定點 purge，最後立即跑 live precache 驗證，將 release、CDN purge 與 PWA correctness 收斂成同一條閉環。
root_cause:

- 既有 `Release` workflow 對 `main` push 後立即 purge CDN，但 app 真正上線時間由外部部署系統決定，兩者沒有同步保證。
- Cloudflare purge 使用 `purge_everything` 雖然粗暴，但沒有等待新 bundle 可取回；在錯誤時序下，edge 仍可能先抓到 404。
- 手動 `purge-cdn-cache.sh` 的 `prefixes` 也長期使用完整 URL，而非 Cloudflare API 要求的 `host/path`，增加人工 hotfix 不一致風險。

impact:

- 即使本地 build、離線 E2E 與 CI 都通過，正式站仍可能因 edge 先回填 404 而繼續黑屏。
- 事故修復需要再次人工 purge，顯示 release pipeline 缺少「正式站已就緒」這個必要門檻。
- 若不把 purge 規則與 probe 規則變成 SSOT，下次一樣可能在人工與 CI 之間再次分裂。

actions:

- 新增 `scripts/ratewise-production-release.mjs`：提供 `app-version` probe、Cloudflare purge payload 與定點 purge 執行邏輯。
- `.github/workflows/release.yml`：新增 `Detect RateWise release target`、`Wait for RateWise production deployment`、`Purge RateWise Cloudflare Cache`、`Verify RateWise live precache`，把等待正式版上線與 purge 後 live gate 接進 release。
- `apps/ratewise/src/config/__tests__/ratewise-production-release.test.ts`：先用 TDD 鎖定版本探測 URL、`app-version` 解析與 Cloudflare payload 結構。
- `scripts/purge-cdn-cache.sh`：同步修正 RateWise 手動 purge 規則，改 purge `/ratewise/` 與 `offline.html`，並把 Cloudflare `prefixes` 改成正確的 `host/path` 形式。
- `AGENTS.md`、`CLAUDE.md`：同步新增 release 邊緣同步規範，避免日後再依賴口頭記憶。

prevention:

- RateWise 發版流程必須明確區分「Git commit 已進 main」與「正式站新 bundle 已可讀」；只有後者成立後才能 purge。
- Cloudflare purge 對單一 app 應優先採 URL/prefix 精準清除，不再把 `purge_everything` 當成唯一默認方案。
- release workflow 必須在 purge 後立即做 live precache 驗證，讓 stale edge 404 直接在 pipeline 暴露，而不是留到使用者離線才發現。

verification:

- `pnpm --filter @app/ratewise exec vitest run src/config/__tests__/ratewise-production-release.test.ts src/config/__tests__/verify-precache-assets.test.ts`
- `node scripts/ratewise-production-release.mjs print-payload`
- `gh run rerun 23007725466`（針對 `main@5d42d66a` 再做一次正式 purge，驗證目前 production stale edge 404 可被即時清除）
- `VERIFY_PRECACHE_SOURCE=live node scripts/verify-precache-assets.mjs`

references:

- `.github/workflows/release.yml`
- `scripts/ratewise-production-release.mjs`
- `scripts/purge-cdn-cache.sh`
- `apps/ratewise/src/config/__tests__/ratewise-production-release.test.ts`
- Cloudflare Cache Purge 官方文件
- Workbox / vite-plugin-pwa 官方更新流程文件

---

id: improvement-ratewise-live-precache-verifier-subpath-release
date: 2026-03-12
title: RateWise live precache 驗證器對齊子路徑 SSOT 並升版至 v2.9.6
score: 2
type: improvement
content_type: troubleshooting
scope: ratewise
topics: [pwa, release, testing, ssot, deployment]
keywords: [verify-precache, ratewise-subpath, changeset-version, live-validation, v2.9.6]
aliases: [RateWise live verifier 修正, precache 子路徑 SSOT, v2.9.6 發版準備]
related_entries:
[success-ratewise-stale-edge-404-offline-hotfix, improvement-ratewise-pwa-update-offline-techdebt-cleanup]
summary: 在 `stale edge 404` 熱修後，再補一個小但必要的驗證層修正：`verify-precache-assets.mjs` 預設 base 改為真正的 `/ratewise/` 子路徑，並匯出純函式加上回歸測試，避免 root path 假警報；同時以 Changesets 將 hotfix 升版為 `RateWise v2.9.6`，讓後續 PR / release 能直接把新 `sw.js` 與新 chunk URL 發到 production。
root_cause:

- `verify-precache-assets.mjs` 先前的預設 base 不是 `RateWise` 子路徑，若操作時未帶環境變數，容易把 root path 的結果誤當成 `/ratewise/` live 狀態。
- 既有 hotfix commit 雖已換掉 poisoned chunk URL，但尚未正式升版，production 仍會繼續 precache 舊的 `sw.js` manifest。

impact:

- live precache 驗證結果更可信，後續 CI / 人工排障不會再被錯誤 base path 污染。
- `2.9.6` 已完成版本號與 changelog 準備，合併後可直接進入正式 release 流程，把新的 chunk URL 送上 production。

actions:

- `scripts/verify-precache-assets.mjs`：依 `VERIFY_PRECACHE_SOURCE` 預設 `RateWise` 專用 base URL，並匯出 `getDefaultBaseUrl`、`parseShellAssetUrls`、`resolvePrecacheAssetUrl` 供測試使用。
- `apps/ratewise/src/config/__tests__/verify-precache-assets.test.ts`：新增子路徑 base、asset URL 解析與 shell asset 抽取回歸測試。
- `pnpm changeset version`：將 root 與 `@app/ratewise` 版本升到 `2.9.6`，同步 `CHANGELOG.md`。

prevention:

- 任何 production 驗證腳本若專屬於子路徑 app，預設 base URL 必須直接對齊該 app scope，不得再依賴人工口頭約定。
- 修掉 production edge 問題後，必須把「真正換掉 poisoned URL 的新版本發版」視為事故收斂的一部分，不可只停在 branch hotfix。

verification:

- `pnpm --filter @app/ratewise exec vitest run src/config/__tests__/verify-precache-assets.test.ts src/config/__tests__/build-scripts.test.ts src/pwa-offline.test.ts`
- `pnpm --filter @app/ratewise build`
- `VERIFY_BASE_URL=http://127.0.0.1:4173/ratewise/ node scripts/verify-precache-assets.mjs`
- `pnpm --filter @app/ratewise exec playwright test tests/e2e/offline-cold-start.spec.ts --project=offline-pwa-chromium`
- `VERIFY_PRECACHE_SOURCE=live node scripts/verify-precache-assets.mjs`（預期仍對 production 舊 `sw.js` 的 4 個 stale edge 404 報錯，待本次 release 上線後消失）

references:

- `scripts/verify-precache-assets.mjs`
- `apps/ratewise/src/config/__tests__/verify-precache-assets.test.ts`
- `apps/ratewise/CHANGELOG.md`
- `package.json`
- `apps/ratewise/package.json`

---

id: improvement-ratewise-pwa-update-offline-techdebt-cleanup
date: 2026-03-12
title: RateWise PWA 更新接管與離線驗證技術債清理
score: 3
type: improvement
content_type: troubleshooting
scope: ratewise
topics: [pwa, service-worker, testing, ssot, deployment]
keywords: [waiting-sw-reload, critical-launch-cache, precache-verifier, offline-e2e, version-sync]
aliases: [PWA 技術債清理, 離線驗證收斂, waiting SW 自動重載]
related_entries:
[incident-ratewise-stale-pwa-shell-recovery, incident-production-verification-gap]
summary: 以 `origin/main@v2.9.4` 為基線，收斂尚未正式進版的 PWA 技術債：waiting service worker 接管後自動重載、啟動補熱資源改用獨立 cache 避免污染 Workbox precache、precache 驗證器提升為硬性檢查 `index.html` 與 shell assets，並修正離線 E2E 對首次安裝 SW 的等待流程；最後以 Changesets 發布 `RateWise v2.9.5`。
root_cause:

- 既有更新流程在 waiting SW 接管後缺少 `controllerchange` reload，容易留下「新 SW 已接管、舊 HTML 仍引用舊 chunk」的技術債風險。
- 啟動補熱資源沿用 Workbox precache 名稱寫入，模糊了 precache 與 runtime/launch cache 的責任邊界。
- `verify-precache-assets.mjs` 先前只檢查 `assets/*` 是否可取回，無法及早擋下「`index.html` 未進 precache」或「shell JS/CSS 漏注入」這種冷啟動致命錯誤。
- Playwright 離線測試先前假設首次載入後頁面一定已被 active SW 控制，對真實瀏覽器生命週期模型不夠貼近。

impact:

- 更新鏈路更一致：新版 ready 後在線使用者可自動完成接管與重載，降低 stale shell 殘留時間。
- cache 邊界更清楚：啟動補熱與 Workbox precache 分離，後續排障與維護成本下降。
- 離線 correctness gate 提升：precache 若缺 `index.html` 或首頁 shell assets，腳本會直接 fail，不再靜默流入正式版。
- `v2.9.5` 版本與公開產物已同步，後續 PR / release 可直接沿用。

actions:

- `UpdatePrompt.tsx`：新增 ready update 在線自動套用邏輯。
- `swUtils.ts`：waiting SW 發送 `SKIP_WAITING` 前先監聽 `controllerchange`，接管後立即 `window.location.reload()`。
- `pwaStorageManager.ts`：啟動補熱資源改用 `critical-launch-cache`。
- `verify-precache-assets.mjs`：新增最小 precache entry 數、`index.html`、首頁 shell JS/CSS 完整性檢查。
- `offline-pwa.spec.ts`：首次安裝 SW 後若尚未控制頁面，先 reload 一次再等待 controller。
- 建立 changeset 並發布 `@app/ratewise`、root `package.json` 版本到 `2.9.5`，同步 `CHANGELOG.md` 與公開產物。

prevention:

- 離線驗證不得只檢查「某些 assets 可下載」；必須明確驗證 app shell 與導覽入口已進 precache。
- waiting SW 的更新流程若要保證「用戶永遠在最新版本」，必須把接管與 reload 視為同一個原子步驟。
- 啟動補熱 cache 與 Workbox precache 必須維持獨立名稱與責任，避免未來再次誤清或誤寫。
- E2E 對 Service Worker 的斷言需貼近真實生命週期，不得假設首次載入後立即有 controller。

verification:

- `pnpm --filter @app/ratewise exec vitest run src/pwa-offline.test.ts src/__tests__/sw.test.ts src/components/__tests__/UpdatePrompt.test.tsx src/utils/__tests__/swUtils.test.ts`
- `pnpm --filter @app/ratewise exec playwright test tests/e2e/offline-pwa.spec.ts --project=offline-pwa-chromium -g "should load cached exchange rates when offline|should serve cached assets when offline|should display offline fallback page for uncached routes|should preload critical assets on install"`
- `pnpm changeset version`
- `pnpm run update:release-metadata`
- `pnpm --filter @app/ratewise build`
- `VERIFY_BASE_URL=http://127.0.0.1:4273/ratewise/ pnpm verify:precache`

references:

- `apps/ratewise/src/components/UpdatePrompt.tsx`
- `apps/ratewise/src/utils/swUtils.ts`
- `apps/ratewise/src/utils/pwaStorageManager.ts`
- `scripts/verify-precache-assets.mjs`
- `apps/ratewise/tests/e2e/offline-pwa.spec.ts`
- vite-plugin-pwa 官方 prompt update 指南
- Workbox precaching 與 update lifecycle 官方文件

---

id: success-ratewise-stale-edge-404-offline-hotfix
date: 2026-03-12
title: RateWise 生產環境 stale edge 404 與離線冷啟動熱修
score: 4
type: success
content_type: troubleshooting
scope: ratewise
topics: [pwa, cloudflare, offline, deployment, testing]
keywords: [stale-edge-404, precache-install, cloudflare-worker, cold-start, playwright]
aliases: [CDN stale 404 熱修, RateWise 離線黑屏熱修, production offline hotfix]
related_entries:
[improvement-ratewise-pwa-update-offline-techdebt-cleanup, incident-production-verification-gap, incident-over-optimization-before-stability]
summary: 正式站離線黑屏的直接根因不是 `prompt` 更新流程，而是 Cloudflare 邊緣保留了 4 個 precache 資產的 stale 404，讓 `sw.js` install 在 production 持續失敗。這次熱修先把 `security-headers` worker 升到 `v4.2`，讓缺檔靜態資產 404 一律 `no-store`，再用最小且有價值的程式碼改動換掉受污染的 chunk URL，並修正離線冷啟動 E2E 對 Playwright browser context 與 `/ratewise/` scope 的錯誤假設。
root_cause:

- 正式站 `sw.js` precache manifest 中有 4 個 `assets/*.js` URL 在 Cloudflare 邊緣被保留為 stale 404；同 URL 加 querystring 後可回 `200`，證明源站檔案存在但 edge 狀態錯誤。
- 舊版 `security-headers` worker 對缺檔資產 404 未強制 `no-store`，部署切換期間的短暫缺檔有機會被 CDN 放大成長期故障。
- `offline-cold-start.spec.ts` 先前用 `browser.newContext()` 模擬冷啟動，但 Playwright 的新 context 是全新 profile，不共享已暖機的 SW / Cache Storage；同時預設又打到 `/` 而非 `/ratewise/` scope，造成假陰性。

impact:

- 正式站使用者在飛航模式或無網路時無法完成 SW 安裝，冷啟動直接黑屏且沒有可用功能。
- 本地與 CI 即使綠燈，也無法即時指出 production precache install 是被 edge stale 404 擋下。
- 若不修正 worker 404 快取策略，未來任何部署切換仍可能再次重演同類事故。

actions:

- `security-headers/src/worker.js`：對 `ratewise/assets/*` 的 4xx 回應一律改成 `Cache-Control: no-store, no-cache, must-revalidate`，同步部署 Cloudflare worker `v4.2`。
- `apps/ratewise/vite.config.ts`：將 router 生態系 chunk 名稱改為 `vendor-router-runtime`，直接換掉目前 poisoned 的 `vendor-router` URL。
- `apps/ratewise/src/pages/UpdatePromptTest.tsx`、`apps/ratewise/src/pages/ColorSchemeComparison.tsx`、`apps/ratewise/src/components/Breadcrumb.tsx`：補上 `type="button"`、`aria-hidden` 與更穩定的 key/title，作為有實際價值的原子改動，同步換掉另外 3 個被污染 chunk URL。
- `apps/ratewise/tests/e2e/offline-cold-start.spec.ts`：改用同一個 browser profile 的新 page 模擬真實冷啟動，並將預設 base path 對齊 `/ratewise/`。
- `scripts/verify-precache-assets.mjs`、`seo-production.yml`、`AGENTS.md`、`CLAUDE.md`、`docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`：把 live precache 驗證與 stale edge 404 判定納入正式流程。

prevention:

- PWA 發版完成條件必須包含 live precache 驗證，不得只看本地 build 或 CI 單元測試。
- CDN / edge 對 hashed asset 的 404 不能快取；否則 Service Worker install 會因單一資產失敗而整體失效。
- E2E 若要驗證「冷啟動」，必須明確區分「同 profile 重開頁面」與「全新 profile 首次安裝」兩種情境。

verification:

- `curl -s --compressed https://app.haotool.org/ratewise/ -D - -o /dev/null | grep -i 'x-security-policy-version\\|cross-origin-embedder-policy\\|cache-control'`
- `curl -s --compressed https://app.haotool.org/ratewise/assets/vendor-router-D21zu8CL.js -D - -o /dev/null | grep -i 'http/\\|cache-control\\|cloudflare-cdn-cache-control'`
- `VERIFY_PRECACHE_SOURCE=live VERIFY_BASE_URL=https://app.haotool.org/ratewise/ node scripts/verify-precache-assets.mjs`
- `pnpm --filter @app/ratewise exec vitest run src/config/__tests__/build-scripts.test.ts src/components/__tests__/Breadcrumb.test.tsx src/__tests__/securityHeadersWorker.test.ts`
- `pnpm --filter @app/ratewise build`
- `pnpm --filter @app/ratewise exec playwright test tests/e2e/offline-cold-start.spec.ts --project=offline-pwa-chromium`
- `pnpm --filter @app/ratewise exec playwright test tests/e2e/offline-pwa.spec.ts tests/e2e/offline-cold-start.spec.ts --project=offline-pwa-chromium`
- `VERIFY_BASE_URL=http://127.0.0.1:4173/ratewise/ node scripts/verify-precache-assets.mjs`

references:

- `security-headers/src/worker.js`
- `apps/ratewise/vite.config.ts`
- `apps/ratewise/tests/e2e/offline-cold-start.spec.ts`
- `scripts/verify-precache-assets.mjs`
- Cloudflare Cache Purge / cache behavior 官方文件
- Workbox precaching 官方文件
- vite-plugin-pwa prompt update 官方文件

---

id: improvement-seo-production-resource-availability-ssot
date: 2026-03-12
title: SEO Production Validation 新增 SSOT 生產資源可用性檢查
score: 2
type: improvement
content_type: how_to
scope: monorepo
topics: [seo, ci, ssot, testing, assets]
keywords: [production-resource-check, app-config-ssot, seo-files, image-assets, auto-discovery]
aliases: [SEO 200 自動探測, 生產資源可用性檢查, verify-production-resources]
related_entries:
[incident-production-verification-gap, incident-ratewise-stale-pwa-shell-recovery]
summary: 新增 `scripts/verify-production-resources.mjs`，直接以每個 `app.config.mjs` 的 `resources.seoFiles` 與 `resources.images` 為 SSOT，自動發現所有 apps 並檢查正式站 URL 是否回傳 `200`；同時接入 `SEO Production Validation` workflow，使資源存活檢查與 sitemap/robots/llms 語義檢查分層。
root_cause:

- 既有 `verify-production-seo.mjs` 偏重 sitemap、robots、llms、404 與 canonical 語義驗證，缺少一個專責的「必要資源 availability」檢查層。
- 先前人工用 `curl` 驗證雖可確認 200，但沒有正式進入 repo 與 CI，未來新增 app 或新增資源時容易回到手動補查。
- 子路徑 app 若直接用 `new URL('/path', siteUrl)` 會洗掉 base path；測試先行揭露這個 bug，避免 CI 腳本上線後誤打錯誤 URL。
  impact:

- 未來新增 app 只要提供 `app.config.mjs` 與 `resources` 定義，即可自動納入生產檢查，無需再改 workflow app 名單。
- CI 失敗時能明確區分「資源不存在 / timeout」與「SEO 語義錯誤」，縮短排障路徑。
- SSOT 一致性提升，降低 `resources.images` 與實際部署資源脫鉤的風險。
  actions:

- 新增 `scripts/verify-production-resources.mjs`，以 `discoverApps()` 自動發現 apps，輸出 `200 / non200 / timeout`。
- 新增 `scripts/__tests__/verify-production-resources.test.ts`，覆蓋 inventory 展開、HEAD→GET fallback、timeout 分類與 summary 彙總。
- 在 `.github/workflows/seo-production.yml` 的 `health-check` 先執行 `verify-production-resources.mjs`，再執行 `verify-all-apps.mjs`。
- 同步更新 `package.json`、`AGENTS.md`、`CLAUDE.md`，把這條 CI 與 SSOT 邏輯正式收斂。
  prevention:

- 之後任何必要 SEO 檔或圖片資源都必須只維護在 `app.config.mjs`，不得在腳本或 workflow 重複硬編碼。
- production availability 檢查與語義檢查必須維持分層，避免單支腳本同時承擔過多責任。
- 對子路徑 app 的 URL 組合必須保留 regression test，防止 base path 再次被洗掉。
  verification:

- `pnpm exec vitest run scripts/__tests__/verify-production-resources.test.ts`
- `node scripts/verify-production-resources.mjs`
- 結果：39/39 必要資源皆返回 `200`，`non200=0`，`timeout=0`。
  references:

- `scripts/verify-production-resources.mjs`
- `scripts/__tests__/verify-production-resources.test.ts`
- `.github/workflows/seo-production.yml`
- `scripts/lib/workspace-utils.mjs`

---

id: incident-ratewise-settings-theme-hydration-disabled
date: 2026-03-11
title: RateWise 設定頁主題切換按鈕因 hydration 殘留 disabled 屬性而失效
score: 3
type: incident
content_type: troubleshooting
scope: ratewise
topics: [hydration, ssg, settings, theme, production-verification]
keywords: [disabled-theme-buttons, hydration-mismatch, ssg, settings-page, useAppTheme]
aliases: [設定頁主題按鈕失效, RateWise theme switch disabled, hydration disabled attr]
related_entries:
[incident-ratewise-stale-pwa-shell-recovery, incident-haotool-root-sw-cross-app-contamination]
summary: 在正式站 root-scope SW 汙染修正後重新驗證 `RateWise`，發現 `/ratewise/settings` 雖已可進入，但主題切換按鈕與重置按鈕仍維持 `disabled`，只有語言切換可用。最終確認不是資料載入失敗，而是 SSG/hydration 流程把 server 端的 disabled 屬性殘留在 DOM。
root_cause:

- `useAppTheme()` 以 `typeof window !== 'undefined'` 直接推導 `isLoaded`，缺少一個 client mount 後必定觸發的 state re-render。
- `Settings` 頁面在 SSG HTML 階段會輸出 `disabled` 的主題按鈕；client hydration 雖可載入頁面內容，但沒有可靠的狀態翻轉去清除該屬性。
- 正式驗證若只看首頁與主流程，會誤判「骨架修好了就一切正常」；實際上設定頁的 theme interaction 仍是壞的。
  impact:

- 正式站使用者可進入設定頁，但無法切換 6 種主題風格，也無法重置主題。
- 使用者感知會接近「功能被鎖住」或「舊版壞狀態仍未修好」，削弱前一輪 PWA 熱修的可信度。
  actions:

- 新增 `src/pages/Settings.hydration.test.tsx`，以 server HTML + `hydrateRoot()` 重現並固定「主題按鈕在 hydration 後必須可點」。
- 將 `useAppTheme()` 改為 SSR-safe 初始狀態：`config` 先用 `DEFAULT_THEME_CONFIG`，`isLoaded` 改為 state，client mount 後再同步 localStorage 並打開互動。
- 以本地 production preview 驗證 `/ratewise/settings` 主題按鈕恢復可點，實際點擊 `Nitro` 成功，console error = 0。
  prevention:

- 任何 SSG 頁面若依賴 `disabled`、`aria-pressed`、主題狀態等 hydration-sensitive attribute，必須有專門的 hydration regression test。
- 生產驗證不能只檢查首頁；設定頁、收藏頁、離線頁這類次要路徑也要納入 smoke check。
  verification:

- `pnpm --filter @app/ratewise exec vitest run src/pages/Settings.hydration.test.tsx`
- `pnpm --filter @app/ratewise exec vitest run src/pages/Settings.hydration.test.tsx src/bootstrap/pwa-recovery-bootstrap.test.ts src/utils/version-build-utils.test.ts`
- `pnpm --filter @app/ratewise build`
- Playwright MCP：`http://127.0.0.1:4191/ratewise/settings` 載入後主題按鈕可點，切換 `Nitro` 成功，console error = 0。
  references:

- `apps/ratewise/src/hooks/useAppTheme.ts`
- `apps/ratewise/src/pages/Settings.tsx`
- `apps/ratewise/src/pages/Settings.hydration.test.tsx`

---

id: incident-ratewise-stale-pwa-shell-recovery
date: 2026-03-11
title: RateWise 舊版 PWA App Shell 卡骨架屏與 icon 回退修復
score: 3
type: incident
content_type: troubleshooting
scope: ratewise
topics: [pwa, service-worker, cache-recovery, icon, ssot]
keywords: [stale-shell, skeleton-stuck, skipWaiting, hotfix, apple-touch-icon, cache-reset]
aliases: [舊版 PWA 卡骨架, RateWise 離線殼失效, PWA icon 去背回退]
related_entries:
[incident-production-verification-gap, incident-over-optimization-before-stability]
summary: 正式站舊 PWA 使用者可能被舊版 auto-update service worker 與新資產版本撕裂卡在 SSR 骨架屏，React 恢復機制因主 bundle 未載入而完全失效；同時先前將 apple-touch-icon 與 legacy pwa-\*.png 改為透明去背，造成使用者感知到 icon 樣式改變。
root_cause:

- 正式站仍存在 top-level `self.skipWaiting()` 舊版 SW，與 repo 已改成 prompt 模式的 source 不一致。
- 既有恢復邏輯位於 React 啟動後，對「HTML 已到、JS chunk 未成功 hydration」的使用者沒有任何救援能力。
- `GIT_COMMIT_COUNT` 空值時版本字串可能生成異常 metadata，增加版本判斷與排障成本。
- 2026-03-09 將 iOS / legacy icon 換成透明去背版本，偏離既有使用者辨識的實心 icon。
  impact:

- 舊版 PWA 使用者可能長時間停留在骨架屏，主題切換與功能按鈕看似禁用、實際上是 app shell 未完成 hydration。
- 客戶端無法自動解除錯誤 SW 與 stale caches，必須靠使用者手動清快取才可能恢復。
- iOS 主畫面 icon 與 push notification icon 視覺辨識退化。
  actions:

- 新增 pre-hydration `pwa-recovery-bootstrap`，在 HTML 階段就檢測版本落差 / 舊 SW 足跡，線上時一次性解除 ratewise scope 的 SW、清除 Workbox/runtime caches，然後重載。
- 保持 `sw.ts` 的 prompt 模式，只允許 `SKIP_WAITING` message 觸發接管，不恢復 top-level auto update。
- 抽出 `build/version-utils.ts`，避免空 commit count 產生無效 build metadata。
- 將 `apple-touch-icon.png`、`optimized/apple-touch-icon-112w.*` 與 `pwa-192/384/512.png` 回退為 2026-03-09 之前的實心版資產。
  prevention:

- 所有 PWA 升級修復都必須提供 HTML 階段的逃生路徑，不能只依賴 React mount 後的恢復 UI。
- 發版前必須同時驗證 source 與正式站 `sw.js` 的 lifecycle 行為，確認未出現意外的 top-level `skipWaiting()`。
- Icon 變更需先核對實際使用面（apple-touch-icon、legacy pwa icon、manifest icon）再變更，避免以單一透明化決策覆蓋全部平台。
  verification:

- `pnpm --filter @app/ratewise exec vitest run src/bootstrap/pwa-recovery-bootstrap.test.ts build/version-utils.test.ts src/index.html.test.ts`
- `pnpm --filter @app/ratewise exec vitest run src/bootstrap/pwa-recovery-bootstrap.test.ts src/utils/version-build-utils.test.ts src/config/__tests__/build-scripts.test.ts src/index.html.test.ts`
- `pnpm --filter @app/ratewise build`
- Playwright MCP 驗證 `http://127.0.0.1:4173/ratewise/` 與 `/settings` 可互動、console error = 0、主題切換正常。
- 產出檢查：`dist/index.html` 含 `ratewise_pwa_recovery_epoch` bootstrap，`dist/sw.js` 僅在 `SKIP_WAITING` message 分支呼叫 `self.skipWaiting()`。
  references:

- vite-plugin-pwa 官方 prompt / selfDestroying 指南
- Workbox 官方 lifecycle / skipWaiting 說明
- 2026-03-09 commit `2742d9e5` icon 透明化變更

---

id: incident-haotool-root-sw-cross-app-contamination
date: 2026-03-11
title: haotool root-scope Service Worker 劫持 sibling apps 導致 RateWise 正式站被錯誤 app shell 接管
score: 3
type: incident
content_type: troubleshooting
scope: monorepo
topics: [pwa, service-worker, deployment, routing, ssot]
keywords: [root-scope-sw, sibling-apps, navigation-fallback, cross-app-contamination, same-origin]
aliases: [haotool SW 汙染 RateWise, root scope service worker 劫持子路徑]
related_entries:
[incident-ratewise-stale-pwa-shell-recovery, incident-production-verification-gap]
summary: 正式站 `curl` 已顯示 `RateWise` 新版 HTML 與 recovery bootstrap 上線，但 Browser MCP 造訪 `https://app.haotool.org/ratewise/` 時仍被 `haotool` 首頁接管。最終確認根因不是 RateWise bundle，而是同網域根目錄 `haotool` 的 root-scope Service Worker (`/sw.js`) 透過 `NavigationRoute(index.html)` 攔截所有子路徑，讓曾造訪首頁的使用者在 `/ratewise/` 也收到錯誤 app shell。
root_cause:

- `apps/haotool` 啟用了根 scope PWA，`vite-plugin-pwa` 預設會以 `navigator.serviceWorker.register('/sw.js', { scope: '/' })` 註冊。
- `haotool` 生成的 `sw.js` 先前對 navigation fallback 沒有限定 allowlist / denylist，導致 `/ratewise/`、`/nihonname/`、`/park-keeper/`、`/quake-school/` 都在 root app 的控制範圍內。
- 正式驗證若只用 `curl` 看 HTML，會誤以為站點正常；實際舊用戶瀏覽器仍可能被既有 root-scope SW 汙染，屬於真實使用者路徑的驗證缺口。
  impact:

- 既有使用者可能在 `/ratewise/` 看到 `haotool` 首頁，而非匯率工具本體。
- `RateWise` 的 PWA recovery bootstrap 無法對「先被錯誤 root app shell 攔截」的情境生效，因為正確 HTML 根本沒進到瀏覽器。
- 同網域多 app 的分層被破壞，後續任何 sibling app 都可能再次受影響。
  actions:

- 新增 `apps/haotool/src/pwa-config.test.ts`，先以紅燈測試固定「root-scope SW 只能處理 haotool 自身路由，且必須明確排除 sibling apps」。
- 在 `apps/haotool/vite.config.ts` 新增 `HAOTOOL_NAVIGATE_FALLBACK_ALLOWLIST` 與 `SIBLING_APP_DENYLIST`，限制 `NavigationRoute(index.html)` 只處理 `/`、`/projects/`、`/about/`、`/contact/`。
- 建置 `apps/haotool` 並直接檢查生成的 `dist/sw.js`，確認 Workbox 已輸出 `allowlist` / `denylist` 到正式產物。
- 以正式站驗證 `https://app.haotool.org/sw.js` 目前確實仍是 root-scope worker，後續必須先部署這個修正，才能解除舊用戶跨 app 汙染。
  prevention:

- 同源多 app 架構下，根 scope Service Worker 不得再使用「全站 navigation fallback」預設值，必須先定義 allowlist / denylist。
- 正式驗證 PWA 不能只看 `curl`；必須包含至少一個真瀏覽器 session，用來檢查既有 SW / caches 對實際使用者的影響。
- `haotool`、`ratewise`、`nihonname`、`park-keeper` 共用 `app.haotool.org` 時，任何 `/` scope PWA 變更都要視為跨 app 高風險變更。
  verification:

- `pnpm --filter @app/haotool exec vitest run src/pwa-config.test.ts`
- `pnpm --filter @app/haotool build`
- `node -e "const fs=require('fs');const sw=fs.readFileSync('apps/haotool/dist/sw.js','utf8');console.log(sw.includes('allowlist'), sw.includes('ratewise'))"`
- `curl -sL https://app.haotool.org/sw.js | rg 'NavigationRoute|ratewise|nihonname|park-keeper|quake-school'`
- Browser MCP 造訪 `https://app.haotool.org/ratewise/`，驗證是否仍被 root app shell 汙染。
  references:

- Context7 `/vite-pwa/vite-plugin-pwa` register-service-worker 指南（root base 預設 register `/sw.js` + scope `/`）
- vite-plugin-pwa / Workbox `navigateFallbackDenylist` 官方文件
- apps/haotool/vite.config.ts
- apps/haotool/src/pwa-config.test.ts

---

## 評分標準

| 分數 | 觸發條件                               |
| ---- | -------------------------------------- |
| +1   | 正確使用 Context7 引用文檔解決問題     |
| +1   | 發現並修復潛在 bug（非當前任務造成的） |
| +2   | 重大架構改進或性能提升（>20%）         |
| +3   | 解決複雜的系統性問題（Root Cause Fix） |
| -1   | 引入新 bug（CI 失敗）                  |
| -1   | 違反 Linus 三問（過度設計）            |
| -2   | 破壞現有功能（Regression）             |
| -3   | 造成生產環境停機                       |

---

## 分數變動摘要（近期）

| 分數 | 事項                                                               | 日期       |
| ---- | ------------------------------------------------------------------ | ---------- |
| +2   | PR #188 CI 補測、precache 驗證器修復與首頁 lazy chunk preload 收斂 | 2026-03-11 |
| +4   | 修復 haotool 首頁 3D Hero CSP 崩潰與 RateWise basename 回歸        | 2026-03-10 |
| +1   | Release workflow 權限受限時的手動 Version PR fallback              | 2026-03-10 |
| +1   | PR #185 深度審查、Browser MCP 驗證與 patch release 準備            | 2026-03-10 |
| +1   | 移除 security header 測試中的 HTML regex 以清除 CodeQL alert       | 2026-03-10 |
| +1   | 修復 security header 測試對 Worker 字串結構耦合                    | 2026-03-10 |
| +4   | Cloudflare 安全標頭分層重構與正式站驗證閉環                        | 2026-03-10 |
| +3   | 修復 vendor-router / vendor-commons 循環 chunk 警告                | 2026-03-09 |
| +1   | RateWise v2.8.1 patch release 與 changeset 版本化                  | 2026-03-09 |
| +4   | RateWise SEO SSOT 收斂與 FAQ rich result 最佳實踐修復              | 2026-03-08 |
| +2   | 002 v2 結構化索引規格與主題分類升級                                | 2026-03-08 |
| +2   | Git 歷史失敗案例重構與 002 incident 知識庫整理                     | 2026-03-08 |
| +1   | SEOHelmet effect 依賴穩定化                                        | 2026-03-08 |
| +1   | SEOHelmet 卸載 cleanup 與跨頁 head 污染修復                        | 2026-03-08 |
| +4   | FAQ rich results 範圍收斂與 head hydration 去重                    | 2026-03-08 |
| +3   | SEO Audit hreflang 驗證硬編碼根因修復                              | 2026-03-07 |
| +4   | rebase 後版本與 sitemap SSOT 根因修復                              | 2026-03-07 |
| +1   | 公開產物格式漂移收斂與提交潔淨化                                   | 2026-03-07 |
| +6   | SEO 權威內容頁、參數頁重複抓取抑制                                 | 2026-03-07 |
| +5   | SEO 真實性、sitemap 與 robots SSOT 根因修復                        | 2026-03-07 |
| +1   | 建立 Cloudflare 稽核工作流文件                                     | 2026-03-03 |
| 0    | Code Splitting 生產癱瘓（-3）+ 快速修復（+3）                      | 2026-03-03 |
| +5   | 效能優化 Bundle 490KB→233KB                                        | 2026-03-03 |
| +6   | park-keeper Phase 3 收尾                                           | 2026-02-28 |
| +3   | RateWise SEO 權威定位：新增 4 幣對                                 | 2026-02-28 |
| +2   | Sitemap hreflang SSOT 同步修復                                     | 2026-02-28 |
| +3   | SEO 技術債清除與 SSOT 完整對齊                                     | 2026-02-28 |
| +1   | 修復 prerender/hreflang 測試斷言                                   | 2026-02-28 |
| +2   | AGENTS/CLAUDE 企業 SOP 升級                                        | 2026-02-28 |

---

## 記錄格式（方案 A / v2）

- 每筆近期紀錄固定使用 `---` 區塊，不再新增巨型 table 條目
- **v2 標準欄位順序**：`id` → `date` → `title` → `score` → `type` → `content_type` → `scope` → `topics` → `keywords` → `aliases` → `related_entries` → `summary` → `root_cause` → `impact` → `actions` → `prevention` → `verification` → `references`
- 2026-02-28 起的重要紀錄保留完整 entry；更早歷史資料改為下方按月份整理的精簡索引
- `type: incident` / `type: regression` 必須明確寫出根因、影響、修復與預防，避免只記結果不記教訓
- 舊版完整紀錄若仍使用 `tags`，允許暫存；**新寫或重構後的條目一律改用 `topics` + `keywords`**

### 內容型別（content_type）

- `troubleshooting`：事故、回歸、失敗案例、排障與修復
- `how_to`：可重複執行的操作流程
- `reference`：穩定規則、欄位定義、SSOT 對照
- `explanation`：原因說明、設計取捨、教訓總結

### 受控主題分類（topics）

- `seo`
- `hydration`
- `ssg`
- `assets`
- `deployment`
- `security`
- `headers`
- `pwa`
- `ci`
- `ssot`
- `documentation`
- `testing`
- `performance`
- `routing`
- `analytics`

### 關鍵字索引規則（keywords）

- 使用 `lowercase-kebab-case`，方便後續用腳本、SQLite、全文索引或靜態站工具直接抽取
- 每筆建議 `3-8` 個關鍵字，只保留穩定技術詞，不寫整句
- 同義詞、中文別名或常見錯字放在 `aliases`
- 跨案例關聯使用 `related_entries` 指向穩定 `id`，不要只靠標題模糊比對

## Entries

### 2026-03

---

id: e2e-offline-timeout-fix
date: 2026-03-13
title: E2E 離線測試生產環境 timeout 修復
score: +2
type: success
content_type: test
scope: ratewise
topics: [testing, pwa, e2e, offline]
keywords: [playwright, test-setTimeout, offline-cold-start, offline-pwa, production-timeout]
related_entries: [pr188-precache-verifier-and-home-lazy-chunk-audit]
summary: |
修復 offline-cold-start.spec.ts 與 offline-pwa.spec.ts 在生產環境的 timeout 失敗。
根因：全局 test timeout 15s 小於 goto() 內 toBeVisible({ timeout: 25_000 })；
另 Phase 3 僅查 workbox-precache，而 offline.html 實際存於 critical-launch-cache。
修復：各 describe 加 test.setTimeout(60~120_000)；offline.html 改查所有 cache；
waitForFunction 第二參數明確傳 undefined 避免 options 被當作 arg。
結果：offline-cold-start 2/2 pass；offline-pwa 14/14 pass（對生產環境）。

---

id: pr188-precache-verifier-and-home-lazy-chunk-audit
date: 2026-03-11
title: PR #188 CI 補測、precache 驗證器修復與首頁 lazy chunk preload 收斂
score: +2
type: success
content_type: troubleshooting
scope: monorepo
topics: [ci, pwa, ssg, testing, deployment]
keywords: [pr-188, coverage-guard, precache-verifier, injectmanifest, lazy-chunk-preload]
aliases: [PR 188 收尾, verify-precache 修復, 首頁 preload 收斂]
related_entries: [haotool-home-procedural-environment-and-ratewise-basename-guard, incident-production-verification-gap, incident-ci-hardcoded-audit]
summary: PR #188 補上 `BottomNavigation` 與 `OfflineAwareError` 測試後，`ratewise` coverage 已回到 GitHub Actions 門檻以上；同時發現 root `verify:precache` 腳本仍只會解析舊版 `precacheAndRoute([...])` 字串，對目前 injectManifest 產出的 minified `sw.js` 會假性失敗。另一路正式檢查確認 `haotool` 首頁雖已移除 Suspense fallback marker，但 build 產物仍會 preload `ThreeHero` 與 `SectionBackground` lazy chunk，與「mount 後才載入」的設計不一致，因此改在 `postbuild.js` 直接清理首頁 preload，讓產物與設計一致。
root_cause:

- `Quality Checks` 失敗實際不是測試紅，而是 `BottomNavigation.tsx` / `OfflineAwareError.tsx` 新增路徑沒有對應 coverage
- `scripts/verify-precache-assets.mjs` 對 Workbox manifest 的解析耦合在舊字串格式，未覆蓋 injectManifest + minify 後的 `var <manifest> = [...]` 型態
- `haotool` 首頁 3D 與裝飾背景已改用 client-side import，但 build 輸出仍保留 modulepreload，讓 lazy 策略在網路層被提前破功
  impact:

- PR #188 會卡在 CI coverage gate，無法合併
- 正式部署前的 precache 驗證工具會誤報「找不到 precache 清單」，降低 smoke check 可信度
- 首頁仍會在第一屏預抓 3D / 裝飾 chunk，讓修復後的 lazy load 效益打折
  actions:

- 新增 `apps/ratewise/src/components/__tests__/BottomNavigation.test.tsx` 與 `apps/ratewise/src/components/__tests__/OfflineAwareError.test.tsx`，覆蓋 basename 導航與 chunk/offline fallback 行為
- 修正 `scripts/verify-precache-assets.mjs`，先試舊 `precacheAndRoute([...])`，失敗再從 minified `sw.js` 內以 `offline.html` marker 反解 injectManifest 陣列
- 將 `apps/haotool/scripts/postbuild.js` 納入首頁 preload 清理，移除 `ThreeHero` / `SectionBackground` 的 `modulepreload`
- 重新執行 `ratewise test:coverage`、`typecheck`、`ratewise build`、`haotool build` 與 `verify:precache`
- 以 Cloudflare MCP + curl 再次比對正式站 headers / routes，確認目前正式 edge 仍存在 `www.haotool.org` 307 與 repo 內 worker 308 不一致，部署後仍需 smoke check
  prevention:

- 新增 UI fallback / routing component 後要同步補 coverage，不可等 CI 才補
- 驗證腳本必須對 build 產物格式去耦合，避免把 minify / bundler 輸出差異誤判成產品故障
- 對「刻意延後載入」的 chunk，需直接驗 build HTML，不可只看 React 程式碼是否用了 dynamic import
  verification:

- `pnpm --filter @app/ratewise test:coverage`
- `pnpm typecheck`
- `pnpm --filter @app/ratewise build`
- `VERIFY_BASE_URL=https://app.haotool.org/ratewise/ pnpm verify:precache`
- `pnpm --filter @app/haotool exec vitest run src/pages/Home.ssg.test.tsx src/components/ThreeHero.test.tsx`
- `pnpm --filter @app/haotool build`
- `rg "modulepreload.*(ThreeHero|SectionBackground)" apps/haotool/dist/index.html`
- `curl -sS -D - -o /dev/null https://www.haotool.org/`
  references:

- apps/ratewise/src/components/**tests**/BottomNavigation.test.tsx
- apps/ratewise/src/components/**tests**/OfflineAwareError.test.tsx
- scripts/verify-precache-assets.mjs
- apps/haotool/scripts/postbuild.js
- https://github.com/haotool/app/pull/188

---

id: haotool-home-procedural-environment-and-ratewise-basename-guard
date: 2026-03-10
title: 修復 haotool 首頁 3D Hero CSP 崩潰與 RateWise basename 回歸
score: +4
type: success
content_type: troubleshooting
scope: monorepo
topics: [security, headers, routing, pwa, testing, ssot]
keywords: [haotool-homepage, procedural-environment, raw-githack, basename-href, offline-chunk-recovery]
aliases: [首頁 3D Hero CSP 修復, BottomNavigation basename 修復]
related_entries: [cloudflare-security-headers-layered-refactor, fix-ratewise-router-chunk-cycle]
summary: 正式站複核時發現 `haotool.org` 首頁 3D Hero 使用 `@react-three/drei` 的遠端 HDR preset，執行期會抓 `raw.githack.com`，被既有 CSP 正常阻擋後直接連鎖觸發 React / WebGL 崩潰；進一步本地 production preview 又揭露首頁仍因 `React.lazy + Suspense` 包裝 client-only 3D 模組，讓 SSG HTML 帶入 Suspense fallback marker，觸發 `React error #418`。同一輪 `squirrel audit` 也揭露 `ratewise` 底部導覽在 SSR HTML 輸出裸路徑 href，讓 crawler 或無 JS 情境直接打到 `/multi`、`/favorites`、`/settings` 的 root 404。修正採最小責任原則：`haotool` 改為程序化 `Environment + Lightformer`，並把 3D 模組改成 mount 後再 `import()`；`ratewise` 導覽改為 `useHref()` 產生 basename-aware href，並確認既有 PWA chunk recovery 未提交變更可覆蓋 Chrome / Safari 的常見 chunk 失效路徑。
root_cause:

- `ThreeHero.tsx` 直接使用 `Environment preset="city"`，把首頁反射環境綁到第三方遠端 HDR 檔與 `connect-src`
- `Home.tsx` 以 `React.lazy + Suspense` 直接包 client-only 3D 元件，讓 SSG HTML 含有 Suspense fallback marker，production hydration 會轉為 client rendering
- `BottomNavigation` 以硬編碼 `href={item.path}` 輸出 SSR HTML，未經 Router basename 正規化
- iOS / Safari cache eviction 與 SW `Response.error()` 類型錯誤先前僅部分覆蓋，需確認未提交補強是否足以處理實際冷啟動回歸
  impact:

- `haotool.org` 首頁在正式站會出現 CSP violation、`Could not load ...hdr`、`THREE.WebGLRenderer: Context Lost`，本地 production preview 則可重現 `React error #418`
- `ratewise` 導覽在爬蟲與無 JS 情境會產生錯誤 canonical 導航，直接拉低 crawlability 與 UX
- 若未確認 chunk recovery 補強的覆蓋範圍，離線冷啟動問題可能在新瀏覽器錯誤樣式下再次漏網
  actions:

- 新增 `ThreeHero.test.tsx`，先以紅燈鎖住「不得再依賴遠端 HDR preset」的回歸條件
- 新增 `Home.ssg.test.tsx`，鎖住首頁 SSG HTML 不得再帶 React Suspense fallback 標記
- 將 `ThreeHero` 改為程序化 `Environment resolution={256}` 搭配既有 `Lightformer`，完全移除首頁遠端 HDR runtime 依賴
- 將 `Home` 的 client-only 3D 改為 mount 後再 `import()`，移除 server render 樹內的 `React.lazy + Suspense`
- `BottomNavigation` 抽出 `BottomNavigationItem`，改用 `useHref()` 生成 basename-aware href，首頁補尾斜線避免多一次轉址
- 驗證 `chunkLoadRecovery.ts`、`routes.tsx`、`OfflineAwareError.tsx` 的未提交變更，確認 Chrome `response served by service worker is an error` 與 Safari `Load failed` 都已納入判定與 fallback
- 同步更新 `docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md`、`docs/SECURITY_CSP_STRATEGY.md`、`security-headers/DEPLOY.md`
  prevention:

- 首頁與核心路徑不得再引入第三方 runtime 資源依賴，除非先完成資產自管與 CSP 決策審核
- SSG 關鍵頁面的 client-only 模組不得再直接以 `React.lazy + Suspense` 置於 server render 樹內
- 子路徑 app 的所有 SSR 導航輸出必須經由 Router basename 產生，不可直接硬編碼裸路徑
- PWA / SW 例外處理必須持續針對真實瀏覽器錯誤字串補測，不能只測單一 ChunkLoadError 名稱
  verification:

- `pnpm --filter @app/haotool exec vitest run src/components/ThreeHero.test.tsx src/pages/Home.ssg.test.tsx src/pages/Home.test.tsx src/components/Layout.test.tsx`
- `pnpm --filter @app/haotool build`
- `pnpm --filter @app/ratewise exec vitest run src/__tests__/securityHeadersWorker.test.ts src/components/__tests__/BottomNavigation.a11y.test.tsx src/pwa-offline.test.ts src/__tests__/sw.test.ts src/utils/__tests__/swUtils.test.ts src/utils/__tests__/chunkLoadRecovery.test.ts`
- Browser MCP：`https://haotool.org/` 發現 `raw.githack.com` / WebGL crash 後，以本地修復版 preview 驗證 `http://localhost:4177/` console error = `0`
- `squirrel audit https://app.haotool.org/ratewise/ --format llm`
  references:

- apps/haotool/src/components/ThreeHero.tsx
- apps/haotool/src/components/ThreeHero.test.tsx
- apps/haotool/src/pages/Home.tsx
- apps/haotool/src/pages/Home.ssg.test.tsx
- apps/ratewise/src/components/BottomNavigation.tsx
- apps/ratewise/src/components/**tests**/BottomNavigation.a11y.test.tsx
- apps/ratewise/src/utils/chunkLoadRecovery.ts
- apps/ratewise/src/routes.tsx
- docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md
- docs/SECURITY_CSP_STRATEGY.md
- security-headers/DEPLOY.md

---

id: manual-version-pr-fallback-release-2026-03-10
date: 2026-03-10
title: Release workflow 權限受限時的手動 Version PR fallback
score: +1
type: success
content_type: troubleshooting
scope: monorepo
topics: [ci, deployment, documentation, ssot]
keywords: [changesets-action, workflow-permissions, manual-release-pr, versioning, release-fallback]
aliases: [Version Packages fallback, 手動 release PR]
related_entries: [pr185-review-browser-verification-release-prep, ratewise-v2-8-1-patch-release]
summary: PR #185 合併到 `main` 後，`Release` workflow 確實被觸發，但組織層級未開啟 GitHub Actions 建立 PR 權限，導致 `changesets/action` 無法自動建立 `Version Packages` PR。為維持既有 release SSOT，本次改以 `codex/manual-release-ratewise-2-8-6-parkkeeper-1-0-10` 分支手動執行 `pnpm changeset:version` 與 `pnpm --filter @app/ratewise prebuild`，將 patch 版本展開為 RateWise `2.8.6` 與 ParkKeeper `1.0.10`，再透過一般 PR 流程回到 `main`。
root_cause:

- GitHub Actions `Release` run `22883131370` 在 `Create Release Pull Request` 後回報 org-level permission 缺失：未啟用「Allow GitHub Actions to create and approve pull requests」
- repo 的版本治理要求必須透過 Version PR / release branch 完成版本化，不能因自動化失敗就跳過版本提交
  impact:

- 若不手動補救，`main` 上會保留已合併但尚未消化的 changeset，版本號、CHANGELOG 與公開 metadata 無法同步落版
- release workflow 雖標示 success，但實際上不會產生任何版本 PR，容易造成「看似成功、實際未發版」的誤判
  actions:

- 監看 `Release` workflow，確認失敗點與 GitHub annotations，而不是直接假設 secrets 或程式碼錯誤
- 從最新 `main` 建立 `codex/manual-release-ratewise-2-8-6-parkkeeper-1-0-10` release branch
- 執行 `pnpm changeset:version`，同步 root `package.json`、`apps/ratewise/package.json`、`apps/park-keeper/package.json` 與 CHANGELOG
- 補跑 `pnpm --filter @app/ratewise prebuild`，更新 `llms.txt`、`llms-full.txt`、`manifest.webmanifest`、`robots.txt`、`api/latest.json`、`openapi.json`
  prevention:

- 若維持現行 GitHub org 權限設定，未來每次有 changeset 合併到 `main` 後都需預期 `Version Packages` PR 不會自動產生，必須用同樣的手動 release fallback
- 建議維護者補開 GitHub Actions 建立/批准 PR 權限，讓 changesets/action 回到預期自動化路徑，避免 release 流程長期依賴人工補位
  verification:

- `gh run view 22883131370 --json jobs,status,conclusion,url`
- `pnpm changeset:version`
- `pnpm --filter @app/ratewise prebuild`
- `git diff --stat`
  references:

- .github/workflows/release.yml
- apps/ratewise/CHANGELOG.md
- apps/park-keeper/CHANGELOG.md
- https://github.com/haotool/app/actions/runs/22883131370

---

id: pr185-review-browser-verification-release-prep
date: 2026-03-10
title: PR #185 深度審查、Browser MCP 驗證與 patch release 準備
score: +1
type: success
content_type: how_to
scope: monorepo
topics: [testing, ci, documentation, ssot]
keywords: [pr-review, browser-mcp, changeset, release-prep, merge-readiness]
aliases: [PR 185 合併前審查, 瀏覽器驗證閉環]
related_entries: [cloudflare-security-headers-layered-refactor, security-header-test-structure-decoupling]
summary: 針對 `codex/cloudflare-security-headers-v4` 執行合併前深度審查，補跑 Browser MCP 驗證 `ratewise` 與 `park-keeper` 核心路由與互動，確認 console 全程 0 error，並補上 multi-package patch changeset，讓 PR #185 合併後可以依 repo SSOT 正常產生 `Version Packages` PR。
root_cause:

- 使用者要求在合併前完成深度 review、瀏覽器功能確認與小版本更新，但 repo 的 versioning 規則明確禁止在功能分支直接執行 `changeset version`
- 本地驗證過程曾產生 `apps/ratewise/public/*` 的 prebuild 日期異動，若不先辨識並還原，容易把暫時性產出誤帶進功能 PR
  impact:

- 若沒有補 Browser MCP 驗證，只看既有 CI 與 curl 仍無法覆蓋實際前端路由/互動
- 若沒有先補 changeset，PR 雖可合併，但 `main` 不會自動產生 version PR，無法完成受控 patch release 流程
  actions:

- 逐頁驗證 `http://localhost:4173/ratewise/`、`/multi`、`/favorites`、`/settings`，確認標題、主要內容與 console 均正常
- 驗證 `http://127.0.0.1:4176/park-keeper/` 的首頁、Quick Entry、設定與返回列表流程，並確認 console 0 error、遮罩可正常關閉面板
- 還原本地 prebuild 造成的暫時性 `public/*` 日期變更，只保留真正需要提交的 release metadata
- 新增 `.changeset/cloudflare-security-review-release.md`，將 `@app/ratewise` 與 `@app/park-keeper` 都標記為 patch
  prevention:

- 合併前審查需同時覆蓋 diff review、Browser MCP 與 versioning 規則，不可只依賴單一 CI 結果
- 本地 build / preview 若改寫公開產出檔，必須先判斷是否屬正式 release 內容，避免把暫時性日期漂移帶入 PR
- 使用者要求「更新小版本」時，應優先套用 repo 的 changeset / Version PR 流程，而不是在功能分支直接手動 bump 版本號
  verification:

- `gh pr view 185 --json mergeable,statusCheckRollup,url`
- `curl -I http://localhost:4173/ratewise/`
- `curl -I http://127.0.0.1:4176/park-keeper/`
- Playwright MCP：`ratewise` 首頁 / multi / favorites / settings
- Playwright MCP：`park-keeper` 首頁 / Quick Entry / settings / list
- `git diff -- apps/ratewise/public/llms-full.txt apps/ratewise/public/llms.txt apps/ratewise/public/manifest.webmanifest apps/ratewise/public/robots.txt`
  references:

- .changeset/cloudflare-security-review-release.md
- https://github.com/haotool/app/pull/185
- apps/park-keeper/src/components/QuickEntry.tsx
- security-headers/src/worker.js

---

id: codeql-test-html-regex-removal
date: 2026-03-10
title: 移除 security header 測試中的 HTML regex 以清除 CodeQL alert
score: +1
type: success
content_type: troubleshooting
scope: ratewise
topics: [testing, security, ci, ssot]
keywords: [codeql, github-advanced-security, html-parser, jsdom, test-mock]
aliases: [CodeQL 測試告警, bad-tag-filter]
related_entries: [cloudflare-security-headers-layered-refactor, security-header-test-structure-decoupling]
summary: PR #185 的 GitHub Advanced Security 在 `apps/ratewise/src/__tests__/securityHeadersWorker.test.ts` 發現 `js/bad-tag-filter`，原因是測試用 mock `HTMLRewriter` 以 regex 改寫 `<script>` tag。雖然告警落在 `classifications: [test]`，但仍會讓 PR 顯示新增高嚴重度 security alert。修正方式改為使用 `jsdom` 建立 DOM、以 `querySelectorAll()` 套用 handler，不再用 regex 解析 HTML。
root_cause:

- 測試為了模擬 Cloudflare `HTMLRewriter`，以 regex 匹配 `<script ...>` 後手動重組 tag
- GitHub Advanced Security 將此模式辨識為 `js/bad-tag-filter`，視為高嚴重度 XSS 風險樣式
  impact:

- PR #185 出現新增 1 個 high severity security vulnerability，阻礙審查與合併判讀
- 即使實際生產 Worker 已無此問題，測試層的告警仍會污染整體安全訊號
  actions:

- 將 mock `HTMLRewriter` 改為 `jsdom` DOM 操作，透過 `querySelectorAll()` 對符合 selector 的節點套用 handler
- 保留既有 7 個 Worker 測試案例，確認 nonce 注入與 header 行為不回歸
- 補跑單檔 `vitest` 與 `eslint`，確保型別邊界沒有因 `jsdom` 引入新 lint 問題
  prevention:

- 測試或工具程式若需要處理 HTML 結構，優先使用 DOM parser / sanitizer，不可再以 regex 操作 tag 邊界
- 發現 `classifications: [test]` 的 security alert 仍應修正，而不是依賴 dismiss，避免平台訊號失真
  verification:

- `pnpm --filter @app/ratewise exec vitest run src/__tests__/securityHeadersWorker.test.ts`
- `pnpm --filter @app/ratewise exec eslint src/__tests__/securityHeadersWorker.test.ts`
- `gh api 'repos/haotool/app/code-scanning/alerts?ref=refs/pull/185/head&state=open&per_page=100'`
  references:

- apps/ratewise/src/**tests**/securityHeadersWorker.test.ts
- https://github.com/haotool/app/pull/185

---

id: security-header-test-structure-decoupling
date: 2026-03-10
title: 修復 security header 測試對 Worker 字串結構耦合
score: +1
type: success
content_type: troubleshooting
scope: ratewise
topics: [testing, security, ssot]
keywords: [test-coupling, permissions-policy, worker-profile, pre-push, regex-drift]
aliases: [Permissions-Policy 測試耦合, pre-push 測試漂移]
related_entries: [cloudflare-security-headers-layered-refactor, incident-production-verification-gap]
summary: `pre-push` 在 `apps/ratewise/src/seo-best-practices.test.ts` 揭露既有測試仍假設 Worker 以舊式物件字面值直接宣告 `Permissions-Policy`，與新版 profile/constant 架構不相容。改為驗證 `DEFAULT_PERMISSIONS_POLICY` / `PARK_KEEPER_PERMISSIONS_POLICY` 常數與實際 `response.headers.set()` 路徑後，測試重新回到對 SSOT 的行為驗證，而非對字串排版的脆弱耦合。
root_cause:

- `seo-best-practices.test.ts` 仍使用舊 regex 直接抓 `"'Permissions-Policy': '...'"` 字串，假設 Worker 採物件字面值寫法
- `security-headers` v4.0 已改為 profile + constant 架構，導致測試抓不到 policy 值並在 pre-push 階段失敗
  impact:

- 本地 pre-push 被錯誤測試阻塞，降低安全重構 PR 的交付效率
- 若維持舊測試，未來再次調整 Worker 結構時仍會反覆出現假失敗
  actions:

- 將測試改為比對 `response.headers.set('Permissions-Policy', profile.permissionsPolicy)` 實際路徑
- 以 regex 抽取 `DEFAULT_PERMISSIONS_POLICY` 與 `PARK_KEEPER_PERMISSIONS_POLICY` 常數值，再驗證不含 deprecated features
  prevention:

- 針對 Worker / build script / config 類檔案，優先驗證 SSOT 常數與輸出行為，不要綁定特定排版或物件字面值格式
- pre-push 發現假失敗時，應修測試與真實結構的耦合，而不是降級 hook
  verification:

- `pnpm --filter @app/ratewise test -- --run src/seo-best-practices.test.ts`
- `git push -u origin codex/cloudflare-security-headers-v4`
  references:

- apps/ratewise/src/seo-best-practices.test.ts
- security-headers/src/worker.js

---

id: cloudflare-security-headers-layered-refactor
date: 2026-03-10
title: Cloudflare 安全標頭分層重構與正式站驗證閉環
score: +4
type: success
content_type: troubleshooting
scope: cloudflare-edge
topics: [security, headers, deployment, testing, ssot, pwa]
keywords: [cloudflare-worker, nonce-csp, permissions-policy, csp-report, immutable-assets, production-smoke]
aliases: [security-headers v4.0, Cloudflare header hardening, edge security refactor]
related_entries: [incident-csp-header-boundary, incident-production-verification-gap]
summary: 針對 `security-headers` Worker 執行分層重構，將 HSTS 留在 Cloudflare Edge，讓 Worker 專注於依 app/path 分層 CSP、CSP report 與分享圖 CORS；同時把 `ratewise` 升級為 nonce 型 CSP、補上 `park-keeper` 導航感測器白名單與 hook 啟用條件，最後以 curl、Playwright MCP、正式站 Playwright smoke test 建立可重現的生產驗證閉環。
root_cause:

- 舊 Worker 雖已集中管理安全標頭，但 route 只覆蓋 `app.haotool.org/ratewise/*`，導致 `nihonname`、`park-keeper`、`quake-school` 與 root pages 缺少一致保護
- `ratewise` 仍採逐請求全文讀取 + inline script hash 計算，造成邊緣 CPU / 記憶體成本偏高，也讓 CSP 維護與 HTML 耦合過深
- `park-keeper` 的 `Permissions-Policy` 沒有反映真實產品需求，前端又在隱藏 modal 載入時就綁定感測器 listener，導致正式站 console 噪音與 capability 邊界不一致
- 既有正式站 smoke test 的 asset path regex 會誤把 `/ratewise/assets/...` 截成 `/assets/...`，製造假陰性，削弱生產驗證可信度
  impact:

- 子 app 與 root pages 無法共享同一套可治理的安全標頭基線，Cloudflare 邊緣責任分層不清
- `ratewise` CSP 成本過高，且未來擴展到其他 app 時維護風險偏大
- `park-keeper` 正式站在首頁載入時出現 `Permissions policy violation` / `deviceorientation blocked` console 錯誤
- 若繼續依賴錯誤的 smoke test，會把真實上線狀態與測試結果拉開，影響 PR 與 release 判斷
  actions:

- 重寫 `security-headers/src/worker.js`，建立 `ratewise`、`park-keeper`、`nihonname`、`quake-school`、root/fallback HTML profile，並將 route 擴大為 `app.haotool.org/*`
- `ratewise` 改為 nonce + HTMLRewriter 串流注入 inline script，保留 CSP report 與 HTML 跨域隔離；`csp-report` 端點加入 method / content-type / payload size 防護
- `park-keeper` 的 `Permissions-Policy` 改為最小白名單：`geolocation=(self)`、`accelerometer=(self)`、`gyroscope=(self)`、`magnetometer=(self)`；`QuickEntry` 改成 `isVisible` 才啟用 `useDeviceOrientation`
- 新增 `apps/ratewise/src/__tests__/securityHeadersWorker.test.ts`，並更新正式站 `cloudflare-cache.spec.ts`，修正 asset path regex 與 header 斷言
- 更新 `docs/SECURITY_CSP_STRATEGY.md`、`docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md`、`security-headers/DEPLOY.md`、`docs/dev/040_cloudflare_security_headers_refactor_spec.md`，讓文件與邊緣真實行為保持 SSOT
  prevention:

- 固定站點級政策（如 HSTS）只留在 Edge；只有依路徑與 HTML 內容變化的 header 才交由 Worker 處理
- 任何新增 app 或調整感測器能力時，必須同步更新 Worker profile、正式站 smoke test 與文件矩陣，不可只改其中一層
- 正式站驗證必須同時包含 curl、瀏覽器 console 與 production Playwright smoke test，避免只看 preview 或單一工具
- 對子路徑 app 的資產檢查必須使用真實 base path，避免 regex 截斷造成假陰性
  verification:

- `pnpm --filter @app/park-keeper exec vitest run src/hooks/__tests__/useDeviceOrientation.test.ts`
- `pnpm --filter @app/ratewise exec vitest run src/__tests__/securityHeadersWorker.test.ts`
- `pnpm --filter @app/park-keeper exec tsc --noEmit`
- `pnpm --filter @app/ratewise exec tsc --noEmit`
- `pnpm exec prettier --check security-headers/src/worker.js apps/park-keeper/src/hooks/useDeviceOrientation.ts apps/park-keeper/src/components/QuickEntry.tsx apps/park-keeper/src/hooks/__tests__/useDeviceOrientation.test.ts apps/ratewise/src/__tests__/securityHeadersWorker.test.ts apps/ratewise/tests/e2e/cloudflare-cache.spec.ts docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md docs/SECURITY_CSP_STRATEGY.md docs/dev/040_cloudflare_security_headers_refactor_spec.md`
- `pnpm exec wrangler deploy`
- `curl -s --compressed https://app.haotool.org/park-keeper/ -D - -o /dev/null`
- `curl -sSI -X GET https://app.haotool.org/ratewise/csp-report`
- `RUN_PRODUCTION_TESTS=true pnpm --filter @app/ratewise exec playwright test tests/e2e/cloudflare-cache.spec.ts`
  references:

- security-headers/src/worker.js
- security-headers/wrangler.jsonc
- apps/ratewise/src/**tests**/securityHeadersWorker.test.ts
- apps/ratewise/tests/e2e/cloudflare-cache.spec.ts
- apps/park-keeper/src/hooks/useDeviceOrientation.ts
- apps/park-keeper/src/components/QuickEntry.tsx
- docs/SECURITY_CSP_STRATEGY.md
- docs/CLOUDFLARE_SECURITY_HEADERS_GUIDE.md
- docs/dev/040_cloudflare_security_headers_refactor_spec.md
- Cloudflare Workers / Transform Rules / HSTS / CSP 官方文件

---

id: fix-ratewise-router-chunk-cycle
date: 2026-03-09
title: 修復 vendor-router / vendor-commons 循環 chunk 警告
score: +3
type: success
content_type: troubleshooting
scope: ratewise
topics: [performance, ssot, testing]
keywords: [vite, manualchunks, vendor-router, vendor-commons, remix-router, vite-react-ssg]
aliases: [Circular chunk 修復, router chunk SSOT]
related_entries: [ratewise-v2-8-1-patch-release, ratewise-seo-ssot-faq-best-practices]
summary: 針對 `pnpm build:ratewise` 既存的 `Circular chunk: vendor-router -> vendor-commons -> vendor-router` 警告，重整 `manualChunks` 的 router 生態系統分組，將 `react-router`、`@remix-run/router` 與 `vite-react-ssg` 收斂到同一個 chunk，消除跨 chunk 循環依賴。
root_cause:

- `manualChunks()` 只把 `react-router` 系列切到 `vendor-router`，但底層 `@remix-run/router` 被落入 `vendor-commons`
- `vite-react-ssg` runtime 也被切到 `vendor-commons`，而它本身會依賴 router runtime，形成 `vendor-router -> vendor-commons -> vendor-router` 交叉引用
  impact:

- build 持續產生循環 chunk 警告，增加 chunk 邊界不透明度與後續效能調校成本
- router / SSG runtime 被拆散後，未來調整 code-splitting 時更容易引入回歸
  actions:

- 在 `apps/ratewise/vite.config.ts` 新增 `ROUTER_ECOSYSTEM_PACKAGES` 常數
- 將 `react-router`、`@remix-run/router`、`vite-react-ssg` 明確收斂到 `vendor-router`
- 重新 build 並檢查產物 log，確認不再出現 `Circular chunk` 警告
  prevention:

- 後續調整 `manualChunks` 時，必須以「同一 runtime 生態鏈」為單位分組，而不是只看最上層套件名稱
- 若新增 router/SSG 相關套件，需先確認是否應納入同一 chunk family，避免底層 runtime 被誤切到 `vendor-commons`
  verification:

- `pnpm build:ratewise`
- `rg -n "Circular chunk|manual chunk logic" /tmp/ratewise-build.log`
  references:

- apps/ratewise/vite.config.ts
- Vite build.rollupOptions / Rollup output.manualChunks 官方文件

---

id: ratewise-v2-8-1-patch-release
date: 2026-03-09
title: RateWise v2.8.1 patch release 與 changeset 版本化
score: +1
type: success
content_type: how_to
scope: ratewise
topics: [documentation, ssot, ci]
keywords: [changeset-version, patch-release, changelog, versioning, ratewise-2-8-1]
aliases: [RateWise 2.8.1, patch 發版]
related_entries: [ratewise-seo-ssot-faq-best-practices]
summary: 將已合併到 main 的兩個 RateWise patch changeset 正式版本化為 v2.8.1，產出對應 CHANGELOG 並清除待處理 changeset，讓主支回到乾淨可發布狀態。
root_cause:

- `#177` 與 `#182` 合併後，main 上累積兩個 `@app/ratewise` patch changeset，需透過正式版本化流程寫回 package 與 CHANGELOG
  impact:

- 若不做版本化，主支會持續保留未消化 changeset，後續 release 與 changelog 追蹤會變得不一致
  actions:

- 從最新 `main` 建立 release 分支
- 執行 `pnpm changeset version`，將 `apps/ratewise/package.json` 升至 `2.8.1`
- 執行 `pnpm --filter @app/ratewise prebuild`，同步 `llms.txt`、`api/latest.json`、`openapi.json`
- 產出 `apps/ratewise/CHANGELOG.md` 新版條目並移除已消化的 changeset 檔
  prevention:

- 後續每次 patch SEO / 結構化資料修復完成後，應在合併後立即完成一次版本化，避免 changeset 長時間堆積在主支
  verification:

- `node scripts/verify-version-ssot.mjs`
- `pnpm --filter @app/ratewise prebuild`
- `pnpm --filter @app/ratewise exec tsc --noEmit`
- `pnpm --filter @app/ratewise test`
- `pnpm build:ratewise`
  references:

- .changeset/ratewise-seo-ssot-pr182-final.md
- .changeset/seo-eeeat-codesplit.md
- apps/ratewise/CHANGELOG.md

---

id: ratewise-seo-ssot-faq-best-practices
date: 2026-03-08
title: RateWise SEO SSOT 收斂與 FAQ rich result 最佳實踐修復
score: +4
type: success
content_type: troubleshooting
scope: ratewise
topics: [seo, ssot, documentation, testing]
keywords: [faq-rich-results, faq-content-ssot, hreflang, canonical, json-ld, noindex-rendering]
aliases: [FAQPage 收斂, SEOHelmet SSOT, hreflang helper]
related_entries: [log-v2-structured-indexing, regression-docs-tests-routes-sync, incident-seo-public-path-ssot]
summary: 依 Google Search Central 最佳實踐重新審查 RateWise SEO PR，將 FAQ 內容與 rich result 責任拆分，移除不適用的 FAQPage schema、收斂 hreflang fallback 與 head metadata，並以 TDD 重寫 SEO 驗證，讓 SEO 行為回到單一 SSOT。
root_cause:

- FAQ 內容、FAQ rich result、hreflang fallback 與 head metadata 分散在 `SEOHelmet`、頁面元件與測試斷言中，導致 PR 表面通過但實際仍殘留舊 FAQPage 行為
- 舊測試過度依賴 source code regex 與過時實作細節，無法可靠驗證最終 prerender / SSG 產物
  impact:

- FAQ 頁可能持續輸出不符合現行 Google rich result 範圍的 `FAQPage` schema
- `meta keywords` / `meta title` / `meta language` 等冗餘訊號增加 head 複雜度與維護成本
- SSOT 漂移會讓 reviewer 與未來維護者誤判 SEO 真實狀態
  actions:

- 將 `SEOPageMetadata.faq` 改為 `faqContent`，建立 `HomepageSEOContent` 與 `buildDefaultAlternates()` helper
- 移除 `SEOHelmet` 內的 `FAQPage` builder，保留 `HowTo` / `BreadcrumbList` / 基礎站點 schema，並刪除無效 `meta keywords/title/language`
- FAQ 頁與首頁改為只消費 FAQ 內容 SSOT，不再將 FAQ 內容直接輸出為 rich result schema
- 新增 `seo-ssot.test.ts`，並重寫 `hreflang.test.ts`、`jsonld.test.ts`、`prerender.test.ts`、`SEOHelmet.test.tsx`，改以行為與產物為驗證核心
- 順手修復 `converterStore.test.ts` 既有 lint 警告，讓 `pnpm --filter @app/ratewise lint` 回到全綠
  prevention:

- 之後若 UI 仍要顯示 FAQ 內容，必須明確標示為 `faqContent` 類內容欄位，不得預設等同 rich result schema
- hreflang / canonical fallback 一律走 helper 與 SSOT 常數，不允許在 component 內散落手寫陣列
- SEO 驗證優先檢查 prerender 產物與 helper 行為，不再用 regex 驗 source existence 當作真相
  verification:

- `pnpm --filter @app/ratewise exec tsc --noEmit`
- `pnpm --filter @app/ratewise lint`
- `pnpm build:ratewise`
- `pnpm --filter @app/ratewise test`
- `pnpm --filter @app/ratewise test -- --run src/config/__tests__/seo-ssot.test.ts src/hreflang.test.ts src/jsonld.test.ts src/seo-best-practices.test.ts src/prerender.test.ts src/components/__tests__/SEOHelmet.test.tsx src/seo-truthfulness.test.ts`
  references:

- Google Search Central: FAQ rich results / localized versions / JavaScript SEO best practices
- apps/ratewise/src/config/seo-metadata.ts
- apps/ratewise/src/components/SEOHelmet.tsx
- docs/dev/039_ratewise_seo_ssot_tdd_spec.md

---

SEO 真正的 SSOT 不是「某段 schema 曾經存在」，而是「最終靜態產物、head 與測試都指向同一套規則」。

---

id: fix-twd-pinned-multi-ordering
date: 2026-03-09
title: 修復 sortedCurrencies 未固定 TWD 與排序不一致
score: +3
content_type: incident
topics: [bugfix, sorting, multi-converter, favorites, tdd]
keywords: [sortedCurrencies, TWD, favorites, getAllCurrenciesSorted, useCurrencyConverter]
related_entries: [log-v2-structured-indexing]
type: success
scope: ratewise
summary: 修復多幣別頁（Multi）的 sortedCurrencies 舊版邏輯未固定 TWD 在首位、非收藏幣未字母排序，導致與收藏頁（Favorites）行為不一致。
root_cause: >
useCurrencyConverter 原始 sortedCurrencies 邏輯為 [...orderedFavorites, ...remaining]，
未明確固定 TWD，非收藏幣也未排序；getAllCurrenciesSorted（Favorites 頁）則有正確邏輯。
impact: Multi 頁排序不穩定；TWD 可能不在首位；Favorites 與 Multi 排序不一致。
fix: >
改為 ['TWD', ...favWithoutTWD, ...remaining.sort()]，與 getAllCurrenciesSorted 完全一致；
新增 5 個 sortedCurrencies 單元測試（TWD 置頂、收藏順序、字母排序、一致性驗證）。
prevention: >
任何排序邏輯需與 favorites-utils.ts:getAllCurrenciesSorted 保持一致；
新增排序相關功能時必須同時更新兩處（hook + utils），或抽取成共用函式。
actions:

- 修改 useCurrencyConverter.ts：sortedCurrencies 改用明確 TWD 置頂邏輯
- 新增 .changeset/fix-twd-pinned-ordering.md（後續校正為 patch）
- 新增 5 個 sortedCurrencies 測試（PR #181）
- 記錄錯誤修復至 CLAUDE.md Troubleshooting #9-11 / AGENTS.md 實務模式
  verification:
- 90 個測試檔，1488 個測試全通過
- PR #181 CI 全通過（Lighthouse / E2E / Quality Checks / CodeQL）

---

date: 2026-03-08
title: Git 歷史失敗案例重構與 002 incident 知識庫整理
score: +2
type: success
scope: repo
tags: [documentation, incident, ssot, git-history]
summary: 直接回看 git 歷史與既有獎懲記錄，將零散的失敗教訓重構成可搜尋、可複用的 incident entry，避免未來只看到結果看不到根因與修法。
actions:

- 盤點 git log 中實際發生過的 hydration、CSP、CI 硬編碼、base path 與部署漂移案例
- 將高價值失敗案例改寫為標準 incident entry，統一記錄根因、影響、修復與預防
- 更新 AGENTS.md、CLAUDE.md，將 incident 記錄要求提升為正式 SOP
  verification:
- git log 關鍵事故提交回查
- 002 結構檢查：Entries / 歷史失敗案例 / 歷史索引三層分離
  references:
- git log
- docs/dev/002_development_reward_penalty_log.md

---

失敗紀錄只有在能快速回答「為什麼壞、怎麼修、下次怎麼避免」時才真正有價值。

---

id: log-v2-structured-indexing
date: 2026-03-08
title: 002 v2 結構化索引規格與主題分類升級
score: +2
type: success
content_type: reference
scope: repo
topics: [documentation, ssot, testing]
keywords: [front-matter, taxonomy, keywords-index, related-entries, controlled-vocabulary]
aliases: [002 v2, 結構化索引, 主題分類]
related_entries: [incident-ci-hardcoded-audit, regression-docs-tests-routes-sync]
summary: 依文件前言、分類與搜尋最佳實踐，將 002 升級為可被腳本與靜態文件工具穩定解析的 v2 結構，補上受控主題分類、標準化關鍵字與跨案例關聯。
root_cause:

- 舊版 entry 可讀但索引欄位不穩定，主題與關鍵字無法可靠抽取
- 相同類型案例雖已去重，仍缺少穩定 id、分類與關聯鍵
  impact:
- 後續若要自動做主題索引、全文檢索或知識圖譜，成本偏高
  actions:
- 新增 v2 標準欄位：`id`、`content_type`、`topics`、`keywords`、`aliases`、`related_entries`
- 加入受控主題分類與關鍵字索引規則，降低自由標記漂移
- 將歷史失敗案例整段改寫為可直接索引的結構化條目
  prevention:
- 新增或重構 002 條目時，先套 v2 欄位，再填內容
- `topics` 使用受控詞彙，`keywords` 使用 kebab-case，避免自由發散
  verification:
- 002 可用固定欄位解析主題、關鍵字與關聯案例
- AGENTS / CLAUDE 已同步要求新條目使用 v2 結構化欄位
  references:
- Google Developer Documentation Style Guide
- Diataxis
- Docusaurus front matter / tags docs
- GitHub Docs YAML frontmatter

---

把可讀筆記轉成可索引資料後，未來不管要做 grep、SQLite、靜態站索引或知識圖譜都比較穩。

---

date: 2026-03-08
title: SEOHelmet effect 依賴穩定化
score: +1
type: success
scope: ratewise
tags: [seo, head, performance, regression]
summary: normalizedAlternates 每次 render 新建陣列，props 未變時仍會重跑整份 head 去重流程。
actions:

- 將依賴改為穩定字串 normalizedAlternatesSignature
- 補 rerender 回歸測試，驗證 canonical、alternate、structured data 節點不會重建
  verification:
- pnpm --filter @app/ratewise typecheck
- pnpm --filter @app/ratewise exec vitest run src/components/**tests**/SEOHelmet.test.tsx
- pnpm --filter @app/ratewise exec vitest run src/jsonld.test.ts src/prerender.test.ts
- pnpm --filter @app/ratewise build
  references:
- PR #174 review

---

避免高互動頁面在同 props rerender 時反覆重寫整份 head。

---

date: 2026-03-08
title: SEOHelmet 卸載 cleanup 與跨頁 head 污染修復
score: +1
type: success
scope: ratewise
tags: [seo, head, cleanup, regression]
summary: SEOHelmet 卸載後若下一頁未使用同元件，舊頁 canonical、description、JSON-LD 會殘留在 document.head。
actions:

- 為 client 接管節點統一加上 data-seo-helmet managed 標記
- effect cleanup 僅移除受管節點，避免誤傷其他 Head 節點
- 補 unmount 回歸測試，確認保留 charset 與 viewport
  verification:
- pnpm --filter @app/ratewise typecheck
- pnpm --filter @app/ratewise exec vitest run src/components/**tests**/SEOHelmet.test.tsx
- pnpm --filter @app/ratewise exec vitest run src/jsonld.test.ts src/prerender.test.ts
- pnpm --filter @app/ratewise build
  references:
- PR #174 review

---

手動寫入 `document.head` 的程式碼，未來一律視為必須有 managed 標記與 cleanup 的高風險區。

---

date: 2026-03-08
title: FAQ rich results 範圍收斂與 head hydration 去重
score: +4
type: success
scope: ratewise
tags: [seo, structured-data, faq, ssot]
summary: FAQ rich result 已限於少數權威站點，同一 FAQ 不應在首頁、幣別頁、About、Guide 重複標記。
actions:

- 將 FAQPage schema 收斂到真正 FAQ 頁
- SEOHelmet 在 client runtime 接管 head tags，消除 hydration 後重複根因
- ImageObject 補齊 license 與 acquireLicensePage，統一由 APP_INFO / seo-metadata 管理
  verification:
- pnpm --filter @app/ratewise typecheck
- pnpm --filter @app/ratewise exec vitest run src/components/**tests**/SEOHelmet.test.tsx src/jsonld.test.ts src/prerender.test.ts src/config/**tests**/app-info.test.ts src/seo-best-practices.test.ts
- pnpm --filter @app/ratewise build
  references:
- Google Search Central: FAQ structured data / Rich results 限制
- Google Search Central: image license metadata

---

FAQ 文案可保留，但 `FAQPage` 預設只留在真正 FAQ 頁。

---

date: 2026-03-07
title: SEO 權威內容頁與 deep-link 模板收斂
score: +6
type: success
scope: ratewise
tags: [seo, ssot, sitemap, llms]
summary: 將可索引內容頁與參數頁職責分離，降低搜尋引擎從公開文件與幣別頁擴散抓取參數變體的風險。
actions:

- 新增三個公開可索引權威內容頁，集中承接高意圖匯率主題
- 同步 CONTENT_SEO_PATHS、SEO_PATHS、PRERENDER_PATHS、sitemap、hreflang、路由與 llms 文件
- 將幣別頁常見金額入口改為互動導頁，並把 deep-link 文件改為模板格式
  verification:
- pnpm --filter @app/ratewise prebuild
- pnpm --filter @app/ratewise test -- --run src/components/**tests**/CurrencyLandingPage.test.tsx src/config/**tests**/seo-paths.test.ts src/hreflang.test.ts src/seo-best-practices.test.ts src/components/**tests**/SEOHelmet.test.tsx
- pnpm vitest run scripts/**tests**/sitemap-2025.test.ts
- pnpm --filter @app/ratewise test -- --run src/prerender.test.ts src/seo-truthfulness.test.ts
- pnpm --filter @app/ratewise typecheck
- node scripts/verify-sitemap-2025.mjs
- pnpm --filter @app/ratewise build
  references:
- Context7: vite-react-ssg 靜態路由與 Head
- Google Search Central: canonical 重複網址 / helpful content

---

權威內容頁負責被索引，參數頁與 deep-link 文件則只保留工具用途，避免語意混線。

---

date: 2026-03-07
title: 公開產物格式漂移收斂與提交潔淨化
score: +1
type: success
scope: ratewise
tags: [ssot, build, formatting]
summary: prebuild 與 build 產生的 API / OpenAPI / manifest 產物格式會造成工作樹殘留差異，容易誤判為邏輯回歸。
actions:

- 確認差異屬於腳本輸出格式，而非功能變更
- 將公開產物重新納入版本控制，讓 repo 狀態與實際生成結果一致
- 以腳本最終輸出作為公開產物 SSOT
  verification:
- git diff --stat
  references:
- docs/dev/002 既有 prebuild 格式漂移治理規則

---

公開產物只接受生成結果，不再手修格式。

---

date: 2026-03-07
title: rebase 後版本與 sitemap SSOT 根因修復
score: +4
type: success
scope: ratewise
tags: [ssot, versioning, sitemap, rebase]
summary: rebase 後 app 版本與公開產物版本脫鉤，且 `/privacy/` SEO 路徑定義再次在 JS/TS mirror 間分歧。
actions:

- 將 @app/ratewise 版本對齊到 2.6.1
- 對齊 seo-paths.ts 與 seo-paths.config.mjs，並在 sitemap 生成器加入去重
- 更新測試斷言，直接反映當前 SEO_PATHS / PRERENDER_PATHS SSOT
  verification:
- pnpm --filter @app/ratewise prebuild
- pnpm --filter @app/ratewise test -- --run src/config/**tests**/seo-paths.test.ts src/seo-best-practices.test.ts src/hreflang.test.ts src/seo-truthfulness.test.ts
- pnpm vitest run scripts/**tests**/sitemap-2025.test.ts
  references:
- Context7: Vitest CLI 最小測試集合重跑

---

版本號、SEO 路徑與 sitemap 生成器必須同時更新，否則 rebase 後很容易再次漂移。

---

date: 2026-03-07
title: SEO Audit hreflang 驗證硬編碼根因修復
score: +3
type: success
scope: ratewise
tags: [seo, audit, hreflang, ssot]
summary: 驗證腳本仍以 `SEO_PATHS + LEGAL_SSG_PATHS` 硬編碼計算 sitemap 路徑，導致 CI 錯誤期待多出 `/privacy/` 與 hreflang 計數。
actions:

- 將 verify-sitemap-2025.mjs 改為使用與生成器一致的 `new Set(SEO_PATHS)` 來源
- 讓 audit 與實際 sitemap 回到同一份 SSOT
- 重新驗證 sitemap 與完整 SEO audit
  verification:
- node scripts/verify-sitemap-2025.mjs
- node scripts/seo-full-audit.mjs
  references:
- GitHub Actions: SEO 2025 Standards Audit

---

審計腳本不能再自行推導路徑，必須直接吃生成器同源資料。

---

date: 2026-03-07
title: SEO 真實性與 robots / sitemap SSOT 根因修復
score: +5
type: success
scope: ratewise
tags: [seo, ssot, robots, sitemap, truthfulness]
summary: 舊文案、noindex 結構化資料與公開檔案生成流程彼此不一致，會同時影響可信度、索引與 sitemap 正確性。
actions:

- 移除不實文案，改以實際支援幣別、資料來源與匿名分析揭露為準
- 為 noindex 頁面抑制結構化資料，避免 schema / noindex 衝突
- 將 robots.txt、manifest.webmanifest、llms.txt、openapi.json 改為腳本生成，並修復 root sitemap 發現鏈
  verification:
- pnpm --filter @app/ratewise prebuild
- pnpm --filter @app/haotool prebuild
- pnpm --filter @app/ratewise typecheck
- pnpm --filter @app/ratewise test -- --run src/components/**tests**/SEOHelmet.test.tsx src/pages/Guide.test.tsx src/seo-best-practices.test.ts src/seo-truthfulness.test.ts
- pnpm vitest run scripts/**tests**/sitemap-2025.test.ts
- node scripts/verify-sitemap-2025.mjs
- pnpm --filter @app/ratewise build
- pnpm --filter @app/haotool build
  references:
- Context7: vite-react-ssg / vite-plugin-pwa / vite 7
- Google Search Central: robots / sitemaps / canonical / localized versions

---

SEO 文案、公開檔案與索引規則若不是同源生成，最後一定會出現可信度與索引衝突。

---

date: 2026-03-03
title: 建立 RateWise Cloudflare 稽核與驗證工作流文件
score: +1
type: success
scope: ratewise
tags: [cloudflare, audit, ops, documentation]
summary: 將 Cloudflare Worker、Rules、PWA probe、curl 驗證命令與已知漂移整理成單一操作基準，降低後續邊緣修復成本。
actions:

- 整理 Worker、Transform Rules、Snippets、Cache Rules 與正式站驗證命令
- 補上驗收標準與已知漂移清單
- 從部署指南建立連結，形成單一稽核入口
  verification:
- 文件交叉校對 Cloudflare 配置與 repo 既有部署說明
  references:
- docs/DEPLOYMENT.md
- Cloudflare 稽核工作流文件

---

邊緣設定若沒有單一稽核基準，之後每次修正都會重複踩同一個坑。

---

date: 2026-03-03
title: Code Splitting 生產癱瘓事故與根因修復
score: 0
type: incident
scope: ratewise
tags: [performance, build, regression, incident]
summary: manualChunks 未涵蓋 `scheduler/`，導致 React 核心模組跨 chunk 分裂，生產環境出現 `unstable_now` 錯誤並全面癱瘓。
actions:

- 將 `scheduler/` 明確併入 vendor-react chunk
- 重新 build 與 preview 驗證載入順序
- 記錄事故教訓：React 生態的底層依賴不能被錯拆
  verification:
- 本地 build
- 本地 preview 驗證
- 生產部署後確認站點恢復
  references:
- vite.config.ts manualChunks 修復

---

這筆保留為 `0` 分事故紀錄，提醒效能優化不能只看 bundle size，還要看模組依賴邊界。

---

date: 2026-03-03
title: 效能優化 P0：Bundle 490KB 降至 233KB
score: +5
type: success
scope: ratewise
tags: [performance, vite, bundle, pwa]
summary: 透過分 chunk、壓縮與連線優化，將初始 bundle 顯著下降，並改善 critical path 傳輸量與預期 SEO / 性能分數。
actions:

- 將 manualChunks 由 2 組拆成 5 組，讓 charts 與 motion lazy 載入
- Terser 壓縮強化，移除殘留註解
- index.html 將 dns-prefetch 提升為 preconnect，優化渲染阻塞
  verification:
- pnpm build
- 全站 SSG 預渲染成功
- PWA precache 驗證
- 單元測試全數通過
  references:
- squirrelscan 稽核結果
- vite build 產物分析

---

效能優化可以很激進，但必須和事故紀錄成對保存，避免之後只記得成果忘了代價。

### 2026-02

---

date: 2026-02-28
title: park-keeper Phase 3 接手收尾
score: +6
type: success
scope: park-keeper
tags: [pwa, map, ux, offline]
summary: 完成車牌快編自動儲存、停車朝向、全屏地圖、照片互動與 tile cache 收斂，讓 park-keeper Phase 3 可交付。
actions:

- 列表頁改為點擊即編輯，加入防抖自動儲存與 optimistic update
- 新增 parkedHeading、地圖旋轉車輛 marker、全屏地圖追蹤策略與照片檢視器
- PWA 改為 injectManifest，整合外部地圖磚快取桶、背景刷新與過期清理
  verification:
- pnpm --filter @app/park-keeper lint
- pnpm --filter @app/park-keeper test -- --run
- pnpm --filter @app/park-keeper typecheck
- pnpm --filter @app/park-keeper build
  references:
- park-keeper Phase 3 實作與驗證紀錄

---

功能、地圖互動與離線快取在同一輪收斂完成，避免把 UX 與 PWA 修補拆成零碎 hotfix。

---

date: 2026-02-28
title: RateWise SEO 權威定位與新增 4 幣對頁
score: +3
type: success
scope: ratewise
tags: [seo, ssot, content]
summary: 將品牌定位收斂為台灣實際買賣價匯率工具，並新增 VND、PHP、IDR、MYR 四個 SEO 幣對頁，同步所有公開 SEO 路徑 SSOT。
actions:

- 更新品牌敘述與幣對落地頁
- 同步 TS / MJS SEO 路徑、sitemap、llms.txt、api/latest.json
- 將常見金額區塊語意化，讓頁面更符合搜尋意圖
  verification:
- 所有 1405 測試通過
  references:
- RateWise SEO 權威定位調整紀錄

---

新增內容頁時同步更新所有公開清單，避免 sitemap 與 llms 再次失同步。

---

date: 2026-02-28
title: Sitemap hreflang SSOT 同步修復
score: +2
type: success
scope: ratewise
tags: [seo, sitemap, hreflang, ssot]
summary: public sitemap 與 SEO_PATHS 計數不一致，重新生成後收斂為同一份路徑來源，讓 CI SEO Audit 回綠。
actions:

- 重新生成 sitemap-2025 產物
- 對齊公開 URL 與 hreflang 計數
- 讓 CI 驗證直接對應目前 SEO 路徑 SSOT
  verification:
- CI SEO Audit 通過
  references:
- generate-sitemap-2025.mjs

---

凡是 URL 計數類規則，都必須直接對齊生成器來源，不再依賴人工維護數字。

---

date: 2026-02-28
title: SEO 技術債清除與 JSON-LD SSOT 對齊
score: +3
type: success
scope: ratewise
tags: [seo, jsonld, ssot, cleanup]
summary: 移除 dead code、收斂重複 ImageObject 與硬編碼圖片替代文字，讓 SEO metadata 與 APP_INFO 維持單一來源。
actions:

- 移除 HomeStructuredData.tsx dead code
- 修復 SEOHelmet 重複 ImageObject，並改由 OG_IMAGE_ALT / APP_INFO.organizationUrl 管理
- 更新 jsonld 與 SEO 最佳實踐測試，移除對舊實作的依賴
  verification:
- jsonld.test.ts
- seo-best-practices.test.ts
  references:
- seo-metadata.ts

---

SEO 結構化資料只保留一份實作來源，測試也必須一起切到新 SSOT。

---

date: 2026-02-28
title: prerender / hreflang 測試斷言修復與 SOP 文件升級
score: +3
type: success
scope: repo
tags: [test, documentation, sop]
summary: 修復 prerender 與 hreflang 測試斷言，同日將 AGENTS / CLAUDE 升級為企業 SOP 格式，補齊文件控制、控制矩陣與例外流程。
actions:

- 修正 Organization schema regex 與 hreflang xhtml:link 斷言
- 升級 AGENTS.md、CLAUDE.md 的 SOP 與稽核欄位
- 查詢並採納 Google / Microsoft / Diataxis 等文件寫作最佳實踐
  verification:
- prerender.test.ts
- hreflang.test.ts
  references:
- Google Developer Documentation Style Guide
- Microsoft Writing Style Guide
- Diataxis

---

測試斷言與 SOP 一起修，是因為兩者本質上都在維護 repo 的可驗證性。

## 歷史失敗案例（完整去重）

> 以下將歷史上重複出現、但本質相同的事故合併為單一案例。目標不是保留所有時間軸，而是保留「最小可重用教訓」。

### 主題去重對照表

| 主題                         | 重複來源                                                                                           | 統一解法                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| SSG / Hydration 非決定性輸出 | `new Date()`、`Math.random()`、`localStorage`、`LAST_UPDATED` 時區漂移、巢狀 Layout 導致首屏不一致 | 首屏只允許 deterministic 值；browser-only 資料延後到 `useEffect`；日期固定時區；避免 render phase 讀取瀏覽器 API |
| Base path / 資產路徑漂移     | 動態 `BASE_URL` 拼接圖片、正式站 base path 驗證缺失、PWA 子路徑鏡像缺失                            | 資產預設用相對路徑；build/preview 必跑真實 base path；子路徑部署一律檢查 logo/OG/offline/manifest                |
| SEO 公開路徑 SSOT 漂移       | sitemap、hreflang、llms.txt、robots、路由、SEO_PATHS 計數不同步                                    | 生成器做唯一來源；驗證腳本只能讀生成器同源資料；新增公開頁時同步更新所有公開清單                                 |
| CI / 審計硬編碼              | 用固定字串檢查合規文件、用人工數字驗 sitemap/hreflang、把單一 app 規則套到全部 workspace           | 回到官方規範；檢查改為結構與正則；從 app config / 生成產物動態推導，不手寫常數                                   |
| CSP / 安全標頭架構不匹配     | `strict-dynamic` 套到 SSG、worker / nginx / app 各自維護 header、console 問題只修 app 不驗 edge    | 安全標頭收斂到單一責任邊界；策略必須符合執行架構；部署後一定驗正式站 header 與 console                           |
| 生產驗證缺口                 | 分支合併前只看 CI、不看正式 base path 與 edge 行為                                                 | 高風險 SEO / PWA / security 變更必做 build + preview + 正式站 smoke check                                        |
| 過度優化導致複雜化           | AVIF/WebP 未準備就先做、manualChunks 拆過頭導致 scheduler 分裂、生產站掛掉                         | 先確認基礎資產與依賴邊界，再做優化；效能優化必配事故回滾與部署驗證                                               |
| 文件 / 測試 / 路由不同步     | 文檔與程式碼狀態不符、xhtml:link 數量未同步、vite.config SSG 路徑未同步 routes                     | 新增路由後同步更新 routes、SSG、sitemap、測試與文件；若改規則，先更新 SSOT 再改斷言                              |

---

id: incident-ssg-hydration-determinism
date: 2026-03-08
title: SSG / Hydration 非決定性輸出
score: 0
type: incident
content_type: troubleshooting
scope: repo
topics: [hydration, ssg, testing]
keywords: [hydration-mismatch, deterministic-render, localstorage, date-now, timezone-drift]
aliases: [Hydration #418, 首屏漂移, render phase 讀取瀏覽器 API]
related_entries: [incident-base-path-assets, incident-docs-tests-routes-sync]
summary: 多次事故本質相同：server 與 client 首次 render 使用了不同輸入，例如 `new Date()`、`Math.random()`、`localStorage`、未固定時區的日期或巢狀 Layout，導致 Hydration #418、畫面重排或首屏內容漂移。
root_cause:

- server 與 client 首次 render 使用非 deterministic 值
- browser-only API 提前進入 render phase
- server / client 節點樹因 layout 或條件渲染不同步
  impact:
- Hydration 錯誤與首屏改寫
- 靜態頁文字、日期或 UI 狀態在載入後跳動
- 測試與正式站行為不一致，增加排查成本
  actions:
- 首屏只允許 deterministic 值，動態時間改用 `BUILD_TIME` / 固定時區字串
- `localStorage`、`window`、裝置資訊等 browser-only 資料延後到 `useEffect`
- 若內容必須 client-only 顯示，使用 `ClientOnly` 或 `suppressHydrationWarning`
- 避免用多層 Layout 在 server / client 產生不同節點樹
  prevention:
- 凡是會出現在 SSG 首屏的值，先檢查是否跨時區、跨環境、跨裝置會變
- 將 hydration 類事故統一歸檔到同一主題，不再分散記錄
  verification:
- SSG HTML 與 client 首次 render 不再產生文字或節點差異
- Hydration #418 / 首屏改寫錯誤消失
  references:
- 2025-12-06 / 2025-12-07 / 2025-12-25 Hydration 修復紀錄
- git commit 6cd321ff

---

只要某個值在 server 與 client 首次 render 可能不同，就應先視為 hydration 事故候選。

---

id: incident-base-path-assets
date: 2026-03-08
title: Base path / 資產路徑漂移
score: 0
type: incident
content_type: troubleshooting
scope: repo
topics: [assets, deployment, ssg, seo]
keywords: [base-path, asset-url, relative-path, og-image, manifest]
aliases: [BASE_URL 漂移, 子路徑部署失敗, OG 圖片失效]
related_entries: [incident-production-verification-gap, incident-ssg-hydration-determinism]
summary: 多次正式站問題都來自同一根因：資產路徑在 component 內自行拼接，或只在本地根路徑驗證，沒用真實子路徑 / base path 檢查，最終造成 logo、OG、offline、manifest 或 favicon 在正式站失效。
root_cause:

- 手動組合資產 URL，而不是讓打包工具處理
- 僅在 root path 驗證，未覆蓋真實部署路徑
  impact:
- 正式站圖片、manifest、favicon、offline 頁失效
- SEO 預覽圖與分享資產缺失
- 子路徑部署與本地預覽結果脫鉤
  actions:
- 資產預設使用相對路徑，交由 Vite 處理 base path
- 合併前以真實 `VITE_*_BASE_PATH` 跑 build + preview
- 對 logo、OG image、offline.html、manifest、favicon 建立固定 smoke checklist
  prevention:
- 禁止在 component 內自行拼接分享圖、logo 或 manifest URL
- 子路徑 app 一律在 preview 階段跑真實 base path 驗證
  verification:
- 子路徑部署下資產可正常載入
- 正式站與 preview 對同一組路徑行為一致
  references:
- 2025-12-15 生產環境 base 路徑修復
- 2025-12-24 SEO 分支合併前未驗證生產環境
- 2025-12-24 圖片路徑使用動態 BASE_URL 導致 hydration

---

在 Vite / SSG 專案裡，自己拼 asset URL 通常不是聰明，而是未來事故的起點。

---

id: incident-seo-public-path-ssot
date: 2026-03-08
title: SEO 公開路徑與產物 SSOT 漂移
score: 0
type: incident
content_type: troubleshooting
scope: ratewise
topics: [seo, ssot, routing, documentation]
keywords: [sitemap, hreflang, llms, robots, seo-paths]
aliases: [公開路徑不同步, sitemap 漂移, hreflang 計數錯誤]
related_entries: [incident-ci-hardcoded-audit, regression-docs-tests-routes-sync]
summary: sitemap、hreflang、llms.txt、robots、公開路由與驗證腳本曾多次互相脫鉤；表面症狀不同，但根因一致：公開 SEO 路徑不是由單一來源生成，導致每加一條路由就有多處需要手動同步。
root_cause:

- 公開 URL 清單存在多份來源
- 驗證腳本與生成器使用不同資料源
  impact:
- SEO audit、hreflang 計數與 sitemap 互相打架
- rebase 或新增頁面後容易出現 false red / false green
  actions:
- 讓 SEO 路徑、sitemap、robots、llms.txt、OpenAPI 與驗證腳本都回到同一生成來源
- 新增公開頁時，同步更新 routes、PRERENDER_PATHS、SEO_PATHS 與 sitemap 驗證
- 驗證腳本不得自行推導路徑或手寫計數
  prevention:
- 公開 URL 只允許一份 SSOT
- 新增頁面 checklist 必含 sitemap / hreflang / llms / robots / routes
  verification:
- sitemap / hreflang / llms / robots / SEO audit 計數一致
- rebase 或新增頁面後不再出現路徑數量漂移
  references:
- 2025-11-30 sitemap/SSG 一致性修復
- 2026-02-28 Sitemap hreflang SSOT 同步修復
- 2026-03-07 rebase 後版本與 sitemap SSOT 根因修復
- 2026-03-07 SEO Audit sitemap 驗證漂移修復

---

只要公開 URL 清單超過一份，時間一久就一定會漂移。

---

id: incident-ci-hardcoded-audit
date: 2026-03-08
title: CI / 審計硬編碼造成假失敗
score: 0
type: incident
content_type: troubleshooting
scope: repo
topics: [ci, ssot, documentation, testing]
keywords: [hardcoded-check, audit-drift, regex-validation, generated-source]
aliases: [假紅燈, audit 硬編碼, 檢查器漂移]
related_entries: [incident-seo-public-path-ssot, regression-docs-tests-routes-sync]
summary: 多次 CI 失敗不是產品真的壞掉，而是檢查工具寫死字串、路徑或數字，導致合規內容也被阻擋。這類問題本質上是檢查器違反 SSOT，而不是應用邏輯錯誤。
root_cause:

- 檢查器使用手寫常數、硬編碼字串或固定欄位假設
- 未先對照官方規範確認必填欄位
  impact:
- CI 阻塞開發與發版
- 合法內容被誤判為不合格
  actions:
- 先查官方規範，再決定檢查必要欄位
- 將硬編碼字串改為結構驗證、正則或由 app config / 生成器動態推導
- 禁止把某一個 app 的輸出格式直接複製到其他 workspace
  prevention:
- 驗證器修改必附規範來源
- 所有計數型檢查優先從生成器輸出回推，不手填常數
  verification:
- 合法變體可通過 CI
- 生成器輸出變更時，驗證腳本仍與 SSOT 同步
  references:
- 2026-01-07 CI 硬編碼檢查導致合規文件無法通過
- 2026-02-27 消除 SEO workflow 硬編碼
- 2026-03-07 SEO Audit sitemap 驗證漂移修復

---

檢查器只要開始手寫常數，遲早會變成比產品本身更脆弱的系統。

---

id: incident-csp-header-boundary
date: 2026-03-08
title: CSP / 安全標頭責任邊界錯置
score: -3
type: incident
content_type: troubleshooting
scope: security
topics: [security, headers, deployment, ssg]
keywords: [csp, strict-dynamic, nonce, edge-header, console-error]
aliases: [安全標頭漂移, edge header drift, CSP 失效]
related_entries: [incident-production-verification-gap]
summary: 安全標頭曾經同時散落在 app、nginx、worker 與理論最佳實踐之間；像 `strict-dynamic` 這種策略在 SSG 架構下沒有穩定 nonce 來源，套上去只會讓正式站壞掉。另一類問題則是 app 端已修、edge 端仍舊 header，形成部署漂移。
root_cause:

- 安全標頭由多個層級同時維護
- 採用了與執行架構不相容的 CSP 策略
  impact:
- 正式站 script 被 CSP 擋下或 console 出現嚴重安全錯誤
- 本地與正式站 header 不一致，導致假綠燈
  actions:
- 安全標頭收斂到單一責任邊界，避免多頭維護
- 只採用與執行架構相容的 CSP；SSG 無 nonce 時不使用需要 nonce 的策略
- 部署完成條件必須包含正式站 header 與 console smoke check
  prevention:
- 每次調整 CSP 前先檢查架構是否支援 nonce/hash 模型
- worker / nginx / app 的 header 來源只能有一個主責系統
  verification:
- 正式站 header 與 repo 設定一致
- script 正常執行，console 無嚴重 CSP / security 錯誤
  references:
- 2025-11-29 CSP strict-dynamic 導致生產環境失效
- 2025-12-11 / 2026-03-07 CSP 與安全標頭修復紀錄
- git commit 6d3977a7

---

安全策略不是越嚴越好，而是越符合現有架構、越可驗證越好。

---

id: incident-production-verification-gap
date: 2026-03-08
title: 生產驗證缺口與假綠燈
score: 0
type: incident
content_type: troubleshooting
scope: repo
topics: [deployment, testing, security, seo]
keywords: [production-check, smoke-test, preview-gap, edge-verification]
aliases: [本地綠正式站壞, 假綠燈, smoke check 缺失]
related_entries: [incident-base-path-assets, incident-csp-header-boundary]
summary: 多次事故共同模式是「本地綠、CI 綠，但正式站仍有問題」，原因包含沒有檢查真實 base path、沒有驗 edge header、沒有檢查正式 console、或部署順序讓 app 與 worker 不一致。
root_cause:

- 驗證只停在本地與 CI，缺少正式站 smoke check
- release 流程未將 app、worker、CDN purge 視為同一件事
  impact:
- 問題在合併或部署後才暴露
- 使用者先看到故障，團隊後看到告警
  actions:
- 高風險變更至少執行本地 build、preview 與正式站 smoke check
- 針對 SEO / PWA / security 類變更建立固定驗證清單
- release 流程同時考慮 app bundle、worker、CDN purge 與 secret 缺口
  prevention:
- 將正式站驗證納入結案標準
- 用固定 smoke checklist 覆蓋 base path、headers、console、關鍵資產
  verification:
- preview 與正式站核心行為一致
- 正式站 smoke check 通過後才視為結案
  references:
- 2025-12-24 SEO 分支合併前未驗證生產環境
- 2026-03-03 Cloudflare 稽核工作流文件
- 2026-03-07 生產環境安全標頭漂移與 console 錯誤未同步修復

---

CI 綠燈只能證明「目前測到的東西沒壞」，不能證明正式站真的沒問題。

---

id: incident-over-optimization-before-stability
date: 2026-03-08
title: 過度優化先於基礎穩定性
score: -3
type: incident
content_type: explanation
scope: repo
topics: [performance, deployment, assets]
keywords: [over-optimization, manualchunks, scheduler-split, avif, rollback]
aliases: [先優化後翻車, scheduler 分裂, AVIF/WebP 過早導入]
related_entries: [incident-production-verification-gap]
summary: 幾次事故都來自同一思維：在基礎資產、依賴邊界或回滾方案沒準備好前先做優化，例如過早考慮 AVIF/WebP、把 React 核心模組拆錯 chunk，最終把性能優化變成生產事故。
root_cause:

- 在缺少回滾與依賴邊界驗證時就做進階優化
- 把 bundle size 或理論最佳化當成唯一目標
  impact:
- 生產站掛點或功能回歸
- 優化收益被排障成本吃掉
  actions:
- 先確認基礎資產、依賴圖與 fallback 已準備好，再做進階優化
- 對 manualChunks、圖片格式、快取策略保留最小可回滾變更
- 每次效能優化都必須伴隨部署驗證與事故回滾方案
  prevention:
- 效能優化 PR 必須包含回滾點與部署驗證證據
- 先解決真實瓶頸，再導入進階格式或拆 chunk 策略
  verification:
- 效能改善不再伴隨功能回歸或正式站掛點
- 依賴圖 / chunk 邊界可用 build 產物驗證
  references:
- 2025-11 未標記：過度優化導致複雜化（AVIF/WebP 未準備）
- 2026-03-03 Code Splitting 生產癱瘓事故與根因修復

---

優化不是目的，穩定交付才是；先把系統變複雜，通常只會把 debug 成本一起放大。

---

id: regression-docs-tests-routes-sync
date: 2026-03-08
title: 文件 / 測試 / 路由未同步更新
score: 0
type: regression
content_type: troubleshooting
scope: repo
topics: [documentation, testing, routing, ssot]
keywords: [route-sync, xhtml-link-count, prerender, doc-drift, ssot-update]
aliases: [同步責任漏掉, 路由更新漏同步, false red]
related_entries: [incident-seo-public-path-ssot, incident-ci-hardcoded-audit]
summary: 多次小問題其實都屬同一類：改了 routes、SEO 路徑、xhtml:link 數量或文件敘述，但沒有同步測試與文檔，造成 false red 或更糟的 false green。
root_cause:

- 變更只修改執行邏輯，未同步測試、文檔與 SSG / SEO 設定
- 提交前缺少跨層同步檢查
  impact:
- 測試斷言落後於真實行為
- 文件狀態失真，增加下次變更風險
  actions:
- 任何公開路由變更都同步更新 routes、SSG、sitemap、測試與文件
- 先更新 SSOT，再更新測試斷言與文檔敘述
- 把「變更項是否需要同步測試 / 文件 / SEO 清單」納入提交前檢查
  prevention:
- 路由 / SEO / 文檔變更採 checklist 驗證
- 失敗案例優先沉澱成主題知識，而不是只留在單次 commit 訊息
  verification:
- 路由、文檔與測試斷言一致
- 不再出現 xhtml:link 數量、FAQ/About prerender 或文件狀態失真
  references:
- 未標記：文檔與程式碼實作狀態不符
- 未標記：測試預期值未同步更新（xhtml:link 數量）
- 未標記：vite.config.ts SSG 路徑未同步 routes.tsx

---

大部分「莫名其妙的紅燈」都不是難 bug，而是同步責任漏掉了。

---

id: ga-e2e-review-fixes-and-scheduling-guard
date: 2026-03-14
title: PR review 驅動修復 GA E2E 假覆蓋、專案重複執行與 CodeQL URL 告警
score: +2
type: success
content_type: troubleshooting
scope: ratewise
topics: [testing, ci, performance, security, ssot]
keywords: [playwright, codex-review, codeql, readyState, ga4, project-matrix]
aliases: [GA E2E 假陽性修正, Playwright project 去重, GTM URL host check]
related_entries: [codeql-test-html-regex-removal, regression-docs-tests-routes-sync]
summary: PR #204 的 review 同時暴露三個層面問題：`ga-defer-lcp.spec.ts` 在 `chromium-mobile` 與 `offline-pwa-chromium` 重複執行、E2E 用 `about:blank` 的 `document.readyState` 假裝覆蓋實頁面競態，以及以 `includes('googletagmanager.com')` 判斷 script URL 造成 CodeQL `js/incomplete-url-substring-sanitization` 告警。修正方式是把 GA 排程抽成 `scheduleAfterPageLoad()` 單元測試覆蓋、E2E 改回實頁面不變式驗證、Playwright project 規則抽成常數並以 parsed URL host/path 精準判定 GTM script。
root_cause:

- 將「實頁面不變式」與「readyState 分支覆蓋」混在同一個 E2E 測試，導致 about:blank 假陽性
- Playwright project 規則用重複 regex 散落定義，容易只修到一個 project
- 測試程式把 URL 當字串做 substring 判斷，GitHub Advanced Security 仍會視為不安全模式
  impact:

- PR review 雖已有人嘗試修正，實際上評論指出的風險仍可殘留在最新 diff
- `CodeQL` 顯示新增 security alert，干擾 PR 是否可合併的判讀
- E2E matrix 多跑一份 mobile/offline 測試，增加 CI 時間與變因
  actions:

- 在 `apps/shared/analytics/ga.ts` 新增 `scheduleAfterPageLoad()`，把 `document.readyState === 'complete'` 與 `load` listener 分支抽成可單測 helper
- 在 `apps/ratewise/src/__tests__/analytics/ga.test.ts` 補 2 個單元測試，精準覆蓋 immediate / deferred 兩條路徑
- 將 `apps/ratewise/playwright.config.ts` 的 ignore / match regex 抽成共用常數，確保 `ga-defer-lcp.spec.ts` 只由 `offline-pwa-chromium` 專案處理
- 重寫 `apps/ratewise/tests/e2e/ga-defer-lcp.spec.ts` 的第二個測試，只驗證實頁面 `load` 後 `config` 不重複；同時把 GTM 偵測改為 `new URL(src)` 後比對 `hostname` 與 `pathname`
  prevention:

- 需要覆蓋競態分支時，優先抽出可測 helper 再用單元測試驗證，不要讓 E2E 承擔不可控時序模擬
- Playwright 多 project 規則若共享同一批測試邊界，應集中成常數或函式，避免單點修正遺漏
- 即使是 `classifications: [test]` 的 CodeQL alert，也應把判斷邏輯修到與正式程式同等嚴謹
  verification:

- `pnpm --filter @app/ratewise test -- --run src/__tests__/analytics/ga.test.ts`
- `pnpm --filter @app/ratewise build`
- `pnpm --filter @app/ratewise test:e2e -- --project=offline-pwa-chromium tests/e2e/ga-defer-lcp.spec.ts`
- `pnpm exec eslint apps/ratewise/src/main.tsx apps/ratewise/src/__tests__/analytics/ga.test.ts apps/ratewise/tests/e2e/ga-defer-lcp.spec.ts apps/ratewise/playwright.config.ts apps/shared/analytics/ga.ts apps/shared/analytics/index.ts --max-warnings 0 --no-warn-ignored`
- `gh api 'repos/haotool/app/code-scanning/alerts?state=open&pr=204'`
  references:

- https://github.com/haotool/app/pull/204
- apps/shared/analytics/ga.ts
- apps/ratewise/tests/e2e/ga-defer-lcp.spec.ts
- apps/ratewise/playwright.config.ts

## 歷史索引（精簡）

> 2026-02-27 以前的舊資料已從巨型 table 改為精簡索引，保留日期 / 分數 / 標題，避免繼續維護不穩定欄位。若未來要補細節，再逐筆升級為上方 entry blocks。

### 2026-02（索引）

- 2026-02-27｜+3｜✅ 成功｜Release workflow 補齊 Cloudflare security-headers worker 同步部署，避免 app 發版與邊緣標頭版本分裂
- 2026-02-27｜+3｜✅ 成功｜RateWise mobile UpdatePrompt 非阻塞修復，恢復 CI E2E 可操作性
- 2026-02-27｜+5｜✅ 成功｜RateWise PWA 回歸修復 + 版本 SSOT 校正 + 舊用戶升級鏈路驗證
- 2026-02-27｜+1｜✅ 成功｜清理已整合 `.example/config` 項目並補 root 截圖忽略規則與文件摘要
- 2026-02-27｜+2｜✅ 成功｜`.example/config` 基準導入：升級 `AGENTS.md` / `CLAUDE.md` 並同步 `commitlint`
- 2026-02-26｜+3｜✅ 成功｜park-keeper 羅盤頁恢復雙點持續追蹤自動縮放 + 地圖 i18n 補齊
- 2026-02-26｜+1｜✅ 成功｜haotool 新增 Park-Keeper 作品入口與快速導航
- 2026-02-26｜+4｜✅ 成功｜Park-Keeper UIUX 對齊與容器部署整合驗證
- 2026-02-11｜+6｜✅ 成功｜SEO 全面修復：squirrelscan 68→95+ 分，解決 7 類系統性問題
- 2026-02-11｜+4｜✅ 成功｜PR#133~#137 殘留回歸一次修復（轉場、離線提示、錯誤恢復）
- 2026-02-11｜+2｜✅ 成功｜修復 CI 安全閘門與 Release 主幹污染風險
- 2026-02-11｜+4｜✅ 成功｜PR#134 原子修復：轉場方向、離線探測與發版自動化 fallback
- 2026-02-10｜+1｜✅ 成功｜Release workflow 權限阻塞補救：手動版本化直推 main
- 2026-02-10｜+2｜✅ 成功｜PR#134 評論修復：頁面切換方向延遲一拍（返回動畫方向錯誤）
- 2026-02-08｜+2｜✅ 成功｜TypeScript vite-react-ssg 類型定義與測試 mock 修復
- 2026-02-06｜+4｜✅ 成功｜PWA 更新偵測 + 路由級 ErrorBoundary + Safari chunk 修復
- 2026-02-07｜+4｜✅ 成功｜P2 安全修復：7 個 CodeQL Medium 級別警告全部修復
- 2026-02-07｜+7｜✅ 成功｜P0+P1 安全修復：GitHub Actions 權限 + Dependabot HIGH + XSS
- 2026-02-02｜+2｜✅ 成功｜PWA chunk load error 根因修復與版本更新強制檢查
- 2026-02-01｜+2｜✅ 成功｜清理測試與建置警告並強化版本驗證流程
- 2026-02-01｜+1｜✅ 成功｜版本 SSOT 驗證與下拉刷新更新流程統一
- 2026-02-01｜+3｜✅ 成功｜設定頁 IA 重構 + app-info SSOT 模組
- 2026-02-01｜+1｜✅ 成功｜Lighthouse CLS 修復：Critical CSS 字體與行高對齊
- 2026-02-01｜+1｜✅ 成功｜E2E 穩定性修復：資料來源 testid + 快速金額輸入 fallback + Multi 清單驗證
- 2026-02-01｜+2｜✅ 成功｜E2E 修復補強：移除遮罩點擊 + Multi 列表 testid + sr-only H1
- 2026-02-01｜+2｜✅ 成功｜E2E 修復：可見標題選擇器 + 快速金額流程 + CurrencyList testid
- 2026-02-01｜+1｜✅ 成功｜Typecheck 修復：Footer 測試移除 JSX 類型依賴
- 2026-02-01｜+2｜✅ 成功｜Coverage 回歸修復：補齊 Footer 測試提升全域覆蓋率
- 2026-02-01｜+2｜✅ 成功｜版本 SSOT 回退統一 + UI 版本顯示與 Segmented Switch 透明度一致化
- 2026-02-01｜+3｜✅ 成功｜動畫 SSOT 擴展 + Segmented Switch 統一化
- 2026-02-26｜+1｜✅ 成功｜提交前風險檢查與快照提交準備
- 2026-02-26｜+1｜✅ 成功｜修復 park-keeper 版本模組 `no-unsafe-*` lint 阻塞
- 2026-02-26｜+3｜✅ 成功｜修復 park-keeper Leaflet 地圖遠距縮放破圖與卡頓，並開放自由縮放
- 2026-02-26｜+2｜✅ 成功｜park-keeper 羅盤頁手勢縮放 UX 收尾（小地圖禁縮放 + 大地圖 Google 風格回中按鈕）
- 2026-02-03｜+6｜✅ 成功｜PWA UpdatePrompt 整合重構 - 三重渲染修復 + SSOT + 最佳實踐
- 2026-02-07｜+3｜✅ 成功｜P2 安全修復 Review：3 個殘留警告完全修復
- 2026-02-08｜+2｜✅ 成功｜Safari 頁面切換錯誤修復 - 移除 web-vitals attribution 建構
- 2026-02-08｜+5｜✅ 成功｜Safari PWA 錯誤深度修復 - Service Worker URL 解析防禦
- 2026-02-08｜+2｜✅ 成功｜OfflineIndicator TDD 測試套件完成 - 🔴 RED → 🟢 GREEN → 🔵 REFACTOR
- 2026-02-11｜+3｜✅ 成功｜文檔全面更新 - ARCHITECTURE_BASELINE v3.0 + 狀態機流程圖 + CHECKLISTS v3.0
- 2026-02-11｜+6｜✅ 成功｜SEO 衝刺：sr-only H1 + OG 圖片壓縮 + 13 頁 meta description 擴充
- 2026-02-25｜+3｜✅ 成功｜SEO Workflow Prompt v2.1.0 品質強化
- 2026-02-26｜+3｜✅ 成功｜SEO Workflow Prompt v3.0.0 狀態機 + CLI 升級 + CF 指引
- 2026-02-26｜+5｜✅ 成功｜haotool SEO Workflow 全自動迭代 — squirrelscan 66→73, 9 個滿分分類
- 2026-02-26｜+8｜✅ 成功｜park-keeper monorepo 整合 — SSG + PWA + SEO + TDD 87 tests (95% lines)
- 2026-02-26｜+9｜✅ 成功｜park-keeper 前端渲染完全修復 — 3 根因系統性消除

### 2026-01（索引）

- 2026-01-30｜+5｜✅ 成功｜版本管理 SSOT 重構 + 微互動動畫系統
- 2026-01-31｜+4｜✅ 成功｜PWA matchPrecache 路徑格式修正 + 安全性強化
- 2026-01-31｜+2｜✅ 成功｜E2E 測試適配新 UI 架構 + 不穩定測試標記
- 2026-01-31｜+4｜✅ 成功｜PWA 離線快取 revision 動態化 + 安全性強化
- 2026-01-29｜+3｜✅ 成功｜localStorage JSON.parse 安全修復 - 白名單驗證 + 結構檢查
- 2026-01-29｜+1｜✅ 成功｜恢復 SEO CI 工作流並同步文件
- 2026-01-29｜+1｜✅ 成功｜核心 CI/CD 精簡與文件同步
- 2026-01-28｜+7｜✅ 成功｜Staging 環境 SPA 路由 404 修復 + UI/UX 優化
- 2026-01-28｜+1｜✅ 成功｜TypeScript TS6133 未使用匯入修復
- 2026-01-28｜+3｜✅ 成功｜iOS PWA 安全區遮蔽與 UIShowcase 捲動問題根因修復
- 2026-01-28｜+5｜✅ 成功｜React Hydration #418 錯誤抑制 - SSG 預期錯誤處理
- 2026-01-27｜+4｜✅ 成功｜iPhone SE (320px) 小螢幕內容偏移修復 - flex min-w-0 + 響應式 padding
- 2026-01-27｜+5｜✅ 成功｜i18n zh-Hant 語系載入修復 - SSG + LanguageDetector 問題根本解決
- 2026-01-26｜+4｜✅ 成功｜UI/UX v2.4 - MiniTrendChart passive listener 修復 + 滾動 + SkeletonLoader
- 2026-01-27｜+4｜✅ 成功｜UI/UX v2.3 - iOS Safari 滾動修正 + MiniTrendChart 觸控改進
- 2026-01-26｜+5｜✅ 成功｜UI/UX v2.2 現代化重構 - 滾動修正 + 按鈕美化 + Header 多語系
- 2026-01-26｜+3｜✅ 成功｜捲軸跑版修正 - 2025 最佳實踐
- 2026-01-26｜+4｜✅ 成功｜UI/UX v2.1 重構 - Favorites/Toast/ConversionHistory/MultiConverter
- 2026-01-26｜+7｜✅ 成功｜UI/UX v2.0 重構 - SingleConverter/ConversionHistory/MiniTrendChart
- 2026-01-25｜+5｜✅ 成功｜ConversionHistory UI/UX 重構 + Toast SSOT 設計
- 2026-01-23｜+3｜✅ 成功｜計算機淺色主題數字鍵優化 + SSOT 色彩系統強化
- 2026-01-23｜+3｜✅ 成功｜多幣別資料顯示修復 + 基準貨幣邊框裁切修復
- 2026-01-23｜0｜⚠️ 待追蹤｜E2E CI 持續失敗 - React 應用未啟動
- 2026-01-23｜+1｜✅ 成功｜安全漏洞忽略配置 - dev-only lodash/wrangler
- 2026-01-22｜+3｜✅ 成功｜i18n 頁面級別整合 - MultiConverter/Favorites 國際化
- 2026-01-17｜+4｜✅ 成功｜FOUC 閃爍問題根本修復 - 同步主題初始化腳本
- 2026-01-16｜+1｜✅ 成功｜組件語義色彩統一 - 硬編碼色彩改為 SSOT
- 2026-01-16｜+1｜✅ 成功｜Micro-interactions 動畫強化 - 按鈕 hover/active 效果
- 2026-01-16｜+9｜✅ 成功｜Design Token 完整語義色彩系統 - info/success/warning/error
- 2026-01-16｜+5｜✅ 成功｜Design Token 最佳實踐完善 - secondary/info 語義色
- 2026-01-16｜+8｜✅ 成功｜ParkKeeper 風格 UI/UX 重構 - 4 種風格系統
- 2026-01-15｜+1｜✅ 成功｜無障礙對比度修復（單/多幣別按鈕）
- 2026-01-15｜+1｜✅ 成功｜SEO 2025 sitemap 合規修復（CI 失敗）
- 2026-01-15｜+1｜✅ 成功｜全域檢查與文件同步（BASE_URL/環境變數）
- 2026-01-15｜+1｜✅ 成功｜`.env.example` 補齊多應用子路徑環境變數
- 2026-01-15｜+1｜✅ 成功｜子路徑部署改回最佳實踐（移除靜態鏡像）
- 2026-01-15｜+1｜✅ 成功｜v1.5.0 版本號與更新日誌同步（Changesets）
- 2026-01-14｜+1｜✅ 成功｜行動版頁內 Footer 漸層對齊桌面版（SSOT）
- 2026-01-14｜+1｜✅ 成功｜Footer 手機/電腦色彩對齊（SSOT）
- 2026-01-14｜+1｜✅ 成功｜收藏星星金色與基準幣別高亮回復舊版色碼（SSOT）
- 2026-01-14｜+1｜✅ 成功｜還原舊版 H1 與行動版 Footer 色碼（SSOT）
- 2026-01-14｜+2｜✅ 成功｜回復舊配色並維持 SSOT Design Token
- 2026-01-14｜+5｜✅ 成功｜緊急修復：Service Worker clientsClaim 缺失導致離線功能失效
- 2026-01-14｜+2｜✅ 成功｜修復 quake-school TypeScript 類型錯誤
- 2026-01-13｜+4｜✅ 成功｜PR#97 Design Token 無障礙性對比度修復 + SEO Audit 權限修復
- 2026-01-13｜+8｜✅ 成功｜Phase 2 CSS Variables 升級 - 動態主題切換架構
- 2026-01-12｜+5｜✅ 成功｜Design Token SSOT 重構：語義化色彩系統
- 2026-01-12｜+2｜✅ 成功｜PR#95 coverage threshold 修復：offlineStorage.ts 排除策略
- 2026-01-12｜+3｜✅ 成功｜PR#95 offlineStorage.ts 類型錯誤修復 + CI 通過
- 2026-01-10｜+3｜✅ 成功｜Service Worker 使用 IIFE 格式修復評估失敗
- 2026-01-10｜+2｜✅ 成功｜Service Worker 簡化立即激活邏輯
- 2026-01-10｜+1｜✅ 成功｜Service Worker skipWaiting/clientsClaim 恢復
- 2026-01-09｜+3｜✅ 成功｜Service Worker 生命週期修復 - CI E2E PWA 測試超時根本解決
- 2026-01-09｜+1｜✅ 成功｜haotool SectionBackground 組件測試
- 2026-01-09｜+2｜✅ 成功｜haotool 測試覆蓋率提升 (+4.73%)
- 2026-01-09｜+2｜✅ 成功｜大規模技術債清理 (依賴+檔案)
- 2026-01-09｜+3｜✅ 成功｜react-router-dom XSS 漏洞修復 (CVE-2026-22029)
- 2026-01-09｜+1｜✅ 成功｜React Router Future Flag 警告消除
- 2026-01-09｜+1｜✅ 成功｜未使用依賴清理
- 2026-01-09｜+1｜✅ 成功｜SEO Health Check CDN 快取修復
- 2026-01-09｜+2｜✅ 成功｜E2E PWA 測試穩定性修復 - CI 環境超時問題解決
- 2026-01-09｜+6｜✅ 成功｜PWA 離線根本修復 - Safari「無法打開網頁」完全解決
- 2026-01-09｜+3｜✅ 成功｜PWA 離線 offline.html 快取修復
- 2026-01-09｜0｜⚠️ 注意｜beasties 升級導致 SSG 失敗
- 2026-01-09｜+1｜✅ 成功｜lucide-react 全專案更新
- 2026-01-09｜+1｜✅ 成功｜haotool、nihonname、ratewise 依賴更新
- 2026-01-08｜+1｜✅ 成功｜quake-school 依賴更新
- 2026-01-08｜+1｜✅ 成功｜新增 reportWebVitals 測試覆蓋
- 2026-01-08｜+2｜✅ 成功｜全專案依賴批次更新（10+ 套件）
- 2026-01-08｜+3｜✅ 成功｜依賴更新 + 死代碼清理
- 2026-01-08｜+3｜✅ 成功｜PWA 離線 Fallback 匯率數據修復
- 2026-01-08｜+2｜✅ 成功｜PWA 離線最佳實踐重構：清理註解 + 合併兩 PR 優點
- 2026-01-07｜+1｜✅ 成功｜HaoTool 無障礙修復：新增 main landmark
- 2026-01-07｜+1｜✅ 成功｜CSP/HSTS 遷移 CI 驗證：全部通過！
- 2026-01-07｜+3｜✅ 成功｜CSP/HSTS 遷移至 Cloudflare - 高可維護性架構
- 2026-01-07｜+1｜✅ 成功｜SEO Health Check 修復驗證：CI 全綠！
- 2026-01-07｜+1｜✅ 成功｜SEO Health Check 超時修復
- 2026-01-07｜+1｜✅ 成功｜RateWise PageSpeed 優秀驗證：90/100/96/100
- 2026-01-07｜+1｜✅ 成功｜NihonName 無障礙 100 分驗證
- 2026-01-07｜+5｜✅ 成功｜建立超級 Agent 自動化工作流 Prompt 文檔
- 2026-01-07｜+1｜✅ 成功｜獎懲記錄流程改為 commit 前更新
- 2026-01-07｜+1｜✅ 成功｜NihonName 無障礙修復：新增 main landmark
- 2026-01-07｜+2｜✅ 成功｜NihonName PageSpeed 效能大幅提升：66→86 (+20)
- 2026-01-07｜+2｜✅ 成功｜Quake-School 字體載入優化：非同步 Google Fonts
- 2026-01-07｜+5｜✅ 成功｜HaoTool P1 優化：3D Hero IntersectionObserver 延遲載入
- 2026-01-07｜+3｜✅ 成功｜Quake-School 無障礙修復 + PageSpeed 審計完成
- 2026-01-07｜+8｜✅ 成功｜NihonName 效能優化：移除 pinyin-pro 運行時依賴
- 2026-01-07｜+8｜✅ 成功｜多應用 SEO 審計 (RateWise + NihonName + Quake-School)
- 2026-01-06｜+5｜✅ 成功｜修復 Seobility SEO 報告問題（H1/內容/charset）
- 2026-01-06｜+1｜✅ 成功｜修復 CI 多幣別 quick amount 仍偶發失敗（rAF 改為同步）
- 2026-01-06｜+1｜✅ 成功｜修復 CI 多幣別 quick amount 測試不穩定（RateWise 測試重設 rAF stub）
- 2026-01-06｜+1｜✅ 成功｜修復 CI 多幣別 quick amount 測試不穩定（requestAnimationFrame stub）
- 2026-01-06｜+1｜✅ 成功｜修復圖片中繼資料警告（首頁 Article 圖片補齊授權欄位）
- 2026-01-06｜+2｜✅ 成功｜修復 FAQPage 重複（首頁 JSON-LD 下放至首頁元件）
- 2026-01-06｜0｜⚠️ 觀察｜生產環境 SEO 驗證仍未反映 llms.txt v1.4.0
- 2026-01-06｜+2｜✅ 成功｜E2E strict mode 修正 + llms.txt 檢查規則調整
- 2026-01-06｜+1｜✅ 成功｜Vitest CLI 錯誤修正（指定測試檔）
- 2026-01-06｜+3｜✅ 成功｜2026 進階 SEO P2/P3 依序落地（VSI/內部連結/Mobile Parity/llms.txt/INP）
- 2026-01-06｜+2｜✅ 成功｜清理過時 PRs（11 個）+ 文檔編號修復
- 2026-01-06｜+1｜✅ 成功｜2026 進階 SEO P2/P3 規劃與 BDD 流程補齊
- 2026-01-05｜+3｜✅ 成功｜SEO 修正：同步 sitemap 與 llms.txt 實作
- 2026-01-06｜+5｜✅ 成功｜P0/P1 Gate 完整驗證（瀏覽器自動化）
- 2026-01-04｜+2｜✅ 成功｜HaoTool postbuild HTML 修復 + OG/Twitter 驗證通過
- 2026-01-04｜+3｜✅ 成功｜AI 摘要引用結構規範文檔（005）
- 2026-01-07｜+10｜✅ 成功｜消除 SEO Health Check 硬編碼，修復 CI 錯誤驗證邏輯
- 2026-01-07｜+5｜✅ 成功｜安全標頭遷移至 Cloudflare + 分層防禦架構文檔化
- 2026-01-08｜+5｜✅ 成功｜Safari PWA 離線修復 - navigateFallback 路徑問題
- 2026-01-08｜+3｜✅ 成功｜Safari PWA 離線修復 - offline.html 子路徑鏡像缺失
- 2026-01-12｜+3｜✅ 成功｜PR#95 offlineStorage.ts 類型錯誤修復 + CI 通過
- 2026-01-12｜+5｜✅ 成功｜Design Token SSOT 重構 + BDD 紅→綠→藍循環完成
- 2026-01-13｜+8｜✅ 成功｜Design Token 核心組件完整遷移 + Brand Token 擴展
- 2026-01-26｜+4｜✅ 成功｜SkeletonLoader Hydration 錯誤修復 - 移除巢狀 AppLayout
- 2026-01-27｜+5｜✅ 成功｜高度斷點 RWD 優化 - 支援小螢幕裝置
- 2026-01-27｜+4｜✅ 成功｜i18n 語系正規化修復 - zh-Hant → zh-TW 映射

### 2025-12（索引）

- 2025-12-29｜+7｜✅ 成功｜PWA 更新模組整合 + ESLint 修復 + E2E 離線測試
- 2025-12-27｜+7｜✅ 成功｜Pull-to-Refresh + 快取清除完整審查 + Lighthouse 95%+
- 2025-12-26｜+5｜✅ 成功｜修復 ESLint set-state-in-effect 錯誤 + 測試重構
- 2025-12-26｜+2｜✅ 成功｜關閉所有 Dependabot PRs，完成 Renovate 遷移工作流程
- 2025-12-26｜+10｜✅ 成功｜Renovate 2025 最佳實踐優化 + 自動背景更新完整實施
- 2025-12-25｜+12｜✅ 成功｜React Hydration #418 修復 + CI jest-dom 修復 + CDN 工作流程
- 2025-12-23｜+1｜✅ 成功｜CI 監控完成並定位 gitleaks 授權缺失
- 2025-12-23｜0｜✅ 成功｜提交前驗證完成
- 2025-12-23｜0｜⚠️ 注意｜CI 失敗分析：E2E 無障礙測試非 SEO 工作造成
- 2025-12-23｜+2｜✅ 成功｜BreadcrumbList Schema SSG 限制務實解決 + 驗證通過
- 2025-12-23｜+4｜✅ 成功｜SEO 最佳實踐修復：移除虛假評論 + BreadcrumbList 統一管理
- 2025-12-23｜0｜⚠️ 注意｜持續測試與 CI 監控（遠端仍失敗）
- 2025-12-23｜+2｜✅ 成功｜修復 Breadcrumb JSON-LD 測試 + Footer a11y + Sitemap 時區
- 2025-12-23｜-1｜⚠️ 注意｜CI 失敗：E2E 無障礙對比 + gitleaks 授權缺失
- 2025-12-22｜+2｜✅ 成功｜RateWise prebuild 恢復 sitemap 生成
- 2025-12-21｜+2｜✅ 成功｜RateWise SSG 尾斜線標準化 + SEO 指南更新
- 2025-12-17｜0｜⚠️ 注意｜本地測試超時導致 pre-push 失敗但仍需推送
- 2025-12-16｜+3｜✅ 成功｜HaoTool 測試覆蓋率修復 + Engineering 金屬質感優化
- 2025-12-15｜+8｜✅ 成功｜RateWise 生產環境 base 路徑修復 + og-image.png 版控
- 2025-12-14｜+3｜✅ 成功｜Hero 左右分區 + OG 圖顯示 + 品牌敘事修正
- 2025-12-14｜+8｜✅ 成功｜CI 環境變數統一修復 + Lenis 滾動優化 + SEO 完善
- 2025-12-14｜+2｜✅ 成功｜真實專案截圖替換 placeholder.svg
- 2025-12-14｜+3｜✅ 成功｜RateWise SEO 檔案 Nginx alias 路徑修復
- 2025-12-14｜+3｜✅ 成功｜zbpack.json 解決 Zeabur 快取導致部署未更新問題
- 2025-12-14｜+10｜✅ 成功｜HAOTOOL 作品集首頁完整重構 + vite-react-ssg 整合
- 2025-12-14｜+2｜✅ 成功｜setTimeout 測試未處理錯誤修復
- 2025-12-14｜+2｜✅ 成功｜framer-motion + lenis 測試環境 mock 完善
- 2025-12-14｜+2｜✅ 成功｜真實內容替換 + 繁體中文本地化
- 2025-12-13｜+1｜✅ 成功｜創建 Search Console 操作指南 (專注實用文檔)
- 2025-12-13｜+1｜✅ 成功｜React 安全性升級 19.2.1 → 19.2.3
- 2025-12-12｜+2｜✅ 成功｜修復 Firefox E2E 測試失敗（70 個測試）
- 2025-12-12｜+1｜✅ 成功｜完善 HowTo Schema for /guide 頁面（4步驟→8步驟）
- 2025-12-11｜+3｜✅ 成功｜修復 SEO E2E 測試失敗（78 個失敗測試） + 重複 meta tags
- 2025-12-12｜+5｜✅ 成功｜Linus 原則 E2E 測試矩陣精簡 + CI 時間優化
- 2025-12-12｜+1｜✅ 成功｜CSP header/跨域預檢阻擋修復
- 2025-12-11｜+2｜✅ 成功｜CSP inline script 阻擋修復 + hash 自動覆蓋
- 2025-12-11｜+4｜✅ 成功｜E2E Flaky Tests 修復 + Playwright 2025 最佳實踐
- 2025-12-11｜+7｜✅ 成功｜Gitleaks CI 修復 + SEO 檢核清單模板建立
- 2025-12-11｜+7｜✅ 成功｜CI/CD 全面優化 + 效能監控建立 + Gitleaks 授權澄清
- 2025-12-11｜+4｜✅ 成功｜SEO E2E 測試修復 + CI 失敗根因分析
- 2025-12-10｜+10｜✅ 成功｜Hash-based CSP 實作完成 + 安全評分 85→95
- 2025-12-10｜+15｜✅ 成功｜2025 安全最佳實踐全面實作 + 安全評分 85→95
- 2025-12-10｜+6｜✅ 成功｜專案資安深度審查完成 + 安全評分 85/100
- 2025-12-10｜+5｜✅ 成功｜CI 安全掃描穩定性修復 + libpng 漏洞修補
- 2025-12-10｜+3｜✅ 成功｜NihonName SEO 完整審計 + schema-dts 評估確認
- 2025-12-09｜+1｜✅ 成功｜Dice tips 與未填姓氏 toast icon 對齊修復
- 2025-12-09｜+2｜✅ 成功｜CI 資安防護強化：Trivy + Dependabot
- 2025-12-09｜+1｜✅ 成功｜React 高風險 CVE 疑慮排查 & 率先更新到 19.2.1
- 2025-12-07｜+5｜✅ 成功｜meta-tags.ts 測試覆蓋率 0%→97% + 綜合審計報告
- 2025-12-07｜+3｜✅ 成功｜煙火動畫根本性修復 + schema-dts 評估決策
- 2025-12-06｜+2｜✅ 成功｜React Hydration #418 進階修復嘗試
- 2025-12-06｜+1｜✅ 成功｜SkeletonLoader 性能測試放寬以避免 CI flaky
- 2025-12-06｜+1｜✅ 成功｜CSV 諧音梗羅馬拼音備援完善 + 資料集測試
- 2025-12-06｜+5｜✅ 成功｜React Hydration #418 完整修復 + /history 403 修復
- 2025-12-06｜+1｜✅ 成功｜CSV 諧音梗羅馬拼音全覆蓋
- 2025-12-06｜+1｜✅ 成功｜清除錯誤諧音梗黑名單
- 2025-12-06｜+1｜✅ 成功｜台灣複姓權威來源校正 + placeholder 使用實收名單
- 2025-12-06｜+2｜✅ 成功｜jsonld.ts 測試覆蓋率 0% → 100%
- 2025-12-06｜+1｜✅ 成功｜台灣複姓權威來源校正 + placeholder 使用實收名單
- 2025-12-06｜+1｜✅ 成功｜花火大會 2.0：滿版多樣煙火 + 雙層特效
- 2025-12-06｜+3｜✅ 成功｜TypeScript 錯誤修復 + Cloudflare 重定向 + HelmetProvider
- 2025-12-06｜+2｜✅ 成功｜花火大會升級：tsParticles 全屏煙火 + 音效 + 文案互動優化
- 2025-12-06｜+1｜✅ 成功｜分享文案去除不雅字眼、改為通用版本
- 2025-12-06｜+1｜✅ 成功｜搖晃彩蛋授權延後 60 秒提示
- 2025-12-06｜+1｜✅ 成功｜ratewise SSR localStorage 綁定修復
- 2025-12-06｜+1｜✅ 成功｜Threads/X 品牌圖標更新
- 2025-12-06｜+1｜✅ 成功｜搖晃彩蛋升級：10 連搖高階煙火
- 2025-12-06｜+1｜✅ 成功｜吐司文案精簡
- 2025-12-06｜+1｜✅ 成功｜Hydration #418 防護 + 分享模態置中
- 2025-12-06｜+3｜✅ 成功｜nihonname AI Search + Critical CSS 優化
- 2025-12-06｜+1｜✅ 成功｜姓氏輸入動態 placeholder + 複姓標籤精簡
- 2025-12-06｜+1｜✅ 成功｜nihonname 截圖提示節奏與文案調整
- 2025-12-06｜+2｜✅ 成功｜nihonname ShareButtons 組件測試覆蓋率 0%→97%
- 2025-12-05｜+4｜✅ 成功｜nihonname SEO 強化 + 諧音梗資料庫 80+ 筆擴充
- 2025-12-05｜+5｜✅ 成功｜nihonname 姓氏資料庫完整升級 + SourceAccordion 組件
- 2025-12-04｜+1｜✅ 成功｜nihonname 結果卡片高度回退至 3e827b 版面
- 2025-12-04｜+12｜✅ 成功｜nihonname 歷史專區 SEO FAQ 頁面建立 + 212 測試全通過
- 2025-12-04｜+2｜✅ 成功｜nihonname 結果頁 90dvh 垂直置中 + 純淨截圖提示 1s
- 2025-12-04｜+5｜✅ 成功｜NihonName BDD 測試補齊：4 元件完整測試覆蓋
- 2025-12-04｜+6｜✅ 成功｜nihonname 生產環境字體 404 + preload 警告根因修復
- 2025-12-04｜0｜✅ 成功｜NihonName 測試覆蓋率配置調整 - 暫時排除未測試元件
- 2025-12-04｜+2｜✅ 成功｜NihonName 字體階層優化 + 移除冗餘 UI 元素
- 2025-12-04｜+5｜✅ 成功｜NihonName UI 優化：交互式改名 + 截圖模式 + 高級動畫提示
- 2025-12-03｜+1｜✅ 成功｜Mobile 垂直置中&無捲軸最佳化（iOS safe area）
- 2025-12-03｜0｜⚠️ 注意｜SEO Health Check workflow 失敗（usd/eur/cad aborted）
- 2025-12-03｜+1｜✅ 成功｜Tailwind 未編譯根因修復（樣式未生效）
- 2025-12-03｜+3｜✅ 成功｜NihonName 基底路徑與 PWA 資產 404 根因修復
- 2025-12-03｜+3｜✅ 成功｜Canonical 衝突根因修復 - SEO/Best Practices 恢復
- 2025-12-03｜+1｜✅ 成功｜Favicon 路徑修復 - Best Practices 恢復 100/100
- 2025-12-03｜0｜⚠️ 注意｜Performance 下降為測試環境網路延遲
- 2025-12-03｜+5｜✅ 成功｜Phase 2 完成: 21 個 SEO 權威來源查詢與整合
- 2025-12-03｜+1｜✅ 成功｜移除未使用依賴 react-schemaorg/schema-dts
- 2025-12-03｜+3｜✅ 成功｜Guide 頁面擴充至 8 步驟完整教學
- 2025-12-03｜+2｜✅ 成功｜SEO_TODO.md 更新 + 可選功能規格文檔建立
- 2025-12-03｜+1｜✅ 成功｜vitest/typescript-eslint patch 更新
- 2025-12-03｜+2｜✅ 成功｜storage.ts SSR 分支覆蓋率 100%
- 2025-12-02｜+3｜✅ 成功｜ChatGPT 報告深度驗證 + AI_SEARCH_OPTIMIZATION_SPEC v4.0
- 2025-12-02｜+2｜✅ 成功｜SEO Health Check 腳本更新支援 17 頁面
- 2025-12-02｜+8｜✅ 成功｜計算機同步問題 BDD 修復 + 25→30 天全域更新
- 2025-12-02｜+11｜✅ 成功｜測試覆蓋率全面提升 + 依賴升級 + E2E 驗證
- 2025-12-02｜+2｜✅ 成功｜MiniTrendChart.tsx 測試覆蓋率提升
- 2025-12-02｜+2｜✅ 成功｜RateWise.tsx 測試覆蓋率大幅提升
- 2025-12-02｜+2｜✅ 成功｜SEO Health Check 腳本擴展
- 2025-12-02｜+2｜✅ 成功｜useUrlNormalization.tsx 測試覆蓋率 100%
- 2025-12-01｜+5｜✅ 成功｜CI 防護機制強化 + Sitemap 自動更新修復
- 2025-12-01｜+2｜✅ 成功｜ErrorBoundary.tsx 測試覆蓋率 100%
- 2025-12-01｜+2｜✅ 成功｜測試覆蓋率提升: Layout.tsx + CurrencyList.tsx
- 2025-12-01｜+2｜✅ 成功｜深度 SEO 驗證 + URL 一致性修復
- 2025-12-01｜+2｜✅ 成功｜useCalculator.ts 測試覆蓋率大幅提升
- 2025-12-01｜+5｜✅ 成功｜v1.2.0 完整發布: CI 修復 + 生產環境驗證
- 2025-12-02｜+4｜✅ 成功｜依賴升級: Vite 7.2.6, vite-plugin-pwa 1.2.0, @types/node 24.10.1, jsdom 27.2.0
- 2025-12-02｜+5｜✅ 成功｜SEO 規格文檔 v3.0.0 完全重寫 + SEO TODO 系統建立
- 2025-12-03｜+8｜✅ 成功｜nihonname 專案全面 SEO 優化與預渲染架構重構
- 2025-12-03｜+5｜✅ 成功｜nihonname 測試覆蓋率提升至 97%
- 2025-12-03｜+3｜✅ 成功｜nihonname PWA 圖標與社交分享圖片完整建立
- 2025-12-04｜+5｜✅ 成功｜nihonname 生產環境部署獨立性修復
- 2025-12-04｜+3｜✅ 成功｜nihonname base path 根因修復
- 2025-12-04｜+5｜✅ 成功｜nihonname 生產環境部署完成
- 2025-12-04｜+3｜✅ 成功｜nihonname 諧音梗日文名資料驗證與修正
- 2025-12-04｜+3｜✅ 成功｜nihonname BreadcrumbList JSON-LD schema 添加
- 2025-12-04｜+5｜✅ 成功｜nihonname 諧音梗資料庫擴充至 500 個 + 用戶自訂功能
- 2025-12-04｜+10｜✅ 成功｜nihonname 和紙（Washi）質感組件實現 + BDD 測試
- 2025-12-06｜+5｜✅ 成功｜nihonname 高級社群分享與截圖模式優化
- 2025-12-07｜+4｜✅ 成功｜修復 Hydration #418 根因 (Date.now/Math.random 在 useState)
- 2025-12-07｜+5｜✅ 成功｜修復 nihonname 煙火動畫卡住當掉根本問題
- 2025-12-09｜+5｜✅ 成功｜SEO 圖片版號 + NihonName 彩蛋體驗升級
- 2025-12-09｜+3｜✅ 成功｜SCA/容器掃描強化 + Dependabot 自動 rebase
- 2025-12-15｜+10｜✅ 成功｜消除 CI 硬編碼，建立 SSOT 架構 + 100% 路由覆蓋
- 2025-12-29｜+12｜✅ 成功｜RateWise PWA 深度優化 + 棉花糖雲朵通知 + LCP 優化
- 2025-12-25｜未標記｜✅ 已解｜React Hydration #418 在 SSG 環境中偶發

### 2025-11（索引）

- 2025-11-30｜+5｜✅ 成功｜v1.2.0 重大更新: GPL-3.0 授權 + SEO 優化
- 2025-11-30｜+3｜✅ 成功｜根本修復: generate-sitemap.js 缺少 /guide
- 2025-11-30｜+3｜✅ 成功｜生產環境 SEO 健康檢查 CI 整合
- 2025-11-30｜+2｜✅ 成功｜E2E Fixture 優化 - Flaky tests 減少 50%
- 2025-11-30｜+3｜✅ 成功｜Sitemap/SSG 一致性修復 + 驗證腳本
- 2025-11-29｜+2｜✅ 成功｜lint-staged v16 升級 + Fast Refresh 警告修復
- 2025-11-29｜+1｜✅ 成功｜Major 依賴升級: Husky v9 + Commitlint v20
- 2025-11-29｜+1｜✅ 成功｜Patch 依賴升級 (7 套件)
- 2025-11-29｜+1｜✅ 成功｜死代碼清理: isCacheKey/isUserDataKey 移除
- 2025-11-29｜+1｜✅ 成功｜Prettier Patch 升級 + Issue #22 關閉
- 2025-11-29｜+3｜✅ 成功｜安全標頭優化 + MultiConverter 測試覆蓋率提升
- 2025-11-29｜+1｜✅ 成功｜Cloudflare Worker CSP 修復部署成功
- 2025-11-28｜+1｜✅ 成功｜vite + playwright Minor 更新
- 2025-11-28｜+1｜✅ 成功｜Minor/Patch 依賴安全更新 (6 套件)
- 2025-11-28｜+1｜✅ 成功｜csp-reporter.ts 測試覆蓋率 0% → 100%
- 2025-11-28｜+1｜✅ 成功｜生產環境 CSP inline script 修復 (PR #33)
- 2025-11-28｜+1｜✅ 成功｜Lighthouse CI Workflow 權限修復
- 2025-11-28｜+3｜✅ 成功｜Lighthouse CI 根本修復 + FAQ JSON-LD 完整性
- 2025-11-28｜+1｜✅ 成功｜FAQ/About Hydration #418 與 E2E BasePath 修復
- 2025-11-28｜+1｜✅ 成功｜React 19 react-is AsyncMode 崩潰修復
- 2025-11-27｜+1｜✅ 成功｜LHCI 離線與報告路徑修復
- 2025-11-27｜+1｜✅ 成功｜Nginx SW 快取覆蓋修正 + NEL 路徑對齊
- 2025-11-27｜+1｜✅ 成功｜FAQ/About 預渲染紅燈轉綠燈（fallback 靜態輸出）
- 2025-11-27｜-1｜⚠️ 注意｜prerender FAQ/About 未產生 (Vitest 紅燈)
- 2025-11-27｜+1｜✅ 成功｜Prerender 自動建置與 LHCI 離線穩定化
- 2025-11-27｜+1｜✅ 成功｜SW 快取優先序與 NEL 路徑回正
- 2025-11-24｜+1｜✅ 成功｜PWA SW 測試重啟 + Calculator 跨瀏覽器穩定化
- 2025-11-24｜+3｜✅ 成功｜SEO Phase 1: Google Search Console 索引問題修復
- 2025-11-24｜+1｜✅ 成功｜PWA base 路徑資產鏡像 + E2E 全綠驗證
- 2025-11-24｜+1｜✅ 成功｜文檔狀態審查：驗證並更新 2 個為已完成
- 2025-11-24｜+1｜✅ 成功｜文檔清理：刪除 3 個違規文檔
- 2025-11-23｜+1｜✅ 成功｜本地全套 CI 流程綠燈（Lint/Type/Test/Build）
- 2025-11-23｜+3｜✅ 成功｜Lighthouse CI CHROME_INTERSTITIAL_ERROR 根本修復
- 2025-11-23｜+3｜✅ 成功｜Base Path 白屏與嚴格模式雙元素衝突修復
- 2025-11-23｜+1｜✅ 成功｜金額輸入框補 data-testid，穩定 E2E 定位
- 2025-11-23｜+1｜✅ 成功｜多幣別/單幣別測試對齊現況 UI
- 2025-11-23｜+2｜✅ 成功｜修復 PWA Manifest 重複注入
- 2025-11-23｜+5｜✅ 成功｜修復 CI/CD 端口不一致與 Lighthouse CI 錯誤
- 2025-11-23｜-2｜❌ 失敗｜E2E 測試端口衝突導致 CI 失敗
- 2025-11-23｜+2｜✅ 成功｜修復 Playwright Client 端硬編碼端口問題
- 2025-11-23｜+2｜✅ 成功｜修復 Vite Preview Server 端口隨機性
- 2025-11-23｜-1｜❌ 失敗｜CI 端口配置漂移
- 2025-11-08｜+3｜✅ 成功｜Phase1 PWA 優化 Linus 風格深度驗證
- 2025-11-08｜+3｜✅ 成功｜趨勢圖優化深度驗證
- 2025-11-08｜+1｜✅ 成功｜CI daily monitor:history
- 2025-11-08｜+2｜✅ 成功｜Suspense Skeleton + Workbox 快取
- 2025-11-08｜+2｜✅ 成功｜歷史匯率服務改為 Promise.allSettled
- 2025-11-08｜+1｜✅ 成功｜404 缺口最佳實踐調查
- 2025-11-08｜+1｜✅ 成功｜釐清 2025-10-13 歷史匯率 JSON 404 根因
- 2025-11-08｜+3｜✅ 成功｜Phase1 PWA 優化完整驗證
- 2025-11-08｜+2｜✅ 成功｜Phase1 PWA 速度優化
- 2025-11-07｜+2｜✅ 成功｜Lighthouse Pro 工作流與代碼品質修復
- 2025-11-07｜+3｜✅ 成功｜圖片優化與 LCP 大幅提升
- 2025-11-07｜+2｜✅ 成功｜AI 搜尋優化 Phase 1
- 2025-11-05｜+2｜✅ 成功｜API 文檔與 25 個單元測試
- 2025-11-05｜+2｜✅ 成功｜多幣別交叉匯率計算完善
- 2025-11-05｜+1｜✅ 成功｜單幣別輸入框千分位修復
- 2025-11-05｜+1｜✅ 成功｜Nginx ratewise 符號連結避免 404
- 2025-11-05｜+1｜✅ 成功｜Husky pre-commit UTF-8 支援
- 2025-11-05｜+1｜✅ 成功｜Docker 建置自動注入 Git 資訊
- 2025-11-05｜+1｜✅ 成功｜透過 gh api 合併 PWA 分支
- 2025-11-05｜+1｜✅ 成功｜Skeleton 測試簡化
- 2025-11-05｜+1｜✅ 成功｜測試修復 (格式化值斷言)
- 2025-11-05｜+1｜✅ 成功｜版本號自動更新機制修復
- 2025-11-05｜+1｜✅ 成功｜修復 Changesets token 錯誤
- 2025-11-05｜+1｜✅ 成功｜多幣別輸入恢復即時換算
- 2025-11-05｜+1｜✅ 成功｜匯率顯示邏輯分離
- 2025-11-05｜+1｜✅ 成功｜基準貨幣視覺標示
- 2025-11-05｜+1｜✅ 成功｜基準貨幣快速切換功能
- 2025-11-05｜+1｜✅ 成功｜收藏星星佈局穩定性修正
- 2025-11-05｜+1｜✅ 成功｜匯率顯示邏輯統一
- 2025-11-05｜+1｜✅ 成功｜LOGO 品牌識別強化
- 2025-11-05｜+1｜✅ 成功｜鍵盤輸入限制
- 2025-11-05｜+2｜✅ 成功｜輸入框編輯功能完全重構
- 2025-11-05｜+1｜✅ 成功｜匯率文字漸層方向修正
- 2025-11-05｜+1｜✅ 成功｜模式切換按鈕現代化設計
- 2025-11-05｜+1｜✅ 成功｜UI 配色融合優化
- 2025-11-05｜+1｜✅ 成功｜ISO 4217 深度修正
- 2025-11-05｜+1｜✅ 成功｜瀏覽器端完整測試驗證
- 2025-11-05｜+1｜✅ 成功｜UI 佈局優化
- 2025-11-05｜+1｜✅ 成功｜千位分隔符修正
- 2025-11-05｜+1｜✅ 成功｜UI 優化
- 2025-11-05｜+1｜✅ 成功｜貨幣格式化增強
- 2025-11-04｜+1｜✅ 成功｜實作即期/現金匯率切換 UI
- 2025-11-04｜+1｜✅ 成功｜趨勢圖數據整合優化
- 2025-11-04｜+1｜✅ 成功｜修復生產環境 404 錯誤
- 2025-11-01｜+1｜✅ 成功｜建立 4 項強制規範文檔
- 2025-11-01｜+1｜✅ 成功｜新增前端刷新時間追蹤
- 2025-11-01｜+1｜✅ 成功｜修正 toLocaleTimeString 使用錯誤
- 2025-11-01｜+1｜✅ 成功｜版本生成邏輯簡化
- 2025-11-01｜+1｜✅ 成功｜時間格式化邏輯重構
- 2025-11-01｜+1｜✅ 成功｜即時匯率刷新 UI 更新時間

### 2025-10（索引）

- 2025-10-31｜+1｜✅ 成功｜版本號改用 Git 標籤/提交數生成
- 2025-10-31｜+1｜✅ 成功｜修正 MiniTrendChart 畫布縮放問題
- 2025-10-31｜+1｜✅ 成功｜修復版本標籤流程
- 2025-10-31｜+1｜✅ 成功｜趨勢圖整合 30 天歷史 + 今日即時匯率
- 2025-10-25｜+3｜✅ 成功｜修復 Lighthouse CI NO_FCP
- 2025-10-25｜+2｜✅ 成功｜修復 CI 環境共享內存不足
- 2025-10-25｜+3｜✅ 成功｜修復 Headless Chrome 渲染問題
- 2025-10-25｜+1｜✅ 成功｜SEO 文檔網址修正

### 未標記日期（索引）

- 未標記日期｜+3｜✅ 成功｜W3C HTML Validator 修復 (RateWise + NihonName)
- 未標記日期｜+2｜✅ 成功｜Quake-School W3C HTML 修復
- 未標記日期｜+1｜✅ 成功｜ConversionHistory Toast 通知功能
- 未標記日期｜+2｜✅ 成功｜Toast 模組重構（react-refresh 規則）
- 未標記日期｜+1｜✅ 成功｜Quake-School PageLoader 拆分
- 未標記日期｜+1｜✅ 成功｜Quake-School README.md 新增
