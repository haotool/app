# RateWise 匯率好工具

> 基於臺灣銀行牌告匯率的即時匯率 PWA 應用，支援 30+ 種貨幣換算

[![CI](https://github.com/haotool/app/actions/workflows/ci.yml/badge.svg)](https://github.com/haotool/app/actions/workflows/ci.yml)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## 🌟 功能特色

- **即時匯率**：每 5 分鐘同步臺灣銀行牌告匯率
- **雙模式換算**：單幣別與多幣別同時換算
- **收藏管理**：自訂常用貨幣快速存取
- **趨勢圖表**：30 天歷史匯率走勢
- **離線使用**：PWA 技術支援離線存取
- **極致效能**：Lighthouse Performance 95+

## 📦 技術棧

- **框架**: React 19 + TypeScript
- **建置**: Vite 7 + vite-react-ssg
- **樣式**: Tailwind CSS 4
- **測試**: Vitest + Playwright
- **CI/CD**: GitHub Actions

## 🚀 快速開始

```bash
# 安裝依賴
pnpm install

# 開發模式
pnpm --filter @app/ratewise dev

# 建置
pnpm --filter @app/ratewise build

# 測試
pnpm --filter @app/ratewise test
```

## 📁 專案結構

```
src/
├── features/ratewise/     # 核心功能模組
│   ├── RateWise.tsx       # 主元件
│   ├── components/        # 子元件
│   ├── hooks/             # 自訂 Hooks
│   └── types.ts           # 型別定義
├── components/            # 共用元件
├── pages/                 # 路由頁面
├── services/              # API 服務
└── utils/                 # 工具函數
```

## 📊 品質指標

| 指標       | 數值        |
| ---------- | ----------- |
| 測試數量   | 895+        |
| TypeScript | Strict Mode |
| ESLint     | 0 警告      |
| Lighthouse | 95+ 全類別  |

## 📄 授權

GPL-3.0 © [haotool](https://app.haotool.org/)

---

**最後更新**: 2025-12-24
