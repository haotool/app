# 🚀 Zeabur 部署檢查清單

快速部署指南 - 照著做就對了！

## ✅ 第一步：登入 Zeabur

1. 打開瀏覽器訪問 https://zeabur.com
2. 點擊 **Sign In**
3. 選擇 **Continue with GitHub**
4. 使用你的 GitHub 帳號（your-github-account）登入

---

## ✅ 第二步：建立專案

1. 登入後點擊 **Create Project**
2. 填寫資訊：
   - Project Name: `your-project-name`
   - Region: **Asia/Taiwan** 或 **Asia/Hong Kong**
3. 點擊 **Create**

---

## ✅ 第三步：部署服務

1. 在新專案中點擊 **Add Service**
2. 選擇 **Git Repository**
3. 找到並點擊 `your-github-username/your-repo-name`
   - 看不到？點擊 **Configure GitHub App** 授權
4. 確認分支是 **main**
5. 點擊 **Deploy**

---

## ✅ 第四步：等待建置

**不要關閉頁面！**

看到以下訊息表示正在建置：

- ⏳ Cloning repository...
- ⏳ Building Docker image...
- ⏳ Deploying container...
- ✅ **Deployed!**

**預計時間**: 2-3 分鐘

---

## ✅ 第五步：取得網址

建置完成後：

1. 點擊服務卡片
2. 找到 **Domains** 區塊
3. 點擊 **Generate Domain**
4. 得到網址（例如：`your-project-name-xxx.zeabur.app`）
5. **複製這個網址！**

---

## ✅ 第六步：測試網站

用瀏覽器打開你的網址，檢查：

- [ ] 頁面正常顯示
- [ ] 看到應用程式標題
- [ ] 主要功能正常
- [ ] 資料顯示正確
- [ ] 可以進行主要操作

**全部打勾 = 部署成功！** 🎉

---

## 🎯 進階：綁定自訂網域（可選）

如果你有自己的網域（如 `your-domain.com`）：

1. 在 Zeabur 點擊 **Add Domain**
2. 輸入 `your-domain.com`
3. 複製 Zeabur 給的 CNAME 值
4. 前往你的 DNS 服務商（Cloudflare/GoDaddy 等）
5. 新增 CNAME 記錄：
   ```
   Type: CNAME
   Name: @ 或 www
   Target: [貼上 Zeabur 的 CNAME]
   ```
6. 等待 5-10 分鐘
7. 完成！

---

## 💡 快速測試指令

打開終端機執行：

```bash
# 替換成你的網址
YOUR_URL="https://your-project-name-xxx.zeabur.app"

# 測試健康檢查 (如果有的話)
curl $YOUR_URL/health

# 測試 API 或靜態資源
curl $YOUR_URL/api/resource

# 測試首頁
curl -I $YOUR_URL
```

全部返回正常 = 完美！✅

---

## ❌ 遇到問題？

### 建置失敗

1. 查看 Zeabur 的 **Logs** 找錯誤
2. 回到 GitHub 確認最新 commit 沒問題
3. 在 Zeabur 點擊 **Redeploy** 重試

### 網站打不開

1. 等待 1-2 分鐘（可能還在啟動）
2. 檢查 Zeabur 服務狀態是否為 **Running**
3. 查看 Logs 是否有錯誤訊息

### 資料沒有顯示

1. 檢查瀏覽器 Console 是否有錯誤
2. 確認後端 API 或資料來源可存取
3. 清除瀏覽器快取重新載入

---

## 📞 需要協助？

- Zeabur 文檔: https://zeabur.com/docs
- GitHub Issues: https://github.com/your-github-username/your-repo-name/issues
- 詳細指南: 查看 `docs/ZEABUR_DEPLOYMENT.md`

---

**完成以上步驟，你的應用程式就上線了！** 🎊

分享給朋友使用吧！
