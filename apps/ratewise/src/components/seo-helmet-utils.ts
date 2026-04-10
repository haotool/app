import type { JsonLdBlock } from '../config/seo-metadata';

// 非索引頁不輸出結構化資料。
// 避免 duplicate URL 擴散 schema 訊號。
export function shouldRenderStructuredData(robots: string): boolean {
  return !robots.toLowerCase().includes('noindex');
}

// schema.org: SpeakableSpecification 僅適用於 Article/WebPage 的 speakable 屬性，
// 不能作為獨立節點出現在 @graph（驗證器會忽略孤立節點）。
// 此函式在 @graph 組裝後修正此問題：把所有獨立的 SpeakableSpecification 節點
// 移除，並將其合併後的 cssSelector 注入到第一個相容父實體的 speakable 屬性中。
// 相容父實體優先順序：Article → TechArticle → WebPage。
// 注意：HowTo 不支援 speakable（schema.org 規範僅限 Article/WebPage）。
// 找不到時以 { '@type': 'WebPage', url } 作為後備容器。
const SPEAKABLE_PARENT_TYPES = ['Article', 'TechArticle', 'WebPage'];

export function attachSpeakableToGraph(nodes: JsonLdBlock[], canonicalUrl: string): JsonLdBlock[] {
  const speakables = nodes.filter((b) => b['@type'] === 'SpeakableSpecification');
  if (speakables.length === 0) return nodes;

  const rest = nodes.filter((b) => b['@type'] !== 'SpeakableSpecification');
  const cssSelector = speakables.flatMap((b) => {
    const s = b['cssSelector'];
    return Array.isArray(s) ? (s as string[]) : typeof s === 'string' ? [s] : [];
  });
  const speakableSpec: JsonLdBlock = { '@type': 'SpeakableSpecification', cssSelector };

  // 按優先順序查找父實體，而非位置順序。
  const parentIdx = (() => {
    for (const type of SPEAKABLE_PARENT_TYPES) {
      const idx = rest.findIndex((b) => b['@type'] === type);
      if (idx >= 0) return idx;
    }
    return -1;
  })();

  if (parentIdx >= 0) {
    return rest.map((b, i) => (i === parentIdx ? { ...b, speakable: speakableSpec } : b));
  }

  return [...rest, { '@type': 'WebPage', url: canonicalUrl, speakable: speakableSpec }];
}
