# 星噗噗 — 操作、輸入與虛擬鍵布局

> **職責範圍**：玩家怎麼操作遊戲，**以及與輸入直接連動的彈匣／蓄能狀態機**。搖桿與 A/B/SP 鍵語意、跳躍與下衝擊輸入矩陣、觸控寬容度與真實手勢判定、走動與移動手感、直持旋轉殼與座標換算、虛擬鍵布局 SSOT 與按鈕配置頁，以及星暴 2.0 的滿匣結晶與蓄能星生命週期（§109.3）。
>
> **為什麼星暴狀態機在這裡**：SP 情境鍵的裁決（`resolveSpPress`：解除／引爆／變身）必須讀蓄能星相位才能決定按下去會發生什麼——把相位機拆去 `02` 會讓同一個狀態機有兩個 SSOT，正是本次拆檔要消滅的漂移。星暴的**世界結算效果**（清場、魔王傷、無敵窗）仍歸 `02-combat-star.md` 與 §64.2。
>
> **不在本檔**：按下之後的戰鬥結算——星彈屬性、混合星、變身能力表見 `02-combat-star.md`；暫停選單、主選單、HUD 命中層見 `06-ui-shell-pwa.md`；偏好如何持久化見 `05-save-settings.md`。
>
> **現行輸入 SSOT ＝ §109**（B 鍵三語意＋SP 情境鍵）；§23／§57 的長按觸發面已退場。
>
> **閱讀慣例**：每一句主文都是現行有效規則；被取代的舊規則一律降級為緊接其後的 `> **已廢止**` 附註，僅供追溯。索引與取代對照見 [`../GAME_DESIGN.md`](../GAME_DESIGN.md) 與 [`99-superseded.md`](99-superseded.md)。章號 §N 為全專案穩定識別碼（程式註解直接引用），拆檔不重新編號。

## 4. 操作（行動裝置優先）

- 左半屏：浮動搖桿（觸點即中心、半徑 60px、死區 12px；水平移動 + 下向偵測供下衝擊，規格見 §21）。
- 右側：A/B 圖形圓鍵（B 位於右側偏上食指區、位置可自訂，§34；技能可用時 B 上方浮現 SP 情境鍵，§109.2）——A 跳躍（空中連按＝拍翅漂浮，最多 3 次，落地重置）；B 吸/射（三語意見 §109.1）。

> **已廢止**（v5 起，現行見 §34）：A/B 斜排布局（B 在 A 左上 45 度）、位置不可自訂。

- 鍵盤（桌機備援）：←→ / Z 跳 / X 吸射 / C 特殊技（SP，§109.2）。
- 全域：`touch-action: none`、禁雙擊縮放、首次觸控解鎖 AudioContext。

## 21. v3 橫式轉向（PM 親撰）

- 邏輯畫布高 480、寬 854–1200 動態（§28 響應寬幅），Scale.FIT + NO_CENTER 由旋轉殼定位；manifest **不鎖** orientation；直向持機走 CSS 旋轉殼直接呈現橫式（§28 免轉向）。

> **已廢止**（v4 起，現行見 §28）：固定 854×480 + CENTER_BOTH、manifest orientation 鎖 landscape、直向持機顯示「請轉橫」遮罩（遮罩廢除）。

- 世界尺寸：高 480；寬放大至 S1 2700 / S2 3100 / S3 3500（視野變寬 1.78 倍，維持等效走動時長）；平台改雙層以內（天花板變低），高度差以跳躍 -420 可達為準。
- HUD 重排：頂列橫排——HP 心心左上、STAGE 標示中上、配額右上；Boss 條頂中置。全部 HUD 圖示改 graphics 繪製（星形/心形程序化），全遊戲禁用 emoji 與文字字元鍵帽。
- 虛擬手柄（參考實體手柄配置）：左側浮動搖桿（觸點即中心、半徑 60px、死區 12px、水平為主 + 下向偵測供下衝擊）；右側 A（跳，右下拇指帶）/ B（吸/射，右側偏上食指區），布局可拖曳自訂與縮放（§34／§89）；橫持 iPhone safe-area 側邊 inset 必須套用。按鍵一律 canvas/CSS 繪製圖形（無文字節點）。

> **已廢止**（v5 起，現行見 §34）：A/B 雙鍵 64px+ 斜排、間距 16px+、B 固定在 A 左上 45 度、布局不可自訂。

## 22. iOS 觸控直通（研究回寫後定稿）

- 已知基線：控制層與 canvas 套 `-webkit-touch-callout: none`、`-webkit-user-select: none`、`user-select: none`、`touch-action: none`、`-webkit-tap-highlight-color: transparent`；pointerdown/contextmenu preventDefault；按鍵不含可選取文字（無障礙走 aria-label）。
- 長按放大鏡（iOS 17+ text loupe）根除：按鍵去文字化 + callout/select 全關 + 必要時 touchstart passive:false preventDefault——以調研結論為準補齊。
- 研究項：Safari gesturestart 縮放攔截、standalone PWA 與瀏覽器內差異、audio unlock 於橫式的相容性。

## 28. v4 免轉向橫式與響應寬幅（PM 親撰）

- 免轉向：偵測 portrait viewport 時，以 CSS 旋轉容器方案將整個遊戲容器（canvas + DOM 控制層）旋轉 90 度呈現橫式——使用者直持手機即玩，不再顯示轉橫遮罩（遮罩廢除）。**預設方向 ccw**（rotate -90deg、鏡頭朝右，§87）；cw 為可切換偏好。技術定案依調研回寫（Phaser 4 相容性、pointer 座標映射、safe-area 換軸）。

> **已廢止**（v14 起，現行見 §87）：預設方向為 cw（rotate 90deg、鏡頭朝左）。

- 響應寬幅：邏輯高固定 480，寬依裝置比例擴展（下限 854、上限 1200）；Scale 模式依調研定案（EXPAND/RESIZE 擇一）。HUD 錨定鏡頭邊緣自適應；世界生成邊距、星星門偵測、boss 單屏佈局以動態視寬計算，禁止硬編 854。
- 驗收基準機型：390×844（iPhone 13 直持）、430×932（Pro Max 直持）、844×390（橫持）三態皆可玩。

## 34. v5 控制布局重設計與按鈕自訂

- 人體工學定案（§33 條目 7）：雙手橫持時拇指錨於下側角、食指自然落在裝置上緣——A 跳躍維持右下（拇指連打），B 吸/射移至右側偏上（食指按壓；與 A 垂直遠離杜絕誤觸）；方向搖桿維持左半屏。
- 布局 SSOT：`core/layout.ts`——按鍵中心以 keys-layer 安全區內比例（cx/cy 0-1）表示；**預設依殼旋轉態分流** `defaultLayoutFor`（直持採右下拇指帶錨點，§95），自訂布局仍直橫持共用。橫持 `DEFAULT_LAYOUT`：A (0.92, 0.78)、B (0.92, 0.34)。

> **已廢止**（v16 起，現行見 §95）：預設鍵位直橫持共用同一組比例——該組比例在直持旋轉殼下會把 A/B 映射到裝置頂端（實測 A 裝置 fy≈0.09），雙拇指不可及。

- `#keys-layer`：安全區內鋪滿的定位容器（四向 `max()` 地板＋portrait 換軸表），按鍵以 `left/top %` + `translate(-50%,-50%)` 定位。
- 按鈕自訂（KISS：拖曳＋儲存＋重置，不做進階編輯器）：**Title「設定」→「按鈕配置」轉入**（§118.2）→ `systems/keyConfig.ts` DOM 覆層——直接拖曳真實 A/B 鍵即時預覽，「儲存」寫入 `sp-settings.keyLayout`（schema v2 `{version:2, a:{cx,cy}, b:{cx,cy}, scale}`；版本不符/損毀回退預設，§89），「恢復預設」一鍵還原。操作列直欄化（提示列＋操作列＋縮放列，§88）。拖曳座標經 `pointerToLocal` 換軸，夾限 `KEY_CLAMP` 保證按鍵完整在畫面內。

> **已廢止**（v14／v19 起，現行見 §88／§89／§118.1）：Title 直接掛「按鈕配置」鈕；橫排操作列與「儲存並返回」標籤；schema v1 `{version:1, a, b}`；獨立 localStorage 鍵 `sp-key-layout`（僅存留為一次性 migration 來源）。

## 41. v6 移動手感打磨（logic/movement.ts，pure TS 可測）

- 加減速曲線取代瞬時 setVelocity：加速 1400px/s²（約 0.16s 達全速 220）、減速 2000px/s²（約 0.11s 停定）、反向轉身加＋減速疊加率（即刻有力）；殘速 <8 吸附歸零防微速漂移。
- 超速殘速（擊退 234 等）先夾回常速帶再逼近，無殘速滑行（v7 §44 移除疾衝後僅餘擊退來源）。
- 手感事件（邊緣觸發，`detectMoveFx`）：起跑塵埃（靜止起步）、急停塵埃（高速鬆手 ≥160）、轉身塵埃＋小幅擠壓（高速反向 ≥120，遮蓋翻面瞬間）。塵埃 ≤4 顆/次、tween 自毀，60fps 安全。
- 既有落地 squash（§18）、走路 bob（§18/§25 PRE/POST_UPDATE 視覺偏移）維持不動；嚴禁重新引入抖動——相機 lerp(1,1)/roundPixels:false 現值不動，改後必跑既有抖動與 portrait e2e（本版已全綠）。

## 44. v7 下衝擊觸發改制與跳躍鍵輸入矩陣（PM 親撰，取代 §23 下+B 觸發）

- 下衝擊改為「空中搖桿下＋跳躍鍵（A）」觸發：B 鍵回歸純吸/射/技能語意，空中吞含
  （puffed，腹中有怪）狀態不影響觸發——矩陣不讀彈匣。數值不變（下墜 700、落地 60px
  衝擊波傷害 2、CD 1.2s、零彈藥消耗、可破磚）。
- 空中疾衝（§30 Air Dash）整體移除：雙擊 A 與拍翅節奏衝突且誤觸率高；相關輸入、
  純邏輯、殘影 fx、音效、圖鑑條目與測試全數清除（movement 夾速鏈保留供擊退殘速）。
- 跳躍鍵輸入矩陣（`logic/skills.ts` `resolveJumpPress`，pure TS 可測）。「空中」＝
  **真空中**（coyote 窗內視同在地，不觸發下砸，§71.1）；地面主地面下＋跳帶蹲姿視覺
  （§71.2），跳躍裁決不變。下向判定吃 drop-intent 緩衝窗（§85.2），空中下砸維持即時 down：

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

## 77. v11.1 熱修：下跳穿落根修、蹲姿指示與吸入豁免

### 77.1 站台「下＋跳」穿落回歸根修（補訂 §29/§44）

> 2026-07-26 取代注記（§117）：本節根因鏈第 1 點「擠壓縮小 body」的耦合已由
> visualScale 物理/視覺解耦通道根治——物理箱永不隨美術縮放，`LANDING_SQUASH_MIN_VY`
> 門檻補丁退場；`recentlyGroundedMs`／`restingOnOneWay`／`oneWayLandBand` 屬獨立
> 語意修正（coyote 收斂、旗標抖動免疫、下砸防隧穿），維持有效。

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

- 落地擠壓迴圈已由 §117 visualScale 通道**架構級根治**：物理箱永不隨美術縮放，任意
  著地速度皆可安全觸發擠壓，無需速度閘。

> **已廢止**（v19 §117 起）：最低著地速度閘 `LANDING_SQUASH_MIN_VY=120`（微速重新接觸
> 不再擠壓，實測站立接觸穩定度 120/120 步）——單案例補丁，解耦後無存在必要，已刪除。

- `resolveJumpPress` 增 `recentlyGroundedMs`（傳 coyote 殘量）：coyote 窗內視同在地，
  下砸僅「真空中」（離地 >150ms）觸發——§44 矩陣「空中」行語意收斂為真空中。
- 站台判定抽 `stageModel.restingOnOneWay` 純函式：接觸旗標**或**沉降幾何
  （腳底於台頂 −6..+8px 帶內且 0 ≤ vy ≤ 90）擇一成立，對旗標抖動免疫。
- 著地帶 `oneWayLandBand(stepΔY)=max(6, ΔY+2)` 動態放寬：下砸（~11.7px/步）與高處
  落下不再隧穿單向平台；低速維持 +6 緊帶防側切。

**地形平台統一**：粉紅平台掛 `canLandOneWay` process callback＋`terrainOneWay` hook
納入同一下穿裁決——玩家視角所有「單向平台」下＋跳皆可穿落（S1 教學一致性）。

**2026-07-28 增補（#769 未覆蓋分支）**：L16 Syrona arena 浮台 collider 原沿用獨立的
固定 +6 帶裁決，未接入 `oneWayLandBand`——雙跳／下砸高速下降（>360px/s）穿越幀
相位性越帶直穿浮台（真瀏覽器實測穿透率 20-25%/次），P2 潮汐期即墜水致死。著地
裁決收斂 `stageModel.oneWayLandable` 單點，stage elements／地形粉紅平台／魔王浮台
三處 collider 共用；魔王浮台維持不吃下穿窗（保底位不可下穿語義不變），上行穿越
（vy<0 放行）不變。

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
- 偏好持久化：`sp-settings.shellRotation`（'cw'｜'ccw'｜`null`；`null`＝從未選擇，
  供 §87.2 一次性告知判定，實際套用缺省＝ccw 新預設。不進 save schema，§118.1）；
  讀取走記憶體快取（pointer 熱路徑不重複讀 storage）。

> **已廢止**（v19 起，現行見 §118.1）：獨立 localStorage 鍵 `sp-rotation`——僅存留為
> 一次性 migration 來源，落盤成功後刪除。

### 87.2 回訪玩家保護（肌肉記憶）

- 既有玩家（存檔有進度且未曾設定持向偏好——v19 §118.1 即
  `sp-settings.shellRotation === null`）首次進站於 Title 顯示一次性
  方向告知卡（§92 殼層卡片）：說明新方向並提供「切回舊方向」一鍵；
  已示記憶 localStorage `sp-rotation-notice`。全新玩家無感知不打擾。
- 持向切換入口常駐「按鈕配置」操作列（§88，自設定頁轉入），納入草稿語意：切換即時
  預覽、儲存才落地、取消回滾。

### 87.3 驗證

- 座標矩陣單測（rotation.test.ts 九案）：三態四角／中心／滑動向量映射斷言。
- portrait e2e 雙案：ccw 新預設（上滑=往右）＋持向偏好設為 cw 的舊方向回歸
  （下滑=往右、殼 matrix 斷言）。畫布覆蓋率 99.98% 不變。

### 87.4 方向解鎖引導＋桌機正置（#817，T2）

- 桌機判定（`detectDesktopEnvironment`，rotation.ts SSOT）：`pointer:fine` 且
  `maxTouchPoints===0` 且視口寬 ≥1024——boot 一次判定掛 `html.sp-desktop` class
  （session 內 SSOT，JS 與 CSS 恆一致）。
- 桌機模式：方向恆正（`getShellRotation()` 恆 none＋CSS 旋轉殼旁路）、虛擬鍵隱藏
  （鍵盤唯一操作面）、首次鍵位卡（← → 移動／Z 跳／X 吸射，記憶 `sp-desktop-keys`）、
  Title 常駐「操作說明」入口（`data-menu="keys"`）隨時重看。
- 直持引導：卡片顯示當下仍為 portrait（延遲期間未轉橫＝方向鎖定啟發式）→ 一次性
  shellCard「橫持遊玩體驗更佳（鏡頭朝右）」，記憶 `sp-orientation-hint` 不重複打擾；
  觸控裝置（含觸控筆電）恆不進桌機模式，旋轉殼語意保留。
- e2e（t2.spec.ts 三情境 × 三 project）：桌機（殼 transform none、#controls 隱藏、
  鍵位卡一次性、鍵盤可操作）／直持未解鎖（提示卡一次性）／橫持（雙卡皆不誤觸）。

## 88. v14 按鈕配置頁操作列直欄化與標籤單行（取代 §34 操作列）

- 根因：cfg-bar 橫排 flex 無寬度約束且鈕可壓縮，375/667 級殼寬下
  「儲存並返回」被壓成兩行。
- 修法：cfg-bar 直欄（提示列＋操作列＋縮放列分列）、`.cfg-btn`
  `white-space:nowrap`＋`flex-shrink:0`（禁字內斷行）、空間不足整鈕換列；
  「儲存並返回」精簡為「儲存」。
- 驗收：854／1200 邏輯寬 × 直橫持 × 新舊持向矩陣全標籤單行（visualH=44）。

## 89. v14 虛擬鍵大小自訂（sp-key-layout schema v2）

- schema v1→v2 versioned migration：v1 舊布局鍵位保留、`scale` 補預設 1；
  未知版本回退預設。v2：`{version:2, a, b, scale}`，scale 夾限 0.8–1.3。
  **儲存位置＝`sp-settings.keyLayout` 子樹**（§118.1；schema 形狀不變）。

> **已廢止**（v19 起，現行見 §118.1）：獨立 localStorage 鍵 `sp-key-layout`——僅存留為
> 一次性 migration 來源，落盤成功後刪除。

- 縮放經 CSS 變數 `--sp-key-scale` 單點驅動鍵體與鍵帽（clip-path 圖形同步），
  觸控熱區隨元素幾何自然同步；`KEY_BASE_PX`（A76/B72）與 style.css 以單測
  跨檔守門防雙寫漂移。
- 操作列縮放列：縮小／放大步進 5%＋百分比顯示；即時預覽、儲存持久化、
  取消回滾；與拖曳位置共存（夾限以縮放後 offsetWidth 計算）。
- 觸控下限守門：最小縮放 80% 時最小鍵 57.6px ≥ 44px（單測）。

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
- schema 不動（鍵位布局 v2 零遷移，§89）：合法自訂資料在任何持向原樣適用；
  只有「無自訂／損毀回退」與「恢復預設」走旋轉感知預設。
- 直持下 A/B 幾何上與 joy-zone 重疊（裝置下半即遊戲左半）：keys-layer 為後繪
  兄弟層，按鍵天然承接命中；誤觸空白處僅錨定浮動搖桿（點按零位移，無害）。

### 95.2 儲存語意（配置頁）

- 預設態不落盤：從未自訂或按過「恢復預設」後儲存＝`sp-settings.keyLayout` 置 null
  （§118.1），直橫持各自動態解析預設；拖曳／縮放屬自訂，儲存持久化具體布局
  （維持 v14 單一共用布局語意）。

> **已廢止**（v19 起，語意等價）：v14–v18 的預設態不落盤實作為刪除 `sp-key-layout` 鍵。

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

## 102. v16 配置模式遮罩加深（F-04，補充 §34）

- 根因（Composer 席）：cfg-overlay 0.4 透明度下主選單文字仍清晰，與配置列
  形成「哪層可互動」的視覺競爭。
- 修法：遮罩加深至 0.62＋backdrop 輕模糊 2px——主選單退為背景；虛擬鍵與
  操作列（z 10/40）浮於遮罩（z 5）之上不受影響。

## 109. v19 星暴 2.0＋SP 情境鍵＋B 鍵收斂（#815，修 #812 輸入面；輸入層 SSOT）

外部評審 P0-3（B 鍵五語意超載）與 #812（星暴長按誤放清匣卡關）的根治：輸入仲裁
狀態機重寫。機制 brief §2–§3 落地；本節為現行輸入 SSOT，取代 §23 星暴長按行、
§40 滿匣讓位行與 §57 觸發面（各節已加取代標註）。

### 109.1 B 鍵最終語意（僅三項，`resolveActionPress`）

| 操作           | 條件         | 行為                                               |
| -------------- | ------------ | -------------------------------------------------- |
| 點按（<150ms） | 有彈藥       | 發射（後進先出；滿匣亦即按即射，不再 defer）       |
| 按住           | 頂槽非殼盾星 | 吸入                                               |
| 按住           | 頂槽殼盾星   | 舉盾（殼盾情境走延遲：放開 <150ms 結算為點按發射） |

**退場**：長按 0.8s 星暴、地面長按 0.6s 變身——全部移出 B 鍵（誤觸根因消滅）；
`advanceStarstormHold`/`starstormReady`/`starstormProgress`/`resolveTransformHold`
自 logic 層刪除。

### 109.2 SP 情境鍵（唯一新輸入面；`logic/starburst.ts`＋`controls.setSpMode`）

- 位置：右側 B 鍵「裝置空間上方」食指區 52px（48–56 帶內），恆由 B 鍵位置派生
  （`layout.spKeyPosition`，cw/ccw 旋轉殼換軸沿 §87 映射；不入自訂布局 schema，
  拖曳 B 鍵時跟隨）；僅「有技能可用」時淡入 150ms 浮現，無技能完全隱藏。
- 圖形：子 canvas 繪製（禁 emoji/文字鍵帽）——蓄能星暴＝金色大星；變身＝形態色
  圓徽（tint 取 `TRANSFORM_FORMS` SSOT）；變身中＝解除迴旋箭。浮現輕震一次
  （沿 §91 觸覺管線，尊重靜音偏好）。
- 語意（天然互斥，`resolveSpPress`；圖示即行為，`resolveSpMode` 同序）：
  1. 變身中 → 點按＝提前解除（優先序最高，圖示一致性）。
  2. 蓄能星存在 → 點按＝引爆星暴。
  3. 無蓄能星且變身資格成立（同系 ≥3、地面）→ 點按＝立即變身（0.6s 門檻廢除）。
- 鍵盤映射：`C`＝SP（`Z` 跳、`X` 吸/射不變）；§89 桌機鍵位卡與 Title 操作說明
  同步標示。

### 109.3 星暴 2.0——蓄能結晶＋手動引爆

- 彈匣擴為 5 槽（`STAR.maxAmmo`）；滿 5 槽瞬間**自動結晶**——彈匣清空、頭頂
  生成蓄能大星（金色自轉＋呼吸縮放＋微光暈，頭頂 22px 軌道，`systems/chargedStar`）；
  結晶後立即可繼續吸怪（anti-softlock：基礎星彈吸怪循環即時可用）。
- 不疊加：蓄能星存在時再滿匣不再結晶（HUD 滿匣金色脈動提示；彈匣維持滿可正常
  射擊/殼盾）。變身窗口＝同系 3–4 發按 SP；滿匣即選擇星暴線（L3 hint 明示一次）。
- 跨關持有／死亡清除／EX 進場清除：session 記憶（`systems/starburstDirector`，
  不動 save schema）；首次結晶浮字「星力結晶！按 SP 鍵引爆」（`starburstDirector.ts` 首次結晶浮字）、
  首次帶星過關 toast「蓄能星會跟你到下一關」（`starburstDirector.ts` 帶星過關 toast）各一次。已知行為（設計取捨）：detonating 相位過關
  （0.3s 蓄爆窄窗撞入門）不持有也不結算——引爆效果隨場景凍結靜默丟棄。
- 引爆：SP 點按 → 0.3s 蓄爆（`STARSTORM.chargeMs`，不可取消）→ 清場全小怪＋
  魔王 12 傷＋5s 無敵窗（沿 §64.2 取 max 不疊加）＋既有震屏白閃星雨呈現。
- 事件契約：新增 `STARBURST_CHANGED { phase }`（producer player；consumer
  starburstDirector/e2e）；`SKILL_STARSTORM` 世界結算管線不變。
- 驗收（§108 探針改口徑；序列化單跑官方真值）：引爆需顯式 SP 點按（e2e 守 B 長按
  不觸發）；引爆後零彈恢復全 15 走動關 90 樣本 pooled p95 8.85s ≤10s（T2 交付基線
  9.5s，無回退且略優）、45s 未恢復=0；最難尾 L14 同樣本量 22.6s→12.2s 顯著改善。
- 平衡 A/B 對照（審查收斂輪；main@977968280 vs v19 HEAD，cap 420s、序列化，
  L6 mid 各 6 樣本、其餘各 3；JSON 留檔 `level-audits/ab-*`）：
  L2 mid 33%→100%（122.8→94.3s）、L2 high 雙 100%；L6 mid 雙 67%（通關均時
  194→317s，見下方觀察項）、L6 high 0%→33%（基線既有困難，v19 略優）；
  L12 魔王 mid/high 雙 100%（TTK 11.1→10.6s／18.8→17.4s）。裁定：短 cap
  （120–300s）×runs 2 的 L6 clearRate=0 量測為口徑假陽性——base 通關樣本均時
  194s、v19 317s，短 cap 會把兩者都截成 0%；clearRate、ammoZero 峰（17.2 vs
  16.8s）與飢荒峰皆同水準，「5 槽惡化火力節奏」不成立，無回歸。
  觀察項（非門檻）：L6 mid 通關均時 +123s 偏移——bot 滿匣結晶後引爆時機非最優
  所致，人類玩家可自主擇時；列 T4 教學矩陣觀察清單，門檻指標全數持平不調參。
