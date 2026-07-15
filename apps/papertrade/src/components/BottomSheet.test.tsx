import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet';

function renderSheet(onClose = vi.fn()) {
  render(
    <BottomSheet open title="測試視窗" onClose={onClose}>
      <button type="button">甲</button>
      <button type="button">乙</button>
    </BottomSheet>,
  );
  return onClose;
}

describe('BottomSheet', () => {
  it('moves focus into the sheet on open', () => {
    renderSheet();
    expect(screen.getByRole('dialog', { name: '測試視窗' })).toHaveFocus();
  });

  it('wraps Tab from the last focusable back to the first', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.tab();
    expect(screen.getByRole('button', { name: '關閉' })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: '乙' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: '關閉' })).toHaveFocus();
  });

  it('wraps Shift+Tab from the first focusable to the last', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.tab();
    expect(screen.getByRole('button', { name: '關閉' })).toHaveFocus();

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: '乙' })).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = renderSheet();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus to the trigger after closing', () => {
    function Harness({ open }: { open: boolean }) {
      return (
        <>
          <button type="button">觸發</button>
          <BottomSheet open={open} title="測試視窗" onClose={vi.fn()}>
            <button type="button">甲</button>
          </BottomSheet>
        </>
      );
    }

    const { rerender } = render(<Harness open={false} />);
    const trigger = screen.getByRole('button', { name: '觸發' });
    trigger.focus();

    rerender(<Harness open />);
    expect(screen.getByRole('dialog', { name: '測試視窗' })).toHaveFocus();

    rerender(<Harness open={false} />);
    expect(trigger).toHaveFocus();
  });
});
