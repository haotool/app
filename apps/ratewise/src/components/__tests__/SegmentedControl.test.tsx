// @vitest-environment jsdom

/**
 * SegmentedControl primitive API 測試：radiogroup 語意、roving tabindex、
 * 方向鍵移動、44px 觸控熱區、選中面 primary-strong 平色。
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SegmentedControl } from '../SegmentedControl';

const OPTIONS = [
  { value: 'spot', label: '即期', testId: 'seg-spot' },
  { value: 'cash', label: '現金', testId: 'seg-cash' },
  { value: 'shop', label: '換錢所', testId: 'seg-shop' },
] as const;

function renderControl(props: Partial<React.ComponentProps<typeof SegmentedControl>> = {}) {
  const onChange = vi.fn();
  render(
    <SegmentedControl
      value="spot"
      options={OPTIONS}
      onChange={onChange}
      ariaLabel="匯率類型"
      {...props}
    />,
  );
  return { onChange };
}

describe('SegmentedControl primitive', () => {
  afterEach(() => {
    cleanup();
  });

  it('radiogroup 語意：group aria-label、radio aria-checked', () => {
    renderControl();
    expect(screen.getByRole('radiogroup', { name: '匯率類型' })).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('roving tabindex：選中項 tabIndex=0、其餘 -1', () => {
    renderControl();
    expect(screen.getByTestId('seg-spot')).toHaveAttribute('tabindex', '0');
    expect(screen.getByTestId('seg-cash')).toHaveAttribute('tabindex', '-1');
  });

  it('點擊未選中項呼叫 onChange；點擊已選中項不重複觸發', () => {
    const { onChange } = renderControl();
    fireEvent.click(screen.getByTestId('seg-cash'));
    expect(onChange).toHaveBeenCalledWith('cash');
    onChange.mockClear();
    fireEvent.click(screen.getByTestId('seg-spot'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('方向鍵在啟用選項間循環移動選取', () => {
    const { onChange } = renderControl();
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('cash');
    onChange.mockClear();
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('shop');
  });

  it('disabled 選項不可點擊且被方向鍵跳過', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        value="spot"
        options={[
          { value: 'spot', label: '即期', testId: 'seg2-spot' },
          { value: 'cash', label: '現金', disabled: true, testId: 'seg2-cash' },
          { value: 'shop', label: '換錢所', testId: 'seg2-shop' },
        ]}
        onChange={onChange}
        ariaLabel="匯率類型2"
      />,
    );
    fireEvent.click(screen.getByTestId('seg2-cash'));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('radiogroup', { name: '匯率類型2' }), {
      key: 'ArrowRight',
    });
    expect(onChange).toHaveBeenCalledWith('shop');
  });

  it('md 尺寸：每個選項 min-h-11（44px 觸控）且選中面為 primary-strong 平色', () => {
    renderControl();
    const checked = screen.getByTestId('seg-spot');
    expect(checked.className).toContain('min-h-11');
    expect(checked.className).toContain('bg-primary-strong');
    expect(checked.className).not.toContain('bg-gradient');
  });

  it('sm 尺寸：44px 熱區以負邊距補償、選中 pill 為 primary-strong 平色', () => {
    renderControl({ size: 'sm' });
    const checked = screen.getByTestId('seg-spot');
    expect(checked.className).toContain('min-h-11');
    expect(checked.className).toContain('min-w-11');
    expect(checked.className).toContain('-my-[10px]');
    expect(checked.querySelector('span')?.className).toContain('bg-primary-strong');
  });
});
