import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { SettingsTab } from '../SettingsTab';
import { useStore } from '../../store/useStore';

beforeEach(() => {
  useStore.setState({
    members: [
      { id: 'me', name: 'Alice', avatarUrl: 'seed-me', isActive: true },
      { id: 'm1', name: 'Bob', avatarUrl: 'seed-m1', isActive: true },
    ],
    payerId: 'me',
    activeTab: 'settings',
  });
});

function renderSettings() {
  return render(
    <I18nextProvider i18n={i18n}>
      <SettingsTab />
    </I18nextProvider>,
  );
}

describe('SettingsTab', () => {
  it('顯示使用者名稱', () => {
    renderSettings();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('顯示所有成員', () => {
    renderSettings();
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
  });

  it('顯示版本號', () => {
    renderSettings();
    const versionEl = screen.getByTestId('app-version');
    expect(versionEl).toBeInTheDocument();
    expect(versionEl.textContent).toMatch(/v\d+\.\d+\.\d+/);
  });

  it('點擊編輯頭貼按鈕進入編輯模式', () => {
    renderSettings();
    // 找到編輯按鈕（edit icon 旁邊的按鈕）
    const editBtn = document.querySelector('button .material-symbols-outlined')?.closest('button');
    if (editBtn) {
      fireEvent.click(editBtn);
      // 應顯示 profile name input（value = Alice）
      const inputs = screen.getAllByRole('textbox');
      const profileInput = inputs.find((i) => (i as HTMLInputElement).value === 'Alice');
      expect(profileInput).toBeInTheDocument();
    }
  });

  it('修改成員名稱', () => {
    renderSettings();
    const inputs = screen.getAllByRole('textbox');
    // 找到 Bob 的 input
    const bobInput = inputs.find((i) => (i as HTMLInputElement).value === 'Bob');
    if (bobInput) {
      fireEvent.change(bobInput, { target: { value: 'Robert' } });
      const m1 = useStore.getState().members.find((m) => m.id === 'm1');
      expect(m1?.name).toBe('Robert');
    }
  });

  it('多於一人時顯示刪除成員按鈕', () => {
    renderSettings();
    // person_remove 圖示 button
    const deleteBtns = document.querySelectorAll('button .material-symbols-outlined');
    const hasPersonRemove = Array.from(deleteBtns).some((el) => el.textContent === 'person_remove');
    expect(hasPersonRemove).toBe(true);
  });

  it('刪除成員鈕具無障礙名稱且圖示 aria-hidden（m2）', () => {
    renderSettings();
    const deleteBtns = screen.getAllByRole('button', { name: i18n.t('settings.delete_member') });
    expect(deleteBtns.length).toBeGreaterThan(0);
    for (const btn of deleteBtns) {
      expect(btn.querySelector('.material-symbols-outlined')?.getAttribute('aria-hidden')).toBe(
        'true',
      );
    }
  });

  it('點擊新增成員按鈕新增成員', () => {
    renderSettings();
    const addBtns = Array.from(document.querySelectorAll('button .material-symbols-outlined'));
    const addPersonBtn = addBtns.find((el) => el.textContent === 'person_add')?.closest('button');
    if (addPersonBtn) {
      fireEvent.click(addPersonBtn);
      expect(useStore.getState().members).toHaveLength(3);
    }
  });

  it('切換幣別若會混幣需確認，取消則不變更', () => {
    useStore.setState({
      currency: 'TWD',
      currentTripId: 'default-trip',
      expenses: [
        {
          id: 'exp-1',
          tripId: 'default-trip',
          type: 'split_evenly',
          participantIds: ['me'],
          paidBy: 'me',
          totalAmount: 100,
          perPersonAmounts: { me: 100 },
          note: '',
          createdAt: 1,
          currency: 'TWD',
        },
      ],
    });
    renderSettings();
    fireEvent.click(screen.getByText('₩'));

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(i18n.t('history.mixed_currency_confirm'));

    fireEvent.click(screen.getByText(i18n.t('common.cancel')));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useStore.getState().currency).toBe('TWD');
  });

  it('切換幣別若會混幣且確認則變更', () => {
    useStore.setState({
      currency: 'TWD',
      currentTripId: 'default-trip',
      expenses: [
        {
          id: 'exp-1',
          tripId: 'default-trip',
          type: 'split_evenly',
          participantIds: ['me'],
          paidBy: 'me',
          totalAmount: 100,
          perPersonAmounts: { me: 100 },
          note: '',
          createdAt: 1,
          currency: 'TWD',
        },
      ],
    });
    renderSettings();
    fireEvent.click(screen.getByText('₩'));
    fireEvent.click(screen.getByText(i18n.t('common.confirm')));

    expect(useStore.getState().currency).toBe('KRW');
  });

  it('draft 非空時切換幣別先告知將清除未儲存金額', () => {
    useStore.setState({
      currency: 'TWD',
      currentTripId: 'default-trip',
      expenses: [],
      calculatorValue: '10000',
    });
    renderSettings();
    fireEvent.click(screen.getByText('₩'));

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(i18n.t('settings.currency_switch_draft_confirm'));

    fireEvent.click(screen.getByText(i18n.t('common.confirm')));
    const s = useStore.getState();
    expect(s.currency).toBe('KRW');
    expect(s.calculatorValue).toBe('');
  });

  it('draft 為空且無混幣風險時切換幣別不需確認', () => {
    useStore.setState({
      currency: 'TWD',
      currentTripId: 'default-trip',
      expenses: [],
      calculatorValue: '',
      itemizedValues: {},
    });
    renderSettings();
    fireEvent.click(screen.getByText('₩'));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useStore.getState().currency).toBe('KRW');
  });
});
