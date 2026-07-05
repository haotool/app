# ADR-001：選色器採用 react-colorful

- 狀態：Accepted
- 日期：2026-07-06
- 範圍：E2 wave-C 自訂主題色選色 UX 現代化（`apps/ratewise`）

## 背景

現行自訂色 UX 使用原生 `<input type="range">` 色相/明度滑桿＋hex 輸入，體驗陽春：
無飽和度面板、無二維拖曳選色、視覺回饋弱。PM 裁決引入專業 React 色票器依賴現代化，
並限定 `react-colorful` 為唯一允許的新依賴。

## 查證（context7 + npm registry，2026-07-06）

- Library：`/omgovich/react-colorful`（context7，243 code snippets，High reputation）
- 最新版：`react-colorful@5.7.0`（npm latest，2026-05-07 發布）
- peerDependencies：`react >=16.8.0`、`react-dom >=16.8.0` → **React 19.2.4 相容**（本 repo 實裝驗證通過，無 legacy context / findDOMNode 等 React 19 不相容 API）
- API：`HexColorPicker`（飽和度面板＋色相條，`color`/`onChange`）、`HexColorInput`（`prefixed` 顯示 # 前綴、內建 hex 驗證、`onChange` 回傳無 # 的 hex）
- 互動：滑鼠拖曳、**觸控完整支援**、鍵盤方向鍵（Shift 大步進）、ARIA label 齊備
- 樣式：以 `.react-colorful__*` class 覆寫（寬高、圓角、pointer 尺寸皆可控）

## 決策

採用 `react-colorful@5.7.0` 的 `HexColorPicker` + `HexColorInput`，
置於 BottomSheet（E1 primitive）內，維持既有 `deriveCustomThemeCssVars` 演算管線即選即用。

## 替代方案

| 方案 | 否決原因 |
| --- | --- |
| `react-color` | ~140KB（未壓縮）、依賴多、維護停滯、React 19 相容性存疑 |
| 原生滑桿（現狀） | 體驗陽春（PM 判定不合格），無二維飽和度選色 |
| headless 自寫 | 觸控/鍵盤/a11y 成本高，重造輪子違反 KISS |

## 成本（bundle 證據）

- 宣稱：~2.8KB gzip、零依賴、TypeScript 原生
- 實測（`pnpm build:ratewise` vite 輸出 gzip；react-colorful 落在 vendor-commons）：
  - `Settings` chunk：3.77 kB → 3.93 kB（+0.16 kB）
  - `vendor-commons` chunk：23.64 kB → 27.07 kB（+3.43 kB，含 react-colorful 本體＋CustomThemeSheet）
  - 差異合計：**+3.59 kB gzip ≤ 5KB 閘門** ✅

## 風險與回退

- 風險 1：拖曳期間每 frame 觸發 `setCustomPrimary`（inline CSS 變數寫入＋localStorage）。
  實測順暢；若低階機回報卡頓，後續可加 rAF throttle（不影響 API 形狀）。
- 風險 2：react-colorful 若停止維護——零依賴、~2.8KB 且 API 面窄，可原地 vendor 或以同介面自寫替換。
- 回退：移除依賴並還原原生滑桿 UI（演算管線與持久化 schema 不受影響，可獨立回滾）。
