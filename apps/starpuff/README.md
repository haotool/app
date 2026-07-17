# 星噗噗 StarPuff

> 橫式七關卷軸動作小遊戲：吸入果凍怪、化為星彈、連破果凍王與暗月蝠王。免安裝、離線可玩。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Phaser](https://img.shields.io/badge/Phaser-4.x-99c3eb?logo=gamejolt)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?logo=vite)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-GPL--3.0-green)](../../LICENSE)

[線上體驗](https://app.haotool.org/starpuff/) · [回報問題](https://github.com/haotool/app/issues)

## 玩法

浮動搖桿移動、右下綠鍵（拇指）跳躍閃避果凍怪，右側偏上粉鍵（食指）按住吸入敵人、點按化為星彈反擊；空中「下＋跳」使出下衝擊震開地面小怪（腹中含怪也能砸）。七關世界：闖過五關卷軸關卡（各藏中魔王精英）、連破兩座魔王關——地面型果凍王與空中型暗月蝠王。支援手機直持/橫持觸控手柄與桌面鍵盤（←→↓ 移動、Z 跳、X 吸射、ESC/P 暫停），PWA 安裝後可完全離線遊玩。

- 世界地圖與存檔：通關自動解鎖地圖節點（揭霧動畫），進度、各關最佳用時與彩蛋收集存於本機（localStorage）；點擊已通關節點可隨時重玩，地圖內可兩步確認重置進度；舊版四關存檔無縫升級七節點。
- 吞噬賦星九系：果凍丁標準星／飄飄與風飄鳥疾風星／氣球魨爆裂星／殼殼殼盾星（長按舉盾格擋並反擊）／雷雷雷鏈星（命中跳電最近兩敵）／鑽鑽鼴重鑽星（破土窗吞取）／提燈水母流光星／孢子菇孢子星（命中緩速加持續傷）／迴力殼迴旋星（去而復返雙程判定）。
- 雙味混合星彈：依序吞兩隻不同怪即合成混合星（共九式——疾光穿透、巨爆、追電、雷爆、碎鑽散射、凝光凍結場、毒爆雲、電鋸迴旋、迴風刃），HUD 以雙色槽位顯示；基礎星彈恆可通關，混合僅為威力加成。
- 翔風峽谷上升氣流：踏入氣流柱免跳升空，乘風探索高台支線與隱藏彩蛋。
- 中魔王精英：走動關中段強化變體鎮守軟鎖門（迴聲石廊雙精英連戰），擊敗開門並掉落稀有味與回復食物（60 秒未敗門也會自動開啟，絕不卡關）。
- 主選單：開始遊戲（接續當前進度）／世界地圖／圖鑑（全怪物行為與可吸標記）／技能介紹／按鈕配置；頁腳顯示建置版本號。
- 按鈕配置：拖曳虛擬鍵自訂位置，儲存於本機（localStorage），一鍵恢復預設。
- 暫停：HUD 右上暫停鍵或 ESC/P；切到背景自動暫停（物理、計時與音樂全停），回前景點「繼續」接關。

## 開發

```bash
pnpm install --frozen-lockfile
pnpm --filter @app/starpuff dev
pnpm --filter @app/starpuff test:run
pnpm --filter @app/starpuff build
```

## 技術棧

TypeScript 5.9 + Vite 8 + Phaser 4 + ZzFX 程序化音效 + vite-plugin-pwa（Workbox 離線快取）。
