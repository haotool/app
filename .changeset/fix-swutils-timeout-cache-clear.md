---
'@app/ratewise': patch
---

修正 forceHardReset timeout fallback 未清快取的回歸

舊版 SW 無 FORCE_HARD_RESET handler 時，3 秒 timeout 僅重載未清快取，
導致使用者重整到同一批舊快取。修正：timeout 改為先清 Cache Storage 再重載。
