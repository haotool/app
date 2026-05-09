# MoneyBox History and Provider API Contract Plan

**Goal:** 補齊換錢所歷史資料保存與公開 API 合約，讓目前台灣銀行 + MoneyBox 的資料來源架構能乾淨銜接未來多銀行 provider。

**Scope:** 不啟用多銀行 UI、不新增銀行資料抓取。這輪只固定資料路徑、API metadata、OpenAPI 與 Open Data 文件頁。

## Tasks

- [x] **Task 1: MoneyBox 歷史快照**
      `update-moneybox-rates.yml` 每次 MoneyBox 匯率變更時，除了 `public/rates/moneybox.json`，也保存 `public/rates/moneybox-history/YYYY-MM-DD.json`，並讓 data branch refresh 與 CDN purge 覆蓋該路徑。

- [x] **Task 2: API metadata provider contract**
      `api/latest.json` 增加 provider metadata，描述 `sourceKind`、`providerId`、目前銀行選單未啟用、MoneyBox current/history endpoint。

- [x] **Task 3: OpenAPI provider contract**
      `openapi.json` 補 `RateProvider` 與 `ExchangeShopRatesResponse` schema，並新增 MoneyBox latest/history paths。

- [x] **Task 4: Open Data 頁面銜接**
      Open Data 頁面列出 MoneyBox 與 provider selection contract，明確說明目前只有台灣銀行一個 bank provider，未來 bank provider 超過一家才啟用銀行選單與最佳匯率推薦。

- [x] **Task 5: 驗證**
      以 build script sentinel tests、RateWise typecheck、Prettier 與 `git diff --check` 驗證，避免合約漂移。
