# 星噗噗 — 存檔、使用者設定與成就

> **職責範圍**：所有跨場次持久化的東西。存檔 schema 與容錯／備援、重置進度語意、成就系統與補發、使用者偏好單鍵 SSOT（`sp-settings`）與統一設定頁、PWA 更新套用時機閘。
>
> **不在本檔**：偏好所控制的行為本身——虛擬鍵布局規格見 `01-controls-input.md` §34/§89/§95；震屏與演出見 `07-art-audio-fx.md`；PWA 安裝指引見 `06-ui-shell-pwa.md` §90。
>
> **現行儲存鍵**：`sp-save`（存檔，schema v2）／`sp-save-backup`（備援）／`sp-settings`（全部偏好，schema v1）。`sp-muted`、`sp-rotation`、`sp-key-layout` 已於 §118.1 收斂，僅作一次性 migration 來源。
>
> **閱讀慣例**：每一句主文都是現行有效規則；被取代的舊規則一律降級為緊接其後的 `> **已廢止**` 附註，僅供追溯。索引與取代對照見 [`../GAME_DESIGN.md`](../GAME_DESIGN.md) 與 [`99-superseded.md`](99-superseded.md)。章號 §N 為全專案穩定識別碼（程式註解直接引用），拆檔不重新編號。

## 38. 存檔系統（core/save.ts 為 SSOT，pure TS 可測）

- localStorage `sp-save` **schema v2**：`{ schemaVersion, highestClearedLevel, levels: { [id]: { cleared, bestTimeMs, eggsFound: string[], exCleared? } }, lastPlayedAt, achievements, checksum }`（`achievements` 見 §94.2、`checksum` 與備援鍵 `sp-save-backup` 見 §118.3）。

> **已廢止**（v15／v19 起）：schema v1（無 `achievements`、無 `checksum`、無備援）——v1 舊檔由 `parseSave` 遷移，禁 discard。

- 寫入時機：通關（星星門吸入當下即寫，演出中斷不掉進度）、魔王擊破、彩蛋觸發（`trigger` 型別字串為關內唯一 id）。
- 容錯（沿用 §34 鍵位布局 parse/fallback 模式）：schema 版本不符、形狀損毀、隱私模式拋錯——一律回退預設值；`highestClearedLevel` 由關卡條目重新推導，不信任持久化值。
- `bestTimeMs`＝該關單次成功嘗試的最短用時（死亡重試重計）；`eggsFound` 去重持久化，跨局累計。
- 重置進度：世界地圖左下「重置進度」兩步確認（武裝態 3s 未確認自動退回），**清 `sp-save` 與備援 `sp-save-backup`**（§118.3；不清則會自備援恢復舊進度），偏好（`sp-settings`）不動。全新存檔不顯示入口。

> **已廢止**（v19 §118.3 起）：清除範圍僅 `sp-save`；當時的偏好鍵表述為「`sp-key-layout`、`sp-muted` 不動」。

- 入口位置裁決：重置進度**維持在世界地圖**——進度顯示與進度管理同場景（KISS）。Title 雖已有「設定」入口（§118.2），仍不搬入。

> **已廢止**（v19 §118.2 起）：原偏離備註的前提「本遊戲無設定頁（按鈕配置為鍵位編輯器，語義不符）」——設定頁已存在，但入口裁決結論不變。

## 94. v15 成就系統（logic/achievements.ts，純呈現層聚合）

### 94.1 設計原則

- 成就 SSOT＝`logic/achievements.ts` 單一資料表（id／名稱／描述／分類／隱藏與否／
  判定函式），共 21 條；全部由既有 save 資料派生判定（`cleared`／`bestTimeMs`／
  `eggsFound`／`exCleared`），**禁止侵入式遊戲邏輯鉤子**——evaluator 讀 save 即得
  已解鎖集合，遊戲熱路徑零新增寫入點。
- 魔王條目（五王首勝＋五王 EX）由 `LEVELS` 派生（沿 §86 `BOSS_LEVEL_IDS` 慣例，
  禁第二份硬編清單）；命名表以 `Record<BossKind, …>` 鍵定，加王時型別強制補名。
  隱藏成就對應關卡由彩蛋觸發器反查 LEVELS，彩蛋總數同樣派生。
- 分類五種：進度（首關／全 30 關）、魔王（各王首勝／EX 各王／星核制霸——與 §86
  `exConquestDone` 同源判定）、收集（彩蛋 1／10／全收）、技巧（任一魔王關
  120s／60s 內通關，門檻依 v13 bot trace 證據校準）、隱藏（三個魔王專屬彩蛋：
  雙子連破／窯風三連／星核共鳴，未解鎖顯示「？？？」）。
- 玩法類（九系星彈全用過／星化三形態）裁決不做：save 無 flavor/form 使用紀錄，
  為此擴 save 需熱路徑攔截非極低成本，違反本章零侵入原則。

### 94.2 存檔 schema v2 與補發（versioned migration）

- `SaveData.achievements: string[]`＝已頒發成就 id——**toast 去重基準**，頒發紀錄
  不可逆（資料回退不移除）；解鎖「顯示」恆由 save 即時派生，stored 只管去重。
- `SAVE_SCHEMA_VERSION` 升 2：`parseSave` 接受 v1（v9–v14 世代）與 v2——v1 缺
  achievements 補空集後照常收斂條目，**禁 discard**；寫出恆為 v2。
- 補發單點＝main.ts 開機：`awardAchievements(loadSave())` 依既有資料靜默補發
  歷史成就（無 toast 轟炸），有增量才落盤（全新玩家不預建存檔）；版本更新新增
  成就同走此路自動補發。

### 94.3 呈現三層（解鎖不漏看）

- 遊戲內 toast：GameScene `persistAndAward` 單點（彩蛋／通關／EX 三個存檔寫入點
  寫後評估增量）→ **同批多解鎖合併單張橫幅**（頓號串接，勝利轉場 2.8s 窗口內必可
  播完整批）、跨批序列佇列不重疊（約 2.1s/張）；金色橫幅帶深色底襯（勝利白閃下
  仍可讀），禁全屏遮罩；e2e 觀測點 `__sp.achievementToast()`（canvas 文字不可由
  DOM 查詢）。轉場即隨場景銷毀，由下兩層兜底。
- 結算名單：`GameResultData.unlocked`（additive optional）帶本局勝利瞬間新頒發
  id 進 Result 金底列示（Credits 轉接保留）——魔王擊破多重解鎖不因 WIN_DELAY
  轉場漏看；敗北局內解鎖的彩蛋成就同樣如實列出。
- 成就頁：CodexScene 第三分頁（`CodexTab` 加 'achievements'，分頁鈕等距展開）；
  6 欄徽章網格（fx-star tint＋圓底程序繪製，零新圖）、已解鎖亮金微轉動／未解鎖
  灰、隱藏未解鎖名稱「？？？」描述「隱藏成就」、右上「解鎖 n/21」計數；
  網格與計數依 §93 净 inset 收縮（854／1200／直持 390×844 三視口驗證）。

### 94.4 驗證

- 單測 achievements.test.ts：資料表不變式（id 唯一／21 條／boss 覆蓋派生守門）、
  全類別邊界（19/20、4/5 EX、彩蛋 9/10、速通 120000/120001 與 0 不計）、
  awardAchievements 冪等與增量、v9–v14 各世代舊存檔載入補發精確集合。
- 實測 scripts/v15-verify.mjs 五幕：v1 滿進度開機補發 21 條＋schema 升 v2、
  真實擊破管線多重解鎖（toast＋Result 名單）、854／1200／直持成就頁、
  console error 全程 0。

## 118. 使用者設定 SSOT、存檔備援與 PWA 更新閘（#819；T7-A 列車）

現行偏好與持久化 SSOT。取代散落 localStorage 鍵敘述：§9 靜音鍵、§34/§89/§95.2 鍵位
布局鍵、§87.1 旋轉方向鍵，以及 §38 的「本遊戲無設定頁」偏離備註與重置範圍描述。

### 118.1 UserSettings 單鍵 SSOT（core/settings.ts）

- 儲存鍵 `sp-settings`（`SETTINGS_SCHEMA_VERSION = 1`）為**唯一偏好真相**，欄位：
  `audioMuted`／`hapticsEnabled`／`wakeLockEnabled`／`reducedMotion`／`screenShake`
  （`off|low|full`）／`shellRotation`（`cw|ccw|null`，null＝從未選擇供 §87.2 一次性
  告知判定）／`keyLayout`（§89 v2 子樹，null＝預設態不落盤，§95.2 語意不變）。
- `reducedMotion` 預設尊重系統 `prefers-reduced-motion`（WCAG 2.3.3）；非瀏覽器環境 false。
- `controlHintsEnabled`／`controlHintsPlayCount` 為觸控新手教學偏好：預設開啟、前五場
  新遊戲各提示一次（計數夾在 0–5）；設定可永久關閉，死亡重試與同一輪換關不重複計數。
- **一次性 migration**：首次讀取時吸收 legacy 散鍵 `sp-muted`／`sp-rotation`／
  `sp-key-layout` 為初始值（值損毀逐項回預設），**落盤成功即刪除三個 legacy 鍵**
  （單真相；PWA 部署單向前進，回滾非支援路徑，殘留舊值會在主鍵遺失時被吸回過期偏好）。
  例外語意：`persist` 失敗（隱私模式／配額滿）**保留 legacy 作下次開機來源**。
- 主鍵損毀（JSON 壞損／版本不符／形狀損毀）：回退 legacy 吸收並回寫修復，不以預設
  靜默覆蓋；置 `wasSettingsRecoveredFromCorruption` 旗標，main.ts 於 Title 安靜時刻
  以殼卡（§92）明確告知。
- 一次性記憶鍵（`sp-rotation-notice`／`sp-install-dismissed`／`sp-desktop-keys`／
  `sp-orientation-hint` 等）非偏好，**不入本 schema**。
- 已知限制：偏好經記憶體快取、無 storage event 跨分頁同步——多分頁併發寫入為
  last-writer-wins（單分頁互動情境，接受此限制）。

### 118.2 統一設定頁（systems/settingsPage.ts，取代 §38「無設定頁」備註）

- Title 次選單第四鈕「設定」（`data-menu="settings"`）開啟純 DOM overlay（沿
  keyConfig／shellCards 慣例，不進 Phaser Scene）；容器沿用 `.install-overlay`
  class，`isShellBusy` 天然視為忙碌（與 PWA 套用／殼卡排隊互斥）。
- 內容：音效／震動回饋／遊戲中螢幕常亮／減少動態效果／操作提示（前五場）五開關＋
  震屏強度三段（關／弱／全）＋「按鈕配置（位置與持向）」轉入口（§34 keyConfig 專頁
  由此轉入，不再是 Title 獨立鈕）＋「完成」。ESC 關閉。
- **即改即存**，無草稿語意（草稿／取消回滾僅存在於按鈕配置頁，§87.2/§95.2 不變）；
  音效切換同步 mute 系統，震動開啟時輕震一次即時回饋。
- 震屏／閃光偏好落地（`systems/cameraFxGate.ts`）：一次性包裝 main camera 的
  `shake`／`flash`，全部 boss／fx 呼叫端零改動即受管——`reducedMotion` 或
  `screenShake:'off'` 時震屏強度 ×0（直接不震）、`low` ×0.5、`full` ×1；
  `reducedMotion` 另將 flash 時長 ×0.3（未帶參呼叫以 Phaser 預設 250ms 為基準）。
  偏好每次呼叫重讀，設定頁改動即時生效。

### 118.3 存檔備援與 checksum（core/save.ts，補訂 §38）

- schema 現值 v2（§94.2 已升版；§38 的 v1 敘述為 v6 歷史值）。寫入時附
  `checksum` 欄；解析時 checksum 不符／JSON 壞損／未知版本一律判**損毀**。
  legacy 存檔（無 checksum 欄）視為合法，不誤殺舊玩家。
- 備援鍵 `sp-save-backup`：每次寫入前把**上一份合法主檔**輪替至備援（損毀資料不
  污染備援）；主檔損毀時自備援恢復並回寫自癒，備援亦不可用才回退預設——兩路徑
  皆 `console.warn` 留痕，不再默默歸零。備援輪替失敗（配額不足／隱私模式）不得
  阻斷主檔寫入。
- **重置進度範圍修正**（取代 §38 的「僅清 `sp-save`」）：`resetSave` 同時清除
  `sp-save` 與 `sp-save-backup`（否則重置後會自備援恢復出舊進度）；偏好
  （`sp-settings`：靜音／鍵位／持向等）不動。入口與兩步確認語意沿 §38 不變。

### 118.4 PWA 更新套用時機閘（pwaUpdateGate.ts）

- 新版 SW ready 只標記 pending，**遊戲進行中絕不 reload**；僅在殼層安靜
  （非 GameScene／非配置中／無殼卡＝Title/Map/Result 選單面，忙碌訊號沿
  `shellCards.isShellBusy` 單一 SSOT）才自動套用。
- 套用寬限 1500ms：條件成立後再等寬限期並重驗，期間殼層轉忙（再入遊戲）即放棄
  本次套用交還重試管線——避免場景切換瞬間 reload 吃掉使用者正要按下的點擊
  （Result「下一關」CTA 競態，§100）。
- 邊界事件漏接保險：pending 期間每 5s 低頻重試；`#controls` class 變化
  （MutationObserver）＝遊戲進出場邊界，離開 GameScene 當下即嘗試套用。
- 取代 §35 的已知邊界敘述「autoUpdate 完成後的 reload 會蓋過暫停選單」——該競態
  已由本閘根治（暫停選單期間 `#controls.is-active` 仍為真＝殼層忙碌，不會套用）。
