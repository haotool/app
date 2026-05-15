---
'@app/ratewise': patch
---

換錢所（MoneyBox）趨勢線改用 aggregate endpoint：與台銀 history-30d.json SSOT 一致，命中時 30 個 daily fetch 收斂為 1 個（runtime AB 量到 50→1 requests、~5,049ms→~2ms）。aggregate 不存在時自動退回原本逐日 fetch 路徑，行為無回歸。
