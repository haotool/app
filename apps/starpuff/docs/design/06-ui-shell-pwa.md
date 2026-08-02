# 星噗噗 — 選單、場景 UI、殼層與 PWA

> **職責範圍**：canvas 上與 DOM 殼層上看得到、點得到的介面。主選單與圖鑑／技能／成就分頁、暫停系統、HUD 命中層、有界網格與 DOM 鈕命中保底、結算動線、殼層卡片基建、safe-area 量測、PWA 安裝指引、觸覺與螢幕常亮。
>
> **不在本檔**：虛擬鍵與按鈕配置頁（見 `01-controls-input.md`）；偏好持久化與更新套用閘（見 `05-save-settings.md` §118）。
>
> **命中紀律**：選單與 HUD 一律以 DOM 鈕承接命中（旋轉殼下 hit-test 天然正確），canvas 圖示僅保留視覺；命中短邊 48px 保底（§98）。全遊戲禁 emoji 與文字鍵帽。
>
> **閱讀慣例**：每一句主文都是現行有效規則；被取代的舊規則一律降級為緊接其後的 `> **已廢止**` 附註，僅供追溯。索引與取代對照見 [`../GAME_DESIGN.md`](../GAME_DESIGN.md) 與 [`99-superseded.md`](99-superseded.md)。章號 §N 為全專案穩定識別碼（程式註解直接引用），拆檔不重新編號。

## 33. v5 iOS PWA UX 調研回寫（2026-07-15 定稿）

調研結論與對應實作（出處：MDN `BaseAudioContext.state`、MDN CSS env()、Polypane safe-area 指南、iOS PWA 安全區實測筆記 gist/fozzedout、Steven Hoober thumb-zone 研究、Smashing Magazine 拇指觸控統計）：

| #   | 結論                                                                                     | 實作                                                                                                             |
| --- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `viewport-fit=cover` 缺失時 `env(safe-area-inset-*)` 全為 0，Safari 以黑邊 letterbox     | 既有 meta 已含 cover（複查通過，未重工）                                                                         |
| 2   | standalone 邊到邊需 `apple-mobile-web-app-status-bar-style: black-translucent`           | v5 補上該 meta                                                                                                   |
| 3   | 橫持瀏海機頂緣存在 phantom 觸控死區（inset 回報 0 仍吃事件），建議頂緣 ≥20px 緩衝        | `#keys-layer` top 取 `max(20px, env(top))`；joy-zone 既有 20px 緩衝維持                                          |
| 4   | `env()` 值冷啟動/轉向可能為 0 或 stale，須設 `max(Npx, env(...))` 地板                   | keys-layer 四向皆 `max()` 地板（20/12px）                                                                        |
| 5   | iOS standalone 冷啟動 `100dvh` 可能不可靠；模態又需跟隨實際可視區                        | 遊戲殼保留 `100vh` fallback；viewport-level modal 以 `100dvh`＋`100svh` 安全距呈現（2026-08-03 QA）              |
| 6   | iOS 切 app/背景後 AudioContext 進非標準 `interrupted` 態，`resume()` 須於手勢堆疊內呼叫  | sfx.ts `resumeAudio()`（`state !== 'running'` 即 resume）＋全域 pointerdown 復聲保險＋暫停選單「繼續」手勢內恢復 |
| 7   | 觸控目標 ≥44pt（Apple HIG）；拇指自然熱區在底部/下側緣，食指可達區在裝置上緣（雙手橫持） | 全按鍵 ≥44px（A 76 / B 72 / 暫停與靜音 hit 48 / 選單鈕 ≥52）；布局見 §34                                         |
| 8   | 長按 loupe/選字/callout/雙擊縮放攔截                                                     | v3/v4 已滅（touch-callout/user-select/touch-action/gesturestart 全鏈，複查通過，未重工）                         |
| 9   | `position: fixed` 根元素於 iOS 26 鍵盤場景會裁切 app shell                               | 本遊戲無文字輸入，維持 fixed 殼；記錄為已知邊界                                                                  |

## 35. v5 暫停系統與離頁自動暫停

- HUD 暫停鍵：頂列右上（靜音鈕左側 48px，top-right 硬熱區遠離戰鬥區），雙豎條圖形紋理、48px 觸控目標；配額顯示左移讓位。桌機備援：ESC / P。
- 暫停選單（`systems/pause.ts`，DOM 覆層——旋轉殼下 hit-test 天然正確、覆蓋虛擬鍵防誤觸）：繼續／重新開始／回主選單。
- 全停語義：`scene.pause(Game)`（物理/計時/tween/輸入輪詢全停）＋ `AudioContext.suspend()`（BGM 與 SFX 全停）。
- 重新開始＝重置當前關卡全狀態（血量/彈藥/擊殺數/計時/實體經 scene.restart 重生），保留已完成關卡累計用時與本輪死亡數。
- 離頁自動暫停：`visibilitychange`（hidden）與 `pagehide`（同走 hidden 檢查防雙觸發）即開暫停選單；回前景停在選單、玩家點「繼續」才接續（取代 §26 的自動恢復，杜絕回前景瞬間被偷襲）。音訊恢復一律走手勢堆疊內 `resume()`（§33 條目 6），刻意暫停期間全域復聲保險不生效。
- 與 PWA 週期更新 hooks（main.ts `import './pwa'`）共存：兩者互不依賴，同檔並列。**更新套用經殼層安靜閘**（§118.4）——遊戲進行中與暫停選單期間絕不 reload。

> **已廢止**（v19 §118.4 起）：原記為可接受權衡的已知邊界「回前景恰逢新版部署時，autoUpdate 的 reload 會蓋過暫停選單，不特別攔截」——該競態已由更新閘根治。

## 36. v5 開場主選單與圖鑑/技能介紹

- Title 開場動畫：主標縮放彈出（Back.easeOut）、副標延遲淡入、主角自天而降 Bounce 落定＋光暈淡入；維持既有美術風格與 zzfx 音效（選單按壓 pop）。
- 主選單：開始遊戲（主鈕）＋次選單列 **世界地圖／圖鑑／技能介紹／設定** 四鈕（DOM 鈕承接命中，data-menu 標識）；按鈕配置自設定頁轉入（§118.2），桌機另增常駐「操作說明」（§87.4）。

> **已廢止**（v6 §39／v19 §118.2 起）：次選單列為 圖鑑／技能介紹／按鈕配置 三鈕（無世界地圖、按鈕配置為 Title 直鈕）。

- 圖鑑/技能介紹（`CodexScene` 單場景雙分頁，資料 SSOT `core/codex.ts`，立繪一律取既有 sprite 資產、禁止新美術）：
  - 圖鑑分頁（怪物）：**23 隻分頁呈現，每頁 12 格 6×2**＋底緣翻頁列（§104）——立繪＋名稱＋行為一句話＋可吸/不可吸圓點標記。
  - 技能分頁：吸入／**星彈九系**（含來源怪物對應）／混合星／強化星／星暴／下衝擊／殼盾／雷鏈／漂浮，**有界網格 3 欄 3 列**（§96）。
  - 成就分頁：21 條徽章 6 欄網格（§94.3）。

> **已廢止**（v9 §59／v16 §96／§104 起）：圖鑑單頁 4×2 八格（其後 5×2／7×2／8×2 亦為過渡值）；技能分頁固定雙欄五列與「星彈三系／七系」敘述。

- 分頁切換以 scene.restart 重建（選單輕量無局內狀態）；ESC 或返回鈕回 Title。

## 37. v5 全元素位置稽核

- 稽核腳本：`scripts/capture-audit.mjs`——Title/Game/Boss/Result（＋v5 新頁）於 390×844（直握旋轉殼）與 926×428（寬幅橫持）截圖至 `screenshots/starpuff-v5-audit/{before,after}/`。
- 檢查項：HUD（血條/彈藥/擊殺進度/計時/boss 條）、虛擬鍵、彩蛋提示、教學文字——重疊/出界/safe-area 裁切/離熱區過遠。
- v5 修正：暫停鍵擠入頂列後配額右錨左移（width-112/126）避免熱區重疊；B 鍵離開 A 鍵斜上緊鄰位，垂直間距 ≥80px。
- Boss 條頂中置於兩檔寬皆不與左上心心、右上配額/暫停/靜音重疊（854 與 1200 邏輯寬實測）。
- v6 增列：版本號頁腳（§42）置於 Title 底緣中央（height-6、12px 小字），不與次選單列（height×0.85）重疊。

## 90. v14 PWA 安裝偵測與分平台指引

- 偵測矩陣（installGuide.ts，移植 RateWise 模式）：platform
  （ios／android／desktop／unknown，含 iPadOS 桌面模式 maxTouchPoints 辨識）、
  in-app browser（Threads/Barcelona、Messenger 先於 Facebook、Instagram、
  LINE、TikTok/musical_ly/trill、X）、已安裝雙訊號
  （display-mode standalone＋navigator.standalone）。
- 指引卡（§92 殼層卡片）：iOS 分享→加入主畫面步驟；Android
  beforeinstallprompt 一鍵安裝＋選單步驟 fallback；in-app 引導外部瀏覽器開啟。
- 卡片共用 imagegen 生成的 StarPuff 風格教學插圖（`src/assets/ui/pwa-install-onboarding.webp`），
  以輕微漂浮動畫示範「瀏覽器 → 加入主畫面」；插圖是殼層資產，不進關卡 manifest。
- 出現邏輯：已安裝／已忽略（localStorage `sp-install-dismissed`，不進 save
  schema）／桌面不打擾；首次到站延遲 2.5s 且僅 Title 安靜時刻顯示；
  appinstalled 自動收卡並記憶。

### 90.1 觸控新手操作提示（首次五場）

- GameScene 僅在 Title／世界地圖開啟一場新遊戲時消費一次 `sp-settings.controlHintsPlayCount`；
  前五場顯示可捲動、可關閉的模態教學卡，玩家按「開始玩」後才恢復搖桿／按鍵操作，死亡重試、
  同一輪換關與桌機鍵盤遊玩不重複攔截。
- 教學單一文案提示：左手大拇指操控搖桿左右、右手大拇指按 A 跳躍、右手食指按住
  B 吸入（放開或短按吐出），B 長按可連續吸取多隻；設定可永久關閉並轉入按鈕配置調整位置。
- 教學插圖（`src/assets/ui/control-hints-onboarding.webp`）沿用 StarPuff 可愛角色與怪物語彙，
  以 CSS 輕微漂浮呈現，不改變 Phaser 關卡資產載入。
- 行動裝置橫持時採 viewport-level 卡片與自適應雙欄，優先讓五項提示與操作列一次完整呈現；
  極矮視窗保留卡片內垂直捲動。直持時卡片保持正向可讀，且模態開啟期間不讓卡片下方的搖桿／A／B
  觸控誤觸，關閉後才恢復遊戲操作。

## 91. v14 觸覺回饋與螢幕常亮（調研加碼，ROI 閘通過二項）

- 觸覺（haptics.ts）：查表跟隨 playSfx 觸發點——僅重擊／里程碑
  （hurt/slam-down/boss-slam/boss-roar/starstorm/win/lose）配短震（單段
  ≤100ms、總長 ≤200ms 守門單測）；高頻一般音效不震防疲勞；靜音早退即同步
  不震；iOS 無 Vibration API 靜默降級。
- 螢幕常亮（wakeLock.ts）：Screen Wake Lock 生命週期跟隨 `#controls.is-active`
  （遊戲進行中取得、離場釋放、回前景重取）；不支援或被拒（省電模式）靜默降級。
- 落選（backlog）：fullscreen API（iOS 不支援且與 standalone 重疊）；安裝後首啟引導與
  觸控教學已由 §90／§90.1 落地。

## 92. v14 殼層卡片基建（shellCards.ts）

- 安裝指引與方向告知共用：`whenShellIdle`（1s 輪詢）僅在 Title
  （data-menu="start" 存在）且殼層安靜（無 controls is-active／is-configuring／
  pause-overlay／既有卡）時顯示——杜絕戰鬥中彈窗攔截操作。
- viewport-level 卡片：overlay 掛在 `document.body`，以 `position:fixed`、`100dvh`、
  safe-area padding 對齊玩家實際看到的視口；不進旋轉遊戲殼，避免直持祖先 `rotate(±90deg)`
  讓文字與捲動軸轉向。PWA／方向／恢復卡仍是非模態殼卡；操作提示與設定是可捲動模態，
  由焦點鎖與 overlay hit-test 保護操作邊界。
- 橫持 844×390 實測：PWA／方向／設定修復／儲存不可用卡片與操作提示、暫停、設定、按鈕配置
  均以 AABB 檢查卡片與每顆按鈕完全落在 viewport；設定與操作提示在極矮視窗可內捲，操作列 sticky。
  殼層卡支援可選教學插圖、`aria-modal=false` 對話框語意＋Escape 關閉；操作提示／設定卡
  另支援 `aria-modal=true`、焦點鎖與模態 hit-test。
- 開玩自動收卡：MutationObserver 監聽 `#controls.is-active`，進遊戲即收
  （不記憶忽略，下次回 Title 再顯示）。

> **已廢止**（2026-08-03）：舊版將 shell card／操作提示掛在旋轉 `#game-shell` 內，並以左上
> 固定卡與 `max-height:72%` 假設所有手機高度足夠；真實 844×390 橫持測試曾出現 PWA 按鈕、
> 操作提示項目與設定列被裁切，故改採本節 viewport-level SSOT。

### 92.1 方向提示與模態截圖驗收

- 直持且尚未觀測到橫持時顯示「橫持遊玩體驗更佳」；按「知道了」不寫入完成記憶，
  重新進入直持仍提示。只有實際偵測到 landscape 才寫入 `sp-orientation-landscape-seen=1`
  並收起卡片；舊 `sp-orientation-hint` 只做清理，不再阻擋新流程。
- Playwright `e2e/modal-landscape.spec.ts` 以 Mobile Chrome（844×390）與 Mobile Chrome Portrait
  （390×844）實測並截圖 `screenshots/modal-landscape/`：PWA、方向、操作提示、暫停、設定、
  按鈕配置、回訪方向更新、設定損毀修復、儲存不可用共九類卡片／模態；console error 必須為 0。

## 93. v14 殼局部 safe-area 量測（canvas 內 HUD 避讓預備）

- `core/safeArea.ts`：讀 `#keys-layer` computed inset（CSS 已依 cw/ccw 換軸、
  含地板值）→ 扣除地板取净 inset → 依邏輯寬／canvas CSS 寬換算邏輯 px；
  供 canvas 內 HUD（暫停／靜音鍵）避讓瀏海與 home indicator 接線。

## 96. v16 圖鑑分頁有界網格（P1-01，取代 §36 技能雙欄與 §94.3 成就網格常數）

- 根因（Sonnet 席數學實證）：技能分頁雙欄 5 列（y=122+⌊i/2⌋×84）第 9 項
  y=458、說明底緣 486 超出邏輯畫布 480；內容卡背景亦僅至 457。
- 修法：`core/gridLayout.ts` 有界網格純函式——可容列數由縱向預算推導
  （floor((maxY−itemH−startY)/rowH)+1，至少 1）、欄隨量增（仿 §76 固定列
  策略）；分頁參數收斂 `core/codex.ts` CODEX_TAB_GRIDS 單點（技能
  122/100/90、成就 112/90/84，maxY 一律 470）。
- 技能分頁 3 欄 3 列：操作方式緊隨名稱動態排列（非固定 96px 偏移，最窄格
  不越格）、詳述 12px 逐字換行；成就分頁接同一工具（21 條維持 6 欄 4 列
  零視覺變化），條目成長自動擴欄不溢出。
- 守門單測 gridLayout.test.ts：任何分頁內容不得超出 y=470（含技能 12 項／
  成就 30 條成長情境）、技能文案長度上限（詳述 ≤72 字）、CodexScene 引用
  SSOT 跨檔守門（禁第二份網格常數）。

## 98. v16 選單 DOM 鈕命中短邊保底（D2，補充 §33 條目 7）

- 根因（Grok 席）：DOM 鈕以邏輯尺寸 × canvas 縮放直出 CSS 尺寸；直持 390×844
  殼縮放 ×0.812 把次選單 56 邏輯高壓到 45.5 CSS px（低於 HIG 44pt 帶餘裕的
  48px 基準），主 CTA 72→58.5 尚可但無守門。
- 修法：`core/domButton.ts` `menuHitCssRect` 純函式——命中短邊 48px 保底、
  對稱擴張（中心不漂移、視覺不變）；`hud.ts addDomButton` relayout 一律經此
  換算（Title/Map/Codex/Result 全場景 DOM 鈕自動受益）。
- 驗證：domButton.test.ts 量測單測（直持縮放矩陣全鈕 ≥48、已達標邊不放大、
  中心對稱、未縮放殼同樣吃下限）；portrait e2e 於 Title 實測五顆選單鈕
  AABB 短邊 ≥48。

## 100. v16 勝利結算「下一關」主 CTA（D3，取代 §39 勝利回地圖單一動線）

- 根因（Grok 席）：魔王關擊破後結算僅「世界地圖」，接續遊玩需地圖折返一次，
  斷了闖關節奏。
- 修法：一般勝利雙鈕——主 CTA「下一關」（nextLevelId 資料驅動，直入下一區
  首關）＋「世界地圖」降次選；ENTER 對應主 CTA。Result 勝利僅魔王關觸發
  （走動關經星星門直進地圖揭霧），L20 全破走謝幕不經 Result，故一般勝利必有
  下一關（資料防禦仍回退地圖）。EX 勝利與敗北動線不變（再戰 EX／再戰魔王）。
- 驗證：v16 e2e——L4 擊破後 next-level 直入 L5、map 次選並存；smoke 勝利案
  改走 map 次選鈕。

## 101. v16 HUD 暫停/靜音 DOM 化（F-06＋D4，取代 §35 暫停鍵與修復包 B 靜音鈕的命中層）

- 根因（Composer/Grok/Sonnet 三席交集）：局內暫停/靜音為 canvas 熱區——
  自動化不可達、讀屏不可見，旋轉殼下依賴 transformPointer 補償。
- 修法：命中改由同位 DOM 鈕承接（`addDomButton` 支援 rect getter 隨視寬/inset
  動態錨定，data-menu=pause/mute＋aria-label；靜音帶 aria-pressed 狀態），
  canvas 圖示保留純視覺、移除 interactive（沿 recon-v4 A.3 單一命中路徑）；
  `pause.ts addButton` 補 aria-label。
- 命中尺寸：邏輯 44×44 經 §98 短邊 48px 保底，直橫持皆達標。
- 驗證：v16 e2e（暫停開選單真凍結→繼續、靜音 aria-pressed 與靜音偏好同步
  翻轉——v19 §118.1 後偏好真值為 `sp-settings.audioMuted`）；portrait e2e
  真觸控點暫停即凍結、pause/mute AABB 短邊 ≥48。

## 103. v16 標題字形品牌化（D6，補充 §36）

- 根因（Grok 席）：主標 system-ui 純白字＋單層描邊，讀感是「預設字體」而非
  品牌 logo。
- 修法（零新字型檔）：雙層字形——底層深紫厚描邊（stroke 12）下沉 5px 造
  糖果貼紙立體感；頂層白字帶垂直粉漸層 tint（四角 tint 上白下粉）＋柔影
  （blur 6）＋細紫描邊；副標 StarPuff 加粗＋白描邊。禁重依賴（不引字型檔）。

## 104. v16 怪物圖鑑分頁（F-03，取代 §76 單頁定案）

- 根因（Composer 席）：23 隻 × 12 欄 2 列——854 最窄殼 cellW 67px、行為敘述
  4-5 字/行，直持過密難讀（§76 當年以 18 格評估的 cellW≈89 已被 v12 圖鑑
  補完擠破）。（v17 訂正：CODEX_MONSTERS 實為 23 隻（12+11），原文 24 為
  敘述失準；ceil 分頁斷言不受影響。）
- 修法：接 §96 有界網格——每頁 12 格 6×2（MONSTER_PAGE_SIZE，cellW 回到
  134+），底緣「上一頁／第 n/N 頁／下一頁」翻頁列（restart 帶 monsterPage，
  沿分頁切換慣例；單頁不顯示）；頁序沿 CODEX_MONSTERS，未來新增怪自動增頁。
- 驗證：gridLayout 守門（每頁 6×2 ≤470、23 隻恰兩頁）；v16 e2e 翻頁雙向；
  854/1200/直持截圖對照。
