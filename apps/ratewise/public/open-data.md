# HaoRate 開放資料 API

> HaoRate 提供臺灣銀行與 MoneyBox 的 v3 方向化匯率 JSON：不可變 release manifest、SHA-256 objects、來源/擷取時間與 legacy adapter，支援 curl / JS / Python 查詢。免 API Key；資料使用依各 provider 條款。

- Canonical: https://app.haotool.org/ratewise/open-data/
- Version: v2.28.2

## 端點

| 類型 | URL |
|------|-----|
| v3 current pointer（主要，jsDelivr CDN） | `https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/v3/current.json` |
| v3 current pointer（備援，GitHub Raw） | `https://raw.githubusercontent.com/haotool/app/data/public/rates/v3/current.json` |
| 最新匯率（主要，jsDelivr CDN） | `https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json` |
| 最新匯率（備援，GitHub Raw） | `https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json` |
| 歷史匯率 | `https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/{YYYY-MM-DD}.json` |
| OpenAPI 規格 | https://app.haotool.org/ratewise/openapi.json |

- **免 API Key**、**公開讀取**、**CORS 已啟用**；資料使用與再散布依各 provider 條款。
- v3 current pointer 只有在 data branch 啟用發布 gate 後才會存在；未啟用時請使用明確標示的 legacy adapter。
- 更新頻率：約每 5 分鐘檢查 provider；canonical v3 release 以 manifest 與 SHA-256 objects 綁定。
- v3 quote 使用 fromCurrency → toCurrency 與 decimal string rate；legacy latest/history 僅作相容投影。

## 呼叫範例

### curl（v3 pointer）

```bash
curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/v3/current.json | jq .
```

### curl（legacy adapter）

```bash
curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | jq '.details.USD'
```

### JavaScript / Node.js

```javascript
const res = await fetch('https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/v3/current.json');
const current = await res.json();
// 依 current.manifest 讀取並驗證 manifest/object SHA-256，再使用 snapshot.quotes。
console.log(current.releaseId);
```

### Python

```python
import urllib.request, json
url = 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/v3/current.json'
with urllib.request.urlopen(url) as r:
    data = json.loads(r.read())
print(data['releaseId'])
```

## legacy adapter 資料格式

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

- v3 `QuoteSnapshot.fromCurrency`：來源幣別
- v3 `QuoteSnapshot.toCurrency`：目標幣別
- v3 `QuoteSnapshot.rate`：每 1 來源幣可取得的目標幣 decimal string
- v3 `sourceQuote`：現金/即期、通路、來源發布時間與擷取時間等適用條件

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

新整合請先 GET v3 current pointer（https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/v3/current.json），再依 manifest 的 SHA-256 references 讀取 provider snapshot；每筆 quote 以 fromCurrency、toCurrency、rate（每 1 來源幣可取得的目標幣 decimal string）表達。https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json 仍保留作 legacy adapter，不能取代 v3 hash chain。

### 2. jsDelivr CDN 和 GitHub Raw 端點有何差異？

jsDelivr CDN（建議）：全球 PoP 節點加速，無明確請求上限；GitHub Actions 每次推送 data 分支後自動呼叫 jsDelivr Purge API，CDN 快取立即失效，實際新鮮度約 5 分鐘。GitHub Raw（備援）：無快取，每次請求直接取得最新版本，但每小時限 60 次請求。瀏覽器端建議以 HTTP cache 搭配 client 端 5 分鐘快取控制重複請求。

### 3. 有備援端點嗎？

有。v3 current pointer 與 immutable objects 同時提供 jsDelivr CDN 與 GitHub Raw；CDN 不可用時可沿同一 manifest path 改讀 https://raw.githubusercontent.com/haotool/app/data/public/rates/v3/current.json 與 raw objects，並在使用前驗證 SHA-256。legacy adapter 備援端點為 `https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json`。

### 4. 如何查詢歷史匯率？

將日期代入路徑：`https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/2026-03-19.json`，支援 18 種貨幣歷史資料。若該日無資料（如假日），伺服器回傳 404。

---

_本 Markdown 鏡像由 `scripts/generate-markdown-mirrors.mjs` 於 build 時自動產生（v2.28.2），與 HTML 頁面語義一致。_
_正式人眼版本請見對應 HTML URL。_
