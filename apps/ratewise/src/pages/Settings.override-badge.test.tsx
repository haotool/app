/**
 * Settings「單幣別模式」URL override 提示 badge 測試（issue #583 附帶 Nits）：
 * effective 值（含 ?converter= 覆寫）與儲存偏好不一致時才顯示提示。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Settings from './Settings';
import { useConverterStore } from '../stores/converterStore';

const renderSettings = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    </HelmetProvider>,
  );

describe('Settings - 單幣別模式 URL override 提示 badge', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/settings');
    useConverterStore.setState({ singleConverterVariant: 'legacy' });
  });

  it('無 URL override：不顯示提示 badge', () => {
    renderSettings();
    expect(screen.queryByTestId('converter-variant-override-badge')).not.toBeInTheDocument();
  });

  it('?converter=v2 與儲存偏好 legacy 不一致：顯示提示 badge', () => {
    window.history.replaceState(null, '', '/settings?converter=v2');
    renderSettings();
    expect(screen.getByTestId('converter-variant-override-badge')).toBeInTheDocument();
  });

  it('?converter=legacy 與儲存偏好 v2 不一致：顯示提示 badge', () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });
    window.history.replaceState(null, '', '/settings?converter=legacy');
    renderSettings();
    expect(screen.getByTestId('converter-variant-override-badge')).toBeInTheDocument();
  });

  it('?converter=v2 與儲存偏好 v2 一致：不顯示提示 badge', () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });
    window.history.replaceState(null, '', '/settings?converter=v2');
    renderSettings();
    expect(screen.queryByTestId('converter-variant-override-badge')).not.toBeInTheDocument();
  });
});
