# 雲端與應用安全基線

> 分層防禦：Cloudflare 管邊界，前端保持最小攻擊面。

## 1. 責任界面

### Cloudflare（邊緣）

- WAF / DDoS / Bot Management
- CSP、HSTS、Permissions-Policy、Rate Limiting
- TLS 終結、憑證更新

### 應用層（Vite + React）

- Input validation 與 Sanitize（React 19 預設防 XSS）
- Error Boundary、使用者友善 fallback
- 觀測性（logger、request id）、非敏感資料存取
- `.env`、Secrets 管理與掃描

> 原則：已於 Cloudflare 處理的標頭不在 Nginx / React 重複設定，僅保留最小 fallback。

## 2. 當前狀態（2025-10-12）

| 項目           | 現況                                                                                    |
| -------------- | --------------------------------------------------------------------------------------- |
| Error Boundary | ✅ `apps/ratewise/src/components/ErrorBoundary.tsx` 已上線                              |
| Logger         | ✅ `apps/ratewise/src/utils/logger.ts`，待串接遠端 sink                                 |
| 安全標頭       | ✅ `nginx.conf` 僅保留 `X-Content-Type-Options`、`X-Frame-Options`，其餘交由 Cloudflare |
| `.env` 管理    | ✅ `.env.example` 已提供                                                                |
| Secrets 掃描   | ❌ 尚未導入（建議 git-secrets / TruffleHog）                                            |
| 日誌外送       | ❌ 未上傳至遠端（Phase 0 計畫處理）                                                     |
| `.env` 漏掃    | ⚠️ 無 CI 步驟自動檢查                                                                   |

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

## 4. 待辦檢查清單

- [ ] Cloudflare Pages / Workers 套用上述安全標頭
- [ ] 加入 Secrets 掃描（例如 `pnpm dlx git-secrets --install` 並在 CI 執行）
- [ ] logger 串接遠端追蹤並附上 `requestId`
- [ ] 補 `pnpm audit --prod` 並將結果附加到 CI 報告
- [ ] 建立安全事件回報流程（Issue template + Slack 通報）

---

完整風險評估請見 [TECH_DEBT_AUDIT.md](./dev/TECH_DEBT_AUDIT.md)。
