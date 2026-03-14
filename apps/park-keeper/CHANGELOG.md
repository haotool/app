# @app/park-keeper

## 1.0.13

### Patch Changes

- 修正 vite-react-ssg 雙重 Layout 渲染：將 \_\_staticRouterHydrationData script 從 #root 移出，確保 React hydrateRoot 正確工作

## 1.0.12

### Patch Changes

- 修正首頁卡住骨架屏問題：將 ClientOnly fallback 改為 null，避免 SSG 預渲染 min-h-screen 骨架屏疊在 React app 上方

## 1.0.11

### Patch Changes

- 修正 Cloudflare Rocket Loader 造成骨架屏永久卡住的問題。

## 1.0.10

### Patch Changes

- 4a01667: 修復 RateWise 的 Cloudflare 安全標頭分層與正式站驗證流程，並讓 ParkKeeper 的裝置方向感測器只在 Quick Entry 面板可見時啟用，降低正式站權限警告與 console 噪音。
