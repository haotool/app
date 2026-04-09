// 非索引頁不輸出結構化資料。
// 避免 duplicate URL 擴散 schema 訊號。
export function shouldRenderStructuredData(robots: string): boolean {
  return !robots.toLowerCase().includes('noindex');
}
