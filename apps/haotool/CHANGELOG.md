# @app/haotool

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
