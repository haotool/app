import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';
import App from './App';
import i18n from './i18n';
import { useStore } from './store/useStore';

vi.mock('./components/HomeTab', () => ({
  HomeTab: ({ onPawParticle }: { onPawParticle?: (x: number, y: number) => void }) => (
    <button onClick={() => onPawParticle?.(12, 34)}>HomeTab</button>
  ),
}));

vi.mock('./components/HistoryTab', () => ({
  HistoryTab: () => <div>HistoryTab</div>,
}));

vi.mock('./components/SettingsTab', () => ({
  SettingsTab: () => <div>SettingsTab</div>,
}));

vi.mock('./components/BottomNav', () => ({
  BottomNav: () => <nav>BottomNav</nav>,
}));

vi.mock('./components/TripSelector', () => ({
  TripSelector: () => <div>TripSelector</div>,
}));

vi.mock('./components/UpdatePrompt', () => ({
  UpdatePrompt: () => <div>UpdatePrompt</div>,
}));

vi.mock('./components/PayerSelector', () => ({
  PayerSelector: () => <div>PayerSelector</div>,
}));

vi.mock('./components/CatCompanion', () => ({
  CatCompanion: () => <div data-testid="cat-companion">CatCompanion</div>,
}));

vi.mock('./components/CatPlayLayer', () => ({
  CatPlayLayer: ({ particles }: { particles: { id: number }[] }) => (
    <div data-testid="cat-play-layer">{particles.length}</div>
  ),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('App', () => {
  beforeEach(() => {
    void i18n.changeLanguage('zh-TW');

    useStore.setState({
      activeTab: 'home',
      catPlayMode: false,
      trips: [{ id: 'trip-1', name: 'Trip', createdAt: 0 }],
      currentTripId: 'trip-1',
      members: [{ id: 'me', name: 'Me', avatarUrl: 'seed', isActive: true }],
      expenses: [],
    });

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('應依 activeTab 渲染目前頁面並顯示共用框架', () => {
    render(<App />, { wrapper: Wrapper });

    expect(screen.getByText('HomeTab')).toBeInTheDocument();
    expect(screen.getByText('BottomNav')).toBeInTheDocument();
    expect(screen.getByText('TripSelector')).toBeInTheDocument();
    expect(screen.getByText('PayerSelector')).toBeInTheDocument();
  });

  it('catPlayMode 開啟時應顯示貓咪夥伴，並可建立 paw 粒子層', () => {
    useStore.setState({ catPlayMode: true });
    render(<App />, { wrapper: Wrapper });

    expect(screen.getByTestId('cat-companion')).toBeInTheDocument();

    fireEvent.click(screen.getByText('HomeTab'));
    expect(screen.getByTestId('cat-play-layer')).toHaveTextContent('1');
  });

  it('可使用 navigator.share 直接分享', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    });

    render(<App />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTitle('分享'));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        title: '喵喵分帳',
        url: window.location.href,
      });
    });
  });

  it('分享 API 不可用時應回退到 clipboard 並顯示已複製提示', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(<App />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTitle('分享'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(window.location.href);
    });
    expect(screen.getByText('已複製連結！')).toBeInTheDocument();
  });
});
