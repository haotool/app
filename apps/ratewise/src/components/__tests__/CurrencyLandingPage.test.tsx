import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CurrencyLandingPage } from '../CurrencyLandingPage';

const BASE_PROPS = {
  currencyCode: 'KRW',
  currencyFlag: '🇰🇷',
  currencyName: '韓元',
  title: 'KRW 對 TWD 匯率換算器',
  description: '測試用描述',
  pathname: '/krw-twd',
  canonical: 'https://app.haotool.org/ratewise/krw-twd/',
  keywords: ['韓元換台幣'],
  faqEntries: [{ question: '測試問題', answer: '測試答案' }],
  howToSteps: [{ position: 1, name: '選擇幣別', text: '測試步驟' }],
  highlights: ['測試重點'],
  commonAmounts: [{ amount: 50000, label: '五萬韓元', question: '50000 韓元多少台幣？' }],
};

describe('CurrencyLandingPage', () => {
  it('常見金額換算應使用可爬連結（Wise-pattern），指向路徑型 URL（/krw-twd/50000/）', () => {
    render(
      <MemoryRouter>
        <CurrencyLandingPage {...BASE_PROPS} />
      </MemoryRouter>,
    );

    // Wise-pattern：common amounts 是可爬的 <a> 連結（非 <button>），指向路徑型 URL。
    const amountLink = screen.getByRole('link', { name: '50000 韓元多少台幣？' });
    expect(amountLink).toBeInTheDocument();
    expect(amountLink).toHaveAttribute('href', '/krw-twd/50000/');

    // 不是按鈕（舊設計：導向首頁 deep-link）
    expect(screen.queryByRole('button', { name: '50000 韓元多少台幣？' })).not.toBeInTheDocument();
  });

  // ─── P8: 相關攻略連結（hub-and-spoke 內部鏈接 SEO）───
  it('P8: relatedGuides 為空陣列時不渲染相關攻略區塊', () => {
    render(
      <MemoryRouter>
        <CurrencyLandingPage {...BASE_PROPS} relatedGuides={[]} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('heading', { name: /相關攻略/ })).not.toBeInTheDocument();
  });

  it('P8: relatedGuides 有資料時應渲染相關攻略連結（含 label 與 href）', () => {
    const guides = [
      { href: '/sell-rate-vs-mid-rate/', label: '賣出價 vs 中間價', description: '了解匯率差異' },
      { href: '/cash-vs-spot-rate/', label: '現金 vs 即期匯率', description: '哪種匯率適合你' },
    ];
    render(
      <MemoryRouter>
        <CurrencyLandingPage {...BASE_PROPS} relatedGuides={guides} />
      </MemoryRouter>,
    );

    // 相關攻略標題
    expect(screen.getByRole('heading', { name: /相關攻略/ })).toBeInTheDocument();

    // 每個 guide 的連結存在且指向正確路徑
    const link1 = screen.getByRole('link', { name: /賣出價 vs 中間價/ });
    expect(link1).toHaveAttribute('href', '/sell-rate-vs-mid-rate/');

    const link2 = screen.getByRole('link', { name: /現金 vs 即期匯率/ });
    expect(link2).toHaveAttribute('href', '/cash-vs-spot-rate/');
  });

  it('P8: relatedGuides 連結應有 description 說明文字', () => {
    const guides = [
      {
        href: '/sell-rate-vs-mid-rate/',
        label: '賣出價 vs 中間價',
        description: '了解為何 Google 匯率和台銀不同',
      },
    ];
    render(
      <MemoryRouter>
        <CurrencyLandingPage {...BASE_PROPS} relatedGuides={guides} />
      </MemoryRouter>,
    );
    expect(screen.getByText('了解為何 Google 匯率和台銀不同')).toBeInTheDocument();
  });

  it('P8: relatedGuides 未傳入時不應崩潰（backward compatible）', () => {
    // 不傳 relatedGuides 時應正常渲染，無 error
    expect(() =>
      render(
        <MemoryRouter>
          <CurrencyLandingPage {...BASE_PROPS} />
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });
});
