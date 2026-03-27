import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { BottomNav } from '../BottomNav';
import { useStore } from '../../store/useStore';

beforeEach(() => {
  useStore.setState({ activeTab: 'home' });
});

const renderNav = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <BottomNav />
    </I18nextProvider>,
  );

describe('BottomNav', () => {
  it('三個導航按鈕全部渲染', () => {
    renderNav();
    // 找到 nav 元素
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    // 3 個按鈕
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('點擊 history 切換 tab', () => {
    renderNav();
    const buttons = screen.getAllByRole('button');
    const historyBtn = buttons[1]!;
    fireEvent.click(historyBtn);
    expect(useStore.getState().activeTab).toBe('history');
  });

  it('點擊 settings 切換 tab', () => {
    renderNav();
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]!);
    expect(useStore.getState().activeTab).toBe('settings');
  });

  it('點擊 home 切換 tab', () => {
    useStore.setState({ activeTab: 'history' });
    renderNav();
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]!);
    expect(useStore.getState().activeTab).toBe('home');
  });
});
