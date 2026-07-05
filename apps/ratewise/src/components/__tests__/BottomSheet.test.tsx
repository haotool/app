// @vitest-environment jsdom

/**
 * BottomSheet primitive API 測試：開關、backdrop、關閉鈕、兩種尺寸模式、testId 透傳，
 * 與 modal 鍵盤可及性四項（Esc 關閉、focus trap、初始焦點、焦點還原）。
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useState } from 'react';
import '@testing-library/jest-dom/vitest';
import { BottomSheet } from '../BottomSheet';

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

function renderSheet(props: Partial<React.ComponentProps<typeof BottomSheet>> = {}) {
  const onClose = vi.fn();
  render(
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      ariaLabel="測試 sheet"
      title="標題"
      closeLabel="關閉"
      testId="test-sheet"
      {...props}
    >
      <div data-testid="sheet-content">內容</div>
    </BottomSheet>,
  );
  return { onClose };
}

describe('BottomSheet primitive', () => {
  afterEach(() => {
    cleanup();
  });

  it('isOpen=false 不渲染 sheet', () => {
    renderSheet({ isOpen: false });
    expect(screen.queryByTestId('test-sheet')).not.toBeInTheDocument();
  });

  it('isOpen=true 渲染 dialog 語意、標題與內容', () => {
    renderSheet();
    const sheet = screen.getByTestId('test-sheet');
    expect(sheet).toHaveAttribute('role', 'dialog');
    expect(sheet).toHaveAttribute('aria-modal', 'true');
    expect(sheet).toHaveAttribute('aria-label', '測試 sheet');
    expect(screen.getByText('標題')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
  });

  it('點擊關閉鈕呼叫 onClose，且熱區 ≥44px', () => {
    const { onClose } = renderSheet();
    const closeButton = screen.getByRole('button', { name: '關閉' });
    expect(closeButton.className).toContain('h-11 w-11');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('adaptive 模式使用 max-h、fixed 模式使用 65vh 固定高', () => {
    renderSheet({ size: 'adaptive' });
    expect(screen.getByTestId('test-sheet').className).toContain('max-h-[70vh]');
    cleanup();
    renderSheet({ size: 'fixed' });
    expect(screen.getByTestId('test-sheet').className).toContain('h-[65vh]');
  });

  it('殼層帶 safe-area 底部內距與 token 圓角，無漸層與彩色陰影', () => {
    renderSheet();
    const className = screen.getByTestId('test-sheet').className;
    expect(className).toContain('pb-[env(safe-area-inset-bottom,0px)]');
    expect(className).toContain('rounded-t-card');
    expect(className).toContain('shadow-floating');
    expect(className).not.toContain('bg-gradient');
  });
});

describe('BottomSheet modal 鍵盤可及性（#577）', () => {
  afterEach(() => {
    cleanup();
  });

  it('按下 Esc 呼叫 onClose', () => {
    const { onClose } = renderSheet();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('開啟時初始焦點移入 sheet', () => {
    renderSheet();
    const sheet = screen.getByTestId('test-sheet');
    expect(sheet).toHaveFocus();
  });

  it('Tab 循環困於 sheet 內：尾端 Tab 回到首個可聚焦元素、首端 Shift+Tab 跳到尾端', () => {
    render(
      <BottomSheet
        isOpen={true}
        onClose={vi.fn()}
        ariaLabel="測試 sheet"
        title="標題"
        closeLabel="關閉"
        testId="test-sheet"
      >
        <button type="button" data-testid="inner-last">
          內部按鈕
        </button>
      </BottomSheet>,
    );
    const closeButton = screen.getByRole('button', { name: '關閉' });
    const innerLast = screen.getByTestId('inner-last');

    innerLast.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(innerLast).toHaveFocus();
  });

  it('關閉後焦點還原到開啟前的觸發元素', () => {
    function Harness() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button type="button" data-testid="trigger" onClick={() => setIsOpen(true)}>
            開啟
          </button>
          <BottomSheet
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            ariaLabel="測試 sheet"
            title="標題"
            closeLabel="關閉"
            testId="test-sheet"
          >
            <div>內容</div>
          </BottomSheet>
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByTestId('trigger');
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByTestId('test-sheet')).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('test-sheet')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
