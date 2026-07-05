# E3 設計簡報：單幣別換算 v2「等值雙列」模式（PM 親撰 v1.0）

> 依據：UIUX 審計（`.claude/product-intel/uiux-audit.md` 設計輸入 1）＋考古報告（`salvage-and-map.md` §3）＋使用者需求原文。
> 執行者可深化細節，**不得背離本簡報的資訊架構決策與硬規格**。

## 問題（第一性）

現行單幣別的三個認知斷點：方向靠「上下位置」編碼（用戶要想哪邊是我付的）、匯率卡切斷輸入→結果的因果鏈、結果欄看似可編輯卻非對稱。目標：**用戶直觀選擇貨幣與金額，完全不需要理解 from/to**。

## 資訊架構（已裁決：方案 A「等值雙列」）

1. **兩個完全對等的貨幣列**，上下緊貼（非左右並排）：每列＝幣別選擇器（旗＋代碼，tap 開 bottom sheet picker）＋金額欄（皆可編輯）。
2. 編輯任一列 → 另一列即時重算；**無 from/to 概念**，方向由「最後編輯的列」隱式決定；金額字級大（活躍列 ≥32px、非活躍列 28px，tabular-nums）。
3. 兩列間 divider 內嵌 **32px 圓形 swap 鈕**（交換兩列幣別，非交換方向語意）。
4. 匯率資訊改為列間/列下的**一行 rate chip**（例「1 USD = 31.25 TWD ・現金賣出」，tap 可切現金/即期），因果鏈不再被大卡片切斷。

## 常駐計算機（硬規格）

- 位置：頁面外層底部常駐（取代現行佔 62% 視口的 modal）。
- 尺寸：4×4 grid、鍵高 52–56px、總高 260–300px（390×844 下 ≈31–36% 視口）。
- 風格：Toss 式扁平——無漸層、無重陰影、press 態 scale(0.97)+opacity；沿用既有計算引擎，只重排呈現層。
- 輸入目標＝當前活躍列；切換活躍列時計算機黏著跟隨（視覺 focus ring 指示）。

## 趨勢圖（硬規格）

- 常態：**72px 高 sparkline ＋ 漲跌 chip**（%與方向色），嵌在 rate chip 下方。
- tap 展開：**65vh bottom sheet**——7D/30D/90D 切換、min/max 標記、長按 crosshair、基準標註（對齊 H2 的「現金賣出走勢」誠實標註；即期歷史缺就不假造）。
- 平常小、展開大；關閉手勢：下滑或背景 tap。

## 佈局預算（390×844 必須無捲動）

頁首 48 ＋ 雙列區 ~200 ＋ rate chip+sparkline ~120 ＋ 計算機 ~280 ＋ 底部導覽 56 ＋ safe-area。任何溢出先砍留白再砍裝飾，不砍功能。

## 開關與相容（wave-A 邊界）

- 走 flag `converter-v2`：URL override ＋ localStorage ＋ CustomEvent（範式＝舊分支 `hero-layout-variant.ts`，見考古報告）。預設 off。
- **wave-A 禁動 `Settings.tsx`**（E2 正在動）；設定頁切換入口留 wave-B。
- flag off 時 SSG 首頁輸出與現行完全一致（hydration 安全紅線）；模式持久化未來併入 `converterStore`（`lastConverterView` 同域）。

## 品質閘門

- 觸控 ≥44px、文字對比 AA、focus 可見；console error 0。
- Unit：換算對等性（編輯任一列結果一致）、swap、flag gate；E2E：flag-on 核心旅程（選幣→輸入→展開趨勢→計算機）chromium。
- 截圖：390×844、375×667、430×932 三尺寸 × zen/nitro 兩主題。
