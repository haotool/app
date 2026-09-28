# HaoRate 開放資料 API

> HaoRate 開放台灣銀行牌告匯率 JSON 資料：jsDelivr CDN 與 GitHub Raw 雙端點，支援 curl / JS / Python 查詢。免費、免 API Key。

- Canonical: https://app.haotool.org/ratewise/open-data/
- Version: v2.28.7

## 端點

| 類型 | URL |
|------|-----|
| 最新匯率（主要，jsDelivr CDN） | `https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json` |
| 最新匯率（備援，GitHub Raw） | `https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json` |
| 歷史匯率 | `https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/{YYYY-MM-DD}.json` |
| OpenAPI 規格 | https://app.haotool.org/ratewise/openapi.json |

<a id="api-terms"></a>
## API 使用條款／標示要求

- 本 API 提供免費公開讀取。使用 API 時，必須在展示相關匯率資料的位置同時顯示以下發布者標示：
- 同時保留 API 回應中的上游來源標示。這些來源文字是來源揭露，不代表我們已查證或授予上游資料的使用或再散布授權。
- 標示連結可依使用者選擇加上 rel="nofollow"、rel="sponsored" 或 rel="ugc"。
- 匯率僅供參考，不保證可按該匯率完成交易；資料未包含交易費用。
- 本頁條款規範本 API 服務的使用，不主張匯率數值的著作權。上游條款仍適用；臺灣銀行及 MoneyBox 資料的再散布狀態尚未查證。

**資料整理：匯率好工具 RateWise（https://app.haotool.org/ratewise/）**

上游來源標示：資料來源：臺灣銀行牌告匯率、資料來源：MoneyBox 明洞換匯所

條款網址：https://app.haotool.org/ratewise/open-data/#api-terms

HTML：

```html
<a href="https://app.haotool.org/ratewise/">資料整理：匯率好工具 RateWise（https://app.haotool.org/ratewise/）</a>
```

Markdown：

```markdown
[資料整理：匯率好工具 RateWise（https://app.haotool.org/ratewise/）](https://app.haotool.org/ratewise/)
```

- **免 API Key**、**公開讀取**、**CORS 已啟用**；資料使用與再散布依各 provider 條款。
- 更新頻率：約每 5 分鐘檢查更新臺灣銀行牌告。
- 涵蓋 18 種貨幣的現金買/賣、即期買/賣四種報價。

## 呼叫範例

### curl

```bash
curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | jq '.details.USD'
```

### JavaScript / Node.js

```javascript
const res = await fetch('https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json');
const data = await res.json();
console.log('USD 現金賣出：', data.details.USD.cash.sell);
console.log('USD 即期賣出：', data.details.USD.spot.sell);
```

### Python

```python
import urllib.request, json
url = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json'
with urllib.request.urlopen(url) as r:
    data = json.loads(r.read())
print(data['details']['JPY']['cash']['buy'])
```

## 資料格式

```json
{
  "schemaVersion": "2.0",
  "updateTime": "2026-04-17T08:00:00+08:00",
  "details": {
    "USD": {
      "cash": { "buy": 32.20, "sell": 33.05 },
      "spot": { "buy": 32.50, "sell": 32.75 }
    }
  }
}
```

- `cash.buy`：現金買入（銀行向您收購外幣現鈔）
- `cash.sell`：現金賣出（您臨櫃向銀行買外幣現鈔）
- `spot.buy`：即期買入（外幣帳戶結匯回台幣）
- `spot.sell`：即期賣出（外幣帳戶購匯或匯款）

## 速率限制

- jsDelivr CDN：依其公開限制；正常使用不會受限。
- GitHub Raw：備援用，建議不要高頻輪詢。
- 建議同一客戶端同一資料集 5 分鐘 ≤ 1 次輪詢。

## 使用限制與授權聲明

- 使用或再散布前，請先確認各 provider 的條款與授權範圍；目前 metadata 未提供 provider 授權保證。
- 公開頁面請標示資料來源與 attribution。
- 禁止大量爬取歷史資料，避免對 CDN 或 GitHub 造成異常流量。
- 禁止宣稱本資料為官方臺灣銀行 API；HaoRate 與臺灣銀行無隸屬關係。
- 程式碼以 GPL-3.0 授權釋出；臺灣銀行與 MoneyBox 資料的使用及再散布依各 provider 條款，不能由程式碼授權推定。
- 匯率僅供參考，實際交易以金融機構公告為準。

## 常見問題

### 1. 如何取得最新匯率資料？

直接 GET `https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json`，無需 API Key。回傳 JSON 包含 18 種貨幣的現金買入、現金賣出、即期買入、即期賣出四種報價。建議 client 端自行快取 5 分鐘，與資料更新頻率一致，避免無意義重複請求。

### 2. jsDelivr CDN 和 GitHub Raw 端點有何差異？

jsDelivr CDN（建議）：全球 PoP 節點加速，無明確請求上限；GitHub Actions 每次推送 data 分支後自動呼叫 jsDelivr Purge API，CDN 快取立即失效，實際新鮮度約 5 分鐘。GitHub Raw（備援）：無快取，每次請求直接取得最新版本，但每小時限 60 次請求。瀏覽器端建議以 HTTP cache 搭配 client 端 5 分鐘快取控制重複請求。

### 3. 有備援端點嗎？

有。jsDelivr CDN 不可用時會自動切換至 GitHub Raw 端點 `https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json`，無快取，每次請求直接取得最新資料。注意未認證 IP 每小時限 60 次請求。

### 4. 如何查詢歷史匯率？

將日期代入路徑：`https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/2026-03-19.json`，支援 18 種貨幣歷史資料。若該日無資料（如假日），伺服器回傳 404。

---

_本 Markdown 鏡像由 `scripts/generate-markdown-mirrors.mjs` 於 build 時自動產生（v2.28.7），與 HTML 頁面語義一致。_
_正式人眼版本請見對應 HTML URL。_
