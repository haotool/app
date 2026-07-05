---
'@app/ratewise': patch
---

修復 SW 註冊失敗環境（私密瀏覽、iOS Lockdown、WebView）下 app 殼層頁面的 register() 無上限重試風暴：註冊改為單例管理，單例重試最多 2 次（1 秒退避）＋頁面 inline 註冊，總計每次載入 ≤3 次，失敗後同 session 靜默降級；同場景「背景更新初始化失敗」提示文字改為可讀配色並於平板錨定主欄置中。
