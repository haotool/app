# MVP 快速流程與環境設定指南

> **重點**：這是一個給資深工程師的最低摩擦流程，目標是幾個小型 React 應用可以快速驗證、快速部署，同時保持乾淨的結構與最低技術債。

---

## 1. 遵循 React 2025 年官方方向

- React 組團隊在 2025/02 宣布 **Create React App 正式退場**，新專案直接改用 Vite、Parcel 或框架（Next.js、Remix）[^react-cra].
- React 19.2（2025/10）已釋出，確保依賴鎖定在 React 19 系列並跟進 `useEffectEvent` 等新 API[^react-192].

**結論**：本專案預設採用 `pnpm create vite` + React 19 + TypeScript。`apps/ratewise/src/features/ratewise` 已完成模組化；根目錄 `RateWise.tsx` 僅 re-export，方便向後相容。

---

## 2. 快速建立 React/Vite 專案骨架

```bash
pnpm create vite ratewise --template react-ts
cd ratewise
pnpm install
```

> **目前實作**：根目錄已建 `pnpm` workspace，直接在專案根目錄執行 `pnpm install`、`pnpm dev` 即可啟動 `apps/ratewise`。

### 2.1 標準化瀏覽器支援

- `package.json` 的 `browserslist` 改用 Baseline 查詢語法，確保與 2025 年的工具鏈一致[^baseline]:
  ```json
  "browserslist": [
    "baseline widely available"
  ]
  ```
- 這樣可直接給 Babel / PostCSS 等工具使用 Baseline 規範。

### 2.2 多應用目錄約定

```
apps/
  ratewise/
    src/
      features/
        ratewise/
          RateWise.tsx
          constants.ts
          types.ts
          storage.ts
    index.html
  shared/
    ui/
    hooks/
RateWise.tsx  # re-export，保留向後相容
```

---

## 3. Docker 與部署最短路徑

1. **建置階段**：使用 node:20-alpine 建置 Vite bundle。
2. **執行階段**：用 nginx:alpine 或 node runtime 提供靜態檔案。
3. **多應用共用**：使用 `ARG APP=ratewise`，同一份 Dockerfile 可傳入不同 APP 目錄。

對於需要 SSR 的應用，可改用 Next.js 官方 `with-docker` 範例流程，包括 `output: "standalone"` 與 multi-stage build[^next-docker]。

---

## 4. 開源模板清單（最快可套用）

| 目的              | 來源                                        | 擷取重點                                                                       |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| SPA 靜態站        | `pnpm create vite` React-TS                 | 官方推薦，最精簡。                                                             |
| SSR/Edge          | Next.js `with-docker`                       | 內建 Docker 最佳實踐，`output: "standalone"`。                                 |
| UI 範例           | `pnpm create next-app --example with-turbo` | 若需要 Monorepo/Turborepo。                                                    |
| Log/Observability | Fluent Bit v4 migration guide               | 2025/10 指出 Fluent Bit 更省資源，方便後續導入集中式 logging[^cncf-fluentbit]. |

---

## 5. Git Flow 與 Commit 規則

- **單一職責 commit**：每次 commit 只解一個問題；文件、設定、程式碼拆開。
- **訊息格式**：`<type>(scope): summary`
  - `type`：`feat`、`fix`、`docs`、`chore`、`refactor`。
  - `scope`：如 `ratewise`、`docker`、`docs`.
  - 範例：`feat(ratewise): add currency store skeleton`.
- **Branch 命名**：`feature/<slug>`、`chore/<slug>`。
- **禁止**：squash unrelated changes、特性未完成就混入 master。

---

## 6. Pre-commit 針對性設定

1. 安裝
   ```bash
   pipx install pre-commit
   pre-commit install
   ```
2. `.pre-commit-config.yaml` 建議內容：
   ```yaml
   repos:
     - repo: https://github.com/pre-commit/pre-commit-hooks
       rev: v4.6.0
       hooks:
         - id: check-yaml
         - id: check-json
         - id: end-of-file-fixer
         - id: trailing-whitespace
     - repo: https://github.com/charliermarsh/ruff-pre-commit
       rev: v0.6.9
       hooks:
         - id: ruff
           args: [--fix]
     - repo: https://github.com/prettier/prettier
       rev: 3.3.3
       hooks:
         - id: prettier
           additional_dependencies:
             - prettier@3.3.3
             - prettier-plugin-tailwindcss@0.6.7
   ```
3. TypeScript Lint / Test 在 CI 執行（避免本地負擔過重）。

---

## 7. 安全與營運守備

- **邊界交給 Cloudflare**：應用部署在 Cloudflare 前方，啟用 WAF、Bot Management、快速事件應變（REACT 團隊）[^cloudflare-react]。
- **API & LLM Security**：若後續導入 AI 機制，遵循 AWS 針對生成式 AI 的網路防護建議，含 VPC 隔離、AWS Shield、WAF、IAM Least Privilege[^aws-genai].
- **版本治理**：觀察 React Labs 公布的新實驗功能（View Transitions, Activity），盡量以 Canary 測試，避免直接進 mainline[^react-labs].

---

## 8. 後續重構 Roadmap

1. ✅ RateWise 核心邏輯已移至 `apps/ratewise/src/features/ratewise`，並加入型別與模組化常數。
2. 加入 Vitest + React Testing Library 針對關鍵計算撰寫單元測試（確保 MVP 行為穩定）。
3. Docker 化並部署到 Cloudflare Pages / Workers 或自管主機。
4. 建立 GitHub Actions：`pnpm lint`, `pnpm test`, `pnpm build`, `docker build`.

---

## 參考資源

[^react-cra]: Matt Carroll, Ricky Hanlon, _Sunsetting Create React App_, React Blog, 2025-02-14. <https://react.dev/blog/2025/02/14/sunsetting-create-react-app>

[^react-192]: React Team, _React 19.2_, React Blog, 2025-10-01. <https://react.dev/blog/2025/10/01/react-19-2>

[^baseline]: Jeremy Wagner, _Browserslist now supports Baseline_, web.dev, 2025-09-16. <https://web.dev/blog/browserslist-supports-baseline>

[^next-docker]: Vercel, _Next.js with Docker Example_, 取自 `with-docker` 教學, 2025. <https://github.com/vercel/next.js/tree/canary/examples/with-docker>

[^cloudflare-react]: Cloudflare, _Introducing REACT: Why We Built an Elite Incident Response Team_, 2025-10-09. <https://blog.cloudflare.com/introducing-react-why-we-built-an-elite-incident-response-team/>

[^aws-genai]: AWS Security Blog, _Build secure network architectures for generative AI applications using AWS services_, 2025-09-25. <https://aws.amazon.com/blogs/security/build-secure-network-architectures-for-generative-ai-applications-using-aws-services/>

[^react-labs]: React Team, _React Labs: View Transitions, Activity, and more_, React Blog, 2025-04-23. <https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more>

[^cncf-fluentbit]: Anurag Gupta, _Fluentd to Fluent Bit: A migration guide_, CNCF Blog, 2025-10-01. <https://www.cncf.io/blog/2025/10/01/fluentd-to-fluent-bit-a-migration-guide/>
