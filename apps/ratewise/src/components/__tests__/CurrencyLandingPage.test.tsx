import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

  // ─── #631: pair 頁主 CTA 深連結（不得斷幣別脈絡）───
  it('#631: pair 頁主 CTA 帶 ?from&to 深連結，落地即正確幣別對', () => {
    render(
      <MemoryRouter>
        <CurrencyLandingPage {...BASE_PROPS} />
      </MemoryRouter>,
    );

    const cta = screen.getByRole('link', { name: /開始換算 KRW → TWD/ });
    expect(cta).toHaveAttribute('href', '/?from=KRW&to=TWD');
  });

  it('#631: twd-to-foreign 方向 pair 頁 CTA 帶反向 ?from=TWD&to=KRW', () => {
    render(
      <MemoryRouter>
        <CurrencyLandingPage {...BASE_PROPS} direction="twd-to-foreign" pathname="/twd-krw" />
      </MemoryRouter>,
    );

    const cta = screen.getByRole('link', { name: /開始換算 TWD → KRW/ });
    expect(cta).toHaveAttribute('href', '/?from=TWD&to=KRW');
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

  // ─── AnswerCapsule：AEO/GEO 快速答案區塊 ───
  it('answerCapsule 有資料時應渲染快速答案區塊（AnswerCapsule，供 AI 引擎直接引用）', () => {
    const answerCapsule = [
      {
        question: '韓元換台幣今日匯率是多少？',
        answer: '台銀現金賣出價：1 KRW = 0.023 TWD（測試資料）。',
      },
    ];
    render(
      <MemoryRouter>
        <CurrencyLandingPage {...BASE_PROPS} answerCapsule={answerCapsule} />
      </MemoryRouter>,
    );
    // 快速答案標題
    expect(screen.getByRole('heading', { name: '快速答案' })).toBeInTheDocument();
    // 答案問題文字
    expect(screen.getByText('韓元換台幣今日匯率是多少？')).toBeInTheDocument();
  });

  it('answerCapsule 為空或未傳時不渲染快速答案區塊', () => {
    render(
      <MemoryRouter>
        <CurrencyLandingPage {...BASE_PROPS} answerCapsule={[]} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('heading', { name: '快速答案' })).not.toBeInTheDocument();
  });

  it('answerCapsule 未傳入時不應崩潰（backward compatible）', () => {
    expect(() =>
      render(
        <MemoryRouter>
          <CurrencyLandingPage {...BASE_PROPS} />
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });

  // ─── #634: 金額頁瘦身三段（答案卡＋階梯表標記本頁＋金額特化 FAQ＋導流回 pair 主頁）───
  describe('#634: 金額頁瘦身', () => {
    const renderAmountPage = () =>
      render(
        <MemoryRouter initialEntries={['/krw-twd/50000/']}>
          <Routes>
            <Route
              path="/krw-twd/:amount/"
              element={
                <CurrencyLandingPage
                  {...BASE_PROPS}
                  answerCapsule={[{ question: '泛用快速答案', answer: '不應出現在金額頁' }]}
                />
              }
            />
          </Routes>
        </MemoryRouter>,
      );

    it('H1 為金額特化問句（消除 H1/title 錯位）', () => {
      renderAmountPage();
      expect(
        screen.getByRole('heading', { level: 1, name: '5 萬韓元（50,000 KRW）換台幣是多少？' }),
      ).toBeInTheDocument();
    });

    it('渲染答案卡與階梯表，且當前金額列標記「本頁」不自我連結', () => {
      renderAmountPage();
      expect(screen.getByTestId('amount-answer-block')).toBeInTheDocument();
      expect(screen.getByTestId('amount-ladder')).toBeInTheDocument();
      expect(screen.getByText('本頁')).toBeInTheDocument();
      // 當前金額（50,000）不得為連結；相鄰金額（10,000）維持互鏈。
      expect(screen.queryByRole('link', { name: '50,000' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: '10,000' })).toHaveAttribute(
        'href',
        '/krw-twd/10000/',
      );
    });

    it('與 pair 頁重複的六段 IA 不再渲染（快速答案／pair FAQ／常見金額互鏈）', () => {
      renderAmountPage();
      expect(screen.queryByRole('heading', { name: '快速答案' })).not.toBeInTheDocument();
      expect(screen.queryByText('泛用快速答案')).not.toBeInTheDocument();
      // pair 頁完整 FAQ（BASE_PROPS.faqEntries）被金額特化 FAQ 取代。
      expect(screen.queryByText('測試問題')).not.toBeInTheDocument();
      // 常見金額互鏈段（commonAmounts）不再渲染。
      expect(screen.queryByRole('link', { name: '50000 韓元多少台幣？' })).not.toBeInTheDocument();
    });

    it('導流段連回 pair 主頁完整指南', () => {
      renderAmountPage();
      const guideLink = screen.getByRole('link', { name: /韓元對台幣完整指南/ });
      expect(guideLink).toHaveAttribute('href', '/krw-twd/');
    });
  });
});
