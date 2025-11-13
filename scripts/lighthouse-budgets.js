/* eslint-env node */
/**
 * Lighthouse Performance Budgets
 *
 * 定義三種專案規模的效能預算閾值
 * - small: 小型專案 (< 5,000 行程式碼)
 * - medium: 中型專案 (5,000 - 50,000 行)
 * - large: 大型專案 (> 50,000 行)
 *
 * 閾值說明:
 * - performance: Lighthouse Performance Score (0-100)
 * - lcp: Largest Contentful Paint (毫秒)
 * - fcp: First Contentful Paint (毫秒)
 * - cls: Cumulative Layout Shift (分數)
 * - inp: Interaction to Next Paint (毫秒, 2025 Core Web Vitals)
 * - tbt: Total Blocking Time (毫秒)
 * - bundle-initial: 初始 Bundle 大小 (KB)
 * - bundle-total: 總 Bundle 大小 (KB)
 *
 * 參考標準:
 * - Core Web Vitals: https://web.dev/articles/vitals
 * - INP 標準: https://web.dev/articles/inp
 * - Lighthouse Scoring: https://developer.chrome.com/docs/lighthouse/performance/performance-scoring
 *
 * 最後更新: 2025-11-13
 * 版本: v1.0.0
 */

module.exports = {
  /**
   * 小型專案預算 (< 5,000 行程式碼)
   * 適用於簡單的單頁應用或工具型網站
   */
  small: {
    performance: 80, // Performance Score 最低 80
    lcp: 2500, // LCP < 2.5s (Good)
    fcp: 1800, // FCP < 1.8s (Good)
    cls: 0.1, // CLS < 0.1 (Good)
    inp: 200, // INP < 200ms (Good, 2025 標準)
    tbt: 200, // TBT < 200ms (Good)
    'bundle-initial': 200, // 初始 Bundle < 200KB
    'bundle-total': 500, // 總 Bundle < 500KB
  },

  /**
   * 中型專案預算 (5,000 - 50,000 行)
   * 適用於功能豐富的 SPA 或多頁應用
   */
  medium: {
    performance: 90, // Performance Score 最低 90
    lcp: 2500, // LCP < 2.5s (Good)
    fcp: 1500, // FCP < 1.5s (Good)
    cls: 0.1, // CLS < 0.1 (Good)
    inp: 200, // INP < 200ms (Good, 2025 標準)
    tbt: 150, // TBT < 150ms (Good)
    'bundle-initial': 300, // 初始 Bundle < 300KB
    'bundle-total': 800, // 總 Bundle < 800KB
  },

  /**
   * 大型專案預算 (> 50,000 行)
   * 適用於企業級應用或複雜系統
   */
  large: {
    performance: 95, // Performance Score 最低 95
    lcp: 2000, // LCP < 2.0s (Good)
    fcp: 1200, // FCP < 1.2s (Good)
    cls: 0.05, // CLS < 0.05 (Good)
    inp: 200, // INP < 200ms (Good, 2025 標準)
    tbt: 100, // TBT < 100ms (Excellent)
    'bundle-initial': 500, // 初始 Bundle < 500KB
    'bundle-total': 1500, // 總 Bundle < 1.5MB
  },
};
