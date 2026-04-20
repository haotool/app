---
'@app/ratewise': minor
---

新增 AEO/GEO 快速答案覆蓋（Answer Capsule）

- 首頁加入 `answerCapsule`：3 個核心 Q&A（台銀匯率類型、賣出價/中間價、現金/即期差異）
- FAQ 頁加入 `answerCapsule`：3 個高頻 Q&A（現金/即期差異、買入/賣出判別、DCC 說明）
- 新增 `AnswerCapsule` 元件：自足式答案區塊，AI 引擎可直接引用
- 將 vite.config.ts 的 PWA manifest 配置移至 generate-manifest.mjs（SSOT 原則）
- 新增 5 個測試案例驗證 answerCapsule 整合
