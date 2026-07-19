// SEO SSOT：title/description/OG/JSON-LD/noscript 內容單一來源。
// index.html 的 SEO 區塊由 vite-seo-plugin 於建置期注入，禁止散落硬編。
// 站點文案取 app.config.mjs SITE_CONFIG、分區資料取 game/logic/zones，避免第二份事實。
import { SITE_CONFIG } from '../../app.config.mjs';
import { ZONES } from '../game/logic/zones';

export interface BossEntry {
  zone: string;
  levels: string;
  boss: string;
  bossEn: string;
  trait: string;
}

export const SITE_URL = SITE_CONFIG.url;
export const SITE_NAME = SITE_CONFIG.name;
export const SEO_TITLE = SITE_CONFIG.title;
export const SEO_DESCRIPTION = SITE_CONFIG.description;

export const OG_TITLE = '星噗噗 StarPuff｜免費橫向捲軸動作網頁遊戲';
export const OG_IMAGE_URL = `${SITE_URL}icons/og-image.jpg`;
export const OG_IMAGE_ALT =
  '星噗噗張大嘴吸入果凍怪，果凍王、暗月蝠王與蝕星魔核在背後壓陣的大戰場景';
export const SCREENSHOT_URL = `${SITE_URL}icons/screenshot-gameplay.jpg`;
export const DATE_PUBLISHED = '2026-07-14';

// 各區魔王行銷文案（區名與關卡區間由 zones.ts 推導，僅魔王描述在此維護）。
const ZONE_BOSSES: Record<number, Pick<BossEntry, 'boss' | 'bossEn' | 'trait'>> = {
  1: { boss: '果凍王 Jellord', bossEn: 'Jellord', trait: '果凍雨與地面震波的巨大果凍君主' },
  2: { boss: '暗月蝠王 Noctra', bossEn: 'Noctra', trait: '俯衝突襲與星屑彈幕的夜空蝠王' },
  3: { boss: '稜晶雙子 Prismix', bossEn: 'Prismix', trait: '雙血條同場作戰的稜晶孿生體' },
  4: { boss: '熔糖窯后 Syrona', bossEn: 'Syrona', trait: '噴泉洗牌與窯風三連的場控女王' },
  5: { boss: '蝕星魔核 Voidra', bossEn: 'Voidra', trait: '生存段與星核共鳴的最終魔王' },
};

// 五區二十關與魔王對照：分區資料直接取自遊戲內 ZONES SSOT。
export const WORLD_ZONES: BossEntry[] = ZONES.map((zone) => {
  const bossInfo = ZONE_BOSSES[zone.id];
  if (!bossInfo) throw new Error(`未定義魔王文案的分區 id：${zone.id}`);
  return {
    zone: zone.nameZh,
    levels: `L${zone.firstLevelId}-L${zone.lastLevelId}`,
    ...bossInfo,
  };
});

export const GAME_FEATURES = [
  '完全免費、無廣告、免註冊，開啟瀏覽器即玩',
  '五大區域二十道關卡，五大魔王與 EX 挑戰變體',
  '吸入果凍怪化為九系星彈：穿透、爆裂、雷鏈、緩速、迴旋與雙味混合配方',
  '星化變身爆發輸出，搭配漂浮、下砸等動作技巧',
  'PWA 可安裝到主畫面，離線也能完整遊玩',
  '手機觸控虛擬搖桿與桌機鍵盤皆支援，免轉向直握就能玩',
];

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface JsonLdGraph {
  '@context': string;
  '@graph': Record<string, unknown>[];
}

export function buildJsonLd(buildTimeIso: string): JsonLdGraph {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VideoGame',
        '@id': `${SITE_URL}#game`,
        name: '星噗噗',
        alternateName: 'StarPuff',
        url: SITE_URL,
        description: SEO_DESCRIPTION,
        image: OG_IMAGE_URL,
        screenshot: SCREENSHOT_URL,
        inLanguage: 'zh-TW',
        genre: ['橫向捲軸動作遊戲', 'Platformer'],
        gamePlatform: ['Web Browser', 'Progressive Web App'],
        playMode: 'https://schema.org/SinglePlayer',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        datePublished: DATE_PUBLISHED,
        dateModified: buildTimeIso,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'TWD',
          availability: 'https://schema.org/InStock',
        },
        author: {
          '@type': 'Organization',
          name: 'HaoTool 好工具',
          url: 'https://haotool.org/',
        },
        publisher: {
          '@type': 'Organization',
          name: 'HaoTool 好工具',
          url: 'https://haotool.org/',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'HaoTool 好工具',
            item: 'https://haotool.org/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '星噗噗 StarPuff',
            item: SITE_URL,
          },
        ],
      },
    ],
  };
}

// head 注入區塊：title/description/canonical/OG/Twitter/JSON-LD。
// viewport、theme-color、PWA meta 仍由 index.html 手寫維護（與 PWA 列車分界）。
export function buildSeoHead(buildTimeIso: string): string {
  const lines = [
    `<title>${escapeHtml(SEO_TITLE)}</title>`,
    `<meta name="description" content="${escapeHtml(SEO_DESCRIPTION)}" />`,
    `<link rel="canonical" href="${SITE_URL}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeHtml(OG_TITLE)}" />`,
    `<meta property="og:description" content="${escapeHtml(SEO_DESCRIPTION)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${SITE_URL}" />`,
    `<meta property="og:locale" content="zh_TW" />`,
    `<meta property="og:image" content="${OG_IMAGE_URL}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(OG_TITLE)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(SEO_DESCRIPTION)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE_URL}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
    `<script type="application/ld+json">${JSON.stringify(buildJsonLd(buildTimeIso))}</script>`,
  ];
  return lines.join('\n    ');
}

// body 注入區塊：sr-only H1（a11y 與爬蟲主標題）＋ noscript 靜態語意內容。
// noscript 供無 JS 爬蟲（GPTBot、ClaudeBot 等）與關閉 JS 的使用者閱讀，不影響遊戲載入與 CLS。
export function buildSeoBody(): string {
  const zoneItems = WORLD_ZONES.map(
    (z) =>
      `<li><strong>${escapeHtml(z.zone)}（${z.levels}）</strong>：魔王「${escapeHtml(z.boss)}」——${escapeHtml(z.trait)}。</li>`,
  ).join('\n          ');
  const featureItems = GAME_FEATURES.map((f) => `<li>${escapeHtml(f)}</li>`).join('\n          ');
  return `<h1 class="sp-sr-only">${escapeHtml(SEO_TITLE)}</h1>
    <noscript>
      <section class="sp-seo-content" lang="zh-TW">
        <p>
          星噗噗（StarPuff）是一款繁體中文原創 IP 的免費橫向捲軸動作網頁遊戲：操控 Q
          彈果凍球「噗噗」張大嘴吸入果凍怪、把牠們化為星彈反擊，一路闖越果凍星球的五大區域、二十道關卡，
          挑戰五位風格迥異的魔王。免下載、免安裝、免註冊，手機、平板與電腦開啟瀏覽器即可遊玩；
          支援 PWA 安裝到主畫面，離線也能完整進行遊戲。
        </p>
        <h2>遊戲特色</h2>
        <ul>
          ${featureItems}
        </ul>
        <h2>五大區域與魔王</h2>
        <ul>
          ${zoneItems}
        </ul>
        <h2>操作方式</h2>
        <p>
          手機以左半屏虛擬搖桿移動、右側 A 鍵跳躍（空中連按可漂浮）、B
          鍵吸入與發射星彈；桌機可用方向鍵搭配 Z / X 鍵。按鍵位置支援自訂，直握手機免轉向即可遊玩。
        </p>
        <h2>安裝與離線遊玩</h2>
        <p>
          星噗噗是 PWA（漸進式網頁應用程式）：在瀏覽器選單點選「加入主畫面」或「安裝」，
          即可像原生 App 一樣從桌面開啟；安裝後不需網路連線也能完整遊玩全部關卡。
        </p>
        <p>
          本遊戲需要啟用 JavaScript 才能執行。由
          <a href="https://haotool.org/">HaoTool 好工具</a>
          出品，完全免費且無廣告；開發團隊介紹見
          <a href="https://haotool.org/about/">關於我們</a>，回饋與問題回報見
          <a href="https://haotool.org/contact/">聯絡我們</a>。
        </p>
      </section>
    </noscript>`;
}
