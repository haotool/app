// @vitest-environment jsdom

/**
 * CustomThemeSheet - E7 wave-B UX 守門
 *
 * 1. HEX 欄位（QA-I #4）：focus 全選、paste 清洗（去 # 空白、統一大寫）、
 *    blur/Enter 才 commit、無效值回滾前值。
 * 2. 近白/近黑主色 gate（QA-I #2＋#670 S3）：警告不硬擋＋一鍵採用建議色。
 * 3. 取消／還原預設（QA-I #5/#7/D12）：取消回呼、還原預設二段確認。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CustomThemeSheet } from '../CustomThemeSheet';
import { evaluatePrimaryContrastGate, isValidHexColor } from '../../config/custom-theme';

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

function renderSheet(props: Partial<React.ComponentProps<typeof CustomThemeSheet>> = {}) {
  const handlers = {
    onClose: vi.fn(),
    onCancel: vi.fn(),
    onSelectPrimary: vi.fn(),
    onSelectBackgroundTone: vi.fn(),
    onReset: vi.fn(),
  };
  render(
    <CustomThemeSheet
      isOpen={true}
      customPrimary="#3182F6"
      customBackgroundTone="pure"
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

function getHexInput(): HTMLInputElement {
  return screen.getByTestId('custom-theme-hex-input') as HTMLInputElement;
}

afterEach(cleanup);

describe('HEX 欄位修復（QA-I #4）', () => {
  it('focus 自動全選', () => {
    renderSheet();
    const input = getHexInput();
    fireEvent.focus(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });

  it('貼上「F8FAFC」：blur 才 commit 清洗後的 #F8FAFC', () => {
    const { onSelectPrimary } = renderSheet();
    const input = getHexInput();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'F8FAFC' } });
    // 編輯中不 commit（消除半殘色碼陷阱）。
    expect(onSelectPrimary).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(onSelectPrimary).toHaveBeenCalledTimes(1);
    expect(onSelectPrimary).toHaveBeenCalledWith('#F8FAFC');
  });

  it('貼上「#3182f6 」：清洗去 # 空白、統一大寫，Enter commit', () => {
    const { onSelectPrimary } = renderSheet({ customPrimary: '#FF6B6B' });
    const input = getHexInput();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '#3182f6 ' } });
    expect(input.value).toBe('3182F6');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelectPrimary).toHaveBeenCalledWith('#3182F6');
  });

  it('打半截值「3F」：blur 回滾前值且不 commit', () => {
    const { onSelectPrimary } = renderSheet();
    const input = getHexInput();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '3F' } });
    expect(input.value).toBe('3F');
    fireEvent.blur(input);
    expect(onSelectPrimary).not.toHaveBeenCalled();
    expect(input.value).toBe('3182F6');
  });

  it('超長輸入截 6 碼；非 hex 字元即時剔除', () => {
    renderSheet();
    const input = getHexInput();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'F8FAFCFFEE' } });
    expect(input.value).toBe('F8FAFC');
    fireEvent.change(input, { target: { value: 'xyz#12' } });
    expect(input.value).toBe('12');
  });

  it('非編輯態顯示值跟隨 customPrimary（色票/色盤變更同步）', () => {
    renderSheet({ customPrimary: '#14B8A6' });
    expect(getHexInput().value).toBe('14B8A6');
  });
});

describe('近白/近黑主色 gate（QA-I #2＋#670 S3）', () => {
  it('近白 #F8FAFC × 純淨白：顯示警告與一鍵採用建議色（不硬擋）', () => {
    const { onSelectPrimary } = renderSheet({ customPrimary: '#F8FAFC' });
    expect(screen.getByTestId('custom-theme-gate-notice')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('custom-theme-gate-adopt'));
    const suggested = evaluatePrimaryContrastGate('#F8FAFC', 'pure').suggestedPrimary;
    expect(onSelectPrimary).toHaveBeenCalledWith(suggested);
    expect(isValidHexColor(suggested)).toBe(true);
  });

  it('近黑 #0A0A0A × 深夜檔：鏡像同機制警告', () => {
    const { onSelectPrimary } = renderSheet({
      customPrimary: '#0A0A0A',
      customBackgroundTone: 'midnight',
    });
    expect(screen.getByTestId('custom-theme-gate-notice')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('custom-theme-gate-adopt'));
    const suggested = evaluatePrimaryContrastGate('#0A0A0A', 'midnight').suggestedPrimary;
    expect(onSelectPrimary).toHaveBeenCalledWith(suggested);
  });

  it('品牌藍 × 純淨白：不誤報', () => {
    renderSheet();
    expect(screen.queryByTestId('custom-theme-gate-notice')).not.toBeInTheDocument();
  });
});

describe('取消與還原預設（QA-I #5/#7/D12）', () => {
  it('「取消」觸發 onCancel（回滾開啟前快照由 draft hook 編排）', () => {
    const { onCancel, onClose } = renderSheet();
    fireEvent.click(screen.getByTestId('custom-theme-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('還原預設二段確認：第一次按進入確認態，第二次按才觸發 onReset', () => {
    const { onReset } = renderSheet();
    const reset = screen.getByTestId('custom-theme-reset');

    fireEvent.click(reset);
    expect(onReset).not.toHaveBeenCalled();
    expect(reset).toHaveTextContent('再點一次確認還原');

    fireEvent.click(reset);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('確認態逾時自動解除', () => {
    vi.useFakeTimers();
    try {
      const { onReset } = renderSheet();
      const reset = screen.getByTestId('custom-theme-reset');
      fireEvent.click(reset);
      expect(reset).toHaveTextContent('再點一次確認還原');

      act(() => {
        vi.advanceTimersByTime(4100);
      });
      expect(reset).toHaveTextContent('還原預設主題');

      fireEvent.click(reset);
      expect(onReset).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
