import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const llmsPath = resolve(__dirname, '../public/llms.txt');
const llmsFullPath = resolve(__dirname, '../public/llms-full.txt');
const pkgPath = resolve(__dirname, '../package.json');

const llmsExists = existsSync(llmsPath);
const describeIfGenerated = llmsExists ? describe : describe.skip;

describeIfGenerated('llms.txt structure (requires prebuild)', () => {
  it('includes required headings and answer capsule', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    expect(content.startsWith('# RateWise 匯率好工具')).toBe(true);
    expect(content).toContain('台灣最精準的匯率換算器');
    expect(content).toContain('Answer Capsule (Quick Q&A)');
  });

  it('version matches package.json (SSOT)', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(content).toContain(`Version: v${pkg.version}`);
  });

  it('includes file list sections with URLs', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    expect(content).toContain('## Core Pages');
    expect(content).toContain('## Popular Rates');
    expect(content).toContain('## Optional');
    expect(content).toMatch(/https:\/\/app\.haotool\.org\/ratewise\/.*\//);
  });

  it('includes API Endpoints section with latest.json reference', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    expect(content).toContain('## API Endpoints');
    expect(content).toContain('api/latest.json');
  });

  it('uses prerendered path-based amount landing pages as the indexable format', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    expect(content).toContain('https://app.haotool.org/ratewise/usd-twd/500/');
    expect(content).not.toContain('https://app.haotool.org/ratewise/usd-twd/?amount={AMOUNT}');
    expect(content).not.toContain('canonical：自引用含 ?amount=');
  });

  it('keeps documented URLs free of trailing CJK punctuation that breaks parsers', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    const urls = content.match(/https?:\/\/[^\s]+/g) ?? [];

    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).not.toMatch(/[）】，。；：]$/u);
    }
  });

  it('lists all 17 currency pages in Popular Rates', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    const currencies = [
      'usd-twd',
      'jpy-twd',
      'eur-twd',
      'hkd-twd',
      'cny-twd',
      'krw-twd',
      'aud-twd',
      'cad-twd',
      'chf-twd',
      'gbp-twd',
      'nzd-twd',
      'sgd-twd',
      'thb-twd',
      'vnd-twd',
      'php-twd',
      'idr-twd',
      'myr-twd',
    ];

    for (const currency of currencies) {
      expect(content).toContain(`https://app.haotool.org/ratewise/${currency}/`);
    }

    const currencyUrlPattern = /https:\/\/app\.haotool\.org\/ratewise\/[a-z]{3}-twd\//g;
    const matches = content.match(currencyUrlPattern);
    // 至少 17 個幣對頁 URL（Popular Rates）；llms.txt 範例段落可能含額外 usd-twd/ 實例。
    expect(matches?.length ?? 0).toBeGreaterThanOrEqual(17);
  });

  it('lists seo-tech disclosure page in Optional section for AI/LLM discovery', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    expect(content).toContain('https://app.haotool.org/ratewise/seo-tech/');
  });

  it('makes llms-full prefer path-based amount landing pages over query-only deep links', () => {
    const content = readFileSync(llmsFullPath, 'utf-8');

    expect(content).toContain('方案 A（推薦）：幣對金額頁（SSG 路徑型，有獨立 SEO 頁面）');
    expect(content).toContain('https://app.haotool.org/ratewise/usd-twd/{AMOUNT}/');
    expect(content).not.toContain(
      'Q: 如何讓用戶直接在 RateWise 查詢特定匯率？ A: 使用 Deep Link 模板：https://app.haotool.org/ratewise/?amount={金額}&from={幣別}&to=TWD',
    );
  });
});
