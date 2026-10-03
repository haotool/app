import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { normalizeQuote } from '@app/shared/fx';
import { useConverterStore } from '../../../../stores/converterStore';
import { FxContextControls } from '../FxContextControls';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'zh-TW' },
    t: (key: string) =>
      ({ 'fxUi.conditions': '換匯條件', 'fxUi.compareBoardRates': '比較未含費用牌告' })[key] ?? key,
  }),
}));

const NOW = '2026-10-03T00:00:00Z';
const board = (providerId: string, serviceCountry: string, branchId?: string) =>
  normalizeQuote({
    providerId,
    subjectCurrency: 'USD',
    priceCurrency: serviceCountry === 'KR' ? 'KRW' : 'TWD',
    unitAmount: '1',
    providerBuyPrice: '30',
    providerSellPrice: '32',
    sourcePublishedAt: NOW,
    fetchedAt: NOW,
    lastSuccessfulCheckAt: NOW,
    serviceCountry,
    deliveryMethod: 'cash',
    channel: 'branch',
    ...(branchId ? { branchId } : {}),
    dataKind: 'published_board',
  });
const quotes = [...board('bot', 'TW'), ...board('moneybox', 'KR', 'myeongdong')];
const manual = (providerId: string, sourceKind: 'bank' | 'exchange-shop') => ({
  mode: 'manual' as const,
  manualProvider: { providerId, sourceKind },
});
const open = () => fireEvent.click(screen.getByText('換匯條件'));

beforeEach(() =>
  useConverterStore.setState({
    serviceCountry: 'TW',
    branchId: null,
    providerPreference: manual('bot', 'bank'),
  }),
);

it('shows the provider label instead of its id when no quote exists, without a stale-location suffix', () => {
  render(<FxContextControls quotes={[]} />);
  open();

  expect(screen.getByRole('option', { name: '台灣銀行' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: /此地點無報價/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'bot' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('換匯方式')).not.toBeInTheDocument();
});

it('hides the location select for a manual provider that has a single location', () => {
  render(<FxContextControls quotes={quotes} />);
  open();

  expect(screen.queryByLabelText('換匯地點')).not.toBeInTheDocument();
  expect(screen.getByRole('option', { name: '明洞換匯所' })).toBeInTheDocument();
});

it('shows the location select in best mode when several locations exist', () => {
  useConverterStore.setState({ providerPreference: { mode: 'best' } });
  render(<FxContextControls quotes={quotes} />);
  open();

  const location = screen.getByLabelText('換匯地點');
  expect(location).toBeVisible();
  expect(screen.getByRole('option', { name: '台灣' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '南韓' })).toBeInTheDocument();
});

it('adopts the provider location automatically when a provider is chosen', () => {
  render(<FxContextControls quotes={quotes} />);
  open();

  fireEvent.change(screen.getByLabelText('牌告來源'), { target: { value: 'moneybox' } });

  const state = useConverterStore.getState();
  expect(state.serviceCountry).toBe('KR');
  expect(state.branchId).toBe('myeongdong');
  expect(state.providerPreference.manualProvider?.providerId).toBe('moneybox');
});

it('does not contradict itself for a stored provider whose only location differs from the stored country', () => {
  useConverterStore.setState({ providerPreference: manual('moneybox', 'exchange-shop') });
  render(<FxContextControls quotes={quotes} />);
  open();

  expect(screen.queryByLabelText('換匯地點')).not.toBeInTheDocument();
  expect(screen.queryByText(/此地點無報價/)).not.toBeInTheDocument();
  expect(screen.getByLabelText('牌告來源')).toHaveValue('moneybox');
  // 單一分店不需要選擇器。
  expect(screen.queryByLabelText('換匯分店')).not.toBeInTheDocument();
});

it('offers a branch select only when the provider has several branches', () => {
  useConverterStore.setState({
    serviceCountry: 'KR',
    providerPreference: manual('moneybox', 'exchange-shop'),
  });
  render(
    <FxContextControls
      quotes={[...board('moneybox', 'KR', 'myeongdong'), ...board('moneybox', 'KR', 'hongdae')]}
    />,
  );
  open();

  expect(screen.getByLabelText('換匯分店')).toBeVisible();
});

it('persists the derived country when a branch is chosen so the stored location cannot go stale', () => {
  useConverterStore.setState({
    serviceCountry: 'TW',
    providerPreference: manual('moneybox', 'exchange-shop'),
  });
  render(
    <FxContextControls
      quotes={[...board('moneybox', 'KR', 'myeongdong'), ...board('moneybox', 'KR', 'hongdae')]}
    />,
  );
  open();

  fireEvent.change(screen.getByLabelText('換匯分店'), { target: { value: 'hongdae' } });

  const state = useConverterStore.getState();
  expect(state.serviceCountry).toBe('KR');
  expect(state.branchId).toBe('hongdae');
});
