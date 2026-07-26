# 星噗噗 — 產品定位與工程契約

> **職責範圍**：遊戲是什麼、場景怎麼串、程式怎麼分層、什麼算過關（品質門檻）、版本號怎麼來，以及跨系統的架構級契約（事件契約、GameScene 職責邊界、物理/視覺縮放解耦）。
>
> **不在本檔**：任何玩法數值與機制規格。操作與輸入見 `01-controls-input.md`；星彈與變身見 `02-combat-star.md`；怪物與魔王見 `03-enemies-bosses.md`；關卡與世界地圖見 `04-levels-world.md`。
>
> **閱讀慣例**：每一句主文都是現行有效規則；被取代的舊規則一律降級為緊接其後的 `> **已廢止**` 附註，僅供追溯。索引與取代對照見 [`../GAME_DESIGN.md`](../GAME_DESIGN.md) 與 [`99-superseded.md`](99-superseded.md)。章號 §N 為全專案穩定識別碼（程式註解直接引用），拆檔不重新編號。

## 1. 產品定位

- 橫式（landscape）側向卷軸動作遊戲：**五區二十關**——十五關走動探索＋五座魔王關（各王另有 EX 變體），單關 2–4 分鐘，可無限重玩。關卡編成見 §84。

> **已廢止**（v8→v12 逐版擴充，現行見 §84）：四關制（三關走動＋一座魔王 Boss Rush 收尾）；其後 v8 七關雙魔王、v9 九關、v10 十二關、v11 十六關均為過渡值。

- 原創 IP：主角與怪物皆為原創設計（果凍星球世界觀），嚴禁使用任天堂卡比之名稱、造型、配色構圖。
- 目標體驗：Q 彈、可愛、爽快——大量擠壓拉伸、粒子、震屏、音效回饋。

## 2. 核心循環

移動/跳躍/漂浮 → 長按吸入小怪 → 吞下獲得星彈（上限 5，v19 §109）→ 點按發射星彈打魔王 → 閃避彈幕與衝撞 → 擊破勝利。

## 3. 場景流程

`BootScene`（載入+進度條）→ `TitleScene`（標題、開始按鈕、設定入口）→ `MapScene`（世界地圖 hub，五區分頁，§39／§78）→ `GameScene`（二十關，§84）→ `ResultScene`（勝/敗）；L20 全破先經 `CreditsScene` 謝幕再進結算（§84）。

單關流程：自世界地圖節點進關 → 走動關側向卷軸（擊殺配額達成 → 星星門開啟 → 走入過關）／魔王關（前室補給廊道 §69 → 入場運鏡 → Boss 戰，期間補生可吸小怪供彈藥）→ 勝利星爆 / 敗北。過關**寫入存檔後自動回世界地圖揭霧**（§39），自節點進下一關或重玩；魔王關勝利結算另有「下一關」主 CTA（§100）。死亡處理：走動關重試當前關（卡點關自 checkpoint 就地重生 §67）；魔王關進敗北結算（EX 與部分終段走段起點重試 §82／§114.4）。關卡資料驅動細節見 §15。

> **已廢止**（v6 起，現行見 §39）：過關播全屏轉場卡直達下一關——轉場卡廢除，改世界地圖 hub。

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

## 42. 版本號顯示

- SSOT：package.json `version` ＋ short git SHA，經 vite `define __APP_VERSION__` 嵌入（`v0.X.Y+abcdef`；無 git 環境標記 nogit）。
- 呈現：Title 頁腳小字（12px、violet、alpha 0.75）；`window.__sp.version()` production 也掛載供現場排障（其餘 \_\_sp 除錯鉤子維持 DEV/test 限定）。

## 99. v16 版本頁腳 SHA 來源修正（F-02，補充 §42）

- 根因（Composer 席）：Zeabur Docker build 提供 GIT_COMMIT_HASH build arg 但
  context 無 .git，starpuff 版本解析僅呼叫 git 指令，落 nogit 佔位並露出於
  production 頁腳（v0.14.0+nogit）。
- 來源鏈（收斂於 `scripts/lib/build-commit-sha.mjs`，跨 app SSOT）：
  **`ZEABUR_GIT_COMMIT_SHA`（Zeabur 建置階段內建，Dockerfile builder 段宣告 ARG 才會
  注入）→ `GIT_COMMIT_HASH` → `git rev-parse` → 皆缺則省略後綴**（乾淨 vX.Y.Z，
  不露佔位字樣）。

> **已廢止**（2026-07-26 #877 起）：以 `GIT_COMMIT_HASH` env 為首選來源——`.dockerignore`
> 排除 `.git` 使建置容器內 git 指令必失敗，Zeabur 又不提供該變數，production 恆落純
> `vX.Y.Z`，同版號兩次部署無鑑別力。

## 106. GameScene strangler 拆解與守門（三席維護性 5/7/8 收斂）

### 106.1 拆解記錄（行為零改變）

- 性質：純維護性重構——玩法、數值、視覺、事件順序、存檔語意一律不動；
  events 契約凍結（§11），本車為其補契約測試而非修改。
- GameScene 2121 → 1196 行，職責收斂為一句話：orchestration＋scene lifecycle
  （create 接線、update 逐幀委派、事件路由、勝敗轉場、e2e 鉤子面）。
- 六個抽取單元（每步先補 characterization test 鎖行為，全測綠才 commit，
  獨立可 revert）：
  - `systems/bossFactory`：魔王品種分派（never 守衛）、補給小怪節奏、召喚夾限。
  - `systems/starCombat`：星彈規格解析單一出口＋技能世界結算（星暴/下衝擊/
    殼盾反擊/鏈電束/風化落地/雷鏈/凍結場/爆裂波及）。
  - `systems/starSteering`：準星輔助/追電導引/磁場吸偏/拖尾附掛（導向順序凍結）。
  - `systems/overlaps`：戰鬥碰撞接線（接線順序凍結；damagePlayer/damageBossAt
    單一入口不變）。
  - `systems/eggTracker`：彩蛋進度鎖存/逐幀餵送/獎勵落地/crown 時間窗。
  - `systems/toasts`：成就 toast 佇列/星味首遇提示/彩蛋慶祝演出。
- 新增測試：GameEvents 契約測試（事件名唯一、emit/on/off 對偶、FSM phase
  恰一次、waves 序列）＋六模組 characterization——vitest 580 → 650。
- ESLint 守門：apps/starpuff 範圍 `max-lines` error 1200（levels.ts 資料表
  豁免），防 GameScene 再膨脹。

### 106.2 觀察項設計理由註記（不動行為）

- 直持 joy-zone 幾何包住 A/B（Grok 席 v16 觀察項）：維持 §95 設計定案——
  keys-layer 為後繪兄弟層天然承接命中，誤觸空白處僅零位移搖桿錨定（無害）。
  若未來要消「右拇指邊緣偶發搖桿錨定」感，方向為 joy-zone 右緣排除鍵命中區；
  本車行為零改變原則下不動。
- 教學關死亡結轉讀值時窗（§105 D5）：retryLevel 於 350ms 延遲回呼讀取配額，
  理論上飛行中星彈可多算 1 殺——carryKillsOnDeath 夾限（≤配額-1）保證無害
  且恆有利玩家，屬既有設計定案，不加鎖存。

## 117. 物理/視覺縮放解耦 visualScale（#819 子項 3；T7-B 列車）

§77 型缺陷家族的架構級根治：Phaser 4 Arcade `Body.updateBounds` 每物理步以
`sourceWidth × |scale|` 重算碰撞箱（官方 API 文檔＋Body.js 原始碼實證，無凍結旗標），
且 TweenManager 與物理 world 同掛 `SceneEvents.UPDATE`——任何直接 tween sprite scale
的視覺效果都會在同幀被物理讀到，衍生落地擠壓迴圈、腳底離台、穿台與 overlap 漏檢。

### 117.1 通道架構（game/systems/visualScale.ts，場景鍵入單例）

- 沿 §77.2 蹲姿／§45 走 bob 已驗證的 PRE/POST_UPDATE 視覺通道模式全遊戲統一：
  `PRE_UPDATE` 還原物理基準（物理步只見基準）、`POST_UPDATE` 套用
  `base × fx × mod`（渲染見形變）；tween 一律以 fx 代理為標的，物理永不見瞬態縮放。
- 三層語意：`base`＝物理基準（精英體型、鑽地鰭、半潛、縮殼、月牙縮體、裸核、
  texture 切換後 rebase）；`fx`＝tween 代理（squash/stretch、popIn、wobble、翼拍、
  怒吼脈動、死亡收縮）；`mod`＝逐幀直寫（idle 呼吸、蹲縮），擁有者每幀維護。
- 覆蓋面：玩家（擠壓/呼吸/蹲縮/受擊）、18 怪（popIn/wobble/呼吸/死亡/狀態造型）、
  五王（wobble/翼拍/攻擊擠壓/怒吼/碎裂/死亡/相位縮體）。柱/爪/糖泉等升起中的
  危害判定屬蓄意成長 hitbox，維持直接縮放不遷移。
- 補丁退場：`LANDING_SQUASH_MIN_VY`（§77.1 單案例門檻）刪除——擠壓不再縮物理箱，
  任意著地皆可安全觸發；碰撞箱不再隨 wobble 每拍脈動（怪 ±8%、魔王 ±5-7%）、
  popIn 生成期物理箱不再僅 30%。
- 行為錨：visualScale.test 鎖住「動畫期間物理讀取窗 scale 恆為基準」契約與
  池重用重錨、shutdown 清理語意；行為零改變由全量 vitest＋e2e 全套＋
  level-audit L1/L14/L16 EX 對比 base 佐證。
