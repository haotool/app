import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CurrencyLandingPage } from '../CurrencyLandingPage';

describe('CurrencyLandingPage', () => {
  it('常見金額換算應使用互動按鈕而非可爬連結', () => {
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

    const amountAction = screen.getByRole('button', { name: '50000 韓元多少台幣？' });
    expect(amountAction).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '50000 韓元多少台幣？' })).not.toBeInTheDocument();
  });
});
