/**
 * 幣別落地頁內容真實性回歸測試（避免跨幣別硬編文案污染）。
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CurrencyLandingPage } from '../CurrencyLandingPage';
import { APP_INFO } from '../../config/app-info';
import {
  buildRateDifferenceSentence,
  getCurrencyLandingPageContent,
} from '../../config/seo-metadata';
import { CURRENCY_SEO_PATHS, REVERSE_CURRENCY_SEO_PATHS } from '../../config/seo-paths';

const distPath = resolve(__dirname, '../../../dist');

const readDistHtml = (path: string): string => {
  const htmlPath = resolve(
    distPath,
    path === '/' ? 'index.html' : path.replace(/^\/+/, '') + 'index.html',
  );
  if (!existsSync(htmlPath)) {
    throw new Error(`prerender route html missing: ${htmlPath}`);
  }
  return readFileSync(htmlPath, 'utf-8');
};

const extractVisibleText = (html: string): string =>
  html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

beforeAll(() => {
  const indexHtml = resolve(distPath, 'index.html');
  if (!existsSync(indexHtml)) {
    throw new Error(
      'prerender dist is missing. please run pnpm --filter @app/ratewise build before this test.',
    );
  }
});

describe('CurrencyLandingPage template truthfulness', () => {
  it('USD 頁面不得保留硬編「10 萬日圓」文案', () => {
    render(
      <MemoryRouter>
        <CurrencyLandingPage {...getCurrencyLandingPageContent('USD')} />
      </MemoryRouter>,
    );

    expect(screen.queryByText('10 萬日圓')).not.toBeInTheDocument();
    expect(screen.getAllByText(/USD|美金|美元/).length).toBeGreaterThan(0);
  });

  it('TWD→外幣文案應比較可換得外幣量，而非錯誤放大台幣差額', () => {
    const sentence = buildRateDifferenceSentence({
      currencyCode: 'USD',
      currencyName: '美元',
      direction: 'twd-to-foreign',
      exampleAmount: 1000,
      bankMid: 32,
      cashSell: 33,
    });

    expect(sentence).toContain('約可換得');
    expect(sentence).toContain('少換約');
    expect(sentence).not.toContain('元台幣');
  });

  it.each([...CURRENCY_SEO_PATHS, ...REVERSE_CURRENCY_SEO_PATHS])(
    '%s 禁止保留通用硬編污染文案',
    (path) => {
      const text = extractVisibleText(readDistHtml(path));
      expect(text).toContain(`為什麼 ${APP_INFO.shortName} 比其他工具更精準？`);
      expect(text).not.toContain('10 萬日圓');

      if (!path.includes('jpy') && !path.includes('krw')) {
        expect(text).not.toContain('明洞換匯所');
      }
    },
  );
});
