# 架構基線與目標藍圖

> 現況已相當乾淨，接下來轉向資料來源與可維運性。

## 1. 現況概覽（2025-10-12）

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

| 里程碑 | 內容                                 | 產出               |
| ------ | ------------------------------------ | ------------------ |
| M1     | 建立 `shared/telemetry` + request id | logger 可輸出遠端  |
| M2     | 匯率服務抽象化 (`rateService.ts`)    | 方便接入真實 API   |
| M3     | 趨勢模擬改為 deterministic           | 測試穩定、行為可控 |
| M4     | E2E 測試資料夾完成                   | CI 可執行 smoke    |

---

更多細節請參考 [REFACTOR_PLAN.md](./REFACTOR_PLAN.md) 與 [TECH_DEBT_AUDIT.md](./TECH_DEBT_AUDIT.md)。
