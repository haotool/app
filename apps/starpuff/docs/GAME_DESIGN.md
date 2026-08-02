# 星噗噗 StarPuff — 遊戲設計 SPEC（索引）

> 手機優先 PWA 動作小遊戲。穿越層層果凍關卡、吸入果凍怪、化為星彈、擊敗果凍魔王。
> 路由：`https://app.haotool.org/starpuff/`

本檔是**設計 SSOT 的入口索引**，不含規格內容。規格依主題拆在 [`design/`](design/) 下，
每檔開頭都有「職責範圍／不在本檔」聲明，照著找即可。

## 怎麼用這份文件

- **要查某個機制怎麼設計** → 先看下方「主題檔一覽」挑檔，再用檔內目錄找章節。
- **手上有章號**（程式註解常見 `// …（GAME_DESIGN §62）`）→ 用下方「章號對照表」查它在哪一檔。
- **不確定某段還算不算數** → 看 [`design/99-superseded.md`](design/99-superseded.md)
  的取代對照表，它逐條列出被取代的敘述與現行規則位置。
- **要玩／要驗收** → 全 30 關實測攻略見 [`WALKTHROUGH.md`](WALKTHROUGH.md)。

### 主句紀律（MUST）

各主題檔中**每一句主文都是現行有效規則**；被取代的舊規則一律降級為緊接其後的
`> **已廢止**（<版本> 起，現行見 §<章號>）：<舊敘述>` 附註。所以你可以放心直接讀主句，
不必擔心括號裡藏著「其實這條已經改了」。全量對照見
[`design/99-superseded.md`](design/99-superseded.md)。

### 章號紀律（MUST）

章號 §N 是全專案穩定識別碼——`src/**` 程式註解、測試 describe 名稱與 issue 都直接引用。
因此**主題拆檔不重新編號、不回收號碼**，新章一律接續遞增；跨檔引用一律只寫 §N，
不寫檔名路徑，避免日後再搬檔時全域失效。

## 主題檔一覽

| 檔案                                                  | 這裡放什麼                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`00-foundations.md`](design/00-foundations.md)       | 產品定位、場景流程、技術架構與事件契約、品質門檻、版本號、跨系統架構級契約     |
| [`01-controls-input.md`](design/01-controls-input.md) | 搖桿與 A/B/SP 鍵語意、輸入矩陣、觸控判定、移動手感、旋轉殼、虛擬鍵布局與配置頁 |
| [`02-combat-star.md`](design/02-combat-star.md)       | 戰鬥數值、九系星味與混合星、殼盾與雷鏈、星化三形態與教學矩陣                   |
| [`03-enemies-bosses.md`](design/03-enemies-bosses.md) | 主角與小怪 FSM、精英系統、十座魔王階段與招式、EX 變體與 P4 第二血條            |
| [`04-levels-world.md`](design/04-levels-world.md)     | 30 關資料與節奏、十區分頁世界地圖、彩蛋、平台與環境機制、魔王關前室與增益      |
| [`05-save-settings.md`](design/05-save-settings.md)   | 存檔 schema 與備援、重置語意、成就系統、使用者偏好 SSOT 與設定頁、PWA 更新閘   |
| [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     | 主選單與圖鑑分頁、暫停系統、HUD 命中層、結算動線、殼層卡片、PWA 安裝指引       |
| [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     | 美術資產批次與風格關鍵詞、背景視差與裝飾密度、Juice 清單、zzfx 音效表          |
| [`08-safety-nets.md`](design/08-safety-nets.md)       | 反卡死保證律、慈悲補血 pity 保底、供給可及性、難度量化 CLI 與分級 bot 口徑     |
| [`99-superseded.md`](design/99-superseded.md)         | 取代對照表（權威索引）、版本列車沿革、已完全失效的搬遷內容                     |

## 硬不變式（使用者明令，跨檔恆成立）

- **基礎星彈恆可通關**：混合星、變身、增益、精英與彩蛋全部是加成路徑，永不為破關必需。
- **魔王關須有多種可行破關策略**（每王 ≥3 條，見 §58）。
- **難度循序漸進，永不無限卡關**：關卡難度以分級 bot 勝率量化驗收（普通＝mid bot ≥40%、熟練＝high bot ≥80%，最小樣本 ×5）。門檻 SSOT＝`logic/difficulty.ts` 的 `AUDIT_THRESHOLDS.clearRateMin*`，由 `scripts/level-audit.mjs` 非零退出強制執行（#890）；EX 模式語意不同，走 `exLowPassMaxRate`／`exHighPassMinRate`。
- **telegraph 可讀性紅線（分層契約，#890）**：**魔王招式 ≥600ms**、**小怪 ≥500ms**。小怪較短是刻意設計——威脅較低、節奏較快，全面拉到 600ms 會顯著拖慢戰鬥手感。EX 差分只縮體不縮窗。明列例外：Prismix 折射光束 500ms，補償機制為全寬預示線精確標示光束 Y 位置（§68）。
- **全遊戲禁 emoji 與文字鍵帽**；按鍵一律 canvas／CSS 繪製圖形。

## 章號對照表

| 章號 | 標題                                                                                 | 檔案                                                  |
| ---- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| §1   | 產品定位                                                                             | [`00-foundations.md`](design/00-foundations.md)       |
| §2   | 核心循環                                                                             | [`00-foundations.md`](design/00-foundations.md)       |
| §3   | 場景流程                                                                             | [`00-foundations.md`](design/00-foundations.md)       |
| §4   | 操作（行動裝置優先）                                                                 | [`01-controls-input.md`](design/01-controls-input.md) |
| §5   | 角色設定（全部原創）                                                                 | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §6   | 魔王 AI（有限狀態機，pure TS 可測）                                                  | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §7   | 戰鬥數值                                                                             | [`02-combat-star.md`](design/02-combat-star.md)       |
| §8   | Juice 清單（品質關鍵，全數必做）                                                     | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §9   | 音效（zzfx，零音檔資產）                                                             | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §10  | 美術資產規格（codex imagegen 專用；除此之外嚴禁動用 codex）                          | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §11  | 技術架構                                                                             | [`00-foundations.md`](design/00-foundations.md)       |
| §12  | 品質門檻                                                                             | [`00-foundations.md`](design/00-foundations.md)       |
| §13  | 安全與合規                                                                           | [`00-foundations.md`](design/00-foundations.md)       |
| §14  | 效能與範圍紀律                                                                       | [`00-foundations.md`](design/00-foundations.md)       |
| §15  | 關卡系統（levels.ts 為 SSOT，pure TS 可測）                                          | [`04-levels-world.md`](design/04-levels-world.md)     |
| §16  | 新怪物 ×2（多樣性；全原創）                                                          | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §17  | 魔王關演出強化（動畫品質關鍵）                                                       | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §18  | 動畫流暢度打磨清單（全實體）                                                         | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §19  | v2 美術資產增補（codex 專用；生成尺寸同 §10 規範）                                   | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §20  | 技能系統：吞噬賦星（v2.1，PM 親撰）                                                  | [`02-combat-star.md`](design/02-combat-star.md)       |
| §21  | v3 橫式轉向（PM 親撰）                                                               | [`01-controls-input.md`](design/01-controls-input.md) |
| §22  | iOS 觸控直通（研究回寫後定稿）                                                       | [`01-controls-input.md`](design/01-controls-input.md) |
| §23  | 技能組合 v3：吞噬連鎖（表驅動，logic/skills.ts）                                     | [`02-combat-star.md`](design/02-combat-star.md)       |
| §24  | 關卡彩蛋（data-driven：levels.ts easterEggs[]）                                      | [`04-levels-world.md`](design/04-levels-world.md)     |
| §25  | 背景連續感與視覺升級                                                                 | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §26  | 反卡死保證（softlock 防護，全部 MUST）                                               | [`08-safety-nets.md`](design/08-safety-nets.md)       |
| §27  | v3 美術資產（codex 專用；橫向平鋪）                                                  | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §28  | v4 免轉向橫式與響應寬幅（PM 親撰）                                                   | [`01-controls-input.md`](design/01-controls-input.md) |
| §29  | v4 平台玩法元素包（調研回寫後定案數值）                                              | [`04-levels-world.md`](design/04-levels-world.md)     |
| §30  | v4 內容擴充：新技能、新怪物、魔王 P3（PM 親撰）                                      | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §31  | v4 美術資產（codex 專用）                                                            | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §32  | 場景裝飾密度規範                                                                     | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §33  | v5 iOS PWA UX 調研回寫（2026-07-15 定稿）                                            | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §34  | v5 控制布局重設計與按鈕自訂                                                          | [`01-controls-input.md`](design/01-controls-input.md) |
| §35  | v5 暫停系統與離頁自動暫停                                                            | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §36  | v5 開場主選單與圖鑑/技能介紹                                                         | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §37  | v5 全元素位置稽核                                                                    | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §38  | 存檔系統（core/save.ts 為 SSOT，pure TS 可測）                                       | [`05-save-settings.md`](design/05-save-settings.md)   |
| §39  | 迷霧世界地圖（MapScene，data-driven 自 LEVELS）                                      | [`04-levels-world.md`](design/04-levels-world.md)     |
| §40  | v6 新技能：殼盾與雷鏈（PM 原創，補防禦與群戰原型）                                   | [`02-combat-star.md`](design/02-combat-star.md)       |
| §41  | v6 移動手感打磨（logic/movement.ts，pure TS 可測）                                   | [`01-controls-input.md`](design/01-controls-input.md) |
| §42  | 版本號顯示                                                                           | [`00-foundations.md`](design/00-foundations.md)       |
| §43  | 每關攻略 PoC 與反卡關驗證                                                            | [`04-levels-world.md`](design/04-levels-world.md)     |
| §44  | v7 下衝擊觸發改制與跳躍鍵輸入矩陣（PM 親撰，取代 §23 下+B 觸發）                     | [`01-controls-input.md`](design/01-controls-input.md) |
| §45  | v7 走動手感根修與抖動歸因（logic/walkFeel.ts，pure TS 可測）                         | [`01-controls-input.md`](design/01-controls-input.md) |
| §46  | v7 雙味混合星彈（config STAR_MIXES 為 SSOT，表驅動）                                 | [`02-combat-star.md`](design/02-combat-star.md)       |
| §47  | v7 新怪物 ×2（全原創；素材 codex imagegen 僅此 2 張，風格與既有嚴格一致）            | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §48  | v7 中魔王精英系統（levels.ts elite 為 SSOT，零新美術）                               | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §49  | v7 每關攻略 PoC 與節奏補訂（引入→練習→考驗→獎勵）                                    | [`04-levels-world.md`](design/04-levels-world.md)     |
| §50  | v8 關卡 4→7 與雙魔王總覽（levels.ts 資料驅動擴充）                                   | [`04-levels-world.md`](design/04-levels-world.md)     |
| §51  | v8 上升氣流機制（logic/updraft.ts，pure TS 可測）                                    | [`04-levels-world.md`](design/04-levels-world.md)     |
| §52  | v8 新怪物 ×3 與雙精英（FSM-first；素材 §55）                                         | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §53  | v8 星彈九系與新混合三式（config 表驅動擴充）                                         | [`02-combat-star.md`](design/02-combat-star.md)       |
| §54  | v8 第二魔王：暗月蝠王 Noctra（logic/noctraFsm.ts 表驅動，空中型）                    | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §55  | v8 美術資產（codex imagegen 專用；配額 6/6 用滿）                                    | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §56  | v8 每關攻略 PoC 與 anti-softlock 不變式                                              | [`04-levels-world.md`](design/04-levels-world.md)     |
| §57  | v9 星化變身系統（logic/transform.ts 純狀態機，表驅動）                               | [`02-combat-star.md`](design/02-combat-star.md)       |
| §58  | v9 魔王攻略多樣化與 EX 變體（表驅動擴充，禁止散落 scene）                            | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §59  | v9 新怪物 ×2（FSM-first 進 enemyFsm，均歸既有味系）                                  | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §60  | v9 關卡 7→9 與世界地圖（levels.ts 資料驅動擴充）                                     | [`04-levels-world.md`](design/04-levels-world.md)     |
| §61  | v9 美術資產（codex imagegen 專用；配額 5/5）                                         | [`07-art-audio-fx.md`](design/07-art-audio-fx.md)     |
| §62  | v9 慈悲補血愛心（logic/mercyHeal.ts 純決策，保底機制非資源農場）                     | [`08-safety-nets.md`](design/08-safety-nets.md)       |
| §63  | v9 Noctra 難度根修（實測席稽核回寫；bot 勝率門檻收斂定案）                           | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §64  | v9.1 熱修：Noctra 返空連續飛行與星暴無敵窗（P0）                                     | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §65  | v10 關卡 9→12 與世界地圖（levels.ts 資料驅動擴充）                                   | [`04-levels-world.md`](design/04-levels-world.md)     |
| §66  | v10 星門折躍（logic/warp.ts，pure TS 可測）                                          | [`04-levels-world.md`](design/04-levels-world.md)     |
| §67  | v10 卡點關中點重生（LevelSpec.checkpointX，§4 主計畫卡點緩解）                       | [`04-levels-world.md`](design/04-levels-world.md)     |
| §68  | v10 第三魔王：稜晶雙子 Prismix（logic/prismixFsm.ts 表驅動，分裂型）                 | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §69  | v10 魔王關特殊體系（前室／短期增益／L12 首發；L4/L7 回補延 v11+）                    | [`04-levels-world.md`](design/04-levels-world.md)     |
| §70  | v10 魔王關專屬彩蛋與每關驗證                                                         | [`04-levels-world.md`](design/04-levels-world.md)     |
| §71  | v11 糖漿潮汐（logic/tide.ts，pure TS 可測）                                          | [`04-levels-world.md`](design/04-levels-world.md)     |
| §72  | v11 熱泉噴口（updraft 週期參數化，零新 element kind）                                | [`04-levels-world.md`](design/04-levels-world.md)     |
| §73  | v11 新怪物 ×2（FSM-first 進 enemyFsm；零新星味裁決延續 §8 主計畫）                   | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §74  | v11 第四魔王：Syrona 熔糖窯后（logic/syronaFsm.ts 表驅動，場控型）                   | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §75  | v11 魔王關專屬彩蛋與每關驗證                                                         | [`04-levels-world.md`](design/04-levels-world.md)     |
| §76  | v11 關卡 12→16 與世界地圖（levels.ts 資料驅動擴充）                                  | [`04-levels-world.md`](design/04-levels-world.md)     |
| §77  | v11.1 熱修：下跳穿落根修、蹲姿指示與吸入豁免                                         | [`01-controls-input.md`](design/01-controls-input.md) |
| §78  | v12 分區分頁世界地圖（logic/zones.ts＋MapScene，主計畫 §2.2 硬項落地）               | [`04-levels-world.md`](design/04-levels-world.md)     |
| §79  | v12 流星雨（logic/meteor.ts＋systems/meteor.ts，pure TS 可測）                       | [`04-levels-world.md`](design/04-levels-world.md)     |
| §80  | v12 新怪物 ×2（FSM-first 進 enemyFsm；零新星味裁決延續 §8 主計畫）                   | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §81  | v12 低重力（LevelSpec.gravityScale，零新 element kind）                              | [`04-levels-world.md`](design/04-levels-world.md)     |
| §82  | v12 最終魔王：蝕星魔核 Voidra（logic/voidraFsm.ts 表驅動，場控收束型）               | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §83  | v12 魔王關專屬彩蛋與每關驗證                                                         | [`04-levels-world.md`](design/04-levels-world.md)     |
| §84  | v12 關卡 16→20 與全線收尾（levels.ts 資料驅動擴充）                                  | [`04-levels-world.md`](design/04-levels-world.md)     |
| §85  | v12.1 熱修：真實觸控下滑判定重修（補訂 §21/§23/§77）                                 | [`01-controls-input.md`](design/01-controls-input.md) |
| §86  | v13 EX 全魔王與星核制霸（EX 體系收尾＋全制霸獎勵）                                   | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §87  | v14 直持預設旋轉方向翻轉（取代 §28 預設方向）                                        | [`01-controls-input.md`](design/01-controls-input.md) |
| §88  | v14 按鈕配置頁操作列直欄化與標籤單行（取代 §34 操作列）                              | [`01-controls-input.md`](design/01-controls-input.md) |
| §89  | v14 虛擬鍵大小自訂（sp-key-layout schema v2）                                        | [`01-controls-input.md`](design/01-controls-input.md) |
| §90  | v14 PWA 安裝偵測與分平台指引                                                         | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §91  | v14 觸覺回饋與螢幕常亮（調研加碼，ROI 閘通過二項）                                   | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §92  | v14 殼層卡片基建（shellCards.ts）                                                    | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §93  | v14 殼局部 safe-area 量測（canvas 內 HUD 避讓預備）                                  | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §94  | v15 成就系統（logic/achievements.ts，純呈現層聚合）                                  | [`05-save-settings.md`](design/05-save-settings.md)   |
| §95  | v16 直持預設鍵位重錨（D1，取代 §34 預設在直持殼的適用性）                            | [`01-controls-input.md`](design/01-controls-input.md) |
| §96  | v16 圖鑑分頁有界網格（P1-01，取代 §36 技能雙欄與 §94.3 成就網格常數）                | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §97  | v16 區／關命名層級標示（F-01 裁決）                                                  | [`04-levels-world.md`](design/04-levels-world.md)     |
| §98  | v16 選單 DOM 鈕命中短邊保底（D2，補充 §33 條目 7）                                   | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §99  | v16 版本頁腳 SHA 來源修正（F-02，補充 §42）                                          | [`00-foundations.md`](design/00-foundations.md)       |
| §100 | v16 勝利結算「下一關」主 CTA（D3，取代 §39 勝利回地圖單一動線）                      | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §101 | v16 HUD 暫停/靜音 DOM 化（F-06＋D4，取代 §35 暫停鍵與修復包 B 靜音鈕的命中層）       | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §102 | v16 配置模式遮罩加深（F-04，補充 §34）                                               | [`01-controls-input.md`](design/01-controls-input.md) |
| §103 | v16 標題字形品牌化（D6，補充 §36）                                                   | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §104 | v16 怪物圖鑑分頁（F-03，取代 §76 單頁定案）                                          | [`06-ui-shell-pwa.md`](design/06-ui-shell-pwa.md)     |
| §105 | v16 前期節奏保守調參（D5＋F-05，補充 §15 教學關與 §48 精英房）                       | [`04-levels-world.md`](design/04-levels-world.md)     |
| §106 | GameScene strangler 拆解與守門（三席維護性 5/7/8 收斂）                              | [`00-foundations.md`](design/00-foundations.md)       |
| §107 | 走動關供給保證與滿潮平衡（issue #804/#805/#806）                                     | [`08-safety-nets.md`](design/08-safety-nets.md)       |
| §108 | 難度量化工具（#818，T1 量測基礎設施）                                                | [`08-safety-nets.md`](design/08-safety-nets.md)       |
| §109 | v19 星暴 2.0＋SP 情境鍵＋B 鍵收斂（#815，修 #812 輸入面；輸入層 SSOT）               | [`01-controls-input.md`](design/01-controls-input.md) |
| §110 | v20 變身系統 2.0——三形態加深＋教學矩陣（#816；T4 列車）                              | [`02-combat-star.md`](design/02-combat-star.md)       |
| §111 | v21 魔王主題化 W1——加權選招＋Jellord/Noctra 主題招式（#813；T5 列車）                | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §112 | v22 魔王主題化 W2——Prismix/Syrona 加權選招與主題招式（#813；T5 列車）                | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §113 | v23 魔王主題化 W3——Voidra 加權選招與星光虹吸（#813；T5 列車）                        | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §114 | v24 EX 全面重設計 W1——Prismix P4 裂核殘響（#814；T6 列車）                           | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §115 | v24 EX 全面重設計 W2——Syrona 窯心暴走＋Voidra 內核裸奔（#814；T6 列車）              | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §116 | v24 EX 全面重設計 W3——Jellord 果凍狂潮＋Noctra 月相雙血條＋皇冠共鳴（#814；T6 收斂） | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §117 | 物理/視覺縮放解耦 visualScale（#819 子項 3；T7-B 列車）                              | [`00-foundations.md`](design/00-foundations.md)       |
| §118 | 使用者設定 SSOT、存檔備援與 PWA 更新閘（#819；T7-A 列車）                            | [`05-save-settings.md`](design/05-save-settings.md)   |
| §119 | 星海終局篇四新變身（W1；#886）                                                       | [`02-combat-star.md`](design/02-combat-star.md)       |
| §120 | 星海終局篇六新小怪（W1；#886）                                                       | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §121 | 星海終局篇 L21/L23 走動關與進程（W1；#886）                                          | [`04-levels-world.md`](design/04-levels-world.md)     |
| §122 | 星海終局篇雙魔王：Tariffang 關稅巨獸（L22）與 Maridella 潮汐女王（L24）（W2；#886）  | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §123 | 星海終局篇 W3：鏡界引力七新小怪與 Reflector／Gravion 雙魔王（W3；#886）              | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §124 | 星海終局篇 L25/L27 走動關與 L26/L28 魔王關（W3；#886）                               | [`04-levels-world.md`](design/04-levels-world.md)     |
| §125 | 四王動畫演出接關 bossStagecraft（W5；#857 B06 素材）                                 | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §126 | 星海終局篇 W4：牛熊怪與劉董・崩盤之王（L30 最終魔王）（W4；#886）                    | [`03-enemies-bosses.md`](design/03-enemies-bosses.md) |
| §127 | 星海終局篇 L29 崩盤前夜與 L30 崩盤王座（W4；#886）                                   | [`04-levels-world.md`](design/04-levels-world.md)     |
