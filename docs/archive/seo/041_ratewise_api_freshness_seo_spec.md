# RateWise API 永遠最新策略 × SEO 完整評估 SPEC

> 文件性質：臨時規劃 SPEC（不修改任何程式碼）
> 建立時間：2026-03-18
> 版本：v1.0
> 狀態：Draft — 待 Maintainer 審核後決定實作優先順序

---

## 一、當前架構現狀（As-Is）

### 1.1 資料流

```
臺灣銀行官網 (rate.bot.com.tw)
    ↓ GitHub Actions cron */5 * * * *
data branch: public/rates/latest.json
    ↓ 兩條路徑
[A] GitHub Raw (主要)   → 前端 exchangeRateService.ts 使用
[B] jsDelivr CDN (文件) → openapi.json servers[0]、llms.txt 推薦
```

### 1.2 前端取資料策略（exchangeRateService.ts）

| 層級 | 機制                   | TTL                               |
| ---- | ---------------------- | --------------------------------- |
| 1    | localStorage 快取      | 5 分鐘                            |
| 2    | Stale-while-revalidate | 立即回傳舊資料，背景更新          |
| 3    | GitHub Raw 直接 fetch  | 無快取（約 5 分鐘 GitHub 端快取） |
| 4    | IndexedDB 備援         | 7 天（Safari PWA 冷啟動）         |
| 5    | FALLBACK_RATES 硬編碼  | 離線最後防線                      |

**現狀評估：前端策略正確，已明確避免 jsDelivr 12-24 小時快取問題。**

### 1.3 已發現的矛盾（Codex Review 指出）

| 問題                                                                 | 位置          | 影響                                                          |
| -------------------------------------------------------------------- | ------------- | ------------------------------------------------------------- |
| openapi.json servers[0] 是 jsDelivr（建議），但前端實際用 GitHub Raw | openapi.json  | 文件誤導開發者/LLM 使用快取過期的端點                         |
| llms.txt 推薦 jsDelivr CDN 端點                                      | llms.txt      | LLM 可能取到 12 小時前的舊資料                                |
| SEOHelmet unmount 不清理 head                                        | SEOHelmet.tsx | 非 SEO 路由（/multi, /favorites, /settings）殘留前頁 metadata |

---

## 二、API 永遠最新策略分析

### 2.1 問題核心

SSG 靜態網站無法自建後端 API，必須依賴外部資料源。核心挑戰：

> **如何讓使用者永遠取得最新匯率，同時兼顧全球 CDN 加速與省流量？**

### 2.2 各方案比較

#### 方案 A：現狀 — GitHub Raw（主要端點）

```
URL: https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json
```

| 項目     | 評估                                               |
| -------- | -------------------------------------------------- |
| 快取 TTL | GitHub 端約 5 分鐘（與更新頻率一致）               |
| 全球加速 | ❌ 無 CDN，台灣用戶連美國 GitHub 伺服器            |
| 可靠性   | ✅ GitHub 99.9% uptime                             |
| 費用     | ✅ 免費                                            |
| 維護成本 | ✅ 零維護                                          |
| 適合場景 | 前端 fetch（已有 stale-while-revalidate 補償延遲） |

**結論：前端使用 GitHub Raw 是合理選擇，但文件（openapi.json/llms.txt）應如實反映。**

#### 方案 B：jsDelivr CDN + 每次 push 後 purge

```
URL: https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
Purge: https://purge.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
GitHub Action: gacts/purge-jsdelivr-cache
```

| 項目         | 評估                                      |
| ------------ | ----------------------------------------- |
| 快取 TTL     | branch URL 預設 12 小時，purge 後立即失效 |
| 全球加速     | ✅ jsDelivr 全球 CDN                      |
| purge 可靠性 | ⚠️ purge 不保證立即生效（可能 1-5 分鐘）  |
| 費用         | ✅ 免費（每月數十億次請求）               |
| 維護成本     | 低（在 workflow 加一步 purge）            |
| 適合場景     | 文件推薦端點、LLM 取資料                  |

**實作方式：在 `update-latest-rates.yml` 的 push 成功後加入：**

```yaml
- name: Purge jsDelivr cache
  if: steps.fetch-rates.outcome == 'success' && steps.git-check.outputs.changed == 'true'
  run: |
    curl -s "https://purge.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json" \
      -o /dev/null -w "jsDelivr purge status: %{http_code}\n"
```

**結論：最小成本升級方案，讓 jsDelivr 成為真正可靠的推薦端點。**

#### 方案 C：Cloudflare Workers 代理層（最佳實踐）

```
URL: https://app.haotool.org/ratewise/api/rates/latest.json
Worker: 代理 GitHub Raw，設定 Cache-Control: public, max-age=300, stale-while-revalidate=60
```

| 項目         | 評估                                |
| ------------ | ----------------------------------- |
| 快取 TTL     | 可精確控制（5 分鐘 = 300 秒）       |
| 全球加速     | ✅ Cloudflare 全球邊緣節點          |
| 自訂 headers | ✅ 可加 CORS、ETag、Last-Modified   |
| 費用         | ✅ 免費方案 100,000 次/天           |
| 維護成本     | 中（需維護 Worker 程式碼）          |
| 適合場景     | 對外穩定 API 端點、OpenAPI 文件推薦 |

**Worker 核心邏輯（偽碼）：**

```javascript
// Cloudflare Worker: rates-proxy
export default {
  async fetch(request, env, ctx) {
    const ORIGIN = 'https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json';
    const cache = caches.default;
    const cacheKey = new Request(ORIGIN, request);

    // 嘗試從 Cloudflare 邊緣快取取資料
    let response = await cache.match(cacheKey);
    if (!response) {
      response = await fetch(ORIGIN);
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      response.headers.set('Access-Control-Allow-Origin', '*');
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }
    return response;
  },
};
```

**結論：最完整方案，但需要額外維護 Worker。已有 security-headers Worker，可評估合併。**

#### 方案 D：Cloudflare Pages Functions（SSG 內建）

```
路徑: apps/ratewise/functions/api/rates/latest.json.ts
URL: https://app.haotool.org/ratewise/api/rates/latest.json
```

| 項目     | 評估                                       |
| -------- | ------------------------------------------ |
| 整合度   | ✅ 與 SSG 同一 repo，無需額外部署          |
| 快取控制 | ✅ 可設定 Cache-Control                    |
| 費用     | ✅ Cloudflare Pages 免費方案包含 Functions |
| 維護成本 | 低（與前端同 repo）                        |
| 限制     | 需確認 Zeabur 部署是否支援 Pages Functions |

**結論：若部署平台支援，是最優雅的整合方案。但需確認 Zeabur 相容性。**

### 2.3 推薦方案（優先順序）

```
P0（立即可做）：方案 B — jsDelivr + purge
  → 在 update-latest-rates.yml 加一步 purge
  → 修正 openapi.json servers 順序（jsDelivr 為主，GitHub Raw 為備援）
  → 修正 llms.txt 端點說明（加入 purge 機制說明）

P1（中期）：方案 C — Cloudflare Workers 代理
  → 建立 /ratewise/api/rates/latest.json 穩定端點
  → 可精確控制 Cache-Control: max-age=300
  → 成為 openapi.json 的 servers[0]

P2（評估）：方案 D — Cloudflare Pages Functions
  → 確認 Zeabur 是否支援
  → 若支援，可取代方案 C
```

---

## 三、當前 API 格式驗證

### 3.1 openapi.json 格式評估

**優點：**

- 符合 OpenAPI 3.1.0 規範
- 欄位說明完整（timestamp、updateTime、source、rates、details）
- 包含 `x-deep-link` 自訂擴充，方便 LLM 生成深層連結
- 四種匯率類型（cash_buy/sell、spot_buy/sell）說明清晰
- 包含 KRW spot = null 的特殊情況說明

**問題：**

| 問題                                                                                                                           | 嚴重度 | 說明                                                     |
| ------------------------------------------------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------- |
| servers[0] 是 jsDelivr，但前端實際用 GitHub Raw                                                                                | P1     | 文件與實作不一致，誤導開發者                             |
| 歷史匯率 endpoint 的 response schema 與 latest 完全相同（複製貼上）                                                            | P2     | 可抽取為 `$ref` 共用 schema                              |
| 缺少 `convert` endpoint（計算換算結果）                                                                                        | P3     | 使用者期望的 `/api/convert?from=KRW&to=TWD&amount=50000` |
| `timestamp` 欄位說明寫「Unix 時間戳（毫秒）」但 example 是 1740000000000（毫秒），實際 latest.json 的 timestamp 欄位需確認單位 | P1     | 需驗證實際資料格式                                       |

### 3.2 latest.json 實際格式驗證

根據 `public/api/latest.json`（靜態 metadata）與 openapi.json 的 schema，需驗證：

```bash
# 驗證指令（不修改程式碼，僅查詢）
curl -s https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json | \
  node -e "
    const d = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
    console.log('timestamp type:', typeof d.timestamp, '=', d.timestamp);
    console.log('updateTime:', d.updateTime);
    console.log('source:', d.source);
    console.log('rates keys:', Object.keys(d.rates).length);
    console.log('details keys:', Object.keys(d.details).length);
    console.log('KRW spot:', JSON.stringify(d.details.KRW?.spot));
    console.log('USD cash:', JSON.stringify(d.details.USD?.cash));
  "
```

**預期格式（根據 openapi.json schema）：**

```json
{
  "timestamp": 1741000000,
  "updateTime": "2026-03-18T10:05:00+08:00",
  "source": "Bank of Taiwan",
  "rates": {
    "USD": 32.75,
    "JPY": 0.2178
  },
  "details": {
    "USD": {
      "spot": { "buy": 32.45, "sell": 32.75 },
      "cash": { "buy": 32.15, "sell": 33.05 }
    },
    "KRW": {
      "spot": { "buy": null, "sell": null },
      "cash": { "buy": 0.02112, "sell": 0.0225 }
    }
  }
}
```

### 3.3 llms.txt 格式評估

**優點：**

- 符合 llms.txt 標準提案格式
- Answer Capsule 區塊清晰，適合 LLM 直接引用
- Tool Use 區塊提供完整的 fetch 範例與匯率選擇指南
- E-E-A-T 信號完整
- 允許主要 AI bot 爬取

**問題：**

| 問題                                                     | 嚴重度 | 說明                                            |
| -------------------------------------------------------- | ------ | ----------------------------------------------- |
| 推薦 jsDelivr CDN 端點，但該端點有 12 小時快取           | P1     | 應改為推薦 GitHub Raw 或加入 purge 說明         |
| 缺少 `convert` 計算範例（50000 KRW → TWD 的完整計算）    | P2     | LLM 需要完整計算範例才能正確回答                |
| Deep Link 格式說明不夠明確（只說「模板」，沒有完整範例） | P2     | 應加入 `?amount=50000&from=KRW&to=TWD` 完整範例 |

---

## 四、SEO 完整評估

### 4.1 已實作（✅）

| 類別       | 項目                                                                        | 狀態 |
| ---------- | --------------------------------------------------------------------------- | ---- |
| 頁面結構   | 17 個幣別落地頁（SSG 預渲染）                                               | ✅   |
| 頁面結構   | 3 個知識指南頁（sell-rate-vs-mid-rate, cash-vs-spot-rate, card-rate-guide） | ✅   |
| 頁面結構   | FAQ 頁（21 個問答）                                                         | ✅   |
| 頁面結構   | Guide 頁（8 步驟 HowTo）                                                    | ✅   |
| 頁面結構   | About 頁                                                                    | ✅   |
| 結構化資料 | JSON-LD：SoftwareApplication、Organization、WebSite                         | ✅   |
| 結構化資料 | JSON-LD：FAQPage（首頁、FAQ 頁、幣別頁）                                    | ✅   |
| 結構化資料 | JSON-LD：HowTo（Guide 頁、幣別頁）                                          | ✅   |
| 結構化資料 | JSON-LD：Article（知識指南頁）                                              | ✅   |
| 結構化資料 | JSON-LD：BreadcrumbList                                                     | ✅   |
| 結構化資料 | JSON-LD：FinancialService（幣別頁）                                         | ✅   |
| LLM 可讀性 | llms.txt（精簡版）                                                          | ✅   |
| LLM 可讀性 | llms-full.txt（完整技術文件）                                               | ✅   |
| LLM 可讀性 | openapi.json（OpenAPI 3.1）                                                 | ✅   |
| 技術 SEO   | sitemap.xml（24 個 SEO 頁面）                                               | ✅   |
| 技術 SEO   | robots.txt（允許主要 AI bot）                                               | ✅   |
| 技術 SEO   | hreflang（zh-TW + x-default）                                               | ✅   |
| 技術 SEO   | canonical URL                                                               | ✅   |
| 技術 SEO   | OG / Twitter Card                                                           | ✅   |
| 內容 SEO   | 幣別頁常見金額錨點（點擊導向 `/?amount=...`）                               | ✅   |
| 內容 SEO   | 幣別頁旅遊換匯提示                                                          | ✅   |
| 內容 SEO   | 幣別頁「為什麼看賣出價」說明區塊                                            | ✅   |
| 深層連結   | `?amount={AMOUNT}&from={FROM}&to={TO}` URL 參數                             | ✅   |
| PWA        | Service Worker 離線快取                                                     | ✅   |
| 效能       | SSG 預渲染（首屏 HTML 完整）                                                | ✅   |

### 4.2 缺少或待改善（❌ / ⚠️）

#### P0 — 立即影響 SEO 信任度

| 問題                                             | 影響                                                                                                   | 建議                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| SEOHelmet unmount 不清理 head（Codex Review P2） | 非 SEO 路由（/multi, /favorites, /settings）殘留前頁 title/canonical/JSON-LD，分享卡與爬蟲看到錯誤資訊 | 在 SEOHelmet unmount 時清除非 SSG 路由的 head 標籤    |
| openapi.json servers 順序矛盾                    | 文件推薦 jsDelivr（12h 快取），前端用 GitHub Raw（5min 快取），LLM 依文件取到舊資料                    | 修正 servers 順序，或加入 purge 機制後再推薦 jsDelivr |

#### P1 — 搜尋意圖覆蓋缺口

| 缺少項目                                       | 搜尋意圖                                         | 建議方案                                          |
| ---------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| 金額長尾 SSG 頁面（`/convert/krw-twd/50000/`） | 「50000 韓元多少台幣」「一萬日圓等於多少台幣」   | Programmatic SEO：為熱門幣對 × 熱門金額生成靜態頁 |
| 幣別頁常見金額的靜態文字結果                   | Google 需要看到「50000 韓元 = X 台幣」的靜態文字 | 在 SSG 時注入靜態計算結果（需 build-time 匯率）   |
| 反向幣對頁（TWD → KRW, TWD → JPY）             | 「台幣換韓元」「台幣換日圓」                     | 新增 `/twd-krw/`、`/twd-jpy/` 等反向頁            |

#### P2 — 內容深度與信任度

| 缺少項目                                   | 影響                           | 建議                                                     |
| ------------------------------------------ | ------------------------------ | -------------------------------------------------------- |
| 刷卡匯率計算器（Visa/Mastercard 官方連結） | 無法吃到「刷卡匯率怎麼算」長尾 | 在 card-rate-guide 頁加入 Visa/Mastercard 官方計算器連結 |
| 匯率走勢說明文字（SEO 可索引）             | 趨勢圖是 JS 渲染，爬蟲看不到   | 在幣別頁加入靜態文字描述近期走勢（build-time 生成）      |
| 「去韓國要帶多少現金」等旅遊情境頁         | 旅遊換匯決策型搜尋             | 在 FAQ 或 Guide 頁加入旅遊情境問答                       |
| 多語言 SEO 頁面（英文、日文）              | 國際用戶搜尋                   | 評估是否需要 `/en/krw-twd/`、`/ja/krw-twd/`              |

#### P3 — LLM 可讀性升級

| 缺少項目                                                              | 影響                                  | 建議                                           |
| --------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| `convert` API endpoint（`/api/convert?from=KRW&to=TWD&amount=50000`） | LLM 無法直接計算，需自行取 rates 再算 | 加入 Cloudflare Worker 計算端點                |
| llms.txt 完整計算範例                                                 | LLM 可能算錯（買入/賣出混淆）         | 加入「50000 KRW → TWD 完整計算步驟」範例       |
| Schema.org CurrencyConversionService                                  | Google 可能無法識別為匯率轉換服務     | 在幣別頁加入 CurrencyConversionService JSON-LD |

---

## 五、Programmatic SEO 金額長尾頁規格

### 5.1 URL 策略

```
核心幣別頁（已有）：/krw-twd/
金額長尾頁（待建）：/convert/krw-twd/50000/
反向幣別頁（待建）：/twd-krw/
```

### 5.2 金額長尾頁規格

**URL 格式：** `/convert/{from}-{to}/{amount}/`

**canonical 策略：** 指向核心幣別頁 `/krw-twd/`（避免薄頁互打）

**熱門金額集合（依幣別）：**

```typescript
const POPULAR_AMOUNTS: Record<string, number[]> = {
  KRW: [1000, 5000, 10000, 30000, 50000, 100000, 200000, 300000, 500000],
  JPY: [100, 500, 1000, 3000, 5000, 10000, 30000, 50000, 100000],
  USD: [1, 10, 50, 100, 200, 500, 1000],
  EUR: [1, 10, 50, 100, 200, 500, 1000],
  HKD: [10, 50, 100, 500, 1000, 5000, 10000],
  CNY: [1, 10, 50, 100, 500, 1000, 5000],
  THB: [100, 500, 1000, 3000, 5000, 10000],
  VND: [10000, 50000, 100000, 500000, 1000000],
  IDR: [10000, 50000, 100000, 500000, 1000000],
};
```

**頁面內容要求（每頁必須包含）：**

1. 靜態計算結果文字（build-time 注入，使用 cash_sell 匯率）
2. 使用的匯率類型與更新時間
3. 「什麼情境該用哪個匯率」短說明
4. 連結到核心幣別頁（canonical 來源）
5. FAQPage JSON-LD（至少 2 個問答）

**SEO 標題格式：**

```
{amount} {currencyName}等於多少台幣？— RateWise 即時換算
例：50000 韓元等於多少台幣？— RateWise 即時換算
```

**預估頁面數量：**

- 9 個幣別 × 平均 8 個金額 = 約 72 個長尾頁
- 加上反向幣對（TWD → 外幣）= 約 144 頁

### 5.3 Build-time 靜態結果注入

**問題：** 金額長尾頁需要顯示「50000 韓元 = X 台幣」，但匯率每 5 分鐘更新，SSG build 時的匯率會過時。

**解決方案：**

```
方案 A（推薦）：顯示「約 X 台幣」+ 更新時間 + 「點擊查看最新結果」CTA
  → 靜態文字滿足 Google 索引需求
  → CTA 導向首頁帶入參數，顯示即時結果
  → 免責聲明：「以下為 build 時匯率，實際請點擊查看最新」

方案 B：Client-side hydration 後更新結果
  → SSG 先渲染靜態估算值
  → hydration 後用 exchangeRateService 取最新值更新
  → 需注意 hydration mismatch 問題
```

---

## 六、RWD 桌面佈局重規劃

### 6.1 當前問題

- 桌面版（≥1024px）仍是手機版佈局的放大版，未充分利用寬螢幕空間
- 幣別頁在桌面版缺少側邊欄或雙欄佈局

### 6.2 建議桌面佈局

```
桌面版（≥1024px）三欄佈局：
┌─────────────────────────────────────────────────────┐
│  左側欄（240px）  │  主內容區（flex-1）  │  右側欄（280px）  │
│  - 幣別快速導航   │  - 換算器            │  - 今日匯率摘要   │
│  - 熱門幣對       │  - 趨勢圖            │  - 相關幣別       │
│  - 收藏清單       │  - FAQ               │  - 知識指南連結   │
└─────────────────────────────────────────────────────┘
```

---

## 七、實作優先順序（P0 → PN）

### P0（本週，不影響生產環境）

1. **修正 openapi.json servers 順序**
   - 將 GitHub Raw 設為 servers[0]（與前端實際行為一致）
   - 或：在 update-latest-rates.yml 加入 jsDelivr purge，再讓 jsDelivr 回到 servers[0]
   - 影響：修正文件誤導，不影響前端功能

2. **修正 llms.txt 端點說明**
   - 加入 purge 機制說明或改推薦 GitHub Raw
   - 影響：LLM 取到正確的最新資料

3. **SEOHelmet unmount 清理**
   - 在 /multi, /favorites, /settings 路由的 SEOHelmet 加入 unmount cleanup
   - 影響：修正非 SEO 路由的 metadata 殘留問題

### P1（本月）

4. **jsDelivr purge 整合**
   - 在 update-latest-rates.yml push 成功後加入 purge 步驟
   - 讓 jsDelivr 成為可靠的推薦端點

5. **金額長尾頁（Programmatic SEO）**
   - 從 KRW、JPY、USD 三個最熱門幣別開始
   - 每個幣別 8-9 個熱門金額
   - canonical 指向核心幣別頁

6. **反向幣對頁**
   - `/twd-krw/`、`/twd-jpy/`、`/twd-usd/` 等
   - 吃「台幣換韓元」「台幣換日圓」搜尋意圖

### P2（下季）

7. **Cloudflare Workers 代理端點**
   - 建立 `/ratewise/api/rates/latest.json` 穩定端點
   - Cache-Control: max-age=300, stale-while-revalidate=60

8. **Schema.org CurrencyConversionService**
   - 在幣別頁加入此 JSON-LD 類型

9. **桌面版 RWD 佈局重構**
   - 三欄佈局，充分利用寬螢幕

### P3（長期）

10. **`/api/convert` 計算端點**
    - Cloudflare Worker 實作
    - 支援 `?from=KRW&to=TWD&amount=50000&mode=cash_sell`

11. **多語言 SEO 頁面**
    - 評估英文版幣別頁需求

---

## 八、SSOT 維護規則

### 8.1 版本同步

以下檔案的版本號必須保持一致（SSOT：`apps/ratewise/package.json`）：

- `apps/ratewise/public/api/latest.json` → `version` 欄位
- `apps/ratewise/public/openapi.json` → `info.version`
- `apps/ratewise/public/llms.txt` → `Version:` 行
- `apps/ratewise/public/llms-full.txt` → `Version:` 行

**自動化方式：** `prebuild` script 從 `package.json` 讀取版本號並注入上述檔案。

### 8.2 幣別清單同步

以下位置的幣別清單必須保持一致（SSOT：`src/features/ratewise/constants.ts`）：

- `openapi.json` → `info.x-supported-currencies`
- `public/api/latest.json` → `supportedCurrencies`
- `llms.txt` → `Currencies:` 行
- `seo-paths.config.mjs` → `CURRENCY_SEO_PATHS`

**自動化方式：** `generate-openapi.mjs` 和 `generate-llms.mjs` 從 constants 讀取幣別清單。

---

## 九、參考資料

- [jsDelivr branch cache TTL](https://github.com/jsdelivr/jsdelivr/issues/18347)：branch URL 快取 12 小時
- [jsDelivr purge API](https://www.jsdelivr.com/tools/purge)：可手動或 API 清除快取
- [gacts/purge-jsdelivr-cache](https://github.com/marketplace/actions/purge-jsdelivr-cache)：GitHub Action
- [stale-while-revalidate](https://web.dev/articles/stale-while-revalidate)：Google Web.dev 官方說明
- [HTTP Caching Deep-Dive](https://www.caduh.com/blog/http-caching-deep-dive)：靜態資產與 API 的快取策略
- [Cloudflare Workers Pricing](https://workers.cloudflare.com/pricing/)：免費方案 100,000 次/天
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)：官方規範

---

**最後更新：** 2026-03-18
**版本：** v1.0
**狀態：** Draft — 待 Maintainer 審核
**下次審查：** 實作 P0 後更新為 v1.1
