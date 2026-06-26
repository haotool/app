# RateWise UIUX 與 Design Token 收斂 SPEC

> 狀態：Active
> 建立日期：2026-05-23
> 負責範圍：`apps/ratewise/` UI shell、SEO 內容頁、幣別落地頁、設計 token 與 PWA 導覽體驗
> 產品北極星：`DESIGN.md` 的 **The Quiet Exchange Desk**

## 1. 目標

本次重構的目標是將 RateWise 的 UIUX 收斂成可維護、可稽核、可在 PWA 與全裝置穩定呈現的 SSOT 設計系統。

- 預設視覺以 `zen` 的冷靜金融工具語法為基準。
- 所有正式頁面不得各自發明第二套色彩、間距、麵包屑、卡片或內容頁 shell。
- 導覽、麵包屑、內容頁容器、互動卡片與正式內容頁表面語法必須從 `design-tokens.ts` 或 CSS variables 取得。
- iOS PWA safe-area、sticky header、bottom navigation 與橫向 breadcrumb 不得靠個別 inline style 漂移。

## 2. 目前頁面盤點

### 2.1 AppLayout 產品頁

共用：`AppLayout`、`SideNavigation`、`BottomNavigation`、`rateWiseLayoutTokens`、`multiConverterLayoutTokens`、`contentPageTokens`。

| 路由          | 頁面                              | 目的                               |
| ------------- | --------------------------------- | ---------------------------------- |
| `/`           | `RateWise` + `HomepageSEOSection` | 單幣別換算首頁                     |
| `/multi/`     | `MultiConverter`                  | 多幣別換算                         |
| `/favorites/` | `Favorites`                       | 收藏與歷史                         |
| `/settings/`  | `Settings`                        | 介面風格、語言、格式設定與支援入口 |

### 2.2 Layout SEO / 內容頁

共用：`Layout`、`contentPageTokens.shell`、`PageNavHeader`、`Breadcrumb`、`SEOHelmet`。

| 路由                      | 頁面                 | 共用狀態                                                                                    |
| ------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `/faq/`                   | `FAQ`                | 已使用 `contentPageTokens` + `PageNavHeader`                                                |
| `/about/`                 | `About`              | 已使用 `contentPageTokens` + `PageNavHeader`                                                |
| `/privacy/`               | `Privacy`            | 已使用 `contentPageTokens` + `PageNavHeader`                                                |
| `/guide/`                 | `Guide`              | 已使用 `contentPageTokens` + `PageNavHeader`                                                |
| `/open-data/`             | `OpenData`           | 已使用 `contentPageTokens` + `PageNavHeader` + `contentPageTokens.table`                    |
| `/seo-tech/`              | `SeoTech`            | 已移除主要任意 `rgb(var(...))` 類別與大圓角漂移，仍可後續拆 metric/timeline/pipeline 子元件 |
| `/sell-rate-vs-mid-rate/` | `AuthorityGuidePage` | 共用工廠頁，已收斂 hero、section、FAQ、CTA 與相關連結 token                                 |
| `/cash-vs-spot-rate/`     | `AuthorityGuidePage` | 同上                                                                                        |
| `/card-rate-guide/`       | `AuthorityGuidePage` | 同上                                                                                        |

### 2.3 幣別落地頁

共用：`CurrencyLandingPage`、`contentPageTokens.shell`、`PageNavHeader`、`SEOHelmet`。

- 幣別：`AUD`、`CAD`、`CHF`、`CNY`、`EUR`、`GBP`、`HKD`、`IDR`、`JPY`、`KRW`、`MYR`、`NZD`、`PHP`、`SGD`、`THB`、`USD`、`VND`
- 路由型態：17 個 `/{currency}-twd/`、17 個 `/twd-{currency}/`
- 金額路由：每個幣對另有 `/:amount` 版本，例如 `/usd-twd/:amount`

### 2.4 內部 / 開發頁

僅在 dev 或 `VITE_ENABLE_INTERNAL_ROUTES=true` 註冊：`/theme-showcase/`、`/color-scheme/`、`/update-prompt-test/`、`/ui-showcase/`。

## 3. 未達生產標準問題

| 優先級 | 問題                                                                               | 影響                                                | 重構方向                                                                                        |
| ------ | ---------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| P0     | `PageNavHeader` 原本用 inline safe-area padding 與元件內 hardcoded classes         | iOS PWA / sticky header 容易漂移                    | 已改由 `pageNavHeaderTokens` 管理                                                               |
| P0     | 舊文件仍描述 `data-mode=dark` 與深色模式                                           | 文件與 runtime SSOT 不一致                          | 更新 `014_design_token_architecture.md`，明確只保留 `data-style`                                |
| P1     | `pageLayoutTokens.content.maxWidth` 與 `max-w-5xl` 不一致                          | 設計尺寸不可稽核                                    | 已對齊 1024px 並拆出 padding / variant token                                                    |
| P1     | `PageCard` 用 `div role="button"` 模擬按鈕                                         | 鍵盤語意與可及性不如原生控制                        | 已改為有 `onClick` 時輸出原生 `button`                                                          |
| P1     | `AppLayout` / `SideNavigation` / `SeoTech` 有任意 `rgb(var(...))` class            | 色彩語法有兩套寫法                                  | 已改核心 shell 與 `SeoTech` 為 `bg-background`、`text-text`、`border-border` 等語義 class       |
| P1     | `SeoTech` 是獨立堆出的資訊儀表頁                                                   | 與 FAQ / Guide / OpenData 的 section 語法不完全一致 | 已先收斂色彩、半徑與表面語法；後續可再拆 `contentPageTokens.metrics`、`pipelineRow`、`codeList` |
| P2     | `AuthorityGuidePage` 與 `CurrencyLandingPage` 仍有大量 `card p-*` 與局部排版 class | 同類內容頁有相似但未命名的樣式                      | 已建立並套用 `contentPageTokens.article`、`result`、`callouts`、`buttons`                       |
| P2     | `Favorites`、`Settings` 仍有局部 10px/11px、preview inline style 與 tab 語法       | 設定頁與收藏頁視覺密度未完全收斂                    | 已建立並套用 `appPageTokens`；動態 style preview 僅保留必要 CSS variable 例外                   |
| P2     | `OpenData` 表格 min-width 與表格樣式分散                                           | 手機橫向表格體驗不可統一驗收                        | 已建立並套用 `contentPageTokens.table`                                                          |
| P3     | dev showcase 與季節彩蛋仍有必要的展示 / SVG / canvas inline style                  | 不是正式頁主要風險，但會污染搜尋結果                | dev showcase 已收斂半徑與動畫；季節彩蛋維持隔離例外                                             |
| P3     | `defaultTheme` / `darkTheme` 相容層仍保留歷史色票                                  | 容易被誤當 runtime 視覺 SSOT                        | 文件標註為 Tailwind legacy compatibility，不作產品決策來源                                      |

## 4. 重構計畫

### Phase 1：基礎 token 與導覽收斂

- 將 `PageNavHeader`、`Breadcrumb`、`PageContainer` 改為 `design-tokens.ts` 驅動。
- 移除 breadcrumb inline style，改用 token class 處理 `env(safe-area-inset-top)`。
- 將返回按鈕保持 `min-h-11`、清楚 focus ring、可觸控與 basename-safe navigation。
- 針對核心 shell 建立來源掃描：正式頁不得新增 `text-[rgb(...)]`、`bg-[rgb(...)]`、`border-[rgb(...)]`。

### Phase 2：內容頁 family 統一

- 把 FAQ、About、Privacy、Guide、OpenData、SeoTech、AuthorityGuidePage 統一成：
  - `ContentPageShell`
  - `ContentPageHero`
  - `ContentSection`
  - `ContentLinkRow`
  - `ContentTable`
- 所有內容頁只允許使用 `contentPageTokens` 或上述元件組合，不再直接堆 card / panel class。

### Phase 3：幣別頁 family 統一

- 把 `CurrencyLandingPage` 裡的結果面板、牌告解釋、比較卡、FAQ、相關連結抽成 tokens / components。
- 金額路由與一般幣別路由使用同一個 hero、結果、說明順序，差別只在資料狀態。
- 驗收所有 34 個幣別頁在 320px、390px、768px、1024px、1440px 不產生水平 overflow。

### Phase 4：產品 app shell 統一

- `RateWise`、`MultiConverter`、`Favorites`、`Settings` 使用同一套 app panel、tab、row、empty state、notification tokens。
- 設定頁的 style preview inline color 保留為「動態 preview 例外」，但 wrapper、label、selected state 改為 token。
- 收藏 / 歷史清單統一 row padding、label typography、danger action 與 empty state。

### Phase 5：治理與驗證

- 單元測試：`PageNavHeader`、`Breadcrumb`、`PageContainer`、`design-tokens`。
- Source scan：正式頁禁止任意 `rgb(var(...))` Tailwind class，例外只允許 chart/SVG/canvas、theme preview、offline fallback。
- Chrome / PWA QA：桌面、手機、PWA standalone safe-area；console error = 0。
- 建置驗證：`pnpm --filter @app/ratewise typecheck`、targeted Vitest、UI 變更後至少 `pnpm --filter @app/ratewise build`。

## 5. 麵包屑驗收標準

- Header root 由 `pageNavHeaderTokens.root` 管理，無 inline `style`。
- safe-area class 固定為 `pt-[calc(env(safe-area-inset-top,0px)+0.625rem)]`。
- Header row 至少 `44px`，返回按鈕至少 `44px` 觸控高度。
- Breadcrumb 容器 `min-w-0`，list 可水平捲動且保持單行。
- 最後一個 breadcrumb 必須 `truncate`，不得把 sticky header 撐高。
- Link / button 均有 `focus-visible:ring-2` 與 `aria-current="page"`。

## 6. 參考依據

- `DESIGN.md`：RateWise 產品視覺 SSOT
- `PRODUCT.md`：RateWise 產品語氣與 anti-reference
- `apps/ratewise/src/config/design-tokens.ts`：runtime layout / component token SSOT
- Vercel Web Interface Guidelines：互動語意、focus、safe-area、motion 與 token hygiene

## 7. 2026-05-23 執行紀錄

- 已完成 `PageNavHeader` / `Breadcrumb` PWA safe-area 重構，導覽無 inline style，320px / 390px / 768px 實測無水平 overflow。
- 已完成內容頁 family 第一輪收斂：`AuthorityGuidePage`、`CurrencyLandingPage`、`OpenData`、`SeoTech`、`AnswerCapsule`、首頁 SEO FAQ 均使用 8px 表面與語義色彩。
- 已完成產品 app shell 第一輪收斂：`RateWise`、`MultiConverter`、`Favorites`、`Settings`、側欄、底部導覽、骨架屏、Toast、錯誤復原 UI、下拉刷新提示均移除大圓角與 `transition-all`。
- 已完成互動語意修正：`PageCard`、單幣別金額輸入、多幣別金額輸入、多幣別基準貨幣選擇、收藏列表等改用原生 `button`；新增 source scan 確認沒有手動 `role="button"` 回歸。
- Source scan 目前覆蓋正式頁與內部展示頁，禁止 `transition-all`、`transition: all`、`rounded-xl/2xl`、任意數字大圓角、`role="button"`、`border-surface-border` 與 `divide-surface-border`；季節彩蛋樣式維持隔離例外。
- 已刪除 5 組 runtime 未引用的 UIUX 死碼 / shim，並修正測試中仍綁定舊樣式合約的斷言，避免舊 token 漂移被測試重新固定。
- 已移除 `index.html` 全域 `logo.png` preload；該資源只在 App header 使用，SEO/content 路由會產生 Chrome unused-preload warning。

## 8. 2026-05-23 Impeccable / Browser 驗證結果

- `npx impeccable detect --json --fast apps/ratewise/src`：通過，回傳 `[]`。
- `pnpm --filter @app/ratewise test -- run`：通過，141 檔 passed、1 檔 skipped；2381 tests passed、2 skipped。
- `pnpm --filter @app/ratewise typecheck`：通過。
- `node scripts/verify-ssot-sync.mjs`：通過，`themes.ts`、`index.css`、`index.html` skeleton、manifest、offline shell 與 `DESIGN.md` 同步。
- 死碼回歸掃描：`PageContainer|PageSection|PageCard|RateProviderMenu|SnowAccumulation|useLongPress` 無正式 src/tests 引用。
- Browser DOM / axe 驗證：`/`、`/multi/`、`/favorites/`、`/settings/`、`/seo-tech/` 在 390x844、768x1024、1440x900 共 15 組路由/視窗通過；console warning 0、horizontal overflow 0、44px 以下互動目標 0、12px 以下可見文字 0、axe violations 0。
- Chrome/Playwright 現場回歸：`/seo-tech/?qa=preload-check` 390x844，console errors 0、warnings 0。
- `pnpm build:ratewise`：通過。

## 9. 死碼 UIUX 判定

已刪除「正式 runtime 未引用，但仍被測試或展示出口引用」的候選，並同步移除測試、barrel export 與掃描清單，避免把測試覆蓋誤判為產品依賴。

| 候選                                                       | 判定                                                                                  | 處置                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `src/components/PageContainer.tsx`                         | 僅測試與 design-token scan 引用，正式頁面已改用 `contentPageTokens` / `appPageTokens` | 已刪除元件、測試與 scan 清單引用                  |
| `src/features/ratewise/components/RateProviderMenu.tsx`    | 僅元件測試與 i18n scan 引用，正式換匯流程未渲染                                       | 已刪除元件、測試與 i18n guard 檔案引用            |
| `src/features/calculator/easter-eggs/SnowAccumulation.tsx` | 由 easter-eggs barrel 與季節測試引用，正式聖誕入口未直接渲染                          | 已刪除元件、barrel export、type export 與測試段落 |
| `src/features/calculator/hooks/useLongPress.ts`            | 目前只有 hook 測試與註解引用                                                          | 已刪除 hook 與測試，並更新 CalculatorKey 測試註解 |
| `src/features/ratewise/storage.ts`                         | 僅 storage 測試引用，runtime 已轉向 `storage-keys.ts` 與 store/utils                  | 已刪除 shim 與測試                                |
