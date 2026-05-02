/**
 * AI crawler governance SSOT。
 *
 * robots.txt 與 llms.txt 必須共用同一份清單，避免 Claude-User / OAI-SearchBot
 * 這類搜尋與使用者代理角色在不同產出物漂移。
 */

export const AI_CRAWLER_TIERS = [
  {
    id: 'training',
    label: 'Tier 1: TRAINING (基礎模型訓練語料)',
    bots: [
      'GPTBot',
      'ClaudeBot',
      'anthropic-ai',
      'Google-Extended',
      'Applebot-Extended',
      'Amazonbot',
      'Bytespider',
      'CCBot',
      'cohere-ai',
      'FacebookBot',
      'Meta-ExternalAgent',
      'Timpibot',
      'ProRataInc',
      'Novellum AI Crawl',
      'DeepSeekBot',
      'MistralBot',
    ],
  },
  {
    id: 'search',
    label: 'Tier 2: SEARCH (AI 搜尋索引與引用)',
    bots: [
      'OAI-SearchBot',
      'Claude-SearchBot',
      'PerplexityBot',
      'Applebot',
      'Google-CloudVertexBot',
      'DuckAssistBot',
    ],
  },
  {
    id: 'user-agent',
    label: 'Tier 3: USER_AGENT (使用者觸發即時抓取)',
    bots: [
      'ChatGPT-User',
      'Claude-User',
      'Perplexity-User',
      'MistralAI-User',
      'Manus-User',
      'Meta-ExternalFetcher',
      'Cloudflare-AutoRAG',
      'Anchor Browser',
    ],
  },
  {
    id: 'preview-other',
    label: 'Tier 4: PREVIEW / OTHER (社群預覽與其他)',
    bots: [
      'facebookexternalhit',
      'Twitterbot',
      'LinkedInBot',
      'archive.org_bot',
      'Terracotta Bot',
      'PhindBot',
      'YouBot',
      'GrokBot',
      'PetalBot',
    ],
  },
];

export const ALL_AI_CRAWLERS = [...new Set(AI_CRAWLER_TIERS.flatMap((tier) => tier.bots))];
