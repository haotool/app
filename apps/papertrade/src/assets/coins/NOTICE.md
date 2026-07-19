# 幣別 icon 來源聲明（NOTICE）

例外：`ppr.svg` 為本專案自製（虛構迷因幣 PPR 紙紙幣，見 `src/features/ppr/`），非上游 vendor。

本目錄內其餘 `*.svg` 幣別圖示 vendor 自下列上游專案：

- 上游專案：[spothq/cryptocurrency-icons](https://github.com/spothq/cryptocurrency-icons)
- 取用路徑：`svg/color/<symbol>.svg`
- 上游 commit：`1a63530be6e374711a8554f31b17e4cb92c25fa5`（master，2022-08-22）
- 取用日期：2026-07-19
- 授權：**CC0-1.0（Creative Commons Zero v1.0 Universal，公有領域宣告）**
  — 見上游 [LICENSE.md](https://github.com/spothq/cryptocurrency-icons/blob/master/LICENSE.md)
  與 `package.json` 的 `"license": "CC0-1.0"` 欄位

## 本地修改（R6-9，2026-07-19）：底色對齊官方品牌色

上游 icon 部分底色為舊版或非官方值，以下 fill 已修改對齊各幣官方 brand/press kit，
並與 `src/index.css` 的 `--color-accent-*` tokens 保持一致（來源連結為依據）：

| 檔案       | 修改內容                                                           | 官方依據                                                                                         |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `sol.svg`  | 綠圓 `#66F9A1` → 官方漸層 `#9945FF→#14F195`（新增 linearGradient） | [solana.com/branding](https://solana.com/branding)                                               |
| `xrp.svg`  | 黑圓保留 `#23292F`，加 `#EDEFF4` 35% 淺描邊（深色底可讀性）        | [XRP symbol（Ripple）](https://github.com/XRPLF/xrp-symbol)                                      |
| `bnb.svg`  | `#F3BA2F` → `#F0B90B`                                              | [bnbchain.org/en/brand-guidelines](https://www.bnbchain.org/en/brand-guidelines)                 |
| `ltc.svg`  | `#BFBBBB` → `#345D9D`（PMS 7684 C）                                | [Litecoin Brand Guidelines PDF](https://cryptologos.cc/brandbooks/litecoin-brand-guidelines.pdf) |
| `link.svg` | `#2A5ADA` → `#375BD2`（Chainlink Blue）                            | [chain.link Brand Assets（archive）](https://go.chain.link/archives/brand-assets)                |
| `ada.svg`  | 深藏青圓 `#0D1E30` → 官方 Cardano Blue `#0033AD`（Pantone 286）    | [cardano.org/brand-assets](https://cardano.org/brand-assets/)                                    |

未修改（複核與官方一致）：`btc.svg` `#F7931A`（[bitcoin.design](https://bitcoin.design/guide/getting-started/visual-language/)）、
`eth.svg` `#627EEA`、`doge.svg` `#C3A634`、`avax.svg` `#E84142`
（[support.avax.network Brand Assets](https://support.avax.network/en/articles/4132288-avalanche-brand-assets)）。

## 本地修改（R6-10，2026-07-19）：PPR 改為摺角便箋設計

`ppr.svg` 為本地二次修改（自製 icon，非上游）：原粉色泡泡設計改為紙視覺——
奶油紙色圓底 `#EDE6D6`＋中央摺角便箋（`#FFFBF5` 主體、右上摺角以深一階 `#DCD2BC` 作摺影）
＋紙面一條上升迷因走勢墨線（`#4A4237`）。與主 LOGO 同「紙」語彙但不混淆
（主 LOGO=紙飛機、PPR=摺角便箋，見 design SSOT R6-10/R6-11）。
三項安全檢查（無 script／foreignObject／外部 href）複檢通過。

## 入庫安全檢查（papertrade-security §R5 第 8 條）

全部檔案於 2026-07-19 入庫前逐檔檢查通過（R6-9 修改後複檢通過）：

- 無 `<script` 標籤
- 無 `foreignObject` 元素
- 無外部 `href` / `xlink:href`（`ada.svg` 的 `href="#b"` 與 `sol.svg` 的
  `url(#sol-brand)` 均為檔內 fragment 引用，安全）

新增或修改幣種 icon 時必須重複上述三項檢查後才可入庫，並更新本檔的上游 commit 與日期。
