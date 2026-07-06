# RateWise UI/UX 審查報告（Fleet UIUX Audit）

- 日期：2026-07-07
- 分支：`fix/fleet-uiux-audit`（獨立 worktree，未 commit，交由 PM review）
- 標準：Toss 級韓系 fintech；WCAG 2.2（2.4.7 Focus Visible、2.5.8 Target Size、1.4.3 Contrast、4.1.3 Status Messages）
- 驗證：`pnpm typecheck` ✅ 全 workspace 通過；`pnpm vitest run`（apps/ratewise）✅ 177 檔 3996 tests 通過

## 摘要

- 共修復 24 項問題，涵蓋 18 個檔案；全部樣式值走 design token 或既有 token 字面量。
- 新增 1 個 SSOT token：`buttonTokens.patterns.iconMd`（圖示按鈕 44px 熱區 + focus ring）。
- 修改 1 個 SSOT token：`segmentedSwitch.itemBaseClass` 補 focus-visible（Favorites tabs 與 Settings 分段控制同時受益）。
- 未動：BottomNavigation / RatingModal / 快速金額 chips（PM 已修）、SEO 文案（seo-metadata 守門測試通過）。

## 修復清單

### P0（阻斷性：壞掉的 class / 無障礙硬傷）

| #   | 問題                                                                                                     | 嚴重度 | 修復                                                            | 位置                                                       |
| --- | -------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | 殘缺 Tailwind class `group- `（無效 class 洩漏到 DOM）                                                   | P0     | 移除（行動版與桌面版各一處）                                    | `apps/ratewise/src/components/Footer.tsx:113`、`:271`      |
| 2   | Toast `role="alert"` 同時標 `aria-live="polite"`，語意衝突（alert 隱含 assertive），螢幕報讀行為不可預期 | P0     | 移除多餘 `aria-live`，保留 `role="alert"`（WCAG 4.1.3）         | `apps/ratewise/src/components/Toast/ToastProvider.tsx:139` |
| 3   | Footer 版本號 tooltip 只有 `group-hover` 可見，鍵盤永遠拿不到（WCAG 2.1.1）                              | P0     | `tabIndex={0}` + `group-focus-visible:opacity-100` + focus ring | `apps/ratewise/src/components/Footer.tsx:236-247`          |

### P1（觸控目標 <44px，WCAG 2.5.8）

| #   | 問題                                                              | 嚴重度 | 修復                                                                                                       | 位置                                                                              |
| --- | ----------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 4   | Favorites 星號收藏切換僅 28×24px                                  | P1     | `w-11 h-11 -mx-2 -my-2`（負 margin 保持視覺密度）＋ focus ring                                             | `apps/ratewise/src/pages/Favorites.tsx:294`                                       |
| 5   | MultiConverter 星號切換僅 ~20×20px（`p-0.5` + 16px icon）         | P1     | `w-11 h-11 -m-3.5` 兩態按鈕皆改＋ focus ring                                                               | `apps/ratewise/src/features/ratewise/components/MultiConverter.tsx:232`、`:243`   |
| 6   | Settings 啟動畫面 switch 僅 44×24px（高度不足）                   | P1     | 外層 `h-11 w-14` 熱區、視覺軌道移入內層 span；補 focus ring；`role="switch"` 語意不變                      | `apps/ratewise/src/pages/Settings.tsx:519-547`                                    |
| 7   | Favorites「清除全部」僅 ~24px 高                                  | P1     | `min-h-11 -my-2`（不撐開標題列）＋ focus ring                                                              | `apps/ratewise/src/pages/Favorites.tsx:400-403`                                   |
| 8   | Favorites「點擊換算」列尾動作區高度不足                           | P1     | `min-h-11 -my-1`；同時補 Space 鍵 `preventDefault`（避免觸發捲動）＋ focus ring                            | `apps/ratewise/src/pages/Favorites.tsx:357-372`                                   |
| 9   | Favorites 空歷史 CTA `py-2.5` 約 38px                             | P1     | `min-h-11` ＋ focus ring ＋ 200ms transition                                                               | `apps/ratewise/src/pages/Favorites.tsx:417-420`                                   |
| 10  | Footer 行動版快速連結／熱門匯率連結僅 ~16px 高                    | P1     | `inline-flex min-h-11 items-center`（`gap-x-*` 保持水平節奏）＋ focus ring；桌面版同步                     | `apps/ratewise/src/components/Footer.tsx:161-206`、`:318-349`                     |
| 11  | Footer 桌面 SEO 連結格 `text-sm` 純文字（<24px，AA 桌面指標下限） | P1     | `inline-block py-1`（28px）＋ `space-y-2`→`space-y-1` 維持節奏 ＋ focus ring                               | `apps/ratewise/src/components/Footer.tsx:361-372`                                 |
| 12  | PageNavHeader 返回鈕熱區僅文字高（列雖 44px 但按鈕本身 ~20px）    | P1     | `min-h-11` ＋ focus ring ＋ `active:opacity-70` 回饋                                                       | `apps/ratewise/src/components/PageNavHeader.tsx:41-52`                            |
| 13  | 404 建議連結 `py-2` 約 36px                                       | P1     | `inline-flex min-h-11 items-center justify-center` ＋ focus ring                                           | `apps/ratewise/src/pages/NotFound.tsx:57-68`                                      |
| 14  | CalculatorKeyboard 關閉鈕無 padding（24px icon 裸熱區）           | P1     | 套用新 token `buttonTokens.patterns.iconMd`（44px、focus ring、active:scale-95）；`-mr-2.5` 對齊原視覺位置 | `apps/ratewise/src/features/calculator/components/CalculatorKeyboard.tsx:249-254` |

### P2（focus 可見性 / 微互動 / 對比）

| #   | 問題                                                                                                                                              | 嚴重度 | 修復                                                                                                      | 位置                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 15  | `segmentedSwitch.itemBaseClass`（SSOT）無 focus-visible → Favorites tabs、Settings 語言／匯率模式／轉換器樣式分段控制鍵盤焦點不可見（WCAG 2.4.7） | P2     | token 補 `focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset` | `apps/ratewise/src/config/animations.ts:185-188`                                                       |
| 16  | BottomSheet 關閉鈕（尺寸已達 44px）無 focus-visible                                                                                               | P2     | 套 `buttonTokens.patterns.iconMd`                                                                         | `apps/ratewise/src/components/BottomSheet.tsx:155-162`                                                 |
| 17  | CurrencyPicker 幣別選項無 focus-visible、無 active 回饋                                                                                           | P2     | `focus-visible:ring-2 ring-inset` ＋ `active:bg-primary/10` ＋ `duration-200`                             | `apps/ratewise/src/components/CurrencyPicker.tsx:98`                                                   |
| 18  | SingleConverter 匯率卡 hover 與微光 `duration-500`、swap icon 旋轉 `duration-500`（超出 150–300ms 微互動規範）                                    | P2     | 全部改 `duration-300`（對齊 `motionDurations.slow`）                                                      | `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx:505`、`:512`、`:634`               |
| 19  | SingleConverter swap 鈕與「加入紀錄」CTA 無 focus-visible                                                                                         | P2     | 補 `focus-visible:ring-2 ring-primary ring-offset-2`（buttonTokens.base.focus 字面量）                    | `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx:612-621`、`:751-760`               |
| 20  | 三處錯誤態 reload 鈕（首頁／多幣別／收藏）與 Skeleton 逾時 reload 鈕：`transition` 無時長、缺 focus-visible、部分缺 active 回饋                   | P2     | 統一 `transition-all duration-200 ease-out active:scale-[0.97]` ＋ focus ring                             | `RateWise.tsx:173`、`pages/MultiConverter.tsx:126`、`pages/Favorites.tsx:165`、`SkeletonLoader.tsx:60` |
| 21  | Toast 文字 `text-primary`/`text-destructive`（如預設主題 red-500/blue-500）對 15% 淡色底 14px 文字對比 <4.5:1（WCAG 1.4.3）                       | P2     | 改 `text-primary-hover`/`text-destructive-hover`（各主題 hover 階皆朝「對 surface 更高對比」方向調校）    | `apps/ratewise/src/components/Toast/ToastProvider.tsx:105-133`                                         |
| 22  | Settings 主題卡、支援連結 ×7、重設主題、啟動畫面預覽無 focus-visible                                                                              | P2     | 主題卡用 `focus-visible:outline`（避免與選中 ring 撞色）；列表項用 inset ring                             | `apps/ratewise/src/pages/Settings.tsx:199-205`、`:258-264`、`:551`、`:625-680`                         |
| 23  | ConversionHistory 列 `focus:ring-2`（滑鼠點擊也顯示 ring，非 focus-visible 意圖）                                                                 | P2     | `focus:` → `focus-visible:`                                                                               | `apps/ratewise/src/features/ratewise/components/ConversionHistory.tsx:160`                             |
| 24  | MultiConverter 金額（role=button）無 focus 樣式與 transition 時長；CurrencyLandingPage hero CTA 無 focus-visible／active 回饋                     | P2     | 金額補 `focus-visible:ring-2` + `duration-200`；CTA 補 `active:scale-[0.97]` + focus ring                 | `MultiConverter.tsx:277`、`currency/CurrencyAnswerHero.tsx:86`                                         |

## Design Token 變更（SSOT）

1. `src/config/design-tokens/components.ts` — 新增 `buttonTokens.patterns.iconMd`（完整 Tailwind 字面量，JIT 安全）：圖示／關閉按鈕標準樣式，44px 熱區 + focus ring + active:scale-95。消費端：CalculatorKeyboard、BottomSheet。
2. `src/config/animations.ts` — `segmentedSwitch.itemBaseClass` 補 focus-visible inset ring。消費端：Favorites tabs、Settings 三組分段控制。

## 審查通過（無需修改）

- **SegmentedControl**（`components/SegmentedControl.tsx`）：radiogroup + roving tabindex、`sm` 尺寸以負 margin 達 44px、focus-visible 完整 — 模範實作。
- **CalculatorKey**：`calculator-animations.css` 已有 `.calculator-key:focus-visible` 與 44px 格；scale 回饋 100ms 符合按鍵規範。
- **內容頁（FAQ/About/Guide/三篇指南）**：E4 `ContentSections`／`ContentPageLayout` 骨架已達標（44px 連結列、原生 details 手風琴、200ms chevron）。
- **CurrencyLandingPage** 主體（E5）：`CurrencyAnswerHero` 資訊層級、`min-h-11` CTA 已達標（僅補 focus/active，見 #24）。
- **BottomSheet 容器 `outline-none`**：`tabIndex={-1}` 程式化焦點目標，非 Tab 可達，符合規範；焦點困留與 Esc 已實作。
- **SingleConverter 金額輸入（role=button）與幣別 select**：`focus:ring` 屬輸入框慣例（任何 focus 都應顯示），保留。

## 已知殘留（建議 PM 排 backlog，不在本次最小變更內）

1. **MultiConverter 幣別列巢狀互動**：整列 `div onClick` 切換基準幣（無 role/tabIndex），列內含星號鈕與金額鈕。鍵盤使用者目前無法直接切換基準幣（僅能透過金額/星號）。正規修法需重構列結構（左側幣別資訊改為獨立 button），涉及 drag/highlight 佈局，風險超出本次範圍。
2. **主題層級狀態色對比**：預設淺色主題 `--color-destructive`（red-500）作為白底文字時 3.76:1；本次已在 Toast 消費端改用 hover 深階，但其他以 `text-destructive` 直接上淺底的場景建議日後於 theme token 層統一（red-500 → red-600 需同步驗證六主題與 destructive 按鈕白字）。
3. **Footer 行動版 Threads 連結與桌面 GitHub 內文連結**：內文行內連結屬 WCAG 2.5.8 行內例外，未強制 44px。
