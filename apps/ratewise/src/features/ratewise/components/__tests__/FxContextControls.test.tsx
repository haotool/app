import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useConverterStore } from '../../../../stores/converterStore';
import { FxContextControls } from '../FxContextControls';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'zh-TW' } }) }));

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
  expect(screen.getByRole('option', { name: '台灣銀行（此地點無報價）' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'bot' })).not.toBeInTheDocument();
});
