# PaperTrade 紙上交易所

零風險模擬合約交易所：真實 Bybit 公開行情 × 模擬資金，練習加密貨幣永續合約交易。純前端 PWA，無後端、無帳號，模擬資產僅存於瀏覽器 localStorage。

- 正式站：<https://app.haotool.org/papertrade/>
- 免責聲明：本工具為純模擬交易，不涉及真實下單與金流，內容不構成投資建議。

## 開發指令

```bash
pnpm --filter @app/papertrade dev        # 開發伺服器
pnpm --filter @app/papertrade build      # typecheck + 產線建置
pnpm --filter @app/papertrade test:run   # 單元測試
pnpm --filter @app/papertrade test:e2e   # Playwright smoke（自動 build + preview）
pnpm --filter @app/papertrade typecheck
pnpm --filter @app/papertrade lint
```

## 數據源決策（SSOT）

| 面向             | 決策                                                                                                        | 依據                                                                                                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 即時行情 WS      | `wss://stream.bybit.com/v5/public/linear`                                                                   | 單一連線多 topic（`tickers`／`kline`／`orderbook.50`／`publicTrade`），20s ping、指數退避重連                                                                                                                                               |
| 歷史 K 線 REST   | `https://api.bybit.com/v5/market/kline` 直連                                                                | CORS 實證通過：`curl -sI -H "Origin: https://app.haotool.org" ".../v5/market/kline?..."` 回應含 `access-control-allow-origin: https://app.haotool.org`（反射 Origin）＋ `access-control-allow-credentials: true`（2026-07-15，Wave-1 驗證） |
| Binance fallback | **不採用**                                                                                                  | Bybit REST CORS 可直連，資料源單一化；若日後 Bybit 關閉 CORS，再啟用 PRD §4 的 `api.binance.com/api/v3/klines` fallback（需同步更新 CSP connect-src 與本節）                                                                                |
| 訂單簿一致性     | delta `u` 必須恰為前一則 `u+1`；`u=1` 視為服務重啟 snapshot 整簿覆寫；偵測缺口即清簿並重訂閱等待新 snapshot | [Bybit v5 orderbook 文件](https://bybit-exchange.github.io/docs/v5/websocket/public/orderbook)                                                                                                                                              |
| 資金費率         | 不模擬（PRD §8 descope）                                                                                    | 模擬帳戶不做 funding 結算，僅計開平倉手續費與強平                                                                                                                                                                                           |

CSP `connect-src` 白名單（security-headers worker 管理）：`wss://stream.bybit.com`、`https://api.bybit.com`。

## 部署注意事項

- SPA 路由名稱不得與 Vite 靜態產出目錄（`/assets/` 等）同名：nginx 會以目錄優先攔截硬導航回 403（R2 事故：`/assets` 已改名 `/portfolio`）。

## 架構速覽

- `src/config/`：市場常數與交易參數 SSOT（symbols、時框、費率、槓桿範圍）。
- `src/services/`：WS 單例（`marketWs`）、REST K 線、ticker／orderbook／publicTrade 解析（zod 寬鬆解析，異常訊息丟棄）。
- `src/engine/`：模擬撮合純函式（開平倉、TP/SL/追蹤、強平、手續費），單元測試守護全部數學。
- `src/stores/`：zustand v5（市場狀態、模擬帳戶 persist + zod 驗證與版本遷移）。
- 樣式 tokens 唯一定義於 `src/index.css` 的 `@theme`；全 app 禁止散落 hex。
