// @vitest-environment jsdom

/**
 * PageNavHeader safe-area 防回歸測試（issue #601）：
 * PWA standalone（viewport-fit=cover ＋ black-translucent）下，
 * 內容頁 sticky 返回列必須以 env(safe-area-inset-top) 疊加 padding-top，
 * 否則會頂進瀏海被狀態列遮蔽。
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

// 非 standalone 時 env() fallback 為 0px，padding-top 回到基準 0.625rem（10px）。
const SAFE_AREA_CLASS = 'pt-[calc(0.625rem+env(safe-area-inset-top,0px))]';

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

describe('PageNavHeader safe-area', () => {
  it('sticky 返回列 class 含 safe-area-inset-top 疊加 padding', () => {
    render(
      <BrowserRouter>
        <PageNavHeader breadcrumbItems={[{ label: '首頁', href: '/' }]} />
      </BrowserRouter>,
    );
    const header = screen.getByTestId('page-nav-header');
    expect(header.className).toContain(SAFE_AREA_CLASS);
    expect(header.className).toContain('sticky');
  });
});

describe('內容頁 smoke：返回列均含 safe-area 適配', () => {
  const PAGES: readonly [string, ComponentType][] = [
    ['FAQ', FAQ],
    ['Guide', Guide],
    ['About', About],
    ['Privacy', Privacy],
    ['OpenData', OpenData],
    ['SeoTech', SeoTech],
  ];

  it.each(PAGES)('%s 頁返回列含 safe-area 類別', (_name, Page) => {
    render(
      <BrowserRouter>
        <HelmetProvider>
          <Page />
        </HelmetProvider>
      </BrowserRouter>,
    );
    expect(screen.getByTestId('page-nav-header').className).toContain(SAFE_AREA_CLASS);
  });
});
