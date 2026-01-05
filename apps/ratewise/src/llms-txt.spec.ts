import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const llmsPath = resolve(__dirname, '../public/llms.txt');

describe('llms.txt structure', () => {
  it('includes required headings and answer capsule', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    expect(content.startsWith('# RateWise 匯率好工具')).toBe(true);
    expect(content).toContain('> 台灣用戶取向的即時匯率換算工具');
    expect(content).toContain('Answer Capsule (Quick Q&A):');
  });

  it('includes file list sections with URLs', () => {
    const content = readFileSync(llmsPath, 'utf-8');
    expect(content).toContain('## Core Pages');
    expect(content).toContain('## Popular Rates');
    expect(content).toContain('## Optional');
    expect(content).toMatch(/https:\/\/app\.haotool\.org\/ratewise\/.*\//);
  });
});
