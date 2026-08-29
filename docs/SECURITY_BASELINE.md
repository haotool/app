# 雲端與應用安全基線

> **最後更新**: 2026-08-30T00:00:00+08:00
> **執行者**: LINUS_GUIDE Agent (Linus Torvalds 風格)  
> **版本**: v2.1 (補充 Vercel 靜態 origin 切換責任界面)
> **安全評分**: 75/100 🟡 良好 (可提升至 85/100)  
> **分層防禦**: Cloudflare 管邊界，前端保持最小攻擊面

---

## Linus 安全哲學

> "Security is important, but don't be paranoid about theoretical threats. Fix real problems first."  
> — Linus Torvalds

**核心原則**：

1. **分層防禦**：Cloudflare 處理邊界安全，應用層專注業務邏輯
2. **最小攻擊面**：禁用生產環境 console，移除未使用代碼
3. **實用主義**：解決真實威脅（Secrets 洩漏），不過度設計

## 1. 責任界面

### Cloudflare（邊緣）

- WAF / DDoS / Bot Management
- CSP、HSTS、Permissions-Policy、Rate Limiting
- TLS 終結、憑證更新
- `security-headers` Worker 可透過嚴格驗證的 `VERCEL_ORIGIN` 將靜態 origin
  切換至 Vercel；未設定或不合法時回退既有 origin

### Origin 與 API

- Zeabur 或 Vercel origin 只提供建置後的靜態多 app image，不存放 Cloudflare secret
- `rating-api` Worker 與 KV 維持在 Cloudflare，不能由 Vercel Docker image 取代
- `VERCEL_ORIGIN` 是 Worker 端的非機密設定，不得進入 repo、Vercel client bundle 或前端環境變數

### 應用層（Vite + React）

- Input validation 與 Sanitize（React 19 預設防 XSS）
- Error Boundary、使用者友善 fallback
- 觀測性（logger、request id）、非敏感資料存取
- `.env`、Secrets 管理與掃描

> 原則：已於 Cloudflare 處理的標頭不在 Nginx / React 重複設定，僅保留最小 fallback。

## 2. 當前狀態（2026-08-30）

| 項目            | 現況                                                                          |
| --------------- | ----------------------------------------------------------------------------- |
| Error Boundary  | ✅ `apps/ratewise/src/components/ErrorBoundary.tsx` 已上線                    |
| Logger          | ✅ `apps/ratewise/src/utils/logger.ts`，待串接遠端 sink                       |
| 安全標頭        | ✅ `security-headers` Worker 處理 CSP／路由，`nginx.conf` 僅保留最小 fallback |
| `.env` 管理     | ✅ `.env.example` 已提供                                                      |
| Secrets 掃描    | ✅ CI 使用固定版本 Gitleaks CLI 掃描 repo                                     |
| 日誌外送        | ❌ 未上傳至遠端（Phase 0 計畫處理）                                           |
| `.env` 漏掃     | ✅ Gitleaks 覆蓋 repo；執行期 provider variables 仍需平台權限控管             |
| Vercel origin   | ⚠️ 已支援可回退切換；尚未切換正式流量                                         |
| Rating API 邊界 | ✅ 維持 Cloudflare Worker + KV，不納入 Vercel image                           |

## 3. Cloudflare 推薦設定

可透過 Workers / Transform Rules 套用：

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

> 依 [OWASP 安全標頭指南][ref: #10] 與 [Cloudflare 官方範例][ref: #11]。

## 4. 待辦檢查清單 (來自 TECH_DEBT_AUDIT.md)

### 🔴 Critical (M1 - 1週內完成)

- [x] **Secrets 掃描** - CI 已使用固定版本 Gitleaks CLI

  ```yaml
  # .github/workflows/security.yml
  - name: Run Gitleaks
    uses: gitleaks/gitleaks-action@v2
  ```

- [ ] **Logger 串接遠端服務** - 整合 Sentry
  ```typescript
  // logger.ts Line 78
  private sendToExternalService(entry: LogEntry): void {
    if (!this.isDevelopment && window.Sentry) {
      window.Sentry.captureMessage(entry.message, {
        level: entry.level,
        extra: entry.context
      });
    }
  }
  ```

### 🟡 Medium (M2 - 2週內完成)

- [ ] **Request ID 追蹤** - 加入請求追蹤機制
- [x] **Cloudflare 安全標頭** - 由 `security-headers` Worker 處理，並保留 origin 回退能力
- [ ] **依賴安全審計** - CI 加入 `pnpm audit --prod`

### 🟢 Low (M3 - 可選)

- [ ] **安全事件回報流程** - Issue template + Slack 通報
- [ ] **WAF 規則優化** - 基於實際流量調整

---

## 5. 安全檢查清單 (M1 驗收)

執行以下腳本驗證安全基線：

```bash
#!/bin/bash
# scripts/verify-security.sh

echo "🔒 驗證安全基線"

# 1. 檢查 Secrets 洩漏
pnpm dlx gitleaks detect --source . --no-git || {
  echo "❌ 發現 Secrets 洩漏"
  exit 1
}

# 2. 檢查依賴漏洞
pnpm audit --prod --audit-level=high || {
  echo "⚠️ 發現高風險依賴漏洞"
}

# 3. 檢查 Logger 整合
if ! grep -q "window.Sentry" apps/ratewise/src/utils/logger.ts; then
  echo "⚠️ Logger 尚未整合 Sentry"
fi

# 4. 檢查生產環境 console
if grep -r "console.log" apps/ratewise/dist/ 2>/dev/null; then
  echo "❌ 生產環境發現 console.log"
  exit 1
fi

echo "✅ 安全基線驗收通過"
```

---

## 6. Context7 安全參考

- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/) [ref: #10]
- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/examples/security-headers/) [ref: #11]
- [React Security Best Practices](https://react.dev/learn/escape-hatches#avoiding-xss-attacks) [ref: #1]

---

完整風險評估請見 [TECH_DEBT_AUDIT.md](./dev/TECH_DEBT_AUDIT.md)。

_本安全基線依照 Linus Torvalds 實用主義原則產生，專注解決真實威脅。_
