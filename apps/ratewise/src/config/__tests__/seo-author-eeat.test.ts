/**
 * 作者 E-E-A-T 測試（Person schema + About 頁可見作者資訊）
 *
 * RED → GREEN 驗證：
 * - AUTHOR_PERSON SSOT 正確定義
 * - buildPersonJsonLd() 輸出符合 schema.org Person 規格
 * - buildArticleJsonLd() author 改為 Person（非 Organization）
 * - ABOUT_PAGE_SEO.jsonLd 包含 Person schema
 */

import { describe, expect, it } from 'vitest';
import { AUTHOR_PERSON } from '../app-info';
import { buildPersonJsonLd, buildArticleJsonLd, ABOUT_PAGE_SEO } from '../seo-metadata';

// ─── AUTHOR_PERSON SSOT ───────────────────────────────────────────────────────

describe('AUTHOR_PERSON SSOT', () => {
  it('應有 name 欄位（作者名稱）', () => {
    expect(typeof AUTHOR_PERSON.name).toBe('string');
    expect(AUTHOR_PERSON.name.length).toBeGreaterThan(0);
  });

  it('應有 url 欄位指向 About 頁', () => {
    expect(AUTHOR_PERSON.url).toContain('/about/');
  });

  it('應有 sameAs 陣列包含 Threads URL', () => {
    expect(Array.isArray(AUTHOR_PERSON.sameAs)).toBe(true);
    const hasThreads = AUTHOR_PERSON.sameAs.some((url) => url.includes('threads.net'));
    expect(hasThreads).toBe(true);
  });

  it('應有 email 欄位', () => {
    expect(typeof AUTHOR_PERSON.email).toBe('string');
    expect(AUTHOR_PERSON.email).toContain('@');
  });
});

// ─── buildPersonJsonLd() ──────────────────────────────────────────────────────

describe('buildPersonJsonLd()', () => {
  it('應輸出 @context: https://schema.org', () => {
    const schema = buildPersonJsonLd();
    expect(schema['@context']).toBe('https://schema.org');
  });

  it('應輸出 @type: Person', () => {
    const schema = buildPersonJsonLd();
    expect(schema['@type']).toBe('Person');
  });

  it('應包含 name', () => {
    const schema = buildPersonJsonLd();
    expect(typeof schema['name']).toBe('string');
    expect((schema['name'] as string).length).toBeGreaterThan(0);
  });

  it('應包含 url 指向 About 頁', () => {
    const schema = buildPersonJsonLd();
    expect(schema['url']).toContain('/about/');
  });

  it('應包含 sameAs 陣列，含 Threads URL', () => {
    const schema = buildPersonJsonLd();
    const sameAs = schema['sameAs'] as string[];
    expect(Array.isArray(sameAs)).toBe(true);
    expect(sameAs.some((url) => url.includes('threads.net'))).toBe(true);
  });

  it('應包含 email', () => {
    const schema = buildPersonJsonLd();
    expect(typeof schema['email']).toBe('string');
    expect((schema['email'] as string).includes('@')).toBe(true);
  });
});

// ─── buildArticleJsonLd() author → Person ────────────────────────────────────

describe('buildArticleJsonLd() author 欄位', () => {
  const article = buildArticleJsonLd('測試標題', '測試描述', '/test/', '2026-01-01');

  it('author 應為 Person（非 Organization）', () => {
    const author = article['author'] as { '@type': string };
    expect(author['@type']).toBe('Person');
  });

  it('author.name 應為作者真實名稱', () => {
    const author = article['author'] as { name: string };
    expect(typeof author.name).toBe('string');
    expect(author.name.length).toBeGreaterThan(0);
  });

  it('author 應包含 sameAs（Threads）', () => {
    const author = article['author'] as { sameAs?: string[] };
    expect(Array.isArray(author.sameAs)).toBe(true);
    expect(author.sameAs!.some((url) => url.includes('threads.net'))).toBe(true);
  });

  it('publisher 應為 Organization @id 引用（linked data 模式）', () => {
    // publisher 改為 @id 引用，讓 Google Knowledge Graph 跨頁面識別同一實體。
    const publisher = article['publisher'] as { '@id'?: string; '@type'?: string };
    const isIdRef =
      typeof publisher['@id'] === 'string' && publisher['@id'].includes('#organization');
    const isInline = publisher['@type'] === 'Organization';
    expect(isIdRef || isInline).toBe(true);
  });
});

// ─── ABOUT_PAGE_SEO Person schema ────────────────────────────────────────────

describe('ABOUT_PAGE_SEO.jsonLd', () => {
  const jsonLd = Array.isArray(ABOUT_PAGE_SEO.jsonLd)
    ? ABOUT_PAGE_SEO.jsonLd
    : [ABOUT_PAGE_SEO.jsonLd];

  it('應包含 Person schema', () => {
    const personSchema = jsonLd.find((s) => s['@type'] === 'Person');
    expect(personSchema).toBeTruthy();
  });

  it('Person schema 應包含 Threads sameAs', () => {
    const personSchema = jsonLd.find((s) => s['@type'] === 'Person');
    const sameAs = personSchema?.['sameAs'] as string[] | undefined;
    expect(Array.isArray(sameAs)).toBe(true);
    expect(sameAs!.some((url) => url.includes('threads.net'))).toBe(true);
  });
});
