import { describe, expect, it } from 'vitest';
import {
  SEO_TITLE,
  SEO_DESCRIPTION,
  SITE_URL,
  SITE_NAME,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  WORLD_ZONES,
  buildJsonLd,
  buildSeoHead,
  buildSeoBody,
} from './seo-metadata';

const BUILD_TIME = '2026-07-19T00:00:00.000Z';

describe('seo-metadata SSOT', () => {
  it('canonical URL 為 https 且帶 trailing slash', () => {
    expect(SITE_URL).toBe('https://app.haotool.org/starpuff/');
  });

  it('title 含品牌與利基詞、長度在 SERP 安全區間', () => {
    expect(SEO_TITLE).toContain('星噗噗');
    expect(SEO_TITLE).toContain('StarPuff');
    expect(SEO_TITLE).toContain('動作');
    expect(SEO_TITLE.length).toBeGreaterThanOrEqual(20);
    expect(SEO_TITLE.length).toBeLessThanOrEqual(40);
  });

  it('description 長度在 110-160 字區間（掃描器門檻）且前 90 字承載核心賣點（SERP 顯示帶）', () => {
    expect(SEO_DESCRIPTION.length).toBeGreaterThanOrEqual(110);
    expect(SEO_DESCRIPTION.length).toBeLessThanOrEqual(160);
    const serpWindow = SEO_DESCRIPTION.slice(0, 90);
    for (const keyword of ['免費', '網頁遊戲', '橫向捲軸', '動作']) {
      expect(serpWindow).toContain(keyword);
    }
    for (const keyword of ['離線', 'PWA', '魔王', '免下載']) {
      expect(SEO_DESCRIPTION).toContain(keyword);
    }
  });

  it('文案不含 emoji', () => {
    const emojiPattern = /\p{Extended_Pictographic}/u;
    expect(emojiPattern.test(SEO_TITLE)).toBe(false);
    expect(emojiPattern.test(SEO_DESCRIPTION)).toBe(false);
    expect(emojiPattern.test(buildSeoBody())).toBe(false);
  });

  it('五區二十關與五魔王對照完整', () => {
    expect(WORLD_ZONES).toHaveLength(5);
    const bosses = WORLD_ZONES.map((z) => z.boss).join('');
    for (const name of ['果凍王', '暗月蝠王', '稜晶雙子', '熔糖窯后', '蝕星魔核']) {
      expect(bosses).toContain(name);
    }
    expect(WORLD_ZONES[WORLD_ZONES.length - 1]?.levels).toBe('L17-L20');
  });
});

describe('buildJsonLd', () => {
  const graph = buildJsonLd(BUILD_TIME)['@graph'];

  it('僅含 VideoGame 與 BreadcrumbList 各一，禁止重複 @type', () => {
    const types = graph.map((node) => node['@type']);
    expect(types).toEqual(['VideoGame', 'BreadcrumbList']);
    expect(new Set(types).size).toBe(types.length);
  });

  it('VideoGame 標示免費、繁中、單人網頁遊戲且不含虛構評分', () => {
    const game = graph[0]!;
    expect(game['isAccessibleForFree']).toBe(true);
    expect(game['inLanguage']).toBe('zh-TW');
    expect(game['playMode']).toBe('https://schema.org/SinglePlayer');
    expect(game['dateModified']).toBe(BUILD_TIME);
    expect((game['offers'] as Record<string, unknown>)['price']).toBe('0');
    expect(game).not.toHaveProperty('aggregateRating');
  });

  it('BreadcrumbList 由 HaoTool 首頁導向遊戲頁', () => {
    const breadcrumb = graph[1] as { itemListElement: { item: string; position: number }[] };
    expect(breadcrumb.itemListElement[0]?.item).toBe('https://haotool.org/');
    expect(breadcrumb.itemListElement[1]?.item).toBe(SITE_URL);
  });
});

describe('buildSeoHead / buildSeoBody', () => {
  const head = buildSeoHead(BUILD_TIME);
  const body = buildSeoBody();

  it('head 含 title/description/canonical/OG/Twitter/JSON-LD 全套', () => {
    expect(head).toContain(`<title>${SEO_TITLE}</title>`);
    expect(head).toContain('name="description"');
    expect(head).toContain(`<link rel="canonical" href="${SITE_URL}" />`);
    for (const tag of [
      'og:site_name',
      'og:title',
      'og:description',
      'og:type',
      'og:url',
      'og:locale',
      'og:image',
      'og:image:width',
      'og:image:height',
      'og:image:alt',
      'twitter:card',
      'twitter:title',
      'twitter:image',
    ]) {
      expect(head).toContain(tag);
    }
    expect(head).toContain('application/ld+json');
    expect(head).toContain(OG_IMAGE_URL);
  });

  it('og:image 為絕對網址 jpg，head 尺寸與 SSOT 常數閉環', () => {
    expect(OG_IMAGE_URL).toBe('https://app.haotool.org/starpuff/icons/og-image.jpg');
    expect(head).toContain(`<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />`);
    expect(head).toContain(`<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`);
  });

  it('body 語意內容常駐 DOM（非 noscript 內）且含特色/魔王/操作/PWA 與 E-E-A-T 連結', () => {
    const noscriptIndex = body.indexOf('<noscript>');
    const sectionIndex = body.indexOf('<section class="sp-seo-content sp-sr-only"');
    expect(sectionIndex).toBeGreaterThanOrEqual(0);
    expect(sectionIndex).toBeLessThan(noscriptIndex);
    expect(body).toContain('<h1>');
    for (const heading of ['遊戲特色', '五大區域與魔王', '操作方式', '安裝與離線遊玩']) {
      expect(body).toContain(heading);
    }
    for (const zone of WORLD_ZONES) {
      expect(body).toContain(zone.zone);
      expect(body).toContain(zone.boss);
    }
    for (const link of [
      'https://haotool.org/"',
      'https://haotool.org/about/"',
      'https://haotool.org/contact/"',
    ]) {
      expect(body).toContain(link);
    }
  });

  it('OG 標題由站名派生且與 SEO title 前綴一致', () => {
    expect(SEO_TITLE.startsWith(`${SITE_NAME}｜`)).toBe(true);
    expect(head).toContain(`<meta property="og:title" content="${SITE_NAME}｜`);
  });

  it('JSON-LD 可被解析且 @context 正確', () => {
    const match = /<script type="application\/ld\+json">(.+?)<\/script>/s.exec(head);
    expect(match).not.toBeNull();
    const parsed = JSON.parse(match?.[1] ?? '{}') as Record<string, unknown>;
    expect(parsed['@context']).toBe('https://schema.org');
  });
});
