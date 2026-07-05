# E1 設計簡報：韓系設計系統收斂（PM 親撰 v1.0）

> 依據：UIUX 審計 `.claude/product-intel/uiux-audit.md` 設計輸入 2「八維度 gap 表」。基底：`experiment/ratewise-product-2026h2` @ `18834c58`（已含七個 hotfix ＋ E2 自訂主題色 ＋ E3 換算 v2）。
> 目標：把視覺語言收斂到 Toss 級一致性。**只動視覺系統層，不動產品結構與文案。**

## 產品決策（已裁決，不得翻案）

- **主題存廢**：保留 7 內建主題＋custom（近期投資與使用者偏好），**不採**審計「收斂為 light/dark」建議；一致性改由 token 合約與守門測試保證。
- 內部頁（FAQ/指南/關於…）的版面重構屬 E4，本 epic 只提供系統元件與 token。

## 交付範圍

### 1. Token 收斂（附守門）

- **圓角**：現況 5 級混用 → 收斂 3 級（依現況使用頻率定值，寫入 design-tokens SSOT；全站替換）。
- **陰影**：彩色重陰影 → hairline border（1px `--color-border`）＋最多兩級極淡單層陰影；裝飾性彩色陰影清零。
- **字階**：建立 8 級字階 SSOT；**消滅 <12px 文字**（審計點名 `BottomNavigation` 的 `text-[8px]` 等 8–11px 全清）；tabular-nums 用於全部數字。
- **動效**：全站收斂三類——press-scale(0.97)、頁面 slide 轉場、數字 count-up；清除 4 個 infinite 動畫與全站 hover-scale（splash 脈動與載入 spinner 豁免）。
- **主互動元件去漸層**：CTA／按鈕／chip 一律平色（品牌 wordmark 與 splash 的品牌漸層豁免）；此項與 #575（白字表面錨定 strong）同批處理可一次收斂。

### 2. 系統元件（三個 primitive）

- **BottomSheet**：單一 primitive（拖曳關閉、backdrop、safe-area、65vh/自適應兩模式），收斂 E3 的兩個 sheet 殼（其 wave-B 待辦）與未來 modal 需求。
- **SegmentedControl**：multi 費率切換的正式版（取代 H6 過渡 chip），44px 觸控、radiogroup 語意。
- **CurrencyPicker**：E3 的 bottom sheet 選幣泛化為共用元件（搜尋、常用置頂、旗幟）。

### 3. 守門（防回退，全部進 vitest）

- 靜態 lint 測試：禁 `text-[8px]`～`text-[11px]`、按鈕類 className 禁新增 `bg-gradient`、圓角僅允許 token 白名單、陰影 class 白名單。
- 元件 API 測試 ＋ 7 主題 × 系統元件截圖矩陣。

## 邊界（out of scope）

SEO copy／內部頁結構（E4/E5）、`sw.ts`／路由、匯率邏輯、`STYLE_DEFINITIONS` 色值（僅消費）。SSG hydration 紅線不可破。

## 品質閘門

全套 vitest（含既有 parity/sync/AA 守門零弱化）、typecheck、build、e2e chromium 核心旅程；截圖矩陣：{首頁, multi, 設定} × {zen, nitro, kawaii} × {390×844, 375×667}；console error 0；changeset patch（視覺一致性改善）。

## 執行提示

分 3-4 個 commit（token 收斂 → 元件 → 替換消費端 → 守門）；`ROADMAP.md` 的 H1-H6/E2/E3 狀態順手更新為 DONE。
