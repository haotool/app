# haotool.org 官網重建 PRD — 完整 UI/UX 規劃設計規格

## 文件控制（Document Control）

| 欄位        | 內容                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| 文件名稱    | `2026-07-04-haotool-site-rebuild-prd.md`                                  |
| 文件性質    | 產品需求文件（PRD）+ UI/UX 設計規格                                       |
| 文件狀態    | v2（2026-07-05 依 Fable critic 八鏡頭審查收斂；實作基準）                 |
| 建立日期    | 2026-07-04                                                                |
| 上游文件    | `docs/dev/046_haotool_site_content_inventory.md`（舊站內容/功能盤點）     |
| 品牌色 SSOT | `apps/ratewise/src/index.css` Zen 主題（`--color-primary` #3182F6）       |
| 品牌字 SSOT | `apps/ratewise/src/config/app-info.ts`（wordmark prefix/accent 拆分模式） |
| 適用分支    | `feat/haotool-site-v2`（舊站已移除，本 PRD 為重建依據）                   |

**v2 修訂原則（2026-07-05）**：設計語彙以設計 brief（`2026-07-05-haotool-site-design-brief.md`）為 SSOT；本 PRD 保留需求、驗收與整合規格。凡涉及視覺值（字級、圓角、陰影、間距、動效 token、hero 版式、徽章），一律以 brief §1–§4 為準；本文件已逐條回寫消除衝突，若再發現未同步條目視為 drift 缺陷。

---

## 1. 產品概述

### 1.1 背景

舊 haotool 官網（3D 作品集風格、深色主題、Three.js hero）已於 2026-07-04 完整移除（見 046）。重建目標是把定位從「開發者個人作品集」升級為「**HaoTool 工具品牌入口**」：一個讓使用者 10 秒內找到需要的工具、並建立品牌信任的極簡官網。

### 1.2 產品定位

> **HaoTool 好工具 — 免費、開源、不收集個資的台灣網頁工具集。**

- 首要角色：**工具導流入口（Tool Hub）**——訪客來找工具，不是來看作品集。
- 次要角色：品牌信任載體（開源、隱私、品質承諾）與作者聯繫管道。
- 視覺對標：韓系 fintech（Toss）的乾淨、明亮、值得信賴；與 HaoRate 品牌藍一脈相承。

### 1.3 目標（Goals）

| ID  | 目標                                      | 衡量指標                                                                                                                                                             |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | 訪客快速理解品牌並進入工具                | 首屏即見工具入口；量測以 GSC（曝光/點擊/查詢）＋ Cloudflare zone analytics（edge 側請求數）為 proxy——**決策：v1 不加任何 client 端遙測**，保全「0 廣告追蹤」品牌承諾 |
| G2  | 效能與 SEO 全面優於舊站                   | Lighthouse 四項 ≥95；LCP ≤2.0s（行動 4G）                                                                                                                            |
| G3  | 品牌一致性：與 HaoRate 共用同一套色彩語言 | 主色、字體、wordmark 規則 100% 對齊 RateWise Zen SSOT                                                                                                                |
| G4  | AI 搜尋（AEO）可完整引用                  | llms.txt / index.md / JSON-LD 全數恢復並更新至 5 工具                                                                                                                |
| G5  | 行動優先體驗                              | 375–430px 各尺寸截圖 QA 零跑版、觸控目標 ≥44px                                                                                                                       |

### 1.4 非目標（Non-Goals / Won't Have v1）

- ❌ Three.js / WebGL 3D 場景（舊站為此付出 LCP、bundle、Lighthouse bot 偵測 hack 等代價；v1 以輕量 CSS/SVG 動態取代）
- ❌ 多語系（v1 僅 zh-TW；英文版列 v2 backlog）
- ❌ 深色模式（v1 light-only，對齊品牌藍在淺底的信任感；`prefers-color-scheme` 支援列 Could）
- ❌ 部落格 / CMS / 後端服務
- ❌ 使用者帳號、追蹤分析 SDK（維持「不收集個資」隱私承諾）

---

## 2. 使用者與核心情境

### 2.1 Personas

| Persona                   | 描述                                             | 核心需求（JTBD）                         |
| ------------------------- | ------------------------------------------------ | ---------------------------------------- |
| P1 行動工具使用者（主力） | 手機上需要換匯 / 分帳 / 停車記錄的一般台灣使用者 | 「我要快速找到並打開那個工具」           |
| P2 搜尋/AI 導流訪客       | 從 Google 或 ChatGPT/Perplexity 引用連結進站     | 「這網站是什麼？可信嗎？工具在哪？」     |
| P3 潛在合作者/雇主        | 想了解作者能力、洽談委託                         | 「這個人做過什麼？怎麼聯繫？」           |
| P4 爬蟲 / AI Agent        | Googlebot、GPTBot、agent 型讀取器                | 「給我結構化、可解析、無 JS 依賴的內容」 |

### 2.2 User Stories（節錄）

- 作為 P1，我想在首頁第一屏就看到所有工具卡片，讓我一鍵進入 HaoRate，而不需要捲動或理解「作品集」概念。
- 作為 P2，我想在 3 秒內確認這是免費、開源、無廣告的網站，讓我放心點進工具。
- 作為 P3，我想在 About 看到技術能力與 FAQ、在 Contact 一鍵複製 Email。
- 作為 P4，我想取得 llms.txt、index.md、JSON-LD 與 noscript fallback，讓我不執行 JS 也能完整引用。

---

## 3. 資訊架構與路由

### 3.1 站點地圖（4 + 1 路由，統一尾斜線）

```
/            首頁（品牌 + 信任 + 工具入口 + 工藝證明 + 作者 + 聯繫 Banner）
/tools/      工具總覽（分類篩選）※ 自 /projects/ 更名
/about/      關於品牌與作者（含 #faq 與 #privacy 錨點）
/contact/    聯繫方式（含委託範圍與流程）
/404.html    未知路徑（預渲染，品牌化 404 + 工具導流）
```

**路由更名決策**：`/projects/` → `/tools/`。理由：品牌定位從作品集轉向工具站，語意與 SEO 關鍵字（「工具」）一致。

- MUST：nginx 對 `/projects/` 301 → `/tools/`（保留舊連結權重），並設定 `error_page 404 /404.html` 使未知路徑回真 404 狀態碼。
- MUST：同步 Cloudflare Worker `HAOTOOL_ROOT_HTML_PATHS` 為 `['/', '/tools/', '/about/', '/contact/']`（046 §7 整合點）。
- MUST（Worker 邊緣內容同步，防 AEO 自我矛盾）：`AGENT_SKILL_ARTIFACTS` 的 `haotool-discovery` skill 更新為 5 工具＋「工具站」敘事（現況缺 split-meow 且仍稱 Portfolio）；`LLM_DOC_PATHS` 補根站 `/llms.txt`；上線驗收逐項 curl 比對。

### 3.2 全站導覽

- Header（固定頂部、實色白底；捲動後顯示底部 1px border，無毛玻璃/backdrop-filter）：wordmark（回首頁）＋「工具」「關於」「聯繫」＋ GitHub 圖示連結。行動版：漢堡選單（全屏 overlay，選單項 ≥44px）。
- Footer（每頁一致）：wordmark + 一句品牌敘述、工具連結清單（5 個）、頁面連結、社群（GitHub/Threads/Email）、版權列（`© 2025-{年} HaoTool · GPL-3.0`）、隱私政策連結（→ `/about/#privacy`）。

---

## 4. 品牌與設計系統（設計值 SSOT＝設計 brief §1–§4，本章僅保留原則與色彩基準）

### 4.1 設計哲學

**「Toss 式信任極簡」**：明亮底色、大量留白、單一品牌藍焦點、卡片化資訊、微妙動效。內容即介面——每個區塊只做一件事。反模式（禁止）：深色科技風、glassmorphism/backdrop-filter、任何漸層、裝飾陰影、emoji 當圖示、文字牆（扁平鐵律全文見 brief §1.1）。

### 4.2 色彩 Tokens（100% 引用 RateWise Zen 主題）

實作 MUST 以 CSS custom properties 定義並與下表一致（來源：`apps/ratewise/src/index.css` `[data-style='zen']`）：

| Token                    | 值（Hex） | RGB         | 用途                                                      |
| ------------------------ | --------- | ----------- | --------------------------------------------------------- |
| `--color-primary`        | `#3182F6` | 49 130 246  | 品牌藍：主 CTA、wordmark accent、連結、焦點               |
| `--color-primary-strong` | `#1B64DA` | 27 100 218  | 淺底上的品牌色文字（WCAG AA 對比 ≥4.5:1）                 |
| `--color-primary-dark`   | `#1E40AF` | 30 64 175   | 白字實底互動面 hover（Zen `--color-primary-dark` 既有值） |
| `--color-primary-bg`     | `#EFF6FF` | 239 246 255 | 品牌藍淡底（badge、icon 底、hover 面）                    |
| `--color-secondary`      | `#6366F1` | 99 102 241  | 輔色（僅限次要裝飾，禁止與主色並列為 CTA）                |
| `--color-background`     | `#F8FAFC` | 248 250 252 | 頁面底色（slate-50）                                      |
| `--color-surface`        | `#FFFFFF` | 255 255 255 | 卡片 / Header 表面                                        |
| `--color-surface-sunken` | `#F1F5F9` | 241 245 249 | 下沉區（FAQ 展開、程式碼底）                              |
| `--color-text`           | `#0F172A` | 15 23 42    | 主文字（slate-900）                                       |
| `--color-text-muted`     | `#64748B` | 100 116 139 | 次要文字（slate-500，僅限輔助說明）                       |
| `--color-border`         | `#E2E8F0` | 226 232 240 | 邊框（slate-200）                                         |
| `--color-success`        | `#22C55E` | 34 197 94   | Live 狀態徽章、複製成功                                   |
| `--color-warning`        | `#F59E0B` | 245 158 11  | Beta 狀態徽章（預留）                                     |
| `--color-danger`         | `#EF4444` | 239 68 68   | 錯誤狀態（404、表單錯誤預留）                             |

色彩使用規則（MUST）：

1. 品牌藍系為唯一 CTA 色；一個視口內最多一個 primary 實底按鈕。白字實底互動面一律 `#1B64DA`（AA 5.4:1，QA 實測 `#3182F6`+白字僅 3.71:1 不達標）、hover `#1E40AF`（Zen primary-dark 既有值）。
2. 淺底上的品牌色**文字**一律用 `#1B64DA`（`#3182F6` 於白底對比僅 3.54:1，不達 AA）；hero 標題關鍵詞強調亦同（brief §1.3）。
3. 正文禁止使用 `text-muted` 以下的灰階；muted 僅限標籤、註解。
4. **（v2 作廢原漸層條款）** 全站禁止任何漸層；hero CTA 為實色 `#3182F6`、hover `#1B64DA`（brief §1.1/§1.2）。
5. `--color-secondary`（#6366F1）僅為對齊 RateWise SSOT 保留 token；**v1 任何元件不得使用**。

### 4.3 品牌字（Wordmark）

沿用 HaoRate wordmark 拆分模式（`app-info.ts` SSOT 同構）：

- 站名 wordmark：**`Hao`（墨色 #0F172A）+ `Tool`（品牌藍 #3182F6）**，無空格；副標「好工具」。
- 衍生規則集中於新站 `src/config/app-info.ts`（`BRAND_WORDMARK_PREFIX = 'Hao'`、`BRAND_WORDMARK_ACCENT = 'Tool'`），未來改名只改常數。
- Logo/favicon/OG 圖以此 wordmark 重製（矢量、淺底深字）。

### 4.4 字體系統

| 用途          | 字體                                                                     | 規則                                                                                                 |
| ------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 全站          | **系統字型堆疊優先**（PingFang TC / Microsoft JhengHei / Noto Sans CJK） | v2.1 依技術研究定案：不載全站中文 webfont（150–300KB）；LCP 零成本、零第三方網域，對齊 RateWise 實作 |
| Wordmark/數字 | 自託管小 subset（Inter 拉丁＋數字，≤10KB woff2）                         | `font-display: swap`＋size-adjust fallback；`font-variant-numeric: tabular-nums`                     |

若未來需要全站 Noto Sans TC，走 `@fontsource-variable/noto-sans-tc` 自託管切片＋ADR，不用 Google Fonts CDN。

**字級階（v2）：以 brief §1.3 為 SSOT**（Display mobile clamp(36–44)/desktop 64、weight 800；Section 26/40 wt800；正文 16/1.7；caption 13/500）。本節僅保留硬性下限：正文最小 16px、行長 ≤72 字元、標題 `text-wrap: balance`。

### 4.5 空間、圓角、陰影、層級（v2：值以 brief §1.1/§1.4 為 SSOT）

- 間距 4px 基數；區塊垂直節奏 mobile 72px / desktop 128px；容器 `max-w-[1120px]`、側距 20/24。
- 圓角：卡 20px、按鈕 16px、chip 999px。
- 陰影：**禁止裝飾陰影**；卡片以 `1px solid var(--color-border)` 表達邊界；安靜陰影 `0 1px 2px rgb(15 23 42 / 0.04)` 僅限浮動元素（header/toast/sticky CTA）。
- z-index：10（sticky 區內元素）/ 20（header）/ 30（overlay 選單）/ 50（toast）。

### 4.6 圖示與圖片

- 圖示：Lucide（延續舊站與 RateWise），統一 24×24 viewBox、`stroke-width: 2`；禁止 emoji 當圖示。
- 工具卡圖（v2）：**真實 app 截圖**（brief §4 A4：390×844 @2x、CSS device frame），非插圖；`loading="lazy"`＋固定寬高比防 CLS；截圖為 **repo 內 commit 的快照資產**（快照制），由 `scripts/` 內 Playwright 腳本手動 refresh——不在 build 時抓 live 站，保全建置可重現性（NFR-008）。
- 各工具品牌 icon 沿用其 PWA icon（192px），以 `--color-primary-bg` 圓角底承載。

### 4.7 動效（Motion）（v2：token 值以 brief §2 為 SSOT）

- 屬性僅 `transform`/`opacity`；首屏內容不得延遲顯示；`prefers-reduced-motion` 全站尊重（僅保留 opacity）。
- 技術：CSS transition/animation 優先；JS 動效統一使用 **`motion` 套件**（motion.dev，framer-motion 後繼，import 自 `motion/react`；版本依技術研究定案）——全案文件與資安依賴 gate 一律以 `motion` 為準，禁止 `framer-motion`/`motion` 混稱。
- Hover：卡片＝border 轉品牌藍＋箭頭右移 4px（無陰影、無縮放位移）。

---

## 5. 頁面規格（Page Specs）

### 5.1 首頁 `/`

目的：10 秒內完成「理解品牌 → 進入工具」。**區塊順序與版式以 brief §3.1 的 8 區為 SSOT**（Header → Hero → 信任列 → 工具展示 → 工藝證明 → 作者 → 聯繫 Banner → Footer；FAQ 不在首頁，集中 About）。本節僅保留需求層規格：

- Hero：文案與 CTA 依 brief §3.1（「把好想法，做成好工具。」／「看看我做的工具」＋「和我聊專案」）；右側工具卡疊層舞台受 §10.2 hero 資產預算約束（行動版首屏預設純文字、舞台圖不得成為 LCP）。
- 信任列：4 統計依 brief（`5` 個上線產品、`100%` 開源免費、`0` 廣告與追蹤、`90+` Lighthouse 分數——「90+」為對全部子 app 的誠實宣稱；本站自身以 ≥95 驗收）。
- 工藝證明：每項證據 MUST 附可點擊錨點（GitHub repo、CHANGELOG/版本、Lighthouse 報告或 CI badge），把「可驗證」做成證據鏈而非口號（hire-me 轉換核心）。
- 聯繫 Banner：`#1B64DA` 實色全幅；「先看 FAQ」連結目的地為 `/about/#faq`。
- 狀態規格：無 JS（noscript）時輸出純 HTML fallback（品牌介紹 + 5 工具連結 + 導覽 + **GitHub/Threads 文字連結**——不含 email 純文字，CF Email Obfuscation 會改寫；FAQ 節錄不保留於 noscript）。

### 5.2 工具總覽 `/tools/`

- 頁首：H1「所有工具」＋一句定位文。
- 分類篩選：pill tabs（全部/工具類/創意類/教育類），水平捲動不換行（mobile）、`aria-pressed` 標記、切換 150ms 淡入淡出；分類資料沿用 046 `ProjectCategory`，剔除無工具的分類。
- 卡片格：同首頁 ToolCard，顯示全部 5 工具；切換分類無結果時不可能發生（分類由資料推導），故無空狀態。
- 工具資料 SSOT（新站 `src/config/tools.ts`，內容基準 046 §3.1 並更新）：

| id           | 名稱                     | 分類   | 一句話定位（卡片描述基準）                                              | 連結             |
| ------------ | ------------------------ | ------ | ----------------------------------------------------------------------- | ---------------- |
| ratewise     | HaoRate 匯率好工具       | 工具類 | 台銀**銀行賣出價**即時換算，30 天趨勢圖，離線可用——台灣最精準的匯率工具 | `/ratewise/`     |
| split-meow   | 喵喵分帳 Split Meow      | 工具類 | 貓咪主題旅遊分帳，費用分類、一鍵分享結算結果，完全離線                  | `/split-meow/`   |
| park-keeper  | 停車好工具 ParkKeeper    | 工具類 | GPS 記錄車位、羅盤導航回車，多語系、離線優先                            | `/park-keeper/`  |
| nihonname    | 日本名字產生器 NihonName | 創意類 | 中文姓氏產生道地日文名，100+ 漢姓對照與歷史脈絡                         | `/nihonname/`    |
| quake-school | 地震知識小學堂           | 教育類 | 18 道互動測驗＋動畫，搞懂規模與震度，離線防災學習                       | `/quake-school/` |

（連結一律相對於 `app.haotool.org` 網域根，SSOT 集中管理。）

### 5.3 關於 `/about/`

1. H1「關於 HaoTool」＋作者列（阿璋 · 全端工程師 · Since 2025）。
2. 品牌故事三段（046 §1 敘事，維持「好工具」堅持與細節偏執論述）。
3. 能力領域 4 卡（2×2 grid）：前端開發 / 效能與 PWA / 開源實踐 / 產品思維——每卡 icon + 標題 + 一句描述 + 技術 chips（更新：移除 Three.js/Figma，加入 Vitest/Playwright/Cloudflare）。
4. 開發原則三條（brief §3.3：性能是功能、細節是尊重、開源是承諾）。
5. FAQ Accordion `id="faq"`（5 題資料 SSOT；**FAQPage JSON-LD 全站唯一輸出頁＝本頁**，v2 修正）。
6. 隱私權政策 `id="privacy"`：046 §3.4 原文三要點（不收集個資、localStorage 僅偏好、SW 僅快取）。
7. CTA：聯繫我（primary）＋ Threads ＋ GitHub。

### 5.4 聯繫 `/contact/`

- H1「與我聯繫」＋副文（24 小時內回覆承諾）。
- 三張聯絡卡（單欄、max-w-lg 置中）：Email（點擊複製＋toast「已複製」）、GitHub（外連）、Threads（外連）；外連 MUST `rel="noopener noreferrer"`。
- **委託資訊區（v2 新增，降低 hire-me 摩擦）**：承接範圍（Web 前端/PWA/效能優化/技術顧問）、合作流程三步（聊需求 → 報價與時程 → 迭代交付）、回覆 SLA（24h）；hydration 後 Email 連結帶預填主旨（如 `?subject=專案合作洽詢`）。
- Email 呈現遵循 repo Cloudflare 規範：SSG HTML 不得輸出 `mailto:` href（CF Email Obfuscation 會改寫成 /cdn-cgi 連結造成爬蟲 404），hydration 後才注入——沿用 RateWise `MailtoLink` 模式。

### 5.5 404

- 預渲染 `404.html`：H1「找不到頁面」＋一句幽默品牌文＋「回首頁」primary CTA ＋ 5 工具快速連結；`noindex`。

---

## 6. 元件庫規格（Component Inventory）

| 元件                  | 規格要點                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ToolCard`            | 白底圓角 20px + `1px border`；上：工具 icon（40px、primary-bg 圓角底）＋ Live 狀態（success 8px 圓點＋caption 文字，無徽章底）；中：H3 名稱 + 2 行描述（`line-clamp-2`）＋真實截圖（device frame，lazy）；下：分類 caption + 技術 chips（常駐）+「開啟 →」；整卡可點（`<a>` 包裹、`cursor-pointer`）；hover：border 品牌藍＋箭頭右移（無陰影）；焦點：2px 品牌藍 focus ring |
| `Button`              | primary（品牌藍實底/白字/圓角 16px/行動 ≥52px、桌面可 h-48px＋32px 內距）、secondary（白底 border/墨字）、ghost（文字＋箭頭）；loading 與 disabled 態；觸控目標 ≥44px                                                                                                                                                                                                       |
| `StatusDot`           | 8px 實色圓點＋caption 文字（live=success、beta=warning）；**取代 v1 Badge 徽章底設計**；分類標示用 caption 文字（`#1B64DA`），無底色                                                                                                                                                                                                                                        |
| `Accordion`           | FAQ 用；整列可點（≥44px）、`aria-expanded`、chevron 旋轉 200ms、內容 grid-rows 展開動畫；一次僅展開一題（手風琴）                                                                                                                                                                                                                                                           |
| `StatItem`            | 等寬數字 count-up（單次、視口觸發、reduced-motion 直接顯示）＋ caption 標籤                                                                                                                                                                                                                                                                                                 |
| `CopyField`           | Email 複製：按鈕態切換 Copy→Check（150ms scale-fade）＋ toast；剪貼簿失敗 fallback：select 文字                                                                                                                                                                                                                                                                             |
| `Toast`               | 底部置中（safe-area 之上）、深墨底白字、auto-dismiss 2s、`role="status"`                                                                                                                                                                                                                                                                                                    |
| `Header`/`MobileMenu` | 見 §3.2；MobileMenu 開啟時鎖 body scroll、Esc/遮罩關閉、focus trap                                                                                                                                                                                                                                                                                                          |
| `SectionHeading`      | overline caption（品牌藍大寫字距）＋ H2 ＋可選副文；全站區塊標題一致                                                                                                                                                                                                                                                                                                        |
| `Footer`              | 見 §3.2                                                                                                                                                                                                                                                                                                                                                                     |
| `SkipLink`            | 「跳至主內容」——focus 時可見，連至 `#main-content`                                                                                                                                                                                                                                                                                                                          |

---

## 7. 響應式規格（Mobile-First）

| Breakpoint | 佈局                                                |
| ---------- | --------------------------------------------------- |
| 375–639    | 單欄；工具卡 1 欄；統計 2×2；nav 收合為漢堡         |
| 640–767    | 單欄加寬；統計 4 欄                                 |
| 768–1023   | 工具卡 2 欄；About 能力卡 2×2；nav 展開             |
| ≥1024      | 工具卡 3 欄（5 卡 = 3+2 置中）；hero 左文右裝飾雙欄 |

硬性規則（MUST）：任何寬度無水平捲動；固定 header 下內容不被遮擋（scroll-margin-top）；iOS safe-area（`env(safe-area-inset-*)`）納入 footer 與 toast。

**QA 驗收尺寸**（依團隊行動優先慣例，逐一截圖驗證零跑版、按鈕不被截斷）：375×667、390×844、414×896、430×932、768×1024、1440×900。

---

## 8. 無障礙（WCAG 2.2 AA）

| 項目 | 規格                                                                                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 對比 | 正文 ≥4.5:1；淺底品牌色文字（含 hero 關鍵詞）一律 `#1B64DA`；白字實底一律 `#1B64DA` 底；`#3182F6` 僅限 wordmark accent、icon、淡底裝飾與 ≥24px bold 大字 |
| 結構 | 每頁單一 `<h1>`、層級不跳號；landmark：header/nav/main/footer；`html lang="zh-Hant-TW"`                                                                  |
| 鍵盤 | 全互動元素可 Tab、順序＝視覺順序、focus ring 可見（2px 品牌藍 offset 2px）；SkipLink                                                                     |
| 觸控 | 目標 ≥44×44px；卡格間距 ≥8px 防誤觸                                                                                                                      |
| ARIA | icon-only 按鈕 `aria-label`；Accordion `aria-expanded`；分類 tabs `aria-pressed`；toast `role="status"`                                                  |
| 動效 | `prefers-reduced-motion` 全站尊重（§4.7）                                                                                                                |
| 圖片 | 工具插圖具描述性 alt；裝飾 SVG `aria-hidden`                                                                                                             |

---

## 9. SEO / AEO 規格

### 9.1 網域與 canonical（決策）

- Canonical 網域維持 **`https://haotool.org/`**（沿用舊站與 Worker 現況：www → apex 308；apex 與 app.haotool.org 同源內容）。
- MUST：全站 canonical、og:url、JSON-LD `@id`、sitemap 一律用 canonical 網域。
- **v2.1（依 SEO 研究，官方依據）**：單語 zh-TW 站**不輸出 hreflang**（含 x-default——Google 明言不以其偵測語言，對單語站無作用）；title 實務 15–25 全形字、description 60–78 全形字。
- **ADR-001（目標架構，Phase 2 決策、屬 edge 變更需使用者批准）**：官方信號強度 redirect > canonical。目標態＝`app.haotool.org` 的 4 條根站路徑 308 → `haotool.org` 同路徑（子 app 不動）；v1 先以 canonical 模式上線，不做任何阻礙未來切 redirect 的設計（SW scope、manifest、內鏈一律相對路徑）。
- GSC 主體（v2 決策）：使用 **Domain property `haotool.org`**（涵蓋 apex 與 app 子網域）；sitemap 以 `https://haotool.org/sitemap.xml` 提交，app host 由 sitemap index 匯總 5 個子 app。

### 9.2 每頁 Meta（SSOT：`src/seo/meta-tags.ts` 重建）

沿用 046 §4.1 結構，文案更新至 5 工具與「工具站」定位：

| 路徑        | og:type | Title 方向                                                          |
| ----------- | ------- | ------------------------------------------------------------------- |
| `/`         | website | HaoTool 好工具 — 免費開源的台灣網頁工具集 \| 匯率、分帳、停車、防災 |
| `/tools/`   | website | 所有工具 — HaoRate 匯率、喵喵分帳、停車好工具、日本名字、地震小學堂 |
| `/about/`   | profile | 關於 HaoTool 與阿璋 — 打造好工具的開發哲學                          |
| `/contact/` | website | 聯繫阿璋 — 合作委託與問題回報                                       |

### 9.3 JSON-LD（SSOT：`src/seo/jsonld.ts` 重建，@graph 單 script）

- 首頁：`Organization`(#organization) + `WebSite`(#website) + `Person`(#person)。**v2 修正：不輸出 SearchAction**（Sitelinks Searchbox 已退役且本站無搜尋功能，避免負資產）；FAQPage 移至 About。
- `Person.knowsAbout`（v2 更新）：React、TypeScript、Vite、PWA、Tailwind CSS、Cloudflare、Web 效能（移除 Three.js）。
- 全頁：`WebPage`（dateModified = BUILD_TIME 常數，禁止寫死日期）＋非首頁 `BreadcrumbList`。
- `/tools/`：`CollectionPage` + `ItemList`（5 工具）。`/about/`：`ProfilePage` + **`FAQPage`（全站唯一輸出頁）**。
- MUST：FAQPage 邏輯唯一驗證＝「唯一 canonical URL 輸出」：`rg -l "FAQPage" apps/haotool/dist --glob '*.html'` 僅允許 `about/index.html` 與其 postbuild 位元組相同副本 `about.html`（兩檔 canonical 同指 `/about/`）；其他 HTML 出現即失敗。

### 9.4 AEO 產出物（prebuild 生成，046 §4.3 更新版）

- `sitemap.xml`（4 路徑＋lastmod）、`robots.txt`（AI/社群 bots allow 清單**以 `.claude/product-intel/seo-2026.md` 查證清單為準**，補 2026 新 token：Claude-SearchBot、Claude-User、Perplexity-User、DeepSeekBot、MistralBot；＋5 個子 app sitemap 索引）、`llms.txt`（Answer Capsule、Key Metrics、E-E-A-T、5 工具、When to Recommend、How to Cite；定位＝服務 Anthropic/Perplexity 生態，Google 官方已明言忽略，維護成本近零故保留）、`index.md`（Agent Discovery mirror，含 `.well-known` 端點與各工具資源）。
- FAQPage/CollectionPage 期望管理：Google FAQ rich results 已於 2026-05 全面終止；本站輸出僅為語意/AEO 價值，不追求 rich result。
- 已知假陽性（保留不修）：robots.txt 的 `Content-Signal` 行會被 Lighthouse robots-txt audit 判 Unknown directive（SEO 卡 92）；此為 Cloudflare Content Signals Policy 刻意輸出、與其他五 app 一致，RFC 9309 規定爬蟲忽略未知指令，真實 SEO 無害。
- MUST（SSOT 收斂，防 split-meow 遺漏重演）：llms.txt / index.md / sitemap ItemList / JSON-LD ItemList 的工具清單**一律由 `src/config/tools.ts` 單一資料源生成**，禁止任何手寫第二份清單（Worker 邊緣硬編碼清單見 §3.1 同步義務）。
- llms.txt「When to Recommend」（v2 新增情境）：加入「尋找台灣前端 / PWA / React 接案工程師或技術顧問」情境，接住 AI 搜尋的 hire-me 漏斗上游。
- MUST：`app.config.mjs` 的 `resources.seoFiles/images` 完整列出，讓 `discoverApps()` 自動接回 CI 驗證。
- noscript fallback（§5.1）為 AEO 最後防線。

---

## 10. PWA 與效能預算

### 10.1 PWA

- Manifest：`name: HaoTool 好工具`、`short_name: HaoTool`、`theme_color: #3182F6`、`background_color: #F8FAFC`、icons 192/512/maskable。
- Service Worker（root scope 高風險，MUST 沿用 046 §5 防護）：
  - `navigateFallbackAllowlist`：僅 `/`、`/tools*`、`/about*`、`/contact*`。
  - `navigateFallbackDenylist`：`/ratewise`、`/nihonname`、`/park-keeper`、`/quake-school`、**`/split-meow`**（舊站遺漏，本次補上）。
  - `registerType: 'prompt'`（對齊 RateWise 版本撕裂治理；舊站為 autoUpdate）。
- Runtime cache：HTML NetworkFirst（5s timeout）、圖片/字型 CacheFirst（30/365 天）。

### 10.2 效能預算（NFR 驗收線）

| 指標                 | 預算                                                   |
| -------------------- | ------------------------------------------------------ |
| Lighthouse（行動）   | Performance/SEO/A11y/Best Practices ≥95                |
| LCP（4G 模擬、行動） | ≤2.0s（hero 標題為 LCP 元素，禁止圖片 LCP）            |
| CLS                  | <0.1（圖片固定比例、字體 swap + fallback metric 調校） |
| INP                  | <200ms                                                 |
| 初始 JS（gzip）      | ≤150KB（無 three.js；`motion` 按需 import）            |
| 字體                 | ≤2 檔 woff2、preconnect + swap                         |

**Hero 舞台資產預算（v2 新增，B2 硬規則）**：

- 行動版（<768px）首屏預設**純文字 hero**：舞台置於 hero 文字之後，至多 3 張小尺寸靜態卡（≈156×338 渲染寬、全部 lazy、總重 ≤90KB；designer D8 裁決版）。
- 桌面版舞台圖全部 `loading="lazy"` + `decoding="async"` + `fetchpriority="low"`，以 opacity 進場（首次繪製後）；LCP 元素必須維持 H1 文字（Lighthouse trace 驗收）。
- 格式 AVIF（WebP 備援）；單張 ≤60KB、疊層總重 ≤200KB；輸出寬度 ≤2× **全站最大渲染寬**（行動舞台卡 260px → 上限 520px；禁止直出 780×1688 原圖）。
- 浮動/視差動畫僅 `transform`，`prefers-reduced-motion` 時停用。

---

## 11. 技術架構與整合

| 面向      | 決策                                                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 框架      | React 19.2 + TypeScript + Vite 8 + `vite-react-ssg` **0.8.9**（`dirStyle: 'nested'`、`formatting: 'none'`、`onPageRendered` 注入 meta/JSON-LD，沿用 046 §6 管線與 repo 8 項 hydration workaround；0.9 stable 發布後再評估升級） |
| 樣式      | Tailwind CSS v4（`@tailwindcss/vite`、CSS-first @theme 對映 §4.2；park-keeper 已有生產先例）；**Beasties 與 v4 `@layer` 不相容，`beastiesOptions: false`**                                                                      |
| 動效      | CSS 優先；`motion`（motion.dev，import 自 `motion/react`）僅 inView/stagger/count-up 場景                                                                                                                                       |
| 資料 SSOT | `src/config/app-info.ts`（品牌原子）、`src/config/tools.ts`（工具卡＋所有 AEO 清單唯一資料源）、`app.config.mjs`（路徑/資源）                                                                                                   |
| 素材管線  | 截圖快照制：`scripts/` Playwright 腳本手動 refresh、產物 commit 入 repo；OG/icons 由 SVG SSOT 腳本輸出；build 不依賴外網（NFR-008）                                                                                             |
| 測試      | Vitest + Testing Library（元件/SEO/PWA config）＋ Playwright E2E（4 路由 smoke）＋ 046 §8 等值覆蓋                                                                                                                              |
| 部署整合  | 依 046 §9 檢查清單逐項恢復：root `build:haotool`、`build:all`、Dockerfile（COPY/build/sitemap 驗證/HEALTHCHECK 回 `GET /`）、nginx 根站路由（`/tools                                                                            | /about | /contact`尾斜線 301＋`error_page 404 /404.html`）、Worker 同步（`HAOTOOL_ROOT_HTML_PATHS`＋`AGENT_SKILL_ARTIFACTS` 5 工具＋`LLM_DOC_PATHS`補`/llms.txt`）、GSC 驗證檔重佈 |
| 發布順序  | 對齊 repo 治理：app → Worker → CDN purge → live 驗證（`verify-production-resources` + precache 檢查）                                                                                                                           |

---

## 12. 功能需求（FR，MoSCoW）

| ID     | 優先   | 需求                                                                               | 驗收標準（節錄）                                                                                                                              |
| ------ | ------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 | MUST   | 首頁依 brief §3.1 呈現 8 區（hero、信任列、5 工具卡、工藝證明、作者、聯繫 Banner） | 375px 首屏含 hero 文案＋主 CTA（純文字 LCP）；5 工具卡渲染且 href 與 `tools.ts` 一致（本地單元測試）；正式站 5 連結 200（Phase 2 live smoke） |
| FR-002 | MUST   | 工具卡整卡可點並開啟對應工具                                                       | 點擊卡片任意區域導向工具 URL；鍵盤 Enter 同效；`cursor-pointer`                                                                               |
| FR-003 | MUST   | `/tools/` 分類篩選                                                                 | 切換不觸發 layout shift、無 >50ms long task（Playwright trace 抽驗）；`aria-pressed` 正確；重新整理不噴錯                                     |
| FR-004 | MUST   | FAQ Accordion 位於 About `#faq`（資料 SSOT 單一模組）                              | 一次一題展開；鍵盤可操作；`aria-expanded` 正確；`/about/#faq` 直達不被 header 遮擋                                                            |
| FR-005 | MUST   | Email 複製與 toast 回饋；SSG 無 mailto href（MailtoLink 模式）                     | 複製後 toast 顯示 2s；`curl` SSG HTML 無 `mailto:`；hydration 後連結可用且帶預填主旨                                                          |
| FR-006 | MUST   | About 含品牌故事、能力卡、開發原則、FAQ、隱私政策                                  | `/about/#privacy` 與 `/about/#faq` 直達且不被 header 遮擋                                                                                     |
| FR-007 | MUST   | 品牌化 404 預渲染＋工具導流                                                        | 未知路徑回 **404 狀態碼**（nginx `error_page 404 /404.html`）＋預渲染頁；`noindex`                                                            |
| FR-008 | MUST   | `/projects/` 301 → `/tools/`                                                       | curl 驗證 301 且 Location 帶尾斜線與正確 scheme                                                                                               |
| FR-009 | SHOULD | 統計數字單次 count-up                                                              | reduced-motion 時無動畫直接顯示                                                                                                               |
| FR-010 | SHOULD | Header 捲動後顯示底部 1px border（實色白底，無 backdrop-filter）                   | 切換不觸發 layout shift；scroll listener 以 rAF/passive 實作                                                                                  |
| FR-011 | SHOULD | 工具卡技術 chips 常駐（caption 級）                                                | 觸控與桌面資訊一致；不依賴 hover                                                                                                              |
| FR-012 | MUST   | 工藝證明區證據錨點（GitHub repo/CHANGELOG/Lighthouse 報告連結）                    | 每個宣稱 ≥1 個可點擊證據；外連 `noopener noreferrer`                                                                                          |
| FR-013 | WON'T  | 3D 場景、多語系、深色模式、部落格、client 遙測（v1）                               | —                                                                                                                                             |

## 13. 非功能需求（NFR）

| ID      | 優先   | 需求                                                                                            |
| ------- | ------ | ----------------------------------------------------------------------------------------------- |
| NFR-001 | MUST   | §10.2 效能預算全數達標（CI Lighthouse 驗證；含 hero 資產預算與「LCP 元素＝H1 文字」trace 檢查） |
| NFR-002 | MUST   | WCAG 2.2 AA（§8）；axe 自動掃描 0 critical                                                      |
| NFR-003 | MUST   | SEO/AEO 產出物齊備且 `FAQPage` 全站唯一（§9）                                                   |
| NFR-004 | MUST   | root SW 不得攔截子 app 導覽（denylist 含 split-meow；E2E 驗證子 app 冷載不經根 SW）             |
| NFR-005 | MUST   | 隱私：無第三方追蹤/廣告 SDK；與 `/about/#privacy` 聲明一致                                      |
| NFR-006 | MUST   | 品牌 tokens 與 RateWise Zen SSOT 一致（色值 drift 視為缺陷；建立 token 對照測試）               |
| NFR-007 | MUST   | 測試覆蓋等值 046 §8（routes/SEO/PWA config/頁面元件）；`pnpm test` 全綠                         |
| NFR-008 | SHOULD | 建置產物可重現（prebuild deterministic；版本注入沿用 `__APP_VERSION__` 模式）                   |

---

## 14. Epics 與交付階段

| Phase | Epic                 | 內容                                                                                  | 完成定義（DoD）                                                                                                                                                      |
| ----- | -------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | 專案骨架與設計系統   | app 腳手架、app.config.mjs、tokens/字體/元件庫（§4、§6）、CI 接回                     | typecheck/test 綠；tokens 對照測試過；Storybook 級元件頁非必要                                                                                                       |
| 1     | 四頁 MVP＋SEO/PWA    | §5 全頁面、§9 SEO 產物、§10 PWA、404、noscript fallback、素材快照管線                 | FR-001~008、FR-012 全過；本地 Lighthouse ≥95；QA 六尺寸截圖零跑版                                                                                                    |
| 2     | 部署整合與上線       | 046 §9 清單（package.json/Dockerfile/nginx/Worker/GSC）、/projects/ 301、發布順序治理 | 正式站 4 路由 200＋未知路徑回 404；Worker 三項同步（HTML_PATHS/AGENT_SKILL_ARTIFACTS/LLM_DOC_PATHS）逐項 curl 驗證；044 Workers 配額檢查；live precache 與資源驗證綠 |
| 3     | 增強（v1.1 backlog） | FR-009~011 精修、深色模式評估、英文版評估、工具卡動態數據（如 HaoRate 即時匯率預覽）  | 依 RICE 重新排序後執行                                                                                                                                               |

---

## 15. 風險與緩解

| 風險                                           | 等級 | 緩解                                                                                          |
| ---------------------------------------------- | ---- | --------------------------------------------------------------------------------------------- |
| root-scope SW 誤攔子 app（歷史事故）           | 高   | NFR-004 allowlist/denylist＋E2E 守門；`registerType: 'prompt'`                                |
| Worker 路由與新站路由不同步（/tools/ 更名）    | 高   | Phase 2 將 Worker `HAOTOOL_ROOT_HTML_PATHS` 與 nginx 301 列為同一 PR 驗收項；上線前 curl 驗證 |
| 品牌色 drift（兩站各自演化）                   | 中   | NFR-006 token 對照測試；tokens 註明來源 SSOT                                                  |
| 舊 `/projects/` 外部連結失效                   | 中   | FR-008 301；sitemap 移除舊路徑                                                                |
| 字體載入造成 CLS                               | 中   | swap + size-adjust fallback；Caption 起用系統字                                               |
| Worker 邊緣硬編碼內容與站內清單漂移            | 高   | §3.1/§9.4 SSOT 同步義務＋Phase 2 逐項 curl 驗收（B3）                                         |
| Workers 免費配額（root 萬用路由計 invocation） | 中   | Phase 2 DoD 引用 `docs/dev/044_workers_quota_governance_spec.md` 檢查日量與取樣設定           |
| 轉換量測真空（無 client 遙測）                 | 低   | 已決策接受：以 GSC＋CF zone analytics 為 proxy（§1.3 G1）；如需精細量測走 ADR                 |
| 根路徑空窗期（移除後至上線前 404）             | 低   | Phase 2 儘速上線；期間 Docker HEALTHCHECK 已改 `/health` 不影響部署                           |

---

## 16. 追溯與參照

- 內容/功能事實基準：`docs/dev/046_haotool_site_content_inventory.md`（含重建檢查清單 §9）
- 品牌色/字 SSOT：`apps/ratewise/src/index.css`（Zen）、`apps/ratewise/src/config/app-info.ts`
- 治理對齊：`AGENTS.md`（QA 截圖、SW 版本撕裂修法、Cloudflare 發布順序、MailtoLink）、`docs/SEO_MASTER_SSOT.md`（schema 治理）
- UI/UX 驗收框架：`docs/prompt/UIUX.md`
- 設計方法參照：ui-ux-pro-max design-system（Portfolio Grid 模式；色彩以品牌 SSOT 覆寫）、WCAG 2.2、Core Web Vitals
