# 生產環境部署檢查清單

> **關鍵原則**: 確保所有用戶（包括上百位現有用戶）能立即獲取最新版本，不被舊快取影響

## 快速部署流程

### 1. 本地驗證

```bash
# 確保所有測試通過
pnpm lint
pnpm typecheck
pnpm test

# 建置生產版本
pnpm build:ratewise

# 本地預覽驗證
pnpm preview
# 訪問 http://localhost:4173 確認功能正常
```

### 2. 推送到遠端

```bash
# 提交變更
git add .
git commit -m "refactor(ratewise): limit trend history to 25 days"

# 推送到 main（會自動觸發 Zeabur 部署）
git push origin main
```

### 3. 等待 Zeabur 自動部署

- Zeabur 會自動檢測 main 分支的變更
- 自動執行建置並部署到生產環境
- 通常需要 2-5 分鐘

### 4. 驗證部署結果

```bash
# 檢查健康狀態
curl https://app.haotool.org/health

# 驗證 Service Worker/manifest/index.html Cache-Control
curl -I https://app.haotool.org/ratewise/sw.js | grep -i cache-control
curl -I https://app.haotool.org/ratewise/registerSW.js | grep -i cache-control
curl -I https://app.haotool.org/ratewise/manifest.webmanifest | grep -i cache-control
curl -I https://app.haotool.org/ratewise/index.html | grep -i cache-control

# 驗證 25 天歷史資料完整性
pnpm verify:history
```

### 5. 清除 CDN 快取（可選但推薦）

```bash
# 如果你有配置 Cloudflare API token
export CLOUDFLARE_ZONE_ID=your_zone_id
export CLOUDFLARE_API_TOKEN=your_api_token

# 執行清除腳本
pnpm purge:cdn
```

## Service Worker 更新機制說明

### 自動更新流程

1. **用戶訪問網站** → 瀏覽器檢查 sw.js 是否有更新
2. **檢測到新版本** → 後台下載新的 Service Worker
3. **下載完成** → 顯示「新版本可用」通知
4. **10秒倒數** → 自動重新載入頁面
5. **頁面重新載入** → 新版本立即生效

### 關鍵配置（已完成）

✅ **Nginx 配置** (nginx.conf):

```nginx
# Service Worker 永遠不快取
location ~* /(sw|workbox-.*|registerSW)\.js$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    try_files $uri =404;
}

# PWA Manifest 不快取
location = /ratewise/manifest.webmanifest {
    add_header Cache-Control "no-cache, must-revalidate";
    try_files $uri =404;
}
```

✅ **Vite PWA 配置** (vite.config.ts):

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
  },
});
```

✅ **UpdatePrompt 組件** (UpdatePrompt.tsx):

```typescript
navigator.serviceWorker.register(swUrl, {
  updateViaCache: 'none', // 關鍵設定
});
```

### 用戶體驗

- ✅ 用戶**無需手動操作**
- ✅ 最多 **60 秒**內自動檢測到更新
- ✅ 顯示友善的更新通知
- ✅ 10 秒倒數自動更新（可手動點擊立即更新）
- ✅ 舊快取自動清除

### CDN Purge 注意事項

- `pnpm purge:cdn` 需要 Zeabur CLI 或 Cloudflare API Token，若未設定會以非 0 終止並列出需手動清除的 URL，避免誤判成功。
- Cloudflare 版本會同時清除 `sw.js`、`registerSW.js`、`manifest.webmanifest`、`index.html` 與 `workbox-*` / `assets/` 前綴，確保符合 [web.dev Service Worker Lifecycle][ref:web.dev-service-worker:2025-11-09] 的零快取要求。
- 若無法使用 API，請在 CDN 控制台依指示逐一清除。

### 歷史資料完整性驗證

- 透過 `pnpm verify:history` 自動抓取最近 25 天的 `history/YYYY-MM-DD.json`，確定
  - 兩個端點（jsDelivr + raw.githubusercontent.com）至少有一個可回應
  - 每天都包含指定貨幣（預設 USD）的匯率
  - 匯率有真實變化（至少 2 個不同數值），避免趨勢圖出現平線
- 結果會輸出至 `tmp/history-values.json`，並以 `console.table` 顯示摘要。若缺資料 or 匯率相同，腳本會以非 0 結束，請第一時間補跑 `scripts/setup-historical-rates.sh`。

## 緊急回滾流程

如果新版本有嚴重問題：

```bash
# 1. 回滾到上一個 commit
git revert HEAD
git push origin main

# 2. 等待 Zeabur 自動部署舊版本

# 3. 清除 CDN 快取（確保用戶獲取回滾版本）
pnpm purge:cdn
```

## 常見問題

### Q: 為什麼有些用戶還看到舊版本？

**A**: 可能的原因：

1. 用戶瀏覽器快取了 sw.js（已透過 nginx 配置修復）
2. CDN 快取未清除（執行 `pnpm purge:cdn`）
3. 用戶尚未重新訪問網站（最多 60 秒後會自動檢查更新）

### Q: 如何確認 Service Worker 已更新？

**A**: 開啟 Chrome DevTools:

1. Application → Service Workers
2. 查看 Status 是否為 "activated and is running"
3. 查看 Updated 時間是否為最近
4. 可點擊 "Update" 按鈕強制檢查更新

### Q: 如何強制用戶立即更新？

**A**:

1. 在 UpdatePrompt.tsx 調整自動更新倒數時間（目前 10 秒）
2. 或在部署後通知用戶重新整理頁面

### Q: bad-precaching-response 錯誤如何解決？

**A**: 這個錯誤表示舊的 SW 嘗試載入已不存在的 assets。解決方案：

1. ✅ 已修復：nginx 不再快取 sw.js
2. ✅ 已修復：skipWaiting + cleanupOutdatedCaches
3. 如果仍出現：執行 `pnpm purge:cdn` 清除 CDN 快取

## 監控與驗證

### 部署後檢查清單

- [ ] 訪問 https://app.haotool.org/ratewise 確認頁面正常
- [ ] 檢查 Console 無錯誤訊息
- [ ] 驗證 Service Worker 已更新（DevTools → Application）
- [ ] 測試匯率轉換功能正常
- [ ] 測試趨勢圖顯示正常
- [ ] 檢查 Network 面板，確認 sw.js 回傳 200（非 304）
- [ ] 等待 5 分鐘，重新載入頁面，確認仍能正常運作

### 持續監控

```bash
# 定期檢查歷史資料檔案完整性
pnpm monitor:history

# 執行 Lighthouse 效能檢測
pnpm lighthouse

# 檢查健康狀態
curl https://app.haotool.org/health
```

## 參考資料

- [Service Worker Lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [PWA 更新最佳實踐](https://web.dev/learn/pwa/update/)
- [Nginx 快取配置](https://nginx.org/en/docs/http/ngx_http_headers_module.html)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

**最後更新**: 2025-11-08  
**維護者**: @s123104

[ref:web.dev-service-worker:2025-11-09]: https://web.dev/articles/service-worker-lifecycle
