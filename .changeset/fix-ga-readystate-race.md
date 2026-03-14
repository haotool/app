---
'@app/ratewise': patch
---

fix(ratewise): 修正 GA 延後初始化競態條件

- 新增 document.readyState === 'complete' 防衛判斷
- 避免 BFCache 還原或快取頁面 load 已完成時 GA 永遠不觸發
