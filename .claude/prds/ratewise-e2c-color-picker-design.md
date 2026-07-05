# E2 wave-C 設計簡報：自訂主題色選色 UX 現代化（PM 親撰 v1.0）

> 背景：使用者判定現行自訂色 UX 不佳（原生色相/明度滑桿＋hex 輸入體驗陽春）。方向：引入專業 React 依賴模組現代化，並開放背景色調。
> 基底：experiment 分支最新（E2 演算管線與 AA property 守門已在）。

## 選型（PM 裁決，執行者以 context7 查證後落地）

- **色票器**：`react-colorful`（~2.8KB gzip、零依賴、TS 原生、a11y 佳、React 生態事實標準）。用 `HexColorPicker`＋`HexColorInput`。**執行者必須先 context7 查證最新版 API 與相容性**，寫一份輕量 ADR（`.claude/decisions/ADR-001-react-colorful.md`：背景/替代方案 react-color 太重 vs 原生滑桿太陽春/成本 2.8KB/風險與回退）。禁止引入其他更重的替代品。
- 若 context7 查證發現重大不相容（React 19 issue 等），STOP 回報候選替代（如 headless 自寫），不得擅自換大型依賴。

## UX 規格

1. **入口不變**：設定頁自訂主題卡。點開改為 **BottomSheet**（E1 primitive——寬視口自動限寬置中已內建）。
2. **Sheet 內容**（上→下）：
   - 10 個精選色票（沿用 `CUSTOM_PRIMARY_PRESETS`，圓形 swatch＋選中勾）
   - `HexColorPicker`（飽和度面板＋色相條，全寬、高約 200px、圓角 token）
   - `HexColorInput`（帶 # 前綴、等寬字體）＋當前色即時預覽 chip（顯示演算後的 primary/strong 對比）
   - **背景色調**（新）：三選一 segmented——「純淨白」（zen 現值）／「暖白」（stone-50 系）／「冷白」（slate-100 系）；只切換 `background`/`surface-sunken` 淡色對，全部走演算集合＋AA 守門，**不做深色自訂**（深色需整組 palette 導出，列 future note）
   - 「恢復預設」
3. **即選即用**維持（live 套用）；選色時全 app 即時跟色（沿用既有 `deriveCustomThemeCssVars` 管線，背景調擴充進 `CUSTOM_THEME_CSS_VARS` 集合與清除集合）。
4. 觸控 ≥44px；四語系新文案；深色內建主題不受影響。

## 守門（硬）

- AA property 測試擴充涵蓋三種背景調 × 隨機主色（text/muted 對新背景 ≥4.5:1——背景調值由執行者選到全部達標）。
- 切換殘留零漏清（寫入=清除同一常數集合）；持久化 schema 擴充 `customBackgroundTone` 向後相容（舊值缺省＝純淨白）。
- bundle size 證據：build 前後 chunk 差異 ≤5KB gzip。
- E2E：開 sheet → 拖曳選色 → 背景調切換 → 重載持久 → 恢復預設。

## 邊界

`react-colorful` 是唯一允許的新依賴；offline.html 維持 fallback zen；manifest theme_color runtime 更新沿用。
