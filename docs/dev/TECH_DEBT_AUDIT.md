# 技術債總報告與檔案級建議

> **Linus 評語**: 這是個早期專案，結構簡單清晰。有些該做的沒做，但沒有垃圾代碼。能用，但還沒到生產就緒。

**審查日期**: 2025-10-10
**審查人**: Linus-Style Technical Debt Scanner
**專案**: RateWise Currency Converter (Monorepo)

---

## 📊 執行摘要與分數卡

### 整體健康分數: 58/100 (🟡 湊合)

| 維度           | 分數   | 等級    | 評語                               |
| -------------- | ------ | ------- | ---------------------------------- |
| **可維護性**   | 72/100 | 🟢 好   | 結構清晰，檔案小，但缺文檔與測試   |
| **測試品質**   | 15/100 | 🔴 差   | 測試檔存在但未實作，覆蓋率 0%      |
| **資安成熟度** | 45/100 | 🟡 湊合 | 無明顯漏洞，但缺安全標頭、祕密管理 |
| **效能**       | 55/100 | 🟡 湊合 | 前端效能可，但無監控、無優化策略   |
| **觀測性**     | 10/100 | 🔴 差   | 零日誌，零監控，零錯誤追蹤         |
| **工程流程化** | 52/100 | 🟡 湊合 | pre-commit hooks 存在但不完整      |

### Linus 三問分析

**1. 這是實際問題還是臆測問題？**
✅ **實際問題**:

- 缺測試是實際問題，上生產必炸
- 無觀測性是實際問題，問題發生找不到根因
- 無 CI/CD 是實際問題，部署全靠手動

**2. 有更簡單的方法嗎？**
✅ **簡化建議**:

- React 元件過大 (586 行)，拆成 5 個小元件
- `useEffect` 依賴過多，重新設計資料流
- Storage 抽象可簡化，直接用 localStorage

**3. 會破壞什麼嗎？**
⚠️ **破壞性分析**:

- 目前無穩定 API，可大膽重構
- 無使用者基礎，破壞性變更成本低
- 建議：先定義穩定邊界，再優化內部

---

## 🎯 風險矩陣 Top 10

| #   | 風險項目                  | Impact      | Likelihood  | 總分 | 優先級 |
| --- | ------------------------- | ----------- | ----------- | ---- | ------ |
| 1   | **零測試覆蓋**            | 🔴 Critical | 🔴 Certain  | 25   | P0     |
| 2   | **零觀測性**              | 🔴 Critical | 🟡 Likely   | 20   | P0     |
| 3   | **無 CI/CD Pipeline**     | 🔴 High     | 🟡 Likely   | 15   | P1     |
| 4   | **缺乏安全標頭**          | 🟠 Medium   | 🟢 Possible | 9    | P2     |
| 5   | **React 19 RC 版本**      | 🟠 Medium   | 🟢 Possible | 9    | P2     |
| 6   | **缺依賴升級策略**        | 🟠 Medium   | 🟢 Possible | 9    | P2     |
| 7   | **未配置 Error Boundary** | 🟡 Low      | 🟡 Likely   | 6    | P3     |
| 8   | **缺 Dockerfile**         | 🟡 Low      | 🟡 Likely   | 6    | P3     |
| 9   | **PostCSS 用 CJS**        | 🟡 Low      | 🟢 Possible | 3    | P4     |
| 10  | **缺 README badges**      | 🟡 Trivial  | 🟢 Possible | 1    | P4     |

**風險計算公式**: `Risk = Impact (1-5) × Likelihood (1-5)`

---

## 🔍 類別發現與建議

### A. 前端品質 (React + Vite + Tailwind)

#### 【品味評分】🟡 湊合

**致命問題**:

1. **RateWise.tsx:586** → 586 行巨大元件，違反單一職責原則
2. **useEffect 依賴地獄** (line 163-182) → 9 個依賴，難以追蹤副作用
3. **計算邏輯散落** → `calculateFromAmount`, `calculateToAmount`, `recalcMultiAmounts` 應整合

**改進方向** [ref: #1, #2]:

```typescript
// ❌ Bad: 586行巨獸
function RateWise() {
  // 586 lines of混亂
}

// ✅ Good: 拆分成小元件
function RateWise() {
  return (
    <RateWiseProvider>
      <ModeToggle />
      {mode === 'single' ? <SingleConverter /> : <MultiConverter />}
      <FavoritesList />
      <CurrencyList />
    </RateWiseProvider>
  )
}
```

**Hooks 違規**:

- ✅ **正確**: 所有 hooks 在 top-level
- ✅ **正確**: 未動態傳遞 hooks
- ⚠️ **改進**: `useCallback` 依賴可優化

**建議重構** (apps/ratewise/src/features/ratewise/RateWise.tsx:1):

```typescript
// 拆分成 5 個元件:
// 1. RateWiseProvider (context + logic)
// 2. SingleConverter (單幣別UI)
// 3. MultiConverter (多幣別UI)
// 4. FavoritesList (常用清單)
// 5. CurrencyList (全部幣種)

// 拆分成 3 個 custom hooks:
// 1. useCurrencyConverter (計算邏輯)
// 2. useCurrencyStorage (localStorage)
// 3. useTrendSimulator (趨勢模擬)
```

#### Vite 配置 [ref: #3]

**品味評分**: 🟢 好品味

**優點**:

- ✅ 使用 SWC plugin 快速編譯
- ✅ alias 配置清晰
- ✅ port 明確指定

**缺失**:

- ❌ 無 build optimization 配置
- ❌ 無 chunk splitting 策略
- ❌ 無 compression plugin

**建議補充** (apps/ratewise/vite.config.ts:8):

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  // ... rest
});
```

#### Tailwind 配置 [ref: #6]

**品味評分**: 🟡 湊合

**問題**:

- ⚠️ 僅配置中文字型，無 fallback 策略
- ⚠️ 無 purge 策略優化
- ⚠️ 未啟用 JIT compiler (應預設啟用)

**建議優化** (apps/ratewise/tailwind.config.ts:1):

```typescript
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // Tailwind 4.0 自動啟用，但明確指定更好
  future: {
    hoverOnlyWhenSupported: true,
  },
} satisfies Config;
```

---

### B. TypeScript 配置 [ref: #4]

#### 【品味評分】🟢 好品味

**優點**:

- ✅ `strict: true` 已啟用
- ✅ target ES2022 合理
- ✅ moduleResolution: Bundler 正確

**缺失**:

- ❌ 缺 `noUncheckedIndexedAccess`
- ❌ 缺 `exactOptionalPropertyTypes`
- ❌ 缺 `noImplicitReturns`

**建議補強** (tsconfig.base.json:2):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false
  }
}
```

---

### C. 測試品質 [ref: #7, #15]

#### 【品味評分】🔴 垃圾

**致命問題**:

1. **RateWise.test.tsx 存在但空實作** → 測試覆蓋率 0%
2. **setupTests.ts 僅設定環境** → 無實際測試
3. **缺 E2E 測試** → 使用者流程未驗證

**Linus 評語**: _"有測試檔不寫測試，比沒測試檔更糟。這是自欺欺人。"_

**必須立即補齊**:

```typescript
// apps/ratewise/src/features/ratewise/RateWise.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RateWise from './RateWise';

describe('RateWise Currency Converter', () => {
  it('should render single mode by default', () => {
    render(<RateWise />);
    expect(screen.getByText('單幣別')).toBeInTheDocument();
  });

  it('should switch to multi mode', async () => {
    const user = userEvent.setup();
    render(<RateWise />);

    await user.click(screen.getByText('多幣別'));
    expect(screen.getByText('即時多幣別換算')).toBeInTheDocument();
  });

  it('should calculate currency conversion', async () => {
    const user = userEvent.setup();
    render(<RateWise />);

    const input = screen.getByPlaceholderText('0.00');
    await user.type(input, '1000');

    // 應該自動計算並顯示結果
    await waitFor(() => {
      expect(screen.getByDisplayValue(/^\d+\.\d{2}$/)).toBeInTheDocument();
    });
  });
});
```

**覆蓋率目標**:

- Unit tests: ≥80%
- Integration tests: ≥70%
- E2E tests: 核心流程 100%

---

### D. pnpm Workspace & Monorepo [ref: #5, #13]

#### 【品味評分】🟢 好品味

**優點**:

- ✅ pnpm workspace 配置簡潔
- ✅ packageManager 欄位指定版本
- ✅ apps/\* 結構清晰

**缺失**:

- ❌ 無 root package.json scripts 整合
- ❌ 未使用 `workspace:*` protocol (目前僅一個 app)
- ❌ 缺 monorepo 工具: turbo/nx

**建議補強** (package.json:7):

```json
{
  "scripts": {
    "dev": "pnpm --filter @app/ratewise dev",
    "build": "pnpm --filter @app/ratewise build",
    "build:all": "pnpm -r build",
    "test": "pnpm -r test",
    "test:ci": "pnpm -r --parallel test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "clean": "pnpm -r clean && rm -rf node_modules"
  }
}
```

---

### E. 依賴管理 [ref: #5]

#### 【品味評分】🟡 湊合

**問題**:

1. **React 19.0.0** → 正式版，但極新，生態未穩定
2. **未鎖定 patch 版本** → `^19.0.0` 可能引入破壞性變更
3. **缺依賴升級策略** → 無 renovate/dependabot

**依賴清單分析**:

**Production Dependencies** (3):

- ✅ `react@^19.0.0` - 最新穩定版
- ✅ `react-dom@^19.0.0` - 對應 React 版本
- ✅ `lucide-react@^0.441.0` - icon 庫，版本合理

**Dev Dependencies** (10):

- ✅ `vite@^5.4.6` - 穩定版
- ✅ `typescript@^5.6.2` - 最新穩定
- ⚠️ `vitest@^2.1.4` - 新 major 版本，需驗證
- ✅ `tailwindcss@^3.4.14` - 穩定版 (v4 剛發布)

**升級建議**:

- 🔧 建議鎖定 React 19.0.x: `"react": "~19.0.0"`
- 🔧 考慮採用 Tailwind 4.0 (但需重大重構)
- 🔧 設置 renovate.json 自動化依賴升級

---

### F. 工程流程化 [ref: #9]

#### 【品味評分】🟡 湊合

**已有**:

- ✅ pre-commit hooks 配置 (.pre-commit-config.yaml)
- ✅ prettier 整合
- ✅ check-yaml, check-json, end-of-file-fixer

**缺失**:

- ❌ 無 Husky 整合
- ❌ 無 lint-staged
- ❌ 無 commitlint
- ❌ 無 ESLint 配置
- ❌ 無 .editorconfig

**必須補齊**:

1. **Husky + lint-staged** (根目錄):

```bash
pnpm add -Dw husky lint-staged
pnpm dlx husky-init
```

2. **.lintstagedrc.json**:

```json
{
  "**/*.{js,ts,tsx}": ["eslint --fix", "prettier --write"],
  "**/*.{json,md,css,scss}": ["prettier --write"]
}
```

3. **commitlint.config.cjs**:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore'],
    ],
  },
};
```

4. **.editorconfig**:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

---

### G. 安全性 [ref: #10, #11]

#### 【品味評分】🟡 湊合

**現況**:

- ✅ 無明顯 XSS/SQL injection 漏洞 (純前端)
- ✅ localStorage 使用合理，無敏感資料
- ❌ 缺安全標頭 (CSP, HSTS, X-Frame-Options)
- ❌ 無 .env 範本
- ❌ 未配置 Cloudflare Workers 安全標頭

**Cloudflare 安全標頭範例**:

部署於 Cloudflare 時，在 Pages 或 Workers 層級設定：

```typescript
// _headers (for Cloudflare Pages)
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
```

**或使用 Workers**:

```typescript
export default {
  async fetch(request) {
    const response = await fetch(request);
    const newHeaders = new Headers(response.headers);

    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  },
};
```

---

### H. 觀測性 [ref: 無官方來源，產業標準]

#### 【品味評分】🔴 垃圾

**Linus 評語**: _"沒日誌，沒監控，沒錯誤追蹤。這是在生產環境玩俄羅斯輪盤。"_

**致命缺失**:

1. ❌ 零日誌系統
2. ❌ 零錯誤邊界
3. ❌ 零效能監控
4. ❌ 零使用者行為追蹤

**最小可行方案**:

1. **Error Boundary** (必須):

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 記錄到 console (生產環境應送至 Sentry/LogRocket)
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>發生錯誤，請重新整理頁面</div>
      );
    }
    return this.props.children;
  }
}
```

2. **簡易日誌** (最小實作):

```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  info: (...args: unknown[]) => isDev && console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};
```

---

### I. CI/CD [ref: #14]

#### 【品味評分】🔴 垃圾

**現況**: 完全沒有

**必須補齊**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run test
      - run: pnpm run build
```

---

## 📁 檔案級審查清單

### 根目錄

| 檔案                      | 狀態 | 評分  | 問題                       | 建議                        |
| ------------------------- | ---- | ----- | -------------------------- | --------------------------- |
| `package.json`            | 🟡   | 6/10  | 缺 engines, 缺整合 scripts | 補充 node/pnpm 版本要求     |
| `pnpm-workspace.yaml`     | 🟢   | 9/10  | 簡潔清晰                   | 無                          |
| `tsconfig.base.json`      | 🟡   | 7/10  | strict 模式不完整          | 補充額外嚴格選項            |
| `.gitignore`              | 🟢   | 8/10  | 基本完整                   | 可補充 `.DS_Store`, `*.log` |
| `.pre-commit-config.yaml` | 🟡   | 6/10  | 配置正確但未整合 Husky     | 改用 Husky + lint-staged    |
| `AGENTS.md`               | 🟢   | 7/10  | 文檔存在                   | 需更新以反映實際工具        |
| `LINUS_GUIDE.md`          | 🟢   | 10/10 | 本審查依據                 | 無                          |
| `README.md`               | ❌   | 0/10  | **不存在**                 | 必須補齊專案說明            |
| `.editorconfig`           | ❌   | 0/10  | **不存在**                 | 必須補齊                    |
| `LICENSE`                 | ❌   | 0/10  | **不存在**                 | 建議補充 MIT License        |

### apps/ratewise/

| 檔案                                      | 狀態 | 評分 | 問題            | 建議                       |
| ----------------------------------------- | ---- | ---- | --------------- | -------------------------- |
| `src/App.tsx`                             | 🟢   | 8/10 | 簡潔            | 可補充 ErrorBoundary       |
| `src/main.tsx`                            | 🟢   | 8/10 | 標準 React 入口 | 可補充 StrictMode          |
| `src/features/ratewise/RateWise.tsx`      | 🟡   | 5/10 | **586 行過大**  | 拆分成 5 個元件            |
| `src/features/ratewise/types.ts`          | 🟢   | 9/10 | 型別定義完整    | 無                         |
| `src/features/ratewise/constants.ts`      | 🟢   | 8/10 | 常數定義清晰    | 考慮從 API 取得匯率        |
| `src/features/ratewise/storage.ts`        | 🟢   | 9/10 | 抽象完善        | 考慮加入 version migration |
| `src/features/ratewise/RateWise.test.tsx` | 🔴   | 1/10 | **空實作**      | 補齊測試                   |
| `src/setupTests.ts`                       | 🟢   | 7/10 | 基本設定        | 可補充 custom matchers     |
| `vite.config.ts`                          | 🟢   | 7/10 | 基本配置        | 補充 build optimization    |
| `vitest.config.ts`                        | 🟢   | 8/10 | 配置完整        | 補充 coverage 設定         |
| `tailwind.config.ts`                      | 🟡   | 6/10 | 過於簡化        | 補充 fallback fonts        |
| `postcss.config.cjs`                      | 🟡   | 5/10 | **使用 CJS**    | 改用 ESM                   |
| `package.json`                            | 🟢   | 8/10 | 依賴合理        | 考慮鎖版                   |
| `tsconfig.json`                           | 🟢   | 8/10 | 繼承 base 配置  | 無                         |
| `README.md`                               | 🟡   | 4/10 | 存在但內容少    | 補充使用說明               |
| `Dockerfile`                              | ❌   | 0/10 | **不存在**      | 必須補齊                   |
| `.env.example`                            | ❌   | 0/10 | **不存在**      | 建議補充                   |

---

## 🎯 Quick Wins (立即可修復)

優先順序排序，最高 ROI 改動：

### 1. 補齊 README.md (15 分鐘)

```markdown
# RateWise - 匯率換算器

## 快速開始

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## 技術棧

- React 19 + TypeScript
- Vite 5 + SWC
- Tailwind CSS 3.4
- Vitest 2
```

### 2. 補齊 .editorconfig (5 分鐘)

見前文 F. 工程流程化

### 3. 修正 PostCSS 使用 ESM (2 分鐘)

```bash
mv apps/ratewise/postcss.config.cjs apps/ratewise/postcss.config.js
```

### 4. 補齊測試 (2 小時)

見前文 C. 測試品質

### 5. 補齊 Error Boundary (30 分鐘)

見前文 H. 觀測性

### 6. 補齊 CI/CD (1 小時)

見前文 I. CI/CD

### 7. 拆分 RateWise.tsx (4 小時)

見前文 A. 前端品質

### 8. 補齊 Dockerfile (1 小時)

見下文 REFACTOR_PLAN.md

---

## 📈 技術債總量估算

**總工時估算**: ~32 小時

| 類別       | 工時 | 優先級 |
| ---------- | ---- | ------ |
| 測試補齊   | 8h   | P0     |
| 觀測性建置 | 4h   | P0     |
| CI/CD 建置 | 3h   | P1     |
| 元件重構   | 8h   | P1     |
| 文檔補齊   | 3h   | P2     |
| 安全強化   | 2h   | P2     |
| 依賴升級   | 2h   | P2     |
| Docker 化  | 2h   | P3     |

---

## 🔗 引用來源

詳見 [CITATIONS.md](./CITATIONS.md)

- [ref: #1] React 19 Official Documentation
- [ref: #2] React 19 Upgrade Guide
- [ref: #3] Vite 5 Official Documentation
- [ref: #4] TypeScript Strict Mode Best Practices
- [ref: #5] pnpm Workspace Official Documentation
- [ref: #6] Tailwind CSS 4.0 Performance Guide
- [ref: #7] Vitest Official Documentation
- [ref: #9] ESLint & Prettier with Husky Best Practices
- [ref: #10] OWASP Security Headers Project
- [ref: #11] Cloudflare Security Headers Documentation
- [ref: #13] Complete Monorepo Guide
- [ref: #14] GitHub Actions CI/CD Monorepo Best Practices
- [ref: #15] React Component Testing Best Practices with Vitest

---

## 【Linus 式最終評語】

**核心判斷**: ✅ 值得繼續

**關鍵洞察**:

- **資料結構**: 簡單清晰，狀態管理合理，但 useState 過多可合併
- **複雜度**: 元件過大是主要問題，其餘邏輯簡單
- **風險點**: 零測試、零觀測性是最大風險，必須立即處理

**Linus 式方案**:

1. **先補測試** - 沒測試就是裸奔，不可上生產
2. **拆元件** - 586 行 → 5 個 <150 行元件
3. **加觀測性** - 最少要有 ErrorBoundary 和 console.error
4. **建 CI/CD** - 自動化測試 + build，確保品質
5. **確保零破壞** - 目前無使用者，可大膽重構

**總分**: 58/100 → 預期改善後 85/100

---

_審查完成時間: 2025-10-10_
_下一步: 參閱 [REFACTOR_PLAN.md](./REFACTOR_PLAN.md) 執行重構_
