/**
 * Markdown 鏡像守門測試
 *
 * 目的：防止 public/*.md 與 HTML SSG 頁面語義漂移（Google cloaking 紅線）。
 * 生成邏輯於 scripts/generate-markdown-mirrors.mjs；此測試驗證：
 * 1. 6 個鏡像檔存在且非空
 * 2. 內含與 seo-metadata.ts / 對應 .tsx 頁一致的關鍵錨點字串
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { RATES_API } from '../config/api-endpoints';
import { SITE_CONFIG } from '../config/seo-paths';
import { APP_INFO } from '../config/app-info';

const PUBLIC_DIR = resolve(__dirname, '../../public');

function readMd(slug: string): string {
  const p = resolve(PUBLIC_DIR, `${slug}.md`);
  expect(existsSync(p), `${slug}.md 應存在（需先執行 prebuild 產生）`).toBe(true);
  return readFileSync(p, 'utf-8');
}

describe('Markdown mirrors', () => {
  const slugs = ['faq', 'about', 'privacy', 'guide', 'open-data', 'index'] as const;

  it.each(slugs)('%s.md 存在且非空', (slug) => {
    const content = readMd(slug);
    expect(content.length).toBeGreaterThan(500);
  });

  it('faq.md 含關鍵 Q&A 錨點（現金 vs 即期、DCC）', () => {
    const content = readMd('faq');
    expect(content).toMatch(/現金匯率和即期匯率/);
    expect(content).toMatch(/DCC/);
  });

  it('about.md 含作者與資料來源', () => {
    const content = readMd('about');
    expect(content).toMatch(/臺灣銀行官方牌告匯率/);
    expect(content).toMatch(/haotool\.org@gmail\.com/);
  });

  it('privacy.md 含第三方服務與本地儲存關鍵字', () => {
    const content = readMd('privacy');
    expect(content).toMatch(/localStorage/);
    expect(content).toMatch(/Google Analytics/);
    expect(content).toMatch(/Cloudflare/);
  });

  it('guide.md 含使用流程與快速金額按鈕說明', () => {
    const content = readMd('guide');
    expect(content).toMatch(/快速金額按鈕/);
    expect(content).toMatch(/現金/);
  });

  it('index.md 含首頁核心文案與功能導引', () => {
    const content = readMd('index');
    expect(content).toMatch(/以台灣銀行牌告匯率做實務換算/);
    expect(content).toMatch(/5 分鐘自動同步/);
    expect(content).toMatch(/使用指南/);
  });

  it('index.md 首段描述必須使用首頁 SSOT，不能漂移成 FAQ 頁描述', () => {
    const content = readMd('index');
    expect(content).toContain(`> ${SITE_CONFIG.description}`);
    expect(content).not.toContain(`整理 ${APP_INFO.shortName} 最常被問的換匯問題`);
  });

  it('open-data.md 含 API 端點與 curl 範例', () => {
    const content = readMd('open-data');
    expect(content).toMatch(/jsdelivr\.net/);
    expect(content).toMatch(/curl/);
    expect(content).toMatch(/details\.USD/);
  });

  it('每個鏡像均含 canonical URL 與版本標記', () => {
    for (const slug of slugs) {
      const content = readMd(slug);
      expect(content).toMatch(/Canonical:/);
      expect(content).toMatch(/Version: v\d+\.\d+\.\d+/);
    }
  });

  it('鏡像不得殘留未解析的 template token（${...} 或 {OBJECT.prop}）', () => {
    for (const slug of slugs) {
      const content = readMd(slug);
      expect(
        content,
        `${slug}.md 殘留 \${...} 未展開 — 檢查 generate-markdown-mirrors.mjs KNOWN_SUBSTITUTIONS`,
      ).not.toMatch(/\$\{[^}]+\}/);
      expect(
        content,
        `${slug}.md 殘留 {OBJECT.prop} 占位符 — 未知 token 應 throw 而非降級輸出`,
      ).not.toMatch(/\{(APP_INFO|RATES_API)\.[A-Za-z_]+\}/);
    }
  });

  it('open-data.md 使用實際 jsDelivr / GitHub Raw 端點 URL', () => {
    const content = readMd('open-data');
    expect(content).toMatch(/cdn\.jsdelivr\.net\/gh\/[^/]+\/[^/]+@data/);
    expect(content).toMatch(/raw\.githubusercontent\.com/);
  });

  it('open-data.md FAQ 端點與 RATES_API SSOT 一致（防止 generate 腳本與 api-endpoints.ts 漂移）', () => {
    const content = readMd('open-data');
    expect(content).toContain(RATES_API.latestCdn);
    expect(content).toContain(RATES_API.latestRaw);
    expect(content).toContain(RATES_API.historyCdnExample);
  });

  it('鏡像不得殘留 JS 字串 escape 字元（\\`、\\n）— 應反跳脫成字面值', () => {
    for (const slug of slugs) {
      const content = readMd(slug);
      expect(
        content,
        `${slug}.md 含殘留 \\\` escape，inline code 不會被 Markdown 解析`,
      ).not.toMatch(/\\`/);
      expect(
        content,
        `${slug}.md 含殘留 \\n 字面值（backslash + 'n'），應在 generate-markdown-mirrors unescape 成真實換行`,
      ).not.toMatch(/\\n(?![a-zA-Z])/);
    }
  });

  it('open-data.md FAQ 內含實際 backtick 包住的 URL（inline code）', () => {
    const content = readMd('open-data');
    expect(content).toMatch(/`https:\/\/cdn\.jsdelivr\.net\/gh\/[^`]+@data[^`]+`/);
    expect(content).toMatch(/`https:\/\/raw\.githubusercontent\.com\/[^`]+`/);
  });
});

describe('Authority guide Markdown mirrors', () => {
  const authorityGuides = [
    {
      slug: 'sell-rate-vs-mid-rate',
      heading: '賣出價比中間價更接近臨櫃換匯成本',
      keyContent: '中間價',
      faqKeyword: '換匯',
    },
    {
      slug: 'cash-vs-spot-rate',
      heading: '現金與即期不是同一種匯率',
      keyContent: '即期匯率',
      faqKeyword: '臨櫃換',
    },
    {
      slug: 'card-rate-guide',
      heading: '刷卡匯率不是台銀牌告，但台銀賣出價仍很有參考價值',
      keyContent: 'DCC',
      faqKeyword: '當地貨幣',
    },
  ] as const;

  it.each(authorityGuides)('$slug.md 存在且非空', ({ slug }) => {
    const content = readMd(slug);
    expect(content.length).toBeGreaterThan(500);
  });

  it.each(authorityGuides)('$slug.md 含 canonical URL 與版本標記', ({ slug }) => {
    const content = readMd(slug);
    expect(content).toMatch(/Canonical:/);
    expect(content).toMatch(/Version: v\d+\.\d+\.\d+/);
  });

  it.each(authorityGuides)('$slug.md H1 含頁面 heading', ({ slug, heading }) => {
    const content = readMd(slug);
    expect(content).toContain(`# ${heading}`);
  });

  it.each(authorityGuides)('$slug.md 含核心關鍵字', ({ slug, keyContent }) => {
    const content = readMd(slug);
    expect(content).toContain(keyContent);
  });

  it.each(authorityGuides)('$slug.md 含重點整理區塊', ({ slug }) => {
    const content = readMd(slug);
    expect(content).toContain('## 重點整理');
  });

  it.each(authorityGuides)('$slug.md 含常見問題區塊與 FAQ 關鍵字', ({ slug, faqKeyword }) => {
    const content = readMd(slug);
    expect(content).toContain('## 常見問題');
    expect(content).toContain(faqKeyword);
  });

  it('authority guide 鏡像不得殘留未解析的 template token', () => {
    for (const { slug } of authorityGuides) {
      const content = readMd(slug);
      expect(content, `${slug}.md 殘留 \${...} 未展開`).not.toMatch(/\$\{[^}]+\}/);
    }
  });

  it('llms.txt Markdown Mirrors section includes authority guide .md links', () => {
    const llmsPath = resolve(PUBLIC_DIR, '../public/llms.txt');
    const llmsFallback = resolve(PUBLIC_DIR, 'llms.txt');
    const llmsFinal = existsSync(llmsPath) ? llmsPath : llmsFallback;
    const content = readFileSync(llmsFinal, 'utf-8');
    expect(content).toContain('sell-rate-vs-mid-rate.md');
    expect(content).toContain('cash-vs-spot-rate.md');
    expect(content).toContain('card-rate-guide.md');
  });

  it('sell-rate-vs-mid-rate.md 含相關攻略連結（hub-and-spoke cross-links）', () => {
    // HTML 頁已渲染 relatedGuides；markdown 鏡像應與 HTML 語義一致。
    const content = readMd('sell-rate-vs-mid-rate');
    expect(content).toContain('## 相關攻略');
    expect(content).toContain('/cash-vs-spot-rate/');
    expect(content).toContain('/card-rate-guide/');
  });

  it('cash-vs-spot-rate.md 含相關攻略連結（hub-and-spoke cross-links）', () => {
    const content = readMd('cash-vs-spot-rate');
    expect(content).toContain('## 相關攻略');
    expect(content).toContain('/sell-rate-vs-mid-rate/');
    expect(content).toContain('/card-rate-guide/');
  });

  it('card-rate-guide.md 含相關攻略連結（hub-and-spoke cross-links）', () => {
    const content = readMd('card-rate-guide');
    expect(content).toContain('## 相關攻略');
    expect(content).toContain('/sell-rate-vs-mid-rate/');
    expect(content).toContain('/cash-vs-spot-rate/');
  });
});
