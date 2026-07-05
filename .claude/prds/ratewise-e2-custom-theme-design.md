# E2 設計簡報：自訂主題色（PM 親撰 v1.0）

> 依據：考古報告（`salvage-and-map.md` §2 架構地圖）＋已合併的 token 全鍵合約（#538）與雙源同步守門（#543）＋設定頁既有「自訂主題色」預告卡。
> 執行者可深化細節，**不得背離架構決策與守門相容策略**。

## 目標

設定頁預告卡轉為真功能：使用者選一個主色 → 全 app 主題即時套用並持久化。韓系 fintech 品質：選色即所得、零 FOUC、對比自動守 AA。

## 架構（已裁決）

1. **`custom` 不進 `STYLE_DEFINITIONS`**（避免破壞 `theme-style-definitions-css-sync.test.ts` 的 7×16 合約）。
2. `index.css` 新增 `[data-style='custom']` 靜態 fallback 區塊＝**zen 的完整複製**（滿足 `theme-css-var-parity.test.ts` 全鍵合約，parity 測試自動涵蓋）。
3. Runtime 覆寫層：`applyTheme` 擴充——`style === 'custom'` 時，由存儲的 `customPrimary`（hex）以**單一演算函式**導出整組 primary 系列變數（primary/strong/9 鍵 legacy 系列/ring/hover/active/bg tint/chart 三色），`setProperty` 寫到 `documentElement`；切回內建主題時清除全部 inline 覆寫。
4. 持久化：沿用 `ratewise-theme` localStorage JSON，擴充 `{ style: 'custom', customPrimary: '#RRGGBB' }`；`useAppTheme` 讀寫。
5. `index.html` bootstrap：allowlist 加 `custom`；pre-paint 只做最小覆寫（data-style ＋ `--color-primary` 等 2-3 個 critical 變數＋theme-color meta），完整導出交給 hydration 後的 applyTheme——**演算函式必須單一來源**（bootstrap 內嵌版與 runtime 版若無法共用，用建置期生成或守門測試鎖定兩者一致，禁止手工雙份漂移）。

## 色彩演算（硬規格）

- 底座＝zen 白底韓系骨架（background/surface/text 不變），只演算「主色相關」變數。
- 導出規則：OKLCH（或等效 HSL 精度）色階——strong＝主色加深至白字 ≥4.5:1；text-on-primary 用 offline 生成器既有的亮度擇色法（白/深自動二選一）；hover/active/bg/ring 依 zen 區塊既有階差比例導出。
- **AA 守門**：演算函式內建 clamp——使用者選極淺/極豔色時自動調整 strong 與文字配色使對比達標；單元測試用 property-based 隨機色驗證「任意輸入色 → 全部文字配對 ≥4.5:1」。

## 選色 UX（韓系）

- 設定頁預告卡原位改為功能卡：**8–12 個精選色票**（韓系 fintech 調性：Toss 藍系/薄荷/珊瑚/紫羅蘭…由執行者配，需彼此區辨且全部過 AA 演算）＋「自訂」入口（hex 輸入＋簡潔 hue/lightness 滑桿，不引入新依賴，原生實作）。
- 點色票**即時全 app 套用**（live preview 即正式套用，無「確認」步驟）；當前選中態明確；「恢復預設」回 zen。
- i18n ×4 語系；預告卡舊文案移除。

## 邊界（out of scope）

- `offline.html` 對 custom 的專屬配色（bootstrap 未知 style fallback zen，可接受；PR body 註明限制）。
- 內建 7 主題的存廢（E1 決策）。
- manifest theme_color 靜態值（runtime meta 更新即可）。

## 品質閘門

- 全部既有主題守門測試綠燈（parity／sync／consistency）；新增：演算 AA property 測試、custom 持久化與清除覆寫測試、bootstrap allowlist 測試。
- E2E：設定頁選色→全 app 變色→重載仍生效→切回內建主題無殘留（chromium）。
- 截圖：選色卡 UI ＋ 三個代表色套用後的首頁/多幣別（390×844）。
- console error 0；SSG hydration 安全（預設主題路徑輸出不變）。
