/**
 * FAQ 頁 TOC 與 per-question 錨點測試（issue 655）
 *
 * 驗收：SSOT 派生錨點齊全、TOC 連結指向有效錨點、
 * TOC 不新增 heading（SSG heading outline 不變）、深連結自動展開目標問題。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import FAQ from './FAQ';
import { FAQ_PAGE_SEO } from '../config/seo-metadata';

const FAQ_COUNT = (FAQ_PAGE_SEO.faqContent ?? []).length;

const renderFaq = () =>
  render(
    <BrowserRouter>
      <HelmetProvider>
        <FAQ />
      </HelmetProvider>
    </BrowserRouter>,
  );

describe('FAQ Page - TOC 與錨點', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('每題皆有 SSOT 派生的 per-question 錨點（faq-q1..faq-qN）', () => {
    renderFaq();
    expect(FAQ_COUNT).toBe(21);
    for (let i = 1; i <= FAQ_COUNT; i++) {
      const target = document.getElementById(`faq-q${i}`);
      expect(target).toBeInstanceOf(HTMLDetailsElement);
    }
  });

  it('TOC（行動摺疊＋桌面側欄）為每題輸出指向有效錨點的連結', () => {
    renderFaq();
    const tocLinks = Array.from(document.querySelectorAll('a[href^="#faq-q"]'));
    // 行動摺疊與桌面 sticky 側欄各一份清單。
    expect(tocLinks).toHaveLength(FAQ_COUNT * 2);
    for (const link of tocLinks) {
      const id = (link.getAttribute('href') ?? '').slice(1);
      expect(document.getElementById(id)).toBeInstanceOf(HTMLDetailsElement);
    }
  });

  it('TOC 位於 nav 導覽 chrome 內且不新增 heading（SSG heading outline 不變）', () => {
    renderFaq();
    expect(screen.getByRole('navigation', { name: '常見問題目錄' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /快速導航/ })).not.toBeInTheDocument();
  });

  it('帶錨點 hash 進站時自動展開目標問題的 details', () => {
    window.history.replaceState(null, '', '/#faq-q3');
    renderFaq();
    const target = document.getElementById('faq-q3') as HTMLDetailsElement;
    expect(target.open).toBe(true);
  });

  it('站內 hashchange（TOC 側跳）時自動展開目標問題', () => {
    renderFaq();
    const target = document.getElementById('faq-q5') as HTMLDetailsElement;
    expect(target.open).toBe(false);

    window.history.replaceState(null, '', '/#faq-q5');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(target.open).toBe(true);
  });
});
