import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import About from './About';
import { APP_INFO } from '../config/app-info';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const renderAbout = () =>
  render(
    <BrowserRouter>
      <HelmetProvider>
        <About />
      </HelmetProvider>
    </BrowserRouter>,
  );

describe('About Page', () => {
  it('renders main heading', () => {
    renderAbout();
    const heading = new RegExp(`關於 ${escapeRegex(APP_INFO.name)}`, 'i');
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('renders an answer capsule that explains the app and why it differs from mid-market tools', () => {
    renderAbout();
    const brandAssertion = new RegExp(
      `${escapeRegex(APP_INFO.shortName)} 是以臺灣銀行牌告匯率為基礎的換匯工具`,
      'i',
    );
    expect(screen.getByRole('heading', { level: 2, name: /快速答案/i })).toBeInTheDocument();
    expect(screen.getByText(brandAssertion)).toBeInTheDocument();
    expect(screen.getByText(/不以市場中間價作為主要決策依據/i)).toBeInTheDocument();
  });
});
