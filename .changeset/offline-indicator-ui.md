---
'@app/ratewise': minor
---

feat(ui): 離線模式指示器組件

**新增功能**: 網路連線狀態視覺指示器

**設計**:

- 位置：固定於視窗頂部中央 (z-index: 9999)
- 風格：深色背景 + 警告色邊框 + 光暈裝飾
- 圖標：WifiOff (lucide-react)
- 動畫：與 UpdatePrompt 一致的進場/退場效果

**功能**:

1. 使用 `navigator.onLine` API 監控網路連線狀態
2. 離線時自動顯示，恢復連線時自動隱藏
3. 可手動關閉（點擊關閉按鈕或整個指示器）
4. 重新離線時重新顯示（重置 dismissed 狀態）

**技術實作**:

- 整合 `notificationTokens` 統一設計系統
- motion/react 動畫 + useReducedMotion 無障礙支援
- SSR 安全（伺服器端不渲染）
- 無障礙支援（role="status", aria-live="polite"）
- i18n 支援（useTranslation + fallback 中文）
- logger 記錄網路狀態變更

**驗證**: typecheck ✅、build ✅
