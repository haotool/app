# Zeabur 部署指南

> 本指南提供在 Zeabur 平台上部署一個典型 Web 應用的完整流程。

## 📋 前置需求

- ✅ GitHub Repository: `https://github.com/your-github-username/your-repo-name`
- ✅ GitHub 帳號
- ✅ Zeabur 帳號（建議使用 GitHub 登入）

## 🚀 部署步驟

### 步驟 1: 登入 Zeabur

1. 訪問 https://zeabur.com
2. 點擊右上角 **Sign In**
3. 選擇 **Continue with GitHub**
4. 授權 Zeabur 存取 GitHub 帳號（如果是首次登入）

### 步驟 2: 建立新專案

1. 點擊 **Create Project**
2. 填寫專案資訊：
   - **Project Name**: `your-project-name`
   - **Region**: 選擇一個靠近你目標用戶的區域，例如 **Asia/Taiwan (taipei)**
   - 點擊 **Create**

### 步驟 3: 部署服務

1. 在專案頁面點擊 **Add Service**
2. 選擇 **Git Repository**
3. 在列表中找到並選擇 `your-github-username/your-repo-name`
   - 如果沒看到，點擊 **Configure GitHub App** 授權 Zeabur 存取你的 repo
4. 選擇要部署的分支（例如 **main**）
5. Zeabur 會自動偵測專案類型（例如 `Dockerfile` 或 `Node.js`）
6. 確認設定後點擊 **Deploy**

### 步驟 4: 等待建置完成

Zeabur 會自動執行以下步驟：

```
1. Clone GitHub repository
   ├─ Fetching code from [main] branch
   └─ ✅ Code cloned

2. Detect build method
   ├─ Found: Dockerfile / Node.js / etc.
   └─ ✅ Build method selected

3. Build application
   ├─ Installing dependencies
   ├─ Running build scripts
   └─ ✅ Application built

4. Deploy to container/serverless function
   ├─ Starting container on port [8080]
   ├─ Health check: /health (if configured)
   └─ ✅ Service running

預計時間: 2-5 分鐘，依專案複雜度而定
```

### 步驟 5: 配置網域

#### 方法 A: 使用 Zeabur 自動生成網域

1. 建置完成後，點擊服務卡片
2. 在 **Domains** 區塊點擊 **Generate Domain**
3. 會得到類似 `your-project-name-xxx.zeabur.app` 的網址
4. 點擊連結測試應用程式

#### 方法 B: 綁定自訂網域（your-domain.com）

1. 在 **Domains** 區塊點擊 **Add Domain**
2. 輸入: `your-domain.com` 或 `app.your-domain.com`
3. 複製 Zeabur 提供的 CNAME 記錄
4. 前往你的 DNS 服務商（如 Cloudflare, GoDaddy）
5. 新增 CNAME 記錄：
   ```
   Type: CNAME
   Name: @, www, 或 app
   Target: [Zeabur 提供的 CNAME]
   Proxy: 建議關閉（灰色雲），讓 Zeabur 處理 SSL
   ```
6. 等待 DNS 生效（1-10 分鐘）
7. Zeabur 會自動配置 SSL 證書（Let\'s Encrypt）

### 步驟 6: 驗證部署

#### 測試基本功能

```bash
# 替換成你的網域
YOUR_URL="https://your-domain.com"

# 1. 健康檢查 (如果你的應用有 /health 端點)
curl $YOUR_URL/health
# 預期: "healthy" 或其他成功訊息

# 2. 測試 API 或靜態資源
curl $YOUR_URL/api/v1/test
# 預期: API 回應或資源內容

# 3. 訪問首頁
curl -I $YOUR_URL
# 預期: HTTP/1.1 200 OK
```

#### 瀏覽器測試

1. 訪問 `https://your-domain.com`
2. 檢查項目：
   - ✅ 頁面正常載入
   - ✅ 應用程式標題正確
   - ✅ 主要功能運作正常
   - ✅ API 資料請求與顯示正常
   - ✅ 頁面跳轉與互動正常

## 🔧 環境變數配置

如果你的專案需要環境變數（例如 API 金鑰、資料庫連線字串）：

1. 在 Zeabur 服務設定中，找到 **Variables** 區塊
2. 點擊 **Add Variable**
3. 輸入變數名稱（`KEY`）和值（`VALUE`）
   ```env
   # 範例
   DATABASE_URL=postgresql://user:pass@host/db
   API_KEY=your_secret_api_key
   NODE_ENV=production
   ```
4. Zeabur 會自動重新部署以套用新的環境變數

## 📊 部署後監控

### Zeabur Dashboard

在 Zeabur 專案頁面可以看到：

1. **Service Status**: 運行狀態、記憶體和 CPU 使用率
2. **Logs**: 即時查看服務日誌，用於排查問題
3. **Metrics**: 流量、回應時間、錯誤率等監控圖表

### GitHub Actions 監控

如果你的專案有 CI/CD 流程（例如自動更新資料）：

- 訪問: `https://github.com/your-github-username/your-repo-name/actions`
- 查看相關 workflow 的執行狀態

## 🔄 更新部署

### 自動部署（推薦）

Zeabur 預設會在你 push 到指定分支時自動部署：

```bash
# 本地修改程式碼
git add .
git commit -m "feat: add new feature"
git push origin main

# Zeabur 會自動偵測並觸發新一次的部署
# 1-2 分鐘後新版本上線
```

### 手動部署

在 Zeabur Dashboard：

1. 點擊服務卡片
2. 點擊右上角 **⋯** 選單
3. 選擇 **Redeploy**

## 💰 費用估算

### Zeabur 免費額度

- **計算額度**: Zeabur 提供每月免費額度（例如 $5），可用於支付服務費用
- **流量**: 通常有免費的流量額度
- **建置時間**: 通常不收費

### 預估使用量

費用取決於你選擇的服務方案與資源用量（CPU, Memory）。一個小型 Web 應用通常花費極低，很有可能完全落在免費額度內。

| 資源     | 使用量 (範例) | 費用 (估算)  |
| -------- | ------------- | ------------ |
| 記憶體   | ~128 MB       | ~$0.5/月     |
| CPU      | ~10%          | ~$1.0/月     |
| **總計** |               | **~$1.5/月** |

✅ **小型專案通常完全在免費額度內！**

## ⚠️ 常見問題

### Q1: 部署失敗怎麼辦？

1. **查看日誌**：在 Zeabur 的建置日誌中找到錯誤訊息，這是最關鍵的一步。
2. **本地測試**：在本地環境執行 `npm run build` 或 `docker build .`，確保建置過程沒有問題。
3. **環境問題**：檢查 `package.json` 中的 `engines`（Node.js 版本）是否與 Zeabur 支援的環境相符。

### Q2: 網站出現 404 錯誤？

這通常是單頁應用（SPA）的路由問題。如果你的專案是 SPA (React, Vue, Angular)，請確保你的 Web Server (如 Nginx) 配置了 fallback 規則。

**Nginx 範例** (`nginx.conf`):

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Q3: CORS 錯誤？

如果你的前端和後端是分開部署的，後端服務需要設定 `Access-Control-Allow-Origin` header，允許前端網域的跨來源請求。

### Q4: 自訂網域 SSL 證書問題？

Zeabur 會自動處理 Let\'s Encrypt 的 SSL 證書申請與續期。如果失敗，請檢查：

1. DNS 的 CNAME 記錄是否正確指向 Zeabur。
2. DNS 記錄的 Proxy 功能是否已關閉（灰色雲）。

## 🎯 進階配置

### 部署通知

在你的 CI/CD 腳本中（例如 `.github/workflows/ci.yml`），可以加入 Webhook 通知，將部署狀態發送到 Slack 或 Discord。

```yaml
- name: Deploy notification
  if: success()
  run: |
    curl -X POST YOUR_WEBHOOK_URL \
      -H "Content-Type: application/json" \
      -d \'\'\'{"content":"✅ [${{ github.repository }}] deployed successfully!"}\'\'\'
```

### CDN 配置

若要進一步優化全球訪問速度和降低成本，可以考慮在 Zeabur 前端再套一層 CDN 服務（如 Cloudflare）。

## 📚 相關文件

- [Zeabur 官方文檔](https://zeabur.com/docs)
- [專案 README](../README.md)
- [GitHub Repository](https://github.com/your-github-username/your-repo-name)

---

**部署完成後，記得在 README.md 更新你的應用程式實際網址！**
