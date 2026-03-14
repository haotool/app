# @app/park-keeper

## 1.0.15

### Patch Changes

- feat(park-keeper): 羅盤導航 UX 改進 — 5 段方向、Lucide 圖示、i18n 單位、抵達 CTA
  - 方向判斷從 3 段升級為 5 段（直走 / 稍右 / 右轉 / 稍左 / 左轉）
  - 方向箭頭從 Unicode 字元（↑→←）換成 Lucide SVG 圖示（ArrowUp/UpRight/Right/Left/UpLeft）
  - 距離單位 "Meters" 改為 i18n：公尺 / Meters / メートル
  - 抵達後 1 秒彈出「關閉導航」CTA 按鈕，無需手動找關閉按鈕
  - 新增 getDirectionInfo() 純函式並補齊單元測試（22 cases）
  - 新增 i18n 完整性測試，確保 3 語言 4 新鍵一致

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
