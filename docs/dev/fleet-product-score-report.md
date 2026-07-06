# RateWise 全頁面產品級評分審查報告

- 審查日期：2026-07-06
- 審查範圍：`apps/ratewise` 全部 14 類頁面（read-only，僅原始碼審查，未改碼、未執行瀏覽器）
- 審查角色：資深產品經理（/pm skill 流程）
- 評分框架：每頁 5 維度 × 0-10 分（價值主張清晰度／資訊架構與視覺層級／互動效率／信任信號／一致性），滿分 50

> 註：依任務 Acceptance 指定輸出至本檔名；此檔名偏離 `docs/dev/00X_*.md` 編號規範（AGT-DOC-01），屬使用者明確指示的例外。

---

## 一、總覽評分表

| 頁面                      | 價值主張 | 資訊架構 | 互動效率 | 信任信號 | 一致性 |  總分  |
| ------------------------- | :------: | :------: | :------: | :------: | :----: | :----: |
| 首頁 `/`                  |    9     |    8     |    9     |    9     |   7    | **42** |
| 幣別落地頁模板（usd-twd） |    9     |    9     |    8     |    8     |   9    | **43** |
| `/guide`                  |    9     |    9     |    8     |    8     |   9    | **43** |
| `/about`                  |    9     |    8     |    8     |    9     |   9    | **43** |
| `/faq`                    |    9     |    8     |    8     |    8     |   9    | **42** |
| `/open-data`              |    9     |    7     |    8     |    9     |   8    | **41** |
| `/open-source`            |    8     |    8     |    8     |    8     |   9    | **41** |
| `/multi`                  |    7     |    8     |    8     |    8     |   8    | **39** |
| `/settings`               |    8     |    8     |    8     |    7     |   8    | **39** |
| `/sell-rate-vs-mid-rate`  |    9     |    8     |    8     |    7     |   6    | **38** |
| `/cash-vs-spot-rate`      |    9     |    8     |    8     |    7     |   6    | **38** |
| `/card-rate-guide`        |    9     |    8     |    8     |    7     |   6    | **38** |
| 404                       |    8     |    7     |    7     |    7     |   6    | **35** |
| `/favorites`              |    7     |    7     |    6     |    6     |   8    | **34** |

全站平均：**39.7 / 50**。內容層（SEO/AEO 文案、信任信號、SSOT 治理）已達產品級水準；主要失分集中在三處：**權威指南頁的殼層漂移**（缺行動版導覽、缺可見的作者/更新時間）、**收藏頁的資訊密度不足**（列表不顯示匯率），以及**零星的舊 token / 文案-行為 drift**。

---

## 二、逐頁評分理由與 Top 3 改進建議

### 1. 首頁 `/` — 42/50

**理由與證據**

- 價值主張 9：eyebrow「臺灣銀行牌告匯率 · 約每 5 分鐘檢查更新 · 顯示實際買賣價」＋ intro 直接講「不是中間價」（`src/config/seo-metadata/core.ts:935-937`）；換算器即首屏主體，3 秒內可理解。
- 互動效率 9：快速金額按鈕（`src/features/ratewise/components/SingleConverter.tsx:472-499`）、點擊金額開計算機鍵盤（同檔 435-451）、swap 按鈕、deep-link `?from/to/amount`（`src/features/ratewise/RateWise.tsx:109-120`）、下拉重新整理（同檔 70-81）。完成一次換算最短 2 步（選幣 → 輸入）。
- 信任信號 9：資料來源徽章連回台銀官網＋雙時間戳（來源時間 · 刷新時間，`src/features/ratewise/RateWise.tsx:281-292`）、資料過期警示（214-223）、趨勢圖誠實標註「現金賣出基準」（`SingleConverter.tsx:576-583`）。
- 一致性 7：錯誤畫面用舊 token `bg-danger-bg` / `text-neutral-text`（`RateWise.tsx:164-170`），與 `/multi`、`/favorites` 錯誤卡的 `card` / `text-text` / `bg-primary-strong` 體系不一致（對照 `src/pages/MultiConverter.tsx:119-135`）。

**Top 3 改進**

| 級別 | 建議                                                   | 實作方向                                                                                                                                                               |
| ---- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1   | 錯誤狀態 UI 收斂到 E1 token 體系                       | `src/features/ratewise/RateWise.tsx:162-181` 改用與 `MultiConverter.tsx:115-135` 相同的 `card` + `bg-primary-strong` 模式，移除 `bg-danger-bg`/`neutral-text` 舊 token |
| P1   | 幣別選擇器升級：原生 `<select>` 無國旗排版控制、無搜尋 | `SingleConverter.tsx:422-433, 667-678` 改為 BottomSheet 幣別選單（沿用 CalculatorKeyboard 的 sheet 範式），支援收藏置頂與搜尋                                          |
| P2   | 「加入歷史」為隱性功能，新用戶不知道歷史在哪裡         | `SingleConverter.tsx:748-771` 點擊後以 Toast 提示「已存入收藏頁 → 歷史」並附跳轉連結（ToastProvider 已在 `AppLayout.tsx:196` 就緒）                                    |

### 2. `/multi` 多幣別 — 39/50

**理由與證據**

- 價值主張 7：標題區塊已刻意移除（`src/pages/MultiConverter.tsx:6` 註記「由底部導航 Tab 識別頁面」），h1 為 sr-only（140）。直接落地（分享連結、SEO）者 3 秒內只看到一排幣別列，缺一句話定位。
- 資訊架構 8 / 互動效率 8：點列切基準幣、快速金額、每幣別獨立 rateType，任務路徑短（`src/features/ratewise/components/MultiConverter.tsx:129-165`）。
- 信任信號 8：底部顯示資料來源與更新時間（`src/pages/MultiConverter.tsx:171-186`）。

**Top 3 改進**

| 級別 | 建議                                                                              | 實作方向                                                                                                                                |
| ---- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| P1   | 補一行可見的頁面定位文字（非 sr-only），例如「以 TWD 為基準，同時比較 17 種幣別」 | `src/pages/MultiConverter.tsx:140-148`，可做成隨基準幣動態變化的 caption                                                                |
| P2   | 基準幣切換是本頁核心操作，但入口（點列）無可見 affordance                         | `src/features/ratewise/components/MultiConverter.tsx:199` 一帶，基準幣列加「基準」pill 已有，非基準列可加輕量「設為基準」hover/長按提示 |
| P2   | 更新時間區塊與首頁樣式不同（首頁為 inline badge，本頁為獨立 section）             | 抽共用 `DataSourceBadge`，統一 `RateWise.tsx:267-300` 與 `MultiConverter.tsx:171-186` 兩處呈現                                          |

### 3. `/favorites` 收藏與歷史 — 34/50（全站最低）

**理由與證據**

- 互動效率 6：收藏列表每列只有國旗＋幣別名＋「點擊換算」CTA（`src/pages/Favorites.tsx:337-370`），**不顯示任何匯率數字**。使用者收藏幣別的核心動機是「快速看常用幣匯率」，現在必須逐一點回首頁才看得到，資訊密度低於首頁桌面版側欄的 `FavoritesList`（那裡有匯率，`src/features/ratewise/RateWise.tsx:257`）。
- 信任信號 6：本頁完全沒有資料來源與更新時間標示（對照 `/multi:171-186`、首頁 267-300 皆有）。
- 價值主張 7：Tab 切換「收藏／歷史」清楚（182-221），但頁面本身淪為「排序管理頁」而非「常用匯率儀表板」。
- 文案-行為 drift：FAQ 宣稱「拖曳未收藏的貨幣會自動加入收藏」（`src/config/seo-metadata/core.ts:1003-1005`），實際上非收藏幣 `isDragDisabled`（`src/pages/Favorites.tsx:84, 254-255`）——這是信任信號扣分點（詳見 FAQ 頁）。

**Top 3 改進**

| 級別 | 建議                                                                                | 實作方向                                                                                                        |
| ---- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| P0   | 收藏列直接顯示即時匯率（1 X = ? TWD）與迷你漲跌指示，把本頁升級為「常用匯率儀表板」 | `src/pages/Favorites.tsx:337-353` 中間資訊區加匯率欄；`useExchangeRates` 已在本頁載入（54-59），資料零成本      |
| P1   | 補資料來源與更新時間 badge                                                          | 沿用 `/multi` 的 `formatDisplayTime` 模式（`src/pages/MultiConverter.tsx:171-186`），或抽共用 `DataSourceBadge` |
| P2   | 歷史 Tab 深連結：`/favorites?tab=history`                                           | `src/pages/Favorites.tsx:44` 的 `activeTab` 改由 searchParams 初始化，讓「加入歷史」Toast（首頁 P2）可直接導向  |

### 4. `/settings` 設定 — 39/50

**理由與證據**

- 資訊架構 8：七區塊各有 icon＋uppercase 標題（介面風格／語言／匯率模式／單幣別模式／啟動畫面／儲存與快取／資料管理／支援與資訊），掃讀性佳（`src/pages/Settings.tsx:182-662`）。
- 信任信號 7：「儲存與快取」揭示資料來源＝臺灣銀行、更新頻率＝5 分鐘（557-573），版本號在 footer（667）。
- 扣分：「資料管理」區塊（ShieldAlert 圖示，577-600）內只有「重置主題」一個動作——標題暗示的「清除歷史／清除本地資料／匯出」全部缺席，名實不符；匯率模式（auto/sell/mid）是影響全站數字的重大設定，說明文字只有一行 2xs 低對比字（415-421），新手難以理解後果。

**Top 3 改進**

| 級別 | 建議                                                                                   | 實作方向                                                                                                             |
| ---- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| P1   | 「資料管理」補齊：清除換算歷史、清除全部本地資料（收藏＋設定＋歷史）                   | `src/pages/Settings.tsx:576-600`；`clearAllHistory` 已存在於 `useCurrencyConverter`，重置全部可組合各 store 的 reset |
| P1   | 匯率模式改為帶完整說明的選項卡（每項顯示標題＋一句話後果，如「賣出價＝你實際要付的」） | `Settings.tsx:366-422` 由 segmented switch 改為 radio card list，desc 不再只在選中後顯示                             |
| P2   | 版本號可點擊展開更新紀錄（連到 GitHub releases）                                       | `Settings.tsx:664-668` footer 的 `getDisplayVersion()` 包 `<a>`                                                      |

### 5. `/faq` — 42/50

**理由與證據**

- 價值主張 9：頁首 lead 一句話講清收錄範圍；「先掌握三個重點」前置摘要（`src/pages/FAQ.tsx:37-55`）是好的 answer-first 設計。
- 信任信號 8：作者＋最後更新時間可見（102-113）、AnswerCapsule（116）、MailtoLink 防 CF 改寫（16-26）。
- 扣分：FAQ 內容與實際行為 drift——「拖曳未收藏的貨幣會自動加入收藏」（`src/config/seo-metadata/core.ts:1003-1005`）與 `Favorites.tsx:84`「非收藏貨幣不可拖曳，也不會被隱式加入收藏」直接矛盾；FAQ 是信任門面，答錯自家功能傷害大。

**Top 3 改進**

| 級別 | 建議                                                                                          | 實作方向                                                                                                                                     |
| ---- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| P0   | 修正拖曳排序 FAQ 答案，對齊現行「先收藏才能排序」合約                                         | `src/config/seo-metadata/core.ts:1003-1005`；改後跑 `pnpm test` 確認 seo-ssot 測試                                                           |
| P1   | FAQ 條目多（30+），缺分類錨點與頁內搜尋                                                       | `src/pages/FAQ.tsx:56-62` 將 `FAQ_ENTRIES` 依主題分組（匯率判讀／功能操作／資料與隱私），沿用 `/guide` 的快速導航模式（`Guide.tsx:139-153`） |
| P2   | 「匯率多久更新」類答案出現「見下方」自我指涉（`core.ts:978`），單條被 AI 引擎抽取時語意不完整 | 每條 FAQ 答案改為自足式句子（AnswerCapsule 已是正確示範，`core.ts:910-924`）                                                                 |

### 6. `/about` — 43/50

**理由與證據**

- 信任信號 9：定位宣言（賣出價視角）、資料方法與範圍（來源／頻率／範圍／提醒四項，`src/pages/About.tsx:34-52`）、作者實名＋Threads `rel="me"`（76-113）、開源連結＋授權（115-155、202-204），E-E-A-T 完整。
- 扣分點小：能力卡片描述中出現原始 backtick 字串「`` `latest.json` ``」未渲染為 code（66-69），呈現為字面反引號。

**Top 3 改進**

| 級別 | 建議                                                                                | 實作方向                                                                   |
| ---- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| P2   | 修正卡片描述中的字面 backtick                                                       | `src/pages/About.tsx:66-69` 改為 JSX `<code>` 或去掉反引號                 |
| P2   | 「資料方法」加上與 `/open-data` 的互鏈（可驗證性閉環）                              | `About.tsx:34-52` list 加一項「自行驗證：開放資料 API」連 `/open-data/`    |
| P2   | 補「更新頻率 5 分鐘」的例外說明（假日/台銀停更時的行為），與 stale warning 行為對齊 | `About.tsx:42` description 補一句；文案源自 `errors.rateStaleWarning` 邏輯 |

### 7. `/guide` — 43/50

**理由與證據**

- 資訊架構 9：sticky 快速導航＋8 步驟錨點卡（`src/pages/Guide.tsx:138-175`）、進階功能卡、判讀技巧、提示、FAQ、雙 CTA，結構是全站內容頁範本。
- 信任 8：預估完成時間＋作者＋最後更新（127-135）。
- 扣分：頁內 FAQ 三條（86-99）與 `/faq` 重複維護（非同一 SSOT 來源，`FAQ_PAGE_ENTRIES` 之外另寫一份），有 drift 風險。

**Top 3 改進**

| 級別 | 建議                                                          | 實作方向                                                             |
| ---- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| P1   | Guide 頁內 FAQ 改引用 `FAQ_PAGE_ENTRIES` 子集，消除第二份文案 | `src/pages/Guide.tsx:83-100` 改為從 `core.ts` 取對應 question 的條目 |
| P2   | 8 步驟卡缺對應 UI 截圖或示意，純文字對新手吸收慢              | `Guide.tsx:159-175` 每步補示意圖（存 `public/`，注意 precache 大小） |
| P2   | 「開始使用」CTA 可帶情境 deep-link（如 `/?from=JPY&to=TWD`）  | `Guide.tsx:188-209`，deep-link 能力已存在（`RateWise.tsx:109-120`）  |

### 8-10. 權威指南三頁 `/sell-rate-vs-mid-rate`、`/cash-vs-spot-rate`、`/card-rate-guide` — 各 38/50

**理由與證據**（共用 `AuthorityGuidePage` 模板，逐頁內容見 `src/config/seo-metadata/core.ts:1445-1722`）

- 價值主張 9：h1 即結論（「賣出價比中間價更接近你真正要付的台幣」`core.ts:1453`）、AnswerCapsule 前置、重點整理三條，answer-first 執行到位。
- 一致性 6（主要失分）：
  - `AuthorityGuidePage` **未使用 `ContentPageLayout`**，自建容器（`src/components/AuthorityGuidePage.tsx:25-33`）→ 行動版**沒有 BottomNavigation**。E4 已認定「內容頁遺失底部導覽」為 P1-8 缺陷並在 `ContentPageLayout` 修復（`src/components/content/ContentPageLayout.tsx:4-7, 41-42`），這三頁漏網。
  - 版面 token 也漂移：用 `container max-w-5xl` 而非 ContentPageLayout 的 narrow/wide 體系。
- 信任 7：Article JSON-LD 有 `datePublished`（`core.ts:1518-1531`），但**頁面上沒有可見的作者／最後更新時間**——對照 FAQ/About/Guide 的 header meta（如 `FAQ.tsx:105-112`），三頁模板的 header 只有 h1＋intro（`AuthorityGuidePage.tsx:35-38`）。

**Top 3 改進（三頁共用，改模板一處生效）**

| 級別 | 建議                                                                                                          | 實作方向                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| P0   | 遷移到 `ContentPageLayout`，恢復行動版底部導覽與統一版面                                                      | `src/components/AuthorityGuidePage.tsx:25-33` 以 `<ContentPageLayout width="wide">` 取代自建容器       |
| P1   | header 補可見的作者＋最後更新 meta（與 FAQ/Guide 同款）                                                       | `AuthorityGuidePage.tsx:35-38` 加 meta 列；日期用 `SITE_SEO.updatedTime`（同 `FAQ.tsx:29-34` 模式）    |
| P2   | 「重點整理」與內文之間插入一個帶實際數字的對比例（sell-rate 頁已有 `buildRateDifferenceSentence` 能力可複用） | `src/config/seo-metadata/currency-landing.ts:93-119` 的句子生成器注入 `AuthorityGuideContent.sections` |

### 11. `/open-data` — 41/50

**理由與證據**

- 價值主張 9：hero 一句話「免費、免 API Key、免帳號」＋能力徽章（`src/pages/OpenData.tsx:562-581`）。
- 信任信號 9：資料管線流程圖（台銀→Actions→data 分支→CDN→你的應用，586-639）、速率限制誠實揭露（86-102）、四語言程式範例＋複製按鈕（106-185、355-374）。對開發者 persona 是全站最強信任頁。
- 資訊架構 7：1219 行、8 個大 section，**無頁內目錄**；`/guide` 有 sticky 快速導航、本頁沒有，長頁掃讀成本高。

**Top 3 改進**

| 級別 | 建議                                                                                       | 實作方向                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| P1   | 加 sticky 頁內目錄（8 個 section 錨點）                                                    | 沿用 `Guide.tsx:139-153` 快速導航模式；section 已天然分段（`OpenData.tsx:586, 774, 819, 828, 1011, 1066, 1094, 1156`） |
| P2   | hero 徽章「17 種幣別」等硬拼字串改由常數推導已做，但可補「最後同步時間」動態徽章增強即時感 | `OpenData.tsx:566-581`，可用 `SEO_RATE_EXAMPLES_DATE`                                                                  |
| P2   | code example 的 tab 切換元件與全站 segmentedSwitch 動畫規範不一致                          | 對齊 `src/config/animations.ts` 的 `segmentedSwitch` SSOT                                                              |

### 12. `/open-source` — 41/50

**理由與證據**

- 目的單純（授權＋原始碼＋回報入口），SEO 就地定義 noindex 合理（`src/pages/OpenSource.tsx:19-24`）；使用 `ContentPageLayout`，行動版導覽健在。免責聲明誠實（53-57）。

**Top 3 改進**

| 級別 | 建議                                                                                | 實作方向                                      |
| ---- | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| P2   | 補「技術棧一覽」卡（React/Vite/PWA），強化開源頁的可貢獻性                          | `OpenSource.tsx:26-93` SECTIONS 加一段 cards  |
| P2   | GitHub 連結補 star/fork 等社群訊號（build-time 靜態注入即可，避免 runtime API）     | prebuild 時寫入 generated config              |
| P2   | 「延伸閱讀」與 About 頁「透明與開放原始碼」互鏈重複度高，可收斂為 footer-links SSOT | `src/config/footer-links.ts` 已存在，統一取用 |

### 13. 幣別落地頁模板（usd-twd 為代表） — 43/50

**理由與證據**

- 資訊架構 9：六段 IA（Answer Hero → 報價對比 → 金額階梯 → 在地情境 → FAQ → 相關連結）明確且模板化（`src/components/CurrencyLandingPage.tsx:2-3, 234-318`）。
- 價值主張 9：h1「美元對台幣匯率換算器」＋「台銀實際牌告，非中間價」CTA lead（`CurrencyLandingPage.tsx:239-245`）；`buildRateDifferenceSentence` 用實際數字量化中間價差（`currency-landing.ts:93-119`）。
- 信任信號 8：最後更新 badge（`src/components/currency/CurrencyAnswerHero.tsx:49-55`）＋資料來源 footer（`CurrencyLandingPage.tsx:315-318`）。扣分：頁面匯率是 build-time 快照（`SEO_RATE_EXAMPLES`，每日更新），日期徽章顯示的是快照日而非「即時」，與首頁「5 分鐘更新」的心智模型有落差，未明示「此為當日參考價，點擊進入換算器看即時價」。

**Top 3 改進**

| 級別 | 建議                                                                                           | 實作方向                                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| P1   | 快照價與即時價的差異揭露：更新 badge 旁加一句「頁面為每日參考價，換算器內為 5 分鐘更新即時價」 | `CurrencyAnswerHero.tsx:49-55` 或 `CurrencyLandingPage.tsx:242` 的 `updatedDate` 區塊                                       |
| P1   | hydration 後以 live rate 覆寫快照數字（SSG 保底、client 增強），縮小與競品「即時落地頁」差距   | `CurrencyLandingPage.tsx:100-121` 的 `cashSell` 在 client 端可接 `useExchangeRates`（注意 hydration 安全：首繪維持 SSG 值） |
| P2   | Answer Hero 的 CTA 與頁尾 CTA 中間段落長，行動版可加 sticky 底部「立即換算」bar                | 模板層新增，與 BottomNavigation 疊放需處理 safe-area                                                                        |

### 14. 404 — 35/50

**理由與證據**

- 訊息清楚、noindex 正確、主 CTA 回首頁＋建議頁（`src/pages/NotFound.tsx:23-68`）、回報問題連結（72-82）。
- 一致性 6：獨立 `min-h-screen bg-page-gradient` 殼、無 BottomNavigation、無 PageNavHeader，是全站第三種版面體系；建議頁只有 FAQ/About，未導向最有價值的幣別頁或換算器功能。

**Top 3 改進**

| 級別 | 建議                                                                            | 實作方向                                                                    |
| ---- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| P1   | 補行動版 BottomNavigation（沿用 ContentPageLayout 或直接掛 `BottomNavigation`） | `src/pages/NotFound.tsx:23` 外殼調整                                        |
| P2   | 建議連結補「熱門幣別換算」（JPY/USD/KRW 落地頁），把 404 流量導回核心價值       | `NotFound.tsx:52-68`，資料源可用 `HomepageSEOSection.tsx:7` 的 `HOT_TO_TWD` |
| P2   | 針對疑似打錯的幣別路徑（如 `/usd-tw`）做建議跳轉提示                            | 在 NotFound 內比對 `CURRENCY_LANDING_ROUTE_REGISTRY` 做模糊建議             |

---

## 三、全站層級產品缺口清單（要成為產品級匯率工具還缺什麼）

依「台灣最精準匯率工具、對標 Toss/Wowpass 級 native 產品感」定位排序：

### P0 — 核心價值閉環缺口

1. **收藏頁不是匯率儀表板**：收藏幣別看不到匯率（見上文 /favorites P0）。這是「常用幣快速判讀」場景的直接斷點，也是與 Toss 首屏體驗差距最大的一項。
2. **文案-行為 drift 治理缺自動防護**：FAQ 描述與拖曳合約矛盾（`core.ts:1003-1005` vs `Favorites.tsx:84`）說明「功能行為變更 → 同步 FAQ」目前靠人工。建議：功能合約類 FAQ 條目加對應單元測試斷言（seo-ssot 測試已有 template-bleed 前例可仿）。

### P1 — 產品級功能缺口

3. **匯率到價提醒（rate alert）**：目前只有被動查價，無「JPY 低於 0.21 通知我」。PWA 已具備 SW 基礎，可先做本地通知（Notification API + periodic background sync），再演進伺服器推播。這是匯率工具留存的頭號功能。
4. **「現在換划算嗎」判讀信號**：mini 趨�勢圖只有 7~30 天線圖（`SingleConverter.tsx:578-584`），缺「今日價位於近 90 天第 X 百分位」一句話結論。資料已在 `history/{date}.json` 齊備，屬純前端計算。
5. **跨行比價**：資料層已有 provider 架構（bank + exchange-shop，`src/config/rateProviders.ts`、OpenData 的 PROVIDER_CONTRACT_ROWS），但銀行只有台銀一家。至少納入 3~5 家主要銀行（或先做「台銀 vs 換錢所」全幣別化——目前 MoneyBox 僅 KRW），否則「最精準」主張只覆蓋單一來源。
6. **總成本估算器**：card-rate-guide 內容講清了「刷卡 = 清算匯率＋手續費＋DCC」，但工具本身算不出來。在換算器加「情境」選項（臨櫃現鈔／網銀即期／海外刷卡 +1.5%），把內容頁的知識產品化，內容→工具閉環。
7. **換算結果分享**：deep-link 能力已存在（`RateWise.tsx:109-120`）且 OpenData 有文件（`OpenData.tsx:170-183`），但換算器 UI 沒有「分享此結果」按鈕（Web Share API），社交回流入口缺失。

### P2 — 體驗與擴張缺口

8. **歷史匯率專頁**：mini chart 之外無可互動的完整走勢頁（區間選擇、現金/即期切換、高低點標記）。SEO 上「美元 歷史匯率」是高意圖詞，資料管線已就緒。
9. **內容頁多語化**：UI 有 4 語（`src/i18n`），但 SEO 內容頁（FAQ/Guide/幣別頁）僅繁中。日/韓旅客換 TWD 是天然受眾（`nav` 已 i18n，內容未跟上）。
10. **設定的資料可攜性**：收藏／歷史／設定全在 localStorage，無匯出/匯入。換機即歸零，與「日常工具」定位衝突；可先做 JSON 匯出/匯入，再考慮帳號同步。
11. **殼層一致性收斂**：目前存在四種頁面殼（AppLayout／ContentPageLayout／AuthorityGuidePage 自建／NotFound 自建）。建議收斂為兩種（App 殼＋內容殼），AuthorityGuidePage 與 NotFound 併入 ContentPageLayout 體系（見逐頁 P0/P1）。
12. **`/settings` 的 `/seo-tech` 連結曝光層級**：SEO 技術揭露屬開發者向頁面，放在使用者「支援與資訊」清單（`Settings.tsx:647-653`）稀釋支援選單；可移到 `/open-source` 延伸閱讀（該處已有）。

---

## 四、審查方法與限制

- 證據全部來自原始碼靜態審查（檔案:行號如文中標註）；未啟動 dev server、未做瀏覽器實測，動畫手感、CLS、真機觸控回饋不在本次評分範圍。
- 幣別落地頁以 USD（`src/pages/USDToTWD.tsx` → `CurrencyLandingPage`）為代表；34 個幣對頁共用同一模板與 L1 persona 文案（`currency-personas.ts`），模板級發現對全部幣對頁生效。
- `/privacy`、`/seo-tech` 不在指定範圍，僅作互鏈證據引用。
