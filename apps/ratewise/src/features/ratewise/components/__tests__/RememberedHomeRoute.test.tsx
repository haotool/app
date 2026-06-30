// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RememberedHomeRoute } from '../RememberedHomeRoute';
import { __resetColdStartRestoreForTests, markRestoreAttempted } from '../coldStartRestore';
import { useConverterStore } from '../../../../stores/converterStore';
import { CONVERTER_STORE_KEY } from '../../storage-keys';

vi.mock('../../RateWise', () => ({
  default: ({ rememberConverterView = true }: { rememberConverterView?: boolean }) => (
    <div data-testid="ratewise-single" data-remember={String(rememberConverterView)}>
      Single
    </div>
  ),
}));

const MultiMarker = () => <div data-testid="multi-page">Multi</div>;

const multiPersistPayload = JSON.stringify({
  state: { lastConverterView: 'multi' },
  version: 0,
});

function renderHome(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<RememberedHomeRoute />} />
        <Route path="/multi" element={<MultiMarker />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RememberedHomeRoute', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    __resetColdStartRestoreForTests();
    useConverterStore.setState({ lastConverterView: 'single' });
  });

  it('lastConverterView=multi 且已 hydrate 時仍停留 single（E4-T4）', async () => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'multi' });

    renderHome('/');

    expect(await screen.findByTestId('ratewise-single')).toBeInTheDocument();
    expect(screen.queryByTestId('multi-page')).not.toBeInTheDocument();
  });

  it('lastConverterView=single 時渲染單幣別且不導向', async () => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'single' });

    renderHome('/');

    expect(await screen.findByTestId('ratewise-single')).toBeInTheDocument();
    expect(screen.queryByTestId('multi-page')).not.toBeInTheDocument();
  });

  it('停留 single 還原決策完成後才允許 RateWise 寫入偏好（rememberConverterView=true）', async () => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'single' });

    renderHome('/');

    // 還原決策完成（hydrated 且不導向 multi）後才開放寫入，避免覆寫 persist 的 lastConverterView。
    expect(await screen.findByTestId('ratewise-single')).toHaveAttribute('data-remember', 'true');
  });

  it('deep-link query 存在時不導向，即使 lastConverterView=multi', async () => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'multi' });

    renderHome('/?from=USD');

    expect(await screen.findByTestId('ratewise-single')).toBeInTheDocument();
    expect(screen.queryByTestId('multi-page')).not.toBeInTheDocument();
  });

  it('冷啟動還原旗標設定後第二次造訪 / 仍停留 single', async () => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'multi' });

    const { unmount } = renderHome('/');
    expect(await screen.findByTestId('ratewise-single')).toBeInTheDocument();
    unmount();

    renderHome('/');
    expect(await screen.findByTestId('ratewise-single')).toBeInTheDocument();
    expect(screen.queryByTestId('multi-page')).not.toBeInTheDocument();
  });

  it('冷啟動：persist multi 晚於 hydrated 同步時仍應導向 /multi', async () => {
    vi.stubEnv('MODE', 'development');
    localStorage.setItem(CONVERTER_STORE_KEY, multiPersistPayload);
    useConverterStore.setState({ lastConverterView: 'single' });
    // setState 會觸發 persist 寫回；還原 localStorage 以模擬 store 尚未 rehydrate 完成。
    localStorage.setItem(CONVERTER_STORE_KEY, multiPersistPayload);
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);

    queueMicrotask(() => {
      useConverterStore.setState({ lastConverterView: 'multi' });
    });

    renderHome('/');

    await waitFor(() => {
      expect(screen.getByTestId('multi-page')).toBeInTheDocument();
    });
    vi.unstubAllEnvs();
  });

  it('從 /multi 冷啟動後 in-app 導向 / 不應 redirect 回 /multi', async () => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'multi' });

    // 模擬非首頁冷啟動：模組初始化時已預先標記還原嘗試
    markRestoreAttempted();

    renderHome('/');
    expect(await screen.findByTestId('ratewise-single')).toBeInTheDocument();
    expect(screen.queryByTestId('multi-page')).not.toBeInTheDocument();
  });

  it('production MODE：store 已同步 multi 但 hasHydrated=false 時仍導向 /multi', async () => {
    vi.stubEnv('MODE', 'production');
    localStorage.setItem(CONVERTER_STORE_KEY, multiPersistPayload);
    useConverterStore.setState({ lastConverterView: 'multi' });
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(false);

    renderHome('/');

    await waitFor(() => {
      expect(screen.getByTestId('multi-page')).toBeInTheDocument();
    });
    vi.unstubAllEnvs();
  });
});
