# haotool.org v2 資安設計基準（PM 親撰 SSOT）

> 狀態：Active｜建立：2026-07-05
> 適用：`apps/haotool`（純靜態 SSG 站，無後端、無帳號、無表單提交）
> 對齊：`security-headers/src/worker.js`（邊緣安全標頭 SSOT）、`SECURITY.md`、046 §7

## 1. 信任邊界與資產

| 資產               | 分級   | 說明                                             |
| ------------------ | ------ | ------------------------------------------------ |
| 靜態 HTML/JS/CSS   | 公開   | SSG 產物，經 Cloudflare + nginx 提供             |
| 使用者資料         | 無     | 不收集；無 cookie、無帳號、無表單後送            |
| localStorage       | 低敏   | 僅 UI 偏好（如未來主題）；不存個資               |
| 聯絡資訊（Email）  | 公開   | 作者自願公開；防爬蟲改寫（CF Email Obfuscation） |
| 供應鏈（npm deps） | 高風險 | 前端唯一實質攻擊面                               |

## 2. 威脅模型（STRIDE-lite）與控制

| 威脅                    | 場景                                 | 控制（MUST）                                                                                                                                                         |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XSS / 注入              | SSG 注入 meta/JSON-LD、未跳脫內容    | 所有 head 注入走既有 escape helper；JSON-LD 用 `JSON.stringify`；禁止 `dangerouslySetInnerHTML`（白名單例外需 review）；內容全部來自 repo 內 SSOT 常數，無使用者輸入 |
| 供應鏈攻擊              | 惡意/漏洞依賴                        | 依賴最小化（PRD §11 清單外新增依賴需 ADR）；沿用 root `pnpm.overrides` 安全 pin；Renovate/Dependabot 既有流程；不引入 CDN script（自託管字體與資源）                 |
| Clickjacking / 嵌入濫用 | 第三方 iframe 嵌入                   | 邊緣 `X-Frame-Options: SAMEORIGIN`（worker 既有 `HAOTOOL_HTML_PROFILE`）                                                                                             |
| SW 越權                 | root scope SW 攔截子 app（歷史事故） | allowlist 僅 4 路由；denylist 明列 5 個子 app（含 split-meow）；`registerType: 'prompt'`；E2E 守門                                                                   |
| 開放重導向 / 外連       | 外部連結被濫用                       | 全部外連 `rel="noopener noreferrer"`；無任何 redirect 參數機制                                                                                                       |
| Email 收割              | 爬蟲收集 mailto                      | MailtoLink 模式：SSG HTML 不輸出 `mailto:` href，hydration 後注入                                                                                                    |
| 剪貼簿濫用              | clipboard API                        | 僅寫入（`writeText`）、僅使用者手勢觸發；失敗 fallback 為選取文字                                                                                                    |
| 快取投毒 / 版本撕裂     | CDN/SW 舊資產                        | hashed assets immutable、HTML no-cache（nginx 既有策略）；發布順序 app → Worker → purge → live 驗證                                                                  |
| 憑證洩漏                | build/CI                             | 站點無 secret；CI 沿用 repo secret 管理；禁止在程式碼/文件輸出 token                                                                                                 |

## 3. 安全標頭責任界面（不得在 app 層重複設定）

- CSP、HSTS、XFO、Referrer-Policy、Permissions-Policy：**由 Cloudflare `security-headers` worker 統一注入**（`ROOT_SITE_HTML_HOSTS` / `HAOTOOL_ROOT_HTML_PATHS` profile）。
- 本站義務：
  1. 路由變更（`/projects/`→`/tools/`）時同步 worker `HAOTOOL_ROOT_HTML_PATHS`。
  2. 新增外部資源網域（如字體改自託管後應為零）需同步 CSP `connect-src`/`font-src` 白名單——目標：**零第三方網域**。
  3. Worker 邊緣硬編碼內容同步（防 AEO 漂移）：`AGENT_SKILL_ARTIFACTS`（haotool-discovery 更新為 5 工具＋工具站敘事）、`LLM_DOC_PATHS`（補根站 `/llms.txt`）；上線逐項 curl 驗證。
  4. 上線驗證：`curl -s --compressed https://app.haotool.org/ -D - -o /dev/null | grep -i 'content-security-policy\|x-frame-options\|x-security-policy-version'`。

## 4. 隱私承諾（產品層 SSOT）

- 不收集個資、無第三方追蹤/廣告 SDK、無 cookie banner（因為沒有 cookie）。
- `/about/#privacy` 聲明與實作必須一致；任何未來遙測需求先修訂政策文案並過 ADR。

## 5. 驗收清單（Security gate）

- [ ] `git grep dangerouslySetInnerHTML apps/haotool` 為空（或逐一 review 豁免）
- [ ] SSG HTML 產物無 `mailto:` href（`rg "mailto:" apps/haotool/dist --glob '*.html'` 驗證；JS bundle 內 hydration 用字串屬設計預期）
- [ ] 外連全帶 `noopener noreferrer`（單元測試守門）
- [ ] SW allow/denylist 單元測試 + E2E 子 app 導覽不經根 SW
- [ ] 新依賴數 = PRD §11 清單內（diff 審查；動效依賴名一律為 `motion`，防 `framer-motion` 混入）
- [ ] Worker 邊緣內容三項同步驗證（§3.3）
- [ ] 部署後 curl 驗證三標頭 + `x-security-policy-version`
