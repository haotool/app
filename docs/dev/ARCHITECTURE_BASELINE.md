# 架構基線與目標藍圖

**Linus 評語**: 簡單清晰，保持這個優點。

## 當前架構

```
apps/ratewise/
  src/
    App.tsx                    (8 lines - 簡潔)
    main.tsx                   (10 lines - 標準)
    features/ratewise/
      RateWise.tsx             (586 lines - 過大❌)
      types.ts                 (20 lines - 清晰✅)
      constants.ts             (22 lines - 簡潔✅)
      storage.ts               (29 lines - 抽象✅)
```

## 目標架構 (重構後)

```
apps/ratewise/
  src/
    App.tsx
    features/ratewise/
      index.tsx                (Context Provider)
      SingleConverter.tsx      (單幣別UI)
      MultiConverter.tsx       (多幣別UI)
      FavoritesList.tsx        (常用清單)
      CurrencyList.tsx         (全部幣種)
      hooks/
        useCurrencyConverter.ts
        useCurrencyStorage.ts
        useTrendSimulator.ts
```

## 設計原則

1. **單一職責** - 每個元件 <150 行
2. **清晰分層** - UI / Logic / Data
3. **最小依賴** - 避免過度抽象

---

_詳細分析參見 TECH_DEBT_AUDIT.md_
