import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function readComponentSource(fileName: string) {
  const filePath = path.resolve(__dirname, `../${fileName}`);
  return readFile(filePath, 'utf-8');
}

describe('contact SSOT usage', () => {
  it('Footer should use app-info instead of hardcoded Threads values', async () => {
    const source = await readComponentSource('Footer.tsx');
    expect(source).toContain("from '../config/app-info'");
    expect(source).not.toContain('https://www.threads.net/@azlife_1224');
    expect(source).not.toContain('azlife_1224');
  });

  it('SEOHelmet should use app-info instead of hardcoded social metadata', async () => {
    const source = await readComponentSource('SEOHelmet.tsx');
    expect(source).toContain("from '../config/app-info'");
    expect(source).not.toContain('https://www.threads.net/@azlife_1224');
    expect(source).not.toContain("'haotool.org@gmail.com'");
    expect(source).not.toContain('content="@azlife_1224"');
  });
});
