// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RememberedHomeRoute } from '../RememberedHomeRoute';
import { __resetColdStartRestoreForTests, markRestoreAttempted } from '../coldStartRestore';
import { useConverterStore } from '../../../../stores/converterStore';
import { CONVERTER_STORE_KEY } from '../../storage-keys';
import { isCardRateEnabled } from '../../../../config/card-rate-flag';
import { getConverterV2Variant } from '../../../../config/converter-v2-flag';

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

  it('lastConverterView=multi 且已 hydrate 時導向 /multi', async () => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'multi' });

    renderHome('/');

    await waitFor(() => {
      expect(screen.getByTestId('multi-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('ratewise-single')).not.toBeInTheDocument();
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

  // #654 query 豁免矩陣：任何帶 query 的進站（含白名單外參數）皆豁免 remembered redirect。
  it.each([
    '/?from=USD',
    '/?to=JPY',
    '/?amount=100',
    '/?cardRate=on',
    '/?converter=legacy',
    '/?converter=v2',
    '/?utm_source=qa',
    '/?unknown=1',
  ])('query 豁免矩陣：%s 進站不導向，即使 lastConverterView=multi', async (entry) => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'multi' });

    renderHome(entry);

    expect(await screen.findByTestId('ratewise-single')).toBeInTheDocument();
    expect(screen.queryByTestId('multi-page')).not.toBeInTheDocument();
  });

  it('#654：persisted multi＋?converter=legacy 進站落在單幣別且 override 解析為 legacy', async () => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'multi', singleConverterVariant: 'v2' });
    // flag 讀取端以 window.location.search 為準（與 cardRate S2 測試同一模式）。
    window.history.replaceState(null, '', '/?converter=legacy');

    renderHome('/?converter=legacy');

    expect(await screen.findByTestId('ratewise-single')).toBeInTheDocument();
    expect(screen.queryByTestId('multi-page')).not.toBeInTheDocument();
    expect(getConverterV2Variant()).toBe('legacy');

    window.history.replaceState(null, '', '/');
    useConverterStore.setState({ singleConverterVariant: 'legacy' });
  });

  it('S2：persisted multi＋?cardRate=on 進站不導向（Phase 1 URL 唯一啟用入口）且 flag 生效', async () => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'multi' });
    // BrowserRouter 下 URL 反映於 window.location；flag 讀取端據此生效。
    window.history.replaceState(null, '', '/?cardRate=on');

    renderHome('/?cardRate=on');

    expect(await screen.findByTestId('ratewise-single')).toBeInTheDocument();
    expect(screen.queryByTestId('multi-page')).not.toBeInTheDocument();
    expect(isCardRateEnabled()).toBe(true);

    window.history.replaceState(null, '', '/');
  });

  it('冷啟動還原後第二次造訪 / 不再導向', async () => {
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(true);
    useConverterStore.setState({ lastConverterView: 'multi' });

    const { unmount } = renderHome('/');
    await waitFor(() => {
      expect(screen.getByTestId('multi-page')).toBeInTheDocument();
    });
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

  it('冷啟動同步還原：persisted multi 於 hydration 完成同一 commit 內即導向 /multi（不需 waitFor）', () => {
    // 非 test MODE 才會走 hydrated=false 起始 + layout effect 同步翻轉的真實時序。
    vi.stubEnv('MODE', 'development');
    localStorage.setItem(CONVERTER_STORE_KEY, multiPersistPayload);
    useConverterStore.setState({ lastConverterView: 'multi' });
    // 還原 setState 觸發的 persist 寫回，維持 localStorage 與 store 一致的 multi。
    localStorage.setItem(CONVERTER_STORE_KEY, multiPersistPayload);
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(false);

    renderHome('/');

    // render 返回時 layout effect 已同步執行（paint 前），Navigate 應已生效——
    // 同步斷言（無 waitFor / 無 microtask 推進）即可觀察到路由變更。
    expect(screen.getByTestId('multi-page')).toBeInTheDocument();
    expect(screen.queryByTestId('ratewise-single')).not.toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it('冷啟動同步還原：有 deep-link（?from=USD）時不還原，維持單幣', () => {
    vi.stubEnv('MODE', 'development');
    localStorage.setItem(CONVERTER_STORE_KEY, multiPersistPayload);
    useConverterStore.setState({ lastConverterView: 'multi' });
    localStorage.setItem(CONVERTER_STORE_KEY, multiPersistPayload);
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(false);

    renderHome('/?from=USD');

    expect(screen.getByTestId('ratewise-single')).toBeInTheDocument();
    expect(screen.queryByTestId('multi-page')).not.toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it('冷啟動同步還原：persisted 為 null 時不還原，維持單幣', () => {
    vi.stubEnv('MODE', 'development');
    localStorage.removeItem(CONVERTER_STORE_KEY);
    useConverterStore.setState({ lastConverterView: 'single' });
    localStorage.removeItem(CONVERTER_STORE_KEY);
    vi.spyOn(useConverterStore.persist, 'hasHydrated').mockReturnValue(false);

    renderHome('/');

    expect(screen.getByTestId('ratewise-single')).toBeInTheDocument();
    expect(screen.queryByTestId('multi-page')).not.toBeInTheDocument();
    vi.unstubAllEnvs();
  });
});
