# 星噗噗 StarPuff — 遊戲設計 SPEC（SSOT）

> 手機優先 PWA 動作小遊戲。穿越層層果凍關卡、吸入果凍怪、化為星彈、擊敗果凍魔王。
> 版本：v2.0（PM 親撰；v2 新增 §15-§18 關卡系統）｜路由：`https://app.haotool.org/starpuff/`｜24h 衝刺交付

## 1. 產品定位

- 直向（portrait）單場景 Boss Rush 動作遊戲，單局 2–4 分鐘，可無限重玩。
- 原創 IP：主角與怪物皆為原創設計（果凍星球世界觀），嚴禁使用任天堂卡比之名稱、造型、配色構圖。
- 目標體驗：Q 彈、可愛、爽快——大量擠壓拉伸、粒子、震屏、音效回饋。

## 2. 核心循環

移動/跳躍/漂浮 → 長按吸入小怪 → 吞下獲得星彈（上限 3）→ 點按發射星彈打魔王 → 閃避彈幕與衝撞 → 擊破勝利。

## 3. 場景流程

`BootScene`（載入+進度條）→ `TitleScene`（標題、開始按鈕、音效提示）→ `GameScene`（波次→魔王戰）→ `ResultScene`（勝/敗、再玩一次）。

波次腳本：開場浮字教學 → Wave1：果凍丁 ×3 → Wave2：混合 ×4 → 魔王入場動畫（震屏+吼叫）→ Boss 戰（期間持續補生 1–2 隻小怪供彈藥）→ 勝利星爆 / 失敗。

## 4. 操作（行動裝置優先）

- 左下：◀ ▶ 方向鍵（大拇指熱區，56px+）。
- 右下：Ⓐ 跳躍（空中連按＝拍翅漂浮，最多 3 次，落地重置）；Ⓑ 吸/射（無彈藥＝按住吸入；有彈藥＝點按發射，長按仍可吸）。
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
- 邏輯畫布：480×854（Scale.FIT + autoCenter，DPR 上限 2）。

## 8. Juice 清單（品質關鍵，全數必做）

hit-stop 60ms、震屏 4px、受擊白閃、squash & stretch（跳躍/落地/吸入鼓脹）、吸入漩渦粒子、星彈拖尾、傷害數字浮動、魔王死亡星爆、HP 心心受擊跳動、按鈕按壓回饋、入場/退場 tween。

## 9. 音效（zzfx，零音檔資產）

jump、flap、inhale（迴圈）、swallow、shoot、hit、hurt、boss-roar、boss-slam、win、lose；BGM 用 zzfx 合成短循環（手刻序列混音，零依賴）。首次觸控後 resume AudioContext（iOS 必須）。

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
src/game/logic/    combat.ts bossFsm.ts waveModel.ts ← pure TS，vitest 對象
```

- 事件契約（`events.ts`，跨系統唯一溝通管道）：
  `player:damaged, player:died, ammo:changed, enemy:spawned, enemy:inhaled, enemy:killed, star:fired, boss:spawned, boss:damaged, boss:phase, boss:defeated, wave:changed, game:won, game:lost`

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

| #   | 關卡     | 場景（bg key） | 世界寬              | 擊殺配額 | 生成間隔                | 怪物組合                         | 難度設計                                     |
| --- | -------- | -------------- | ------------------- | -------- | ----------------------- | -------------------------------- | -------------------------------------------- |
| 1   | 果凍草原 | bg-meadow      | 1680px              | 6        | 2600ms                  | jelly 60%、floaty 40%            | 教學關：平台低差、無地形威脅、幾乎不死       |
| 2   | 雲朵高台 | bg-heights     | 1920px              | 9        | 1800ms                  | floaty 40%、spiky 35%、puffy 25% | 垂直平台跳躍、spiky 巡邏走道、puffy 空中封位 |
| 3   | 星空回廊 | bg-arena       | 2160px              | 10       | 1300ms                  | 五種混編、可吸怪佔比 50%         | 密度高壓、chompy 卡口、彈藥管理壓力          |
| 4   | 魔王城   | bg-throne      | 480px（單屏 arena） | —        | 補生 3500ms（僅可吸怪） | Jellord + jelly/floaty 補給      | §6 + §17 強化演出                            |

- 走動：關卡 1-3 為側向卷軸（`camera.startFollow(player, true, 0.08, 0.08)` + `setBounds(0,0,worldW,854)`；world 物理邊界同步）。
- 通關條件：擊殺配額達成後右端出現「星星門」（fx-star 放大 + 光暈脈動 + 浮動 tween，graphics 組合，不新增美術），走入即過關。
- 關卡資料契約（levels.ts）：`{ id, nameZh, bgKey, worldWidth, killQuota, spawnIntervalMs, maxOnScreen, safeZoneTailPx, enemyMix: {kind,weight}[], platforms: {x,y,w}[] }`——GameScene 依資料驅動，禁止每關寫死邏輯分支。
- 尾端 release：每關末 `safeZoneTailPx: 480` 禁 spawn（星星門前喘息區，鋸齒 tension-release）。`maxOnScreen`：S1 3、S2 4、S3 5。
- HUD 增列：左上關卡標示（`1-1` 式）+ 擊殺配額進度（`⭐ 3/8`）。

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
- 全程 60fps 預算內：粒子單發上限 40、vignette 用單一半透明 rect 疊層。

## 18. 動畫流暢度打磨清單（全實體）

走路彈跳（玩家移動時 y 微幅 bob + 輕微傾斜）、落地塵埃圈（著地速度 >300 觸發）、所有敵人生成 popIn（scale 0→1 back.out）、死亡 squash 消失、星星門吸入過關演出（玩家縮小旋轉飛入）、轉場卡緩動（slide+fade）、鏡頭跟隨 lerp 0.08 平滑。

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

## 19. v2 美術資產增補（codex 專用；生成尺寸同 §10 規範）

| 檔名              | 內容                                                                     | 備註                               |
| ----------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| bg-meadow.png     | 直向果凍草原：粉綠草丘、果凍花、奶油雲（1024×1536 不透明）               | 底 1/3 乾淨地面                    |
| bg-heights.png    | 直向雲朵高台：高空粉藍雲海、遠景漂浮果凍島（1024×1536 不透明）           | 底 1/3 乾淨、中段留平台視覺空間    |
| bg-throne.png     | 直向魔王城王座廳：葡萄紫果凍城、金冠紋飾、戲劇但可愛（1024×1536 不透明） | 底 1/3 乾淨、頂部王座剪影          |
| minion-puffy.png  | 氣球魨（2048 透明）                                                      | 珊瑚粉 #FFA8A0、短圓刺、驚訝圓眼   |
| minion-chompy.png | 咬咬花（2048 透明）                                                      | 鵝黃 #F5E6A8、花瓣嘴微張、莖葉底座 |
