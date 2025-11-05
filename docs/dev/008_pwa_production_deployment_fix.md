# 008_pwa_production_deployment_fix.md - PWA 生產環境部署修復方案

**建立時間**: 2025-11-06T00:04:56+08:00  
**更新時間**: 2025-11-06T00:04:56+08:00  
**版本**: v1.0  
**狀態**: 🔄 待執行  
**負責人**: @s123104

---

## 問題診斷報告

### 當前時間戳記

2025-11-06T00:04:56+08:00 [time.now:Asia/Taipei]

### 生產環境檢查結果

**網址**: https://app.haotool.org/ratewise  
**檢查時間**: 2025-11-06T00:04:56+08:00

#### Console 錯誤

```
[WARNING] Manifest: property 'scope' ignored. Start url should be within scope of scope URL.
[ERROR] GET https://app.haotool.org/ratewise/assets/index-HiiysA25.js net::ERR_ABORTED 404 (Not Found)
```

#### Network 請求分析

| 資源路徑                              | 狀態碼 | 問題                    |
| ------------------------------------- | ------ | ----------------------- |
| `/ratewise/assets/index-HiiysA25.js`  | 404    | ❌ 舊版本檔案，已不存在 |
| `/ratewise/assets/index-ByH1wMrb.css` | 200    | ✅ 正常                 |
| `/ratewise/assets/vendor-*.js`        | 200    | ✅ 正常                 |
| `/manifest.webmanifest`               | 200    | ⚠️ 內容錯誤             |

#### PWA Manifest 配置錯誤

**生產環境 `/manifest.webmanifest`**:

```json
{
  "scope": "/ratewise/", // ✅ 正確（有尾斜線）
  "start_url": "/ratewise", // ❌ 錯誤（缺少尾斜線）
  "id": "/ratewise" // ❌ 錯誤（缺少尾斜線）
}
```

**本地正確 build**:

```json
{
  "scope": "/ratewise/", // ✅ 正確
  "start_url": "/ratewise/", // ✅ 正確
  "id": "/ratewise/" // ✅ 正確
}
```

#### Service Worker 狀態

- **註冊數量**: 0
- **狀態**: ❌ 未註冊

---

## 根本原因分析

### 1. 生產環境部署不同步

**本地 build**（正確）:

```bash
# 本地 dist/index.html 引用
<script src="/ratewise/assets/index-PtKlPOcc.js"></script>

# 本地 manifest
{"scope": "/ratewise/", "start_url": "/ratewise/", "id": "/ratewise/"}
```

**生產環境**（錯誤）:

```bash
# 生產環境 HTML 引用（404）
<script src="/ratewise/assets/index-HiiysA25.js"></script>

# 生產環境 manifest（混合值）
{"scope": "/ratewise/", "start_url": "/ratewise", "id": "/ratewise"}
```

**結論**: 生產環境部署的是舊版本 build，與最新的 commit (59bf117, 4f871d4) 不一致。

### 2. 部署流程問題可能原因

1. **Zeabur 快取**：Zeabur 可能快取了舊的 build artifacts
2. **Build 環境變數缺失**：Zeabur 部署時可能未正確設定 `VITE_BASE_PATH=/ratewise/`
3. **部署時間不足**：之前等待 60-90 秒可能不足以完成完整部署
4. **Cloudflare CDN 快取**：Cloudflare 快取了舊的靜態資源和 manifest

### 3. 錯誤的先前修復（技術債務）

**Commit 32a254a** (已在 59bf117 修正):

```
fix(pwa): 修正 PWA manifest 路徑，移除尾斜線以避免 301 重定向
```

**錯誤假設**:

- ❌ 認為移除尾斜線可以避免 nginx 301 重定向
- ❌ 違反 W3C PWA 規範和 MDN 最佳實踐

**正確做法** [context7:vite-pwa/vite-plugin-pwa:2025-11-06]:

```typescript
// PWA Manifest 最佳實踐
manifest: {
  scope: '/ratewise/',      // 必須有尾斜線
  start_url: '/ratewise/',  // 必須有尾斜線
  id: '/ratewise/'          // 必須有尾斜線（唯一識別符）
}
```

---

## Linus 三問驗證

### 1. "這是個真問題還是臆想出來的？"

✅ **真問題**

- 生產環境 Console 有明確錯誤
- Service Worker 未註冊，PWA 功能完全失效
- 靜態資源 404 導致應用程式可能無法正常運作

### 2. "有更簡單的方法嗎？"

✅ **最簡方案：強制重新部署 + 清除快取**

- 不需要修改任何程式碼（本地 build 已正確）
- 只需要確保 Zeabur 部署最新版本
- 清除 Cloudflare CDN 快取

### 3. "會破壞什麼嗎？"

✅ **向後相容，不會破壞**

- 所有變更僅影響 PWA manifest
- 不影響現有功能
- 修正後 PWA 功能將正常運作

---

## 修復方案（三選一）

### 方案 A：強制 Zeabur 重新部署（推薦 🌟）

**優點**:

- ✅ 最簡單直接，符合 KISS 原則
- ✅ 不需要修改程式碼
- ✅ 可立即驗證效果

**缺點**:

- ⚠️ 需要手動操作 Zeabur Dashboard
- ⚠️ 可能需要等待 5-10 分鐘部署

**執行步驟**:

1. 訪問 Zeabur Dashboard: https://dash.zeabur.com
2. 找到 `app` 專案的 `ratewise` 服務
3. 點擊 "Redeploy" 按鈕強制重新部署
4. 等待部署完成（觀察 build logs）
5. 部署完成後，清除 Cloudflare 快取：

   ```bash
   # 方式 1: Cloudflare Dashboard
   - 訪問 Cloudflare Dashboard
   - 選擇 haotool.org 域名
   - Caching > Configuration > Purge Cache
   - 選擇 "Custom Purge" 並輸入：
     - https://app.haotool.org/ratewise/*
     - https://app.haotool.org/manifest.webmanifest

   # 方式 2: 使用 Cloudflare API（需要 API Token）
   curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
     -H "Authorization: Bearer {api_token}" \
     -H "Content-Type: application/json" \
     --data '{"files":["https://app.haotool.org/ratewise/","https://app.haotool.org/manifest.webmanifest"]}'
   ```

6. 瀏覽器硬重新整理（Ctrl+Shift+R 或 Cmd+Shift+R）
7. 驗證修復：

   ```bash
   # 檢查 manifest
   curl -s https://app.haotool.org/manifest.webmanifest | jq '{scope, start_url, id}'

   # 檢查 Console 無警告
   # 開啟 https://app.haotool.org/ratewise
   # 檢查 DevTools Console
   ```

**預計時間**: 15-20 分鐘

---

### 方案 B：建立空 Commit 觸發 CI/CD（自動化）

**優點**:

- ✅ 完全自動化，不需要手動操作 Dashboard
- ✅ 符合 GitOps 最佳實踐
- ✅ 留下 audit trail

**缺點**:

- ⚠️ 需要等待 GitHub Actions + Zeabur 部署鏈
- ⚠️ 如果 CI/CD 有問題，此方法無效

**執行步驟**:

1. 建立空 commit 觸發部署：

   ```bash
   git commit --allow-empty -m "chore(deploy): force production rebuild for PWA manifest fix

   - Trigger Zeabur redeploy to sync latest build artifacts
   - Fixes manifest.webmanifest scope/start_url/id consistency
   - Resolves 404 error for index-HiiysA25.js

   Refs: #007, commits 59bf117, 4f871d4"

   git push origin main
   ```

2. 觀察 GitHub Actions:

   ```bash
   # 訪問 https://github.com/haotool/app/actions
   # 確認 workflow 執行成功
   ```

3. 等待 Zeabur 自動部署（5-10 分鐘）

4. 清除 Cloudflare 快取（同方案 A 步驟 5）

5. 驗證修復（同方案 A 步驟 7）

**預計時間**: 20-30 分鐘（含 CI/CD）

---

### 方案 C：檢查並修正 Zeabur 環境變數（根本治理）

**優點**:

- ✅ 解決根本問題，避免未來再次發生
- ✅ 確保所有環境變數正確配置
- ✅ 提升部署流程可靠性

**缺點**:

- ⚠️ 需要更深入的 Zeabur 配置檢查
- ⚠️ 可能發現其他配置問題需要同步修正

**執行步驟**:

1. 檢查 Zeabur 環境變數：

   ```bash
   # 在 Zeabur Dashboard 中確認以下環境變數
   VITE_BASE_PATH=/ratewise/
   NODE_ENV=production
   ```

2. 檢查 Dockerfile build args：

   ```dockerfile
   # 確認 Dockerfile 第 12 行
   ARG VITE_BASE_PATH=/ratewise/

   # 確認 Dockerfile 第 30 行
   ENV VITE_BASE_PATH=${VITE_BASE_PATH}
   ```

3. 如果環境變數缺失或錯誤：
   - 在 Zeabur Dashboard 設定正確的環境變數
   - 點擊 "Redeploy" 重新部署

4. 建立預防措施文檔：

   ```bash
   # 更新 DEPLOYMENT.md 加入環境變數檢查清單
   # 更新 Zeabur 部署文檔
   ```

5. 清除快取並驗證（同方案 A）

**預計時間**: 30-45 分鐘

---

## 技術依據與參考文獻

### PWA Manifest 規範

1. **[MDN Web Manifest Scope](https://developer.mozilla.org/en-US/docs/Web/Manifest/scope)** [2025-11-06]:

   > "The scope member is a string that defines the navigation scope of this web application's application context. It restricts what web pages can be viewed while the manifest is applied. If the user navigates outside the scope, it returns to a normal web page inside a browser tab or window."
   >
   > **重要**: scope 必須以 `/` 結尾，否則會被視為字串前綴匹配

2. **[W3C Web App Manifest](https://www.w3.org/TR/appmanifest/#scope-member)** [2025-11-06]:

   > "If start_url is not within scope, then scope is set to the start_url with all segments following the last "/" removed."

3. **[vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/guide/)** [context7:vite-pwa/vite-plugin-pwa:2025-11-06]:
   ```typescript
   manifest: {
     scope: '/',        // Must end with /
     start_url: '/',    // Must end with /
   }
   ```

### 尾斜線最佳實踐

**為什麼必須有尾斜線？**

1. **字串前綴匹配規則**:

   ```
   scope: "/ratewise"   → 匹配 "/ratewisexyz" ❌ 錯誤
   scope: "/ratewise/"  → 只匹配 "/ratewise/*" ✅ 正確
   ```

2. **瀏覽器行為**:
   - 當 `start_url` 不在 `scope` 範圍內時，瀏覽器會忽略 `scope`
   - 導致 PWA 安裝失敗或行為異常

3. **Service Worker Scope**:
   - Service Worker 的 scope 匹配算法與 manifest scope 一致
   - 必須確保一致性

### Vite + PWA 技術棧最佳實踐

**來源**: [context7:vite-pwa/vite-plugin-pwa:2025-11-06]

```typescript
// vite.config.ts 最佳配置
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/ratewise/', // ✅ 帶尾斜線
  plugins: [
    VitePWA({
      manifest: {
        scope: '/ratewise/', // ✅ 與 base 一致
        start_url: '/ratewise/', // ✅ 與 scope 一致
        id: '/ratewise/', // ✅ 唯一識別符
      },
    }),
  ],
});
```

**關鍵原則**:

1. `base` 必須與 `manifest.scope` 一致
2. 所有路徑必須帶尾斜線
3. 避免在 `public/` 放置靜態 manifest（會覆蓋動態生成）

---

## 推薦方案與風險評估

### 推薦方案: A（強制重新部署）→ C（環境變數檢查）

**執行順序**:

1. 先執行方案 A 快速修復生產環境問題（15-20 分鐘）
2. 驗證修復成功後，執行方案 C 進行根本治理（30-45 分鐘）
3. 更新部署文檔，避免未來再次發生

### 風險等級: 🟢 低風險

| 風險項目     | 機率 | 影響 | 緩解措施                                |
| ------------ | ---- | ---- | --------------------------------------- |
| 重新部署失敗 | 低   | 中   | 檢查 Zeabur build logs，必要時回滾      |
| 快取未清除   | 中   | 低   | 多次硬重新整理，或等待 1 小時自然過期   |
| 環境變數錯誤 | 低   | 高   | 先備份現有配置再修改                    |
| 影響現有用戶 | 極低 | 低   | 修復僅影響 PWA 功能，不影響核心匯率轉換 |

### 回滾策略

如果修復後出現問題：

1. **立即回滾 git commit**:

   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Zeabur 回滾部署**:
   - Dashboard > Deployments > 選擇上一個成功的部署 > Redeploy

3. **恢復環境變數**:
   - 使用備份的環境變數配置恢復

---

## 後續行動與文檔更新

### 需要更新的文檔

1. **docs/DEPLOYMENT.md**:
   - 加入 Zeabur 環境變數檢查清單
   - 加入 Cloudflare 快取清除流程
   - 加入生產環境驗證 checklist

2. **docs/dev/002_development_reward_penalty_log.md**:

   ```markdown
   | ✅ 成功 | PWA 生產環境部署修復 | 強制重新部署 + 清除快取，修正 manifest 不一致 | [context7:vite-pwa:2025-11-06]<br>docs/dev/008 | +1 |
   | 💡 學習 | PWA Manifest 必須帶尾斜線 | scope/start_url/id 都必須以 `/` 結尾 | [MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest/scope) | 0 |
   | 💡 學習 | Zeabur 部署流程與快取機制 | 理解 CI/CD 鏈與 CDN 快取影響 | Zeabur 官方文檔 | 0 |
   ```

3. **docs/dev/007_pwa_configuration_fix.md**:
   - 更新生產環境驗證結果
   - 加入部署問題與解決方案
   - 交叉引用 008 文檔

### 預防措施

1. **建立 Pre-deploy 檢查腳本**:

   ```bash
   # scripts/pre-deploy-check.sh
   #!/bin/bash
   # 檢查 manifest 配置
   # 檢查環境變數
   # 檢查 build artifacts
   ```

2. **CI/CD 增強**:
   - 在 GitHub Actions 中加入 manifest 驗證步驟
   - 部署前自動檢查 scope/start_url/id 一致性

3. **監控與告警**:
   - 設定 Sentry 監控 PWA 錯誤
   - 設定 Cloudflare Analytics 監控 404 錯誤

---

## 驗證 Checklist

修復完成後，必須全部通過以下檢查：

### PWA Manifest 驗證

- [ ] 訪問 https://app.haotool.org/ratewise
- [ ] 開啟 DevTools > Application > Manifest
- [ ] 確認 Manifest URL: `https://app.haotool.org/manifest.webmanifest`
- [ ] 確認 `scope: "/ratewise/"` ✅
- [ ] 確認 `start_url: "/ratewise/"` ✅
- [ ] 確認 `id: "/ratewise/"` ✅
- [ ] 無 Console 警告

### Service Worker 驗證

- [ ] DevTools > Application > Service Workers
- [ ] 確認 Service Worker 已註冊
- [ ] 確認 scope: `https://app.haotool.org/ratewise/`
- [ ] 確認狀態: "activated and is running"

### 靜態資源驗證

- [ ] Console 無 404 錯誤
- [ ] Network > Filter: `index-*.js` → 200 OK
- [ ] Network > Filter: `manifest.webmanifest` → 200 OK
- [ ] 所有 assets 載入成功

### 功能驗證

- [ ] PWA 安裝提示出現（首次訪問）
- [ ] 匯率轉換功能正常
- [ ] 離線模式可用（Service Worker 快取生效）
- [ ] 圖標顯示正確

---

## 附錄：錯誤註解修正

**檔案**: `apps/ratewise/vite.config.ts`  
**行數**: 256-258

**錯誤註解**（需刪除或修正）:

```typescript
// [fix:2025-11-05] PWA manifest 路徑最佳實踐
// - scope: 帶尾斜線 (MDN 規範要求，否則退回到根域名)
// - start_url: 無尾斜線 (避免 nginx 301 重定向)  ❌ 錯誤
// - id: 無尾斜線 (唯一識別符，與 start_url 一致)  ❌ 錯誤
```

**正確註解**:

```typescript
// [fix:2025-11-06] PWA manifest 路徑最佳實踐
// - scope: 必須帶尾斜線 (MDN/W3C 規範要求，否則退回到根域名)
// - start_url: 必須帶尾斜線 (必須在 scope 範圍內，否則 scope 被忽略)
// - id: 必須帶尾斜線 (唯一識別符，與 start_url 保持一致)
// 參考: https://developer.mozilla.org/en-US/docs/Web/Manifest/scope
// 參考: [context7:vite-pwa/vite-plugin-pwa:2025-11-06]
```

**說明**: 之前的註解基於錯誤假設（commit 32a254a），已透過實際測試和官方文檔驗證為錯誤。

---

**狀態**: 📋 待使用者選擇方案  
**下一步**: 根據使用者選擇執行對應方案並更新此文檔
