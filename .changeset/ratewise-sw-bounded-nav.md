---
'@app/ratewise': patch
---

離線/弱網下導覽不再被卡住的網路請求拖住，避免長時間白屏。

- 網路成功時清除 8 秒 race timer，避免 orphan rejection 與 timer 洩漏。
