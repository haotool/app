import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useConverterStore } from '../../../../stores/converterStore';
import { FxContextControls } from '../FxContextControls';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'zh-TW' },
    t: (key: string) =>
      ({ 'fxUi.conditions': '換匯條件', 'fxUi.unavailableInLocation': '此地點無報價' })[key] ?? key,
  }),
}));

beforeEach(() =>
  useConverterStore.setState({
    serviceCountry: 'TW',
    providerPreference: {
      mode: 'manual',
      manualProvider: { providerId: 'bot', sourceKind: 'bank' },
    },
  }),
);

it('shows the provider label instead of its id when no local quote exists', () => {
  render(<FxContextControls quotes={[]} />);
  expect(screen.getByLabelText('換匯地點')).not.toBeVisible();
  fireEvent.click(screen.getByText('換匯條件'));
  expect(screen.getByLabelText('換匯地點')).toBeVisible();
  expect(screen.queryByLabelText('換匯方式')).not.toBeInTheDocument();
  expect(screen.getByRole('option', { name: '台灣銀行（此地點無報價）' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'bot' })).not.toBeInTheDocument();
});
