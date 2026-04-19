/**
 * Markdown 鏡像守門測試
 *
 * 目的：防止 public/*.md 與 HTML SSG 頁面語義漂移（Google cloaking 紅線）。
 * 生成邏輯於 scripts/generate-markdown-mirrors.mjs；此測試驗證：
 * 1. 5 個鏡像檔存在且非空
 * 2. 內含與 seo-metadata.ts / 對應 .tsx 頁一致的關鍵錨點字串
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { RATES_API } from '../config/api-endpoints';

const PUBLIC_DIR = resolve(__dirname, '../../public');

function readMd(slug: string): string {
  const p = resolve(PUBLIC_DIR, `${slug}.md`);
  expect(existsSync(p), `${slug}.md 應存在（需先執行 prebuild 產生）`).toBe(true);
  return readFileSync(p, 'utf-8');
}

describe('Markdown mirrors', () => {
  const slugs = ['faq', 'about', 'privacy', 'guide', 'open-data'] as const;

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
