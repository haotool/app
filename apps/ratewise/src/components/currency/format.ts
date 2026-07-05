/** 幣別/金額頁共用數字格式（zh-TW 千分位）。 */

export function formatNum(n: number): string {
  return n.toLocaleString('zh-TW');
}
