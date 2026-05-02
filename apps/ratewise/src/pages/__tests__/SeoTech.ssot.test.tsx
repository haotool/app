import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import SeoTech from '../SeoTech';
import { SEO_PATHS, PRERENDER_PATHS } from '../../config/seo-paths';
import { SEO_SCHEMA_REGISTRY } from '../../config/seo-schema-registry';

beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class IntersectionObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
    },
  );
});

describe('SeoTech SSOT 對齊', () => {
  it('應顯示來自 SSOT 的 SEO 路徑、SSG 路徑與 pipeline/schema 揭露', () => {
    render(
      <MemoryRouter>
        <SeoTech />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(String(SEO_PATHS.length)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(String(PRERENDER_PATHS.length)).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(String(SEO_SCHEMA_REGISTRY.filter((schema) => schema.enabled).length))
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('../../scripts/generate-sitemap-2026.mjs')).toBeInTheDocument();
    expect(screen.queryByText('248 個 SEO URL')).not.toBeInTheDocument();
    expect(screen.queryByText(/priority 欄位/)).not.toBeInTheDocument();
    expect(screen.queryByText('FinancialService')).not.toBeInTheDocument();
  });

  it('schema registry 應揭露 Open Data Dataset 並避免首頁範圍漂移', () => {
    const enabledTypes = SEO_SCHEMA_REGISTRY.filter((schema) => schema.enabled).map(
      (schema) => schema.type,
    );

    expect(enabledTypes).toContain('Dataset');
    expect(SEO_SCHEMA_REGISTRY.find((schema) => schema.type === 'WebSite')?.pages).toContain(
      '全站',
    );
    expect(
      SEO_SCHEMA_REGISTRY.find((schema) => schema.type === 'SoftwareApplication')?.pages,
    ).toContain('全站');
  });
});
