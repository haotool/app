# @app/park-keeper

## 1.0.14

### Patch Changes

- fix(park-keeper): 修正 vite-react-ssg v0.8.9 + React 19 雙重渲染導致畫面空白

  React 19 hydrateRoot 無法辨識 vite-react-ssg 的 SSG HTML 標記，改以 createRoot 在 #root 內新增第二個 div，
  孤兒 SSG div（min-h-screen）覆蓋整個視窗，導致 React app 不可見。
  使用 CSS :has() 選擇器在 React div 出現後立即隱藏孤兒 SSG div。

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
