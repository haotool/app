# ADR-R5-02：全站禁縮放與 App 級觸控體感

- 狀態：Accepted
- 日期：2026-07-19
- 範圍：`index.html` viewport／status-bar meta、`src/index.css` 全域觸控與選取策略

## 背景

PaperTrade 以 standalone PWA 為主要使用型態，對標 Bybit App 的 native 體感。
瀏覽器預設的 double-tap zoom、輸入框聚焦自動放大、tap 高亮、長按選取與 overscroll 鏈，
在交易高頻操作（點擊訂單簿帶價、滑桿拖曳、快速切 tab）下會造成非預期縮放與視覺噪音。

## 決策

1. viewport 加 `maximum-scale=1.0, user-scalable=no`（保留既有 `viewport-fit=cover` 與 `interactive-widget=resizes-visual`）。
2. 加 `apple-mobile-web-app-status-bar-style: black-translucent` meta，狀態列沉浸融入深色 app shell。
3. CSS（`@layer base`）：
   - `html { -webkit-text-size-adjust: 100% }`：鎖橫向旋轉時的字級自動放大。
   - `html, body { overscroll-behavior: none }`：全向禁 overscroll 鏈與 Android pull-to-refresh（原 body 級 `overscroll-behavior-y` 收斂為單一完整定義）。
   - `body { touch-action: manipulation }`：去 double-tap zoom 與 300ms 點擊延遲；body 級單點宣告即覆蓋全子樹（touch-action 限制沿祖先鏈聯集生效）。全站圖表（CandleChart／DepthChart／Sparkline）均無自訂 pointer／pinch 手勢，經盤點無排除需求。
   - `body { -webkit-tap-highlight-color: transparent }`：去 iOS tap 灰色高亮。
   - `body { user-select: none }`＋`input, textarea { user-select: text }`：禁長按選取的 app 體感，輸入處恢復可選取複製。

## 查證結論（2026-07-19）

- `touch-action: manipulation` ＝ `pan-x pan-y pinch-zoom` 別名：啟用平移與 pinch zoom、僅停用 double-tap zoom 等非標準手勢，並免除 click 延遲——不會擋捲動（MDN touch-action：<https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action>）。
- iOS Safari 10+ 於「瀏覽器分頁」刻意忽略 `user-scalable=no`（無障礙政策），但「standalone PWA（主畫面安裝）」尊重該指令（Discourse 實證：PWA 環境 `user-scalable=no` 生效導致 pinch 失效需另行處理，<https://github.com/discourse/discourse/pull/30908>；Safari iOS 10 release note 佐證瀏覽器端忽略）。
- Chrome for Android、Chrome for iOS、Samsung Internet 均尊重 `user-scalable=no`（<https://frontendchecklist.io/rules/css/viewport-zoom> 相容表）。
- iOS Safari 瀏覽器分頁雖忽略使用者主動縮放限制，`maximum-scale=1` 仍會抑制「輸入框聚焦自動放大」；本案輸入框字級 15px（<16px 門檻），此宣告為必要（<https://lukeplant.me.uk/blog/posts/you-can-stop-using-user-scalable-no-and-maximum-scale-1-in-viewport-meta-tags-now/>）。

覆蓋矩陣結論：standalone PWA（iOS＋Android）與 Android 瀏覽器由 viewport meta 禁縮放；iOS Safari 瀏覽器分頁保留 pinch（Apple 政策不可覆寫），由 `touch-action: manipulation` 補去 double-tap zoom，體感一致。

## WCAG 1.4.4 取捨

禁縮放違反 WCAG 2.1 SC 1.4.4（Resize text, AA）的字面要求。本案接受此取捨，理由與緩解：

- 產品定位為 app 級交易工具，縮放會破壞等高契約版面與高密度資料列的操作精度。
- 緩解一：全站最小字級 11px（caption token），關鍵數字 15–28px，皆高於行動可讀下限。
- 緩解二：全站色彩對比達 WCAG AA（text-3 已為 AA 提亮至 #707C8C）。
- 緩解三：OS 級輔助功能（iOS／Android 系統縮放、動態字級、螢幕放大鏡）不受 viewport meta 影響，低視力使用者仍有系統級放大路徑。
- 緩解四：iOS Safari 瀏覽器分頁 Apple 強制保留 pinch-to-zoom，該情境無障礙不受影響。
