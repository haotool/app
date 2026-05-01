import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { brotliCompressSync } from 'node:zlib';
import { join } from 'node:path';

const distDir = join(__dirname, '../../../dist');

describe('homepage modulepreload budget', () => {
  it('keeps motion and dnd out of homepage modulepreload', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8');

    expect(html).not.toContain('vendor-motion');
    expect(html).not.toContain('vendor-dnd');
  });

  it('keeps homepage initial JS under the current brotli budget', () => {
    const manifest = JSON.parse(
      readFileSync(join(distDir, '.vite/manifest.json'), 'utf-8'),
    ) as Record<string, { file: string; imports?: string[] }>;
    const entry = manifest['index.html'];
    if (!entry) {
      throw new Error('index.html entry not found in manifest');
    }
    const files = [
      entry.file,
      ...(entry.imports ?? []).map((key) => manifest[key]?.file).filter((f): f is string => !!f),
    ];
    const brotliBytes = files.reduce((total, file) => {
      const abs = join(distDir, file);
      statSync(abs);
      return total + brotliCompressSync(readFileSync(abs)).length;
    }, 0);

    // 135KB brotli budget for initial JS
    expect(brotliBytes).toBeLessThanOrEqual(135_000);
  });
});
