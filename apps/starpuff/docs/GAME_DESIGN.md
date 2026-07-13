# 星噗噗 StarPuff — 遊戲設計 SPEC（SSOT）

> 手機優先 PWA 動作小遊戲。吸入果凍怪、化為星彈、擊敗果凍魔王。
> 版本：v1.0（PM 親撰）｜路由：`https://app.haotool.org/starpuff/`｜24h 衝刺交付

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
| 主角 | 噗噗 Puffpo    | 薄荷奶油色圓球、頭頂星星呆毛、桃色腮紅 | 移動/跳/漂浮/吸/射 | HP 5、受擊無敵 1.2s                    |
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

jump、flap、inhale（迴圈）、swallow、shoot、hit、hurt、boss-roar、boss-slam、win、lose；BGM 用 zzfxm 短循環（原創簡短旋律）。首次觸控後 resume AudioContext（iOS 必須）。

## 10. 美術資產規格（codex imagegen 專用；除此之外嚴禁動用 codex）

統一風格關鍵詞（每次生成必附）：
`kawaii chibi jelly creature, soft pastel palette, thick rounded soft outline, glossy jelly highlight, flat cel shading, clean high-quality mobile game sprite, centered, full body`

透明需求資產以 flat #00ff00 背景生成後去背。生成尺寸 2048×2048（bg 為 1024×1536），交付至 `apps/starpuff/src/assets/sprites/`。

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
