---
'@app/ratewise': patch
---

補強 forceServiceWorkerUpdate() 離線防護：離線時跳過 SKIP_WAITING，防止版本撕裂導致 Load failed。
