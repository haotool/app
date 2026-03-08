---
'@app/ratewise': patch
---

修復收藏頁面 TWD 固定顯示與拖曳互動問題

- 新台幣（TWD）永遠固定在收藏頁面第一位，不可移除
- TWD 顯示固定實心星（裝飾用，非互動按鈕）並標示「基準幣」
- 收藏幣別的星號改為獨立切換按鈕，與拖曳區域分離
- 幣別名稱到換算按鈕之間的空間改為拖曳手柄（cursor-grab）
- Store 層防護：toggleFavorite('TWD') 為完全 no-op
- \_\_validateAndSanitize 自動清除損壞資料中的 TWD
- 抽出 favorites-utils.ts 提升工具函式可測試性（7 個新測試）
