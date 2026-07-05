// @vitest-environment jsdom

/**
 * CurrencyPicker primitive API 測試：旗幟清單、常用置頂、搜尋過濾、選取回呼。
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CurrencyPicker } from '../CurrencyPicker';

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      drag: _drag,
      dragConstraints: _dragConstraints,
      dragElastic: _dragElastic,
      onDragEnd: _onDragEnd,
      ...rest
    }: {
      children?: React.ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      drag?: unknown;
      dragConstraints?: unknown;
      dragElastic?: unknown;
      onDragEnd?: unknown;
    } & React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const ITEMS = [
  { code: 'TWD', flag: '🇹🇼', name: '新台幣' },
  { code: 'USD', flag: '🇺🇸', name: '美元' },
  { code: 'JPY', flag: '🇯🇵', name: '日圓' },
  { code: 'KRW', flag: '🇰🇷', name: '韓元' },
];

function renderPicker(props: Partial<React.ComponentProps<typeof CurrencyPicker>> = {}) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(
    <CurrencyPicker
      isOpen={true}
      selected="USD"
      onSelect={onSelect}
      onClose={onClose}
      items={ITEMS}
      title="選擇幣別"
      closeLabel="關閉"
      searchLabel="搜尋幣別"
      {...props}
    />,
  );
  return { onSelect, onClose };
}

describe('CurrencyPicker primitive', () => {
  afterEach(() => {
    cleanup();
  });

  it('渲染 listbox 與全部幣別選項（含旗幟與名稱）', () => {
    renderPicker();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(screen.getByTestId('currency-option-JPY')).toHaveTextContent('🇯🇵');
    expect(screen.getByTestId('currency-option-JPY')).toHaveTextContent('日圓');
  });

  it('選中項帶 aria-selected', () => {
    renderPicker();
    expect(screen.getByTestId('currency-option-USD')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('currency-option-TWD')).toHaveAttribute('aria-selected', 'false');
  });

  it('常用幣別置頂（依給定順序）', () => {
    renderPicker({ pinned: ['KRW', 'JPY'] });
    const codes = screen.getAllByRole('option').map((option) => option.getAttribute('data-testid'));
    expect(codes).toEqual([
      'currency-option-KRW',
      'currency-option-JPY',
      'currency-option-TWD',
      'currency-option-USD',
    ]);
  });

  it('搜尋以代碼或名稱過濾', () => {
    renderPicker();
    const search = screen.getByTestId('currency-picker-search');
    fireEvent.change(search, { target: { value: 'jp' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.change(search, { target: { value: '韓' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByTestId('currency-option-KRW')).toBeInTheDocument();
  });

  it('點擊選項呼叫 onSelect', () => {
    const { onSelect } = renderPicker();
    fireEvent.click(screen.getByTestId('currency-option-JPY'));
    expect(onSelect).toHaveBeenCalledWith('JPY');
  });

  it('預設 testId 維持 currency-picker-sheet（E3 相容）', () => {
    renderPicker();
    expect(screen.getByTestId('currency-picker-sheet')).toBeInTheDocument();
  });
});
