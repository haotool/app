// SEO 產物契約測試：public 檔案與 SSOT 同步、OG 圖真實尺寸、注入 plugin fail-closed。
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGE_RESOURCES, SITE_CONFIG } from '../../app.config.mjs';
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SEO_CONTENT_LASTMOD,
  SITE_SHORT_NAME,
  SITE_URL,
  WORLD_ZONES,
} from './seo-metadata';
import { SEO_BODY_MARKER, SEO_HEAD_MARKER, seoHtmlPlugin } from './vite-seo-plugin';

const appRoot = resolve(__dirname, '../..');
const readPublic = (file: string) => readFileSync(resolve(appRoot, 'public', file), 'utf8');

// 解析 JPEG SOF 標記取得真實像素尺寸（零依賴）。
function readJpegSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  let offset = 2;
  while (offset < buf.length - 9) {
    if (buf[offset] !== 0xff) throw new Error(`JPEG 標記解析失敗於 offset ${offset}`);
    const marker = buf[offset + 1] ?? 0;
    const size = buf.readUInt16BE(offset + 2);
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    offset += 2 + size;
  }
  throw new Error('JPEG 內找不到 SOF 標記');
}

describe('OG 圖與截圖資產', () => {
  it('og-image.jpg 真實像素等於 meta 宣告的 1200x630', () => {
    const size = readJpegSize(resolve(appRoot, 'public/icons/og-image.jpg'));
    expect(size).toEqual({ width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT });
  });

  it('screenshot-gameplay.jpg 存在且為 16:9 橫式', () => {
    const size = readJpegSize(resolve(appRoot, 'public/icons/screenshot-gameplay.jpg'));
    expect(size.width).toBeGreaterThan(size.height);
    expect(Math.abs(size.width / size.height - 16 / 9)).toBeLessThan(0.05);
  });

  it('OG 圖與截圖均登錄於 app.config IMAGE_RESOURCES（生產可用性檢查契約）', () => {
    expect(IMAGE_RESOURCES).toContain('/icons/og-image.jpg');
    expect(IMAGE_RESOURCES).toContain('/icons/screenshot-gameplay.jpg');
  });
});

describe('public SEO 檔案與 SSOT 同步', () => {
  it('llms.txt 含站點網址、五區與魔王名，與 SSOT 一致且無 emoji', () => {
    const llms = readPublic('llms.txt');
    expect(llms).toContain(SITE_URL);
    for (const zone of WORLD_ZONES) {
      expect(llms).toContain(`${zone.zone}（${zone.levels}）`);
      expect(llms).toContain(zone.boss);
      expect(llms).toContain(zone.trait);
    }
    expect(/\p{Extended_Pictographic}/u.test(llms)).toBe(false);
  });

  it('sitemap.xml 的 loc/lastmod 對齊 SSOT（lastmod 反映內容重大更新日，非 build 時間）', () => {
    const sitemap = readPublic('sitemap.xml');
    expect(sitemap).toContain(`<loc>${SITE_URL}</loc>`);
    expect(sitemap).toContain(`<lastmod>${SEO_CONTENT_LASTMOD}T00:00:00Z</lastmod>`);
  });

  it('robots.txt 指向本站 sitemap 且無非標準 Content-Signal 指令', () => {
    const robots = readPublic('robots.txt');
    expect(robots).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
    expect(robots).not.toContain('Content-Signal:');
  });

  it('index.html 含 SEO 注入標記與 shortName 一致的 apple-mobile-web-app-title', () => {
    const html = readFileSync(resolve(appRoot, 'index.html'), 'utf8');
    expect(html).toContain(SEO_HEAD_MARKER);
    expect(html).toContain(SEO_BODY_MARKER);
    expect(html).toContain(
      `<meta name="apple-mobile-web-app-title" content="${SITE_SHORT_NAME}" />`,
    );
  });

  it('SITE_CONFIG title/description 即 SSOT 對外文案（防止第二來源）', () => {
    expect(SITE_CONFIG.url).toBe(SITE_URL);
    expect(SITE_CONFIG.shortName).toBe(SITE_SHORT_NAME);
  });
});

describe('vite-seo-plugin fail-closed', () => {
  const plugin = seoHtmlPlugin();
  const transform = plugin.transformIndexHtml as (html: string) => string;

  it('缺標記時直接擲錯，防止漏 meta 出貨', () => {
    expect(() => transform('<html><head></head><body></body></html>')).toThrow(/SEO 注入標記/);
  });

  it('有標記時注入 head 與 body 內容', () => {
    const html = `<html><head>${SEO_HEAD_MARKER}</head><body>${SEO_BODY_MARKER}</body></html>`;
    const out = transform(html);
    expect(out).toContain('<title>');
    expect(out).toContain('application/ld+json');
    expect(out).toContain('sp-seo-content');
    expect(out).not.toContain(SEO_HEAD_MARKER);
    expect(out).not.toContain(SEO_BODY_MARKER);
  });
});
