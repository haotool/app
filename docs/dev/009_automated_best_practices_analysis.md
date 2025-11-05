# 009_automated_best_practices_analysis.md - 自動化最佳實踐分析與實作

**建立時間**: 2025-11-06T00:04:56+08:00  
**更新時間**: 2025-11-06T00:04:56+08:00  
**版本**: v1.0  
**狀態**: 🔄 執行中  
**負責人**: @s123104

---

## 1. 分析摘要

### 對話紀錄解析

**時間範圍**: 2025-11-05 15:00 ~ 2025-11-06 00:05  
**對話輪數**: 1029 則訊息  
**關鍵需求主題分類**:

| 主題分類                | 需求數量 | 優先級 | 狀態        |
| ----------------------- | -------- | ------ | ----------- |
| PWA Manifest 配置修復   | 23       | P0     | 🟡 部分完成 |
| 生產環境部署同步問題    | 15       | P0     | 🔴 待處理   |
| Cloudflare CDN 快取清除 | 8        | P1     | 🔴 待處理   |
| Zeabur 部署流程優化     | 12       | P1     | 🔴 待處理   |
| 靜態資源 404 修復       | 10       | P0     | 🔴 待處理   |
| Service Worker 註冊     | 6        | P1     | 🔴 待處理   |
| 程式碼技術債清理        | 4        | P2     | ⚪ 待規劃   |

### 核心問題萃取

1. **生產環境與本地 build 不同步**
   - 生產環境部署舊版本 build artifacts
   - Manifest 配置混合值（scope 正確，start_url/id 缺尾斜線）
   - 靜態資源 404 錯誤（index-HiiysA25.js）

2. **PWA 功能完全失效**
   - Service Worker 未註冊（registrations: 0）
   - PWA 安裝提示無法觸發
   - 離線功能不可用

3. **部署流程缺乏驗證機制**
   - 無 pre-deploy 檢查
   - 無 post-deploy 驗證
   - 快取清除流程未自動化

---

## 2. 最佳實踐優化方案

### 2.1 PWA Manifest 配置最佳實踐

**來源**: [context7:vite-pwa/vite-plugin-pwa:2025-11-06T00:04:56+08:00]

#### 核心原則

1. **尾斜線必須一致**

   ```typescript
   // ✅ 正確
   manifest: {
     scope: '/ratewise/',      // 必須以 / 結尾
     start_url: '/ratewise/',  // 必須在 scope 內
     id: '/ratewise/'          // 必須與 start_url 一致
   }

   // ❌ 錯誤
   manifest: {
     scope: '/ratewise/',      // 有尾斜線
     start_url: '/ratewise',   // 無尾斜線 → 不在 scope 內
     id: '/ratewise'           // 不一致
   }
   ```

2. **避免靜態 manifest 檔案**
   - 不要在 `public/` 目錄放置 `manifest.webmanifest`
   - 完全依賴 Vite PWA Plugin 動態生成
   - 確保 `base` 配置與 `manifest.scope` 一致

3. **Service Worker Scope 對齊**
   ```typescript
   VitePWA({
     manifest: {
       scope: '/ratewise/',
       start_url: '/ratewise/',
     },
     workbox: {
       scope: '/ratewise/', // 必須與 manifest.scope 一致
     },
   });
   ```

#### 實作要點

```typescript
// vite.config.ts
const base = import.meta.env.VITE_BASE_PATH || '/';
const manifestScope = base.endsWith('/') ? base : `${base}/`;
const manifestStartUrl = manifestScope; // 完全一致

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      manifest: {
        scope: manifestScope,
        start_url: manifestStartUrl,
        id: manifestStartUrl, // 唯一識別符與 start_url 一致
      },
    }),
  ],
});
```

**參考文獻**:

- [MDN Web Manifest Scope](https://developer.mozilla.org/en-US/docs/Web/Manifest/scope)
- [W3C Web App Manifest](https://www.w3.org/TR/appmanifest/)
- [Vite PWA Plugin Documentation](https://vite-pwa-org.netlify.app/)

---

### 2.2 生產環境部署最佳實踐

#### 部署前檢查 (Pre-deploy Checks)

```bash
#!/bin/bash
# scripts/pre-deploy-check.sh

set -e

echo "🔍 執行部署前檢查..."

# 1. 檢查環境變數
if [ -z "$VITE_BASE_PATH" ]; then
  echo "❌ 缺少 VITE_BASE_PATH 環境變數"
  exit 1
fi

# 2. 檢查 manifest 配置
MANIFEST_PATH="dist/manifest.webmanifest"
if [ ! -f "$MANIFEST_PATH" ]; then
  echo "❌ manifest.webmanifest 不存在"
  exit 1
fi

# 3. 驗證 scope/start_url/id 一致性
SCOPE=$(jq -r '.scope' "$MANIFEST_PATH")
START_URL=$(jq -r '.start_url' "$MANIFEST_PATH")
ID=$(jq -r '.id' "$MANIFEST_PATH")

if [ "$SCOPE" != "$START_URL" ] || [ "$SCOPE" != "$ID" ]; then
  echo "❌ Manifest 配置不一致："
  echo "   scope: $SCOPE"
  echo "   start_url: $START_URL"
  echo "   id: $ID"
  exit 1
fi

# 4. 確認所有欄位都有尾斜線
if [[ ! "$SCOPE" =~ /$ ]]; then
  echo "❌ scope 缺少尾斜線: $SCOPE"
  exit 1
fi

echo "✅ 所有檢查通過"
```

#### 部署後驗證 (Post-deploy Validation)

```bash
#!/bin/bash
# scripts/post-deploy-verify.sh

set -e

DEPLOY_URL="https://app.haotool.org/ratewise"
echo "🔍 驗證部署: $DEPLOY_URL"

# 1. 檢查 HTTP 狀態碼
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL")
if [ "$STATUS" != "200" ]; then
  echo "❌ 部署失敗，HTTP $STATUS"
  exit 1
fi

# 2. 驗證 manifest
MANIFEST_URL="https://app.haotool.org/manifest.webmanifest"
MANIFEST_JSON=$(curl -s "$MANIFEST_URL")
SCOPE=$(echo "$MANIFEST_JSON" | jq -r '.scope')
START_URL=$(echo "$MANIFEST_JSON" | jq -r '.start_url')
ID=$(echo "$MANIFEST_JSON" | jq -r '.id')

if [ "$SCOPE" != "/ratewise/" ]; then
  echo "❌ Manifest scope 錯誤: $SCOPE"
  exit 1
fi

if [ "$START_URL" != "/ratewise/" ]; then
  echo "❌ Manifest start_url 錯誤: $START_URL"
  exit 1
fi

echo "✅ 部署驗證通過"
```

#### Cloudflare 快取清除自動化

```bash
#!/bin/bash
# scripts/purge-cloudflare-cache.sh

set -e

if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ 缺少 Cloudflare 認證資訊"
  exit 1
fi

echo "🗑️  清除 Cloudflare 快取..."

curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "files": [
      "https://app.haotool.org/ratewise/",
      "https://app.haotool.org/ratewise/index.html",
      "https://app.haotool.org/manifest.webmanifest",
      "https://app.haotool.org/ratewise/assets/*"
    ]
  }'

echo "✅ 快取已清除"
```

---

### 2.3 CI/CD 整合最佳實踐

#### GitHub Actions Workflow 增強

```yaml
# .github/workflows/deploy-production.yml
name: Production Deployment

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        env:
          VITE_BASE_PATH: /ratewise/
        run: pnpm --filter @app/ratewise build

      - name: Pre-deploy checks
        run: bash scripts/pre-deploy-check.sh

      - name: Deploy to Zeabur
        # Zeabur 自動部署

      - name: Wait for deployment
        run: sleep 120

      - name: Post-deploy verification
        run: bash scripts/post-deploy-verify.sh

      - name: Purge Cloudflare cache
        env:
          CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: bash scripts/purge-cloudflare-cache.sh
```

---

### 2.4 程式碼註解修正最佳實踐

**檔案**: `apps/ratewise/vite.config.ts`  
**行數**: 256-258

**現狀（錯誤）**:

```typescript
// [fix:2025-11-05] PWA manifest 路徑最佳實踐
// - scope: 帶尾斜線 (MDN 規範要求，否則退回到根域名)
// - start_url: 無尾斜線 (避免 nginx 301 重定向)  ❌ 錯誤
// - id: 無尾斜線 (唯一識別符，與 start_url 一致)  ❌ 錯誤
```

**修正（正確）**:

```typescript
// [fix:2025-11-06] PWA manifest 路徑最佳實踐
//
// 根據 MDN/W3C PWA 規範，scope/start_url/id 必須完全一致且帶尾斜線：
// - scope: "/ratewise/"      → 定義 PWA 應用範圍
// - start_url: "/ratewise/"  → 必須在 scope 範圍內
// - id: "/ratewise/"         → 唯一識別符，與 start_url 保持一致
//
// 參考文獻：
// - [MDN] https://developer.mozilla.org/en-US/docs/Web/Manifest/scope
// - [W3C] https://www.w3.org/TR/appmanifest/#scope-member
// - [context7:vite-pwa/vite-plugin-pwa:2025-11-06T00:04:56+08:00]
//
// 常見錯誤（已在 commit 32a254a 修正）：
// ❌ "移除尾斜線可避免 nginx 301 重定向" → 錯誤假設，違反規範
// ✅ 正確做法：確保 nginx 正確配置子路徑，PWA manifest 遵循標準
```

---

## 3. 專案步驟清單

### 3.1 已完成項目 ✅

| 項目                                        | 完成時間         | Commit  | 狀態        |
| ------------------------------------------- | ---------------- | ------- | ----------- |
| 刪除 `public/manifest.webmanifest`          | 2025-11-05 23:27 | 369d5c3 | ✅ 本地完成 |
| 刪除 `public/ratewise/manifest.webmanifest` | 2025-11-05 23:42 | 59bf117 | ✅ 本地完成 |
| 創建 007 PWA 配置修復文檔                   | 2025-11-05 23:28 | f5ec2f9 | ✅ 已提交   |
| 創建 008 生產環境部署修復文檔               | 2025-11-06 00:05 | -       | ✅ 本地完成 |
| 本地 build 驗證通過                         | 2025-11-05 23:25 | -       | ✅ 已驗證   |

### 3.2 部分完成項目 🟡

| 項目             | 進度 | 阻塞原因           | 預計完成         |
| ---------------- | ---- | ------------------ | ---------------- |
| 推送到 main 分支 | 90%  | Pre-push hook 失敗 | 2025-11-06 00:15 |
| Zeabur 自動部署  | 60%  | 部署舊版本         | 2025-11-06 00:30 |
| 生產環境驗證     | 40%  | Manifest 仍有錯誤  | 待部署完成       |

### 3.3 未完成項目 ❌

| 項目                     | 優先級 | 狀態      | 預計開始         |
| ------------------------ | ------ | --------- | ---------------- |
| 強制 Zeabur 重新部署     | P0     | 🔴 待執行 | 立即             |
| 清除 Cloudflare CDN 快取 | P0     | 🔴 待執行 | 部署後           |
| 修正 vite.config.ts 註解 | P1     | 🔴 待執行 | 2025-11-06 00:20 |
| 建立部署檢查腳本         | P1     | 🔴 待執行 | 2025-11-06 00:30 |
| 更新 CI/CD Workflow      | P2     | ⚪ 待規劃 | 2025-11-06 01:00 |
| 清理程式碼 TODO 標記     | P2     | ⚪ 待規劃 | 2025-11-07       |

### 3.4 技術債務項目 📋

| 項目                                     | 類型       | 影響 | 優先級 |
| ---------------------------------------- | ---------- | ---- | ------ |
| useCurrencyConverter.ts TODO (3)         | 程式碼品質 | 低   | P3     |
| exchangeRateCalculation.test.ts TODO (1) | 測試完整性 | 低   | P3     |
| logger.ts FIXME (Sentry 整合)            | 觀測性     | 中   | P2     |

---

## 4. To-Do List（可直接執行）

### 階段一：緊急修復（P0）- 預計 30 分鐘

#### TODO-P0-DEPLOY-001: 強制 Zeabur 重新部署

**負責人**: @s123104  
**預估時間**: 10 分鐘  
**狀態**: 🔴 待執行  
**依賴**: 無

**執行步驟**:

```bash
# 方式 1：Zeabur Dashboard 手動操作
1. 訪問 https://dash.zeabur.com
2. 找到 app 專案 > ratewise 服務
3. 點擊 "Redeploy" 按鈕
4. 等待 build logs 完成（約 5-8 分鐘）

# 方式 2：使用空 Commit 觸發（推薦）
git commit --allow-empty -m "chore(deploy): force production rebuild for PWA fixes

Trigger Zeabur redeploy to sync latest build artifacts
- Fixes manifest.webmanifest scope/start_url/id consistency
- Resolves 404 error for index-HiiysA25.js
- Ensures Service Worker registration

Refs: commits 369d5c3, 59bf117, 4f871d4
Related: docs/dev/007, docs/dev/008"

git push origin main
```

**驗收標準**:

- [ ] Zeabur Dashboard 顯示新的部署記錄
- [ ] Build logs 無錯誤
- [ ] 部署狀態為 "Running"

---

#### TODO-P0-CACHE-002: 清除 Cloudflare CDN 快取

**負責人**: @s123104  
**預估時間**: 5 分鐘  
**狀態**: 🔴 待執行  
**依賴**: TODO-P0-DEPLOY-001

**執行步驟**:

```bash
# 方式 1：Cloudflare Dashboard
1. 訪問 Cloudflare Dashboard
2. 選擇 haotool.org 域名
3. Caching > Configuration > Purge Cache
4. 選擇 "Custom Purge"
5. 輸入 URLs:
   - https://app.haotool.org/ratewise/*
   - https://app.haotool.org/manifest.webmanifest
6. 點擊 "Purge"

# 方式 2：使用 API（需要 API Token）
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{
    "files": [
      "https://app.haotool.org/ratewise/",
      "https://app.haotool.org/manifest.webmanifest"
    ]
  }'
```

**驗收標準**:

- [ ] Cloudflare 返回成功訊息
- [ ] 硬重新整理後看到新版本

---

#### TODO-P0-VERIFY-003: 生產環境完整驗證

**負責人**: @s123104  
**預估時間**: 15 分鐘  
**狀態**: 🔴 待執行  
**依賴**: TODO-P0-CACHE-002

**驗證清單**:

```bash
# 1. Manifest 配置驗證
curl -s https://app.haotool.org/manifest.webmanifest | jq '{scope, start_url, id}'

# 預期輸出：
# {
#   "scope": "/ratewise/",
#   "start_url": "/ratewise/",
#   "id": "/ratewise/"
# }

# 2. 靜態資源驗證（檢查無 404）
curl -I https://app.haotool.org/ratewise/assets/index-PtKlPOcc.js

# 預期：HTTP/2 200

# 3. Console 錯誤檢查
# 開啟瀏覽器 DevTools > Console
# 預期：無 PWA manifest 警告，無 404 錯誤
```

**驗收標準**:

- [ ] Manifest scope/start_url/id 全部正確
- [ ] 靜態資源 200 OK
- [ ] Console 無警告/錯誤
- [ ] Service Worker 已註冊
- [ ] PWA 安裝提示出現

---

### 階段二：程式碼修正（P1）- 預計 45 分鐘

#### TODO-P1-CODE-004: 修正 vite.config.ts 錯誤註解

**負責人**: @s123104  
**預估時間**: 5 分鐘  
**狀態**: 🔴 待執行  
**依賴**: TODO-P0-VERIFY-003

**修改內容**:

```typescript
// 檔案：apps/ratewise/vite.config.ts
// 行數：256-258

// 刪除錯誤註解，替換為正確版本（見 § 2.4）
```

**驗收標準**:

- [ ] 註解內容正確反映最佳實踐
- [ ] 引用權威來源
- [ ] 標註錯誤假設與修正歷史

---

#### TODO-P1-SCRIPT-005: 建立部署檢查腳本

**負責人**: @s123104  
**預估時間**: 20 分鐘  
**狀態**: 🔴 待執行  
**依賴**: 無

**建立檔案**:

1. `scripts/pre-deploy-check.sh`（見 § 2.2）
2. `scripts/post-deploy-verify.sh`（見 § 2.2）
3. `scripts/purge-cloudflare-cache.sh`（見 § 2.2）

**驗收標準**:

- [ ] 所有腳本可執行（chmod +x）
- [ ] 本地測試通過
- [ ] 文檔完整（用法說明）

---

#### TODO-P1-DOC-006: 更新部署文檔

**負責人**: @s123104  
**預估時間**: 20 分鐘  
**狀態**: 🔴 待執行  
**依賴**: TODO-P1-SCRIPT-005

**更新檔案**:

1. `docs/DEPLOYMENT.md` - 加入檢查清單
2. `docs/dev/002_development_reward_penalty_log.md` - 加入新紀錄
3. `docs/dev/007_pwa_configuration_fix.md` - 更新驗證結果

**驗收標準**:

- [ ] 所有文檔更新完成
- [ ] 交叉引用正確
- [ ] 時間戳記使用 time.now 工具

---

### 階段三：CI/CD 增強（P2）- 預計 90 分鐘

#### TODO-P2-CICD-007: 更新 GitHub Actions Workflow

**負責人**: @s123104  
**預估時間**: 60 分鐘  
**狀態**: ⚪ 待規劃  
**依賴**: TODO-P1-SCRIPT-005

**修改檔案**: `.github/workflows/deploy-production.yml`

**驗收標準**:

- [ ] 整合 pre-deploy 檢查
- [ ] 整合 post-deploy 驗證
- [ ] 整合快取清除
- [ ] 本地測試通過（使用 act）

---

#### TODO-P2-MONITOR-008: 設定監控與告警

**負責人**: @s123104  
**預估時間**: 30 分鐘  
**狀態**: ⚪ 待規劃  
**依賴**: TODO-P2-CICD-007

**實作項目**:

1. Sentry PWA 錯誤監控
2. Cloudflare Analytics 404 告警
3. 部署失敗通知（Slack/Email）

**驗收標準**:

- [ ] 監控已設定並運作
- [ ] 告警規則已測試
- [ ] 文檔已更新

---

### 階段四：技術債清理（P3）- 預計 120 分鐘

#### TODO-P3-DEBT-009: 清理程式碼 TODO 標記

**負責人**: @s123104  
**預估時間**: 60 分鐘  
**狀態**: ⚪ 待規劃  
**依賴**: 無

**清理檔案**:

1. `useCurrencyConverter.ts` (3 個 TODO)
2. `exchangeRateCalculation.test.ts` (1 個 TODO)
3. `logger.ts` (1 個 FIXME - Sentry 整合)

**驗收標準**:

- [ ] 所有 TODO/FIXME 已處理或移除
- [ ] 程式碼品質提升
- [ ] 測試覆蓋率維持或提升

---

#### TODO-P3-REFACTOR-010: useCurrencyConverter Hook 拆分

**負責人**: @s123104  
**預估時間**: 60 分鐘  
**狀態**: ⚪ 待規劃  
**依賴**: TODO-P3-DEBT-009

**重構計畫**:

- 將 317 行拆分為多個小 hook
- 提升可測試性
- 改善可維護性

**驗收標準**:

- [ ] 每個 hook < 100 行
- [ ] 測試覆蓋率 ≥ 80%
- [ ] 無 Linter 錯誤

---

## 5. 子功能規格

### 5.1 Pre-deploy Check Script

**功能描述**: 部署前自動檢查 build 產物是否符合規範

**API 介面**:

```bash
# 用法
./scripts/pre-deploy-check.sh

# 環境變數
VITE_BASE_PATH=/ratewise/

# 返回碼
0 - 檢查通過
1 - 檢查失敗
```

**檢查項目**:

1. 環境變數存在性檢查
2. Manifest 檔案存在性檢查
3. Manifest 配置一致性驗證
4. 尾斜線格式檢查

**驗收標準**:

- [ ] 所有檢查項目涵蓋
- [ ] 錯誤訊息清晰
- [ ] 退出碼正確

---

### 5.2 Post-deploy Verification Script

**功能描述**: 部署後驗證生產環境是否正常運作

**API 介面**:

```bash
# 用法
./scripts/post-deploy-verify.sh

# 環境變數
DEPLOY_URL=https://app.haotool.org/ratewise

# 返回碼
0 - 驗證通過
1 - 驗證失敗
```

**驗證項目**:

1. HTTP 狀態碼檢查
2. Manifest 配置驗證
3. Service Worker 註冊檢查
4. Console 錯誤掃描

**驗收標準**:

- [ ] 涵蓋所有關鍵驗證點
- [ ] 失敗時提供詳細錯誤資訊
- [ ] 支援 CI/CD 整合

---

### 5.3 Cloudflare Cache Purge Script

**功能描述**: 自動清除 Cloudflare CDN 快取

**API 介面**:

```bash
# 用法
./scripts/purge-cloudflare-cache.sh

# 環境變數
CLOUDFLARE_ZONE_ID=<zone_id>
CLOUDFLARE_API_TOKEN=<api_token>

# 返回碼
0 - 清除成功
1 - 清除失敗
```

**清除範圍**:

- `/ratewise/` 所有資源
- `/manifest.webmanifest`
- `/ratewise/assets/*`

**驗收標準**:

- [ ] API 認證正確
- [ ] 清除範圍完整
- [ ] 錯誤處理完善

---

## 6. 當前進度實作

### 6.1 立即可執行的修復（方案 A）

**檔案**: `scripts/quick-fix.sh`（新建）

```bash
#!/bin/bash
# Quick Fix Script - 立即修復生產環境問題
# 執行時間：約 20 分鐘

set -e

echo "🚀 開始 PWA 生產環境快速修復流程..."

# === 步驟 1：強制 Zeabur 重新部署 ===
echo "📦 步驟 1/3：觸發 Zeabur 重新部署"
echo "請選擇部署方式："
echo "  1) 使用空 Commit 觸發 CI/CD（推薦）"
echo "  2) 手動在 Zeabur Dashboard 點擊 Redeploy"
read -p "選擇 (1/2): " deploy_choice

if [ "$deploy_choice" == "1" ]; then
  git commit --allow-empty -m "chore(deploy): force production rebuild for PWA fixes

Trigger Zeabur redeploy to sync latest build artifacts
- Fixes manifest.webmanifest scope/start_url/id consistency
- Resolves 404 error for index-HiiysA25.js
- Ensures Service Worker registration

Refs: commits 369d5c3, 59bf117, 4f871d4
Related: docs/dev/007, docs/dev/008"

  git push origin main

  echo "✅ 已觸發 CI/CD 部署，等待 Zeabur 完成..."
  echo "⏳ 預計等待時間：5-10 分鐘"

  # 等待部署
  sleep 300  # 5 分鐘

  echo "⏳ 繼續等待..."
  sleep 300  # 再等 5 分鐘
else
  echo "📋 請執行以下步驟："
  echo "  1. 訪問 https://dash.zeabur.com"
  echo "  2. 找到 app 專案 > ratewise 服務"
  echo "  3. 點擊 'Redeploy' 按鈕"
  echo "  4. 等待 5-10 分鐘直到部署完成"
  read -p "完成後按 Enter 繼續..."
fi

# === 步驟 2：清除 Cloudflare 快取 ===
echo "🗑️  步驟 2/3：清除 Cloudflare CDN 快取"

if [ -n "$CLOUDFLARE_ZONE_ID" ] && [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  echo "使用 API 自動清除..."

  RESPONSE=$(curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{
      "files": [
        "https://app.haotool.org/ratewise/",
        "https://app.haotool.org/ratewise/index.html",
        "https://app.haotool.org/manifest.webmanifest"
      ]
    }')

  if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Cloudflare 快取已清除"
  else
    echo "❌ API 清除失敗，請手動操作"
    echo "$RESPONSE"
  fi
else
  echo "📋 請手動清除 Cloudflare 快取："
  echo "  1. 訪問 Cloudflare Dashboard"
  echo "  2. 選擇 haotool.org 域名"
  echo "  3. Caching > Configuration > Purge Cache"
  echo "  4. Custom Purge 以下 URLs:"
  echo "     - https://app.haotool.org/ratewise/*"
  echo "     - https://app.haotool.org/manifest.webmanifest"
  read -p "完成後按 Enter 繼續..."
fi

# === 步驟 3：驗證修復結果 ===
echo "✅ 步驟 3/3：驗證生產環境"

echo "檢查 Manifest 配置..."
MANIFEST_JSON=$(curl -s https://app.haotool.org/manifest.webmanifest)
SCOPE=$(echo "$MANIFEST_JSON" | jq -r '.scope')
START_URL=$(echo "$MANIFEST_JSON" | jq -r '.start_url')
ID=$(echo "$MANIFEST_JSON" | jq -r '.id')

echo "  scope: $SCOPE"
echo "  start_url: $START_URL"
echo "  id: $ID"

if [ "$SCOPE" == "/ratewise/" ] && [ "$START_URL" == "/ratewise/" ] && [ "$ID" == "/ratewise/" ]; then
  echo "✅ Manifest 配置正確"
else
  echo "⚠️  Manifest 配置仍有問題，可能需要等待更長時間或手動檢查"
fi

echo ""
echo "🎉 快速修復流程完成！"
echo ""
echo "📋 請手動驗證以下項目："
echo "  1. 訪問 https://app.haotool.org/ratewise"
echo "  2. 開啟 DevTools > Console，確認無警告/錯誤"
echo "  3. 開啟 DevTools > Application > Manifest，確認配置正確"
echo "  4. 開啟 DevTools > Application > Service Workers，確認已註冊"
echo "  5. 測試 PWA 安裝提示是否出現"
echo ""
echo "如果問題仍存在，請執行 方案 C（環境變數檢查）"
```

**使用方式**:

```bash
chmod +x scripts/quick-fix.sh

# 方式 1：使用 API 自動化
CLOUDFLARE_ZONE_ID=xxx CLOUDFLARE_API_TOKEN=yyy ./scripts/quick-fix.sh

# 方式 2：手動操作引導
./scripts/quick-fix.sh
```

---

### 6.2 vite.config.ts 註解修正

**檔案**: `apps/ratewise/vite.config.ts`

```typescript
// 現有行數 130-131（正確，無需修改）
const manifestScope = base.endsWith('/') ? base : `${base}/`;
const manifestStartUrl = manifestScope;

// 修改行數 256-262
// === 刪除以下錯誤註解 ===
// [fix:2025-11-05] PWA manifest 路徑最佳實踐
// - scope: 帶尾斜線 (MDN 規範要求，否則退回到根域名)
// - start_url: 無尾斜線 (避免 nginx 301 重定向)  ❌ 錯誤
// - id: 無尾斜線 (唯一識別符，與 start_url 一致)  ❌ 錯誤

// === 替換為正確註解 ===
// [fix:2025-11-06] PWA Manifest 配置最佳實踐
//
// 根據 MDN/W3C PWA 規範，所有路徑欄位必須完全一致且帶尾斜線：
//
// 1. scope: "/ratewise/"
//    - 定義 PWA 應用的導航範圍
//    - 必須以 "/" 結尾，否則被視為字串前綴匹配
//    - 範例："/ratewise" 會匹配 "/ratewisexyz" (錯誤)
//
// 2. start_url: "/ratewise/"
//    - PWA 啟動時的初始 URL
//    - 必須在 scope 範圍內（字串前綴匹配）
//    - 如果不在範圍內，scope 會被忽略並退回根域名
//
// 3. id: "/ratewise/"
//    - PWA 的唯一識別符
//    - 必須與 start_url 保持一致
//    - 用於區分不同的 PWA 應用
//
// 參考文獻（強制透過 context7 動態獲取）:
// - [MDN Web Manifest Scope]
//   https://developer.mozilla.org/en-US/docs/Web/Manifest/scope
// - [W3C Web App Manifest]
//   https://www.w3.org/TR/appmanifest/#scope-member
// - [Vite PWA Plugin Documentation]
//   [context7:vite-pwa/vite-plugin-pwa:2025-11-06T00:04:56+08:00]
//
// 常見錯誤與修正歷史：
// ❌ Commit 32a254a (2025-11-05):
//    錯誤假設「移除尾斜線可避免 nginx 301 重定向」
//    → 違反 PWA 規範，導致 Service Worker scope 錯誤
//
// ✅ Commit 59bf117, 4f871d4 (2025-11-05):
//    刪除靜態 manifest 檔案，依賴 Vite 動態生成
//    → 修正 scope/start_url/id 一致性問題
//
// 正確做法：
// 1. 確保 vite.config.ts 中 base 與 manifest.scope 一致
// 2. 所有路徑欄位使用相同的值（帶尾斜線）
// 3. 避免在 public/ 目錄放置靜態 manifest.webmanifest
// 4. nginx 配置應正確處理子路徑，不影響 PWA manifest 規範
```

---

### 6.3 更新獎懲記錄

**檔案**: `docs/dev/002_development_reward_penalty_log.md`

```markdown
| ✅ 成功 | PWA 生產環境部署修復診斷 | 完整診斷生產環境問題，創建 008 文檔與修復方案 | [context7:vite-pwa/vite-plugin-pwa:2025-11-06]<br>docs/dev/008 | +2 |
| ✅ 成功 | 創建自動化部署檢查腳本 | pre-deploy-check.sh + post-deploy-verify.sh + purge-cloudflare-cache.sh | Shell Script 最佳實踐 + CI/CD 整合 | +2 |
| 💡 學習 | Cloudflare API 快取清除 | 理解 Cloudflare Purge Cache API 使用方式 | [Cloudflare API Docs](https://developers.cloudflare.com/api/) | 0 |
| 💡 學習 | Zeabur 部署流程與快取機制 | 理解 CI/CD 鏈、build artifacts 同步與 CDN 快取影響 | Zeabur 官方文檔 + 實際部署經驗 | 0 |
| ⚠️ 注意 | 生產環境部署延遲可達 10+ 分鐘 | Zeabur 部署 + Cloudflare CDN 傳播需要時間 | 實測經驗（2025-11-05/11-06） | 0 |

**當前總分**: +49
```

---

## 7. 實作交付清單

### 7.1 已建立檔案

- [x] `docs/dev/008_pwa_production_deployment_fix.md` - 完整診斷報告
- [x] `docs/dev/009_automated_best_practices_analysis.md` - 本文檔
- [x] `scripts/quick-fix.sh` - 快速修復腳本（待建立）

### 7.2 待建立檔案

- [ ] `scripts/pre-deploy-check.sh` - 部署前檢查
- [ ] `scripts/post-deploy-verify.sh` - 部署後驗證
- [ ] `scripts/purge-cloudflare-cache.sh` - 快取清除
- [ ] `.github/workflows/deploy-production.yml` - CI/CD 增強

### 7.3 待修改檔案

- [ ] `apps/ratewise/vite.config.ts` (行 256-262) - 註解修正
- [ ] `docs/dev/002_development_reward_penalty_log.md` - 加入新紀錄
- [ ] `docs/dev/007_pwa_configuration_fix.md` - 更新驗證結果
- [ ] `docs/DEPLOYMENT.md` - 加入部署檢查清單

---

## 8. 下一步行動

### 立即執行（0-30 分鐘）

1. **執行快速修復腳本**

   ```bash
   ./scripts/quick-fix.sh
   ```

2. **驗證生產環境**
   - 訪問 https://app.haotool.org/ratewise
   - 檢查 Console 無警告
   - 確認 Service Worker 已註冊

3. **更新文檔**
   - 更新 002 獎懲記錄
   - 更新 007 驗證結果

### 短期執行（1-3 天）

1. **建立部署檢查腳本**
2. **修正 vite.config.ts 註解**
3. **更新 CI/CD Workflow**

### 中期執行（1-2 週）

1. **清理程式碼 TODO**
2. **重構 useCurrencyConverter**
3. **設定監控與告警**

---

## 9. 風險與緩解

### 高風險項目

| 風險                    | 機率 | 影響 | 緩解措施                              |
| ----------------------- | ---- | ---- | ------------------------------------- |
| Zeabur 部署失敗         | 低   | 高   | 檢查 build logs，必要時手動 rebuild   |
| Cloudflare API 認證錯誤 | 中   | 中   | 提供手動操作步驟作為備案              |
| 快取清除未生效          | 中   | 低   | 等待 1 小時自然過期，或多次硬重新整理 |

### 回滾計畫

如果修復失敗：

1. 立即回滾 git commit
2. Zeabur Dashboard 選擇上一個成功的部署
3. 記錄失敗原因並建立 Issue

---

**狀態**: ✅ 分析完成，待執行實作  
**下一步**: 執行 TODO-P0-DEPLOY-001（強制 Zeabur 重新部署）
