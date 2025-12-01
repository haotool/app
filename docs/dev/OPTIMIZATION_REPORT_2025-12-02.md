# 自動化最佳實踐落地報告

> **生成時間**: 2025-12-02T01:59:47+08:00  
> **更新時間**: 2025-12-02T02:00:00+08:00  
> **執行者**: LINUS_GUIDE Agent  
> **版本**: v1.1

---

## 1. 分析摘要

### 1.1 過去對話需求萃取

| 主題分類       | 需求關鍵字                                           | 完成狀態  |
| -------------- | ---------------------------------------------------- | --------- |
| **SEO 優化**   | sitemap.xml, robots.txt, 尾斜線, 301 轉向, canonical | ✅ 已完成 |
| **URL 標準化** | 大小寫敏感, 絕對路徑重定向, Nginx 配置               | ✅ 已完成 |
| **測試覆蓋率** | evaluator.ts, validator.ts, Layout.tsx               | ✅ 已完成 |
| **E2E 測試**   | Calculator 功能, Playwright                          | ✅ 已完成 |
| **CI/CD 監控** | GitHub Actions, 全數通過                             | ✅ 已完成 |
| **依賴升級**   | outdated packages 檢查                               | ⏳ 待執行 |

### 1.2 當前專案狀態

```
測試覆蓋率摘要:
- Statement: 91.39%
- Branch: 84.31%
- Functions: 88.13%
- Lines: 91.44%

CI 狀態: ✅ success (最後執行: 2025-12-01T16:26:22Z)
E2E 測試: 92 passed, 42 skipped, 0 failed
```

---

## 2. 最佳實踐優化方案

### 2.1 依賴升級策略 (Context7 官方文件參考)

#### 🟢 安全升級 (Patch/Minor)

| 套件   | 當前版本 | 最新版本 | 風險等級 | 建議     |
| ------ | -------- | -------- | -------- | -------- |
| `vite` | 7.1.12   | 7.2.6    | 🟢 低    | 立即升級 |

#### 🟡 需評估升級 (Major)

| 套件              | 當前版本 | 最新版本 | 風險等級 | 建議                  |
| ----------------- | -------- | -------- | -------- | --------------------- |
| `@types/node`     | 22.18.9  | 24.10.1  | 🟡 中    | 分支測試後升級        |
| `jsdom`           | 24.1.3   | 27.2.0   | 🟡 中    | 分支測試後升級        |
| `vite-plugin-pwa` | 0.21.2   | 1.2.0    | 🟡 中    | 檢查 breaking changes |

#### 🔴 高風險升級 (需完整遷移計畫)

| 套件                 | 當前版本 | 最新版本 | 風險等級 | 建議           |
| -------------------- | -------- | -------- | -------- | -------------- |
| `react-router-dom`   | 6.30.1   | 7.9.6    | 🔴 高    | 需完整遷移計畫 |
| `tailwindcss`        | 3.4.18   | 4.1.17   | 🔴 高    | 需完整遷移計畫 |
| `react-helmet-async` | 1.3.0    | 2.0.5    | 🟡 中    | 檢查 API 變更  |

### 2.2 React Router v7 遷移要點 [context7:/remix-run/react-router]

```typescript
// 當前配置已啟用 v7 future flags (良好實踐)
<Router
  basename={basename}
  future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }}
>
```

**遷移步驟**:

1. 確保所有 future flags 已啟用
2. 執行 `npm install react-router-dom@7`
3. 更新 import 路徑 (部分 API 從 `react-router-dom` 移至 `react-router`)
4. 測試所有路由功能

### 2.3 Tailwind CSS v4 遷移要點 [context7:/websites/tailwindcss]

**主要變更**:

1. 使用 Vite 插件取代 PostCSS 配置
2. `@tailwind` 指令改為 `@import "tailwindcss"`
3. 陰影工具類名稱變更 (`shadow-sm` → `shadow-xs`)
4. CSS 變數語法變更 (`bg-[--color]` → `bg-(--color)`)

**建議**: 使用自動化遷移工具

```bash
npx @tailwindcss/upgrade
```

---

## 3. 專案步驟清單

### 3.1 已完成項目 ✅

- [x] SEO Health Check 腳本 (`scripts/seo-health-check.mjs`)
- [x] URL 標準化中介軟體 (`urlNormalization.ts`)
- [x] Pre-commit Hook 整合
- [x] evaluator.ts 測試覆蓋率 (91.72%)
- [x] validator.ts 測試覆蓋率 (96.96%)
- [x] E2E Calculator 測試 (92 passed)
- [x] CI 監控確認 (全數通過)

### 3.2 待執行項目 ⏳

- [ ] Vite 7.2.6 patch 升級
- [ ] @types/node major 升級評估
- [ ] jsdom major 升級評估
- [ ] react-router-dom v7 遷移計畫
- [ ] tailwindcss v4 遷移計畫
- [ ] vite-plugin-pwa 1.2.0 升級評估

---

## 4. To-Do List

| 優先級 | 任務                         | 負責人    | 預估時程 | 狀態      |
| ------ | ---------------------------- | --------- | -------- | --------- |
| **P0** | Vite 7.1.12 → 7.2.6          | Agent     | 5 分鐘   | ⏳ 待開始 |
| **P1** | @types/node 升級評估         | Agent     | 15 分鐘  | ⏳ 待開始 |
| **P1** | jsdom 升級評估               | Agent     | 15 分鐘  | ⏳ 待開始 |
| **P2** | vite-plugin-pwa 升級         | Agent     | 20 分鐘  | ⏳ 待開始 |
| **P3** | react-router-dom v7 遷移規劃 | User 確認 | 2 小時   | 📋 規劃中 |
| **P3** | tailwindcss v4 遷移規劃      | User 確認 | 4 小時   | 📋 規劃中 |

---

## 5. 子功能規格

### 5.1 Vite 升級 (P0)

**介面定義**: 無 API 變更
**驗收標準**:

- [ ] `pnpm install` 成功
- [ ] `pnpm build` 成功
- [ ] `pnpm test` 全數通過
- [ ] CI 全綠

### 5.2 React Router v7 遷移 (P3)

**介面定義**:

```typescript
// 預期變更
import { redirect } from 'react-router'; // 新
// import { redirect } from 'react-router-dom'; // 舊
```

**驗收標準**:

- [ ] 所有路由正常運作
- [ ] SEO 頁面正確渲染
- [ ] E2E 測試通過
- [ ] 無 console 警告

### 5.3 Tailwind CSS v4 遷移 (P3)

**介面定義**:

```css
/* 新配置 */
@import 'tailwindcss';

/* 舊配置 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**驗收標準**:

- [ ] 所有樣式正確顯示
- [ ] 無視覺回歸
- [ ] Build size 無顯著增加
- [ ] Lighthouse 分數維持

---

## 6. 當前進度實作

### 6.1 已完成升級 ✅

```bash
# 已執行的升級指令
pnpm --filter @app/ratewise add -D vite@7.2.6           # ✅ 完成
pnpm --filter @app/ratewise add -D vite-plugin-pwa@1.2.0 # ✅ 完成
pnpm --filter @app/ratewise add -D @types/node@24.10.1   # ✅ 完成
pnpm --filter @app/ratewise add -D jsdom@27.2.0          # ✅ 完成
```

### 6.2 驗證結果 ✅

```bash
# 所有驗證通過
pnpm typecheck  # ✅ 通過
pnpm test       # ✅ 44 files, 799 tests passed
pnpm build      # ✅ 成功
```

### 6.3 React Router v7 遷移分析

**專案使用情況**:

- 使用 `BrowserRouter` 組件
- 已啟用 `v7_startTransition` 和 `v7_relativeSplatPath` future flags
- 共 13 個檔案使用 React Router APIs

**遷移複雜度**: 🟡 中等

- 需要更新 import 路徑
- 需要測試所有路由功能
- 需要驗證 SEO 預渲染

### 6.4 Tailwind CSS v4 遷移分析

**專案使用情況**:

- 共 29 個檔案使用 Tailwind CSS
- 約 524 處 className 使用
- 使用 PostCSS 配置

**遷移複雜度**: 🔴 高

- 需要執行 `npx @tailwindcss/upgrade`
- 需要視覺回歸測試
- 需要更新 CSS 配置格式

---

## 7. 風險評估與建議

### 7.1 低風險 (可立即執行)

- Vite patch 升級

### 7.2 中風險 (需分支測試)

- @types/node, jsdom, vite-plugin-pwa 升級

### 7.3 高風險 (需完整計畫)

- React Router v7: 需要完整的遷移計畫和測試
- Tailwind CSS v4: 需要視覺回歸測試和樣式審查

### 7.4 建議執行順序

1. **Phase 1** (今天): Vite patch 升級
2. **Phase 2** (本週): @types/node, jsdom 升級
3. **Phase 3** (下週): vite-plugin-pwa 升級
4. **Phase 4** (計畫中): React Router v7 遷移
5. **Phase 5** (計畫中): Tailwind CSS v4 遷移

---

## 8. 參考資源

- [Vite Migration Guide](https://vite.dev/guide/migration.html) [context7:/vitejs/vite]
- [React Router v7 Upgrade](https://reactrouter.com/upgrading/v6) [context7:/remix-run/react-router]
- [Tailwind CSS v4 Upgrade](https://tailwindcss.com/docs/upgrade-guide) [context7:/websites/tailwindcss]

---

> **下一步**: 請確認是否立即執行 Vite patch 升級，或需要先處理其他優先事項。
