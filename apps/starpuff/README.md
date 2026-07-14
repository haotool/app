# 星噗噗 StarPuff

> 直向 Boss Rush 動作小遊戲：吸入果凍怪、化為星彈、擊敗果凍王。免安裝、離線可玩。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Phaser](https://img.shields.io/badge/Phaser-4.x-99c3eb?logo=gamejolt)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?logo=vite)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-GPL--3.0-green)](../../LICENSE)

[線上體驗](https://app.haotool.org/starpuff/) · [回報問題](https://github.com/haotool/app/issues)

## 玩法

左右移動與跳躍閃避果凍怪，按住 B 吸入敵人、再按一次化為星彈反擊；波次推進後挑戰最終 Boss 果凍王。支援手機直向觸控按鍵與桌面鍵盤，PWA 安裝後可完全離線遊玩。

## 開發

```bash
pnpm install --frozen-lockfile
pnpm --filter @app/starpuff dev
pnpm --filter @app/starpuff test:run
pnpm --filter @app/starpuff build
```

## 技術棧

TypeScript 5.9 + Vite 8 + Phaser 4 + ZzFX 程序化音效 + vite-plugin-pwa（Workbox 離線快取）。
