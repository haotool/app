import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CurrencyLandingPage } from '../CurrencyLandingPage';

describe('CurrencyLandingPage', () => {
  it('常見金額換算應使用可爬連結（Wise-pattern），指向幣對頁 ?amount=', () => {
    render(
      <MemoryRouter>
        <CurrencyLandingPage
          currencyCode="KRW"
          currencyFlag="🇰🇷"
          currencyName="韓元"
          title="KRW 對 TWD 匯率換算器"
          description="測試用描述"
          pathname="/krw-twd"
          canonical="https://app.haotool.org/ratewise/krw-twd/"
          keywords={['韓元換台幣']}
          faqEntries={[
            {
              question: '測試問題',
              answer: '測試答案',
            },
          ]}
          howToSteps={[
            {
              position: 1,
              name: '選擇幣別',
              text: '測試步驟',
            },
          ]}
          highlights={['測試重點']}
          commonAmounts={[
            {
              amount: 50000,
              label: '五萬韓元',
              question: '50000 韓元多少台幣？',
            },
          ]}
        />
      </MemoryRouter>,
    );

    // Wise-pattern：common amounts 是可爬的 <a> 連結（非 <button>），指向幣對頁 ?amount=
    const amountLink = screen.getByRole('link', { name: '50000 韓元多少台幣？' });
    expect(amountLink).toBeInTheDocument();
    expect(amountLink).toHaveAttribute('href', '/krw-twd/?amount=50000');

    // 不是按鈕（舊設計：導向首頁 deep-link）
    expect(screen.queryByRole('button', { name: '50000 韓元多少台幣？' })).not.toBeInTheDocument();
  });
});
