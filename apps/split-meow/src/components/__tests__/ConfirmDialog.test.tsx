import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { ConfirmDialog } from '../ConfirmDialog';

function renderDialog(props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <I18nextProvider i18n={i18n}>
      <ConfirmDialog
        open
        title="Title"
        message="Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />
    </I18nextProvider>,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('open=false 時不渲染', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('以 alertdialog role 渲染標題與訊息', () => {
    renderDialog();
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('Title');
    expect(dialog).toHaveTextContent('Message');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('開啟時焦點落在確認鍵（主按鈕右置）', () => {
    renderDialog();
    const buttons = screen.getAllByRole('button');
    const confirmBtn = buttons[buttons.length - 1]!;
    expect(confirmBtn).toHaveTextContent(i18n.t('common.confirm'));
    expect(document.activeElement).toBe(confirmBtn);
  });

  it('initialFocus=cancel 時焦點落在取消鍵（破壞性場景）', () => {
    renderDialog({ initialFocus: 'cancel' });
    const cancelBtn = screen.getByText(i18n.t('common.cancel')).closest('button');
    expect(document.activeElement).toBe(cancelBtn);
  });

  it('點擊確認/取消觸發對應 callback', () => {
    const { onConfirm, onCancel } = renderDialog();
    fireEvent.click(screen.getByText(i18n.t('common.confirm')));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText(i18n.t('common.cancel')));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Esc 關閉（onCancel）', () => {
    const { onCancel } = renderDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Tab 在對話框內循環（focus trap）', () => {
    renderDialog();
    const buttons = screen.getAllByRole('button');
    const cancelBtn = buttons[0]!;
    const confirmBtn = buttons[buttons.length - 1]!;

    // 焦點在確認鍵（最後一個）按 Tab → 回到第一個
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(cancelBtn);

    // Shift+Tab 從第一個 → 回到最後一個
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirmBtn);
  });
});
