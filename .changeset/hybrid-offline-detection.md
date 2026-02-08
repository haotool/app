---
'@app/ratewise': patch
---

fix(pwa): 混合式離線偵測修復 - 解決 navigator.onLine 不可靠問題

**問題根因**:

`navigator.onLine` API 存在已知可靠性限制：

- ✅ `false` 可信任（確定離線）
- ❌ `true` 不可靠（可能只是連到網路，但無實際網路連線）
- Firefox/Chrome 自動偵測歷史問題：行動裝置頻繁切換網路、WiFi 訊號波動、3G 基地台斷線重連

**混合式偵測策略**:

1. **基本檢查** (`checkOnlineStatus`)
   - 使用 `navigator.onLine` 作為快速初步判斷
   - 離線狀態可立即信任

2. **實際網路驗證** (`checkNetworkConnectivity`)
   - fetch HEAD 請求到自己的 origin
   - Cache busting: `?t=${Date.now()}` 防止瀏覽器快取
   - `cache: 'no-store'` 繞過快取
   - 5 秒超時保護（AbortController）

3. **混合式檢測** (`isOnline`)
   - `navigator.onLine === false` → 立即返回 false
   - `navigator.onLine === true` → 執行實際網路請求驗證

**OfflineIndicator 增強**:

- 整合混合式檢測取代單純的 `navigator.onLine`
- 定期檢查（30 秒）作為持續監控
- 保留 online/offline 事件作為快速反應機制

**測試覆蓋**:

11 個新測試涵蓋：

- 基本 navigator.onLine 檢查
- 實際網路請求驗證（成功/失敗/超時/快取繞過）
- 混合式檢測邏輯
- TypeScript 類型安全

**參考來源**:

- [DEV: Is your app online? 10 lines JS Guide](https://dev.to/maxmonteil/is-your-app-online-here-s-how-to-reliably-know-in-just-10-lines-of-js-guide-3in7)
- [Chrome: Improved PWA Offline Detection](https://developer.chrome.com/blog/improved-pwa-offline-detection)
- [MDN: Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)
- [Bugzilla: navigator.onLine always returns true](https://bugzilla.mozilla.org/show_bug.cgi?id=654579)

**驗證**: typecheck ✅、22/22 tests ✅、build ✅
