# 星噗噗 StarPuff — 遊戲設計 SPEC（SSOT）

> 手機優先 PWA 動作小遊戲。穿越層層果凍關卡、吸入果凍怪、化為星彈、擊敗果凍魔王。
> 版本：v3.0（PM 親撰；v3 橫式轉向與技能組合 §21-§27）｜路由：`https://app.haotool.org/starpuff/`｜24h 衝刺交付

## 1. 產品定位

- 橫式（landscape）四關側向卷軸動作遊戲：三關走動探索 + 魔王關（Boss Rush 收尾），單局 2–4 分鐘，可無限重玩。
- 原創 IP：主角與怪物皆為原創設計（果凍星球世界觀），嚴禁使用任天堂卡比之名稱、造型、配色構圖。
- 目標體驗：Q 彈、可愛、爽快——大量擠壓拉伸、粒子、震屏、音效回饋。

## 2. 核心循環

移動/跳躍/漂浮 → 長按吸入小怪 → 吞下獲得星彈（上限 3）→ 點按發射星彈打魔王 → 閃避彈幕與衝撞 → 擊破勝利。

## 3. 場景流程

`BootScene`（載入+進度條）→ `TitleScene`（標題、開始按鈕、音效提示）→ `GameScene`（四關制）→ `ResultScene`（勝/敗、再玩一次）。

四關制流程：Title → Stage 1-3 側向卷軸（擊殺配額達成 → 星星門開啟 → 走入過關）→ Stage 4 魔王戰（入場動畫 → Boss 戰，期間補生可吸小怪供彈藥）→ 勝利星爆 / 敗北。死亡處理：Stage 1-3 重試當前關；魔王關進敗北結算。關卡資料驅動細節見 §15。

## 4. 操作（行動裝置優先）

- 左半屏：浮動搖桿（觸點即中心、半徑 60px、死區 12px；水平移動 + 下向偵測供下衝擊，規格見 §21）。
- 右側：A/B 圖形圓鍵手柄斜排——A 跳躍（空中連按＝拍翅漂浮，最多 3 次，落地重置）；B 吸/射（無彈藥＝按住吸入；有彈藥＝點按發射，長按仍可吸）。
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
- 邏輯畫布：854×480（橫式，Scale.FIT + autoCenter，§21）；解析度採 Scale.FIT 自適應，不做 DPR cap（欄位已於修復包 B 移除）。

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

流程改為：Title → Stage 1 → 2 → 3 → 4（魔王）→ Result。死亡重試當前關；通關進下一關（轉場卡全屏 1.2s：關卡編號+名稱+緩動）。

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

吞下的怪決定星彈屬性（最後吞下者覆蓋既有彈藥屬性），表驅動實作（config 一張表，禁止散落分支）：

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
- 虛擬手柄（參考實體手柄配置）：左側浮動搖桿（觸點即中心、半徑 60px、死區 12px、水平為主 + 下向偵測供下衝擊）；右側 A（跳，右下）/ B（吸/射，A 左上 45 度）雙鍵 64px+ 斜排、間距 16px+；橫持 iPhone safe-area 側邊 inset 必須套用。按鍵一律 canvas/CSS 繪製圖形（無文字節點）。

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
- visibilitychange：切背景暫停物理與計時，回前景恢復（修 v2 P3 遺留）。
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
  - 雷雷 Zappy：薰衣草黃電氣水母。緩慢懸浮追蹤，每 3s 放電環（半徑 70px、傷害 1、前搖 0.5s 閃爍預警）。可吸（吸入得疾風星）。HP 1。
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
