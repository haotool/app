# 048 星噗噗：彈匣／變身／星爆三角關係重設計

## 文件控制

| 欄位     | 內容                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| 文件性質 | 設計提案＋實作紀錄                                                                 |
| 狀態     | P1/P2/P4/P5 已實作；P3 未採納                                                      |
| 建立日期 | 2026-07-29                                                                         |
| 上位文件 | `GAME_DESIGN` §23／§57／§109／§119／§124                                           |
| 影響模組 | `logic/skills.ts`、`logic/starburst.ts`、`logic/transform.ts`、`systems/player.ts` |
| 驗收掛鉤 | `level-audit` 勝率門檻（`AUDIT_THRESHOLDS.clearRateMinMid/High`）                  |

## 1. 問題陳述

玩家回報三件事，經程式碼驗證**全部成立**，且三者同源：

1. 變身「不能攻擊，只是變成無敵」
2. 彈匣滿了之後新吸的星無法有意義地替補
3. 星爆與變身無法自由選擇，更無法並存

根因是**彈匣是三個系統的共用資源，但三者對它的所有權是互斥的**：射擊消耗它、變身清空它、結晶沒收它。沒有任何一條路徑允許共享。

## 2. 現況（已驗證，附程式碼位置）

### 2.1 變身會清空整個彈匣

`systems/player.ts:494` `beginTransform()`：

```ts
transform = startTransform(form);
magazine = []; // ← 無條件清空
```

`eligibleForm`（`logic/transform.ts:424`）要求彈匣**全數同味**、非金非混，且 `Σ(charged ? 2 : 1) ≥ 3`。也就是說變身門檻是 3 星，但**代價是全部 5 槽**——多存的星純屬浪費。

### 2.2 變身期間無法射星

`systems/player.ts:776`：

```ts
} else if (!transform.form) {
  const command = resolveActionPress({ ... });
  if (command === 'fire') fireStar();
}
```

B 鍵在變身期間被形態技完全接管，`fireStar()` 不可達。加上 2.1 的清空，變身中**沒有任何星彈輸出**。

### 2.3 引力化的攻擊面確實薄弱

`logic/transform.ts` `TRANSFORM_FORMS.gravity` 與 `GRAVITY_WELL`：

| 欄位                | 值             | 評價                 |
| ------------------- | -------------- | -------------------- |
| `contactDamage`     | 0              | 碰撞零傷（雷化為 2） |
| `shot`              | `null`         | 無遠程攻擊彈         |
| `tapStrike`         | `gravity-well` | 唯一輸出手段         |
| `moveSpeedMul`      | 0.9            | 變慢                 |
| `tuckCharges`       | 3              | 防禦強               |
| `gravityFlipImmune` | true           | 免疫重力切換         |

`GRAVITY_WELL`：半徑 130px、offset 120px、`damage: 2`、`ticks: 6`、`tickMs: 200`、CD 1200ms。

**兩項更正**（本文 v0.1 兩處都寫錯，實測後更正）：

1. 曾記為「2 傷 × 6 跳 = 12 傷」——**錯**。滯留 6 跳原本**只牽引不造成傷害**，全招總傷僅初爆 2，即 1.67 DPS。
2. 更根本的病灶：`resolveGravityWell` **只遍歷 `hooks.enemies()` 群組，從未觸及魔王本體**——引力化對魔王的傷害是 **0**，不是「條件苛刻」。潮化 `resolveTidePull` 同源病灶。

也就是說 L24 宣告 `tide-form`、L28 宣告 `gravity-form` 為該關優勢解，而那個優勢解**打不到它要對付的魔王**，橫跨兩個章節版本未被發現。

**為什麼既有驗收抓不到**：通關率量測依賴 bot 通關，而 `BOT_TIERS.high` 標記 `transformUse: false`（bot 從不變身），`--transform` 的變身數據又走 `sp.grantStar()` 注入路徑。宣告與實作之間沒有任何守門。

**對照**：直接射 5 顆迴旋星 = 25 傷，`boomerang: true` 雙判定可達 50 傷，且是安全距離輸出。

結論：**玩家「變身只是無敵」的感受完全正確**，且比感受更嚴重——不是輸出低，是輸出不存在。

### 2.4 星爆與變身是雙層互斥

**資源層**——`logic/starburst.ts:22`：

```ts
export function shouldCrystallize(ammo: number, phase: StarburstPhase): boolean {
  return ammo >= STAR.maxAmmo && phase === 'none';
}
```

彈匣滿 5 槽**自動**結晶：清空彈匣、頭頂生成蓄能星。彈匣一空，`eligibleForm` 立刻回 `null`——變身資格被結晶消滅。

**操作層**——`logic/starburst.ts:54` `resolveSpPress`：

```ts
if (opts.transformActive) return 'dismiss';
if (opts.phase === 'charged') return 'detonate'; // ← 蓋掉 transform
if (opts.phase === 'detonating') return 'none';
return opts.eligible && !opts.airborne ? 'transform' : 'none';
```

蓄能星存在時 SP 恆為引爆，變身分支不可達。`resolveSpMode`（HUD）同一優先序，所以**連「可以變身」的圖示都不會顯示**。

原始設計註解自承這是刻意的：

> 正常流程兩態不共存（變身起手要求無蓄能星、變身中吸入停用不結晶），僅彩蛋滿彈匣可造出重疊

### 2.5 滿匣吸入是嚴格降級

`logic/skills.ts:29` `swallowIntoMagazine`：

```ts
const top = magazine[magazine.length - 1];
if (top && !top.charged && !top.gold && top.mix === undefined) {
  // 同味 → 強化；有配方 → 合成
}
const slot = { flavor: kind, charged: false, gold: false };
if (magazine.length >= STAR.maxAmmo) {
  return [...magazine.slice(0, -1), slot]; // ← 覆蓋頂槽
}
```

第一個 `if` 的守衛使**頂槽若已是強化／金／合成星，升級邏輯整段跳過**，然後滿匣分支把它覆蓋成一顆普通星。

彈匣是 LIFO（`popTopSlot` 取最後一個），頂槽即下一發。因此**被犧牲的永遠是價值最高的那一發**。

蓄能星存在時 `shouldCrystallize` 回 `false`，彈匣停在 5 槽不再結晶——此時每一次吸入都在執行這個降級路徑。這正是玩家說的「星星在頭上時滿了就不補」。

## 3. 設計提案

### P1：變身改為「消耗」而非「清空」

`beginTransform` 只扣除達標所需星數（`TRANSFORM.requiredStars = 3`，強化槽計 2），保留其餘槽位。

- 3 顆普通星變身 → 彈匣歸零（與現況同）
- 5 顆普通星變身 → 保留 2 顆
- `[強化, 強化, 普通]`（=5）變身 → 扣 3，保留剩餘

**理由**：現況「門檻 3、代價 5」使玩家沒有理由在達標後繼續囤星，反而鼓勵一湊滿就立刻變身，壓縮策略空間。

### P2：變身期間可射星

B 點按恢復 `fireStar()`，形態技改綁 **B 長按**（沿 `prism` 既有的 `actionHoldMs` 分流模式，玩家已學過此語彙）。

搭配 P1，變身期間有雙輸出線：安全距離射星 + 貼身形態技。這直接解決「變身只是無敵」。

**風險**：`shell` 的滾殼衝撞、`volt` 的鏈電束目前都是 B 點按，改長按會動到既有手感。需逐形態評估，或僅對「無 `shot` 的形態」（tide／gravity）套用。

### P3：結晶改為玩家觸發

`shouldCrystallize` 不再自動執行。滿匣時 HUD 顯示「可結晶」提示，由玩家決定。

這是**讓兩者並存的關鍵**：玩家可以先變身（P1 消耗 3 顆），剩下的繼續累積，滿了再自行結晶。

**風險**：「滿匣即結晶」是 §109 的既有教學點，改動需同步教學關文案與 `starburstDirector` 的跨關持有邏輯。

### P4：SP 鍵長按分流

```
點按 = 引爆蓄能星（若存在）
長按 250ms = 變身（若資格成立）
變身中點按 = 解除
```

`resolveSpPress` 從「優先序」改為「意圖分流」，並新增 `held: boolean` 參數。`resolveSpMode` 對應改為可回傳雙圖示。

**這是純邏輯層改動**，`starburst.test.ts` 補 case 即可鎖住。

### P5：滿匣依品質替換

`swallowIntoMagazine` 滿匣分支改為：

1. 計算新星與各既有槽的價值（建議排序：`gold` > `charged+mix` > `mix` > `charged` > `plain`，同級比 `starDamage`）
2. 找出**最低價值槽**
3. 新星價值較高 → 替換該槽；較低或相等 → 不入匣（仍發 `ENEMY_INHALED` 事件與音效回饋，避免「吸不進去」的困惑）

**這條可獨立實作**，不依賴 P1–P4，且是三者中唯一無爭議的缺陷修復——沒有任何設計意圖能解釋為什麼吸一隻雜魚要消滅一顆強化星。

## 4. 實作結果

| 提案               | 狀態          | 落點                                                              |
| ------------------ | ------------- | ----------------------------------------------------------------- |
| P5 滿匣品質替換    | ✅ 已實作     | `logic/skills.ts` `slotValue` ＋滿匣裁決                          |
| P4 SP 長按分流     | ✅ 已實作     | `logic/starburst.ts` `resolveSpPress(held)`、`resolveSpSecondary` |
| P1 變身改消耗      | ✅ 已實作     | `logic/transform.ts` `consumeForTransform`                        |
| P2 變身中射星      | ✅ 已實作     | `systems/player.ts` B 點按射星／長按形態技                        |
| P3 結晶改觸發      | ❌ **未採納** | 使用者裁決：滿 5 顆維持自動結晶，語彙不變                         |
| — 形態技對魔王零傷 | ✅ 已修       | `systems/starCombat.ts` 補 `damageBossAt`（tide/gravity）         |
| — 引力井滯留只牽引 | ✅ 已修       | 逐跳結算，全招 2×(1+6)=14 傷                                      |

**P3 未採納的影響**：兩態並存改由 P4 單獨達成——結晶仍會清空彈匣，但玩家可在結晶後重新湊齊同系 ≥3，此時 SP 長按即可變身（修前恆被 `detonate` 蓋掉）。

### 共用件

- `logic/holdArbiter.ts`（新增）：點按／長按意圖仲裁，SP 與變身期 B 共用。
  設計要點是**只在有歧義時延遲**——點按與長按語意相同時維持按下緣即時結算，
  不為少數重疊情境賠上全域手感。
- `systems/formSkills.ts` `resolveFormSkill`：七形態分派抽為純裁決（回傳效果描述子，
  副作用仍由 player 施行），同時解 `player.ts` 的 1200 行閘。
- `systems/fx.ts` `heroLandingRing`：落地塵環抽出（純視覺）。

## 5. 驗收要求

任一提案實作後**必須**重跑 `level-audit` 勝率門檻：

```bash
node scripts/level-audit.mjs <levelId> --bot mid  --runs 5   # 門檻 ≥40%
node scripts/level-audit.mjs <levelId> --bot high --runs 5   # 門檻 ≥80%
```

受影響最大：四個形態引入關（L21/L23/L25/L27）與四個形態驗收魔王關（L22/L24/L26/L28）。

**本批尚未完成勝率驗收**——見 §6 的工具限制。

## 6. 量測工具：從「全自動通關」轉向「分項機制探針」

### 6.1 為什麼放棄用通關率驗收機制

嘗試讓 high bot 以真實吸食湊星變身（取代 `sp.grantStar()` 注入）**失敗並已回退**。
移除注入後獵食未能成功，bot 全程零彈藥、零射擊、魔王血量從未下降——比修改前更差。

更根本的問題：要 bot「像專精玩家一樣打」等於寫一個會玩遊戲的 agent。現行
`audit-driver.mjs` 是千行規則堆疊，`BOT_TIERS.high` 的註解本身即記載過失敗
（規則 bot 的變身迴圈吞掉全部星彈輸出，L4 最深僅 77/90）。在 if/else 上加第
11 條分支不會收斂。

### 6.2 分項探針（採用路線）

新增 `--probe formstrike`（`lib/audit-probes.mjs`）：不要求 bot 會玩，只問單一
機制是否可用——**關卡宣告的優勢形態，其招牌技是否確實打得到該關魔王**。

|                  | 通關率量測           | 分項探針 |
| ---------------- | -------------------- | -------- |
| 形態技零傷害病灶 | 抓不到（bot 不變身） | 一次抓到 |
| 需要 bot 會玩    | 是                   | 否       |
| 單次耗時         | ~50 分鐘             | ~2 分鐘  |
| 結果可歸因       | 難（死因混雜）       | 明確     |

L28 gravity 實測：`reachable: true`（修前必為 false，因為對魔王恆 0 傷）。

### 6.3 探針目前只能回答二元問題

同一份程式碼、8 trials，三次執行得到 hitRate `0.5 / 0.125 / 0.25`。**樣本數不足以
支撐平衡結論**。曾據此判定「井心追隨修法更差」並回退——該判定是過度解讀噪音，
回退理由應記為「無證據顯示更好，且增加複雜度」而非「數據證明更差」。

變異來源研判為施放當下的魔王 FSM 階段與位置未受控（Gravion 在 gswitch/orbit/
crush 的位移模式差異極大）。要用於平衡調校需先：提高 trials（30+）並回報信賴
區間，或在施放前鎖定魔王階段。

### 6.4 其餘既有缺口

1. **`--transform` 仍走注入**：`sp.grantStar()` ×3，刻意排除湊星隨機性以做 TTK
   A/B。湊星成本改由 `--probe transform` 量測（本批已解禁魔王關：L28 p50 31.4s
   ／p95 34.6s／2-of-4 逾時，對照走動關 L27 的 7.4s／16.3s／0 逾時）。
2. **`BOT_TIERS.high` `transformUse: false`**：bot 不會判斷何時該變身，其變身數據
   不能代表人類玩家。
3. **`用時 s` 欄位不可信**：`elapsedSec` 取自頁面內 driver 計數器，隨場景重建重置，
   非 wall-clock；逾時局此欄無意義。
4. **預設報告檔名會撞名**：未指定 `--label` 時為 `l<id>-<tier>`，同參數併發會互相
   覆寫且靜默。併發還會因搶 CPU 污染反應時間敏感的量測——**`level-audit` 必須
   序列執行**（本次實際踩過：兩個 run 併發使整批數據作廢）。

### 6.5 附帶新增

- `audit-session.mjs`：`SP_AUDIT_HEADED=1` 開視窗觀看、`SP_AUDIT_VIDEO=<dir>` 錄影。
- `TRANSFORM_ADVANTAGE` 型別自字面聯合改為 SSOT 型別（`TransformForm`/`StarFlavor`）
  ——原型別只容三舊形態，使 §119 四新形態想登記也登記不進來，型別本身即缺口成因。
  已補 gravion 條目；L22/L24/L26 仍缺，由 `difficulty.test.ts` 的守門釘為已知債。

## 修訂紀錄

| 日期       | 版本 | 變更                                                                                   |
| ---------- | ---- | -------------------------------------------------------------------------------------- |
| 2026-07-29 | v0.1 | 初稿：三問題根因驗證與 P1–P5 提案                                                      |
| 2026-07-30 | v0.2 | 實作 P1/P2/P4/P5（P3 未採納）；更正 §2.3 兩處錯誤；量測路線改分項探針；新增 formstrike |
