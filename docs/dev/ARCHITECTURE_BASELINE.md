# 架構基線與目標藍圖

> **最後更新**: 2025-10-26T03:43:36+08:00  
> **執行者**: LINUS_GUIDE Agent (Linus Torvalds 風格)  
> **版本**: v2.0 (完整超級技術債掃描產出)  
> **狀態**: 現況已相當乾淨，符合 Linus KISS 原則

---

## Linus 架構哲學

> "Bad programmers worry about the code. Good programmers worry about data structures and their relationships."  
> — Linus Torvalds

**核心原則**：

1. **資料結構優先**：設計正確的資料結構，代碼自然簡潔
2. **消除特殊情況**：用資料結構消除 if/else 分支
3. **簡單的設計**：<3 層縮排，每個函數只做一件事

## 1. 現況概覽（2025-10-26）✅

```
apps/
└── ratewise/
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── components/
    │   │   └── ErrorBoundary.tsx
    │   ├── features/
    │   │   └── ratewise/
    │   │       ├── RateWise.tsx
    │   │       ├── components/
    │   │       │   ├── SingleConverter.tsx
    │   │       │   ├── MultiConverter.tsx
    │   │       │   ├── FavoritesList.tsx
    │   │       │   └── CurrencyList.tsx
    │   │       ├── hooks/useCurrencyConverter.ts
    │   │       ├── constants.ts
    │   │       ├── storage.ts
    │   │       └── types.ts
    │   └── utils/logger.ts
    ├── postcss.config.js
    ├── tailwind.config.ts
    └── vite.config.ts
```

- 元件拆分完成，每個檔案 <150 行。
- `useCurrencyConverter` 負責邏輯，UI 元件僅渲染 props。
- `logger.ts` 提供最小 observability 但尚未外送。

## 2. 目標藍圖（12 週內）

```
apps/
└── ratewise/
    ├── src/
    │   ├── app/
    │   │   ├── routes/                # 未來若導入 router
    │   │   └── providers/
    │   ├── features/
    │   │   └── ratewise/
    │   │       ├── ui/                # 純 UI 組件
    │   │       ├── services/          # 匯率資料、趨勢模擬
    │   │       ├── hooks/
    │   │       └── model/             # 型別、常數
    │   ├── shared/
    │   │   ├── telemetry/             # logger、request-id、metrics
    │   │   └── storage/               # localStorage 抽象
    │   └── app.tsx / main.tsx
    └── tests/
        ├── unit/
        └── e2e/
```

### 分層準則

1. **Domain Layer** (`features/ratewise/model`)
   - 定義 `CurrencyDefinition`, `ConversionHistoryEntry` 等型別。
   - 處理純粹的資料計算函式，無副作用。

2. **Application Layer** (`features/ratewise/services`, `hooks`)
   - `useCurrencyConverter`、`rateService`、`trendService`。
   - 對外只輸出 hooks 與 service API。

3. **Interface Layer** (`features/ratewise/ui`, `App.tsx`)
   - React 元件、表單、事件處理。
   - 禁止直接碰 localStorage / logger。

4. **Infrastructure Layer** (`shared/telemetry`, `shared/storage`, `apps/shared`)
   - 實作 logger sink、localStorage adapter、API client。
   - 可由其他 app 共用。

## 3. 設計守則

- **單一職責**：每個 React 元件只負責一件事；復雜邏輯移到 hooks/service。
- **資料驅動**：特殊情況轉成資料結構（例如 favorites 維持 set，而非 if/else）。
- **Feature Flag**：所有模擬資料（趨勢、假匯率）都需透過 flag 控制。
- **不可破壞 Userspace**：localStorage key、API Response 在正式版前先定義版本欄位。

## 4. 遷移路線圖

| 里程碑 | 內容                                  | 產出                      | 狀態      |
| ------ | ------------------------------------- | ------------------------- | --------- |
| M0     | 清理與基礎強化 (1週)                  | 刪除死代碼、提升門檻      | 📋 待開始 |
| M1     | 建立 `shared/telemetry` + Sentry 整合 | logger 可輸出遠端         | 📋 待開始 |
| M2     | 依賴升級（Vite 7, Vitest 4）          | 安全升級完成              | 📋 待開始 |
| M3     | 測試強化與 TODO 清理                  | E2E retry = 0             | 📋 待開始 |
| M4     | 架構演進（可選）                      | useCurrencyConverter 拆分 | 📋 可選   |

---

## 5. 品味評分與改進方向

### 現況評分

| 維度         | 分數   | 評語                                                   |
| ------------ | ------ | ------------------------------------------------------ |
| **資料結構** | 85/100 | 🟢 優秀 - favorites 使用 Set，sortedCurrencies useMemo |
| **特殊情況** | 80/100 | 🟢 良好 - 大部分邏輯無 if/else 分支                    |
| **函數長度** | 75/100 | 🟡 可接受 - useCurrencyConverter 317 行略長            |
| **命名克制** | 90/100 | 🟢 優秀 - 命名清晰，無冗餘                             |

### 改進方向 (M4 可選)

```typescript
// ❌ 現況：單一 hook 處理所有邏輯 (317 lines)
export const useCurrencyConverter = (options) => {
  // Storage
  const [mode, setMode] = useState(...);
  const [favorites, setFavorites] = useState(...);

  // Rate calculations
  const getRate = useCallback(...);
  const recalcMultiAmounts = useCallback(...);

  // History
  const [history, setHistory] = useState(...);

  // 所有邏輯混在一起
}

// ✅ 建議：拆分為多個小 hook (M4 階段)
export const useCurrencyConverter = (options) => {
  const storage = useCurrencyStorage(); // 70 lines
  const rates = useRateCalculations(options.exchangeRates); // 100 lines
  const history = useConversionHistory(); // 50 lines
  const trends = useTrendCalculations(options.exchangeRates); // 80 lines

  return { ...storage, ...rates, ...history, ...trends };
}
```

---

## 6. Context7 架構參考

- [React 19 Hooks 最佳實踐](https://react.dev/reference/rules/rules-of-hooks) [ref: #1]
- [React Custom Hooks 模式](https://react.dev/learn/reusing-logic-with-custom-hooks) [ref: #1]
- [Clean Code TypeScript](https://github.com/labs42io/clean-code-typescript) [業界最佳實踐]

---

更多細節請參考 [REFACTOR_PLAN.md](./REFACTOR_PLAN.md) 與 [TECH_DEBT_AUDIT.md](./TECH_DEBT_AUDIT.md)。

_本架構藍圖依照 Linus Torvalds 開發哲學產生，專注資料結構與簡潔設計。_
