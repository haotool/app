# pnpm 依賴升級與鎖版策略

**原則**: Patch 優先、Minor 審慎、Major 分支驗證

## 當前依賴狀態

### Production

- react@^19.0.0 ✅ 最新穩定
- react-dom@^19.0.0 ✅ 對應版本
- lucide-react@^0.441.0 ⚠️ 可升級

### Dev Dependencies

- vite@^5.4.6 ✅ 穩定
- typescript@^5.6.2 ✅ 最新
- vitest@^2.1.4 ✅ 穩定
- tailwindcss@^3.4.14 ⚠️ v4 可考慮

## 升級策略

### 立即執行 (Patch & Minor)

```bash
pnpm -w up --latest --filter @app/ratewise
```

### React 19 鎖版建議

```json
{
  "dependencies": {
    "react": "~19.0.0",
    "react-dom": "~19.0.0"
  }
}
```

### Renovate 配置

```json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchUpdateTypes": ["patch", "pin", "digest"],
      "automerge": true
    }
  ]
}
```

---

_完整版本參見 TECH_DEBT_AUDIT.md_
