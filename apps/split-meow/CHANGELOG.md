# @app/split-meow

## 0.2.2

### Patch Changes

- 5ca5122: 修正 KRW 上線前、localStorage 舊支出缺 currency 欄位時，切換全域幣別後歷史金額仍誤顯示為韓元；舊帳目改固定以台幣解析。

## 0.2.1

### Patch Changes

- 109ac4b: 每筆支出記錄記帳當下的幣別與匯率，切換顯示幣別後歷史金額不再被錯誤換算；以韓元（₩）記帳的支出會同時顯示對應的台幣參考金額。
- e655ff3: 修正混幣行程的結算金額：當同一行程混用多種幣別時，總額、各人餘額與結算不再把不同幣別的數字直接相加，改為僅顯示混幣警告並隱藏「各人結算」區塊，避免誤導金額。編輯既有費用時改用該筆記帳當下的幣別符號。
- 9de159a: 修正混幣行程（同一行程記到多種幣別）會把不同幣別金額直接相加、顯示錯誤總額與結算的問題；偵測到多幣別時改顯示警告並隱藏無效的總額與結算（含分享文字），引導使用者改用單一幣別記帳。
- 513a9c1: 切換幣別或記帳若會使同一行程混用多種幣別，改在當下以確認對話框提示；編輯舊費用時改以行程主導幣別解析符號，避免顯示錯誤幣別。時區自動偵測幣別若會造成混幣則靜默跳過，不再覆寫使用者幣別。

## 0.2.0

### Minor Changes

- 3ce2ccf: 新增 KRW 幣別支援與換錢所匯率整合（timezone 自動偵測、手動切換、換算提示），並以固定底部面板取代 BottomSheet 解決 iOS 鍵盤遮擋計算機問題

## 0.1.4

### Patch Changes

- e11be87: 修正 Release workflow 的 tag 推送方式，避免 CI tag push 重複觸發 pre-push hook。

## 0.1.3

### Patch Changes

- 83769aa: 修正 Release workflow 的 tag 建立與快取設定，避免發版卡在 tag 推送並移除 Node 20 action warning。

## 0.1.2

### Patch Changes

- 62bbcf9: 修正 release PR 自動建立流程，刷新 README / root hygiene，並對齊 Vite 8 React plugin 與版本基線，避免 changeset 已累積但版本與 CHANGELOG 未更新。

## 0.0.2

### Patch Changes

- 修復 Service Worker 三個 PWA 離線 bug：setCatchHandler 導覽回退改用 matchPrecache 解決 revision-keyed 快取鍵查詢失敗、補上 JS/CSS chunk 三層快取回退避免離線黑屏、新增 clientsClaim 確保首次安裝後立即控制已開啟頁面。
