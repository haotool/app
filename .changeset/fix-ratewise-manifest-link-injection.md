---
'@app/ratewise': patch
---

修復 PWA manifest 連結遺失：在 `apps/ratewise/index.html` 加入靜態 `<link rel="manifest" href="/ratewise/manifest.webmanifest">`，解除瀏覽器無法發現 manifest 導致「加入主畫面」與 PWA 安裝流程失效的問題。

- 根因：vite.config.ts 將 `manifest:false` 後，vite-plugin-pwa 不再注入 manifest 連結；index.html 未提供 fallback，導致產出的 HTML 完全沒有 `<link rel="manifest">`。
- 修法：以靜態 `<link rel="manifest">` 指向 SSOT 產出（`public/manifest.webmanifest`），保持 `generate-manifest.mjs` 為唯一生成來源。
- 補強：`src/pwa-offline.test.ts` 新增回歸測試鎖定 index.html 必須含該 link 與 vite 設定保持 `manifest:false`，避免日後再次遺失。
