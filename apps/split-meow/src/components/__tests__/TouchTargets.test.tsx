/**
 * G1 觸控目標鎖定測試：曾被 review 點名 <44px 的互動元素必須帶 min-h-11（44px）。
 * jsdom 無版面引擎，以 class 斷言鎖定（瀏覽器實高由 QA 量測腳本驗證）。
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { type ReactNode } from 'react';
import i18n from '../../i18n';
import { useStore } from '../../store/useStore';
import { SettingsTab } from '../SettingsTab';
import { HomeTab } from '../HomeTab';

function renderWith(ui: ReactNode) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

beforeEach(() => {
  useStore.setState({
    members: [{ id: 'me', name: 'Me', avatarUrl: 'seed-me', isActive: true }],
    currency: 'TWD',
    currencyManuallySet: true,
    rateUpdatedAt: '2026/07/16 08:00:00',
    rateUpdatedAtIso: new Date().toISOString(),
    rateFetchFailed: true,
    calculatorValue: '',
    itemizedValues: {},
    splitMode: 'split_evenly',
    payerId: 'me',
    expenseNote: '',
    expenseCategory: null,
  });
});

describe('G1 觸控目標 ≥44px（min-h-11 class 鎖定）', () => {
  it('Settings：語系、幣別與匯率重試按鈕', () => {
    renderWith(<SettingsTab />);

    for (const name of ['繁中', 'EN', '한국어', '日本語']) {
      const btn = screen.getByText(name).closest('button');
      expect(btn?.className).toContain('min-h-11');
    }

    for (const symbol of ['NT$', '₩']) {
      const btn = screen.getByText(symbol).closest('button');
      expect(btn?.className).toContain('min-h-11');
    }

    const retry = screen.getByText(i18n.t('settings.rate_retry')).closest('button');
    expect(retry?.className).toContain('min-h-11');
  });

  it('Home：平分／個別模式切換按鈕', () => {
    renderWith(<HomeTab />);

    for (const key of ['home.split_evenly', 'home.itemized']) {
      const btn = screen.getByText(i18n.t(key)).closest('button');
      expect(btn?.className).toContain('min-h-11');
    }
  });
});
