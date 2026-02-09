---
'@app/ratewise': patch
---

使用 Motion x 屬性實現水平置中，避免 CSS transform 衝突

- 移除 CSS 的 -translate-x-1/2
- 改用 Motion 的 x: '-50%' 統一管理所有 transform
- 修正通知元件偏右問題，實現完美水平置中
