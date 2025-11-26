# RateWise 快速部署檢查清單

> **建立時間**: 2025-10-21T03:24:23+08:00  
> **目標**: 30 分鐘內完成部署

---

## ⚡ 快速流程 (6 步驟)

### ✅ 步驟 1: 合併分支 (2 分鐘)

```bash
cd /Users/azlife.eth/Tools/app
git status
git merge feat/seo-domain-migration --no-ff
git push origin main
```

---

### ✅ 步驟 2: Zeabur 網域設定 (15 分鐘)

#### A. 在 Zeabur 新增網域

1. 登入 https://zeabur.com/dashboard
2. 選擇 RateWise 專案 → ratewise 服務
3. Domains → Add Domain
4. 輸入: `app.haotool.org`
5. **記下 CNAME 目標**: `cname-xxxxx.zeabur.app`

#### B. 配置 DNS (Cloudflare)

1. 登入 Cloudflare
2. 選擇 `haotool.org`
3. DNS → Add record
   ```
   Type: CNAME
   Name: app
   Target: [步驟 A 的 CNAME]
   Proxy: ⚪ DNS only (灰色)
   ```
4. Save

#### C. 驗證 DNS

```bash
dig app.haotool.org CNAME
# 預期: app.haotool.org → cname-xxxxx.zeabur.app
```

#### D. 等待 SSL 生成

- 回到 Zeabur Dashboard
- 等待網域狀態變為 Active ✅
- 約 2-5 分鐘

---

### ✅ 步驟 3: 設定環境變數 (5 分鐘)

#### 在 Zeabur Dashboard

1. Variables 頁籤
2. Add Variable
   ```
   Key: VITE_SITE_URL
   Value: https://app.haotool.org/ratewise/
   ```
3. Save
4. 等待自動重新部署 (3-5 分鐘)

---

### ✅ 步驟 4: 測試部署 (5 分鐘)

#### 瀏覽器測試

訪問: https://app.haotool.org/ratewise/

**檢查清單**:

- [ ] 頁面正常載入
- [ ] 匯率功能正常
- [ ] 無 console 錯誤
- [ ] 版本顯示 v1.0.0

#### SEO 驗證

```bash
# 檢查 canonical URL
curl -s https://app.haotool.org/ratewise/ | grep canonical

# 檢查 sitemap
curl https://app.haotool.org/ratewise/sitemap.xml

# 檢查 robots.txt
curl https://app.haotool.org/ratewise/robots.txt
```

---

### ✅ 步驟 5: Google Search Console (10 分鐘)

#### A. 驗證網域

1. 訪問: https://search.google.com/search-console
2. 新增資源 → 網址前置字元
3. 輸入: `https://app.haotool.org/ratewise/`
4. 選擇 HTML 檔案驗證
5. 下載 `googleXXXXXX.html`

#### B. 上傳驗證檔案

```bash
cd /Users/azlife.eth/Tools/app
cp ~/Downloads/googleXXXXXX.html apps/ratewise/public/
git add apps/ratewise/public/googleXXXXXX.html
git commit -m "chore(seo): 新增 Google 驗證檔案"
git push origin main
```

#### C. 完成驗證

1. 等待 Zeabur 部署 (2-3 分鐘)
2. 驗證可訪問: `curl https://app.haotool.org/ratewise/googleXXXXXX.html`
3. 回到 Search Console 點擊「驗證」

#### D. 提交 Sitemap

1. Search Console → Sitemap
2. 輸入: `https://app.haotool.org/ratewise/sitemap.xml`
3. 提交

---

### ✅ 步驟 6: 請求索引 (5 分鐘)

#### 使用 URL 檢查工具

依序提交以下頁面:

1. `https://app.haotool.org/ratewise/`
2. `https://app.haotool.org/ratewise/faq`
3. `https://app.haotool.org/ratewise/about`

**操作**: Search Console 頂部搜尋框 → 輸入 URL → 要求建立索引

---

## 🎯 完成度確認

完成後，確認以下項目全部打勾:

### 網域與部署

- [ ] `https://app.haotool.org/ratewise/` 可訪問
- [ ] SSL 證書有效（顯示 🔒）
- [ ] 無 404 錯誤
- [ ] 無 console 錯誤

### SEO 配置

- [ ] Canonical URL 正確
- [ ] Sitemap 可訪問且內容正確
- [ ] Robots.txt 可訪問且內容正確
- [ ] Open Graph tags 包含新網域

### Google Search Console

- [ ] 網域驗證成功
- [ ] Sitemap 提交成功
- [ ] 首頁已請求索引

### 功能測試

- [ ] 匯率轉換正常
- [ ] 歷史匯率顯示正常
- [ ] PWA 安裝功能正常
- [ ] 版本資訊顯示正確

---

## 🆘 常見問題

### Q1: DNS 未生效

**A**: 等待 5-10 分鐘，使用 `dig app.haotool.org` 檢查

### Q2: SSL 證書未生成

**A**: 確認 DNS 已生效，Cloudflare Proxy 已關閉（灰色雲朵）

### Q3: 環境變數未生效

**A**: 確認 Zeabur 已重新部署，清除瀏覽器快取

### Q4: Google 驗證失敗

**A**: 確認驗證檔案可訪問，等待 2-3 分鐘再試

---

## 📋 時間規劃建議

**建議分配**:

- 上午: 步驟 1-3 (網域與環境配置)
- 下午: 步驟 4-6 (測試與 SEO)

**或連續完成**: 30-45 分鐘

---

## 📞 需要協助？

**詳細指南**: `docs/REMAINING_TASKS.md` (包含截圖與詳細說明)

**技術問題**:

1. 檢查 Zeabur 部署日誌
2. 檢查瀏覽器 console
3. 查看 `docs/SEO_MIGRATION_GUIDE.md`

---

**準備好了嗎？從步驟 1 開始！** 🚀
