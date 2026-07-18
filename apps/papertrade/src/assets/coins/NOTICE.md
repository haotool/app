# 幣別 icon 來源聲明（NOTICE）

本目錄內全部 `*.svg` 幣別圖示 vendor 自下列上游專案，未做內容修改：

- 上游專案：[spothq/cryptocurrency-icons](https://github.com/spothq/cryptocurrency-icons)
- 取用路徑：`svg/color/<symbol>.svg`
- 上游 commit：`1a63530be6e374711a8554f31b17e4cb92c25fa5`（master，2022-08-22）
- 取用日期：2026-07-19
- 授權：**CC0-1.0（Creative Commons Zero v1.0 Universal，公有領域宣告）**
  — 見上游 [LICENSE.md](https://github.com/spothq/cryptocurrency-icons/blob/master/LICENSE.md)
  與 `package.json` 的 `"license": "CC0-1.0"` 欄位

## 入庫安全檢查（papertrade-security §R5 第 8 條）

全部檔案於 2026-07-19 入庫前逐檔檢查通過：

- 無 `<script` 標籤
- 無 `foreignObject` 元素
- 無外部 `href` / `xlink:href`（`ada.svg` 的 `href="#b"` 為檔內 fragment 引用，安全）

新增幣種 icon 時必須重複上述三項檢查後才可入庫，並更新本檔的上游 commit 與日期。
