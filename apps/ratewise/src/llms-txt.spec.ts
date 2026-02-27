import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const llmsPath = resolve(__dirname, '../public/llms.txt');
const pkgPath = resolve(__dirname, '../package.json');

const llmsExists = existsSync(llmsPath);
const describeIfGenerated = llmsExists ? describe : describe.skip;

describeIfGenerated('llms.txt structure (requires prebuild)', () => {
  it('includes required headings and answer capsule', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    expect(content.startsWith('# RateWise 匯率好工具')).toBe(true);
    expect(content).toContain('> 台灣用戶取向的即時匯率換算工具');
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

  it('lists all 13 currency pages in Popular Rates', () => {
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
    ];

    for (const currency of currencies) {
      expect(content).toContain(`https://app.haotool.org/ratewise/${currency}/`);
    }

    const currencyUrlPattern = /https:\/\/app\.haotool\.org\/ratewise\/[a-z]{3}-twd\//g;
    const matches = content.match(currencyUrlPattern);
    expect(matches).toHaveLength(13);
  });
});
