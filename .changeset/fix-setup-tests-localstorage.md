---
'@app/ratewise': patch
---

修復 setupTests 在 forks pool 模式下 localStorage 未初始化問題

- 在 setupTests.ts 頂層呼叫 ensureStorage，確保 Zustand persist middleware 於模組載入時即可存取有效的 localStorage
