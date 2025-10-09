# 完美重構路線圖與回滾方案

> **Linus 原則**: 簡單優先、零破壞、可回滾。每個 PR 獨立可測試。

**依據**: [TECH_DEBT_AUDIT.md](./TECH_DEBT_AUDIT.md)
**總工時**: ~32 小時 (4 天)
**目標**: 從 58/100 → 85/100

---

## 階段規劃

### Phase 0: 基礎建設 (Day 1: 8h)

**目標**: 建立品質閘門，確保後續重構安全

#### PR #0.1: 補齊工程工具鏈 (2h)

```bash
# 安裝依賴
pnpm add -Dw husky lint-staged @commitlint/cli @commitlint/config-conventional
pnpm add -Dw eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -Dw prettier eslint-config-prettier

# 初始化 Husky
pnpm dlx husky-init
npx husky add .husky/pre-commit "pnpm exec lint-staged"
npx husky add .husky/commit-msg "npx --no -- commitlint --edit $1"
```

**檔案清單**:

- `.editorconfig`
- `.lintstagedrc.json`
- `commitlint.config.cjs`
- `.eslintrc.cjs`
- `.prettierrc`
- `package.json` (新增 scripts)

**驗收**: `git commit` 自動執行 lint + format

**回滾**: `rm -rf .husky && git restore package.json`

---

#### PR #0.2: 補齊 CI/CD (3h)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

**驗收**: PR 自動執行 CI，失敗時阻擋 merge

**回滾**: `git rm .github/workflows/ci.yml`

---

#### PR #0.3: 補齊測試基礎 (3h)

```typescript
// RateWise.test.tsx 補齊 10 個基本測試
// Coverage target: 60%
```

**驗收**: `pnpm test` 通過，coverage ≥60%

**回滾**: `git restore apps/ratewise/src/**/*.test.tsx`

---

### Phase 1: 重構核心元件 (Day 2: 10h)

#### PR #1.1: 拆分 RateWise 元件 (6h)

**Before** (586 lines):

```
RateWise.tsx (586 lines)
```

**After** (5 files, avg 120 lines):

```
RateWise/
  ├── index.tsx              (50 lines - entry & context)
  ├── SingleConverter.tsx    (120 lines)
  ├── MultiConverter.tsx     (150 lines)
  ├── FavoritesList.tsx      (80 lines)
  ├── CurrencyList.tsx       (100 lines)
  ├── hooks/
  │   ├── useCurrencyConverter.ts  (80 lines)
  │   ├── useCurrencyStorage.ts    (40 lines)
  │   └── useTrendSimulator.ts     (30 lines)
  └── RateWise.test.tsx      (150 lines)
```

**驗收腳本**:

```bash
pnpm test
pnpm build
# 手動測試: 單幣別轉換、多幣別轉換、我的最愛
```

**回滾方案**:

```bash
git revert <commit-hash>
# 或
git restore apps/ratewise/src/features/ratewise/
git clean -fd apps/ratewise/src/features/ratewise/
```

---

#### PR #1.2: 補齊 Error Boundary (2h)

```typescript
// src/components/ErrorBoundary.tsx
// src/App.tsx 包裹 <ErrorBoundary>
```

**驗收**: 手動觸發錯誤，顯示 fallback UI

---

#### PR #1.3: 補齊觀測性 (2h)

```typescript
// src/utils/logger.ts
// 在關鍵點加入 logger.info/warn/error
```

**驗收**: Console 顯示結構化日誌

---

### Phase 2: 最佳化配置 (Day 3: 6h)

#### PR #2.1: TypeScript 嚴格化 (1h)

```json
// tsconfig.base.json 補齊嚴格選項
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true
  }
}
```

**驗收**: `pnpm typecheck` 無錯誤

**回滾**: `git restore tsconfig.base.json`

---

#### PR #2.2: Vite Build 最佳化 (2h)

```typescript
// vite.config.ts 補齊 build optimization
export default defineConfig({
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
```

**驗收**: `pnpm build` 產生 3 個 chunk，bundle size <300KB

---

#### PR #2.3: Tailwind 最佳化 (1h)

```typescript
// tailwind.config.ts 補齊 font fallback
```

**驗收**: `pnpm build` CSS size <10KB

---

#### PR #2.4: PostCSS ESM 化 (30min)

```bash
mv apps/ratewise/postcss.config.cjs apps/ratewise/postcss.config.js
```

**驗收**: `pnpm build` 成功

---

#### PR #2.5: 依賴鎖版 (1.5h)

參考 [DEPENDENCY_UPGRADE_PLAN.md](./DEPENDENCY_UPGRADE_PLAN.md)

---

### Phase 3: Docker 化與安全 (Day 4: 8h)

#### PR #3.1: Multi-Stage Dockerfile (3h)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/apps/ratewise/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**驗收腳本**:

```bash
docker build -t ratewise:latest .
docker run -p 8080:80 ratewise:latest
# 訪問 http://localhost:8080 確認功能正常
```

**回滾**: `docker rmi ratewise:latest`

---

#### PR #3.2: 安全標頭 (2h)

```nginx
# nginx.conf 或 Cloudflare Workers
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header Strict-Transport-Security "max-age=31536000";
```

**驗收**: 部署後檢查 Response Headers

---

#### PR #3.3: 補齊文檔 (3h)

- `README.md` (專案說明)
- `CONTRIBUTING.md` (貢獻指南)
- `LICENSE` (MIT)
- `.env.example`

**驗收**: 新手能依照 README 快速開始

---

## 回滾總策略

每個 PR 獨立可回滾:

```bash
# 單一 PR 回滾
git revert <commit-hash>

# 整個 Phase 回滾
git revert <phase-start>..<phase-end>

# 緊急全部回滾
git reset --hard <phase-0-start>
```

---

## 品質門檻

每個 PR 必須通過:

- ✅ CI 全綠
- ✅ Test coverage ≥80% (Phase 1 後)
- ✅ Build size 無顯著增加
- ✅ 手動功能測試通過
- ✅ Code review 通過

---

_依照 LINUS_GUIDE 要求產生，確保可執行性與可回滾性。_
