# 星噗噗 StarPuff — 遊戲設計 SPEC（SSOT）

> 手機優先 PWA 動作小遊戲。穿越層層果凍關卡、吸入果凍怪、化為星彈、擊敗果凍魔王。
> 版本：v15（PM 派工；v15 成就系統列車 §94——21 條成就 SSOT 純呈現層聚合（進度/魔王/EX/收集/速通/隱藏）/save schema v2 versioned migration 與舊玩家開機補發/圖鑑成就分頁與解鎖 toast 佇列/Result 解鎖名單、v14 UX/PWA 列車 §87-§93——直持預設方向翻轉 ccw（含回訪告知與偏好切換）/按鈕配置直欄化與標籤單行/虛擬鍵縮放（sp-key-layout v2）/PWA 安裝偵測與分平台指引/觸覺回饋與螢幕常亮/殼層卡片基建/殼局部 safe-area 量測、v13 EX 全魔王與星核制霸 §86——五王 EX 徽鈕開放收尾/EX 慈悲上限/EX 再戰保留/L4·L7 前室 retrofit/星核制霸全制霸獎勵、v12.1 P0 熱修 §85——真實觸控下滑判定重修（扇區＋幅度＋drop-intent 緩衝窗＋蹲下鉗水平）、v12 五區終章 §78-§84——分區分頁世界地圖/流星雨/Twinkla·Cometa/低重力/L17-L20 二十關完結/最終魔王蝕星魔核 Voidra（生存段·星核共鳴·段起點重試）/星光復甦謝幕與圖鑑補完、v11.1 P0 熱修 §77——站台下跳穿落根修/蹲姿與跳鍵下跳指示/吸入接觸豁免/大嘴吸入影格、v11 四區完結 §71-§76——糖漿潮汐/熱泉噴口/Bubbla·Splatta/L13-L16 十六關/第四魔王 Syrona 場控型（噴泉洗牌·皇冠弱點·窯風三連）、v10 三區完結 §65-§70——星門折躍/L10-L12 十二關/卡點 checkpoint/第三魔王稜晶雙子 Prismix/魔王關特殊體系（前室·增益·專屬彩蛋）、v9.1 P0 熱修 §64——Noctra 返空連續飛行/星暴 5s 無敵窗、v9 星化與挑戰 §57-§63、v8 世界擴張 §50-§56、v7 手感與深度 §44-§49、v6 存檔/世界地圖/新技能/手感 §38-§43、v5 控制自訂/暫停/圖鑑/開場 §33-§37、v4 免轉向與元素包 §28-§32、v3 橫式轉向 §21-§27）｜路由：`https://app.haotool.org/starpuff/`｜24h 衝刺交付

## 1. 產品定位

- 橫式（landscape）四關側向卷軸動作遊戲：三關走動探索 + 魔王關（Boss Rush 收尾），單局 2–4 分鐘，可無限重玩。（v8 已由 §50 取代：七關雙魔王；v9 已由 §60 取代：九關——七關走動探索＋兩座魔王關＋雙 EX 變體。）
- 原創 IP：主角與怪物皆為原創設計（果凍星球世界觀），嚴禁使用任天堂卡比之名稱、造型、配色構圖。
- 目標體驗：Q 彈、可愛、爽快——大量擠壓拉伸、粒子、震屏、音效回饋。

## 2. 核心循環

移動/跳躍/漂浮 → 長按吸入小怪 → 吞下獲得星彈（上限 3）→ 點按發射星彈打魔王 → 閃避彈幕與衝撞 → 擊破勝利。

## 3. 場景流程

`BootScene`（載入+進度條）→ `TitleScene`（標題、開始按鈕、音效提示）→ `MapScene`（v6 世界地圖 hub，§39）→ `GameScene`（四關制）（v8 已由 §50 取代：七關流程；v9 已由 §60 取代：九關流程）→ `ResultScene`（勝/敗）。

四關制流程（v8 已由 §50 取代：七關流程——L1-L3 → L4 果凍王 → L5-L6 → L7 暗月蝠王）：Title → Stage 1-3 側向卷軸（擊殺配額達成 → 星星門開啟 → 走入過關）→ Stage 4 魔王戰（入場動畫 → Boss 戰，期間補生可吸小怪供彈藥）→ 勝利星爆 / 敗北。死亡處理：Stage 1-3 重試當前關；魔王關進敗北結算。關卡資料驅動細節見 §15。（v6 已由 §39 取代直達下一關的轉場卡：過關寫入存檔後自動進世界地圖，自地圖節點進下一關或重玩。）

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
  - 彈匣全滿長按 B 0.8s：星暴大招——清場全部小怪 + 魔王 12 傷，震屏 + 白閃 + 星雨粒子，清空彈匣。（v9.1 已由 §64.2 補訂：發動附 5s 無敵窗，與受擊 i-frame 取較大值不疊加。）
  - 空中搖桿下 + B：下衝擊（v7 已由 §44 取代：改為空中搖桿下＋跳躍鍵，B 鍵回歸純吸/射語意）。
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

- 免轉向：偵測 portrait viewport 時，以 CSS 旋轉容器方案將整個遊戲容器（canvas + DOM 控制層）旋轉 90 度呈現橫式——使用者直持手機即玩，不再顯示轉橫遮罩（遮罩廢除）。技術定案依調研回寫（Phaser 4 相容性、pointer 座標映射、safe-area 換軸）。（v14 已由 §87 取代預設旋轉方向：預設 ccw（rotate -90deg、鏡頭朝右），cw 舊方向降為可切換偏好。）
- 響應寬幅：邏輯高固定 480，寬依裝置比例擴展（下限 854、上限 1200）；Scale 模式依調研定案（EXPAND/RESIZE 擇一）。HUD 錨定鏡頭邊緣自適應；世界生成邊距、星星門偵測、boss 單屏佈局以動態視寬計算，禁止硬編 854。
- 驗收基準機型：390×844（iPhone 13 直持）、430×932（Pro Max 直持）、844×390（橫持）三態皆可玩。

## 29. v4 平台玩法元素包（調研回寫後定案數值）

Arcade Physics 相容優先（斜坡不做——Arcade 無原生支援，違反 KISS）：

| 元素     | 行為                                                                                         | 關卡配置         |
| -------- | -------------------------------------------------------------------------------------------- | ---------------- |
| 單向平台 | 下方可穿上方可站（checkCollision.down only）；搖桿下+跳可下落穿透（§71.1：地形粉紅平台同權） | S1 起每關 2-4 個 |
| 移動平台 | 水平/垂直往返（tween 驅動 + 玩家載運）                                                       | S2 起 1-2 個     |
| 彈簧墊   | 踩上彈跳 -640（超級跳）、squash 動畫 + 專屬音                                                | S2 起 1-2 個     |
| 可破壞磚 | 星彈或下衝擊破壞、碎裂粒子、內藏獎勵（彈藥/HP 小回復）                                       | S3 起 2-3 個     |

- 全部元素 data-driven 進 levels.ts platforms/elements 資料；純邏輯可測。
- 反卡死約束：元素佈局不得製造不可達區域；可破壞磚不得阻擋唯一路徑（破壞前繞行可過）。

## 30. v4 內容擴充：新技能、新怪物、魔王 P3（PM 親撰）

- 新技能「空中疾衝 Air Dash」（v7 已於 §44 整體移除：雙擊 A 誤觸率高且與拍翅語意衝突，輸入預算讓給下衝擊改制）：空中雙擊 A 朝面向水平疾衝 180px、0.18s、無敵幀、CD 2s。
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
- 布局 SSOT：`core/layout.ts`——按鍵中心以 keys-layer 安全區內比例（cx/cy 0-1）表示，直橫持共用；`DEFAULT_LAYOUT`：A (0.92, 0.78)、B (0.92, 0.34)。（v16 已由 §95 取代「預設」的直持適用性：預設依殼旋轉態分流 `defaultLayoutFor`，直持採右下拇指帶錨點；自訂布局仍直橫持共用。）
- `#keys-layer`：安全區內鋪滿的定位容器（四向 `max()` 地板＋portrait 換軸表），按鍵以 `left/top %` + `translate(-50%,-50%)` 定位。
- 按鈕自訂（KISS：拖曳＋儲存＋重置，不做進階編輯器）：Title「按鈕配置」→ `systems/keyConfig.ts` DOM 覆層——直接拖曳真實 A/B 鍵即時預覽，「儲存並返回」寫入 localStorage `sp-key-layout`（schema `{version:1, a:{cx,cy}, b:{cx,cy}}`；版本不符/損毀回退預設），「恢復預設」一鍵還原。拖曳座標經 `pointerToLocal` 換軸，夾限 `KEY_CLAMP` 保證按鍵完整在畫面內。（v14 已由 §88/§89 取代操作列結構與 schema：schema 升 v2 增全域縮放、操作列直欄化並增持向切換與縮放列。）

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
  - 圖鑑分頁：全 8 角色（jelly/floaty/spiky/puffy/chompy/shelly/zappy/boss）4×2 網格——立繪＋名稱＋行為一句話＋可吸/不可吸圓點標記。（v7 擴 5×2 十格；v8 擴 7×2 十四格；v9 已由 §59 取代：8×2 十六格。）
  - 技能分頁：吸入／星彈三系（含來源怪物對應）（v6 已由 §40 擴充為五系＋殼盾／雷鏈條目；v7 §44/§46 移除空中疾衝、增混合星彈與七系敘述）／強化星／星暴／下衝擊／漂浮，雙欄列表（名稱＋操作＋效果）。
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

- localStorage `sp-save` schema v1：`{ schemaVersion, highestClearedLevel, levels: { [id]: { cleared, bestTimeMs, eggsFound: string[] } }, lastPlayedAt }`。
- 寫入時機：通關（星星門吸入當下即寫，演出中斷不掉進度）、魔王擊破、彩蛋觸發（`trigger` 型別字串為關內唯一 id）。
- 容錯（沿用 §34 sp-key-layout parse/fallback 模式）：schema 版本不符、形狀損毀、隱私模式拋錯——一律回退預設值；`highestClearedLevel` 由關卡條目重新推導，不信任持久化值。
- `bestTimeMs`＝該關單次成功嘗試的最短用時（死亡重試重計）；`eggsFound` 去重持久化，跨局累計。
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
- 超速殘速（擊退 234 等）先夾回常速帶再逼近，無殘速滑行（v7 §44 移除疾衝後僅餘擊退來源）。
- 手感事件（邊緣觸發，`detectMoveFx`）：起跑塵埃（靜止起步）、急停塵埃（高速鬆手 ≥160）、轉身塵埃＋小幅擠壓（高速反向 ≥120，遮蓋翻面瞬間）。塵埃 ≤4 顆/次、tween 自毀，60fps 安全。
- 既有落地 squash（§18）、走路 bob（§18/§25 PRE/POST_UPDATE 視覺偏移）維持不動；嚴禁重新引入抖動——相機 lerp(1,1)/roundPixels:false 現值不動，改後必跑既有抖動與 portrait e2e（本版已全綠）。

## 42. 版本號顯示

- SSOT：package.json `version` ＋ short git SHA，經 vite `define __APP_VERSION__` 嵌入（`v0.X.Y+abcdef`；無 git 環境標記 nogit）。
- 呈現：Title 頁腳小字（12px、violet、alpha 0.75）；`window.__sp.version()` production 也掛載供現場排障（其餘 \_\_sp 除錯鉤子維持 DEV/test 限定）。

## 43. 每關攻略 PoC 與反卡關驗證

（本節怪物權重與招式為 v6 定案值；L2/L3 波次已由 §47 取代——glowy/drilly 入編後之現值以
`levels.ts` 與 §47/§49 為準，下表保留 v6 歷史攻略脈絡。）

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

## 44. v7 下衝擊觸發改制與跳躍鍵輸入矩陣（PM 親撰，取代 §23 下+B 觸發）

- 下衝擊改為「空中搖桿下＋跳躍鍵（A）」觸發：B 鍵回歸純吸/射/技能語意，空中吞含
  （puffed，腹中有怪）狀態不影響觸發——矩陣不讀彈匣。數值不變（下墜 700、落地 60px
  衝擊波傷害 2、CD 1.2s、零彈藥消耗、可破磚）。
- 空中疾衝（§30 Air Dash）整體移除：雙擊 A 與拍翅節奏衝突且誤觸率高；相關輸入、
  純邏輯、殘影 fx、音效、圖鑑條目與測試全數清除（movement 夾速鏈保留供擊退殘速）。
- 跳躍鍵輸入矩陣（`logic/skills.ts` `resolveJumpPress`，pure TS 可測）：

（v10.1 已由 §71.1 補訂：「空中」判定收斂為真空中——coyote 窗內視同在地不觸發下砸；
地面主地面下＋跳自 §71.2 起帶蹲姿視覺，跳躍裁決不變。）

| 情境           | 下  | 跳  | 裁決                                                                              |
| -------------- | --- | --- | --------------------------------------------------------------------------------- |
| 空中（CD 完）  | ✓   | ✓   | 下衝擊（吞含狀態同樣觸發；§71.1：coyote 歸零的真空中才成立）                      |
| 空中（CD 中）  | ✓   | ✓   | 回落一般跳躍鏈（拍翅/buffer），不吞輸入                                           |
| 空中           | ✗   | ✓   | 拍翅（≤3 次）/ jump buffer                                                        |
| 地面站單向平台 | ✓   | ✓   | 下落穿透（§29 `shouldDropThrough` 於 stage 層裁決，覆蓋跳躍脈衝——既有優先序不變） |
| 地面主地面     | ✓   | ✓   | 一般跳躍（無蹲下語意，無衝突）                                                    |
| 地面           | ✗   | ✓   | 一般跳躍（coyote/buffer 寬容不變）                                                |

## 45. v7 走動手感根修與抖動歸因（logic/walkFeel.ts，pure TS 可測）

- 根因結論（依序排查證據，`sp-jitter-probe` 逐幀取樣）：
  1. 物理 velocity 震盪：無（approachVelocity 曲線平滑）。
  2. render rounding：無（roundPixels:false 現值正確，維持不動）。
  3. camera 耦合：剛性跟隨段 screen-space 幀間位移恆 0（角色與捲軸完全同步）；非跟隨段
     （相機貼世界邊緣）幀間位移呈 0/3.667/7.333px 三值跳動——根因為 Arcade fixedStep
     60Hz 與渲染幀率錯拍（單一渲染幀吞 0/1/2 個物理步）。實測 `fixedStep:false` 可消除
     該錯拍但在低幀率下重力穿地（8 連測 1-2 次沉地 ~80px、彈簧判定帶失效）——**裁決維持
     fixedStep:true（確定性物理），禁止以 variable step 或全域取整掩蓋**。
  4. sprite anchor / CSS 旋轉殼：無異常（座標鏈 §28/§34 現值正確）。
  5. 動畫姿態層：v5「走動不像走動」主因——貼圖平移滑行，僅低頻 bob，無步頻/姿態/音畫拍點。
- 速度驅動步頻系統（零新素材，程序化）：
  - 相位累積 ∝ |vx|/moveSpeed，全速步頻 3.2Hz；停走相位歸零凍結。
  - y 軸 bob：|sin| 雙頻小彈跳（峰值 3.2px，速度比縮放），沿用 PRE/POST_UPDATE 視覺
    偏移通道（不污染物理）。
  - 前傾 lean 0.06rad + 步頻搖擺 sway 0.045rad（面向鏡像）；空中依 vy 前後傾
    （上升後仰 -0.1、下墜前傾 +0.14 夾限）。
  - 落腳拍點（|sin| 每半週期回零）：池化腳塵 emitter explode ×2＋低量 footstep zzfx。
  - idle 呼吸：週期 2.4s、scaleY ±1.8%（squash tween 進行中讓位）。
  - 既有起跳 stretch / 落地 squash / 起跑急停轉身塵埃（§41）維持不動。
  - 主角輪廓對比（三席審查補修）：深紫剪影背襯（本體 1.1 倍 FILL tint image，POST_UPDATE
    鏡像貼圖/翻面/縮放/bob），草原亮底對比 1.81:1 提升至實測 10.23:1（≥3:1 門檻）；
    不用 Glow filter——SwiftShader/低階 GPU 逐幀模糊採樣致幀率崩跌。
- 幀證據：`screenshots/starpuff-v6/before/`（v6 基準連拍）與 `screenshots/starpuff-v6/after/`
  （v7 步頻連拍＋idle 呼吸）；e2e 行為斷言走 `__sp.walk()`（rotation 振盪、bob>0、停走歸零）。

## 46. v7 雙味混合星彈（config STAR_MIXES 為 SSOT，表驅動）

- 規則（KISS 裁決，`swallowIntoMagazine` 單一入口）：
  - 依序吞兩隻**不同**怪且頂槽為素槽（未強化/非金/非混）且配方存在 → 頂槽合成混合星
    （佔 1 槽）；HUD 星芯顯示配方色、外圈顯示第二味屬性色（雙色可讀）。
  - 同怪疊加 = 強化單味（§23 不變）；無配方對照 → 推新槽（§23 不變）。
  - 取消/覆蓋規則：混合槽為**終態**——不可再強化、不可再混（再吞任何怪推新槽）；
    滿匣改吞維持覆蓋頂槽（§20），混合槽在頂被覆蓋即取消；滿匣且頂槽配方成立時優先合成。
  - **anti-softlock 硬規則：混合星永不為破關必需——基礎星彈恆可通關**（配方僅為威力加成，
    關卡配額/魔王皆可純標準星磨死；§26 飢荒保證律不變）。
  - 首遇情境提示（三席審查補修）：本 session 首次取得某味/首次合成某配方時，頂部 toast
    一行文案（名稱＋一句效果，SSOT `core/codex.ts` FLAVOR_HINTS/MIX_HINTS）；seen 集合
    僅存 session 記憶體，不動 save schema。
- 混合表（六式；效果自 穿透/追蹤/散射/爆炸/凍結場/連鎖電 擇優組合）：

| 配方   | 成分            | 效果                                                                      | tint    | pitch |
| ------ | --------------- | ------------------------------------------------------------------------- | ------- | ----- |
| 疾光星 | jelly + floaty  | 穿透 3、彈速 780（穿透）                                                  | #FFF1C4 | 1.35  |
| 巨爆星 | jelly + puffy   | 直傷 6、AoE 110px/4 傷（爆炸）                                            | #FF9D7A | 0.70  |
| 追電星 | floaty + zappy  | 飛行中追蹤最近敵（轉向 0.006rad/ms、鎖敵 320px）＋雷鏈 ×2（追蹤＋連鎖電） | #C9B8FF | 1.30  |
| 雷爆星 | puffy + zappy   | AoE 70px/3 傷＋雷鏈 ×3（爆炸＋連鎖電）                                    | #FFD24D | 0.90  |
| 碎鑽星 | shelly + drilly | 發射分裂 3 發扇形（±90vy）、各傷 6、穿透 1（散射＋穿透）                  | #9ADFD2 | 0.80  |
| 凝光星 | drilly + glowy  | 命中生成 100px 凍結光域 1.5s，域內小怪停擺冰藍（凍結場）                  | #FFF7D6 | 1.15  |

## 47. v7 新怪物 ×2（全原創；素材 codex imagegen 僅此 2 張，風格與既有嚴格一致）

- 鑽鑽鼴 Drilly（sandy-brown 鑽頭鼴鼠果凍，`minion-drilly`）：
  - FSM（`logic/enemyFsm.ts`）：潛地 burrow 2.2s（僅露鰭——壓扁貼地 0.55×/0.3× 半透明，
    朝玩家 x 潛行 90px/s；**不可吸、不可傷、觸碰無害、吸力不彈開**）→ 前搖 windup 0.5s
    （定點鰭抖動＋落點預警 telegraph）→ 破土 surfaced 1.4s（躍出 -360 攻擊；**可吸可傷**）→ 回潛。
  - 吞下得**重鑽星**：傷害 7、彈速 430、穿透 2（低速高傷）。條件可吸（破土窗），
    spawner 保證律保守值不計入可吸佔比。
- 提燈水母 Glowy（warm-cream 提燈水母果凍，`minion-glowy`）：
  - FSM：緩慢漂近 26px/s＋正弦浮動 → 週期 4s 末段 0.9s 預警圈先行（由小到滿半徑擴張
    ＋明暗閃爍）→ 釋放範圍脈衝（半徑 80、傷害 1，走 hazards 管線）。恆可吸。
  - 吞下得**流光星**：傷害 5、彈速 540、命中 90px 光域 AoE 2 傷。
- 入編：L2 glowy 10%（可吸佔比 60%）；L3 八種混編 drilly/glowy 各 10%（可吸佔比 55%，
  drilly 保守不計）。圖鑑 5×2 網格收錄十隻；混合表（§46）與技能頁同步。

## 48. v7 中魔王精英系統（levels.ts elite 為 SSOT，零新美術）

- 每走動關中段一隻精英變體（既有怪 tint＋scale＋血量池＋FSM 參數強化）：

| 關  | 精英           | 基底   | HP  | scale | 強化（speedMul）            | 掉落稀有味 |
| --- | -------------- | ------ | --- | ----- | --------------------------- | ---------- |
| 1   | 粉紅暴走果凍丁 | jelly  | 10  | 1.6   | 跳頻/衝量 ×1.5              | glowy      |
| 2   | 鋼青重殼殼     | shelly | 14  | 1.55  | 走速 ×1.4（血量池制不縮殼） | drilly     |
| 3   | 暗紫狂咬花     | chompy | 20  | 1.5   | 前搖/冷卻縮時 ×1.6          | glowy      |

- 精英房流程：玩家接近（臂距 480px）且星星門未開 → 武裝——生成精英＋軟鎖門
  （半透明果凍門柱，可退不可進）＋頭頂血條；擊敗 → 開門＋稀有味小怪（走正式 spawn
  管線，吞下即得稀有星味）＋回復食物（心形拾取 +2 HP，15s 未拾自動淡逝）。
- 反卡關雙保險：60s 逾時自動開門（精英留場可略過）；星星門已開（配額達成）後不再
  武裝——關卡已進尾端 release 節奏，既有走查路徑不受影響。精英不可吸、擊殺計入配額；
  白閃後回套變體 tint 維持精英識別。
- 房界箝制（三席審查補修）：精英越房界（左界鏡像門距、右界門前內縮 48px）即回夾並朝
  房內反向（`stageModel.clampEliteX` 純函式），不出房追殺，60s 開門保險恆有效。

## 49. v7 每關攻略 PoC 與節奏補訂（引入→練習→考驗→獎勵）

| 關  | 引入（0-25%）          | 練習（25-45%）       | 考驗（45-65% 精英房）       | 獎勵（65-100%）                  | 怪物密度（interval/maxOnScreen） |
| --- | ---------------------- | -------------------- | --------------------------- | -------------------------------- | -------------------------------- |
| 1   | 教學浮字＋jelly/floaty | 單向平台＋反向彩蛋   | 粉紅暴走果凍丁（跳頻 1.5×） | glowy 稀有味＋回復→混合初體驗→門 | 2600ms / 3（低壓）               |
| 2   | spiky/殼殼威脅初登場   | 移動平台＋彈簧＋雲台 | 鋼青重殼殼（血量池 14）     | drilly 稀有味→碎鑽星可解鎖→門    | 1800ms / 4（中壓）               |
| 3   | 八種混編暖場           | 破磚支線＋吞序彩蛋   | 暗紫狂咬花（攻速 1.6×）     | glowy 稀有味＋雷爆/凝光清場→門   | 1300ms / 5（高壓）               |
| 4   | 魔王入場運鏡           | P1 讀招（rain/slam） | P2 dash＋P3 狂暴皇冠        | 皇冠彩蛋＋星暴終結               | 補生 3500ms / 2                  |

- 攻略 PoC（v7 增補，§43 表仍有效）：
  - L1 最佳線：反向拿 +1 HP → 中段殺精英拿 glowy＋回復 → 吞 jelly+floaty 合成疾光星速清尾段。
  - L2 最佳線：雲台三連站拿滿匣 → 精英房前吞 shelly 備殼盾 → 擊敗重殼殼拿 drilly →
    shelly+drilly 碎鑽星掃平台群怪。
  - L3 最佳線：吞 zappy＋puffy 合成雷爆星清簇 → 精英房 drilly+glowy 凝光星凍場安全輸出
    → 金星彈留給 chompy。
  - 主線恆不依賴精英/混合星（§46 anti-softlock）；精英房 60s 逾時門自動開。
- e2e 通關 bot（`__sp` hooks 驅動）：L1 精英線全程通關案、L3 開門走查案（八種混編在場）、
  精英軟鎖門阻擋/開門案、混合星彈案、drilly 免傷窗案、走動 bob 行為斷言案（v7.spec.ts）。

---

# v8 擴充：世界擴張（PM 親撰）

## 50. v8 關卡 4→7 與雙魔王總覽（levels.ts 資料驅動擴充）

流程擴為：L1-L3 → L4 果凍王 → L5-L6 → L7 暗月蝠王（第二魔王收尾）（v9 已由 §60 擴為
九關；v10 已由 §65 取代：十二關三魔王）。解鎖鏈沿 §39
（第 N 關需 N-1 通關）；世界地圖擴為七節點鋸齒路徑（節點半徑收斂 30），新節點沿用
迷霧鎖定態。save schema v1 不變——舊存檔（≤4 關條目）原樣載入，L5 依解鎖規則自然
開放、L6/L7 鎖定（相容契約見 save.test「v8 存檔相容」與 e2e「舊存檔相容」案）。

| #   | 關卡     | bgKey      | 世界寬 | 配額 | 間隔   | 主場機制                       | 精英             |
| --- | -------- | ---------- | ------ | ---- | ------ | ------------------------------ | ---------------- |
| 5   | 翔風峽谷 | bg-canyon  | 3300   | 10   | 1500ms | 上升氣流柱（§51）、Gusty 主場  | 狂風飄鳥 ×1      |
| 6   | 迴聲石廊 | bg-gallery | 3600   | 12   | 1200ms | Boomy 迴旋彈道、複合陣、全混編 | 雙精英（§52）    |
| 7   | 蝕月王座 | bg-eclipse | 854    | —    | 3200ms | 第二魔王 Noctra（§54）         | —（Boss 即高潮） |

- LevelSpec 契約變更：`elite: EliteSpec | null` → `elites: readonly EliteSpec[]`（L6 雙精英）；
  `boss: boolean` → `boss: 'jellord' | 'noctra' | null`（truthy 語意與舊 boolean 相容）。
- L6 混編為全十二種怪高密度（interval 1200 / maxOnScreen 5），可吸佔比 0.72
  （shelly/drilly 條件可吸保守不計）。
- bg 貼圖策略（§55）：L5/L7 新 biome 各生成 1 張；L6 重用 `bg-arena-l`（TEXTURE_ALIAS）
  ＋深紫 grade 與回聲光塵 ambience 辨識；三關道具條沿用既有主題（heights/arena/throne）。

## 51. v8 上升氣流機制（logic/updraft.ts，pure TS 可測）

- zone 型非碰撞元素（`{ kind: 'updraft', x, topY, w }` 入 levels elements 表）：
  柱域＝柱寬內、柱頂 topY 與地面頂（400）之間。
- 升力：柱域內逐幀向上加速 1600px/s²、升速夾限 -330（低於跳躍初速 420，柱內可控）；
  柱頂以上不供力自然拋出（無「黏頂」）。
- anti-softlock（§56）：頭頂受阻（blocked.up）即不供力交還重力；柱頂距世界頂 ≥100px
  （資料驅動測試守門）；主線恆走地面雙層——208 高台為氣流專屬支線（彩蛋/探索），
  資料不變式：y < 272 的平台必須被氣流柱涵蓋（levels.test 守門）。
- 呈現：柱體淡色矩形（alpha 0.12）＋上飄粒子（池化、單柱同活 ≤10），854/1200 皆 60fps。

## 52. v8 新怪物 ×3 與雙精英（FSM-first；素材 §55）

全部 FSM-first 進 `logic/enemyFsm.ts`（時序純函式），呈現接 `systems/enemyUpdates.ts`
per-kind：

- 孢子菇 Spora（鼠尾草綠 `minion-spora`）：定點紮根（immovable），週期 3.6s——末段 0.7s
  預警圈擴張 → 向上噴孢子雲（頭頂 -64、半徑 66、滯留 1.6s 區域拒止，走 hazards 管線，
  觸擊即散）。恆可吸 → **孢子星**（傷害 4、命中緩速 2.2s＋每 0.7s 輕持續傷 1；緩速期
  水平速度封頂 60px/s、孢綠著色，enemies.update 中央結算）。
- 風飄鳥 Gusty（淡天藍 `minion-gusty`）：四態 drift（水平漂移＋正弦浮動）→（玩家於斜下
  觸發域 200px）→ windup 0.5s（懸停抖動預警）→ dive 0.6s（鎖定前搖結束當下玩家位置
  340px/s 撲擊，之後不修正可預判閃避）→ recover 0.9s 回升航高。drift 期近域
  （130×90px）產生側風——推離方向 60px/s positional drift（不與速度控制器對抗），
  與 L5 氣流主題呼應。恆可吸 → 歸入既有**疾風味**（避免味數爆炸）。
- 迴力殼 Boomy（暖陶土橘 `minion-boomy`）：四態 walk 2.2s（緩速巡邏 55px/s、bounce 折返）
  → windup 0.5s（定身舉殼抖動）→ throw（投擲迴旋殼刃：360px/s 去程勻減速、0.8s 折返、
  回程同判定；壽命 2.0s 必回收——**回程彈不可穿門鎖死**（§56））→ cool 1.4s。恆可吸 →
  **迴旋星**（§53）。
- 雙精英（L6）：重殼迴力守衛（boomy 基底，HP 16、×1.3，掉流光味）＋暗雷水母（zappy
  基底，HP 18、×1.5 追速，掉重鑽味）；房址 1300/2500（房距 1200 ≥ 2×門距不重疊），
  沿 §48 全套（軟鎖門/60s 逾時/房界箝制）。L5 精英狂風飄鳥（gusty 基底 ×1.4）掉
  **迴旋味**（L6 主場怪先行體驗，沿 v7 L1 掉 glowy 慣例）。
- 圖鑑（§36 擴充）：7×2 十四格（十二小怪＋果凍王＋暗月蝠王）；立繪縮 50px、字級同步
  收斂（v7 5×2 十格佈局由本節取代）。

## 53. v8 星彈九系與新混合三式（config 表驅動擴充）

七系 → 九系（§20/§40/§47 擴充）：

| 吞下  | 星彈屬性 | 效果                                                     | 視覺              |
| ----- | -------- | -------------------------------------------------------- | ----------------- |
| spora | 孢子星   | 傷害 4、命中緩速 2.2s（速度封頂 60）＋輕持續傷（1/0.7s） | 孢綠 tint #A8D8A0 |
| boomy | 迴旋星   | 傷害 5、速度 520、穿透 1；去程 0.9s 勻減速折返、雙程判定 | 陶橘 tint #E8A878 |

- StarFlavorSpec 擴欄：`slowMs`/`dotDamage`（緩速持續傷）與 `boomerang`（迴旋彈道）；
  緩速/DoT 由 enemies.update 中央結算（單點），迴旋彈道由 `boomerangVelocity` 純函式
  驅動（GameScene 逐幀轉向、壽命 2.2s 必回收）。
- 混合三式（STAR_MIXES 六 → 九；§46 規則不變，混合彈永不為破關必需）：

| 配方     | 成分           | 效果                                                      | tint    | pitch |
| -------- | -------------- | --------------------------------------------------------- | ------- | ----- |
| 毒爆雲   | spora + puffy  | AoE 90px/3 傷＋波及未死者緩速 2.6s 持續傷（爆炸＋緩速場） | #BCE8A0 | 0.75  |
| 電鋸迴旋 | boomy + zappy  | 迴旋雙程判定＋每次命中跳電 ×2（回程同樣鏈電）             | #F5D878 | 1.28  |
| 迴風刃   | boomy + floaty | 速度 620、雙程各穿透 2 的長弧掃割（第三式 PM 手感裁量）   | #C8DCF5 | 1.40  |

- 「星彈七系」字樣全數改九系（codex 技能頁/README）；FLAVOR_HINTS/MIX_HINTS 同步九味九式。

## 54. v8 第二魔王：暗月蝠王 Noctra（logic/noctraFsm.ts 表驅動，空中型）

與果凍王（地面型 §6）區隔的空中型三階段；phase truth 全數收斂 noctraFsm，禁止散落
scene。呈現層 `systems/noctra.ts` 與 boss.ts 共用 `BossHandle` 介面與 BOSS\_\* 事件契約
（GameScene 依 `level.boss` 品種擇一建立，HUD/fx/結算零分支）。

- 數值：HP 70、身體傷害 1、P2 ≤60%、P3 ≤30%、狂暴節奏 ×1.25、每損 10 HP 掉補給小怪
  （§26 飢荒保證律不變——基礎星彈恆可通關）。（v9 已由 §63 難度根修取代：HP 52、
  狂暴 ×1.15、每損 8 HP 補給；實測 0% 勝率歸因與全參數表見 §63。）
- 招式循環（表驅動 `noctraAttackCycle`；換階段循環游標重置）：
  - P1 `bomb（盤旋投彈 ×4，落點預警先行）→ dive（俯衝：telegraph＋shake＋變色前搖
0.55s → 鎖定點撲擊 → 回升）`
  - P2 `bomb ×5 → dive → dive（俯衝連擊）→ summon（召喚 floaty，場上上限 2——cap 由
FSM 指令帶出、GameScene 依現量夾限走正式 spawn 管線）`（v9 已由 §63 取代：單 dive、
    bomb ×3）
  - P3 `barrage（狂暴彈幕：全向放射彈環 ×10）→ sweep（全場俯掠：橫帶預警閃爍 0.6s 後
貼 y=280 帶速掠全場，站立可躲）→ bomb`
- telegraph 全數必備：dive 落點標記、sweep 橫帶閃爍、bomb 落點標記、階段轉換體色循環
  （P2 白紅、P3 金紫）＋白閃抖動；統一走 systems/fx 慣例。
- 盤旋駕駛：常態沿視寬正弦盤旋（高度 168±14 呼吸浮動）；dive/sweep tween 接管期間讓位
  （steering 互斥），死亡冪等（FSM defeated 單向鎖存，演出僅執行一次）。（v9.1 已由 §64
  補訂：接管結束改速度上限逼近歸位，禁止相位座標直寫——修正返空瞬移。）
- 可達性：玩家跳躍＋拍翅 ×3 可觸及盤旋帶；dive/sweep 主動進入地面帶提供輸出窗；
  補給小怪維持彈藥循環。擊破沿 §17 演出（皇冠戰利品：蝠「王」同為王權敘事）。
- anti-softlock：入場運鏡 active 前傷害靜默忽略；退出/重整走 §35 暫停與 scene restart
  標準路徑（無門鎖、擊破制勝利）；通關寫存檔沿 BOSS_DEFEATED 即記。

## 55. v8 美術資產（codex imagegen 專用；配額 6/6 用滿）

| 檔名             | 內容                                        | 規格                |
| ---------------- | ------------------------------------------- | ------------------- |
| minion-spora.png | 孢子菇：鼠尾草綠 #A8D8A0 圓菇、奶油斑點     | 2048 透明 → 512webp |
| minion-gusty.png | 風飄鳥：淡天藍 #A8CBF0 圓鳥、後掠翼、風渦   | 2048 透明 → 512webp |
| minion-boomy.png | 迴力殼：暖陶土橘 #E8A878 犰狳、舉新月殼刃   | 2048 透明 → 512webp |
| boss-noctra.png  | 暗月蝠王：暮光紫 #7A6FD8 蝙蝠、銀月冠、星翼 | 2048 透明 → 512webp |
| bg-canyon-l.png  | 翔風峽谷橫景：暖杏糖霜峽谷、風痕絲帶        | 1536×512 無縫平鋪   |
| bg-eclipse-l.png | 蝕月王座橫景：薰衣草夜空、金月、紫塔剪影    | 1536×512 無縫平鋪   |

重用評估結論：L6 迴聲石廊重用 `bg-arena-l`（同族星空回廊）＋grade/ambience 變化；三關
道具條全數重用既有主題（heights/arena/throne），不另生成。素材 ticket 與生成腳本存
epic 資料夾（art-v8-ticket.md / run-art-v8.sh）。

## 56. v8 每關攻略 PoC 與 anti-softlock 不變式

| 關  | 引入（0-25%）          | 練習（25-45%）          | 考驗（45-70% 精英）         | 獎勵（70-100%）              | 密度        |
| --- | ---------------------- | ----------------------- | --------------------------- | ---------------------------- | ----------- |
| 5   | gusty/spora 亮相＋首柱 | 氣流高台＋彩蛋（×2 站） | 狂風飄鳥（俯衝 1.4×）       | 迴旋味先行體驗→毒爆雲可解→門 | 1500ms / 5  |
| 6   | 全混編暖場＋破磚支線   | 移動平台×2＋彈簧×2      | 雙精英逐房（迴力守衛/暗雷） | 稀有味雙掉落＋吞序彩蛋→門    | 1200ms / 5  |
| 7   | Noctra 入場運鏡        | P1 讀招（bomb/dive）    | P2 俯衝連擊＋召喚           | P3 彈幕俯掠＋星暴終結        | 補生 3200ms |

- 攻略 PoC：
  - L5 最佳線：地面雙層推進 → 乘柱上 208 高台連站 ×2 拿 +1 HP → 精英房前吞 spora 備
    緩速 → 擊敗狂風飄鳥拿 boomy → spora+puffy 毒爆雲清尾段 → 門。
    保底線：全程地面層，吸 jelly/floaty/spora 點射，氣流柱可完全不碰（§26 保證律）。
  - L6 最佳線：破磚補彈 → 吞 boomy+zappy 電鋸迴旋清簇 → 第一房擊破拿 glowy → 移動平台
    帶推進 → 第二房擊破拿 drilly → drilly+glowy 凝光星凍場安全輸出 → 吞序彩蛋金星彈
    留給 chompy → 門。保底線：逐隻吸射、雙精英 60s 逾時門自動開，可全略過。
  - L7 最佳線：開場 5s 內命中拿彩蛋 → 補給小怪憋滿匣星暴（12 傷）→ P1/P2 於 dive 回升
    窗跳打 → P3 貼地躲 sweep、拍翅穿彈幕縫。保底線：純標準星點射＋跳閃 bomb 落點，
    飢荒立即補生保證彈藥（§26）。
- anti-softlock 不變式（全部 MUST，測試守門）：
  - 氣流柱不可卡頂/卡牆：柱頂 ≥100（levels.test）＋blocked.up 斷供（updraft.test）；
    升力止於柱頂自然拋出。
  - Boomy 回程彈不可穿門鎖死：殼刃壽命 2.0s ≥ 2×折返時（enemyFsm.test），逾時必回收。
  - Noctra 退出/重整/離線恢復不鎖門：boss 關無門、擊破制；BOSS_DEFEATED 即寫存檔。
  - 精英沿 v7 §48 全規則（房間箝制＋60s 逾時開門）；L6 雙房房距 ≥600（levels.test）。
  - 混合星永不為破關必需（§46 硬規則不變）；L5/L6 可吸佔比 ≥50%（levels.test）。
- e2e 通關 bot（v8.spec.ts）：舊存檔相容七節點案、L5 氣流升空案、L5 精英線通關案、
  L6 雙精英逐房通關案、Noctra 三階段擊破入結算案、新混合三式案、spora/boomy 行為案。

---

# v9 擴充：星化與挑戰（PM 親撰）

## 57. v9 星化變身系統（logic/transform.ts 純狀態機，表驅動）

- 觸發：彈匣內同系可變身星彈合計 ≥3 發（強化槽為連吞兩發合成、計 2 發；金星/混合槽
  破壞資格）時 HUD 彈藥列脈動亮起變身提示；**地面**長按吸入鍵 0.6s 觸發（吸入拉怪
  進行中與空中不可起手；不新增實體按鍵）。消耗全部彈匣進入形態，持續 10s（玩家頭頂
  倒數環），到時自動解除；再長按 0.6s 提前解除（不返彈）。
- 語意讓位（輸入矩陣，`resolveActionPress`/`resolveTransformHold`）：同系 ≥3 星情境
  長按＝星化（優先於星暴與殼盾）；非同系滿匣長按維持星暴；頂槽殼盾星未滿匣維持舉盾；
  點按放開（<150ms）仍發射。變身期間吸入停用（B 鍵改役），星暴/殼盾不充能。
- 三形態（各改變 移動＋攻擊＋防禦 至少兩項；zappy→雷化、floaty/gusty 味→風化、
  shelly→殼化）：

| 形態           | 移動                                | 攻擊                                                                              | 防禦                                            |
| -------------- | ----------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| 雷化 Voltform  | 移速 +15%                           | 身體帶電接觸傷害 2；B 點按短程鏈電束（170px 內最近敵 3 傷＋跳電 2×2 傷，CD 0.9s） | —                                               |
| 風化 Galeform  | 拍翅無上限＋升力 -330（近自由飛行） | B 點按穿透風刃（傷害 4、速度 640、無限穿透，CD 0.35s）；落地 44px 衝擊 1 傷       | —                                               |
| 殼化 Shellform | 移速 -20%                           | 下砸範圍加倍（120px）                                                             | 受傷減半（0.5 傷害池累積）＋反彈魔王彈幕（§58） |

- 呈現：變身爆發（星爆＋擠壓）＋形態專屬 aura 粒子（三 emitter 常駐池化、僅啟用當前
  形態、maxAlive 14）＋形態立繪（hero-volt/gale/shell，素材未載退回一般姿勢）。
- anti-softlock 硬規則：**變身永不為破關必需**——全關卡純標準星保底線不變（§26/§46
  同律）；變身資格味（zappy/floaty/shelly）非全關卡保證供給，僅為威力加成路徑。

## 58. v9 魔王攻略多樣化與 EX 變體（表驅動擴充，禁止散落 scene）

- 攻略路徑（每魔王 ≥3 條可行路徑，PoC 全數驗證）：
  - 果凍王 Jellord：① 標準線——吸補生小怪點射＋跳閃 slam/dash 磨死；② 殼化反彈線——
    L4 補生加入 shelly（暈眩窗可吸），殼化後站定將果凍雨反彈回傷（reflect 3 傷/顆）；
    ③ 頭頂下砸線——下砸命中頭頂（上半身）觸發短暈 0.9s（`BOSS.slamStunMs`，表驅動
    hit window）輸出窗，命中回彈不吃體傷；④ 滿匣星暴 12 傷速攻。
  - 暗月蝠王 Noctra：① 標準線——補給點射＋dive 回升窗跳打；② 雷化斷召線——L7 補生
    加入 zappy，雷化鏈電命中召喚蓄勢中的 Noctra 立即中斷召喚（`interruptSummon`）；
    ③ 俯衝下砸線——俯衝落地瞬間 0.6s 窗內頭頂下砸觸發長暈 1.8s（`NOCTRA.diveStunMs`）；
    ④ 彈簧板線——boss 房雙彈簧板（x 190/664，過 stageModel 掃掠背擋）提供非風化到空
    路徑貼打盤旋帶；⑤ 風化自由飛行貼身輸出。
- EX 變體（已通關 L4/L7 節點顯示「EX 挑戰」第二入口；`EX_MODS` 兩魔王共用）：
  - 數值：HP ×1.5（果凍王 90／蝠王 78——蝠王基準沿 §63 難度根修後 52 再乘 EX 係數）、
    全節奏 ×1.15；入場後緋紅呼吸循環變色演出。
  - 果凍王 EX 新 pattern：擊破時分裂 3 隻小果凍（`split` 事件表驅動、走正式 spawn 管線）。
  - Noctra EX 新 pattern：P3 循環追加「月蝕彈幕矩陣」（`eclipse`：9 列 ×2 波直落彈網、
    每波隨機留 2 缺口通道、落點 telegraph 先行）。
  - 通關記錄 `exCleared`（save v1 additive 欄位：預設 false、僅信任明確 true、舊檔載入
    不 crash——e2e 守門）；EX 通關於地圖節點與圖鑑魔王條目掛紫星紀念章；L9 通關後地圖
    提示 EX 入口解鎖。EX 通關不動一般 cleared/bestTime。

## 59. v9 新怪物 ×2（FSM-first 進 enemyFsm，均歸既有味系）

- 磁極獸 Magno（鋼藍灰 `minion-magno`）：緩行 idle 2.4s → 前搖 windup 0.7s（預警圈
  擴張＋閃爍）→ 磁場 field 1.9s（150px 磁域：**吸偏玩家飛行中星彈**（`magnetPull`
  逐幀彎折彈道）＋磁殼星彈免傷（`resolveMagnoStarHit`）——鼓勵近戰/下砸/變身應對；
  下砸/波及/接觸傷害照常結算）→ 回 idle。恆可吸 → 歸**雷鏈味**（zappy）。
- 鏡面蟲 Mirri（珍珠銀紫 `minion-mirri`）：巡邏 roam 2.4s（末段 0.4s 亮銀預告閃爍
  telegraph）→ 鏡面 mirror 1.5s（定身亮銀高光：**反射玩家星彈**為朝玩家的傷害彈
  （反射彈 1 傷、壽命 1.4s 必回收），`resolveMirriStarHit`）→ 冷卻 cool 1.1s（黯淡
  明確可打窗）→ roam。恆可吸 → 歸**迴旋味**（boomy）。
- 圖鑑（§36/§52 擴充）：8×2 十六格（十四小怪＋雙魔王）。

## 60. v9 關卡 7→9 與世界地圖（levels.ts 資料驅動擴充）（v10 已由 §65 取代：十二關與十二節點）

| #   | 關卡     | bgKey     | 世界寬 | 配額 | 間隔   | 主場機制                            | 精英          |
| --- | -------- | --------- | ------ | ---- | ------ | ----------------------------------- | ------------- |
| 8   | 磁極洞窟 | bg-cavern | 3400   | 11   | 1400ms | Magno 磁場干擾＋drilly 地下突襲組合 | 磁暴磁極獸 ×1 |
| 9   | 鏡影迴廊 | bg-mirror | 3700   | 12   | 1150ms | Mirri 反射＋移動平台複合陣          | 雙精英        |

- 新組合情境：L8 磁場（彈道不可靠）×drilly（地下突襲）→ 近戰/下砸/星化應對；
  L9 鏡面反射 × 雙移動平台/雙彈簧 → 反射窗躲位靠垂直機動；magno/mirri 雙新怪同場。
- L8 開場 hint 浮字（LevelSpec.hint 資料驅動，沿教學浮字機制）：首次星化教學
  「同系星彈集滿 3 發，地面長按吸入鍵 0.6 秒星化變身」；起手區前 500px 無精英
  無破磚（安全教學帶）。
- L9 雙精英：銀鏡鏡面蟲（mirri 基底 HP 17 ×1.4，掉孢子味）＋暗磁磁極獸（magno 基底
  HP 19 ×1.3，掉迴旋味）；房址 1250/2550（房距 1300 ≥ 2×門距）。
- 世界地圖九節點鋸齒路徑；解鎖鏈沿 §39；save schema v1 不變——v8 舊檔（≤7 關）載入
  L8 自然開放、L9 迷霧鎖定（save.test／e2e 守門）。
- 背景重用（§55 慣例，不生成新背景）：`bg-cavern`→`bg-eclipse` 貼圖（鋼藍 grade＋
  磁塵 ambience）、`bg-mirror`→`bg-arena` 貼圖（銀鏡 grade＋鏡光塵 ambience）；
  道具條沿用 arena 主題（晶洞/鏡晶質感）。
- 攻略 PoC：
  - L8 最佳線：起手吞 zappy×3 存雷化 → 磁場期近戰/下砸清 magno → 精英房前星化雷化
    貼身鏈電 → 擊敗磁暴磁極獸拿 drilly → 破磚補彈 → 門。
    保底線：全程等 field 週期空檔（idle/windup 5.1s 窗）純標準星點射，磁場可完全
    不進域（§26 保證律，可吸佔比 0.74）。
  - L9 最佳線：吞 mirri/boomy 湊迴旋味彩蛋滿匣 → 鏡面 cool 窗集火 → 第一房銀鏡蟲
    擊破拿 spora → 移動平台帶推進 → 第二房暗磁獸擊破拿 boomy → 門。
    保底線：mirror 1.5s 定身期繞行或等 cool 窗（黯淡明確可打），雙精英 60s 逾時門
    自動開，可全略過。
  - EX 果凍王最佳線：殼化反彈 P1/P2 彈幕回傷 → P3 頭頂下砸短暈接星暴；EX Noctra
    最佳線：雷化斷召＋eclipse 走缺口通道、dive 窗下砸長暈輸出。
- anti-softlock 不變式（測試守門）：mirri 反射彈壽命 1.4s 必回收；magno 磁場僅影響
  星彈（近戰路徑恆存）；L8/L9 可吸佔比 ≥50%（levels.test）；雙精英房距 ≥600；
  EX 為選配挑戰（不阻主線、無新解鎖依賴）。

## 61. v9 美術資產（codex imagegen 專用；配額 5/5）

| 檔名             | 內容                                         | 規格                |
| ---------------- | -------------------------------------------- | ------------------- |
| hero-volt.png    | 噗噗雷化：電黃電弧環身、閃電呆毛、自信笑     | 2048 透明 → 512webp |
| hero-gale.png    | 噗噗風化：風藍渦紋、氣流小翼、飄浮姿         | 2048 透明 → 512webp |
| hero-shell.png   | 噗噗殼化：青綠圓甲殼片、殼紋高光、壯站姿     | 2048 透明 → 512webp |
| minion-magno.png | 磁極獸：鋼藍灰圓胖獸、馬蹄磁鐵角（紅藍極點） | 2048 透明 → 512webp |
| minion-mirri.png | 鏡面蟲：珍珠銀紫圓甲蟲、拋光鏡面背甲高光帶   | 2048 透明 → 512webp |

背景不生成：L8/L9 重用既有橫景＋grade/ambience 變化（§60）。素材 ticket 與生成腳本
存 epic 資料夾（art-v9-ticket.md / run-art-v9.sh）。

## 62. v9 慈悲補血愛心（logic/mercyHeal.ts 純決策，保底機制非資源農場）

- 機制參數表（`MERCY_HEAL`，RNG 與時鐘由呼叫端注入供測試）：

| 參數     | 值              | 說明                                       |
| -------- | --------------- | ------------------------------------------ |
| 評估間隔 | 5000ms          | 每 5s 評估一次（未過門檻僅重置計時不擲骰） |
| 血量門檻 | HP ≤ 總血量 1/3 | 5 血制即 HP ≤1                             |
| 久戰門檻 | ≥60s            | 本關（本命）經過時間                       |
| 生成冷卻 | ≥45s            | 距上次愛心生成                             |
| 觸發機率 | 35%             | 全門檻通過後擲骰                           |
| 每命上限 | 2 次            | 死亡重試/重開關卡即重置                    |
| 回復量   | +1 HP           | 走既有回復管線                             |

- 生成呈現（重用共用愛心拾取管線 systems/pickups.ts，勿新造 pickup 系統）：隨機擇一
  ——空中緩降型（y=150 起以 26px/s 緩慢飄落至地面錨點，降落中可接住）或地面定點型
  （地面錨點浮動）；位置＝玩家 ±120-240px、夾限世界內（下界 50 保玩家貼牆可達）；
  生成時輕微閃光（burstSmall 粉）＋zzfx reveal 提示音。
- 適用範圍：一般關與魔王關（含 EX）皆啟用；HUD 無新元素。
- 判定：拾取走逐幀 AABB＋水平掃掠幾何判定（§43 direct pair 漏檢慣例修法），
  高速走過必中；15s 未拾取自動淡逝。
- 平衡定位：上限與冷卻硬性，非資源農場；不影響 §26 反卡死保證律（彈藥飢荒補生
  獨立運作）。

## 63. v9 Noctra 難度根修（實測席稽核回寫；bot 勝率門檻收斂定案）

**根因**（v8 出貨值，雙水準 bot 對線上 0.6.0 實測普通/熟練勝率皆 0%、傷害進度近 0%）：
`HOVER_Y=168` 盤旋帶與地面水平星彈幾何錯開——有效輸出窗僅剩俯衝貼地縫，P1 bomb/dive
約 15s 殺穿玩家；「基礎星彈恆可通關」保底線名存實亡。

### 63.1 調參前後值（基準表；EX 沿新基準 ×1.5/×1.15）

| 位置      | 參數                            |               v8 出貨 |                       v9 根修 | 目的                                                                                             |
| --------- | ------------------------------- | --------------------: | ----------------------------: | ------------------------------------------------------------------------------------------------ |
| noctra.ts | `HOVER_Y`                       |                   168 |                       **246** | 體底降入單跳星彈可打帶（含 ±14 浮動恆可命中）                                                    |
| noctra.ts | `SIDE_MARGIN_X`                 |                   130 |                       **190** | 收窄掃幅，牆側留玩家喘息帶（錨點打法成立）                                                       |
| noctra.ts | 盤旋掃速                        |                0.0009 |                    **0.0007** | 峰值橫移降至玩家走速下，保距走位可行                                                             |
| noctra.ts | `DIVE_TELEGRAPH_MS`             |                   550 |                       **720** | 普通反應（250-400ms）可讀可躲                                                                    |
| noctra.ts | `SWEEP_TELEGRAPH_MS`            |                   600 |                       **750** | 俯掠可讀                                                                                         |
| noctraFsm | `diveHoldMs`                    |                    無 |                       **300** | 俯衝落地滯留＝地面明確輸出窗                                                                     |
| noctraFsm | `diveDurationMs`                |                  1500 |                      **2100** | 容納前搖＋滯留（EX 最高速率下不與下招重疊）                                                      |
| noctraFsm | `diveStunWindowMs`              |                   600 |                       **900** | 頭頂下砸長暈窗涵蓋滯留段                                                                         |
| noctraFsm | `idleMs`                        |                  1100 |                      **1600** | 表觀 hit window ≥55%                                                                             |
| noctraFsm | `bombCountP1/P2`                |                   4/5 |                       **2/3** | P1/P2 落彈鏈為主要死因                                                                           |
| noctraFsm | `barrageCount`                  |                    10 |                         **7** | P3 密度                                                                                          |
| noctraFsm | P2 循環                         | bomb,dive,dive,summon |          **bomb,dive,summon** | 去連擊                                                                                           |
| noctraFsm | `enrageSpeedMultiplier`         |                  1.25 |                      **1.15** | P2/P3 節奏回讀帶                                                                                 |
| noctraFsm | `maxHp`                         |                    70 |                        **52** | TTK 對齊補給經濟（普通保底線 ~40-60s 擊破）                                                      |
| noctraFsm | `minionSpawnHpStep`             |                    10 |                         **8** | 輸出愈多彈藥愈順（正回饋）                                                                       |
| levels L7 | `spawnIntervalMs`/`maxOnScreen` |                3200/2 |                    **4500/1** | 供給定位是彈藥非第二傷害源                                                                       |
| levels L7 | 補給構成                        |    jelly/floaty/gusty |        **jelly/floaty/zappy** | 移除俯衝型騷擾；保雷化斷召素材                                                                   |
| waves.ts  | 補給入場側                      |              左右交替 |                  **玩家遠側** | 走向玩家的路程＝拾取節奏                                                                         |
| homing.ts | `BOSS_AIM_ASSIST`               |                    無 | **range 560 / 0.0012 rad/ms** | 一般星彈對魔王微導向：地面平射自然上彎入盤旋帶（追蹤彈 1/5 轉率、須大致對向；追電/迴旋星不疊加） |
| mercyHeal | 魔王房 override                 |                    無 |    **HP≤2、12s、18s CD、60%** | boss 戰長度下保底真正可觸發                                                                      |

### 63.2 驗收證據（噗頭對噗頭 bot 實測，序列執行；`scripts/noctra-bot-audit.mjs`）

| 水準 | 反應/走位       |      v8 出貨勝率 |  v9 根修勝率 | 均傷害進度 | 有效 hit window |
| ---- | --------------- | ---------------: | -----------: | ---------: | --------------: |
| 普通 | 250-400ms／0.65 |   0%（進度 ~0%） | **2/5＝40%** |        84% |           ~100% |
| 熟練 | 150ms／0.9      | 0%（進度 ~1.4%） | **4/5＝80%** |        93% |           ~100% |

- bot 紀律＝普通玩家可再現行為：牆側錨點站位、telegraph 讀招（盤旋凍結＝俯衝前搖）、
  落彈側移／低彈道跳越、原地吸入補給、慈悲愛心掃拾；純標準星保底 build（不用變身/混合）。
- hit window 口徑：體底進入單跳星彈可打帶（≥270）之時間比；另含俯衝滯留地面窗。
- L7/L4 跳幅：L4 果凍王大參數不動（實測可磨可通關）；L7 全參數回落後 P 軸（命中幾何）
  自崩壞回歸常態，級距回落合理帶（≤~1.4×）。
- 標準星保底線與 anti-softlock 不變式全數維持；變身/混合/EX 仍為加速與挑戰線非必需。

## 64. v9.1 熱修：Noctra 返空連續飛行與星暴無敵窗（P0）

### 64.1 Noctra 返空瞬移根修（logic/noctraFlight.ts，取代 §54 盤旋駕駛敘述）

**根因**：盤旋駕駛以「凍結相位的絕對座標」逐幀直寫 sprite——俯衝/俯掠/長暈 tween 接管
期間相位凍結，接管結束當幀位置直接跳回相位點；俯衝落點追玩家（clamp 60..W-60），與
凍結相位點距離可達數百 px，玩家所見即「返空瞬移」。一般與 EX 共用呈現層，兩型皆中。

**修法**（純邏輯層 `logic/noctraFlight.ts`，vitest 對象）：

- `hoverPatternPoint(hoverMs, viewWidth)`：相位 → 目標座標（航線 SSOT 自 noctra.ts 收斂）。
- `approachPoint(current, target, maxSpeed, dt)`：速度上限逼近——單 tick 位移 ≤
  `maxSpeed×dt`、步長內貼合目標不過衝；`maxSpeedPxPerSec=340`（×speedFactor）嚴格高於
  最寬幅盤旋峰值橫移（~287px/s），貼軌後恆跟上、接管交還必為連續飛行。
- 涵蓋：不同落地位置、返空中受擊/相位轉換（cap 隨 speedFactor 縮放）、pause（dt=0 不動）、
  超大 dt（位移仍受 `maxSpeed×dt` 夾制）；e2e 以 rAF 逐幀取樣魔王座標守門單幀位移。

### 64.2 星暴無敵窗（§23 星暴補訂）

- 星暴發動即開 **5s 無敵窗**（`STARSTORM.invulnMs=5000`，config SSOT）：與受擊 i-frame
  為獨立計時，結算時 `effectiveInvulnMs = max(受擊, 星暴)` 生效——**取較大值不疊加**、
  期間受擊零傷害且不重啟計時；到期即恢復正常受擊（受擊判定沿 `combat.resolveHit`
  單一出口）。
- 視覺沿用受擊 i-frame 閃爍（alpha 節流），不新增散落 tween；受傷姿勢（hero-hurt）仍
  僅綁受擊 i-frame，星暴無敵不觸發受傷表情。
- 定位：星暴由「清場大招」升級為「攻防轉換窗」——發動後 5s 內可貼身輸出/穿彈幕走位；
  anti-softlock 不變式不受影響（無敵為加成非必需）。

---

# v10 擴充：三區完結（PM 親撰；主計畫 SSOT＝starpuff-20-levels-master-plan v1.2）

## 65. v10 關卡 9→12 與世界地圖（levels.ts 資料驅動擴充）（v11 已由 §76 取代：十六關與十六節點）

| #   | 關卡     | bgKey       | 世界寬       | 配額 | 間隔   | 主場機制                                   | 精英          |
| --- | -------- | ----------- | ------------ | ---- | ------ | ------------------------------------------ | ------------- |
| 10  | 幽光晶湖 | bg-lumen    | 3400         | 12   | 1150ms | 星門折躍首發（§66）×鏡蟲潛行混編           | 鏡光燈長老 ×1 |
| 11  | 磁晶險徑 | bg-magnetic | 3700         | 13   | 1100ms | 磁力域×折躍複合（卡點一，checkpoint §67）  | 雙精英        |
| 12  | 稜晶王殿 | bg-prism    | 854＋前室400 | —    | 3000ms | 第三魔王稜晶雙子（§68）＋魔王關體系（§69） | —             |

- 世界地圖十二節點：佈局由關卡數推導（三階鋸齒、節點半徑 24、魔王節點恆最高階——EX
  徽鈕上方淨空恆成立）；雙位數關號縮字級 20px。分區分頁延期（最遲 v12，主計畫 §2.2）。
- save schema v1 不變：`LEVEL_IDS` 擴至 12；v9 舊檔（≤9 關）載入 L10 自然開放、L11/L12
  迷霧鎖定（save.test／e2e 守門）。
- 背景重用（§55 慣例，零新背景）：`bg-lumen`→`bg-arena`（幽青 grade＋冰青湖光塵）、
  `bg-magnetic`→`bg-eclipse`（磁紫 grade＋磁紫晶塵）、`bg-prism`→`bg-arena`（稜晶薰衣草
  grade＋虹彩稜塵）；道具條沿用 arena 主題。
- 攻略 PoC：
  - L10 最佳線：吞 mirri＋glowy 湊凝光系推進 → 星門捷徑跳過中段密集帶 → 精英拿 boomy
    味湊電鋸迴旋。保底線：全程地面吸射，星門可完全不用（折躍僅為捷徑與秘密，§26 保證律）。
  - L11 最佳線：吞 boomy＋zappy 電鋸迴旋清簇 → 折躍跳過首精英房帶 → 雙精英拿 glowy/boomy
    補配方。保底線：貼地逐隻吸射，雙精英 60s 逾時可全略過；死亡自中點 checkpoint 重生。
  - L12 最佳線：前室拿星力果＋滿匣 → P1 光束間隙輸出 → P2 集火單具入掙扎窗 → 窗內補殺
    雙子連破（跳過 P3）。保底線：標準星逐具磨死，夾擊跳越、晶雨看預警走位。

## 66. v10 星門折躍（logic/warp.ts，pure TS 可測）

- 新 stage element：`{ kind: 'warp', x, y, pairId }`——同 pairId 成對傳送（三區新機制 2/2）。
- 傳送規則：觸發半徑 40px、進門保留速度向量（body.reset 後回寫）、出門 500ms 全域冷卻
  防彈跳循環；相機硬切＋白閃 0.2s＋星塵演出。
- 跳入制（anti-softlock 幾何設計）：門心固定高於就地站立中心 80px——站立/走動不觸發、
  單跳即入、出門落地即脫離觸發半徑（冷卻期內必然脫離，杜絕回彈循環）。
- 資料不變式（levels.test 守門）：warp 必成對；僅 L10/L11 配置；門心高度帶（站立中心
  -56～-138px）；不落於精英房界（±300＋觸發半徑）內側（主計畫交叉不變式 15）；主線不依賴
  warp——地面路徑恆達星星門（§26 保證律不變）。
- 呈現（systems/stage.ts）：星環按 pairId 輪色（脈動外環＋淡填內圈＋自旋星芯＋上飄星塵，
  maxAlive 4/門）；傳送後重置彈簧掃掠與星星門掃掠基準（onWarp hook），防前後幀大位移
  誤觸背擋。

## 67. v10 卡點關中點重生（LevelSpec.checkpointX，§4 主計畫卡點緩解）

- L11 首發：`checkpointX: 1850`（世界中點、落於雙精英房界外）。
- 語義：本命最遠推進 x 越過 checkpoint 後死亡——就地自 checkpoint 重生（場景不重啟）；
  killCount／彩蛋進度／計時全數保留（bestTime 語義不變）；血量回滿基礎 5、慈悲補血每命
  狀態重置；死亡 i-frame（1.5s）覆蓋落地瞬間防秒殺。
- 未越過 checkpoint 或非卡點關：維持既有整關重試。`forceLose` e2e 鉤子與真實死亡同分岔。
- 純邏輯 `checkpointRespawnX(level, farthestX)` 供 vitest；資料不變式：僅 L11 配置、
  ≈worldWidth×0.5、遠離精英房界 300px（levels.test 守門）。
- 主計畫 §4 兩案（checkpoint vs 密度降載）v10 以 checkpoint 定版首發；bot 實測死亡率
  回填後若翻案再議（其後卡點關 L15/L19 統一採用）。

## 68. v10 第三魔王：稜晶雙子 Prismix（logic/prismixFsm.ts 表驅動，分裂型）

與地面型（Jellord §6）、空中型（Noctra §54）區隔的**分裂型**——核心威脅是「目標數量
變化」迫使玩家切換單體集火與多目標處理。HP 80（階梯 60→52→80）、體傷 1、狂暴 ×1.15、
每損 10 HP 掉補給（§26）。

- 三階段（phase truth 全收斂 FSM；呈現層 systems/prismix.ts 接 BossHandle）：
  - P1 單體（總血 >66%）：`idle(1.5s) → 晶柱衝擊（地面尖晶 ×3，落點預警 0.6s）→ idle →
折射光束（橫掃一次，預示線 0.5s）→ …`
  - P2 分裂（≤66%）：剩餘 HP 均分為**雙獨立血條**（HUD 魔王條雙節顯示，BOSS_TWIN_HP
    事件）；鏡像雙子同一指令左右對稱執行——`雙生夾擊（同步閃爍 0.55s → 左右對衝互換位，
跳越可躲）→ 交錯光束（一具地面帶、一具空中帶）→ 召喚 mirri（場上限 2，雷化鏈電可
中斷 §58 慣例）`。
  - 殘核掙扎（事件驅動）：單具擊破 → 另一具入 1.0s 掙扎僵直（體色轉暗 telegraph、可傷）；
    窗滿 → 存活具吸收殘核合體入 P3（裂核 HP＝存活具剩餘）。
  - P3 裂核：環繞碎晶盾 ×4（可擊破星彈屏障，軌道公轉）→ 全域折射彈幕（放射 ×8，蓄能
    轉白）→ 晶雨（落點預警 0.6s ×3）→ …
- **雙子連破**（§70 彩蛋）：掙扎窗內補殺第二具＝總血歸零直接擊破、跳過 P3。
- 多本體工程契約：BossHandle 增選配 `getBodies()`／`applyDamageAt(x,y)`／`getShields()`；
  GameScene 星彈/觸碰/下砸/反彈逐本體接線，受擊側依命中位置歸最近存活本體；準星輔助、
  殼化反彈、鏈電束一律取最近存活本體。
- 變身互動（優勢解非必需）：雷形態鏈電同時波及雙子與碎晶盾；殼形態格擋夾擊；風形態
  跨場重定位。下砸命中頭頂僅回彈免體傷（分裂型無暈窗）。
- EX 差分（`EX_MODS` ×1.5/×1.15 共用）：HP 120、分裂閾值 66%→75%、掙扎窗 1.0s→0.7s、
  碎晶盾 4→6、雙子動作去同步（相位錯 260ms，讀招難度升級）。

## 69. v10 魔王關特殊體系（前室／短期增益／L12 首發；L4/L7 回補延 v11+）

- **補給前室**（systems/bossRoom.ts prefab；`LevelSpec.anteroomPx` 資料驅動）：
  - arena 前 400px 廊道：runtime 世界寬＝前室＋動態視寬（854–1200）；玩家自廊道起點入場。
  - 固定配置：慈悲愛心 ×1（tier-2 回 2 HP，禁止門口全滿血 P-65）＋可吸補給怪 ×3（進場
    即可滿匣）＋增益二選一台座（`anteroomBuffs`，取一消一）。
  - 單向門：越過前室右緣即鎖閉（果凍門柱），重試自前室起；相機三段——廊道剛性跟隨 →
    入門停跟隨對齊 arena → 魔王入場運鏡。
  - 補給/慈悲錨點 arena 化：魔王補給與召喚自 arena 左右緣入場；慈悲愛心錨點下界改
    arena 左緣（防落於門後不可達）。
- **短期增益表**（logic/buffs.ts `BUFF_SPECS`，純邏輯可測）：

| id     | 名稱   | 效果                                    | 時效       | HUD               |
| ------ | ------ | --------------------------------------- | ---------- | ----------------- |
| shield | 護盾泡 | 吸收 1 次任意傷害（彈幕/接觸/hazard）   | 15s 或破盾 | 單一 icon＋倒數環 |
| power  | 星力果 | 星彈傷害 ×1.5（含混合星與變身射擊）     | 10s        | 同上（後拾覆蓋）  |
| swift  | 疾風靴 | 移速 ×1.3、加減速 ×1.4（movement 注入） | 12s        | 同上              |

- 規則（全部 MUST）：同時僅存一個、後拾覆蓋；增益永不為破關必需（有界加成非無敵）；
  走動關不投放；arena 內僅 P2 高風險位刷 1 顆（`arenaBuff`，10s 未拾淡逝）、EX 刷新減半
  ＝不投放；護盾格擋走 `damagePlayer` 單一受擊入口。
- movement 契約更新：`approachVelocity` 增選配 `rateMul`（缺省 1 零回歸）；速帽尊重提速
  後目標值（同時修正 §57 雷化 +15% 被常速帽逐幀鉗回的既有缺陷）。
- L12 配置：前室二選一＝護盾泡/星力果；P2 稜晶柱頂刷疾風靴 ×1（高風險位 P-41）。

## 70. v10 魔王關專屬彩蛋與每關驗證

- 新觸發器 `twin-finish`（eggs.ts 第五型）：時窗真值由 prismixFsm 持有（單一真值），
  GameScene 收到 twinFinish 事件餵入觸發器——鎖存、gold-star 獎勵＋全屏稜光演出；
  `vent-hit-count` 已於 v11 落地（§75）、`survive-collect` 隨 v12（主計畫 §7.3）。
- 慈悲補血：L12 沿用 §62 魔王房 override（HP≤2、12s 起評、18s 冷卻、60%、上限 2）——
  `bossRoom` 判定隨 `level.boss` 泛化，零新碼。
- anti-softlock 不變式（測試守門）：warp 四不變式（§66）；checkpoint 落點房界外（§67）；
  L12 補生全可吸且恆可吸佔比 ≥0.6；碎晶盾可全數擊破（星彈屏障非無敵殼）；前室單向門
  重試自前室起、arena 無門鎖擊破制（§10.2-10）；增益永不必需（§69）。
- e2e 通關 bot（v10.spec.ts）：L10 不用星門全地面通關案（floorbot-no-warp-clear）、星門
  折躍傳送案、L11 checkpoint 重生案、L12 前室→門鎖→三階段→雙子連破案、舊存檔十二節點
  相容案、雙節血條案（HUD 直接觀測 `__sp.twinHud` 於 v11 補齊，見 v11.spec）。

## 71. v11 糖漿潮汐（logic/tide.ts，pure TS 可測）

- 四區主機制 2/2（主計畫 §5 L14）：關卡級配置 `LevelSpec.tide?: { maxY, periodMs, dutyPct }`
  ——非 stage element；底部糖漿帶週期漲落，漲潮時強制走平台層。
- 水位時間軸（tideWaterY）：乾潮（收納世界底 y=600 等效無水）→ 漲坡 0.9s（地面頂→漲頂
  線性）→ 滿潮持平 → 退坡 0.9s 回地面頂；漲潮前 1s 河面冒泡 telegraph（tidePhase）。
- 浸水結算（GameScene.advanceTide 單點）：接觸傷害 1 走 damagePlayer 單一入口（i-frame/
  護盾泡自然生效）＋強緩速（水平封頂 60px/s）＋垂直鎖上推 -240（**永不吸底**，
  anti-softlock §10.2-4）。
- dry-window 不變式（levels.test 守門）：主地面每週期露出 ≥40%（dutyPct ≤0.6）、平台層
  頂恆高於漲頂 24px、僅 L14/L15 配置；等窗推進為合法保底行為（主計畫 §0.1 定義 6）。
- 交叉不變式（主計畫 §10.2-13/-17，systems/tide 接線）：漲潮期 Magno 生成替換為 jelly
  （磁場不覆蓋漲潮期可站位）＋補生落點上收至水面上方淨空帶（tideSpawnY，48px 淨空）——
  均走 waves.adjustSpawn hook，缺省直通零回歸。
- L16 場控沿用（§74）：Syrona P2 潮汐入場、P3 大沸騰——同一 createTide 管線由魔王 hooks
  控制（startTide/boilTide），浸水與生成過濾自然生效。

## 72. v11 熱泉噴口（updraft 週期參數化，零新 element kind）

- 四區主機制 1/2（主計畫 §5 L13）：既有 `updraft` 增 `periodMs?/dutyPct?` 選配——缺省＝
  恆常供力（**L5 氣流柱行為零回歸**，levels.test 斷言 L5 恆缺省）；有值＝週期噴發。
- 相位（ventPhase）：週期頭 idle（不供力、柱體幾近隱形）→ 末段 0.5s telegraph（蒸汽
  微亮預警）→ 尾段 duty 比例噴發（erupt 供力，沿 §51 升力管線：加速 1600、升速夾限、
  blocked.up 斷供全數重用）。L13/L15 取 periodMs 2600/3200、dutyPct 0.31（≈0.8-1.0s）。
- 資料不變式（levels.test 守門）：週期噴口僅 L13/L15；periodMs ≥1500、dutyPct ∈(0, 0.6]；
  柱頂上方 160px 拋出弧淨空（防無限拋接）＋柱頂 ≥100 沿 §51。
- 呈現（systems/stage.ts）：柱體/粒子隨相位開闔（idle α0.03 → telegraph α0.10 →
  erupt α0.20＋滿量粒子）；`__spStage.vents()` 觀測點回報各柱 [x, 噴發中]。
- 保底線（floorbot-vent-ground-pass，v11.spec）：視噴口為普通地磚全程地面推進，
  升托僅為捷徑非必需。

## 73. v11 新怪物 ×2（FSM-first 進 enemyFsm；零新星味裁決延續 §8 主計畫）

| 怪物             | FSM 四態                                                                                                                                                           | 可吸性             | 星味映射                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ----------------------------- |
| 焦糖泡 Bubbla    | submerged 潛伏 2.2s（壓扁露頂，免傷不可吸）→ ripple 漣漪前搖 0.6s（telegraph）→ leap 拋物躍出 1.4s（升 0.5＋頂點滯空 0.4＋落 0.5，**可吸可傷窗**）→ dive 回潛 0.5s | 條件可吸（躍出窗） | 爆裂味（puffy）               |
| 熔糖投手 Splatta | patrol 緩走 2.4s → aim 舉勺瞄準 0.5s（著色 telegraph）→ lob 投擲（單幀事件態，拋物糖球 ×1）→ cool 冷卻 1.6s                                                        | 恆可吸             | 孢子味（spora，黏緩語意一致） |

- Bubbla 幾何：定點怪（重力關閉）；躍出位移由 `bubblaLeapOffsetY` 純函式導出、逐幀
  速度逼近驅動（沿 §64 噴口逼近制慣例，禁絕對座標直寫）；受擊窗 resolveBubblaHit 沿
  drilly immune/vulnerable 慣例；isPhasedOut 半潛觸碰不結算、吸力不彈開。
- Splatta 糖球：拋物彈道（重力開）、壽命 2.4s 逾時必回收（§56）；落地轉灼燙糖斑
  （滯留 1.2s 區域拒止，走既有 hazards 管線，沿孢子雲模式）。
- 精英化：焦糖泡霸（L13，躍出節奏 ×1.5、掉雷鏈味）、糖漿投擲隊長（L14，拋射 ×1.5、
  掉重鑽味）——沿 §48 tint+scale+倍率零新美術。
- 圖鑑（§36）收錄：十八格（十六小怪＋雙魔王），欄數由條目數推導（9×2 於 854 寬
  cellW≈89 仍可讀；分頁與地圖分區分頁同批延後評估）。

## 74. v11 第四魔王：Syrona 熔糖窯后（logic/syronaFsm.ts 表驅動，場控型）

與地面型（§6）、空中型（§54）、分裂型（§68）區隔的**場控型**——本體半定點於右側
王窯座（不追打），威脅來自「地形被改寫」：潮汐、噴泉、滴落把可站空間動態壓縮，
考驗空間規劃。HP **90**（階梯 60→52→80→90）、體傷 1、狂暴 ×1.15、每損 10 HP 掉補給。

- 三階段（phase truth 全收斂 FSM；呈現層 systems/syrona.ts 接 BossHandle）：
  - P1（>66%）：`糖漿噴泉（地面點 ×3 順序噴發，冒泡 telegraph 0.8s）→ 散熱僵直 2.5s →
焦糖射彈（拋物 ×3，舉臂 0.5s）→ 僵直 → …`
  - P2（66-33%）：**潮汐入場**（phase 事件觸發 startTide，沿 §71 管線）；循環
    `熔糖滴落（天花板 ×4 預警光斑 0.7s → 直墜）→ 吟唱僵直 2.0s → 召喚 Bubbla（上限 2，
雷化鏈電可中斷 §58 慣例）→ 噴泉加密 ×4 → …`
  - P3（≤33%）：**大沸騰**（boilTide：潮汐週期 -30%、漲頂 +24px）；循環
    `全場糖漿波（邊緣起浪 0.9s → 單向橫越 250px/s，跳越可躲）→ 波後僵直 2.0s →
噴口超載 2.6s（arena 雙噴口恆噴＋升托增強至 -640，開放直達皇冠的垂直路線）→ …`
- arena 場控幾何（§28 禁硬編，呈現層依動態視寬比例佈建；LevelSpec 幾何表留空）：
  浮台 ×3（22%/47%/70%，y 336/304/336——低台 P2 漲頂下可站、高台 304 沸騰期保底位，
  FSM 測試守門「每循環必留 ≥1 保底位」）＋噴口 ×2（30%/58%，週期同 L13）——供力由
  GameScene 逐幀委派 `getVentLift`（BossHandle 選配），浮台由 `getPlatforms` 接 collider。
- 皇冠弱點：頂帶（本體頂緣 34px 內）命中 ×2 傷（applyDamageAt 位置判定）；乘噴口
  升空為主要到頂路徑。保底線：讀潮汐節拍站浮台點射，僵直窗（散熱/吟唱/波後 ≥2s）
  為固定輸出窗，時窗佔比 0.50 保證磨死（主計畫 §3.2 保底 TTK ≈58s）。
- 變身互動（優勢解非必需）：風形態滯空渡潮直取輸出窗；殼形態硬吃一次糖漿波保節奏；
  雷形態清召喚 Bubbla。場控型免暈：下砸命中僅回彈免體傷（trySlamStun false）。
- EX 差分（EX_MODS ×1.5/×1.15 共用 → HP 135）：噴泉 ×5、Bubbla 上限 3、滴落點 6、
  大沸騰週期再 -25%；質性差分＝**噴泉順序隨機化**（每循環 Fisher-Yates 洗牌出序，
  rng 注入可測；一般模式恆固定升序可背板）。

## 75. v11 魔王關專屬彩蛋與每關驗證

- 新觸發器 `vent-hit-count`（eggs.ts 第六型）：**窯風三連**——乘噴口升空期間命中
  Syrona 累計 3 次 → heal＋窯火謝幕演出。命中計數真值由 syrona 呈現層持有（沿
  twin-finish 單一真值模式）：命中當下玩家位於任一噴口柱域內即計數，滿 3 發
  onVentEgg 餵入 GameScene 觸發器鎖存。
- L16 魔王關體系（§69 直接複用）：前室 400px＋護盾泡/疾風靴二選一＋P2 噴口上方刷
  星力果（`anteroomBuffs: ['shield','swift']`、`arenaBuff: 'power'`）；補生 jelly 0.3／
  bubbla 0.4／floaty 0.3（恆可吸 0.6 保飢荒保證律）。
- anti-softlock 不變式（測試守門）：潮汐 dry-window 與永不吸底（§71）；週期噴口
  非噴發期不供力、L5 缺省零回歸（§72）；Bubbla 躍出窗恆現（週期驅動非條件觸發）、
  糖球/糖斑壽命有界（§73）；Syrona 每循環必留 ≥1 保底位、僵直窗 ≥2s（§74）；
  L15 等窗推進合法（floorbot-tide-wait-window）。
- e2e 通關 bot（v11.spec.ts 六案）：舊存檔十六節點相容、L13 噴口週期翻轉＋地面保底
  通關、L14 潮汐浸水永不吸底＋等窗通關、L15 checkpoint 重生、L16 Syrona 三階段
  （前室→P2 潮汐入場→P3 大沸騰→擊破寫檔）、L12 雙節 HUD 直接觀測（§70 收尾）。

## 76. v11 關卡 12→16 與世界地圖（levels.ts 資料驅動擴充）

| #   | 關卡     | bgKey       | 世界寬       | 配額 | 間隔   | 主場機制                                          | 精英            |
| --- | -------- | ----------- | ------------ | ---- | ------ | ------------------------------------------------- | --------------- |
| 13  | 焙糖丘陵 | bg-kiln     | 3300         | 11   | 1400ms | 熱泉噴口首發（§72）×Bubbla/Splatta 亮相           | 焦糖泡霸 ×1     |
| 14  | 熔糖河谷 | bg-valley   | 3600         | 12   | 1250ms | 糖漿潮汐首發（§71）                               | 糖漿投擲隊長 ×1 |
| 15  | 沸糖窯道 | bg-kilnway  | 3800         | 14   | 1100ms | 潮汐×噴口複合 gauntlet（卡點二，checkpoint 1900） | 雙精英          |
| 16  | 熔糖王窯 | bg-kilnhall | 854＋前室400 | —    | 3000ms | 第四魔王 Syrona（§74）＋魔王關體系（§69）         | —               |

- 世界地圖十六節點：節點半徑再收斂 24→20（854 寬間距 ≈51px 單頁可容納）；三階鋸齒
  12 項循環下四魔王節點（L4/L7/L12/L16）恰全落最高階，EX 徽鈕淨空恆成立；
  雙位數關號字級 17px。**分區分頁為 v12 硬項**（主計畫 §2.2，20 節點單頁確定放不下）。
- save schema v1 不變：`LEVEL_IDS` 擴至 16；v10 舊檔（≤12 關）載入 L13 自然開放、
  L14-L16 迷霧鎖定（save.test／e2e 守門）。
- 美術（§9 主計畫 v11 批 5 張）：`bg-kiln-l`（1536×512 無縫，四關共用 grade 區分）、
  `props-kiln` 道具條 4 件、`minion-bubbla`／`minion-splatta`／`boss-syrona`；
  缺件期間烘焙保底不阻開發。
- 攻略 PoC：
  - L13 最佳線：乘噴口越丘陵直取精英拿 zappy 味。保底線：地面吸射推進，噴口僅捷徑。
  - L14 最佳線：讀潮汐節拍退潮衝刺漲潮上台、風形態飛渡長浪段。保底線：主地面退潮窗
    恆可通行，逐段等潮推進，全程可不碰平台層。
  - L15 最佳線：雷爆星清簇→乘噴口鏈跨大漲潮段→雙精英補味。保底線：**等窗推進**——
    漲潮期安全帶原地等退潮、退潮窗地面逐段推進；雙精英 60s 略過；死亡自 1900 重生。
  - L16 最佳線：風形態滯空躲潮→噴口升空打皇冠 ×2。保底線：讀潮汐站浮台點射，
    僵直窗磨死。

---

# v11.1 熱修：站台下跳穿落回歸與吸入接觸豁免（P0）

## 77. v11.1 熱修：下跳穿落根修、蹲姿指示與吸入豁免

### 77.1 站台「下＋跳」穿落回歸根修（補訂 §29/§44）

**根因鏈**（worldstep 逐步 trace 實證）：

1. 落地擠壓 `squashStretch(1.25, 0.75)` 於每次「重新接觸」觸發——擠壓縮小 body
   （scale 連動 `Body.updateBounds`）使腳底離台 → 微墜再落地 → 再擠壓，形成 ~20Hz
   自持迴圈；站立時接觸旗標（blocked/touching.down）僅 ~1/3 物理步為真。
2. 「下＋跳」落在假空中幀（~2/3 機率）時被 v7 下砸（`resolveJumpPress`）誤判接管；
   下砸啟動擠壓（scaleY×1.3）使身體單步位移 ~22px，超過 Phaser `OVERLAP_BIAS(4)+ΔY`
   防隧穿上限而貫穿單向平台——玩家所見即「有時暴力穿落、有時原地跳」的不確定行為。
3. `standingOnOneWay` 舊 ±4px 容差小於迴圈震盪幅度（4.7px），接觸幀也會間歇漏判。
4. 地形粉紅平台（`GameScene.addTerrain`）從未接入下穿系統，僅能靠隧穿 bug 下降。

**修法**（四點聯動，均有單測）：

- 落地擠壓加最低著地速度閘 `LANDING_SQUASH_MIN_VY=120`：微速重新接觸不再擠壓，
  迴圈斷根（實測站立接觸穩定度 120/120 步）。
- `resolveJumpPress` 增 `recentlyGroundedMs`（傳 coyote 殘量）：coyote 窗內視同在地，
  下砸僅「真空中」（離地 >150ms）觸發——§44 矩陣「空中」行語意收斂為真空中。
- 站台判定抽 `stageModel.restingOnOneWay` 純函式：接觸旗標**或**沉降幾何
  （腳底於台頂 −6..+8px 帶內且 0 ≤ vy ≤ 90）擇一成立，對旗標抖動免疫。
- 著地帶 `oneWayLandBand(stepΔY)=max(6, ΔY+2)` 動態放寬：下砸（~11.7px/步）與高處
  落下不再隧穿單向平台；低速維持 +6 緊帶防側切。

**地形平台統一**：粉紅平台掛 `canLandOneWay` process callback＋`terrainOneWay` hook
納入同一下穿裁決——玩家視角所有「單向平台」下＋跳皆可穿落（S1 教學一致性）。

### 77.2 蹲姿視覺與跳鍵下跳指示（§21 控制補訂）

- 蹲姿：地面壓下 120ms 內壓扁（scaleX +14%／scaleY −22%）＋下沉 3px；
  `walkFeel.advanceCrouch` 純函式驅動，走 bob 同款 POST_UPDATE 視覺通道、
  PRE_UPDATE 還原——**物理永不見蹲縮**（防 77.1 擠壓迴圈同型問題）。
- 下跳指示：壓下且站單向平台（跳鍵此刻＝下跳）→ 跳鍵轉琥珀＋鍵帽箭頭翻轉朝下
  （`is-drop-ready` class，純 CSS clip-path 旋轉，零文字零 emoji）；鬆開或離開
  可穿落狀態即還原。決策重用 `shouldDropThrough`（單一裁決來源），controls 層
  邊緣偵測 class 切換不逐幀碰 DOM。

### 77.3 吸入接觸豁免（§5 吸入補訂）

- 規格：**被吸入中**（拉力作用中）的怪對玩家無接觸傷害；吞下判定照舊；未被吸入
  的其他怪照常傷害——不做吸入全程無敵，風險回報保留。
- 實作：`combat.inhaleGraceUntil / isContactHarmless` 純函式——`applyInhalePull`
  拉力逐幀刷新 250ms 豁免窗，接觸結算單點查窗；吸入中斷（鬆開/轉向/離錐）後
  窗過期即恢復傷害性；enemies spawn 池重用重設防跨個體殘留。
- 根因：拉近中的怪貼身瞬間（轉向/鬆開/出錐殘餘飛行）觸發受擊，實測 12-25% 命中；
  拉力結算與接觸結算間缺「被吸入中」狀態橋接。

### 77.4 吸入大嘴影格（素材；§61 慣例沿用）

- `hero-inhale-big-1/2`（codex imagegen，512×512 webp 透明背景）：吸入姿勢嘴部
  誇張放大兩段影格，啟動吸入後兩影格 ~160ms 交替營造吸力節奏；素材未載入時
  回退既有 `hero-inhale`（tex fallback 慣例）。

## 78. v12 分區分頁世界地圖（logic/zones.ts＋MapScene，主計畫 §2.2 硬項落地）

- 二十節點單頁確定放不下（v11 十六節點半徑 20 已是單頁極限）：改「分區分頁」——
  每區一頁 ≤5 節點（半徑回復 24 可讀性回升）、頁籤列直達任一已解鎖區（等效快速
  旅行，零新系統）。
- 五區資料 SSOT：`ZONES`（果凍平原 L1-L4／天風峽域 L5-L7／幻晶深域 L8-L12／
  焙糖火山 L13-L16／星核聖域 L17-L20）；頁內節點由 `LEVELS` 區間過濾推導——
  列車過渡期末區未滿編自然收斂，關卡擴充分頁零改動。
- 區解鎖＝區首關解鎖（前區魔王擊破，引用 P-03 分頁即區域錨點）；未解鎖區頁籤
  灰顯無入口。頁標頭顯示該區彩蛋 found/total（P-11 分項透明化）。
- 預設頁＝當前可挑戰關所屬區；揭霧跨區自動開對應頁（reveal 帶入）；頁籤切換以
  `scene.restart({ page })` 實作（DOM 鈕由 shutdown 自清，零洩漏）；視寬變更重排
  保留當前分頁。魔王節點固定最高階 y=224（EX 徽鈕淨空恆成立），走動關 300/262 交錯。
- 存檔相容：schema v1 不變、`LEVEL_IDS` 擴至 20——v11 舊存檔（≤16 關條目）原樣
  載入，L17 依解鎖鏈自然開放、L18-L20 迷霧鎖定（save.test／e2e 守門）。

## 79. v12 流星雨（logic/meteor.ts＋systems/meteor.ts，pure TS 可測）

- 關卡級環境彈幕（`LevelSpec.meteor?: { intervalMs, waveSize }`）：波次節拍 →
  落點抽選 → 預警圈 0.8s（滿張即著地）→ 隕星恆速直墜 → 著地餘燼 0.4s 淡出。
- anti-softlock 不變式（主計畫 §10.2-7）：預警 ≥0.7s、同屏隕星 ≤3（效能預算）、
  開門後門前 ±120px 禁投、玩家縱帶 ±48px 恆排除（滯空無水平逃逸速度與腳下連投
  取聯集，交叉不變式 14 一併覆蓋）。
- 交叉不變式 14（低重力×流星）：隕星不掛重力、恆速 520px/s 直墜——低重力關落地
  時刻不延後，生成高度由墜速×預警時長自著地點反推。
- 落點抽選純函式 `pickMeteorX`：可投範圍挖除排除帶後 rand01 沿剩餘總長線性映射；
  無合法段回 null 棄投（永不強投排除帶）。
- 隕星可被星彈擊碎（碎裂粒子、星彈吸收）；隕星/餘燼命中玩家走 damagePlayer 單一
  入口（i-frame/護盾泡自然生效）、隕星命中即碎。程序化貼圖零新美術。
- Voidra P2 轟炸沿單一 meteor 管線：`setActive/setSpec` 開關與調參（§82）。

## 80. v12 新怪物 ×2（FSM-first 進 enemyFsm；零新星味裁決延續 §8 主計畫）

| 怪物             | FSM 時序                                                                                                                                       | 可吸性             | 星味映射 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------- |
| 星屑幽靈 Twinkla | phased 虛化 2.0s（半透明、不可吸不可傷、穿身無害）→ shimmer 星光聚攏 0.5s（telegraph）→ solid 實體 1.8s（緩慢追飄，可吸可傷窗）→ 回虛化        | 條件可吸（實體窗） | 流光味   |
| 彗尾飛魚 Cometa  | glide 高處巡游 →（玩家進 230px 觸發域）→ lock 鎖定 0.55s（閃爍，鎖定後不修正）→ dash 斜向俯衝 0.6s（420px/s 沿路拖彗尾 hazards）→ recover 回升 | 恆可吸             | 疾風味   |

- Twinkla 穿身無害＝isPhasedOut（觸碰不結算、吸力不彈開）＋damage 免傷雙閘；
  精英「星屑幽長」（×1.4）僅縮虛化期，telegraph 與實體窗不縮（§48 審查慣例）。
- Cometa 彗尾段走 hazards 管線（tailIntervalMs 90／tailLifeMs 500 逾時必回收
  §56）；精英「彗核疾魚」俯衝 ×1.4；鎖定後不修正＝可預判閃避。
- 圖鑑補完：雙新怪入鑑（18 小怪）＋三新魔王徽記（Prismix/Syrona/Voidra，5 魔王）
  ——23 格佈局沿 cols 條目數推導。

## 81. v12 低重力（LevelSpec.gravityScale，零新 element kind）

- 關卡級重力係數（缺省 1.0＝既有全關卡零回歸）：GameScene create 以
  `GRAVITY_Y × gravityScale` 顯式重設世界重力（單點注入，movement/player 純函式
  簽名不變；每次 create 必重設防前關/Voidra P3 注入殘留）。
- L17/L18 取 0.55（浮月感）、L19 取 0.85（輕低重力）；跳躍初速/拍翅次數/升力不變。
- 值域 [0.5, 1.0] levels.test 守門（主計畫 §10.2-6）；gravityScale ≤0.7 視為
  208 高台的升降服務（低重力大跳＋拍翅可達，levels.test 高台服務判定第三路）。
- Voidra P3 runtime 注入 0.55（§82）：hook 直寫世界重力、擊破/銷毀/段重試復原。

## 82. v12 最終魔王：蝕星魔核 Voidra（logic/voidraFsm.ts 表驅動，場控收束型）

- HP 110（魔王階梯峰值 > Syrona 90）；三段結構（主計畫 §6.3 v12 定案：P2＝定點
  轟炸生存段，追逐捲軸案落 backlog）：
  - **P1 王座戰（>70%）**：pull 重力牽引（漣漪 telegraph＋水平 positional drift
    110px/s 恆低於玩家全速）→ ring 星屑彈環 ×6 → claw 虛空爪擊（落點紫紋 0.6s、
    鎖定不修正）；收爪僵直 2.5s 固定輸出窗。
  - **P2 生存段（70-40% 或 40s）**：核心升頂不可及（受擊體停用＋FSM 免傷雙閘）、
    40s 波次表定點轟炸——隕星波（沿 §79 meteor 管線連續投放）＋晶柱崩落 ×7 波
    （落點預警 0.7s）＋炮擊過熱窗 ×3（核心下沉 3.0s＝唯一輸出窗）；沿途空投星屑
    ×5（§83 彩蛋收集）；段內固定慈悲愛心 1 顆（16s 投放）。時間驅動（40s 播完）
    與傷害驅動（過熱窗打穿 40%）雙轉換路徑入 P3。
  - **P3 核心決戰（≤40%）**：全場低重力 0.55 注入 → barrage 蝕星彈幕（放射 ×8＋
    螺旋雙層）→ crush 黑洞潮汐（水平牽引 150px/s < 玩家全速 220，交叉不變式 16；
    arena 無坑洞＋實牆邊界）；裂核大窗 3.5s（金紋呼吸提示）。
- anti-softlock（主計畫 §10.2-8）：P2 零擊殺可過（純走位 40s）、無位置懲罰即死、
  不設計時失敗；**段起點重試**——P2/P3 死亡不回滾整場（trySegmentRespawn：彈幕/
  星屑/轟炸/殘留 delayedCall 清場＋FSM resetToPhase＋玩家沿 checkpoint 管線重生於
  arena 左帶）；P1 死亡走一般敗北流程。defeated 單向鎖存冪等。
- 段重試清場（審查根修）：段起點重試保留同一場景——補給小怪與飛行中隕星/餘燼
  必須隨重生全數清除（GameScene.clearFieldForSegmentRetry，比照整場重啟語義），
  且 spawnBossMinion 夾限場上 maxOnScreen+2（爆發傷害連觸掉落不得堆出接觸傷害牆；
  彈藥保證由 §26 飢荒立即補生承擔）。
- 勝利結算窗防護（QA 根修）：BOSS_DEFEATED 即授 i-frame（WIN_DELAY+2s）＋
  PLAYER_DIED 於 bossDown 後直接忽略——殘餘 hazard（墜落中隕星/餘燼/潮汐）不得
  奪走勝利（真實 e2e 抓出的競態）。
- 呈現層（systems/voidra.ts）：核心位置一律 approachPoint 逼近錨點（§64 慣例禁
  絕對座標直寫；P1 中高懸浮/P2 升頂/過熱窗與 P3 下沉可打帶）；魔王關體系沿用
  （前室 400px＋星力果/疾風靴二選一；arena 增益 `arenaBuffPhase: 'p3'`——P2 為
  生存段不投放，護盾泡延至 P3 高風險位）。
- EX 差分：HP 沿 EX_MODS 共用 ×1.5＝165（兩魔王既成慣例）、P2 轟炸密度 ×1.25、
  P3 螺旋三層；EX arena 增益不投放（§69 慣例）。
- 補給：每損 10 HP 掉補給小怪（§26 飢荒保證律）；L20 補生 jelly/floaty/glowy
  全可吸；P2 免傷帶內 waves 補給照常（彈藥為 P3 儲備）。

## 83. v12 魔王關專屬彩蛋與每關驗證

- **星核共鳴**（第七型觸發器 `survive-collect`）：P2 生存段星屑 5 枚全收 →
  full-magazine＋星光謝幕演出（全屏金閃＋星爆）。計數單一真值由 voidraFsm
  `collectShard` 持有（沿 twin-finish/vent-hit-count 模式），滿 5 僅回報一次；
  段重試歸零重收。星屑收集判定沿 pickups 幾何慣例（AABB＋水平掃掠，緩降至地面
  帶後定點浮動可補收）。
- 每關驗證（e2e v12.spec）：v11 舊存檔載入五區分頁（L17 開放/L18·L20 迷霧）、
  L17 低重力全程地面通關（floorbot-lowgrav-landing 契約）、L18 預警圈→隕星→餘燼
  可觀測＋全程地面通關、L19 四機制終試全程地面通關（不用星門/噴口）、L20 三段
  全流程（P2 免傷帶／過熱窗輸出／段起點重試／擊破→謝幕→Result→寫檔）。

## 84. v12 關卡 16→20 與全線收尾（levels.ts 資料驅動擴充）

| #   | 關卡     | bgKey          | 世界寬       | 配額 | 間隔   | 主場機制                                                                                   | 精英             |
| --- | -------- | -------------- | ------------ | ---- | ------ | ------------------------------------------------------------------------------------------ | ---------------- |
| 17  | 星屑浮橋 | bg-astral      | 3400         | 11   | 1350ms | 低重力 0.55 首發（§81）×Twinkla 亮相                                                       | 星屑幽長 ×1      |
| 18  | 流星原野 | bg-meteorfield | 3700         | 13   | 1200ms | 流星雨首發（§79，4.5s×2）×低重力 0.55                                                      | 彗核疾魚 ×1      |
| 19  | 星核前庭 | bg-starcourt   | 4000         | 15   | 1000ms | 全機制終試（折躍＋週期噴口＋低重力 0.85＋流星 5.2s×2）；唯一六同屏；卡點三 checkpoint 2000 | 雙生鏡衛 ×2 同房 |
| 20  | 蝕星之心 | bg-voidcore    | 854＋前室400 | —    | 2800ms | 最終魔王 Voidra（§82）＋魔王關體系（§69）                                                  | —                |

- 曲線收束（主計畫 §4 CV-4）：L17 緩衝 → L18 → L19 卡點三 → L20 全遊戲峰值；
  魔王 DPS 檢查點 Voidra 110 > Syrona 90。
- L19 同房雙精英「雙生鏡衛」＝20 關唯一變式：mirri ×2 同房近距（60px）雙門疊放
  ——兩具皆破才開門、60s 逾時保險各自有效（§48 全規則沿用）；掉 glowy＋zappy
  補凝光/追電配方。levels.test 豁免帶限定 L19。
- 美術（主計畫 §9 v12 批 4 張，codex imagegen）：`minion-twinkla`／`minion-cometa`
  ／`boss-voidra`（裁切球體佔比＋q78 控預算）／`bg-astral-l`（1536×512 無縫，
  四關共用 grade 遞紫遞深：astral 淡紫 → meteorfield → starcourt → voidcore 深紫）。
- **星光復甦謝幕**（CreditsScene）：最終魔王關勝利（關卡鏈末端＋魔王關資料驅動
  判定，禁硬編關號）先播謝幕再進結算——星核金光脈動＋星光上升粒子＋製作名單
  六段浮現（IP 安全全原創文案）；任意點擊/ENTER 跳過、收尾冪等；播畢接 Result
  延續戰績資料。
- 攻略 PoC：
  - L17 最佳線：低重力大跳直上最高星橋速通＋彩蛋。保底線：地面層恆連通，twinkla
    只在實體窗吸射。
  - L18 最佳線：星彈擊碎隕星保持節奏、追電星自動鎖 cometa。保底線：預警圈 0.8s
    純走位可躲（玩家縱帶恆排除），逐隻吸射推進。
  - L19 最佳線：凝光凍場過噴口鏈 → 折躍跳過流星走廊 → 雷形態鏈電雙殺鏡衛。
    保底線：四機制段全有地面慢速路（各沿原區保底規則），死亡自 checkpoint 2000。
  - L20 最佳線：P2 風形態機動全收星屑 → P3 雷形態裂核大窗爆發。保底線：P2 零擊殺
    純走位、P1/P3 讀 telegraph 打僵直/裂核窗，補給循環＋段起點重試保障磨死。

## 85. v12.1 熱修：真實觸控下滑判定重修（補訂 §21/§23/§77）

> §77 修復對「教科書式垂直長滑持住」有效，但真實拇指手勢（CDP 真觸控模擬實證）
> 四路全掛，生產回報「下滑＋跳」仍不能下穿、蹲姿與琥珀鍵不出現。本章取代 §23 的
> 下向判定與 §77.2 的指示觸發條件。

### 85.1 根因鏈（五情境真觸控探針實證）

1. **底緣行程不足**：左手拇指自然定錨貼屏幕下緣，touchStart 後下滑物理行程僅剩
   15-25px，舊閾值 30px（半徑一半）永遠達不到——蹲姿不出、鍵不變色、按跳變上跳。
2. **flick 抬指**：真實手勢多為「滑完即抬指、數十至數百 ms 後按跳」；down 隨抬指
   歸零，按跳瞬間已失去下向語意。
3. **斜下滑帶走玩家**：拇指自然下滑常帶 ±20-45 度斜角，dx 分量觸發走路
   （220px/s）把玩家帶出平台邊緣；蹲姿因離地永遠到不了位。

### 85.2 修法（三點聯動，均有單測＋真手勢 e2e）

- **扇區＋幅度判定**：`isJoyDown(dx, dy)` 改為 `dy ≥ 18px` 且向量在正下 ±60 度
  扇區內（`|dx| ≤ dy·tan60°`）；18px 高於死區（12）防誤觸、接住底緣短行程，
  扇區容納自然斜下滑、排除近水平走路語意。
- **drop-intent 緩衝窗**：`advanceDownBuffer` 純函式維護 300ms 窗——down 釋放後
  窗內 `downBuffered` 仍真；stage 下穿裁決（`shouldDropThrough`）與跳鍵琥珀指示
  （`isDropReady`）改吃 `downBuffered`，flick 後按跳仍判下跳。空中下砸
  （`resolveJumpPress`）維持即時 down，不吃緩衝窗防誤觸。
- **蹲下鉗水平**：地面 down 成立即 `moveTarget=0`（平台遊戲蹲下靜止慣例），
  斜下滑不再把玩家帶出平台；空中不鉗，保留下砸前橫向微調。

### 85.3 真實手勢守門（e2e 常備）

- CDP `Input.dispatchTouchEvent` 走瀏覽器觸控合成路徑（hit-testing、pointer
  capture、多指分路全真），取代理想化 `dispatchEvent` 合成 pointer——防止未來
  再以理想化輸入製造假綠燈。
- 常備三變體：左手下滑持住＋右手第二指點跳；flick 抬指停頓 150ms 再點跳；
  斜下 45 度滑動（斷言蹲住不位移＋穿落成功）。

## 86. v13 EX 全魔王與星核制霸（EX 體系收尾＋全制霸獎勵）

> 20 關主線（v10-v12）完結後的 EX 收尾列車：把 v9 首發（§58 L4/L7）的 EX 變體
> 體系補齊到全部 5 魔王，並為五王全制霸給一項有感獎勵。FSM 差分（EX_PRISMIX／
> EX_SYRONA／EX_VOIDRA）與呈現層 ex 注入已隨 v10-v12 落地（§68/§74/§82），
> 本章收斂出貨面缺口與全制霸體系。

### 86.1 EX 差分總表（五王；HP 一律 EX_MODS ×1.5、節奏 ×1.15）

| 魔王        | EX HP | 質變差分（每王一項，非純數值）                                  | 反制語彙                 |
| ----------- | ----- | --------------------------------------------------------------- | ------------------------ |
| 果凍王 L4   | 90    | 擊破分裂 3 小果凍（§58）                                        | 保留彈藥收尾             |
| 蝠王 L7     | 78    | P3 月蝕彈幕矩陣（§58）                                          | 讀缺口通道               |
| Prismix L12 | 120   | 雙子動作去同步（相位錯半拍 260ms；分裂 75%／掙扎窗 0.7s／盾 6） | 逐具讀招取代對稱背板     |
| Syrona L16  | 135   | 噴泉順序隨機化（每循環洗牌、seed 注入可測；潮汐再 -25%）        | 讀 telegraph 取代背板    |
| Voidra L20  | 165   | P2 轟炸密度 ×1.25＋P3 螺旋三層（愛心上限 1）                    | 走位風箏＋過熱窗集中輸出 |

### 86.2 出貨面收斂（本車實作）

- **EX 徽鈕**：MapScene `addExEntrance` 自 §58 起即以 `level.boss` 通用掛載——
  L12/L16/L20 通關即出現，本車以 e2e 驗證收口（分頁地圖下三新王徽鈕全數可達）。
- **exPending 提示**：改 `exConquestDone` 判定——L9 通關起提示，五王全制霸才消失
  （原 hardcode 只看 L4/L7）。
- **EX 慈悲愛心上限**（主計畫 §7.4 補齊）：`MERCY_HEAL.exMaxPerLife = 1`（一般
  魔王房 2）；Voidra P2 生存段固定愛心走獨立管線不計上限。
- **EX 再戰保留**：`GameResultData.ex`——敗北結算「再戰魔王」與暫停「重新開始」
  均保留變體模式；EX 擊破僅記 `exCleared` 星章，不動一般 cleared/bestTime（§58）。
- **圖鑑紫星映射**：EX 星章補齊五王（原僅 L4/L7）。

### 86.3 星核制霸（全制霸獎勵，純呈現層 cosmetic）

- 判定：`exConquestDone(save)`——`BOSS_LEVEL_IDS`（由 LEVELS 派生，禁第二份硬編
  清單）全數 `exCleared === true`。
- 獎勵（零平衡影響、零新素材）：
  - TitleScene：金色星噗噗換裝（金 tint）＋金暈＋「星核制霸」章。
  - CodexScene：圖鑑右上常設「星核制霸」金徽記（金星＋金章）。
- 裁決：Boss Rush 入口超出本車 timebox，落 backlog（主計畫 §11-7）；cosmetic 案
  KISS 且與 §61 彩蛋紀律一致（不給永久成長）。

### 86.4 L4/L7 前室 retrofit（主計畫 §7.1 v11+ 擇機項，本車收掉）

- 資料：L4 前室 400px＋護盾/星力二選一＋P2 疾風靴（沿 L12 攻壓型組合）；
  L7 前室 400px＋護盾/疾風二選一＋P2 星力果（空戰輸出窗短，沿 L16 語彙）。
- 呈現層：stage elements 統一平移前室寬（與 decor 同語義「arena 相對座標」；
  走動關 xOffset=0 零影響）——L7 雙彈簧板資料座標不動、自動平移。
- 全五魔王關前室體系一致性由 levels.test 資料驅動守門。

### 86.5 測試與保底實證

- vitest：exConquestDone／mercy EX 上限／L4·L7 前室一致性／EX 公平性下限
  （掙扎窗 ≥600ms、desync ≥200ms 且 < 最短 telegraph）四案新增。
- e2e（v13.spec 七案）：L12 EX 徽鈕全流程（HP 120 磨破寫 exCleared 不動
  bestTime）、L16/L20 EX smoke（HP 135/165）、星核制霸存檔三場景零錯誤、
  L4/L7 前室相機回歸網（入場運鏡後 scrollX 貼齊 anteroomPx、玩家恆在視窗內）、
  EX 中途退出防鎖、EX 敗北再戰（Result 保留變體重入 HP 120）、v9 世代舊存檔
  相容（EX 紀錄保留）。
- 保底實證（1200 寬 trace，`scripts/ex-bot-driver.mjs` 瀏覽器內 80ms tick
  driver；EX 屬再戰內容、入場自願、可退出、不鎖主線進度）：
  - L16 EX 純標準星 **won 73.6s**（整場重試 1）；L20 EX 純標準星 **won 129.8s**
    （段重試 3 零卡關）——trace 存 `screenshots/starpuff-v13/`。
  - L12 EX 採**二段論**：輸出鏈 assist（受控 i-frame 隔離迴避軸）**won 30.8s**
    三階段擊破鏈完整無 DPS 死鎖；迴避軸由公平性下限單測（各招 telegraph
    ≥500ms 不受 desync 侵蝕、掙扎窗 700ms）＋純模式十輪 trace（最佳壓血
    25/120、單輪最長 36.5s——輸出與存活各自成立）分別背書。規則 bot 的一維
    決策（同 tick 僅一行為）在鏡像雙子去同步下組合不出全程，屬 bot 決策上限
    而非已證實的設計軟鎖；人類具備並行操作與前室增益/變身資源（bot 自我設限
    純標準星且不拾前室台座）。
- 觀測點：`__sp.bossHazards()`（shockwave 型危害）＋`__sp.enemyPositions()`＋
  Prismix `getDebugState` 補齊（bot 讀招取樣）；`__sp.gotoLevel(id, ex)` 支援
  EX 直達。
- B1 修復（審查收斂）：L4/L7 retrofit 初版漏掉 boss.ts／noctra.ts 呈現層的
  世界座標平移（相機 pan／攻擊落點／投射物回收界皆以 0 為基準），入場運鏡把
  相機拉回世界原點致玩家離屏——補 `arenaLeft` hook 注入（沿 prismix/syrona
  既有 pattern），全座標計算平移 arena 左緣；缺省 0 行為零變。

# v14 UX/PWA 列車：直持方向翻轉、控制自訂強化與安裝體驗（PM 派工）

## 87. v14 直持預設旋轉方向翻轉（取代 §28 預設方向）

### 87.1 背景與決策

- 使用者反映 v4–v13 的直持旋轉方向（cw：rotate 90deg、手機逆時針轉、鏡頭朝左）
  「沒有滿版的感覺、按鈕變成靠邊邊」；v14 翻轉預設為 ccw（rotate -90deg、
  手機順時針轉、鏡頭朝右），瀏海側換至遊戲畫面右緣。
- 方向與座標換算 SSOT 收斂至 `core/rotation.ts`：`ShellRotation`（none/cw/ccw）
  三態、`pointerToLocal` 統一逆變換（cw：localDx=screenDy、localDy=-screenDx；
  ccw：localDx=-screenDy、localDy=screenDx）；controls／keyConfig／shellLayout
  一律經本模組取向換算，禁止各自複製公式。
- CSS：預設殼 `top:100%; left:0; rotate(-90deg)`（ccw）；`html.sp-rot-cw` 切回
  舊方向。safe-area 換軸表雙套：ccw＝裝置 left→殼上、top→殼右、right→殼下、
  bottom→殼左；cw 維持 v4 原表。
- 偏好持久化：localStorage `sp-rotation`（'cw'｜'ccw'，缺省＝ccw 新預設；
  不進 save schema）；讀取走記憶體快取（pointer 熱路徑不重複讀 storage）。

### 87.2 回訪玩家保護（肌肉記憶）

- 既有玩家（sp-save 有進度且未曾設定 sp-rotation）首次進站於 Title 顯示一次性
  方向告知卡（§92 殼層卡片）：說明新方向並提供「切回舊方向」一鍵；
  已示記憶 localStorage `sp-rotation-notice`。全新玩家無感知不打擾。
- 持向切換入口常駐「按鈕配置」操作列（§88），納入草稿語意：切換即時預覽、
  儲存才落地、取消回滾。

### 87.3 驗證

- 座標矩陣單測（rotation.test.ts 九案）：三態四角／中心／滑動向量映射斷言。
- portrait e2e 雙案：ccw 新預設（上滑=往右）＋ sp-rotation=cw 舊方向回歸
  （下滑=往右、殼 matrix 斷言）。畫布覆蓋率 99.98% 不變。

## 88. v14 按鈕配置頁操作列直欄化與標籤單行（取代 §34 操作列）

- 根因：cfg-bar 橫排 flex 無寬度約束且鈕可壓縮，375/667 級殼寬下
  「儲存並返回」被壓成兩行。
- 修法：cfg-bar 直欄（提示列＋操作列＋縮放列分列）、`.cfg-btn`
  `white-space:nowrap`＋`flex-shrink:0`（禁字內斷行）、空間不足整鈕換列；
  「儲存並返回」精簡為「儲存」。
- 驗收：854／1200 邏輯寬 × 直橫持 × 新舊持向矩陣全標籤單行（visualH=44）。

## 89. v14 虛擬鍵大小自訂（sp-key-layout schema v2）

- schema v1→v2 versioned migration：v1 舊存檔鍵位保留、`scale` 補預設 1；
  未知版本回退預設。v2：`{version:2, a, b, scale}`，scale 夾限 0.8–1.3。
- 縮放經 CSS 變數 `--sp-key-scale` 單點驅動鍵體與鍵帽（clip-path 圖形同步），
  觸控熱區隨元素幾何自然同步；`KEY_BASE_PX`（A76/B72）與 style.css 以單測
  跨檔守門防雙寫漂移。
- 操作列縮放列：縮小／放大步進 5%＋百分比顯示；即時預覽、儲存持久化、
  取消回滾；與拖曳位置共存（夾限以縮放後 offsetWidth 計算）。
- 觸控下限守門：最小縮放 80% 時最小鍵 57.6px ≥ 44px（單測）。

## 90. v14 PWA 安裝偵測與分平台指引

- 偵測矩陣（installGuide.ts，移植 RateWise 模式）：platform
  （ios／android／desktop／unknown，含 iPadOS 桌面模式 maxTouchPoints 辨識）、
  in-app browser（Threads/Barcelona、Messenger 先於 Facebook、Instagram、
  LINE、TikTok/musical_ly/trill、X）、已安裝雙訊號
  （display-mode standalone＋navigator.standalone）。
- 指引卡（§92 殼層卡片）：iOS 分享→加入主畫面步驟；Android
  beforeinstallprompt 一鍵安裝＋選單步驟 fallback；in-app 引導外部瀏覽器開啟。
- 出現邏輯：已安裝／已忽略（localStorage `sp-install-dismissed`，不進 save
  schema）／桌面不打擾；首次到站延遲 2.5s 且僅 Title 安靜時刻顯示；
  appinstalled 自動收卡並記憶。

## 91. v14 觸覺回饋與螢幕常亮（調研加碼，ROI 閘通過二項）

- 觸覺（haptics.ts）：查表跟隨 playSfx 觸發點——僅重擊／里程碑
  （hurt/slam-down/boss-slam/boss-roar/starstorm/win/lose）配短震（單段
  ≤100ms、總長 ≤200ms 守門單測）；高頻一般音效不震防疲勞；靜音早退即同步
  不震；iOS 無 Vibration API 靜默降級。
- 螢幕常亮（wakeLock.ts）：Screen Wake Lock 生命週期跟隨 `#controls.is-active`
  （遊戲進行中取得、離場釋放、回前景重取）；不支援或被拒（省電模式）靜默降級。
- 落選（backlog）：安裝後首啟引導（感知低）、豎屏提示動畫（與免轉向定位矛盾）、
  fullscreen API（iOS 不支援且與 standalone 重疊）。

## 92. v14 殼層卡片基建（shellCards.ts）

- 安裝指引與方向告知共用：`whenShellIdle`（1s 輪詢）僅在 Title
  （data-menu="start" 存在）且殼層安靜（無 controls is-active／is-configuring／
  pause-overlay／既有卡）時顯示——杜絕戰鬥中彈窗攔截操作。
- 非模態頂緣左卡：overlay `pointer-events:none`、卡本體 `min(300px, 34%)` 寬、
  `max-height 72%`——不遮罩、不擋開始鈕與底部選單（320–844 五視口 AABB 零重疊
  矩陣驗證）；`aria-modal` 對話框語意＋Escape 關閉。
- 開玩自動收卡：MutationObserver 監聽 `#controls.is-active`，進遊戲即收
  （不記憶忽略，下次回 Title 再顯示）。

## 93. v14 殼局部 safe-area 量測（canvas 內 HUD 避讓預備）

- `core/safeArea.ts`：讀 `#keys-layer` computed inset（CSS 已依 cw/ccw 換軸、
  含地板值）→ 扣除地板取净 inset → 依邏輯寬／canvas CSS 寬換算邏輯 px；
  供 canvas 內 HUD（暫停／靜音鍵）避讓瀏海與 home indicator 接線。

## 94. v15 成就系統（logic/achievements.ts，純呈現層聚合）

### 94.1 設計原則

- 成就 SSOT＝`logic/achievements.ts` 單一資料表（id／名稱／描述／分類／隱藏與否／
  判定函式），共 21 條；全部由既有 save 資料派生判定（`cleared`／`bestTimeMs`／
  `eggsFound`／`exCleared`），**禁止侵入式遊戲邏輯鉤子**——evaluator 讀 save 即得
  已解鎖集合，遊戲熱路徑零新增寫入點。
- 魔王條目（五王首勝＋五王 EX）由 `LEVELS` 派生（沿 §86 `BOSS_LEVEL_IDS` 慣例，
  禁第二份硬編清單）；命名表以 `Record<BossKind, …>` 鍵定，加王時型別強制補名。
  隱藏成就對應關卡由彩蛋觸發器反查 LEVELS，彩蛋總數同樣派生。
- 分類五種：進度（首關／全 20 關）、魔王（各王首勝／EX 各王／星核制霸——與 §86
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

# v16 產品缺陷修復列車：三席批評收斂（PM 派工）

## 95. v16 直持預設鍵位重錨（D1，取代 §34 預設在直持殼的適用性）

### 95.1 根因與決策

- 三席批評（Grok 席，PM 數學覆核成立）：§34 預設鍵位以 keys-layer 層比例定義
  （A 0.92/0.78、B 0.92/0.34），直橫持共用；直持旋轉殼下層座標軸與裝置軸互換，
  同組比例把 A/B 映射到裝置螢幕頂端（實測 A 裝置 y≈78px、fy≈0.09），雙拇指
  直握不可及——v14 只修了搖桿半邊（左半屏映射到裝置下半），按鍵半邊漏修。
- 修法：預設分流、自訂不動。新增裝置比例錨點 SSOT `PORTRAIT_THUMB_ANCHORS`
  （A fx 0.82/fy 0.86、B fx 0.80/fy 0.68——右下拇指帶、B 沿拇指弧在 A 上方），
  `defaultLayoutFor(rotation)` 依殼向反算層比例：ccw cx=1−fy、cy=fx；
  cw cx=fy、cy=1−fx（§87 軸向映射逆向）；橫持沿用 v14 定案。
- schema 不動（sp-key-layout v2 零遷移）：合法自訂資料在任何持向原樣適用；
  只有「無自訂／損毀回退」與「恢復預設」走旋轉感知預設。
- 直持下 A/B 幾何上與 joy-zone 重疊（裝置下半即遊戲左半）：keys-layer 為後繪
  兄弟層，按鍵天然承接命中；誤觸空白處僅錨定浮動搖桿（點按零位移，無害）。

### 95.2 儲存語意（配置頁）

- 預設態不落盤：從未自訂或按過「恢復預設」後儲存＝清除 sp-key-layout，
  直橫持各自動態解析預設；拖曳／縮放屬自訂，儲存持久化具體布局（維持 v14
  單一共用布局語意）。
- 「恢復預設」依當前草稿持向給對的錨點；持向切換（cw/ccw）時預設態即時重映射，
  自訂布局不動；拖曳逆變換取草稿持向（修正切換未儲存期間軸向錯置）。
- 局中轉向重套：controls 進場後監聽 resize（200ms）／orientationchange（400ms）
  重新解析布局，orientation 切換不殘留舊向預設。
- CSS fallback 鏡像：style.css portrait 區塊鏡像反算值（14/82、32/80；cw
  86/18、68/20），JS 載入前鍵位即在拇指帶；單測跨檔守門防雙寫漂移。

### 95.3 驗證

- 單測 layout.test.ts：前向模擬（層比例→殼→裝置座標，390×844 含 inset）斷言
  cw/ccw 雙向 A/B 落帶、AB 裝置距離 ≥90px、夾限相容、錨點反算一致性、
  深拷貝、CSS 鏡像；parseLayout 旋轉感知回退與 v1/v2 自訂資料不受旋轉影響。
- e2e portrait.spec.ts：D1 案——幾何斷言（A fx≥0.72/fy 0.78–0.95、B 上方帶）＋
  真手勢（CDP dispatchTouchEvent 走瀏覽器 hit-test）點 A 起跳（walk().vy<0）、
  點 B 進入按壓態；cw 舊方向案補同帶幾何斷言。
- 前後對照截圖 screenshots/starpuff-v16/d1-\*.png（before A fy 0.092 → after 0.850）。

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

## 97. v16 區／關命名層級標示（F-01 裁決）

- 三席批評（Composer 席）：地圖同屏「果凍平原」（區頁籤/標頭）與「果凍草原」
  （L1 節點）近義並列，讀感如命名漂移。
- PM 裁決維持層級差：區＝地域（果凍平原/天風峽域/…）、關＝景點（果凍草原/
  翔風峽谷/…），全五區皆同構，統一反而使 L1 與區 1 撞名。
- 消除認知分裂：地圖標頭前綴「第 N 區」（`第 1 區 果凍平原・彩蛋 x/y`）、
  區頁籤 aria「前往第 N 區 ○○」、節點 aria「進入第 N 關 ○○」——視覺與讀屏
  同義：頁籤/標頭＝區域、節點＝關卡。
- 資料面守門（zones.test.ts）：區名不得與任何在編關名撞名。

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

## 99. v16 版本頁腳 SHA 來源修正（F-02，補充 §42）

- 根因（Composer 席）：Zeabur Docker build 提供 GIT_COMMIT_HASH build arg 但
  context 無 .git，starpuff 版本解析僅呼叫 git 指令，落 nogit 佔位並露出於
  production 頁腳（v0.14.0+nogit）。
- 修法：SHA 來源優先序 GIT_COMMIT_HASH env（repo Docker 慣例，同 ratewise）
  → 本地 git → 皆缺省略後綴（乾淨 vX.Y.Z，不再露佔位字樣）。

## 100. v16 勝利結算「下一關」主 CTA（D3，取代 §39 勝利回地圖單一動線）

- 根因（Grok 席）：魔王關擊破後結算僅「世界地圖」，接續遊玩需地圖折返一次，
  斷了闖關節奏。
- 修法：一般勝利雙鈕——主 CTA「下一關」（nextLevelId 資料驅動，直入下一區
  首關）＋「世界地圖」降次選；ENTER 對應主 CTA。Result 勝利僅魔王關觸發
  （走動關經星星門直進地圖揭霧），L20 全破走謝幕不經 Result，故一般勝利必有
  下一關（資料防禦仍回退地圖）。EX 勝利與敗北動線不變（再戰 EX／再戰魔王）。
- 驗證：v16 e2e——L4 擊破後 next-level 直入 L5、map 次選並存；smoke 勝利案
  改走 map 次選鈕。
