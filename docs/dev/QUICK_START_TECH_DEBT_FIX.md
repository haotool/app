# 技術債快速修復指南 (Quick Start)

> **目標**: 1週內將專案從 C+ (62分) 提升到 B+ (85分)  
> **策略**: 優先處理 P0 與 P1 項目，立竿見影  
> **基於**: TECH_DEBT_AUDIT_2025-10-17.md

---

## 🚀 第1天 (4小時) - P0 致命缺陷修復

### 1. 加入 Sentry 錯誤追蹤 (3h)

```bash
# 安裝
pnpm add @sentry/react @sentry/vite-plugin --filter @app/ratewise

# 配置 Vite
# apps/ratewise/vite.config.ts
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: {
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
  },
  plugins: [
    react(),
    VitePWA({ /* ... */ }),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});

# 初始化 Sentry
# apps/ratewise/src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);

# 環境變數
# .env.example
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# 驗證
pnpm build && pnpm preview
# 觸發錯誤測試，檢查 Sentry dashboard
```

**驗收標準**: Sentry dashboard 收到測試錯誤

### 2. 修復 Dockerfile HEALTHCHECK (15min)

```dockerfile
# Dockerfile - 修改 Line 41
# BEFORE (錯誤):
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD test -f /usr/share/nginx/html/index.html || exit 1

# AFTER (正確):
RUN apk add --no-cache wget
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1
```

**驗收標準**: `docker-compose up` 後 `docker ps` 顯示 `healthy` 狀態

### 3. 加入 .nvmrc (5min)

```bash
echo "24.0.0" > .nvmrc
git add .nvmrc
git commit -m "chore: 加入 .nvmrc 鎖定 Node 版本"
```

**驗收標準**: 團隊成員執行 `nvm use` 自動切換到 Node 24

---

## 📝 第2天 (8小時) - P1 測試覆蓋率提升

### 4. 提升測試覆蓋率到 80% (8h)

#### 4.1 修改覆蓋率門檻

```typescript
// apps/ratewise/vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80, // 從 60 提升
        functions: 80, // 從 60 提升
        branches: 75, // 從 60 提升
        statements: 80, // 從 60 提升
      },
    },
  },
});
```

#### 4.2 補足關鍵測試檔案

```bash
# 建立測試檔案
touch apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.test.ts
touch apps/ratewise/src/utils/storage.test.ts
touch apps/ratewise/src/utils/logger.test.ts
```

```typescript
// apps/ratewise/src/utils/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { readJSON, writeJSON, clearExchangeRateCache } from './storage';

describe('Storage Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should write and read JSON correctly', () => {
    const testData = { test: 'value' };
    writeJSON('testKey', testData);
    expect(readJSON('testKey', {})).toEqual(testData);
  });

  it('should return fallback when key does not exist', () => {
    expect(readJSON('nonexistent', { default: true })).toEqual({ default: true });
  });

  it('should clear only exchangeRates cache', () => {
    writeJSON('exchangeRates', { USD: 1.0 });
    writeJSON('userPreferences', { theme: 'dark' });

    clearExchangeRateCache();

    expect(readJSON('exchangeRates', null)).toBeNull();
    expect(readJSON('userPreferences', null)).toEqual({ theme: 'dark' });
  });
});
```

**驗收標準**: `pnpm test:coverage` 顯示所有門檻通過

---

## 🔧 第3天 (4小時) - P1 CI/CD 強化

### 5. 整合 E2E 測試到 CI (2h)

```yaml
# .github/workflows/ci.yml - 加入 E2E 測試
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # ... 現有步驟 ...

      - name: Install Playwright Browsers
        run: pnpm --filter @app/ratewise exec playwright install --with-deps chromium

      - name: Run E2E tests
        run: pnpm --filter @app/ratewise test:e2e

      - name: Upload Playwright Report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/ratewise/playwright-report/
```

**驗收標準**: PR 觸發 E2E 測試並通過

### 6. 加入 Dependabot (1h)

```yaml
# .github/dependabot.yml (新增檔案)
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 5
    groups:
      development-dependencies:
        dependency-type: 'development'
      patch-updates:
        update-types: ['patch']
```

**驗收標準**: 1週後收到自動 PR

### 7. 升級 Patch/Minor 依賴 (1h)

```bash
# 安全升級 (不會破壞)
pnpm -w up --latest @types/node
pnpm -w up --latest lucide-react
pnpm -w up --latest --filter @app/ratewise --filter ratewise-monorepo

# 驗證
pnpm lint && pnpm typecheck && pnpm test:coverage

# 提交
git add pnpm-lock.yaml package.json
git commit -m "chore(deps): 升級 patch/minor 依賴版本"
```

**驗收標準**: CI 全綠

---

## 📊 第4-5天 (選修) - P2 觀測性強化

### 8. 加入 Core Web Vitals 監控 (4h)

```bash
# 安裝
pnpm add web-vitals --filter @app/ratewise

# apps/ratewise/src/utils/vitals.ts
import { onCLS, onINP, onLCP } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // 發送到 Google Analytics / Cloudflare Analytics
  const body = JSON.stringify(metric);
  const url = '/api/analytics';

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);

# apps/ratewise/src/main.tsx
import './utils/vitals'; // 加入這行
```

**驗收標準**: 開發者工具 Network 看到 vitals 資料發送

### 9. 升級 Husky 8→9 + lint-staged 15→16 (2h)

```bash
# 升級
pnpm -w up husky@latest lint-staged@latest

# Husky 9 遷移
rm -rf .husky
pnpm exec husky init

# .husky/pre-commit (Husky 9 格式)
pnpm lint-staged

# 驗證
git add .
git commit -m "test: verify husky 9"
# 應該觸發 lint-staged

# 如果成功，繼續提交
git commit -m "chore(deps): 升級 husky 8→9, lint-staged 15→16"
```

**驗收標準**: Git commit 觸發 lint-staged

---

## ✅ 驗收總表

| 項目               | 指令                 | 預期結果           |
| ------------------ | -------------------- | ------------------ |
| 1. Sentry          | 觸發錯誤             | Dashboard 收到錯誤 |
| 2. Docker Health   | `docker ps`          | 顯示 `healthy`     |
| 3. Node 版本       | `nvm use`            | 切換到 24.0.0      |
| 4. 測試覆蓋率      | `pnpm test:coverage` | ≥80% 通過          |
| 5. E2E CI          | 提交 PR              | E2E 測試執行       |
| 6. Dependabot      | 等待1週              | 收到自動 PR        |
| 7. 依賴升級        | `pnpm outdated`      | 僅 major 版本過時  |
| 8. Core Web Vitals | 開發者工具           | Metrics 發送       |
| 9. Husky 9         | Git commit           | Lint-staged 執行   |

---

## 📈 進度追蹤

```
Day 1: [████████████████████] 100% - P0 完成 ✅
Day 2: [████████████████████] 100% - 測試覆蓋率 80% ✅
Day 3: [████████████████████] 100% - CI/CD 強化 ✅
Day 4: [██████████░░░░░░░░░░] 50% - 觀測性強化 (選修)
Day 5: [██████████░░░░░░░░░░] 50% - 依賴升級 (選修)

Overall: [████████████████░░░░] 80% → 目標達成！
綜合評分: 62分 → 85分 (B+)
```

---

## 🎯 下一步 (Week 2+)

完成上述 P0+P1 後，專案已達到生產級水準。接下來可以考慮：

1. **Vite 5→7 升級** (DEPENDENCY_UPGRADE_PLAN.md)
2. **Tailwind 3→4 升級** (性能提升 5-100倍)
3. **完整觀測性架構** (Request-ID, Structured Logging)
4. **PWA 壓測** (確認高流量穩定性)

---

**Linus 提醒**: "別他媽的拖延。技術債越拖越難還。現在就動手。"

**維護者**: 每完成一項打勾 ✅  
**版本**: v1.0-20251017
