# 安全政策

## 🔒 支援的版本

我們目前支援以下版本的安全更新：

| 版本  | 支援狀態  |
| ----- | --------- |
| 0.0.x | ✅ 支援中 |

> 注意：專案目前處於早期開發階段，版本號為 0.0.x。一旦達到 1.0.0 穩定版本，將提供長期支援策略。

## 🚨 回報安全漏洞

**請勿公開揭露安全漏洞**

我們非常重視安全問題。如果您發現安全漏洞，請透過以下方式回報：

### 回報方式

1. **GitHub Security Advisories（建議）**
   - 前往 [Security Advisories](https://github.com/haotool/app/security/advisories)
   - 點擊 "Report a vulnerability"
   - 填寫詳細資訊

2. **私下聯繫**
   - 透過 Email: haotool.org@gmail.com
   - 或透過 Threads: [@azlife_1224](https://threads.net/@azlife_1224)

### 回報應包含

請在回報中包含以下資訊：

- **漏洞類型**：例如 XSS、SQL Injection、CSRF 等
- **受影響的版本**：哪些版本受到影響
- **重現步驟**：詳細的步驟以重現漏洞
- **概念驗證**（可選）：PoC 程式碼或截圖
- **潛在影響**：此漏洞可能造成的影響
- **建議的修復方案**（可選）：如果您有想法

### 回報範例

```markdown
## 漏洞描述

發現一個 XSS 漏洞，允許攻擊者在貨幣名稱欄位注入惡意腳本。

## 受影響版本

0.0.0 及更早版本

## 重現步驟

1. 前往匯率轉換頁面
2. 在貨幣選擇器中輸入 `<script>alert('XSS')</script>`
3. 腳本被執行

## 潛在影響

- 可能竊取使用者的 localStorage 資料
- 可能進行 session hijacking

## 建議修復

對所有使用者輸入進行 HTML 轉義
```

## ⏱️ 回應時效

- **初始回應**：24 小時內確認收到回報
- **評估時間**：7 天內評估嚴重性
- **修復時程**：
  - 🔴 嚴重（Critical）：24-48 小時
  - 🟠 高（High）：7 天內
  - 🟡 中（Medium）：30 天內
  - 🟢 低（Low）：90 天內或下一個版本

## 🛡️ 安全最佳實踐

### 應用層安全

本專案已實施以下安全措施：

1. **輸入驗證**
   - React 19 自動防 XSS 攻擊
   - TypeScript 嚴格型別檢查

2. **資料儲存**
   - 僅使用 localStorage 儲存非敏感資料
   - 不儲存使用者個人資訊

3. **依賴管理**
   - 定期更新依賴套件
   - 使用 `pnpm audit` 檢查已知漏洞

4. **容器安全**
   - 使用非 root 使用者執行（nodejs:1001）
   - 多階段建置減少攻擊面
   - 基於 Alpine Linux 的最小化映像

### 邊緣層安全（建議 Cloudflare 管理）

以下安全標頭建議在 CDN 層設定：

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Permissions-Policy`

詳見 [SECURITY_BASELINE.md](./docs/SECURITY_BASELINE.md)

## 🔐 安全配置

### 環境變數

- ✅ 使用 `.env.example` 提供範例
- ✅ 所有敏感資訊透過環境變數管理
- ❌ 絕不提交 `.env` 檔案到版本控制

### Docker 部署

```dockerfile
# 使用非 root 使用者
USER nodejs:1001

# 最小化權限
RUN chown -R nodejs:nodejs /usr/share/nginx/html
```

### 依賴審查

```bash
# 檢查已知漏洞
pnpm audit

# 修復可修復的漏洞
pnpm audit --fix
```

## 📋 安全檢查清單

在部署前，請確認以下項目：

- [ ] 所有依賴套件已更新至最新穩定版本
- [ ] `pnpm audit` 無高危或嚴重漏洞
- [ ] 環境變數已正確配置
- [ ] Docker 容器使用非 root 使用者
- [ ] 安全標頭已在 CDN 層配置
- [ ] 應用程式不洩露敏感資訊（錯誤訊息、stack trace）
- [ ] HTTPS 已啟用（生產環境）

## 🎯 已知限制

### 目前已知的安全考量

1. **客戶端資料快取**
   - 匯率資料快取在 localStorage
   - 風險：低（資料為公開資訊）

2. **第三方資料來源**
   - 依賴台灣銀行 API 與 CDN
   - 風險：中（應實施資料驗證）

3. **CORS 政策**
   - 允許跨域請求獲取匯率資料
   - 風險：低（唯讀公開資料）

## 📚 安全資源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://react.dev/learn/security)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

## 🙏 致謝

我們感謝以下安全研究人員的貢獻：

（目前尚無）

如果您回報了安全漏洞並希望被列入此處，請告知我們。

---

**感謝您協助保護 RateWise 及其使用者！** 🛡️

---

**Copyright (C) 2025 haotool. Licensed under GPL-3.0.**

**聯絡方式**: haotool.org@gmail.com | [Threads @azlife_1224](https://threads.net/@azlife_1224)
