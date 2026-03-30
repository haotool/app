import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import About from './About';

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
    expect(
      screen.getByRole('heading', { level: 1, name: /關於 RateWise 匯率好工具/i }),
    ).toBeInTheDocument();
  });

  it('renders an answer capsule that explains what RateWise is and why it differs from mid-market tools', () => {
    renderAbout();
    expect(screen.getByRole('heading', { level: 2, name: /快速答案/i })).toBeInTheDocument();
    expect(screen.getByText(/RateWise 是以臺灣銀行牌告匯率為基礎的換匯工具/i)).toBeInTheDocument();
    expect(screen.getByText(/不以市場中間價作為主要決策依據/i)).toBeInTheDocument();
  });
});
