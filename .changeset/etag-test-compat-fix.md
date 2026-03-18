---
'@app/ratewise': patch
---

修正 ETag 條件式請求的測試相容性：response.headers 改用 optional chaining，修正 getCachedEntry() 例外傳播邏輯，確保快取損毀時正確觸發 logger.warn
