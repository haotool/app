# Staging 測試環境配置指南

**建立時間**: 2025-11-06T12:30:00+08:00  
**狀態**: 🔄 進行中  
**目的**: 修復測試環境 403 錯誤與 CSP 違規問題

---

## § 1 問題診斷

### 錯誤 1: CSP 違規
```
Connecting to 'http://ratewise-staging.zeabur.app:8080/ratewise' 
violates Content Security Policy directive: "connect-src 'self' ..."
```

**根本原因**:
- ❌ 應用嘗試連接到 `http://....:8080/ratewise`（錯誤的端口和路徑）
- ❌ CSP 只允許 `'self'`（即 `https://ratewise-staging.zeabur.app`）
- ❌ `VITE_BASE_PATH=/` 與 Dockerfile 預設 `/ratewise/` 不一致

### 錯誤 2: 環境變數不一致
```
Dockerfile ARG: VITE_BASE_PATH=/ratewise/  (預設值)
Zeabur ENV:     VITE_BASE_PATH=/            (測試環境設定)
```

**衝突**: Dockerfile 在建置時使用預設值 `/ratewise/`，但 Zeabur 環境變數在運行時無法覆蓋已編譯的值。

---

## § 2 解決方案

### 方案 A: 測試環境使用與生產環境相同的配置 ⭐ 推薦

**原理**: 讓測試環境完全模擬生產環境，確保測試結果準確。

#### Zeabur 環境變數配置

```bash
# ✅ 與生產環境完全一致
VITE_BASE_PATH=/ratewise/
NODE_ENV=production
CI=true
ENVIRONMENT=staging

# 可選：除錯模式
VITE_SENTRY_DEBUG=true
```

#### 優勢
- ✅ 測試環境與生產環境完全一致
- ✅ 測試結果可信度高
- ✅ 無需修改 Dockerfile
- ✅ 部署配置簡單

#### 劣勢
- ⚠️ 測試環境網址會是 `https://ratewise-staging.zeabur.app/ratewise/`
- ⚠️ 需要確保 nginx 配置支援 `/ratewise/` 路徑

---

### 方案 B: 修改 Dockerfile 支援動態 Base Path

**原理**: 讓 Dockerfile 在建置時從環境變數讀取 `VITE_BASE_PATH`。

#### Dockerfile 修改

```dockerfile
# [fix:2025-11-06] VITE_BASE_PATH 改為可配置
ARG VITE_BASE_PATH=/ratewise/

# 在建置時傳遞環境變數
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

# 建置時會使用環境變數
RUN pnpm build:ratewise
```

#### Zeabur 環境變數配置

```bash
# ✅ 測試環境使用根路徑
VITE_BASE_PATH=/
NODE_ENV=production
CI=true
ENVIRONMENT=staging
```

#### 優勢
- ✅ 測試環境網址簡潔 `https://ratewise-staging.zeabur.app/`
- ✅ 靈活性高，可以為不同環境設定不同路徑

#### 劣勢
- ⚠️ 測試環境與生產環境配置不同
- ⚠️ 可能無法發現路徑相關的問題
- ⚠️ 需要修改 Dockerfile 和 nginx.conf

---

## § 3 推薦配置（方案 A）

### 3.1 Zeabur 環境變數（完整清單）

```bash
# ==========================================
# Zeabur Staging 環境變數配置
# 專案: ratewise-staging
# 分支: fix/403-forbidden-error
# ==========================================

# 基礎路徑（與生產環境一致）
VITE_BASE_PATH=/ratewise/

# Node 環境
NODE_ENV=production
CI=true

# 環境標識
ENVIRONMENT=staging

# Zeabur 自動提供（無需手動設定）
PORT=${WEB_PORT}

# 可選：Sentry 除錯
VITE_SENTRY_DEBUG=true

# 可選：站點 URL（測試環境）
VITE_SITE_URL=https://ratewise-staging.zeabur.app
```

### 3.2 訪問網址

```
測試環境: https://ratewise-staging.zeabur.app/ratewise/
生產環境: https://app.haotool.org/ratewise/
```

### 3.3 nginx.conf 驗證

當前 nginx.conf 已支援 `/ratewise/` 路徑：

```nginx
# Line 131-140: 處理 /ratewise 路徑
location = /ratewise {
    try_files /index.html =404;
}

location = /ratewise/ {
    return 301 /ratewise;
}
```

✅ 無需修改 nginx.conf

---

## § 4 立即修復步驟

### 步驟 1: 更新 Zeabur 環境變數

登入 [Zeabur 控制台](https://dash.zeabur.com/)，進入 `ratewise-staging` 服務：

1. 點擊 **「Variables」** 標籤
2. 修改環境變數：

```diff
- VITE_BASE_PATH=/
+ VITE_BASE_PATH=/ratewise/

  NODE_ENV=production
  CI=true
  ENVIRONMENT=staging
  PORT=${WEB_PORT}
  
+ VITE_SITE_URL=https://ratewise-staging.zeabur.app
```

3. 點擊 **「Save」** 儲存
4. Zeabur 會自動重新部署（約 2-3 分鐘）

### 步驟 2: 驗證部署

等待部署完成後，訪問：
```
https://ratewise-staging.zeabur.app/ratewise/
```

**預期結果**:
- ✅ 頁面正常載入
- ✅ 無 403 錯誤
- ✅ 無 CSP 違規
- ✅ 匯率資料正常顯示

### 步驟 3: 檢查 Console

打開瀏覽器開發者工具：
- ✅ 無紅色錯誤
- ✅ Service Worker 正常註冊
- ✅ API 請求成功

---

## § 5 為什麼要保持一致？

### 路徑一致性的重要性

```javascript
// vite.config.ts 中的配置
const base = process.env['VITE_BASE_PATH'] || '/';

// 影響範圍：
1. 所有靜態資源路徑 (JS/CSS/Images)
2. Service Worker 註冊路徑
3. Manifest scope 和 start_url
4. React Router basename
5. API 請求路徑
```

**如果測試環境使用 `/`，生產環境使用 `/ratewise/`**:
- ❌ 可能無法發現路徑相關的 bug
- ❌ Service Worker scope 不同
- ❌ PWA 安裝行為不同
- ❌ 路由跳轉邏輯不同

---

## § 6 替代方案（如果堅持使用根路徑）

如果您確實希望測試環境使用根路徑 `/`，需要：

### 6.1 修改 Dockerfile

```dockerfile
# 支援從環境變數讀取 VITE_BASE_PATH
ARG VITE_BASE_PATH=/ratewise/

# 確保環境變數在建置時生效
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

# 建置時使用環境變數
RUN export VITE_BASE_PATH=${VITE_BASE_PATH} && pnpm build:ratewise
```

### 6.2 修改 nginx.conf

創建測試環境專用的 nginx 配置：

```nginx
# nginx-staging.conf
server {
    listen 8080;
    root /usr/share/nginx/html;
    
    # 根路徑直接服務 SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 其他配置與 nginx.conf 相同
}
```

### 6.3 修改 Dockerfile

```dockerfile
# 根據環境使用不同的 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf
# 如果是測試環境，覆蓋配置
RUN if [ "${VITE_BASE_PATH}" = "/" ]; then \
      cp nginx-staging.conf /etc/nginx/nginx.conf; \
    fi
```

**⚠️ 不推薦**: 這會導致測試環境與生產環境不一致。

---

## § 7 推薦的最終配置

### Zeabur Staging 環境變數

```bash
# ==========================================
# 推薦配置：與生產環境完全一致
# ==========================================

VITE_BASE_PATH=/ratewise/
NODE_ENV=production
CI=true
ENVIRONMENT=staging
PORT=${WEB_PORT}
VITE_SITE_URL=https://ratewise-staging.zeabur.app
```

### 訪問方式

```
測試環境: https://ratewise-staging.zeabur.app/ratewise/
生產環境: https://app.haotool.org/ratewise/
```

### 驗證清單

部署完成後檢查：
- [ ] 訪問 `https://ratewise-staging.zeabur.app/ratewise/` 正常
- [ ] 無 403 錯誤
- [ ] 無 CSP 違規
- [ ] Console 無錯誤
- [ ] Service Worker 正常註冊
- [ ] PWA 可以安裝
- [ ] 匯率資料正常載入

---

## § 8 快速修復指令

```bash
# 1. 在 Zeabur 控制台更新環境變數
# VITE_BASE_PATH=/ratewise/

# 2. 等待自動重新部署（2-3 分鐘）

# 3. 驗證
curl -I https://ratewise-staging.zeabur.app/ratewise/

# 4. 瀏覽器測試
# 訪問: https://ratewise-staging.zeabur.app/ratewise/
```

---

**結論**: 強烈建議使用方案 A（保持路徑一致），確保測試環境能準確反映生產環境的行為。

**下一步**: 請在 Zeabur 控制台更新環境變數，然後等待重新部署完成。

