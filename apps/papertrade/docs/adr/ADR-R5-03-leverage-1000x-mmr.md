# ADR-R5-03：槓桿上限 1000x 與有效維持保證金率修正

- 狀態：Accepted
- 日期：2026-07-19
- 範圍：`LEVERAGE_MAX`／presets、`effectiveMaintenanceMarginRate`、`liquidationPrice`、LeverageSheet log-scale 滑桿與風險提示

## 背景

R5-10 要求槓桿上限由 125x 提升至 1000x。直接放大上限會撞上既有強平模型的結構矛盾：

- 初始保證金率 ＝ `1/leverage`；1000x 時僅 0.1%。
- 既有維持保證金率（MMR）固定 0.5%。
- long 強平價公式 `entry × (1 − 1/lev + MMR)`：當 `MMR > 1/lev`（即 lev > 200）強平價高於開倉價，
  200x–1000x 一開倉即觸發強平；125x–200x 雖不即爆，但可承受波動被固定 MMR 過度侵蝕。

## 決策

1. `LEVERAGE_MAX` 125→1000；presets 改 `[1, 10, 25, 50, 100, 200, 500, 1000]`。
2. 有效 MMR 收斂單點 SSOT：`effectiveMaintenanceMarginRate(leverage) = min(0.005, 0.5 / leverage)`
   （即「初始保證金率之半」為上限）；`liquidationPrice` 一律經此函式取 MMR，
   全 repo 不再直接以 `MAINTENANCE_MARGIN_RATE` 參與強平運算。
3. 滑桿改 log-scale：slider 原始值 0–100 線性，`leverage = round(1000^(t/100))`；
   映射抽 `lib/leverageScale.ts` 純函式（`sliderToLeverage`／`leverageToSlider`），round-trip 測試鎖行為；
   `aria-valuetext` 回報實際倍數。
4. 風險提示：>100x（`HIGH_LEVERAGE_THRESHOLD`）時 LeverageSheet 顯示 warning 文案、
   數字與 TradePage 槓桿 pill 轉 warning 色。

## 論證

- `min(0.005, 0.5/lev)` 保證任何合法槓桿下 `MMR ≤ 初始保證金率之半`：
  強平永遠發生在保證金侵蝕到一半之前的反向波動處，`1 − 1/lev + mmr < 1` 恆成立，開倉即強平不可能發生。
- ≤100x 完全不變（0.5/100 = 0.005 與固定值相等），既有低槓桿行為與測試零回歸；
  125x 起有效 MMR 隨槓桿遞減，等同 Bybit 風險限額梯度（高槓桿→低 MMR 檔位）的簡化版。
- 強平距離 `entry × (1/lev − mmr)` 隨槓桿嚴格單調遞減（math 測試覆蓋 125/500/1000x），
  1000x 強平距離為開倉價之 0.05%，風險語義正確傳達極高槓桿的脆弱性。
- log-scale 滑桿：1–1000 線性映射會讓 1–25x 常用區間擠在軌道前 2.5%，log 映射使低倍段佔一半行程，
  presets 快捷鈕仍可直接設定精確檔位。

## 後果

- Position schema 的 leverage 上限隨 `LEVERAGE_MAX` 常數放寬，persist 舊資料（≤125x）天然相容，無需遷移。
- 表單錯誤文案同步為「槓桿須在 1–1000 倍之間」。
