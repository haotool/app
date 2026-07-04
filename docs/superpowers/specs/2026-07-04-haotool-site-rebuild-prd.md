# haotool.org 官網重建 PRD — 完整 UI/UX 規劃設計規格

## 文件控制（Document Control）

| 欄位        | 內容                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| 文件名稱    | `2026-07-04-haotool-site-rebuild-prd.md`                                  |
| 文件性質    | 產品需求文件（PRD）+ UI/UX 設計規格                                       |
| 文件狀態    | Draft（待使用者核准後進入實作）                                           |
| 建立日期    | 2026-07-04                                                                |
| 上游文件    | `docs/dev/046_haotool_site_content_inventory.md`（舊站內容/功能盤點）     |
| 品牌色 SSOT | `apps/ratewise/src/index.css` Zen 主題（`--color-primary` #3182F6）       |
| 品牌字 SSOT | `apps/ratewise/src/config/app-info.ts`（wordmark prefix/accent 拆分模式） |
| 適用分支    | `chore/remove-haotool-app`（舊站已移除，本 PRD 為重建依據）               |

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

| ID  | 目標                                      | 衡量指標                                              |
| --- | ----------------------------------------- | ----------------------------------------------------- |
| G1  | 訪客快速理解品牌並進入工具                | 首屏即見 5 工具入口；工具卡點擊率為首頁第一互動       |
| G2  | 效能與 SEO 全面優於舊站                   | Lighthouse 四項 ≥95；LCP ≤2.0s（行動 4G）             |
| G3  | 品牌一致性：與 HaoRate 共用同一套色彩語言 | 主色、字體、wordmark 規則 100% 對齊 RateWise Zen SSOT |
| G4  | AI 搜尋（AEO）可完整引用                  | llms.txt / index.md / JSON-LD 全數恢復並更新至 5 工具 |
| G5  | 行動優先體驗                              | 375–430px 各尺寸截圖 QA 零跑版、觸控目標 ≥44px        |

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
/            首頁（品牌 + 工具入口 + 信任 + FAQ + 聯繫）
/tools/      工具總覽（分類篩選）※ 自 /projects/ 更名
/about/      關於品牌與作者（含 #privacy 隱私政策錨點）
/contact/    聯繫方式
/404.html    未知路徑（預渲染，品牌化 404 + 工具導流）
```

**路由更名決策**：`/projects/` → `/tools/`。理由：品牌定位從作品集轉向工具站，語意與 SEO 關鍵字（「工具」）一致。

- MUST：nginx 對 `/projects/` 301 → `/tools/`（保留舊連結權重）。
- MUST：同步 Cloudflare Worker `HAOTOOL_ROOT_HTML_PATHS` 為 `['/', '/tools/', '/about/', '/contact/']`（046 §7 整合點）。

### 3.2 全站導覽

- Header（固定頂部、捲動時毛玻璃白底）：wordmark（回首頁）＋「工具」「關於」「聯繫」＋ GitHub 圖示連結。行動版：漢堡選單（全屏 overlay，選單項 ≥44px）。
- Footer（每頁一致）：wordmark + 一句品牌敘述、工具連結清單（5 個）、頁面連結、社群（GitHub/Threads/Email）、版權列（`© 2025-{年} HaoTool · GPL-3.0`）、隱私政策連結（→ `/about/#privacy`）。

---

## 4. 品牌與設計系統（Design System SSOT）

### 4.1 設計哲學

**「Toss 式信任極簡」**：明亮底色、大量留白、單一品牌藍焦點、卡片化資訊、微妙動效。內容即介面——每個區塊只做一件事。反模式（禁止）：深色科技風、glassmorphism 疊加、多彩漸層、emoji 當圖示、文字牆。

### 4.2 色彩 Tokens（100% 引用 RateWise Zen 主題）

實作 MUST 以 CSS custom properties 定義並與下表一致（來源：`apps/ratewise/src/index.css` `[data-style='zen']`）：

| Token                    | 值（Hex） | RGB         | 用途                                        |
| ------------------------ | --------- | ----------- | ------------------------------------------- |
| `--color-primary`        | `#3182F6` | 49 130 246  | 品牌藍：主 CTA、wordmark accent、連結、焦點 |
| `--color-primary-strong` | `#1B64DA` | 27 100 218  | 淺底上的品牌色文字（WCAG AA 對比 ≥4.5:1）   |
| `--color-primary-bg`     | `#EFF6FF` | 239 246 255 | 品牌藍淡底（badge、icon 底、hover 面）      |
| `--color-secondary`      | `#6366F1` | 99 102 241  | 輔色（僅限次要裝飾，禁止與主色並列為 CTA）  |
| `--color-background`     | `#F8FAFC` | 248 250 252 | 頁面底色（slate-50）                        |
| `--color-surface`        | `#FFFFFF` | 255 255 255 | 卡片 / Header 表面                          |
| `--color-surface-sunken` | `#F1F5F9` | 241 245 249 | 下沉區（FAQ 展開、程式碼底）                |
| `--color-text`           | `#0F172A` | 15 23 42    | 主文字（slate-900）                         |
| `--color-text-muted`     | `#64748B` | 100 116 139 | 次要文字（slate-500，僅限輔助說明）         |
| `--color-border`         | `#E2E8F0` | 226 232 240 | 邊框（slate-200）                           |
| `--color-success`        | `#22C55E` | 34 197 94   | Live 狀態徽章、複製成功                     |
| `--color-warning`        | `#F59E0B` | 245 158 11  | Beta 狀態徽章（預留）                       |
| `--color-danger`         | `#EF4444` | 239 68 68   | 錯誤狀態（404、表單錯誤預留）               |

色彩使用規則（MUST）：

1. 品牌藍為唯一 CTA 色；一個視口內最多一個 primary 實底按鈕。
2. 淺底上的品牌色**文字**一律用 `#1B64DA`（`#3182F6` 於白底對比僅 3.54:1，不達 AA）。
3. 正文禁止使用 `text-muted` 以下的灰階；muted 僅限標籤、註解。
4. 漸層僅允許品牌藍系微漸層（`#3B82F6 → #3182F6`，對齊 RateWise brand-button token），且僅用於 hero CTA 與 wordmark 裝飾。

### 4.3 品牌字（Wordmark）

沿用 HaoRate wordmark 拆分模式（`app-info.ts` SSOT 同構）：

- 站名 wordmark：**`Hao`（墨色 #0F172A）+ `Tool`（品牌藍 #3182F6）**，無空格；副標「好工具」。
- 衍生規則集中於新站 `src/config/app-info.ts`（`BRAND_WORDMARK_PREFIX = 'Hao'`、`BRAND_WORDMARK_ACCENT = 'Tool'`），未來改名只改常數。
- Logo/favicon/OG 圖以此 wordmark 重製（矢量、淺底深字）。

### 4.4 字體系統

| 用途      | 字體                                       | 規則                                                       |
| --------- | ------------------------------------------ | ---------------------------------------------------------- |
| 全站      | `Inter` + `Noto Sans TC` + system fallback | 與 RateWise 同棧；`font-display: swap`；僅載入 400/500/700 |
| 數字/代碼 | `ui-monospace` 系統等寬                    | 統計數字、版本號                                           |

字級階（mobile-first，`clamp()` 流體）：

| 階層    | Mobile   | Desktop  | 行高 | 用途              |
| ------- | -------- | -------- | ---- | ----------------- |
| Display | 34px/700 | 56px/700 | 1.15 | Hero 標題         |
| H1      | 28px/700 | 40px/700 | 1.2  | 頁面標題          |
| H2      | 22px/700 | 28px/700 | 1.3  | 區塊標題          |
| H3      | 17px/600 | 19px/600 | 1.4  | 卡片標題          |
| Body    | 16px/400 | 16px/400 | 1.65 | 正文（最小 16px） |
| Caption | 13px/500 | 13px/500 | 1.5  | 標籤、徽章、註解  |

- MUST：正文行長 ≤ 72 字元（`max-w-prose` 或 65ch）。
- MUST：中英混排使用 `text-wrap: balance`（標題）避免孤字斷行。

### 4.5 空間、圓角、陰影、層級

| 系統    | 規格                                                                               |
| ------- | ---------------------------------------------------------------------------------- |
| 間距    | 4px 基數；區塊垂直節奏 mobile 48px / desktop 96px；卡片內距 20–24px                |
| 容器    | `max-w-6xl`（1152px）單一容器寬，全站一致；側邊距 mobile 16px / ≥md 24px           |
| 圓角    | 卡片 16px（`rounded-2xl`）、按鈕 full（藥丸）、輸入/小元件 12px、徽章 full         |
| 陰影    | 兩級制：`shadow-sm`（卡片靜態）、`shadow-md + border` 上色（hover）；禁止彩色 glow |
| z-index | 10（sticky 區內元素）/ 20（header）/ 30（overlay 選單）/ 50（toast）               |

### 4.6 圖示與圖片

- 圖示：Lucide（延續舊站與 RateWise），統一 24×24 viewBox、`stroke-width: 2`；禁止 emoji 當圖示。
- 工具卡圖：每工具一張 OG 風格插圖（SVG 優先，AVIF/WebP 備援），`loading="lazy"`＋固定寬高比 1200:630 防 CLS。
- 各工具品牌 icon 沿用其 PWA icon（192px），以 `--color-primary-bg` 圓角底承載。

### 4.7 動效（Motion）

| 原則           | 規格                                                                          |
| -------------- | ----------------------------------------------------------------------------- |
| 時長           | 微互動 150–200ms；區塊入場 300–500ms；easing `cubic-bezier(0.16, 1, 0.3, 1)`  |
| 屬性           | 僅 `transform` / `opacity`；禁止動畫 width/height/top（layout shift）         |
| 入場           | 區塊進入視口單次 fade + 12px 上移（stagger 60ms）；首屏內容**不得**延遲顯示   |
| Hover          | 卡片：border 變品牌藍 + shadow-md + 內部箭頭位移 4px；禁止 scale 造成版面位移 |
| Reduced motion | MUST 尊重 `prefers-reduced-motion`：關閉入場位移與 stagger，保留 opacity      |
| 技術           | 優先 CSS transition/animation；Framer Motion 僅在必要（stagger/inView）時引入 |

---

## 5. 頁面規格（Page Specs）

### 5.1 首頁 `/`

目的：10 秒內完成「理解品牌 → 進入工具」。區塊順序（mobile 單欄由上而下）：

| #   | 區塊     | 內容與行為規格                                                                                                                                                                                                                                                       |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Header   | 見 §3.2                                                                                                                                                                                                                                                              |
| 2   | Hero     | Display 標題：「打造真正的**好工具**」（好工具以品牌藍強調）；副文一句：「HAO 取自『好』的拼音——免費、開源、不收集個資的網頁工具集。」；主 CTA「瀏覽工具」（錨點捲動至工具區）＋次 CTA「GitHub」（outline）；背景：純底色＋右側/上方輕量品牌藍幾何 SVG 裝飾（非 3D） |
| 3   | 信任列   | 4 個統計（等寬格線）：`5` 上線工具、`100%` 開源免費、`0` 廣告追蹤、`90+` Lighthouse 分數；等寬數字字體、單次 count-up（reduced-motion 時直接顯示）                                                                                                                   |
| 4   | 工具卡格 | 5 張 ToolCard（§6.1），mobile 1 欄 / md 2 欄 / lg 3 欄；標題「工具」＋「查看全部 →」連結至 `/tools/`                                                                                                                                                                 |
| 5   | 品牌理念 | 兩句品牌敘事（來自 046 §1）＋「關於我 →」文字連結                                                                                                                                                                                                                    |
| 6   | FAQ      | Accordion 5 題（046 §3.3 原文，更新第 5 題技術棧描述移除 Three.js）；此頁**同步輸出 FAQPage JSON-LD**（全站唯一）                                                                                                                                                    |
| 7   | 聯繫 CTA | 單卡片：標題「有想法或合作？」＋ Email 複製按鈕 ＋「聯繫我 →」至 `/contact/`                                                                                                                                                                                         |
| 8   | Footer   | 見 §3.2                                                                                                                                                                                                                                                              |

狀態規格：無 JS（noscript）時輸出純 HTML fallback（品牌介紹 + 5 工具連結 + FAQ 節錄 + 導覽），沿用 046 §4.3 模式並更新內容。

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
4. FAQ Accordion（與首頁同資料 SSOT；**本頁不輸出 FAQPage schema**，避免重複 rich results）。
5. 隱私權政策 `id="privacy"`：046 §3.4 原文三要點（不收集個資、localStorage 僅偏好、SW 僅快取）。
6. CTA：聯繫我（primary）＋ Threads ＋ GitHub。

### 5.4 聯繫 `/contact/`

- H1「與我聯繫」＋副文（24 小時內回覆承諾）。
- 三張聯絡卡（單欄、max-w-lg 置中）：Email（點擊複製＋toast「已複製」）、GitHub（外連）、Threads（外連）；外連 MUST `rel="noopener noreferrer"`。
- Email 呈現遵循 repo Cloudflare 規範：SSG HTML 不得輸出 `mailto:` href（CF Email Obfuscation 會改寫成 /cdn-cgi 連結造成爬蟲 404），hydration 後才注入——沿用 RateWise `MailtoLink` 模式。

### 5.5 404

- 預渲染 `404.html`：H1「找不到頁面」＋一句幽默品牌文＋「回首頁」primary CTA ＋ 5 工具快速連結；`noindex`。

---

## 6. 元件庫規格（Component Inventory）

| 元件                  | 規格要點                                                                                                                                                                                                                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ToolCard`            | 白底 `rounded-2xl` + border；上：工具 icon（40px、primary-bg 圓角底）＋ Live 徽章（success dot + 文字）；中：H3 名稱 + 2 行描述（`line-clamp-2`）；下：分類 caption + 「開啟 →」；整卡可點（`<a>` 包裹、`cursor-pointer`）；hover：border 品牌藍 + shadow-md + 箭頭右移；焦點：2px 品牌藍 focus ring |
| `Button`              | primary（品牌藍實底/白字/藥丸/h-12）、secondary（白底 border/墨字）、ghost（文字＋箭頭）；loading 與 disabled 態；觸控目標 ≥44px                                                                                                                                                                     |
| `Badge`               | 藥丸、caption 級；變體：live（success）、beta（warning）、category（primary-bg/primary-strong 字）                                                                                                                                                                                                   |
| `Accordion`           | FAQ 用；整列可點（≥44px）、`aria-expanded`、chevron 旋轉 200ms、內容 grid-rows 展開動畫；一次僅展開一題（手風琴）                                                                                                                                                                                    |
| `StatItem`            | 等寬數字 count-up（單次、視口觸發、reduced-motion 直接顯示）＋ caption 標籤                                                                                                                                                                                                                          |
| `CopyField`           | Email 複製：按鈕態切換 Copy→Check（150ms scale-fade）＋ toast；剪貼簿失敗 fallback：select 文字                                                                                                                                                                                                      |
| `Toast`               | 底部置中（safe-area 之上）、深墨底白字、auto-dismiss 2s、`role="status"`                                                                                                                                                                                                                             |
| `Header`/`MobileMenu` | 見 §3.2；MobileMenu 開啟時鎖 body scroll、Esc/遮罩關閉、focus trap                                                                                                                                                                                                                                   |
| `SectionHeading`      | overline caption（品牌藍大寫字距）＋ H2 ＋可選副文；全站區塊標題一致                                                                                                                                                                                                                                 |
| `Footer`              | 見 §3.2                                                                                                                                                                                                                                                                                              |
| `SkipLink`            | 「跳至主內容」——focus 時可見，連至 `#main-content`                                                                                                                                                                                                                                                   |

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

| 項目 | 規格                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------- |
| 對比 | 正文 ≥4.5:1；淺底品牌色文字一律 `#1B64DA`；大字標題（≥24px bold）允許 `#3182F6`（≥3:1）                 |
| 結構 | 每頁單一 `<h1>`、層級不跳號；landmark：header/nav/main/footer；`html lang="zh-Hant-TW"`                 |
| 鍵盤 | 全互動元素可 Tab、順序＝視覺順序、focus ring 可見（2px 品牌藍 offset 2px）；SkipLink                    |
| 觸控 | 目標 ≥44×44px；卡格間距 ≥8px 防誤觸                                                                     |
| ARIA | icon-only 按鈕 `aria-label`；Accordion `aria-expanded`；分類 tabs `aria-pressed`；toast `role="status"` |
| 動效 | `prefers-reduced-motion` 全站尊重（§4.7）                                                               |
| 圖片 | 工具插圖具描述性 alt；裝飾 SVG `aria-hidden`                                                            |

---

## 9. SEO / AEO 規格

### 9.1 網域與 canonical（決策）

- Canonical 網域維持 **`https://haotool.org/`**（沿用舊站與 Worker 現況：www → apex 308；apex 與 app.haotool.org 同源內容）。
- MUST：全站 canonical、og:url、JSON-LD `@id`、sitemap 一律用 canonical 網域；hreflang `zh-TW` + `x-default`。

### 9.2 每頁 Meta（SSOT：`src/seo/meta-tags.ts` 重建）

沿用 046 §4.1 結構，文案更新至 5 工具與「工具站」定位：

| 路徑        | og:type | Title 方向                                                          |
| ----------- | ------- | ------------------------------------------------------------------- |
| `/`         | website | HaoTool 好工具 — 免費開源的台灣網頁工具集 \| 匯率、分帳、停車、防災 |
| `/tools/`   | website | 所有工具 — HaoRate 匯率、喵喵分帳、停車好工具、日本名字、地震小學堂 |
| `/about/`   | profile | 關於 HaoTool 與阿璋 — 打造好工具的開發哲學                          |
| `/contact/` | website | 聯繫阿璋 — 合作委託與問題回報                                       |

### 9.3 JSON-LD（SSOT：`src/seo/jsonld.ts` 重建，@graph 單 script）

- 首頁：`Organization`(#organization) + `WebSite`(#website，SearchAction → `/tools/?q=`) + `Person`(#person) + `FAQPage`（全站唯一）。
- 全頁：`WebPage`（dateModified = BUILD_TIME 常數，禁止寫死日期）＋非首頁 `BreadcrumbList`。
- `/tools/`：`CollectionPage` + `ItemList`（5 工具）。`/about/`：`ProfilePage`。
- MUST：`grep -r "FAQPage" dist/ | wc -l` 驗證輸出僅 1 處（對齊 repo SEO 治理）。

### 9.4 AEO 產出物（prebuild 生成，046 §4.3 更新版）

- `sitemap.xml`（4 路徑＋lastmod）、`robots.txt`（AI/社群 bots allow 清單＋5 個子 app sitemap 索引）、`llms.txt`（Answer Capsule、Key Metrics、E-E-A-T、5 工具、When to Recommend、How to Cite）、`index.md`（Agent Discovery mirror，含 `.well-known` 端點與各工具資源）。
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
| 初始 JS（gzip）      | ≤150KB（無 three.js；Framer Motion 按需）              |
| 字體                 | ≤2 檔 woff2、preconnect + swap                         |

---

## 11. 技術架構與整合

| 面向      | 決策                                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------- |
| 框架      | React 19 + TypeScript + Vite 8 + `vite-react-ssg`（`dirStyle: 'nested'`、`onPageRendered` 注入 meta/JSON-LD，沿用 046 §6 管線）                      |
| 樣式      | Tailwind CSS v4（CSS-first tokens，@theme 對映 §4.2；與 park-keeper 同版收斂 monorepo 版本碎片）                                                     |
| 動效      | CSS 優先；`framer-motion` 僅 inView/stagger 場景                                                                                                     |
| 資料 SSOT | `src/config/app-info.ts`（品牌原子）、`src/config/tools.ts`（工具卡）、`app.config.mjs`（路徑/資源）                                                 |
| 測試      | Vitest + Testing Library（元件/SEO/PWA config）＋ Playwright E2E（4 路由 smoke）＋ 046 §8 等值覆蓋                                                   |
| 部署整合  | 依 046 §9 檢查清單逐項恢復：root `build:haotool`、`build:all`、Dockerfile（COPY/build/sitemap 驗證/HEALTHCHECK 回 `GET /`）、nginx 根站路由（`/tools | /about | /contact`尾斜線 301）、Worker`HAOTOOL_ROOT_HTML_PATHS` 同步、GSC 驗證檔重佈 |
| 發布順序  | 對齊 repo 治理：app → Worker → CDN purge → live 驗證（`verify-production-resources` + precache 檢查）                                                |

---

## 12. 功能需求（FR，MoSCoW）

| ID     | 優先   | 需求                                                           | 驗收標準（節錄）                                                            |
| ------ | ------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| FR-001 | MUST   | 首頁呈現 hero、信任列、5 工具卡、FAQ、聯繫 CTA                 | 375px 首屏含 hero + 主 CTA；工具卡全數渲染且連結正確（E2E 驗證 5 連結 200） |
| FR-002 | MUST   | 工具卡整卡可點並開啟對應工具                                   | 點擊卡片任意區域導向工具 URL；鍵盤 Enter 同效；`cursor-pointer`             |
| FR-003 | MUST   | `/tools/` 分類篩選                                             | 切換分類 ≤200ms 完成過濾；`aria-pressed` 正確；重新整理不噴錯               |
| FR-004 | MUST   | FAQ Accordion（首頁與 About 共用資料 SSOT）                    | 一次一題展開；鍵盤可操作；`aria-expanded` 正確                              |
| FR-005 | MUST   | Email 複製與 toast 回饋；SSG 無 mailto href（MailtoLink 模式） | 複製後 toast 顯示 2s；`curl` SSG HTML 無 `mailto:`；hydration 後連結可用    |
| FR-006 | MUST   | About 含品牌故事、能力卡、隱私政策（#privacy 錨點）            | `/about/#privacy` 直達且不被 header 遮擋                                    |
| FR-007 | MUST   | 品牌化 404 預渲染＋工具導流                                    | 未知路徑回 404 狀態碼＋預渲染頁；`noindex`                                  |
| FR-008 | MUST   | `/projects/` 301 → `/tools/`                                   | curl 驗證 301 且 Location 帶尾斜線與正確 scheme                             |
| FR-009 | SHOULD | 統計數字單次 count-up                                          | reduced-motion 時無動畫直接顯示                                             |
| FR-010 | SHOULD | Header 捲動毛玻璃態                                            | 無 layout shift；60fps                                                      |
| FR-011 | COULD  | 工具卡 hover 顯示技術 chips                                    | 不影響觸控裝置資訊完整性（chips 於卡內常駐 caption 亦可）                   |
| FR-012 | WON'T  | 3D 場景、多語系、深色模式、部落格（v1）                        | —                                                                           |

## 13. 非功能需求（NFR）

| ID      | 優先   | 需求                                                                                |
| ------- | ------ | ----------------------------------------------------------------------------------- |
| NFR-001 | MUST   | §10.2 效能預算全數達標（CI Lighthouse 驗證）                                        |
| NFR-002 | MUST   | WCAG 2.2 AA（§8）；axe 自動掃描 0 critical                                          |
| NFR-003 | MUST   | SEO/AEO 產出物齊備且 `FAQPage` 全站唯一（§9）                                       |
| NFR-004 | MUST   | root SW 不得攔截子 app 導覽（denylist 含 split-meow；E2E 驗證子 app 冷載不經根 SW） |
| NFR-005 | MUST   | 隱私：無第三方追蹤/廣告 SDK；與 `/about/#privacy` 聲明一致                          |
| NFR-006 | MUST   | 品牌 tokens 與 RateWise Zen SSOT 一致（色值 drift 視為缺陷；建立 token 對照測試）   |
| NFR-007 | MUST   | 測試覆蓋等值 046 §8（routes/SEO/PWA config/頁面元件）；`pnpm test` 全綠             |
| NFR-008 | SHOULD | 建置產物可重現（prebuild deterministic；版本注入沿用 `__APP_VERSION__` 模式）       |

---

## 14. Epics 與交付階段

| Phase | Epic                 | 內容                                                                                  | 完成定義（DoD）                                                  |
| ----- | -------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 0     | 專案骨架與設計系統   | app 腳手架、app.config.mjs、tokens/字體/元件庫（§4、§6）、CI 接回                     | typecheck/test 綠；tokens 對照測試過；Storybook 級元件頁非必要   |
| 1     | 四頁 MVP＋SEO/PWA    | §5 全頁面、§9 SEO 產物、§10 PWA、404、noscript fallback                               | FR-001~008 全過；本地 Lighthouse ≥95；QA 六尺寸截圖零跑版        |
| 2     | 部署整合與上線       | 046 §9 清單（package.json/Dockerfile/nginx/Worker/GSC）、/projects/ 301、發布順序治理 | 正式站 4 路由 200；Worker paths 同步；live precache 與資源驗證綠 |
| 3     | 增強（v1.1 backlog） | FR-009~011、深色模式評估、英文版評估、工具卡動態數據（如 HaoRate 即時匯率預覽）       | 依 RICE 重新排序後執行                                           |

---

## 15. 風險與緩解

| 風險                                        | 等級 | 緩解                                                                                          |
| ------------------------------------------- | ---- | --------------------------------------------------------------------------------------------- |
| root-scope SW 誤攔子 app（歷史事故）        | 高   | NFR-004 allowlist/denylist＋E2E 守門；`registerType: 'prompt'`                                |
| Worker 路由與新站路由不同步（/tools/ 更名） | 高   | Phase 2 將 Worker `HAOTOOL_ROOT_HTML_PATHS` 與 nginx 301 列為同一 PR 驗收項；上線前 curl 驗證 |
| 品牌色 drift（兩站各自演化）                | 中   | NFR-006 token 對照測試；tokens 註明來源 SSOT                                                  |
| 舊 `/projects/` 外部連結失效                | 中   | FR-008 301；sitemap 移除舊路徑                                                                |
| 字體載入造成 CLS                            | 中   | swap + size-adjust fallback；Caption 起用系統字                                               |
| 根路徑空窗期（移除後至上線前 404）          | 低   | Phase 2 儘速上線；期間 Docker HEALTHCHECK 已改 `/health` 不影響部署                           |

---

## 16. 追溯與參照

- 內容/功能事實基準：`docs/dev/046_haotool_site_content_inventory.md`（含重建檢查清單 §9）
- 品牌色/字 SSOT：`apps/ratewise/src/index.css`（Zen）、`apps/ratewise/src/config/app-info.ts`
- 治理對齊：`AGENTS.md`（QA 截圖、SW 版本撕裂修法、Cloudflare 發布順序、MailtoLink）、`docs/SEO_MASTER_SSOT.md`（schema 治理）
- UI/UX 驗收框架：`docs/prompt/UIUX.md`
- 設計方法參照：ui-ux-pro-max design-system（Portfolio Grid 模式；色彩以品牌 SSOT 覆寫）、WCAG 2.2、Core Web Vitals
