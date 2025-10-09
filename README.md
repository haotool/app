# RateWise - 匯率換算器

> 🚀 現代化的即時匯率換算工具，支援單幣別與多幣別轉換

![Version](https://img.shields.io/badge/version-0.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ 特色功能

- 🔄 **雙模式轉換**: 支援單幣別與多幣別即時換算
- ⭐ **常用貨幣**: 自訂常用幣種快速存取
- 📊 **趨勢指示**: 視覺化匯率漲跌趨勢
- 💾 **本地儲存**: 自動儲存偏好設定
- 🎨 **現代 UI**: Tailwind CSS 設計的直覺介面
- ⚡ **極速體驗**: Vite + React 19 + SWC 打造

## 🚀 快速開始

### 前置需求

- Node.js ≥ 20.0.0
- pnpm ≥ 9.0.0

### 安裝

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 開啟瀏覽器訪問 http://localhost:4173
```

### 建置生產版本

```bash
# 建置
pnpm build

# 預覽建置結果
pnpm preview
```

## 🛠️ 技術棧

- **Framework**: React 19.0.0
- **Build Tool**: Vite 5.4.6
- **Language**: TypeScript 5.6.2
- **Styling**: Tailwind CSS 3.4.14
- **Testing**: Vitest 2.1.4
- **Package Manager**: pnpm 9.10.0
- **Icons**: Lucide React

## 📦 專案結構

```
ratewise-monorepo/
├── apps/
│   └── ratewise/          # 主應用程式
│       ├── src/
│       │   ├── features/  # 功能模組
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public/
│       └── package.json
├── docs/                  # 文檔
│   ├── dev/              # 開發文檔
│   └── SECURITY_BASELINE.md
├── tests/                 # E2E 測試
└── package.json
```

## 🧪 測試

```bash
# 執行測試
pnpm test

# 測試覆蓋率報告
pnpm test:coverage
```

## 📝 開發指令

| 指令              | 說明                |
| ----------------- | ------------------- |
| `pnpm dev`        | 啟動開發伺服器      |
| `pnpm build`      | 建置生產版本        |
| `pnpm preview`    | 預覽建置結果        |
| `pnpm test`       | 執行測試            |
| `pnpm lint`       | ESLint 檢查         |
| `pnpm lint:fix`   | 自動修復 lint 問題  |
| `pnpm format`     | Prettier 格式檢查   |
| `pnpm format:fix` | 自動格式化程式碼    |
| `pnpm typecheck`  | TypeScript 類型檢查 |

## 🔧 工程品質

### 自動化工具

- ✅ **Husky**: Git hooks 自動化
- ✅ **lint-staged**: Pre-commit 自動檢查
- ✅ **Commitlint**: Commit message 規範
- ✅ **ESLint**: 程式碼品質檢查
- ✅ **Prettier**: 程式碼格式化
- ✅ **GitHub Actions**: CI/CD 自動化

### Commit 規範

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
type(scope): subject

body

footer
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

## 📚 文檔

- [技術債審查報告](./docs/dev/TECH_DEBT_AUDIT.md)
- [重構路線圖](./docs/dev/REFACTOR_PLAN.md)
- [架構藍圖](./docs/dev/ARCHITECTURE_BASELINE.md)
- [安全基線](./docs/SECURITY_BASELINE.md)
- [Agent 操作指南](./AGENTS.md)

## 🔒 安全性

- 使用 localStorage 僅儲存非敏感資料
- React 19 自動防 XSS 攻擊
- 建議搭配 Cloudflare 設定安全標頭

詳見 [SECURITY_BASELINE.md](./docs/SECURITY_BASELINE.md)

## 📄 授權

MIT License - 詳見 [LICENSE](./LICENSE)

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

1. Fork 專案
2. 建立特性分支 (`git checkout -b feature/amazing-feature`)
3. Commit 變更 (`git commit -m 'feat: add amazing feature'`)
4. Push 到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📊 專案狀態

**品質分數**: 58/100 → 85/100 (改善中)

- ✅ 工程工具鏈已建立
- ✅ CI/CD Pipeline 已設定
- 🔄 測試覆蓋率提升中
- 🔄 元件重構進行中

詳見 [TECH_DEBT_AUDIT.md](./docs/dev/TECH_DEBT_AUDIT.md)

---

**Built with ❤️ using React 19 & Vite 5**
