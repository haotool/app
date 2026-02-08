---
'@app/ratewise': patch
---

fix(test): ResizeObserver mock 需使用 function 關鍵字以支援 new 構造

**問題**:

- DecemberTheme 測試失敗 (6/14 tests failing)
- TypeError: "is not a constructor"
- 原因: `vi.fn().mockImplementation(() => {})` 回傳箭頭函數，無法作為建構子

**修正**:

- 改用 function 關鍵字: `vi.fn(function() {})`
- 符合 Vitest 4+ 建構子模擬規範
- 所有 1386 測試通過

**參考**:

- https://vitest.dev/api/vi#vi-spyon
- Vitest error: "The vi.fn() mock did not use 'function' or 'class' in its implementation"
