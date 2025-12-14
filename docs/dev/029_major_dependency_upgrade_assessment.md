# Major 依賴升級評估文檔

> **建立時間**: 2025-12-02T01:20:00+08:00
> **版本**: v1.0.0
> **狀態**: 📋 評估中

---

## 1. 概述

本文檔評估 RateWise 專案中需要進行 major 版本升級的依賴套件，包含風險評估、升級步驟、和時程建議。

### 1.1 待升級套件清單

| 套件                      | 當前版本 | 最新版本 | 升級類型 | 風險等級 |
| ------------------------- | -------- | -------- | -------- | -------- |
| react-router-dom          | 6.30.1   | 7.9.6    | Major    | 🟡 中    |
| tailwindcss               | 3.4.18   | 4.1.17   | Major    | 🟡 中    |
| react-helmet-async        | 1.3.0    | 2.0.5    | Major    | 🟢 低    |
| vite-plugin-pwa           | 0.21.2   | 1.2.0    | Major    | 🔴 高    |
| jsdom                     | 24.1.3   | 27.2.0   | Major    | 🟢 低    |
| @types/node               | 22.18.9  | 24.10.1  | Major    | 🟢 低    |
| eslint-config-prettier    | 9.1.2    | 10.1.8   | Major    | 🟢 低    |
| eslint-plugin-react-hooks | 5.2.0    | 7.0.1    | Major    | 🟢 低    |

---

## 2. React Router v7 升級評估

### 2.1 變更摘要

**來源**: [Context7: remix-run/react-router](https://github.com/remix-run/react-router)

#### 重大變更

1. **套件結構簡化**: `react-router-dom` 被合併到 `react-router`
2. **最低版本要求**: Node.js 20+, React 18+
3. **Future Flags**: 需要先啟用 `v7_startTransition`, `v7_relativeSplatPath`

#### 升級步驟

```bash
# 1. 啟用 future flags (在 v6 中)
<RouterProvider
  router={router}
  future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }}
/>

# 2. 升級套件
pnpm remove react-router-dom
pnpm add react-router@7

# 3. 更新 imports
# 舊: import { BrowserRouter } from 'react-router-dom'
# 新: import { BrowserRouter } from 'react-router'
```

### 2.2 風險評估

| 風險項目            | 影響範圍         | 緩解措施              |
| ------------------- | ---------------- | --------------------- |
| Import 路徑變更     | 所有路由相關檔案 | 使用 codemod 自動更新 |
| `React.lazy` 相容性 | 懶載入組件       | 移至模組頂層          |
| Splat 路徑行為變更  | 含 `*` 的路由    | 更新相對連結          |

### 2.3 建議時程

- **評估階段**: 2025-12-02 ~ 2025-12-09
- **分支測試**: 2025-12-10 ~ 2025-12-16
- **生產部署**: 待 React 19 生態系穩定

---

## 3. Tailwind CSS v4 升級評估

### 3.1 變更摘要

**來源**: [Context7: v3_tailwindcss](https://v3.tailwindcss.com/docs/upgrade-guide)

#### 重大變更

1. **PostCSS 8 必要**: 不再支援 PostCSS 7
2. **Opacity 語法變更**: `bg-opacity-*` → `bg-red-500/75`
3. **顏色別名變更**: `green` → `emerald`
4. **JIT 引擎預設**: 不需要 `mode: 'jit'`

#### 升級步驟

```bash
# 1. 升級相關套件
pnpm update tailwindcss@4 postcss autoprefixer

# 2. 更新 tailwind.config.js
# - 移除 mode: 'jit'
# - 更新顏色別名

# 3. 更新 CSS 類名
# - bg-opacity-50 → bg-red-500/50
```

### 3.2 風險評估

| 風險項目     | 影響範圍                        | 緩解措施             |
| ------------ | ------------------------------- | -------------------- |
| 顏色別名變更 | 使用 green/yellow/purple 的組件 | 在 config 中設定別名 |
| Opacity 語法 | 使用 `*-opacity-*` 的類名       | 全局搜索替換         |
| 負值語法     | 使用 `theme()` 的地方           | 改用 `calc()`        |

### 3.3 建議時程

- **評估階段**: 2025-12-15 ~ 2025-12-22
- **分支測試**: 2025-12-23 ~ 2025-12-30
- **生產部署**: 2026-01 (待 v4 穩定)

---

## 4. vite-plugin-pwa 升級評估

### 4.1 變更摘要

**來源**: [Context7: vite-pwa/vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa)

#### 當前問題

- 版本 0.21.2 不支援 Vite 7
- Peer dependency 警告: `✕ unmet peer vite@"^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0"`

#### 升級風險

- **高風險**: PWA 功能可能完全失效
- **需要驗證**: Service Worker 註冊、離線快取、更新提示

### 4.2 建議行動

1. **監控上游**: 追蹤 [GitHub Issues](https://github.com/vite-pwa/vite-plugin-pwa/issues) 中 Vite 7 支援進度
2. **暫緩升級**: 等待官方發布支援 Vite 7 的版本
3. **功能測試**: 確認當前版本在 Vite 7 下的實際表現

---

## 5. 低風險升級

以下套件可以安全升級：

### 5.1 eslint-config-prettier (9.1.2 → 10.x)

```bash
pnpm update eslint-config-prettier@10 -w
```

**變更**: 主要是內部重構，API 相容

### 5.2 eslint-plugin-react-hooks (5.2.0 → 7.x)

```bash
pnpm update eslint-plugin-react-hooks@7 -w
```

**變更**: 新增 `set-state-in-effect` 規則，會報錯 `useCurrencyConverter.ts` 中的 setState 調用

**⚠️ 需要重構**:

- `useCurrencyConverter.ts:227` - `calculateFromAmount()` 在 useEffect 中調用
- `useCurrencyConverter.ts:247` - `setMultiAmounts()` 在 useEffect 中調用

**建議**: 延後升級，需要重構 hook 邏輯

### 5.3 jsdom (24.1.3 → 27.x)

```bash
pnpm update jsdom@27 --filter @app/ratewise
```

**變更**: 測試環境依賴，不影響生產

### 5.4 @types/node (22.18.9 → 24.x)

```bash
pnpm update @types/node@24 --filter @app/ratewise
```

**變更**: TypeScript 類型定義，不影響運行

---

## 6. 升級優先級

| 優先級 | 套件                      | 建議行動           | 時程    |
| ------ | ------------------------- | ------------------ | ------- |
| P1     | eslint-config-prettier    | 直接升級           | 本週    |
| P1     | eslint-plugin-react-hooks | 直接升級           | 本週    |
| P1     | @types/node               | 直接升級           | 本週    |
| P1     | jsdom                     | 直接升級           | 本週    |
| P2     | react-helmet-async        | 等待 React 19 支援 | 2025-12 |
| P3     | react-router-dom          | 分支測試後升級     | 2025-12 |
| P3     | tailwindcss               | 等待 v4 穩定       | 2026-01 |
| P4     | vite-plugin-pwa           | 等待 Vite 7 支援   | 待定    |

---

## 7. 驗證清單

升級後必須驗證：

- [ ] `pnpm typecheck` 通過
- [ ] `pnpm lint` 通過
- [ ] `pnpm test` 通過 (768/768)
- [ ] `pnpm build` 成功
- [ ] E2E 測試通過
- [ ] Lighthouse CI 分數 ≥85
- [ ] 生產環境 SEO 健康檢查通過

---

## 參考資料

1. [React Router v7 升級指南](https://github.com/remix-run/react-router/blob/main/docs/upgrading/v6.md)
2. [Tailwind CSS v3 升級指南](https://v3.tailwindcss.com/docs/upgrade-guide)
3. [vite-plugin-pwa GitHub](https://github.com/vite-pwa/vite-plugin-pwa)
4. [LINUS_GUIDE.md](../LINUS_GUIDE.md) - Linus 三問驗證
5. [002_development_reward_penalty_log.md](./002_development_reward_penalty_log.md)
