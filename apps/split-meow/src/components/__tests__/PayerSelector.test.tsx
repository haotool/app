import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { PayerSelector } from '../PayerSelector';
import { useStore } from '../../store/useStore';

beforeEach(() => {
  useStore.setState({
    members: [
      { id: 'me', name: 'Me', avatarUrl: 'seed-me', isActive: true },
      { id: 'm1', name: 'Oliver', avatarUrl: 'seed-m1', isActive: true },
    ],
    payerId: 'me',
  });
});

function renderSelector() {
  return render(
    <I18nextProvider i18n={i18n}>
      <PayerSelector />
    </I18nextProvider>,
  );
}

describe('PayerSelector', () => {
  it('渲染付款人觸發按鈕', () => {
    renderSelector();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('顯示目前付款人名稱', () => {
    renderSelector();
    expect(screen.getByText('Me')).toBeInTheDocument();
  });

  it('點擊展開成員列表', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button'));
    // 展開後應出現所有成員
    expect(screen.getByText('Oliver')).toBeInTheDocument();
  });

  it('選擇其他成員更新 payerId', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button')); // open
    // 找到 Oliver 按鈕並點擊
    const buttons = screen.getAllByRole('button');
    const oliverBtn = buttons.find((b) => b.textContent?.includes('Oliver'));
    if (oliverBtn) {
      fireEvent.click(oliverBtn);
      expect(useStore.getState().payerId).toBe('m1');
    }
  });

  it('點擊遮罩收起選單', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button'));
    const overlay = document.querySelector('.fixed.inset-0.z-40');
    if (overlay) {
      fireEvent.click(overlay);
      expect(document.querySelector('.fixed.inset-0.z-40')).toBeNull();
    }
  });
});
