# haotool.org v2 設計 Brief — 韓系高級扁平（PM 親撰 SSOT）

> 狀態：Active｜建立：2026-07-05｜作者：PM Conductor
> 上游：PRD `2026-07-04-haotool-site-rebuild-prd.md`（本 brief 為其 §4–§6 的高級化深化與修正）
> 關鍵修正依據：002 紀錄 `reward-rw-offline-shell-korean-flat-ui` — 使用者明確不喜歡漸層與裝飾陰影；RateWise 已全面轉向 Toss 式扁平語彙。**本站必須同語彙。**

## 0. 設計北極星

一句話：**「像 Toss 官網一樣乾淨，像產品發布會一樣有說服力。」**

訪客離開時要留下的印象：這個作者做的東西「已經是產品」——快、乾淨、細節到位；我想用他的工具，或想找他做我的專案。

三個檢驗問句（每個區塊都要過）：

1. 這個區塊 3 秒內能讀懂一件事嗎？（一區一事）
2. 拿掉這個裝飾，資訊有損失嗎？（無損失就拿掉）
3. 在 iPhone 上單手操作順嗎？（拇指熱區、44px、無誤觸）

## 1. 視覺語彙（硬規則，違反視為缺陷）

### 1.1 扁平鐵律（對齊使用者已表態偏好）

- **禁止任何 `linear-gradient` / `radial-gradient`**（含背景、按鈕、文字漸層、邊框漸層）。
- **禁止裝飾性陰影與 glow**；容許的深度表達只有兩種：
  - 邊框：`1px solid var(--color-border)`（卡片靜態）
  - 安靜陰影：`0 1px 2px rgb(15 23 42 / 0.04)`（僅浮動元素：header、toast、sticky CTA）
- 主按鈕：**全寬或大面積實色、高度 ≥52px、圓角 16px、白字 700**（Toss 交易按鈕語彙；桌面版可收斂為 auto 寬 + 32px 水平內距）。**實底用色（2026-07-05 QA 裁決）**：白字實底互動面一律 `#1B64DA`（5.4:1 過 AA），hover `#1E40AF`（Zen `--color-primary-dark` 既有值）；`#3182F6` 於白字組合僅 3.71:1，禁止用於按鈕實底，保留給 wordmark accent、icon、淡底裝飾與 ≥24px bold 大字。
- 狀態表達用**安靜小圓點**（8px、實色），不用彩色徽章底。
- 色彩節制：一個視口內品牌藍實底面積 ≤ 15%；灰階承載結構，藍色只給「要你按的東西」。

### 1.2 色彩 Tokens（RateWise Zen SSOT，禁止新增色相）

沿用 PRD §4.2 全表，重申關鍵值：primary `#3182F6`、primary-strong `#1B64DA`（淺底文字/深底面）、primary-bg `#EFF6FF`、bg `#F8FAFC`、surface `#FFFFFF`、sunken `#F1F5F9`、text `#0F172A`、muted `#64748B`、border `#E2E8F0`、success `#22C55E`。

**修正 PRD v1**：§4.2 規則 4（hero CTA 允許品牌藍微漸層）**作廢**；改為實色 `#3182F6`，hover `#1B64DA`，active scale 0.97。

大面積藍底區（Contact banner）：底色用 `#1B64DA`（白色正文對比 5.4:1 過 AA），標題可白字、輔文用 `#EFF6FF`。

### 1.3 字體與排印（韓系大字）

- 字族：`Inter`（Latin/數字）+ `Noto Sans TC`（中文）+ system fallback；自託管 subset（研究代理驗證產出策略）。
- 排印個性 = **大、重、緊、留白多**：
  - Display（hero）：mobile `clamp(36px, 10vw, 44px)` / desktop 64px；weight 800；letter-spacing -0.02em；line-height 1.12
  - Section title：mobile 26px / desktop 40px；weight 800
  - 卡片標題 17–19px/700；正文 16px/400/1.7；caption 13px/500
- 中文標題斷行用 `text-wrap: balance`；關鍵詞（好工具、聊專案）在標題內以品牌藍字強調（`#1B64DA`），**不用底線不用漸層**。
- 數字一律 `font-variant-numeric: tabular-nums`（統計、匯率、版本號）。

### 1.4 空間與節奏

- 容器 `max-w-[1120px]`；側距 mobile 20px / desktop 24px。
- 區塊垂直節奏：mobile 72px / desktop 128px；區塊內元素 gap 16/24/40 三檔。
- 背景分節：白 `#FFFFFF` 與淺灰 `#F8FAFC` **交替全幅**，用底色切換代替分隔線與陰影。
- 圓角體系：卡 20px、按鈕 16px、chip 999px、裝飾圖形 24px。

## 2. 動效系統（Motion Tokens）

原則：**動效是回饋，不是表演**。全部 transform/opacity；`prefers-reduced-motion` 時僅保留 opacity。

| Token            | 值                              | 用途                              |
| ---------------- | ------------------------------- | --------------------------------- |
| `ease-out-quart` | `cubic-bezier(0.16, 1, 0.3, 1)` | 全站標準 easing                   |
| `dur-tap`        | 120ms                           | 按下回饋（scale 0.97）            |
| `dur-hover`      | 200ms                           | hover 色彩/邊框                   |
| `dur-reveal`     | 480ms                           | 進場（opacity + translateY 16px） |
| `stagger`        | 70ms（同組最多 6 個）           | 卡片/清單序列進場                 |
| `dur-count`      | 1200ms                          | 統計數字 count-up（單次）         |

編排（choreography）：

1. **首屏不等動畫**：hero 文案為 SSG 靜態內容立即可見；進場動畫只作用於首屏以下（`whileInView once`）。
2. **hero 舞台**：右側工具卡疊層以 CSS `transform: translateY` 慢速浮動（8s 循環、位移 ≤8px）；desktop 加指標視差 ±6px（`pointermove`，rAF 節流）；**行動版首屏預設純文字 hero**（舞台不進首屏或僅 1 張延遲載入靜態卡）。舞台圖受 PRD §10.2 資產預算硬約束：全部 lazy + `fetchpriority="low"`、AVIF 單張 ≤60KB、總重 ≤200KB、LCP 必須是 H1 文字。
3. **滾動進場**：每區標題先進、內容 stagger 跟進；同視口只允許一組動畫進行。
4. **微互動**：ToolCard hover＝border 轉品牌藍 + 箭頭右移 4px（無位移縮放）；按鈕 active scale 0.97；FAQ 展開 240ms grid-rows。
5. **技術選型**：CSS transition/animation 優先；`motion/react`（framer-motion 12 後繼）僅用於 inView stagger 與 count-up。禁止滾動劫持、禁止 parallax 背景圖。

## 3. 頁面編排與文案（PM 定稿草案，designer 深化）

### 3.1 Home（8 區，敘事線：是什麼 → 證據 → 為什麼可信 → 誰做的 → 行動）

| #   | 區塊                              | 內容與版式                                                                                                                                                                | 文案草案（zh-TW）                                                                                                                        |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Header                            | 白底、底部 1px border；wordmark（Hao 墨 + Tool 藍）＋ 工具/關於/聯繫 ＋ GitHub icon；mobile 漢堡全屏選單                                                                  | —                                                                                                                                        |
| 2   | Hero（白底）                      | 左文右舞台（mobile 上下）；overline chip「OPEN SOURCE · 台灣」；Display 標題兩行；副文一句；雙 CTA（實色「看看我做的工具」/ 描邊「和我聊專案」）；右側 5 張工具卡疊層浮動 | H1:「把好想法，做成**好工具**。」副文:「我是阿璋。HaoTool 是我打造的免費開源工具集——從匯率、分帳到防災教育，每一個都以產品級標準交付。」 |
| 3   | 信任列（淺灰底）                  | 4 統計橫排（mobile 2×2）：`5` 個上線產品、`100%` 開源免費、`0` 廣告與追蹤、`90+` Lighthouse 分數；tabular-nums count-up                                                   | overline:「不是作品集，是已上線的產品」                                                                                                  |
| 4   | 工具展示（白底）                  | 標題＋5 張 ToolCard（1/2/3 欄）；每卡：app icon、名稱、一句定位、真實截圖（device frame）、Live 圓點＋「開啟 →」                                                          | 標題:「五個正在服務真實使用者的工具」                                                                                                    |
| 5   | 工藝證明（淺灰底）                | 3 欄卡：效能（LCP <2s、Lighthouse 90+）、可靠（PWA 離線、資料守門）、誠實（開源 GPL-3.0、零追蹤）；每卡 icon＋數據＋一句                                                  | 標題:「產品級，是可以被驗證的」                                                                                                          |
| 6   | 作者（白底）                      | 左：頭像/mascot 圖＋姓名職稱；右：三句自介＋「更多關於我 →」                                                                                                              | 「寫程式碼之前，我先想像使用的人。」                                                                                                     |
| 7   | 聯繫 Banner（`#1B64DA` 實色全幅） | 白字標題＋一句＋白底藍字實色按鈕「聊聊你的專案」（→ `/contact/`）＋次要文字連結「先看 FAQ」（→ `/about/#faq`）                                                            | 標題:「有想做的產品？我們聊聊。」副文:「合作委託、技術顧問或只是打個招呼——24 小時內回覆。」                                              |
| 8   | Footer（白底）                    | wordmark＋一句、工具×5、頁面、社群（GitHub/Threads/Email）、版權＋GPL-3.0＋隱私連結                                                                                       | —                                                                                                                                        |

FAQ 自 Home 移除（PRD v1 §5.1 修正）：Home 保持銷售敘事節奏，FAQ 集中 About（`FAQPage` schema 輸出頁改為 About，全站唯一——SEO 規格同步修訂）。

### 3.2 Tools `/tools/`

頁首 H1「所有工具」＋一句；分類 pill tabs（全部/工具/創意/教育）；卡格同 Home；卡片資訊加技術 chips（React 19 / PWA / SSG…，caption 常駐）。

### 3.3 About `/about/`

品牌故事（好工具的由來）→ 能力四卡（前端/效能與 PWA/開源實踐/產品思維）→ 開發原則三條（性能是功能、細節是尊重、開源是承諾）→ FAQ（5 題，`FAQPage` schema 唯一輸出處）→ 隱私政策 `#privacy` → CTA。

### 3.4 Contact `/contact/`

三張聯絡卡（Email 複製、GitHub、Threads）＋回覆承諾；卡片同 ToolCard 語彙；Email 走 MailtoLink 模式（SSG 無 href，hydration 後帶預填主旨）。下方「委託資訊」區：承接範圍、三步合作流程、24h SLA（降低 hire-me 摩擦，PRD §5.4）。noscript fallback 的聯絡導引一律用 GitHub/Threads 連結（email 純文字也會被 CF Obfuscation 改寫）。

### 3.5 404

大數字 404（tabular-nums、墨色）＋「這頁不存在，但工具都在」＋回首頁實色按鈕＋5 工具文字連結；`noindex`。

## 4. 素材規格（Asset Specs — 生成/實作依據）

**原則：素材優先用「程式碼與真實截圖」產生（可維護、SSOT）；點陣生成（Codex imagegen）僅限插畫/吉祥物。**

| #   | 素材                | 用途/位置               | 規格                                                                                                | 產生方式                                                                           |
| --- | ------------------- | ----------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A1  | `wordmark.svg`      | Header/Footer/OG        | 高 24–28px 自適應；「Hao」`#0F172A`＋「Tool」`#3182F6`；Inter 800 手工向量化                        | 手寫 SVG（實作者）                                                                 |
| A2  | monogram icon       | favicon/PWA icons       | 圓角方（20% 半徑）`#3182F6` 實底＋白色「H」幾何字；輸出 32/180/192/512/maskable                     | SVG SSOT → `sharp` 腳本輸出 PNG                                                    |
| A3  | `og-image.png`      | 全站分享 1200×630       | 白底、左上 wordmark、中央大字標語、右下 5 個工具 icon 排列；零漸層                                  | HTML 模板 → Playwright 截圖腳本手動產生，產物 commit（快照制）                     |
| A4  | 工具截圖 ×5         | Home hero 舞台/ToolCard | 各 app 首頁 390×844 @2x 快照；CSS device frame（圓角 40px、墨色邊）；輸出 AVIF＋WebP、寬 ≤2× 渲染寬 | Playwright 腳本手動 refresh，**產物 commit 入 repo（快照制）**，build 不抓 live 站 |
| A5  | 能力/工藝 icon ×6–8 | 工藝證明、能力卡        | Lucide 24px stroke-2，統一 `#1B64DA`                                                                | Lucide（現有依賴）                                                                 |
| A6  | 作者頭像/吉祥物     | Home 作者區、About、404 | 1024×1024 透明背景；扁平幾何風、品牌藍+墨雙色、無漸層無外框陰影                                     | Codex imagegen（E2 階段；PM 出 prompt）                                            |
| A7  | 幾何裝飾形          | 區塊點綴（極少量）      | 實色 `#EFF6FF` 圓/圓角矩形，CSS 繪製                                                                | 程式碼                                                                             |

## 5. 互動品質門檻（驗收用）

- 點擊深度：任一工具 ≤1 步；聯繫 ≤2 步（任何頁面）。
- 觸控目標 ≥44px；主按鈕 ≥52px；卡格間距 ≥12px。
- 鍵盤：Tab 順序＝視覺順序；focus ring `2px #3182F6 offset 2px`；skip link。
- 每顆按鈕/連結必須有 hover、active、focus-visible、disabled（如適用）四態定義。
- 零 console error；零水平捲動（375–1440）；CLS <0.1；首屏無動畫阻塞。
- 對比：正文 ≥4.5:1；藍底白字區塊底色一律 `#1B64DA`。

## 6. PM 裁決紀錄（2026-07-05，對 design-deep-dive D1–D8）

| #     | 裁決     | 內容                                                                                                  |
| ----- | -------- | ----------------------------------------------------------------------------------------------------- |
| D1    | 核准     | `#1B64DA` banner 上 focus ring 改白色（焦點可視性優先）                                               |
| D2    | 核准     | 全幅 `#1B64DA` 聯繫 Banner 為「藍實底 ≤15%」規則的**唯一授權例外**，高度上限 400px；其餘視口維持 ≤15% |
| D3/D4 | 核准     | 文案長度收斂（hero 副文 ≤36 字、作者標題 ≤13 字）                                                     |
| D5    | 核准     | 平板（768–1023）Display 52px 中繼值與 hero 平板版式（補規格空白）                                     |
| D6    | 核准     | pill tab 選中態墨實底 `#0F172A` 白字（品牌藍保留給 CTA）                                              |
| D7    | 核准     | Header 白實底＋捲動後安靜陰影（PRD FR-010 已同步，無毛玻璃）                                          |
| D8    | 修訂核准 | 行動 hero 舞台 ≤3 張小尺寸靜態卡、置於 hero 文字之後、全部 lazy、總重 ≤90KB（PRD §10.2 同步）         |

字體 v2.1 裁決（依技術研究）：全站改**系統字型堆疊**＋wordmark/數字小 subset（≤10KB）；§1.3「Inter + Noto Sans TC 自託管 subset」條目依此修正——排印個性由字重/字級/字距承擔，不依賴 webfont。

## 7. 給子代理的邊界

- designer：可深化版式、間距、文案潤飾與動效編排細節；**不得**引入新色相、漸層、陰影體系、新字族；產出寫入 `.claude/product-intel/design-deep-dive.md`。
- executor：實作以本 brief + PRD 為準，衝突時本 brief 優先（§1.1 扁平鐵律 > PRD §4.2 規則 4）。
- 視覺（Codex）：僅 A6 類點陣素材；prompt 由 PM 提供；輸出過視覺 review 才可引用。

## 8. E2 動效升級指令（PM 親撰，2026-07-05 使用者回饋驅動）

> 使用者回饋：現版不夠吸引人；行動裝置優先為主要設計；需高級動畫技巧展現前端能力、高級質感與互動效果。
> 北極星：**「站點本身就是作品」**——每一屏一個記憶點、每次觸碰有物理回饋；390px 為第一設計對象，桌面是增強層。

### 8.1 不可動搖約束

扁平鐵律不變（零漸層/裝飾陰影/毛玻璃）；LCP=H1、INP<200ms、CLS<0.1、初始 JS ≤150KB；`prefers-reduced-motion` 全降級；60fps（僅 transform/opacity/clip-path）。「高級質感」來源＝動效物理、排印節奏、色塊構圖——不是表面材質。

### 8.2 簽名時刻（S1–S7，designer 深化，可增刪附理由）

- S1 開場序列（行動優先）：wordmark 字元 spring 進場＋hero 標題逐詞 stagger（<900ms、僅首次 session 播放、sessionStorage 記憶）；H1 是 LCP——動畫必須是「已渲染文字的 transform/clip-path reveal」，**禁止 opacity:0 起手**。
- S2 行動 hero 記憶點：品牌色塊＋工具 icon 的 3 枚迷你浮動 chips（純 CSS、無點陣圖、不影響 LCP），慢速漂浮＋滾動視差。
- S3 數字 odometer：信任列 count-up 升級為滾輪式逐位數字（tabular-nums）。
- S4 滾動敘事：區塊進場升級 CSS scroll-driven animations（@supports 漸進增強、motion fallback）；工藝證明指標 draw-in；頂部 1px 品牌藍 scroll progress。
- S5 觸覺微互動：Button spring press（scale 0.96＋回彈）、desktop magnetic hover（±4px）、ToolCard pointer tilt（desktop ≤4deg、行動禁用）、pill tabs 換 motion layoutId 滑動指示器。
- S6 頁面轉場：View Transitions API 同文件轉場（漸進增強，fallback 即時切換）——header 常駐、內容 cross-fade＋8px 上移。
- S7 hero 舞台升級（desktop）：疊層卡 pointer 視差深度分層（前 ±8px/後 ±3px）＋hover 聚焦（該卡上浮、其餘微退）。

### 8.3 功能構想（F 軌，需過 ROI 閘）

- F1 live 匯率 chip：build-time 讀 repo 內 ratewise 匯率資料，hero 顯示即時感匯率＋ticker 動畫——真產品證明、零 runtime 成本。
- F2 「正在打造」列：footer 上方一行最新 release 資訊（build-time git 資料）。
