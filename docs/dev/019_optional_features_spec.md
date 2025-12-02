# 可選功能規格文檔

**版本**: v1.0.0
**建立日期**: 2025-12-03
**最後更新**: 2025-12-03T00:25:00+0800
**狀態**: 📋 規劃中

---

## 📋 概述

本文檔定義剩餘可選功能的詳細規格，供未來實作參考。
所有功能均經過 Linus 三問驗證，確認為「非必要但有價值」的優化項目。

---

## 1. Guide 頁面擴充

### 1.1 功能描述

擴充 `/guide/` 頁面內容，從約 500 字增加到約 2000 字，提供更詳細的使用教學。

### 1.2 API 介面

無 API 變更，純前端內容更新。

### 1.3 驗收標準

```gherkin
Feature: Guide 頁面擴充

  Scenario: 使用者閱讀詳細指南
    Given 使用者開啟 /guide/ 頁面
    When 頁面載入完成
    Then 應顯示至少 8 個步驟的教學
    And 內容應包含圖文說明
    And HowTo schema 應包含 8 個步驟

  Scenario: SEO 驗證
    Given Guide 頁面已更新
    When 執行 Lighthouse SEO 掃描
    Then SEO 分數應維持 100/100
```

### 1.4 預估時間

- 開發: 45 分鐘
- 測試: 15 分鐘
- 總計: 1 小時

### 1.5 優先級

P2 (可選) - 對 SEO 有幫助但非必要

---

## 2. 國際化 (i18n)

### 2.1 功能描述

新增英文 (en)、日文 (ja)、韓文 (ko) 版本，擴大目標用戶群。

### 2.2 API 介面

```typescript
// src/i18n/types.ts
type Locale = 'zh-TW' | 'en' | 'ja' | 'ko';

interface I18nConfig {
  defaultLocale: Locale;
  locales: Locale[];
  fallbackLocale: Locale;
}

// src/i18n/translations.ts
interface Translations {
  common: {
    title: string;
    description: string;
    // ...
  };
  faq: {
    questions: Array<{
      question: string;
      answer: string;
    }>;
  };
  // ...
}
```

### 2.3 路由結構

```
/              → 繁體中文 (預設)
/en/           → English
/ja/           → 日本語
/ko/           → 한국어
/en/faq/       → English FAQ
/ja/faq/       → 日本語 FAQ
/ko/faq/       → 한국어 FAQ
// ... 其他頁面
```

### 2.4 驗收標準

```gherkin
Feature: 國際化支援

  Scenario: 英文版本
    Given 使用者開啟 /en/ 頁面
    When 頁面載入完成
    Then 所有文字應為英文
    And hreflang 應正確配置
    And lang 屬性應為 "en"

  Scenario: hreflang 配置
    Given 任意語言版本頁面
    When 檢查 HTML head
    Then 應包含所有語言版本的 hreflang
    And 應包含 x-default 指向預設語言
```

### 2.5 預估時間

- 架構設計: 1 小時
- 英文翻譯: 2 小時
- 日文翻譯: 2 小時
- 韓文翻譯: 2 小時
- 測試驗證: 1 小時
- 總計: 8 小時

### 2.6 優先級

P3 (可選) - 擴大用戶群但需要較多資源

---

## 3. 依賴升級

### 3.1 react-helmet-async 升級

**當前版本**: 1.3.0
**目標版本**: 2.x (待上游支援 React 19)

**風險評估**:

- 高風險
- 需等待上游更新
- 可能影響 SSG 功能

**監控**: https://github.com/staylor/react-helmet-async/issues

### 3.2 react-router-dom v7 升級

**當前版本**: 6.30.1
**目標版本**: 7.x

**必要步驟**:

1. 啟用 future flags
2. 更新 imports
3. 驗證所有路由功能

**風險評估**:

- 中等風險
- 建議等待 React 19 生態系穩定

**監控**: https://github.com/remix-run/react-router/releases

### 3.3 tailwindcss v4 升級

**當前版本**: 3.4.18
**目標版本**: 4.x

**必要步驟**:

1. 升級 PostCSS
2. 更新 opacity modifier 語法
3. 檢查顏色別名變更
4. 視覺回歸測試

**風險評估**:

- 中等風險
- 可能影響 UI 外觀

**監控**: https://tailwindcss.com/docs/upgrade-guide

---

## 4. 決策記錄

### 4.1 為何這些功能是「可選」？

依照 Linus 三問驗證：

1. **「這是個真問題還是臆想出來的？」**
   - Guide 擴充: 有價值但當前內容已足夠
   - 國際化: 有價值但當前目標用戶為台灣
   - 依賴升級: 當前版本穩定，無急迫需求

2. **「有更簡單的方法嗎？」**
   - 維持現狀是最簡單的方法
   - 等待上游穩定再升級更安全

3. **「會破壞什麼嗎？」**
   - 強制升級可能引入 breaking changes
   - 國際化需要大量翻譯資源

### 4.2 建議執行順序

1. Guide 頁面擴充 (1 hr, 低風險)
2. 國際化 - 英文版 (4 hr, 中風險)
3. 依賴升級 (等待上游穩定)

---

## 參考資料

1. [LINUS_GUIDE.md](../LINUS_GUIDE.md)
2. [SEO_TODO.md](./SEO_TODO.md)
3. [AI_SEARCH_OPTIMIZATION_SPEC.md](./AI_SEARCH_OPTIMIZATION_SPEC.md)
4. [002_development_reward_penalty_log.md](./002_development_reward_penalty_log.md)

---

**最後更新**: 2025-12-03T00:25:00+0800
**維護者**: Agent (Automated Best Practice Implementation Expert)
