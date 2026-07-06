// @vitest-environment jsdom

/**
 * 內容頁骨架防回歸測試（issue #601 → 去 sticky 重構）：
 * 1. 頂列必須為靜態（隨內容滾走）——不得 sticky、不得 backdrop-blur、不得 border-b 壓在內容上。
 * 2. PWA standalone（viewport-fit=cover ＋ black-translucent）的 safe-area 適配
 *    改由 ContentPageLayout 頁面容器的 pt-safe-top 承擔，避免頂進瀏海。
 */

import type { ComponentType } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { PageNavHeader } from '../PageNavHeader';
import FAQ from '../../pages/FAQ';
import Guide from '../../pages/Guide';
import About from '../../pages/About';
import Privacy from '../../pages/Privacy';
import OpenData from '../../pages/OpenData';
import SeoTech from '../../pages/SeoTech';
import OpenSource from '../../pages/OpenSource';

// SeoTech 使用 framer-motion whileInView；jsdom 無 IntersectionObserver，需 stub。
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

describe('PageNavHeader 靜態頂列', () => {
  it('頂列不得 sticky／fixed、不得 backdrop-blur、不得 border-b', () => {
    render(
      <BrowserRouter>
        <PageNavHeader breadcrumbItems={[{ label: '首頁', href: '/' }]} />
      </BrowserRouter>,
    );
    const header = screen.getByTestId('page-nav-header');
    expect(header.className).not.toContain('sticky');
    // fixed 同為常駐定位，一併封鎖，防止以 fixed 重新引入常駐頂列。
    expect(header.className).not.toContain('fixed');
    expect(header.className).not.toContain('backdrop-blur');
    expect(header.className).not.toContain('border-b');
  });
});

describe('內容頁 smoke：頂列靜態＋容器 safe-area 適配', () => {
  const PAGES: readonly [string, ComponentType][] = [
    ['FAQ', FAQ],
    ['Guide', Guide],
    ['About', About],
    ['Privacy', Privacy],
    ['OpenData', OpenData],
    ['SeoTech', SeoTech],
    ['OpenSource', OpenSource],
  ];

  it.each(PAGES)('%s 頁頂列為靜態且頁面容器含 pt-safe-top', (_name, Page) => {
    render(
      <BrowserRouter>
        <HelmetProvider>
          <Page />
        </HelmetProvider>
      </BrowserRouter>,
    );
    const header = screen.getByTestId('page-nav-header');
    expect(header.className).not.toContain('sticky');
    expect(header.className).not.toContain('fixed');
    // safe-area 由 ContentPageLayout 最外層容器承擔（issue #601 防瀏海遮蔽）。
    const layoutRoot = header.closest('[data-testid="content-page"]');
    expect(layoutRoot).not.toBeNull();
    expect(layoutRoot?.className).toContain('pt-safe-top');
  });
});
