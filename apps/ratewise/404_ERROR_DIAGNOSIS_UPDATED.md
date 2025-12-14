# RateWise 404 錯誤診斷報告（更新版）

**日期**: 2025-12-14
**診斷者**: Claude Code
**狀態**: ✅ 根本原因已確認

---

## 📊 專案架構概覽

### Monorepo 多專案部署結構

您的專案是一個 **monorepo**，包含三個應用部署在同一個域名下：

```
app.haotool.org/
├── /                    → haotool (首頁) [新增]
├── /ratewise/           → ratewise (匯率工具)
└── /nihonname/          → nihonname (日本名工具)
```

### Docker 部署配置

從 `Dockerfile` 可以看到部署結構：

```dockerfile
# haotool 作為根目錄（首頁）
COPY --from=builder /app/apps/haotool/dist /usr/share/nginx/html

# ratewise 到子目錄
COPY --from=builder /app/apps/ratewise/dist /usr/share/nginx/html/ratewise-app

# nihonname 到子目錄
COPY --from=builder /app/apps/nihonname/dist /usr/share/nginx/html/nihonname-app

# 創建符號連結
RUN ln -s /usr/share/nginx/html/ratewise-app /usr/share/nginx/html/ratewise && \
    ln -s /usr/share/nginx/html/nihonname-app /usr/share/nginx/html/nihonname
```

**物理目錄結構**：

```
/usr/share/nginx/html/
├── index.html                  (haotool 首頁)
├── ratewise-app/               (ratewise 實體目錄)
│   └── index.html
├── ratewise -> ratewise-app/   (符號連結)
├── nihonname-app/              (nihonname 實體目錄)
│   └── index.html
└── nihonname -> nihonname-app/ (符號連結)
```

---

## ⚠️ 問題根源（已確認）

### 🔴 關鍵問題：Nginx 路由配置錯誤

**位置**: `nginx.conf:324-326`

```nginx
location = /ratewise/ {
    try_files /index.html =404;  # ❌ 錯誤！指向 haotool 的 index.html
}
```

**問題分析**：

1. 當訪問 `/ratewise/` 時，nginx 嘗試載入 `/index.html`
2. 但 `/index.html` 是 **haotool 首頁**，不是 ratewise
3. 導致載入了錯誤的應用（haotool），而 haotool 不知道如何處理 `/ratewise/` 路由
4. 結果：顯示 "Unexpected Application Error! 404 Not Found"

**對比 nihonname 的正確配置**（`nginx.conf:249-258`）：

```nginx
location /nihonname/ {
    alias /usr/share/nginx/html/nihonname-app/;  # ✅ 正確！指向專屬目錄
    index index.html;
    try_files $uri $uri/ @nihonname_html_fallback;
}
```

---

## 🔧 修復方案

### 方案 A：修正 Nginx 配置（推薦）

**修改 `nginx.conf:320-326`**：

```nginx
# 修改前 ❌
location = /ratewise {
    return 301 $scheme://$host/ratewise/;
}

location = /ratewise/ {
    try_files /index.html =404;  # 錯誤！
}

# 修改後 ✅
location = /ratewise {
    return 301 $scheme://$host/ratewise/;
}

location /ratewise/ {
    alias /usr/share/nginx/html/ratewise-app/;
    index index.html;
    try_files $uri $uri/ /ratewise/index.html;
}
```

**說明**：

- 使用 `alias` 指向正確的 `ratewise-app/` 目錄
- `try_files` 順序：直接文件 → 目錄/index.html → SPA fallback
- 與 nihonname 配置保持一致

### 方案 B：統一環境變數命名（建議同時執行）

**當前狀態**：

```dockerfile
ARG VITE_BASE_PATH=/ratewise/              # ❌ ratewise 使用通用名稱
ARG VITE_NIHONNAME_BASE_PATH=/nihonname/   # ✅ nihonname 專屬
ARG VITE_HAOTOOL_BASE_PATH=/               # ✅ haotool 專屬
```

**建議修改**（保持一致性）：

```dockerfile
ARG VITE_HAOTOOL_BASE_PATH=/
ARG VITE_RATEWISE_BASE_PATH=/ratewise/     # 改為專屬變數
ARG VITE_NIHONNAME_BASE_PATH=/nihonname/
```

**同時修改 `apps/ratewise/vite.config.ts:147`**：

```typescript
// 修改前
const baseFromEnv = env.VITE_BASE_PATH || process.env['VITE_BASE_PATH'];

// 修改後
const baseFromEnv = env.VITE_RATEWISE_BASE_PATH || process.env['VITE_RATEWISE_BASE_PATH'];
```

---

## 📝 最佳實踐建議

### 1. 環境變數命名規範

**原則**：每個專案使用專屬的環境變數前綴，避免衝突

```bash
# ✅ 推薦命名
VITE_HAOTOOL_BASE_PATH=/
VITE_RATEWISE_BASE_PATH=/ratewise/
VITE_NIHONNAME_BASE_PATH=/nihonname/

# ❌ 避免通用名稱
VITE_BASE_PATH=???  # 哪個專案？
```

### 2. Nginx 配置模式

**對於每個子應用，使用統一的配置模式**：

```nginx
# 模板
location /<app-name>/ {
    alias /usr/share/nginx/html/<app-name>-app/;
    index index.html;
    try_files $uri $uri/ /<app-name>/index.html;
}
```

**應用到 ratewise 和 nihonname**：

```nginx
# ratewise 配置
location /ratewise/ {
    alias /usr/share/nginx/html/ratewise-app/;
    index index.html;
    try_files $uri $uri/ /ratewise/index.html;
}

# nihonname 配置（已正確）
location /nihonname/ {
    alias /usr/share/nginx/html/nihonname-app/;
    index index.html;
    try_files $uri $uri/ @nihonname_html_fallback;
}
```

### 3. Docker 建置流程

**保持當前的分離建置模式**（已正確）：

```dockerfile
RUN VITE_HAOTOOL_BASE_PATH=/ pnpm build:haotool && \
    VITE_RATEWISE_BASE_PATH=/ratewise/ pnpm build:ratewise && \
    VITE_NIHONNAME_BASE_PATH=/nihonname/ pnpm build:nihonname
```

### 4. 部署驗證清單

**部署後必須驗證**：

```bash
# 1. 檢查首頁
curl -I https://app.haotool.org/
# 預期：200 OK，返回 haotool 首頁

# 2. 檢查 ratewise
curl -I https://app.haotool.org/ratewise/
# 預期：200 OK，返回 ratewise 應用

# 3. 檢查 nihonname
curl -I https://app.haotool.org/nihonname/
# 預期：200 OK，返回 nihonname 應用

# 4. 檢查資源載入
curl -I https://app.haotool.org/ratewise/assets/app-*.js
# 預期：200 OK，正確的 JS 檔案
```

---

## 🚀 立即修復步驟

### Step 1: 修正 Nginx 配置

**編輯 `nginx.conf`**：

```bash
# 在專案根目錄
vim nginx.conf
```

**找到 Line 320-326，修改為**：

```nginx
# [SEO:2025-12-01] 301 統一尾斜線
location = /ratewise {
    return 301 $scheme://$host/ratewise/;
}

# [FIX:2025-12-14] RateWise SPA 路由配置
location /ratewise/ {
    alias /usr/share/nginx/html/ratewise-app/;
    index index.html;
    try_files $uri $uri/ /ratewise/index.html;
}
```

### Step 2: 統一環境變數（可選但推薦）

**編輯 `Dockerfile`**：

```dockerfile
# Line 13-15
ARG VITE_HAOTOOL_BASE_PATH=/
ARG VITE_RATEWISE_BASE_PATH=/ratewise/  # 改名
ARG VITE_NIHONNAME_BASE_PATH=/nihonname/

# Line 66-68
RUN VITE_HAOTOOL_BASE_PATH=/ pnpm build:haotool && \
    VITE_RATEWISE_BASE_PATH=/ratewise/ pnpm build:ratewise && \  # 改名
    VITE_NIHONNAME_BASE_PATH=/nihonname/ pnpm build:nihonname
```

**編輯 `apps/ratewise/vite.config.ts`**：

```typescript
// Line 147（大約）
const baseFromEnv = env.VITE_RATEWISE_BASE_PATH || process.env['VITE_RATEWISE_BASE_PATH'];
```

### Step 3: 提交並部署

```bash
# 1. 提交變更
git add nginx.conf Dockerfile apps/ratewise/vite.config.ts
git commit -m "fix(nginx): 修正 ratewise 路由配置指向正確目錄

- 修改 nginx.conf location /ratewise/ 使用 alias 指向 ratewise-app/
- 統一環境變數命名：VITE_BASE_PATH → VITE_RATEWISE_BASE_PATH
- 與 nihonname 配置保持一致

修復：ratewise 顯示 404 錯誤問題
原因：nginx 錯誤載入 haotool 的 index.html 而非 ratewise"

# 2. 推送到分支
git push origin claude/fix-ratewise-404-error-rTQev

# 3. 重新部署
# （觸發 CI/CD 或手動部署）
```

### Step 4: 驗證修復

```bash
# 瀏覽器訪問
https://app.haotool.org/ratewise/

# 或使用 curl 測試
curl -I https://app.haotool.org/ratewise/

# 檢查瀏覽器開發者工具 > Network
# 確認 /ratewise/assets/*.js 正確載入
```

---

## 📊 架構優勢與建議

### ✅ 當前架構優勢

1. **單一容器部署**：三個專案共享基礎設施，降低成本
2. **統一域名**：SEO 友好，權重集中在 `app.haotool.org`
3. **Monorepo 管理**：代碼共享、統一 CI/CD
4. **Nginx 反向代理**：靈活路由控制

### 💡 未來改進建議

1. **添加部署測試**：

   ```bash
   # 在 CI 中驗證 nginx 配置
   nginx -t -c nginx.conf

   # 部署後自動測試
   curl -f https://app.haotool.org/ || exit 1
   curl -f https://app.haotool.org/ratewise/ || exit 1
   curl -f https://app.haotool.org/nihonname/ || exit 1
   ```

2. **文檔化路由規則**：
   - 在 `DEPLOYMENT.md` 中記錄多專案路由配置
   - 添加故障排除指南

3. **監控與告警**：
   - 設置健康檢查端點監控
   - 404 錯誤日誌告警

---

## 📚 相關文件

- `Dockerfile` - 多專案建置配置
- `nginx.conf` - Nginx 路由規則
- `apps/*/vite.config.ts` - 各專案建置配置
- `404_ERROR_DIAGNOSIS.md` - 初步診斷報告

---

**診斷完成時間**: 2025-12-14T02:30:00Z
**修復優先級**: 🔴 Critical
**預估修復時間**: 10 分鐘（修改配置 + 重新部署）
