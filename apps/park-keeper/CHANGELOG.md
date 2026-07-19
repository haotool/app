# @app/park-keeper

## 1.3.2

### Patch Changes

- 64688a5: 無障礙全面收斂：設定頁全部文字對比達標（不再有半透明淡化難讀的標題與標籤）；Kawaii 主題正文與次要文字層級更清晰；關於頁連結對比修正；拍照按鈕圖示與地圖標記對螢幕閱讀器語意完整；手動記錄觸控範圍加大。

## 1.3.1

### Patch Changes

- 4e87308: 無障礙與可用性修正：Nitro／Kawaii 主題下樓層選取、導航按鈕與完成頁文字對比全面達標；抵達提示與更新提示按鈕文字更清晰；羅盤權限與校準提示顯示時，右上角關閉按鈕保持可點擊；空狀態教學卡對螢幕閱讀器朗讀完整文字。

## 1.3.0

### Minor Changes

- d242c24: Park-Keeper 羅盤頁全面改版：上方 58% 為可視地圖（車位與你的位置、兩點連線、照片縮圖錨點），下方為弧形羅盤儀表（大字距離、方位直立可讀）；小視窗與橫向自動切換精簡方向膠囊，徹底解決羅盤被遮蔽問題。首屏同步現代化：取車大卡為主、快速記錄為輔、移除重複的圓形按鈕（手動記錄改為文字入口）、時間顯示統一為相對時間、空狀態更清爽，四主題文字對比全面達無障礙標準。

## 1.2.0

### Minor Changes

- 5f2a428: Park-Keeper 首屏速度大幅提升：行動網路下首頁可視時間（LCP）縮短逾六成，開啟 app 立即看到拍照入口，不再等待載入。

### Patch Changes

- d9b53c2: 無障礙修正：未填車號的記錄卡在螢幕閱讀器朗讀編輯／刪除按鈕時，改唸「未填車號」而非「N/A」。

## 1.1.1

### Patch Changes

- af89ec9: Park-Keeper 體驗修正：已安裝 PWA 從捷徑直開 /add 或教學頁不再出現載入閃爍錯誤；羅盤方位文字轉身時保持直立易讀；未填車號顯示統一為「未填車號」；儲存提示不再遮住新增按鈕；單筆記錄時列表改精簡顯示避免與頂部大卡重複。

## 1.1.0

### Minor Changes

- e351f79: Park-Keeper 行動優先 UIUX 大改版：新增 /add 快速記錄頁與 /guide 捷徑教學（iOS 藍牙斷線自動化拍照 2 步完成、Android 長按捷徑）；首屏改為取車 hero 卡（超大樓層字＋照片，一眼找車）與拍照直達 CTA；羅盤導航全面重造（對準楔形高亮＋觸覺回饋、iOS 權限引導、精度校準、照片位置調整、四主題差異化）；上次車號與樓層自動帶入且歷史車號一鍵切換；照片保存天數設定真正自動清理；三語介面補齊、觸控目標與無障礙全面達標；更新提示全路由生效確保舊版自動升級。

## 1.0.31

### Patch Changes

- e11be87: 修正 Release workflow 的 tag 推送方式，避免 CI tag push 重複觸發 pre-push hook。

## 1.0.30

### Patch Changes

- 83769aa: 修正 Release workflow 的 tag 建立與快取設定，避免發版卡在 tag 推送並移除 Node 20 action warning。

## 1.0.29

### Patch Changes

- 62bbcf9: 修正 release PR 自動建立流程，刷新 README / root hygiene，並對齊 Vite 8 React plugin 與版本基線，避免 changeset 已累積但版本與 CHANGELOG 未更新。

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
