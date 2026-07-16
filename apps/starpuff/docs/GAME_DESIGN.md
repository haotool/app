# 星噗噗 StarPuff — 遊戲設計 SPEC（SSOT）

> 手機優先 PWA 動作小遊戲。穿越層層果凍關卡、吸入果凍怪、化為星彈、擊敗果凍魔王。
> 版本：v6.0（PM 親撰；v6 存檔/世界地圖/新技能/手感 §38-§43、v5 控制自訂/暫停/圖鑑/開場 §33-§37、v4 免轉向與元素包 §28-§32、v3 橫式轉向 §21-§27）｜路由：`https://app.haotool.org/starpuff/`｜24h 衝刺交付

## 1. 產品定位

- 橫式（landscape）四關側向卷軸動作遊戲：三關走動探索 + 魔王關（Boss Rush 收尾），單局 2–4 分鐘，可無限重玩。
- 原創 IP：主角與怪物皆為原創設計（果凍星球世界觀），嚴禁使用任天堂卡比之名稱、造型、配色構圖。
- 目標體驗：Q 彈、可愛、爽快——大量擠壓拉伸、粒子、震屏、音效回饋。

## 2. 核心循環

移動/跳躍/漂浮 → 長按吸入小怪 → 吞下獲得星彈（上限 3）→ 點按發射星彈打魔王 → 閃避彈幕與衝撞 → 擊破勝利。

## 3. 場景流程

`BootScene`（載入+進度條）→ `TitleScene`（標題、開始按鈕、音效提示）→ `MapScene`（v6 世界地圖 hub，§39）→ `GameScene`（四關制）→ `ResultScene`（勝/敗）。

四關制流程：Title → Stage 1-3 側向卷軸（擊殺配額達成 → 星星門開啟 → 走入過關）→ Stage 4 魔王戰（入場動畫 → Boss 戰，期間補生可吸小怪供彈藥）→ 勝利星爆 / 敗北。死亡處理：Stage 1-3 重試當前關；魔王關進敗北結算。關卡資料驅動細節見 §15。（v6 已由 §39 取代直達下一關的轉場卡：過關寫入存檔後自動進世界地圖，自地圖節點進下一關或重玩。）

## 4. 操作（行動裝置優先）

- 左半屏：浮動搖桿（觸點即中心、半徑 60px、死區 12px；水平移動 + 下向偵測供下衝擊，規格見 §21）。
- 右側：A/B 圖形圓鍵（斜排布局 v5 已由 §34 取代：B 移右側偏上食指區、位置可自訂）——A 跳躍（空中連按＝拍翅漂浮，最多 3 次，落地重置）；B 吸/射（無彈藥＝按住吸入；有彈藥＝點按發射，長按仍可吸）。
- 鍵盤（桌機備援）：←→ / Z 跳 / X 吸射。
- 全域：`touch-action: none`、禁雙擊縮放、首次觸控解鎖 AudioContext。

## 5. 角色設定（全部原創）

| 角色 | 名稱           | 外型                                   | 行為               | 數值                                   |
| ---- | -------------- | -------------------------------------- | ------------------ | -------------------------------------- |
| 主角 | 噗噗 Puffpo    | 薄荷奶油色圓球、頭頂星星呆毛、桃色腮紅 | 移動/跳/漂浮/吸/射 | HP 5、受擊無敵 1.5s                    |
| 小怪 | 果凍丁 Jelly   | 草莓粉果凍方塊、瞇瞇眼                 | 定期彈跳朝玩家     | HP 1、觸碰傷害 1、可吸                 |
| 小怪 | 飄飄 Floaty    | 薰衣草紫圓鳥、小翅膀                   | 正弦飄移           | HP 1、觸碰傷害 1、可吸                 |
| 小怪 | 刺刺瓜 Spiky   | 萊姆綠刺球、壞笑                       | 地面滾動衝刺       | HP 1、觸碰傷害 1、不可吸（吸會被彈開） |
| 魔王 | 果凍王 Jellord | 巨大葡萄紫果凍、金皇冠、跋扈眉         | 見 §6              | HP 60、身體傷害 1                      |

## 6. 魔王 AI（有限狀態機，pure TS 可測）

- P1（HP > 50%）循環：`idle(1.2s) → jellyRain(5 顆拋物線彈) → idle → slam(跳起落地雙向地面震波) → idle → …`
- P2（HP ≤ 50%）：變紅憤怒、速度 ×1.3，新增 `dash`（水平衝刺，牆邊回彈）；jellyRain 升為 7 顆。
- 受擊：白閃 + 抖動 + 傷害數字；每損 10 HP 補生小怪。
- 死亡：慢動作 0.5s → 星爆粒子 → 勝利。

## 7. 戰鬥數值

- 玩家：移速 220px/s、跳躍初速 -420、漂浮升力 -260、重力 900。
- 吸入：長按 ≥150ms 啟動、錐形範圍 140px、拉力漸增；吞下 +1 彈藥（上限 3）。
- 星彈：傷害 5、速度 520、穿透 1 隻小怪、命中魔王消失。
- 邏輯畫布：854×480（橫式，Scale.FIT；v4 改 NO_CENTER 由旋轉殼定位，見 §28）；解析度採 Scale.FIT 自適應，不做 DPR cap（欄位已於修復包 B 移除）。

## 8. Juice 清單（品質關鍵，全數必做）

hit-stop 60ms、震屏 4px、受擊白閃、squash & stretch（跳躍/落地/吸入鼓脹）、吸入漩渦粒子、星彈拖尾、傷害數字浮動、魔王死亡星爆、HP 心心受擊跳動、按鈕按壓回饋、入場/退場 tween。

## 9. 音效（zzfx，零音檔資產）

jump、flap、inhale（迴圈）、swallow、shoot、hit、hurt、metal（皇冠落地）、pop（puffy 爆裂）、chomp（咬咬花咬合）、boss-roar、boss-slam、win、lose；BGM 用 zzfx 合成短循環（手刻序列混音，零依賴）。首次觸控後 resume AudioContext（iOS 必須）。靜音偏好存 localStorage（sp-muted）。

## 10. 美術資產規格（codex imagegen 專用；除此之外嚴禁動用 codex）

統一風格關鍵詞（每次生成必附）：
`kawaii chibi jelly creature, soft pastel palette, thick rounded soft outline, glossy jelly highlight, flat cel shading, clean high-quality mobile game sprite, centered, full body`

透明需求資產以 flat #00ff00 背景生成後去背。生成尺寸 2048×2048（bg 為 1024×1536），交付至 `apps/starpuff/src/assets/sprites/`。表列 `.png` 為生成源檔名；實際入庫交付為同名 `.webp`（q82 壓縮，透明保留）。

| 檔名              | 內容                                        | 備註                                                 |
| ----------------- | ------------------------------------------- | ---------------------------------------------------- |
| hero-idle.png     | 噗噗待機：圓潤微笑、星星呆毛                | 薄荷奶油 #BFF3E0、腮紅 #FFB7A0                       |
| hero-inhale.png   | 噗噗張大嘴吸入                              | 嘴佔臉 40%                                           |
| hero-puffed.png   | 噗噗雙頰鼓滿                                | 含住星星微光                                         |
| hero-hurt.png     | 噗噗受傷 >\_<                               | 淚珠                                                 |
| minion-jelly.png  | 果凍丁                                      | 草莓粉 #FFB3C7                                       |
| minion-floaty.png | 飄飄鳥                                      | 薰衣草 #CBB7F0、小翅                                 |
| minion-spiky.png  | 刺刺瓜                                      | 萊姆 #D9F29B、短刺                                   |
| boss-idle.png     | 果凍王+金皇冠                               | 葡萄紫 #9B7BD8、跋扈眉                               |
| boss-enraged.png  | 果凍王憤怒紅化                              | 紅暈 #FF6B6B、怒目                                   |
| fx-star.png       | 五角星彈+光暈                               | 金黃 #FFD966                                         |
| bg-arena.png      | 直向粉彩天空果凍島戰場（1024×1536，不去背） | 底部 1/3 乾淨平台區、上 2/3 雲朵漸層 #FDEFF6→#D6ECFF |

走路/跳躍動畫一律用程式 tween（squash/stretch/bob/rotate）實現，不生成逐幀序列。PWA icon 由 hero-idle 裁切導出。

## 11. 技術架構

- Vanilla TypeScript + Vite + Phaser（最新穩定版）+ vite-plugin-pwa + zzfx。**不用 React**（遊戲 canvas 無需，KISS）。
- Arcade Physics、object pool（彈幕/粒子）、`base: '/starpuff/'`。
- 目錄契約（並行開發邊界，各 stream 只改自己的檔）：

```
src/game/core/     config.ts events.ts types.ts     ← scaffold 定義，凍結
src/game/scenes/   Boot/Title/Game/Result           ← 整合 stream 專屬
src/game/systems/  player controls enemies waves boss fx hud
src/game/audio/    sfx.ts bgm.ts
src/game/logic/    combat.ts bossFsm.ts levels.ts    ← pure TS，vitest 對象
```

- 事件契約（`events.ts`，跨系統唯一溝通管道；v3 增列 `player:healed` 與 `skill:*` 技能結算事件；v4 增列 `boss:quake` P3 全場震落事件）：
  `player:damaged, player:healed, player:died, ammo:changed, enemy:inhaled, enemy:killed, star:fired, skill:starstorm, skill:slam-landed, boss:spawned, boss:damaged, boss:phase, boss:quake, boss:defeated, level:changed, level:quota, level:gate-opened, game:won, game:lost`

## 12. 品質門檻

- 效能：60fps（中階機）、JS gzip < 1.6MB、首屏 < 3s（4G）。
- PWA：可安裝、離線可玩、manifest 完整、無 console error。
- 測試：logic/ 模組 vitest 全綠；playwright 手機視窗 smoke（載入→開始→canvas 運行→無錯誤）。
- 每 commit 過 repo hooks（lint-staged、typecheck、format、commitlint）。

## 13. 安全與合規

純前端、無資料收集、無 API、無 secrets；原創角色（§5）；依賴僅 phaser/zzfx（MIT）；CSP 相容（無 eval）。

## 14. 效能與範圍紀律

能 10 行不寫 50 行；能用套件不手刻；嚴禁提前抽象與過度工程；註解預設不寫，僅必要處簡短正式繁體中文。

---

# v2 擴充：層層關卡（PM 親撰）

## 15. 關卡系統（levels.ts 為 SSOT，pure TS 可測）

流程改為：Title → Stage 1 → 2 → 3 → 4（魔王）→ Result。死亡重試當前關；通關進下一關（轉場卡全屏 1.2s：關卡編號+名稱+緩動）（v6 已由 §39 取代：通關 → 世界地圖揭霧 → 自節點進下一關，轉場卡廢除）。

下表世界寬為 v2 直向值，v3 已由 §21 橫式世界尺寸取代（S1 2700 / S2 3100 / S3 3500 / S4 854 單屏）：

| #   | 關卡     | 場景（bg key） | 世界寬              | 擊殺配額 | 生成間隔                | 怪物組合                         | 難度設計                                     |
| --- | -------- | -------------- | ------------------- | -------- | ----------------------- | -------------------------------- | -------------------------------------------- |
| 1   | 果凍草原 | bg-meadow      | 1680px              | 6        | 2600ms                  | jelly 60%、floaty 40%            | 教學關：平台低差、無地形威脅、幾乎不死       |
| 2   | 雲朵高台 | bg-heights     | 1920px              | 9        | 1800ms                  | floaty 40%、spiky 35%、puffy 25% | 垂直平台跳躍、spiky 巡邏走道、puffy 空中封位 |
| 3   | 星空回廊 | bg-arena       | 2160px              | 10       | 1300ms                  | 五種混編、可吸怪佔比 50%         | 密度高壓、chompy 卡口、彈藥管理壓力          |
| 4   | 魔王城   | bg-throne      | 480px（單屏 arena） | —        | 補生 3500ms（僅可吸怪） | Jellord + jelly/floaty 補給      | §6 + §17 強化演出                            |

- 走動：關卡 1-3 為側向卷軸（v3 定案：`camera.startFollow(player, false, 1, 1)` 剛性跟隨 + `roundPixels: false` + `setBounds(0,0,worldW,480)`；world 物理邊界同步；緣由見 §25 抖動修復定案）。
- 通關條件：擊殺配額達成後右端出現「星星門」（fx-star 放大 + 光暈脈動 + 浮動 tween，graphics 組合，不新增美術），走入即過關。
- 關卡資料契約（levels.ts）：`{ id, nameZh, bgKey, worldWidth, killQuota, spawnIntervalMs, maxOnScreen, safeZoneTailPx, enemyMix: {kind,weight}[], platforms: {x,y,w}[] }`——GameScene 依資料驅動，禁止每關寫死邏輯分支。
- 尾端 release：每關末 `safeZoneTailPx: 480` 禁 spawn（星星門前喘息區，鋸齒 tension-release）。`maxOnScreen`：S1 3、S2 4、S3 5。
- HUD 增列：左上 `STAGE N 關卡名` + 配額 `⭐ n/quota`。

### 15.1 觸控寬容度硬規則（調研回寫，全關卡生效）

- Coyote time 150ms、jump buffer 160ms（離台仍可跳、提前按跳落地即跳）。
- 玩家 hurtbox = 視覺 75% 寬 × 80% 高；敵人 contact hitbox = 視覺 90%（spiky 85%）。
- 受擊 i-frame 1.5s + 擊退期控制鎖 250ms；死亡重開載入 ≤400ms。

## 16. 新怪物 ×2（多樣性；全原創）

| 怪物   | 名稱   | 外型                       | 行為                                                                | 數值                                               |
| ------ | ------ | -------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| 氣球魨 | Puffy  | 珊瑚粉圓河豚、短刺、驚訝眼 | 高空緩慢下飄，落地或受擊「啵」爆成 4 向短刺彈（220px/s、0.6s 消散） | HP 1、可吸（吸入得彈藥且不爆）、爆刺傷害 1         |
| 咬咬花 | Chompy | 鵝黃果凍花、花瓣嘴、瞇眼   | 定點紮根，玩家進 120px 前搖 0.4s 後咬合（嘴部 hitbox 0.3s）         | HP 2（吃兩發星彈）、不可吸（紮根彈開）、咬合傷害 1 |

行為實作沿用 enemies.ts 既有模式（pool + kind 分支 + wobble tween）；EnemyKind 契約擴充 'puffy' | 'chompy'。

## 17. 魔王關演出強化（動畫品質關鍵）

- 入場運鏡：黑幕淡入 → 相機從王座緩推近（pan+zoom 1.2s）→ Jellord 三段彈跳落座（每段落地震屏+塵埃圈）→ 吼叫（畫面漣漪 + boss-roar）→ 戰鬥開始。
- P2 轉換震撼：時停 0.4s → 全屏紫色 vignette 脈動常駐 → 果凍地震（相機持續微震 2s）→ 皇冠迸出星火粒子 → 背景色調轉暗（tint 疊層）。
- 擊破多段演出：時緩 0.3× → 連環小爆 ×6（隨機體表位置、間隔 150ms）→ 全屏白閃 → 大星爆 → 皇冠拋物線落地彈兩下（金屬音）→ 勝利。
- 粒子預算：單一發射器 maxAliveParticles ≤120（勝利彩帶峰值例外），單次 burst ≤40；以實機 60fps 實測為準（QA 實測 avg 100fps）；vignette 用單一半透明 rect 疊層。

## 18. 動畫流暢度打磨清單（全實體）

走路彈跳（玩家移動時 y 微幅 bob + 輕微傾斜）、落地塵埃圈（著地速度 >300 觸發）、所有敵人生成 popIn（scale 0→1 back.out）、死亡 squash 消失、星星門吸入過關演出（玩家縮小旋轉飛入）、轉場卡緩動（slide+fade）、鏡頭剛性跟隨 lerp(1,1)（v3 定案；lerp×roundPixels 逐幀往返跳動的根因修復見 §25 抖動修復定案）。

## 19. v2 美術資產增補（codex 專用；生成尺寸同 §10 規範）

| 檔名              | 內容                                                                     | 備註                               |
| ----------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| bg-meadow.png     | 直向果凍草原：粉綠草丘、果凍花、奶油雲（1024×1536 不透明）               | 底 1/3 乾淨地面                    |
| bg-heights.png    | 直向雲朵高台：高空粉藍雲海、遠景漂浮果凍島（1024×1536 不透明）           | 底 1/3 乾淨、中段留平台視覺空間    |
| bg-throne.png     | 直向魔王城王座廳：葡萄紫果凍城、金冠紋飾、戲劇但可愛（1024×1536 不透明） | 底 1/3 乾淨、頂部王座剪影          |
| minion-puffy.png  | 氣球魨（2048 透明）                                                      | 珊瑚粉 #FFA8A0、短圓刺、驚訝圓眼   |
| minion-chompy.png | 咬咬花（2048 透明）                                                      | 鵝黃 #F5E6A8、花瓣嘴微張、莖葉底座 |

## 20. 技能系統：吞噬賦星（v2.1，PM 親撰）

吞下的怪決定星彈屬性（最後吞下者覆蓋既有彈藥屬性），表驅動實作（config 一張表，禁止散落分支）（v6 已由 §40 擴充為五系：shelly 殼盾星、zappy 雷鏈星，取代 v4 的標準星/疾風星代位）：

| 吞下   | 星彈屬性 | 效果                                | 視覺                            |
| ------ | -------- | ----------------------------------- | ------------------------------- |
| jelly  | 標準星   | 傷害 5、速度 520、穿透 1            | 金黃 #FFD966                    |
| floaty | 疾風星   | 傷害 5、速度 650、穿透 2            | 藍紫 tint #A78BFA、拖尾加長     |
| puffy  | 爆裂星   | 命中爆 60px AoE（主目標 5、波及 2） | 珊瑚 tint #FF8A80、命中小爆粒子 |

- HUD 彈藥星星依屬性上色；發射音效 pitch 依屬性微調（標準 1.0／疾風 1.15／爆裂 0.85）。
- 實作契約：`swallow(kind)` 記錄 flavor → `fireStar(flavor)` → `STAR_FLAVORS` 常數表（core/config.ts）。
- KISS 底線：不做技能樹、不做冷卻、不做 UI 選單——吞什麼射什麼，一眼可懂。

## 21. v3 橫式轉向（PM 親撰）

- 邏輯畫布 854×480（橫式），Scale.FIT + CENTER_BOTH；manifest orientation 改 landscape（v4 已由 §28 免轉向旋轉殼取代：manifest 不鎖 orientation）；直向持機時顯示「請轉橫」遮罩（v4 已由 §28 免轉向旋轉殼取代：遮罩廢除）。
- 世界尺寸：高 480；寬放大至 S1 2700 / S2 3100 / S3 3500（視野變寬 1.78 倍，維持等效走動時長）；平台改雙層以內（天花板變低），高度差以跳躍 -420 可達為準。
- HUD 重排：頂列橫排——HP 心心左上、STAGE 標示中上、配額右上；Boss 條頂中置。全部 HUD 圖示改 graphics 繪製（星形/心形程序化），全遊戲禁用 emoji 與文字字元鍵帽。
- 虛擬手柄（參考實體手柄配置）：左側浮動搖桿（觸點即中心、半徑 60px、死區 12px、水平為主 + 下向偵測供下衝擊）；右側 A（跳，右下）/ B（吸/射，A 左上 45 度）雙鍵 64px+ 斜排、間距 16px+（v5 已由 §34 取代：B 移右側偏上食指區、支援拖曳自訂布局）；橫持 iPhone safe-area 側邊 inset 必須套用。按鍵一律 canvas/CSS 繪製圖形（無文字節點）。

## 22. iOS 觸控直通（研究回寫後定稿）

- 已知基線：控制層與 canvas 套 `-webkit-touch-callout: none`、`-webkit-user-select: none`、`user-select: none`、`touch-action: none`、`-webkit-tap-highlight-color: transparent`；pointerdown/contextmenu preventDefault；按鍵不含可選取文字（無障礙走 aria-label）。
- 長按放大鏡（iOS 17+ text loupe）根除：按鍵去文字化 + callout/select 全關 + 必要時 touchstart passive:false preventDefault——以調研結論為準補齊。
- 研究項：Safari gesturestart 縮放攔截、standalone PWA 與瀏覽器內差異、audio unlock 於橫式的相容性。

## 23. 技能組合 v3：吞噬連鎖（表驅動，logic/skills.ts）

- 三屬性沿用 §20；新增連鎖規則：
  - 同種連吞 ×2：該槽升級為強化星（傷害 ×1.6、尺寸 ×1.4、pitch -15%、金邊 tint）。
  - 彈匣全滿長按 B 0.8s：星暴大招——清場全部小怪 + 魔王 12 傷，震屏 + 白閃 + 星雨粒子，清空彈匣。
  - 空中搖桿下 + B：下衝擊——加速下墜，落地 60px 衝擊波（傷害 2、擊退小怪），CD 1.2s，零彈藥消耗。
- 彈匣槽各自帶 flavor 與強化態，後進先出發射；HUD 槽位顯示屬性色 + 強化金邊。

## 24. 關卡彩蛋（data-driven：levels.ts easterEggs[]）

| 關  | 觸發                        | 獎勵                  | 演出                            |
| --- | --------------------------- | --------------------- | ------------------------------- |
| 1   | 開局反向走到世界最左緣      | 彩虹果凍 +1 HP        | 金光 popIn + 專屬 jingle + 浮字 |
| 2   | 最高雲朵平台連續站上 3 次   | 星星雨（瞬間滿彈匣）  | 星雨粒子 + jingle               |
| 3   | 依序連吞 jelly→floaty→puffy | 金星彈一發（傷害 20） | 金彈入匣特寫 + jingle           |
| 4   | 開場 5 秒內命中皇冠         | +1 HP                 | 皇冠火花 + jingle               |

- 觸發器型別化：`'reach-x' | 'stand-count' | 'eat-sequence' | 'crown-early-hit'`；每關至多觸發一次；純邏輯可測。

## 25. 背景連續感與視覺升級

- 每關背景改「橫向無縫平鋪」新資產（§27），tileSprite 雙層視差：遠景 scrollFactor 0.25、近景 0.6；接縫若可見改鏡像平鋪。
- 共用漂浮雲層（透明平鋪帶）恆速漂移；每關主題 ambience 粒子（草原花瓣/高台雲絮/回廊星塵/王座金塵，密度低於 8 顆同屏）。
- 色彩分級：每關極輕 tint overlay（alpha 0.06）統一色調。
- 動作抖動修復定案（US-022 調查結論）：根因為 camera lerp 次像素捲動 × roundPixels 量化的逐幀往返跳動——修法為剛性跟隨 `lerp(1,1)` + `roundPixels: false`（非 pixel-art 美術）；walk bob 改 PRE/POST_UPDATE 視覺偏移掛鉤不污染物理；全實體動作平滑化（tween ease 統一 Sine 系）。

## 26. 反卡死保證（softlock 防護，全部 MUST）

- Spawner 保證律：玩家彈藥 0 且場上無可吸怪時，下一隻生成強制可吸（覆蓋權重）；boss 期同律且立即補生（不等間隔）。
- 星星門必達：配額達成即於可達地面生成，overlap 高度涵蓋跳躍弧線。
- 場景無坑洞設計維持（無墜落死）；世界邊界實牆。
- visibilitychange：切背景暫停物理與計時（v5 已由 §35 取代：回前景停在暫停選單、點繼續才接續，不自動恢復）。
- 深度探索 QA 劇本：邊緣紮營 5 分鐘、只殺不可吸怪、彈藥歸零僵持、暫停/恢復循環、快速連死——全數不得卡關。

## 27. v3 美術資產（codex 專用；橫向平鋪）

| 檔名             | 內容         | 規格                                    |
| ---------------- | ------------ | --------------------------------------- |
| bg-meadow-l.png  | 果凍草原橫景 | 1536×512、水平無縫平鋪、底 1/4 乾淨地帶 |
| bg-heights-l.png | 雲朵高台橫景 | 同上、中段留平台空間                    |
| bg-arena-l.png   | 星空回廊橫景 | 同上、星塵粉紫調                        |
| bg-throne-l.png  | 魔王城橫景   | 同上、紫金王座廳                        |
| fx-clouds.png    | 共用漂浮雲層 | 1024×256、透明、水平無縫平鋪            |

## 28. v4 免轉向橫式與響應寬幅（PM 親撰）

- 免轉向：偵測 portrait viewport 時，以 CSS 旋轉容器方案將整個遊戲容器（canvas + DOM 控制層）旋轉 90 度呈現橫式——使用者直持手機即玩，不再顯示轉橫遮罩（遮罩廢除）。技術定案依調研回寫（Phaser 4 相容性、pointer 座標映射、safe-area 換軸）。
- 響應寬幅：邏輯高固定 480，寬依裝置比例擴展（下限 854、上限 1200）；Scale 模式依調研定案（EXPAND/RESIZE 擇一）。HUD 錨定鏡頭邊緣自適應；世界生成邊距、星星門偵測、boss 單屏佈局以動態視寬計算，禁止硬編 854。
- 驗收基準機型：390×844（iPhone 13 直持）、430×932（Pro Max 直持）、844×390（橫持）三態皆可玩。

## 29. v4 平台玩法元素包（調研回寫後定案數值）

Arcade Physics 相容優先（斜坡不做——Arcade 無原生支援，違反 KISS）：

| 元素     | 行為                                                              | 關卡配置         |
| -------- | ----------------------------------------------------------------- | ---------------- |
| 單向平台 | 下方可穿上方可站（checkCollision.down only）；搖桿下+跳可下落穿透 | S1 起每關 2-4 個 |
| 移動平台 | 水平/垂直往返（tween 驅動 + 玩家載運）                            | S2 起 1-2 個     |
| 彈簧墊   | 踩上彈跳 -640（超級跳）、squash 動畫 + 專屬音                     | S2 起 1-2 個     |
| 可破壞磚 | 星彈或下衝擊破壞、碎裂粒子、內藏獎勵（彈藥/HP 小回復）            | S3 起 2-3 個     |

- 全部元素 data-driven 進 levels.ts platforms/elements 資料；純邏輯可測。
- 反卡死約束：元素佈局不得製造不可達區域；可破壞磚不得阻擋唯一路徑（破壞前繞行可過）。

## 30. v4 內容擴充：新技能、新怪物、魔王 P3（PM 親撰）

- 新技能「空中疾衝 Air Dash」：空中雙擊 A（或搖桿方向+雙擊）朝面向水平疾衝 180px、0.18s、無敵幀、CD 2s；殘影拖尾 fx；衝撞小怪傷害 1。
- 新怪物 ×2（全原創）：
  - 殼殼 Shelly：藍綠硬殼龜果凍。第一發星彈 → 縮殼旋轉衝刺 1.5s（期間無敵、傷害 1）→ 停下暈眩 1s（可吸/可擊殺）。HP 2 段。不可直接吸（縮殼後暈眩時可吸）。
  - 雷雷 Zappy：薰衣草黃電氣水母。緩慢懸浮追蹤，每 3s 放電環（半徑 70px、傷害 1、前搖 0.5s 閃爍預警）。可吸（吸入得疾風星）（v6 已由 §40 取代：吸入得雷鏈星）。HP 1。
- 魔王 P3（HP ≤ 25%）：狂暴皇冠——rain 改追蹤彈 ×5（緩速跟蹤 2s 後直線）、slam 觸發全場單向平台震落效果（站立玩家強制彈起）、體色金紫閃爍；P3 進場演出：皇冠射出星環衝擊波 + 時停 0.3s。
- 關卡怪物組合更新：S2 加 shelly 15%、S3 加 zappy 15%（權重重配，可吸佔比維持 ≥50%）。

## 31. v4 美術資產（codex 專用）

| 檔名              | 內容                                             | 規格          |
| ----------------- | ------------------------------------------------ | ------------- |
| minion-shelly.png | 殼殼：藍綠 #7FD8C8 硬殼龜果凍、圓殼紋、憨笑      | 2048 透明     |
| minion-zappy.png  | 雷雷：薰衣草黃 #E8D88A 電氣水母、火花觸鬚、瞇眼  | 2048 透明     |
| props-meadow.png  | 草原道具條：果凍蘑菇/花叢/小石/木牌 4 件橫排等距 | 2048×512 透明 |
| props-heights.png | 高台道具條：氣球/雲絮/風向旗/星星燈 4 件         | 2048×512 透明 |
| props-arena.png   | 回廊道具條：水晶簇/星柱/光苔/浮石 4 件           | 2048×512 透明 |
| props-throne.png  | 王座道具條：旗幟/燭台/王冠雕像/寶箱 4 件         | 2048×512 透明 |

道具條以固定 4 等分切割（512×512/件），佈景密度規範見 §32。表列 `.png` 為生成源檔名（§10 慣例）；實際入庫交付為切割後之 `prop-{meadow,heights,arena,throne}-1..4.webp` 與 `minion-*.webp`（q82、透明保留），資產鍵與檔名對齊 `core/assets.ts` 註冊表。

## 32. 場景裝飾密度規範

- 每關地面帶每 400-600px 佈置 1-2 件主題道具（levels.ts decor 資料驅動、隨機微縮放 0.9-1.1 與 y 抖動）；深度在玩家後、平台前。
- 道具純裝飾無碰撞（KISS）；可破壞磚除外（§29）。
- 同屏道具上限 6 件防雜訊；與 ambience 粒子總量合併預算（同屏繪製物 ≤14）。

## 33. v5 iOS PWA UX 調研回寫（2026-07-15 定稿）

調研結論與對應實作（出處：MDN `BaseAudioContext.state`、MDN CSS env()、Polypane safe-area 指南、iOS PWA 安全區實測筆記 gist/fozzedout、Steven Hoober thumb-zone 研究、Smashing Magazine 拇指觸控統計）：

| #   | 結論                                                                                     | 實作                                                                                                             |
| --- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `viewport-fit=cover` 缺失時 `env(safe-area-inset-*)` 全為 0，Safari 以黑邊 letterbox     | 既有 meta 已含 cover（複查通過，未重工）                                                                         |
| 2   | standalone 邊到邊需 `apple-mobile-web-app-status-bar-style: black-translucent`           | v5 補上該 meta                                                                                                   |
| 3   | 橫持瀏海機頂緣存在 phantom 觸控死區（inset 回報 0 仍吃事件），建議頂緣 ≥20px 緩衝        | `#keys-layer` top 取 `max(20px, env(top))`；joy-zone 既有 20px 緩衝維持                                          |
| 4   | `env()` 值冷啟動/轉向可能為 0 或 stale，須設 `max(Npx, env(...))` 地板                   | keys-layer 四向皆 `max()` 地板（20/12px）                                                                        |
| 5   | iOS standalone 冷啟動 `100dvh` 不可靠                                                    | 維持 v4 `100vh` 決策（複查，未重工）                                                                             |
| 6   | iOS 切 app/背景後 AudioContext 進非標準 `interrupted` 態，`resume()` 須於手勢堆疊內呼叫  | sfx.ts `resumeAudio()`（`state !== 'running'` 即 resume）＋全域 pointerdown 復聲保險＋暫停選單「繼續」手勢內恢復 |
| 7   | 觸控目標 ≥44pt（Apple HIG）；拇指自然熱區在底部/下側緣，食指可達區在裝置上緣（雙手橫持） | 全按鍵 ≥44px（A 76 / B 72 / 暫停與靜音 hit 48 / 選單鈕 ≥52）；布局見 §34                                         |
| 8   | 長按 loupe/選字/callout/雙擊縮放攔截                                                     | v3/v4 已滅（touch-callout/user-select/touch-action/gesturestart 全鏈，複查通過，未重工）                         |
| 9   | `position: fixed` 根元素於 iOS 26 鍵盤場景會裁切 app shell                               | 本遊戲無文字輸入，維持 fixed 殼；記錄為已知邊界                                                                  |

## 34. v5 控制布局重設計與按鈕自訂

- 人體工學定案（§33 條目 7）：雙手橫持時拇指錨於下側角、食指自然落在裝置上緣——A 跳躍維持右下（拇指連打），B 吸/射移至右側偏上（食指按壓；與 A 垂直遠離杜絕誤觸）；方向搖桿維持左半屏。
- 布局 SSOT：`core/layout.ts`——按鍵中心以 keys-layer 安全區內比例（cx/cy 0-1）表示，直橫持共用；`DEFAULT_LAYOUT`：A (0.92, 0.78)、B (0.92, 0.34)。
- `#keys-layer`：安全區內鋪滿的定位容器（四向 `max()` 地板＋portrait 換軸表），按鍵以 `left/top %` + `translate(-50%,-50%)` 定位。
- 按鈕自訂（KISS：拖曳＋儲存＋重置，不做進階編輯器）：Title「按鈕配置」→ `systems/keyConfig.ts` DOM 覆層——直接拖曳真實 A/B 鍵即時預覽，「儲存並返回」寫入 localStorage `sp-key-layout`（schema `{version:1, a:{cx,cy}, b:{cx,cy}}`；版本不符/損毀回退預設），「恢復預設」一鍵還原。拖曳座標經 `pointerToLocal` 換軸，夾限 `KEY_CLAMP` 保證按鍵完整在畫面內。

## 35. v5 暫停系統與離頁自動暫停

- HUD 暫停鍵：頂列右上（靜音鈕左側 48px，top-right 硬熱區遠離戰鬥區），雙豎條圖形紋理、48px 觸控目標；配額顯示左移讓位。桌機備援：ESC / P。
- 暫停選單（`systems/pause.ts`，DOM 覆層——旋轉殼下 hit-test 天然正確、覆蓋虛擬鍵防誤觸）：繼續／重新開始／回主選單。
- 全停語義：`scene.pause(Game)`（物理/計時/tween/輸入輪詢全停）＋ `AudioContext.suspend()`（BGM 與 SFX 全停）。
- 重新開始＝重置當前關卡全狀態（血量/彈藥/擊殺數/計時/實體經 scene.restart 重生），保留已完成關卡累計用時與本輪死亡數。
- 離頁自動暫停：`visibilitychange`（hidden）與 `pagehide`（同走 hidden 檢查防雙觸發）即開暫停選單；回前景停在選單、玩家點「繼續」才接續（取代 §26 的自動恢復，杜絕回前景瞬間被偷襲）。音訊恢復一律走手勢堆疊內 `resume()`（§33 條目 6），刻意暫停期間全域復聲保險不生效。
- 與 PWA 週期更新 hooks（main.ts `import './pwa'`）共存：兩者互不依賴，同檔並列。已知邊界：回前景恰逢新版部署時，autoUpdate 完成後的 reload 會重新載入頁面蓋過暫停選單，屬可接受權衡，不特別攔截。

## 36. v5 開場主選單與圖鑑/技能介紹

- Title 開場動畫：主標縮放彈出（Back.easeOut）、副標延遲淡入、主角自天而降 Bounce 落定＋光暈淡入；維持既有美術風格與 zzfx 音效（選單按壓 pop）。
- 主選單：開始遊戲（主鈕）＋次選單列 圖鑑／技能介紹／按鈕配置（DOM 鈕承接命中，data-menu 標識）。
- 圖鑑/技能介紹（`CodexScene` 單場景雙分頁，資料 SSOT `core/codex.ts`，立繪一律取既有 sprite 資產、禁止新美術）：
  - 圖鑑分頁：全 8 角色（jelly/floaty/spiky/puffy/chompy/shelly/zappy/boss）4×2 網格——立繪＋名稱＋行為一句話＋可吸/不可吸圓點標記。
  - 技能分頁：吸入／星彈三系（含來源怪物對應）（v6 已由 §40 擴充為五系＋殼盾／雷鏈條目）／強化星／星暴／下衝擊／空中疾衝／漂浮，雙欄列表（名稱＋操作＋效果）。
  - 分頁切換以 scene.restart 重建（選單輕量無局內狀態）；ESC 或返回鈕回 Title。

## 37. v5 全元素位置稽核

- 稽核腳本：`scripts/capture-audit.mjs`——Title/Game/Boss/Result（＋v5 新頁）於 390×844（直握旋轉殼）與 926×428（寬幅橫持）截圖至 `screenshots/starpuff-v5-audit/{before,after}/`。
- 檢查項：HUD（血條/彈藥/擊殺進度/計時/boss 條）、虛擬鍵、彩蛋提示、教學文字——重疊/出界/safe-area 裁切/離熱區過遠。
- v5 修正：暫停鍵擠入頂列後配額右錨左移（width-112/126）避免熱區重疊；B 鍵離開 A 鍵斜上緊鄰位，垂直間距 ≥80px。
- Boss 條頂中置於兩檔寬皆不與左上心心、右上配額/暫停/靜音重疊（854 與 1200 邏輯寬實測）。
- v6 增列：版本號頁腳（§42）置於 Title 底緣中央（height-6、12px 小字），不與次選單列（height×0.85）重疊。

---

# v6 擴充：存檔與世界地圖（PM 親撰）

## 38. 存檔系統（core/save.ts 為 SSOT，pure TS 可測）

- localStorage `sp-save` schema v1：`{ schemaVersion, highestClearedLevel, levels: { [id]: { cleared, bestTimeMs, secretsFound: string[] } }, lastPlayedAt }`。
- 寫入時機：通關（星星門吸入當下即寫，演出中斷不掉進度）、魔王擊破、彩蛋觸發（`trigger` 型別字串為關內唯一 id）。
- 容錯（沿用 §34 sp-key-layout parse/fallback 模式）：schema 版本不符、形狀損毀、隱私模式拋錯——一律回退預設值；`highestClearedLevel` 由關卡條目重新推導，不信任持久化值。
- `bestTimeMs`＝該關單次成功嘗試的最短用時（死亡重試重計）；`secretsFound` 去重持久化，跨局累計。
- 重置進度：世界地圖左下「重置進度」兩步確認（武裝態 3s 未確認自動退回），僅清 `sp-save`（按鍵布局 `sp-key-layout`、靜音 `sp-muted` 不動）。全新存檔不顯示入口。
- 偏離備註：任務原文「設定頁加重置進度」——本遊戲無設定頁（按鈕配置為鍵位編輯器，語義不符），重置入口落於世界地圖（進度顯示與進度管理同場景，KISS）。

## 39. 迷霧世界地圖（MapScene，data-driven 自 LEVELS）

- 入口：Title 主選單「世界地圖」＋通關後自動進入（取代 §15 轉場卡直達下一關）；Result 勝利鈕改「世界地圖」。Title「開始遊戲」＝接續當前可挑戰關，全通關後改開地圖。
- 橫向節點路徑：四節點（各關＋魔王節點）沿虛線路徑排布，節點主題色鏡像關卡 bg 主色；禁自由漫遊式大地圖（KISS）。
- 節點三態（解鎖規則：第 1 關恆開、第 N 關需第 N-1 關通關）：
  - locked：迷霧雲團遮罩＋問號、關名降透明。
  - open（當前可挑戰）：節點脈動 tween。
  - cleared：金星徽記＋「最佳 N.Ns」；點擊重入該關（關卡選擇＝重玩入口，重玩不回退解鎖態）。
- 揭霧動畫：通關進場帶 `reveal` 節點——霧散（alpha/scale tween）＋節點 Back.easeOut 彈出＋zzfx reveal sting；視寬重排 restart 不重播。
- 彩蛋計數：標題下方 `彩蛋 found/total`，total 由 LEVELS easterEggs 推導。
- 命中一律 DOM 鈕（`data-menu="node-N"`，旋轉殼 hit-test 天然正確）；鎖定節點無入口。鍵盤備援：ENTER 進當前挑戰關、ESC 回 Title。
- 計時語義變更：hub 模型下各關獨立計時入存檔 bestTime；Result 顯示該關用時（v5 四關累計總時語義廢除）。

## 40. v6 新技能：殼盾與雷鏈（PM 原創，補防禦與群戰原型）

沿用 ammo/flavor 表驅動管線（§20/§23），不加新 HUD 元件；星彈三系擴為五系：

| 吞下   | 星彈屬性 | 效果                                                                    | 視覺                        |
| ------ | -------- | ----------------------------------------------------------------------- | --------------------------- |
| shelly | 殼盾星   | 直射傷害 5、速度 480、穿透 0；頂槽時長按＝舉盾（見下）                  | 青綠 tint #7FD8C8           |
| zappy  | 雷鏈星   | 直射傷害 5、速度 585、穿透 0；命中後跳電至 160px 內最近 2 敵、各 3 電傷 | 電黃 tint #FFE28A、折線閃電 |

- 殼盾（防禦原型）：頂槽殼盾星且未滿匣時，長按 B ≥150ms 舉正面護盾（取代吸入語意；滿匣長按維持星暴優先，肌肉記憶不變）。格擋彈幕/接觸一次：不掉血不擊退、消耗頂槽、觸發反擊星爆（盾前 90px 傷害 3）＋短無敵 0.8s，冷卻 4s。正面判定＝傷害來源位於面向側（同 x 視為正面）。點按仍為發射。
- 雷鏈（群戰清場原型）：命中主目標後由近至遠跳電（主目標排除、折線閃電演出＋burstSmall）；命中魔王同樣跳電波及補給小怪（v4 多平台混戰場景受益）。
- 純邏輯 SSOT：`logic/skills.ts`（`advanceShield`/`resolveShieldBlock`/`isFrontalHit`/`pickChainTargets`）＋ `STAR_FLAVORS` chain 欄位（core/config.ts），vitest 全蓋。
- 事件契約增列：`skill:shield-block`（player 發出，GameScene 結算反擊星爆）。
- 平衡註記：殼盾 CD 4s 防無限格擋；雷鏈單跳 3 傷不足以秒 chompy（10 HP），保持坦怪定位；§24 連吞彩蛋序列不含新屬性（zappy 現記為 zappy，不再以 floaty 代位計序）。

## 41. v6 移動手感打磨（logic/movement.ts，pure TS 可測）

- 加減速曲線取代瞬時 setVelocity：加速 1400px/s²（約 0.16s 達全速 220）、減速 2000px/s²（約 0.11s 停定）、反向轉身加＋減速疊加率（即刻有力）；殘速 <8 吸附歸零防微速漂移。
- 超速殘速（疾衝 1000/擊退 234）先夾回常速帶再逼近——維持疾衝距離契約（v5 逐幀瞬時覆寫無殘速滑行，行為對齊）。
- 手感事件（邊緣觸發，`detectMoveFx`）：起跑塵埃（靜止起步）、急停塵埃（高速鬆手 ≥160）、轉身塵埃＋小幅擠壓（高速反向 ≥120，遮蓋翻面瞬間）。塵埃 ≤4 顆/次、tween 自毀，60fps 安全。
- 既有落地 squash（§18）、走路 bob（§18/§25 PRE/POST_UPDATE 視覺偏移）維持不動；嚴禁重新引入抖動——相機 lerp(1,1)/roundPixels:false 現值不動，改後必跑既有抖動與 portrait e2e（本版已全綠）。

## 42. 版本號顯示

- SSOT：package.json `version` ＋ short git SHA，經 vite `define __APP_VERSION__` 嵌入（`v0.X.Y+abcdef`；無 git 環境標記 nogit）。
- 呈現：Title 頁腳小字（12px、violet、alpha 0.75）；`window.__sp.version()` production 也掛載供現場排障（其餘 \_\_sp 除錯鉤子維持 DEV/test 限定）。

## 43. 每關攻略 PoC 與反卡關驗證

設計意圖 → 最佳打法 → 無技能保底打法（僅移動＋吸入＋星彈必可通關，§26 保證律背書）逐關表：

| 關  | 設計意圖                             | 最佳打法                                                                       | 無技能保底打法                                                      | 難度曲線（quota/interval/構成）                                             |
| --- | ------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | 教學：移動/吸/射閉環，幾乎不死       | 開局反向拿 +1 HP 彩蛋，連吞 jelly×2 強化星速殺                                 | 站樁吸 jelly/floaty、點按發射，達 6 殺走右入門                      | 6 / 2600ms / jelly 60%＋floaty 40%（全可吸）                                |
| 2   | 垂直閱讀：平台跳躍＋不可吸威脅初登場 | 吞 shelly（暈眩窗）備殼盾格擋 spiky 滾撞；雲台連站 3 次拿滿匣彩蛋              | 遠距吸 floaty/puffy 補彈、地面點射 spiky/shelly，貼牆等暈眩窗再殺   | 9 / 1800ms / floaty 35%＋spiky 30%＋puffy 20%＋shelly 15%（可吸 ≥55%）      |
| 3   | 高壓混編：彈藥管理＋群戰清場         | 吞 zappy 得雷鏈星一發清簇；連吞 jelly→floaty→puffy 拿金星彈轟 chompy           | 保持距離逐隻吸射；chompy 兩發標準星；彈盡靠 §26 飢荒強制補可吸怪    | 10 / 1300ms / 六種混編（jelly15+floaty10+puffy15+spiky25+chompy20+zappy15） |
| 4   | Boss Rush：彈幕閱讀＋補給循環        | 開場 5s 內命中皇冠拿彩蛋；補生小怪吞成滿匣憋星暴（12 傷）；P3 靠拍翅躲全場震落 | 吸補生小怪（飢荒立即補生）→ 點射果凍王，僅跳躍閃 slam/dash 即可磨死 | 0（HP 60 擊破制）/ 補生 3500ms / jelly＋floaty（全可吸）                    |

- 反卡關驗證（e2e 沿用 `__sp` 鉤子）：L1「全程僅用基礎動作通關」全流程案；L2/L3 `gotoLevel` 走查——飢荒必補可吸怪斷言＋地面路徑（含磚前繞跳）必達星星門；存檔重載、地圖解鎖、關卡重玩、殼盾格擋、雷鏈跳電各自獨立案。
- 靜態 overlap 必達背擋（§26 擴充，歸因定稿）：實測 Phaser 4.2.1 Arcade overlap 存在間歇漏檢（v5 基準亦可重現：彈簧 walk-over 6 次 3 失敗、星星門走入間歇不觸發），修復分兩軌、因果不可混淆——
  - `useTree: false`（main.ts）：只服務 sprite vs **Group** 配對（吸入區/星彈/觸碰 vs enemies group 走 `collideSpriteVsGroup` 的動態 RTree broadphase），關閉後改直接枚舉，根治該類漏檢；
  - 門/彈簧為 **direct pair**（`collideSpriteVsSprite` 直呼 `separate`、從不查 RTree）——`useTree:false` 對它們無效，真正有效且必要的是幾何掃掠背擋：星星門 `crossedGate`（跨門心/站門心右側/AABB 交疊三重判定，含 spawnGate 時已越門直判）與彈簧 `springSweepHit`（前後幀掃掠 x 區間，補高速穿越），純函式落 `logic/stageModel.ts` 供 vitest 守門，與原 overlap 共用單一觸發出口（transitioning/lockedUntil 閘去重）。**明文禁止未來把掃掠背擋當冗餘刪除。**
