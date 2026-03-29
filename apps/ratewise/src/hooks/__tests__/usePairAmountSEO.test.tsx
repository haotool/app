/** usePairAmountSEO — 幣對金額動態 SEO（Wise-pattern） */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { usePairAmountSEO } from '../usePairAmountSEO';

const DEFAULT_PROPS = {
  currencyCode: 'USD',
  currencyName: '美元',
  pathname: '/usd-twd',
  defaultTitle: '即時美元匯率 — 台銀實際賣出價 | USD/TWD',
  defaultDescription: '台銀實際美元賣出價，每 5 分鐘更新。',
  defaultCanonical: 'https://app.haotool.org/ratewise/usd-twd/',
};

function TestComponent(props: typeof DEFAULT_PROPS) {
  const result = usePairAmountSEO(props);
  return (
    <div>
      <div data-testid="title">{result.seoTitle}</div>
      <div data-testid="description">{result.seoDescription}</div>
      <div data-testid="canonical">{result.seoCanonical}</div>
      <div data-testid="amount">{result.amount ?? 'null'}</div>
    </div>
  );
}

function renderWithRoute(url: string, props = DEFAULT_PROPS) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <TestComponent {...props} />
    </MemoryRouter>,
  );
}

/** 使用路徑型路由（/:amount 參數），測試 path-based URL。 */
function renderWithPathRoute(url: string, props = DEFAULT_PROPS) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/usd-twd/:amount" element={<TestComponent {...props} />} />
        <Route path="/usd-twd" element={<TestComponent {...props} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('usePairAmountSEO', () => {
  describe('?amount パラメータなし（デフォルト SEO）', () => {
    it('amount がない場合はデフォルト title を返す', () => {
      renderWithRoute('/usd-twd');
      expect(screen.getByTestId('title')).toHaveTextContent(DEFAULT_PROPS.defaultTitle);
    });

    it('amount がない場合はデフォルト description を返す', () => {
      renderWithRoute('/usd-twd');
      expect(screen.getByTestId('description')).toHaveTextContent(DEFAULT_PROPS.defaultDescription);
    });

    it('amount がない場合はデフォルト canonical を返す', () => {
      renderWithRoute('/usd-twd');
      expect(screen.getByTestId('canonical')).toHaveTextContent(DEFAULT_PROPS.defaultCanonical);
    });

    it('amount がない場合は amount = null を返す', () => {
      renderWithRoute('/usd-twd');
      expect(screen.getByTestId('amount')).toHaveTextContent('null');
    });
  });

  describe('?amount=500 — Wise-pattern 動態 SEO', () => {
    it('amount=500 の場合は金額を含む title を返す', () => {
      renderWithRoute('/usd-twd?amount=500');
      const title = screen.getByTestId('title').textContent ?? '';
      expect(title).toContain('500');
      expect(title).toContain('美元');
    });

    it('title にはデフォルト title を含まない（完全上書き）', () => {
      renderWithRoute('/usd-twd?amount=500');
      expect(screen.getByTestId('title').textContent).not.toBe(DEFAULT_PROPS.defaultTitle);
    });

    it('description に金額と通貨名が含まれる', () => {
      renderWithRoute('/usd-twd?amount=500');
      const desc = screen.getByTestId('description').textContent ?? '';
      expect(desc).toContain('500');
      expect(desc).toContain('美元');
    });

    it('query-string amount 也必須 canonical 回路徑型金額頁', () => {
      renderWithRoute('/usd-twd?amount=500');
      const canonical = screen.getByTestId('canonical').textContent ?? '';
      expect(canonical).toBe('https://app.haotool.org/ratewise/usd-twd/500/');
      expect(canonical).not.toMatch(/\?amount=\d+&from=/);
      expect(canonical).not.toContain('?amount=');
    });

    it('amount 値が正しく解析される', () => {
      renderWithRoute('/usd-twd?amount=500');
      expect(screen.getByTestId('amount')).toHaveTextContent('500');
    });
  });

  describe('無效 amount 值 — フォールバック', () => {
    it('amount=0 の場合はデフォルト SEO を返す', () => {
      renderWithRoute('/usd-twd?amount=0');
      expect(screen.getByTestId('title')).toHaveTextContent(DEFAULT_PROPS.defaultTitle);
      expect(screen.getByTestId('amount')).toHaveTextContent('null');
    });

    it('amount が負数の場合はデフォルト SEO を返す', () => {
      renderWithRoute('/usd-twd?amount=-100');
      expect(screen.getByTestId('title')).toHaveTextContent(DEFAULT_PROPS.defaultTitle);
      expect(screen.getByTestId('amount')).toHaveTextContent('null');
    });

    it('amount が非数値の場合はデフォルト SEO を返す', () => {
      renderWithRoute('/usd-twd?amount=abc');
      expect(screen.getByTestId('title')).toHaveTextContent(DEFAULT_PROPS.defaultTitle);
      expect(screen.getByTestId('amount')).toHaveTextContent('null');
    });

    it('amount=Infinity の場合はデフォルト SEO を返す', () => {
      renderWithRoute('/usd-twd?amount=Infinity');
      expect(screen.getByTestId('title')).toHaveTextContent(DEFAULT_PROPS.defaultTitle);
      expect(screen.getByTestId('amount')).toHaveTextContent('null');
    });
  });

  describe('SEO タイトル品質', () => {
    it('title は currencyCode を含む', () => {
      renderWithRoute('/usd-twd?amount=1000');
      expect(screen.getByTestId('title').textContent).toContain('USD');
    });

    it('title は TWD/台幣 への言及を含む', () => {
      renderWithRoute('/usd-twd?amount=1000');
      const title = screen.getByTestId('title').textContent ?? '';
      expect(title.includes('TWD') || title.includes('台幣') || title.includes('新台幣')).toBe(
        true,
      );
    });

    it('canonical URL は pair ページパスをベースにする（ホームページではない）', () => {
      renderWithRoute('/usd-twd?amount=100');
      const canonical = screen.getByTestId('canonical').textContent ?? '';
      // Must NOT be homepage root with query string
      expect(canonical).not.toMatch(/^https?:\/\/[^/]+\/\?/);
    });

    it('大きな金額も正しくフォーマットされる', () => {
      renderWithRoute('/usd-twd?amount=100000');
      const title = screen.getByTestId('title').textContent ?? '';
      // Should contain the amount in some format (with or without comma separators)
      expect(/100[\s,.]?000|100000/.exec(title)).toBeTruthy();
    });
  });

  describe('路徑型 URL（/usd-twd/500/）— Wise SSG pattern', () => {
    it('path params.amount 優先於 searchParams', () => {
      renderWithPathRoute('/usd-twd/500', DEFAULT_PROPS);
      const title = screen.getByTestId('title').textContent ?? '';
      expect(title).toContain('500');
      expect(title).toContain('美元');
    });

    it('canonical 使用路徑型（/usd-twd/500/），非 ?amount=', () => {
      renderWithPathRoute('/usd-twd/500', DEFAULT_PROPS);
      const canonical = screen.getByTestId('canonical').textContent ?? '';
      expect(canonical).toMatch(/usd-twd\/500\//);
      expect(canonical).not.toContain('?amount=');
    });

    it('amount 值正確解析', () => {
      renderWithPathRoute('/usd-twd/1000', DEFAULT_PROPS);
      expect(screen.getByTestId('amount')).toHaveTextContent('1000');
    });
  });

  describe('JPY などの別幣種', () => {
    const JPY_PROPS = {
      currencyCode: 'JPY',
      currencyName: '日圓',
      pathname: '/jpy-twd',
      defaultTitle: '即時日圓匯率 | JPY/TWD',
      defaultDescription: '日圓換台幣',
      defaultCanonical: 'https://app.haotool.org/ratewise/jpy-twd/',
    };

    it('JPY で amount=10000 の場合は日圓を含む title を返す', () => {
      renderWithRoute('/jpy-twd?amount=10000', JPY_PROPS);
      const title = screen.getByTestId('title').textContent ?? '';
      expect(title).toContain('日圓');
      expect(title.includes('10,000') || title.includes('10000')).toBe(true);
    });

    it('canonical は jpy-twd パスを含む', () => {
      renderWithRoute('/jpy-twd?amount=10000', JPY_PROPS);
      expect(screen.getByTestId('canonical').textContent).toContain('jpy-twd');
    });
  });
});
