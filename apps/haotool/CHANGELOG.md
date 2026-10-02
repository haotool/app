# @app/haotool

## 1.1.9

### Patch Changes

- 0c40cf4: 幣別頁匯率日期改為台銀牌告日期，避免週末把舊牌告標示為當日更新。

  重新整理與啟動失敗時的清除按鈕只清除匯率工具自己的快取，保留同站其他工具的離線資料；首次開啟時正確遷移並修復儲存的換算偏好。

  根站更新離線資源時保留各子工具的快取，避免其他工具的離線啟動失效。

  刷新會同步更新啟動用的離線頁，避免沿用舊版畫面。

  儲存空間不足時也會清理舊版匯率工具快取，保留其他工具的離線資料。

## 1.1.8

### Patch Changes

- Updated dependencies [1bf12e8]
- Updated dependencies [1bf12e8]
  - @app/shared@0.1.0

## 1.1.7

### Patch Changes

- Updated dependencies [422cf27]
  - @app/shared@0.0.4

## 1.1.6

### Patch Changes

- Updated dependencies [2447ee9]
  - @app/shared@0.0.3

## 1.1.5

### Patch Changes

- Updated dependencies [4936883]
  - @app/shared@0.0.2

## 1.1.4

### Patch Changes

- 45bb706: 隱私說明移除已停用的 Vercel Web Analytics 描述，與目前僅以 Cloudflare 部署的實際服務一致。

## 1.1.3

### Patch Changes

- 605d024: 首頁與工具總覽上架《A320neo 沉浸式駕駛艙》工具卡（含截圖素材），並將 `/a320-flight-deck/` 加入根站 Service Worker denylist 防止子路徑劫持。

## 1.1.2

### Patch Changes

- aba2ed1: 將多 app 靜態部署與 Cloudflare 邊界設定收斂至可審查的 Pages 流程，並移除對 Vercel Analytics runtime 的依賴。
- Updated dependencies [aba2ed1]
  - @app/shared@0.0.1

## 1.1.1

### Patch Changes

- 921746c: 全 monorepo 接入 Vercel Web Analytics，Vercel 部署後可在 Dashboard 查看各 app 訪客與 page view。

## 1.1.0

### Minor Changes

- 0046c3c: 首頁上架《星噗噗 StarPuff》遊戲卡片（bento 前五曝光、含截圖素材），並將 `/starpuff/` 加入根站 Service Worker denylist 防止子路徑劫持。

### Patch Changes

- 6031296: 首頁星噗噗卡片縮圖更新為 v3 橫式版實戰畫面。
- 72cea62: 新增《紙上交易所 PaperTrade》：串接 Bybit 真實即時行情，以模擬資金零風險練習永續合約交易——行情清單、K 線圖表、市／限價下單、TP/SL/追蹤止損、強平與資產損益全流程，支援安裝為 PWA 離線開啟。haotool 首頁作品集同步上架 PaperTrade 工具卡。
