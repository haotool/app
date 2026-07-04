/**
 * Sitemap / robots.txt / llms.txt 生成腳本（SSOT：app.config.mjs）
 * llms.txt 為佔位版；Answer Capsule 與 E-E-A-T 文案終稿由後續 wave 補齊。
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_PATHS, SITE_CONFIG } from '../app.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUILD_TIMESTAMP = new Date().toISOString();

const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'cohere-ai',
  'CCBot',
  'Bytespider',
];

const SOCIAL_BOTS = [
  'Meta-ExternalAgent',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
];

const SUB_APPS = ['ratewise', 'split-meow', 'park-keeper', 'nihonname', 'quake-school'];

const SITEMAP_URLS = [
  `${SITE_CONFIG.url}sitemap.xml`,
  ...SUB_APPS.map((app) => `${SITE_CONFIG.appsHostUrl}${app}/sitemap.xml`),
];

const TOOL_LINES = [
  `- [HaoRate 匯率好工具](${SITE_CONFIG.appsHostUrl}ratewise/): 台銀銀行賣出價即時換算，30 天趨勢圖，離線可用`,
  `- [喵喵分帳 Split Meow](${SITE_CONFIG.appsHostUrl}split-meow/): 貓咪主題旅遊分帳，費用分類、一鍵分享結算結果`,
  `- [停車好工具 ParkKeeper](${SITE_CONFIG.appsHostUrl}park-keeper/): GPS 記錄車位、羅盤導航回車，多語系、離線優先`,
  `- [日本名字產生器 NihonName](${SITE_CONFIG.appsHostUrl}nihonname/): 中文姓氏產生道地日文名，100+ 漢姓對照`,
  `- [地震知識小學堂](${SITE_CONFIG.appsHostUrl}quake-school/): 18 道互動測驗＋動畫，離線防災學習`,
];

function buildUrlXml(pathname) {
  const absoluteUrl = new URL(pathname, SITE_CONFIG.url).toString();

  return `  <url>
    <loc>${absoluteUrl}</loc>
    <lastmod>${BUILD_TIMESTAMP}</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${absoluteUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl}" />
  </url>`;
}

function buildBotSection(bots) {
  return bots.map((bot) => `User-agent: ${bot}\nAllow: /`).join('\n\n');
}

function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${SEO_PATHS.map((pathname) => buildUrlXml(pathname)).join('\n')}
</urlset>
`;

  writeFileSync(resolve(ROOT, 'public/sitemap.xml'), sitemap);
  console.log('✅ haotool sitemap.xml 已由 SSOT 重新生成');
}

function generateRobotsTxt() {
  const robotsTxt = `# ${SITE_CONFIG.name} — Robots Exclusion Protocol
# ${SITE_CONFIG.url}
# 最後更新：${BUILD_TIMESTAMP.slice(0, 10)}

User-agent: *
Allow: /
Disallow: /sw.js
Disallow: /workbox-*.js
Content-Signal: ai-train=no, search=yes, ai-input=no

${SITEMAP_URLS.map((url) => `Sitemap: ${url}`).join('\n')}

${buildBotSection(AI_BOTS)}

${buildBotSection(SOCIAL_BOTS)}
`;

  writeFileSync(resolve(ROOT, 'public/robots.txt'), robotsTxt.trimEnd() + '\n');
  console.log('✅ haotool robots.txt 已由 SSOT 重新生成');
}

function generateLlmsTxt() {
  const llmsTxt = `# ${SITE_CONFIG.name}

> ${SITE_CONFIG.description}

最後更新：${BUILD_TIMESTAMP.slice(0, 10)}

## 工具（Featured Tools）

${TOOL_LINES.join('\n')}

## 核心頁面（Core Pages）

${SEO_PATHS.map((pathname) => `- ${new URL(pathname, SITE_CONFIG.url).toString()}`).join('\n')}

## 聯繫（Contact）

- Email: haotool.org@gmail.com
- GitHub: https://github.com/haotool/app
- Threads: https://www.threads.net/@azlife_1224

## 授權（License）

GPL-3.0 — 全部工具免費、開源、不收集個資。
`;

  writeFileSync(resolve(ROOT, 'public/llms.txt'), llmsTxt);
  console.log('✅ haotool llms.txt 已由 SSOT 重新生成（佔位版）');
}

generateSitemap();
generateRobotsTxt();
generateLlmsTxt();
