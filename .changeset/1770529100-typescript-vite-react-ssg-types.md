---
'@app/ratewise': patch
---

fix(types): vite-react-ssg 類型定義與測試 mock

- 修正 ViteReactSSG 函數簽名：接受 options 物件而非 App component
- 新增 SSGContext 介面定義 isClient 型別
- ClientOnly children 支援 function 型別避免 TypeScript 錯誤
- 新增測試環境 vite-react-ssg mock 實作
- 所有測試通過：1364/1364 ✅
