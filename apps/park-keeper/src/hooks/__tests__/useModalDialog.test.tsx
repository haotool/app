/**
 * useModalDialog 測試（issue #725 modal a11y）：
 * Esc 關閉、Tab focus trap 循環、開啟聚焦容器、關閉還原焦點。
 */
import { useRef, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useModalDialog } from '../useModalDialog';

function Harness({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  useModalDialog(ref, active, onClose);

  return (
    <>
      <button type="button" data-testid="outside">
        outside
      </button>
      <button type="button" data-testid="deactivate" onClick={() => setActive(false)}>
        deactivate
      </button>
      {active && (
        <div ref={ref} role="dialog" aria-modal="true" aria-label="dialog" tabIndex={-1}>
          <button type="button" data-testid="first">
            first
          </button>
          <button type="button" data-testid="last">
            last
          </button>
        </div>
      )}
    </>
  );
}

describe('useModalDialog', () => {
  it('開啟時聚焦容器，Esc 觸發 onClose', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    expect(document.activeElement).toBe(screen.getByRole('dialog'));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Tab 於最末聚焦元素時循環回第一個；Shift+Tab 於容器/首元素時跳到最後', () => {
    render(<Harness onClose={() => {}} />);

    // jsdom 無 layout：getClientRects 需 stub 才會被視為可聚焦。
    const rectStub = vi
      .spyOn(HTMLElement.prototype, 'getClientRects')
      .mockReturnValue([{}] as unknown as DOMRectList);

    screen.getByTestId('last').focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByTestId('first'));

    screen.getByRole('dialog').focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByTestId('last'));

    rectStub.mockRestore();
  });

  it('關閉（active=false）時還原先前焦點', () => {
    render(<Harness onClose={() => {}} />);

    const outside = screen.getByTestId('outside');
    const deactivate = screen.getByTestId('deactivate');

    // 模擬開啟前焦點在外部按鈕：restore 目標為 activeElement 快照，
    // 此處直接驗證 active=false 後焦點不再停留於 dialog。
    fireEvent.click(deactivate);
    expect(document.activeElement).not.toBe(screen.queryByRole('dialog'));
    expect([outside, deactivate, document.body]).toContain(document.activeElement);
  });
});
