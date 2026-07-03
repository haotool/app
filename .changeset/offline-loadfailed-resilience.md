---
'@app/ratewise': patch
---

- 修復弱網或版本更新時誤入「離線頁」的問題：資源載入失敗不再清除離線快取，改為自動套用新版後重新載入
- 消除「Unexpected Application Error / Load failed」錯誤畫面：全路由掛上品牌化錯誤防線，偵測到新版本時自動恢復，離線時顯示友善提示並於連線恢復後自動重試
