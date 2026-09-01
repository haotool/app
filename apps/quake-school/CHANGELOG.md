# @app/quake-school

## 1.0.5

### Patch Changes

- aba2ed1: 將多 app 靜態部署與 Cloudflare 邊界設定收斂至可審查的 Pages 流程，並移除對 Vercel Analytics runtime 的依賴。
- Updated dependencies [aba2ed1]
  - @app/shared@0.0.1

## 1.0.4

### Patch Changes

- 921746c: 全 monorepo 接入 Vercel Web Analytics，Vercel 部署後可在 Dashboard 查看各 app 訪客與 page view。

## 1.0.3

### Patch Changes

- e11be87: 修正 Release workflow 的 tag 推送方式，避免 CI tag push 重複觸發 pre-push hook。

## 1.0.2

### Patch Changes

- 83769aa: 修正 Release workflow 的 tag 建立與快取設定，避免發版卡在 tag 推送並移除 Node 20 action warning。

## 1.0.1

### Patch Changes

- 62bbcf9: 修正 release PR 自動建立流程，刷新 README / root hygiene，並對齊 Vite 8 React plugin 與版本基線，避免 changeset 已累積但版本與 CHANGELOG 未更新。
