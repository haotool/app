---
'@app/haotool': patch
'@app/nihonname': patch
'@app/park-keeper': patch
'@app/quake-school': patch
'@app/ratewise': patch
'@app/split-meow': patch
---

修正 Release workflow 的 tag 推送方式，避免 CI tag push 重複觸發 pre-push hook。
