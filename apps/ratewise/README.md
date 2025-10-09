# RateWise 初始結構

- `src/features/ratewise/`：主要邏輯（`RateWise.tsx` + `constants.ts` + `types.ts` + `storage.ts`）。
- 根目錄 `RateWise.tsx` 只作為向後相容 re-export，請勿再修改。
- `public/`：靜態資源（建立 Vite/Next 專案後由工具自動產生）。

> 重構時請參考 `docs/SETUP.md` 的流程，把 `RateWise.tsx` 拆成 `App.tsx` + hooks + components。
