---
'@app/ratewise': patch
---

修復多幣別模式 best provider 決策漂移：`resolveEffectiveRateSourceForConversion`
新增 `providerSelectionMode` 參數，當使用者偏好為 `best` 模式且該 row pair
有可用換錢所匯率時自動套用換錢所（過去只看 legacy `rateSource`，導致
best-provider 選到 MoneyBox 的 TWD/KRW pair 在多幣別頁仍用銀行匯率）。
單元測試補三組組合覆蓋（best 有/無 quote、manual 維持使用者選擇）。
