# @app/split-meow

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
