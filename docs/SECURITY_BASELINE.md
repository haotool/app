# 雲端與應用安全基線

**原則**: 分層防禦，雲邊界優先，應用層最小化。

## 責任界面

### Cloudflare 層 (邊緣)

✅ **應該做**:

- CSP, HSTS, X-Frame-Options 等安全標頭
- WAF & DDoS 防護
- Rate Limiting
- Bot Management

### 應用層 (React)

✅ **應該做**:

- Input validation
- XSS 防護 (React 預設已處理)
- Error Boundary
- 敏感資料不存 localStorage

❌ **不應該做**:

- 重複設定已由 Cloudflare 處理的安全標頭

## 當前安全狀態

### ✅ 做對的

- 純前端，無後端漏洞面
- localStorage 僅存非敏感資料 (幣別偏好)
- React 19 自動防 XSS

### ⚠️ 需改進

- 缺 Error Boundary
- 無安全標頭 (應由 Cloudflare 設定)
- 無 .env 範本

## Cloudflare 安全標頭設定

```typescript
// _headers (for Cloudflare Pages)
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

## 檢查清單

- [ ] Cloudflare Pages 設定安全標頭
- [ ] 補齊 Error Boundary
- [ ] 補齊 .env.example
- [ ] 測試 CSP 不影響功能

---

_詳細風險分析參見 TECH_DEBT_AUDIT.md_
