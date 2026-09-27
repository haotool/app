# A320neo Immersive Flight Deck

物理驅動的 A320neo 飛行模擬：6DOF 飛行動力學、Normal Law 線傳飛控、完整系統相依鏈、自動飛行（AP/FD/A/THR）、
即時繪製 PFD/ND/ECAM/MCDU、可操作的 3D 駕駛艙、電影運鏡、程序合成音效與繁中／英文介面。

## 指令

```bash
pnpm --filter @app/a320-flight-deck dev        # http://localhost:3010
pnpm --filter @app/a320-flight-deck test       # 無頭測試（完整航程自動降落、冷艙系統鏈）
pnpm --filter @app/a320-flight-deck typecheck
pnpm --filter @app/a320-flight-deck build
```

## 架構

| 目錄                     | 職責                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `src/sim/`               | `SimState` 單一真相來源；物理（`dynamics.ts`）、飛控（`fcc.ts`）、發動機、系統、自動飛行、MCDU、Demo 虛擬機師、重播 |
| `src/sim/controlDefs.ts` | 座艙控制項註冊表；燈號與位置一律由 `readControl(state, id)` 推導                                                    |
| `src/render/`            | 引擎整合（後製、動態解析度、背景暫停、Context 復原）、環境、機場城市、外部機體、座艙、航電顯示、攝影機導演          |
| `src/audio/`             | WebAudio 程序合成（發動機、氣流、報讀、警告）                                                                       |
| `src/ui/`、`src/i18n/`   | React 介面與繁中／英文字串                                                                                          |

模擬固定 60 Hz 步進；自動駕駛只輸出坡度／飛行路徑角目標，經飛控作用於物理，不直接改寫飛機位置。

## 操作

- 飛行模式：W/S/A/D 或方向鍵、Q/E 方向舵、R/F 推力、T = TOGA、G 起落架、`[` `]` 襟翼、`/` 減速板、空白鍵剎車；按住滑鼠左鍵拖曳 = 側桿
- 座艙模式（C）：點擊按鈕、滾輪或拖曳旋鈕；點擊 = 按入（Managed），右鍵或 Shift+點擊 = 拉出（Selected）
- 其他：V 切換視角、P 暫停、H HUD、F3 效能資訊
