---
'@app/ratewise': patch
---

修復 `index.html` 硬編 `/ratewise/` 路徑在非預設 base 部署下 404：改以 `__BASE_PATH__` 佔位符於 `vite.config.ts` 的 `transformIndexHtml` 依 base（SSOT: `VITE_RATEWISE_BASE_PATH`）動態替換，恢復 CI E2E/Lighthouse（base=`/`）情境下的 manifest / icon / preload 可用性。

- 根因：PR #264 前置修補於 index.html 加入 `<link rel="manifest" href="/ratewise/manifest.webmanifest">`；`.github/workflows/ci.yml` 的 E2E/Lighthouse job 以 `VITE_RATEWISE_BASE_PATH=/` 建置，實際 manifest 路徑為 `/manifest.webmanifest`，造成 HTML 連結 404、瀏覽器無法發現 manifest、PWA 安裝能力退化。
- 修法：index.html 將 `href="/ratewise/..."` 改為 `href="__BASE_PATH__..."`（涵蓋 manifest / favicon.ico / favicon.svg / apple-touch-icon / preload logo），並於 `inject-version-meta` plugin 追加 `replace(/__BASE_PATH__/g, base)`，維持既有 `__APP_VERSION__` / `__BRAND_*` 注入模式的一致性。
- 補強：`src/pwa-offline.test.ts` 新增 3 項回歸測試，鎖定 index.html 必須使用佔位符、vite plugin 必須替換、禁止 `/ratewise/` 硬編重新出現。
- 驗證：以 `VITE_RATEWISE_BASE_PATH=/ratewise/` 建置輸出 `/ratewise/manifest.webmanifest`，以 `VITE_RATEWISE_BASE_PATH=/` 建置輸出 `/manifest.webmanifest`，皆正確。
