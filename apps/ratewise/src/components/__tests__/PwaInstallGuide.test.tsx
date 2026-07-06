import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_INFO } from '../../config/app-info';
import { PwaInstallGuide } from '../PwaInstallGuide';

function mockNavigator(userAgent: string, platform: string, maxTouchPoints = 5) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'platform', {
    value: platform,
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    value: maxTouchPoints,
    configurable: true,
  });
}

function showGuide() {
  // 指引改為首次互動後才起算顯示計時：先模擬使用者互動再推進計時器。
  act(() => {
    fireEvent.pointerDown(window);
    vi.advanceTimersByTime(1800);
  });
}

describe('PwaInstallGuide', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('stays hidden until the user interacts (LCP-safe engagement gate)', () => {
    mockNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      'iPhone',
    );

    render(<PwaInstallGuide />);

    // 未互動：即使超過顯示延遲，也不得出現指引。
    // scroll 不在互動集合內：程式化捲動（scroll restoration／anchor）不得誤觸 gate。
    act(() => {
      fireEvent.scroll(window);
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // 互動後起算延遲，時間到才顯示。
    act(() => {
      fireEvent.pointerDown(window);
      vi.advanceTimersByTime(1799);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows automatically without interaction inside in-app browsers (functional escape guidance)', () => {
    mockNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Threads 337.0 Instagram 337.0',
      'iPhone',
    );

    render(<PwaInstallGuide />);

    // 內建瀏覽器豁免互動 gate：未互動經過顯示延遲即自動顯示逃逸引導。
    act(() => {
      vi.advanceTimersByTime(1799);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('dialog', { name: '請先用外部瀏覽器開啟' })).toBeInTheDocument();
  });

  it('renders the clearer iPhone Safari install flow', () => {
    mockNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      'iPhone',
    );

    render(<PwaInstallGuide />);
    showGuide();

    const title = `把 ${APP_INFO.shortName} 加到 iPhone 主畫面`;

    expect(screen.getByRole('dialog', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: title })).toHaveClass('-translate-x-1/2');
    expect(screen.getByText('右下方 ...')).toBeInTheDocument();
    expect(screen.getByText('分享')).toBeInTheDocument();
    expect(screen.getByText('檢視較多')).toBeInTheDocument();
    expect(screen.getByText('加入主畫面')).toBeInTheDocument();
    // 一般瀏覽器不應顯示內建瀏覽器專屬的右上角動態指引。
    expect(screen.queryByTestId('inapp-corner-pointer')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: title })).toHaveAttribute(
      'src',
      '/pwa-install/ios-install-guide.png',
    );
  });

  it.each([
    {
      label: 'legacy Threads token',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Threads 337.0 Instagram 337.0',
    },
    {
      label: 'Barcelona iOS token (2025+ production)',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22H352 Barcelona 431.0.0.25.69 (iPhone13,3; iOS 18_7_8; en_US; en; scale=3.00; 1170x2532; IABMV/1; 979167741)',
    },
  ])('renders external-browser guidance inside Threads in-app browser: $label', ({ userAgent }) => {
    mockNavigator(userAgent, 'iPhone');

    render(<PwaInstallGuide />);
    showGuide();

    expect(screen.getByRole('dialog', { name: '請先用外部瀏覽器開啟' })).toBeInTheDocument();
    expect(screen.getByText('右上方 ...')).toBeInTheDocument();
    expect(screen.getByText('在瀏覽器開啟')).toBeInTheDocument();
    expect(screen.getByText(`回到 ${APP_INFO.shortName} 安裝`)).toBeInTheDocument();
    // 內建瀏覽器需顯示指向右上角 ... 的動態指引。
    const cornerPointer = screen.getByTestId('inapp-corner-pointer');
    expect(cornerPointer).toBeInTheDocument();
    expect(cornerPointer).toHaveClass('animate-point-up-right');
  });

  it('uses Android poster and native beforeinstallprompt when available', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    mockNavigator(
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
      'Linux armv8l',
    );

    render(<PwaInstallGuide />);

    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted'; platform: string }>;
    };
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    window.dispatchEvent(event);

    showGuide();

    expect(
      screen.getByRole('img', { name: `把 ${APP_INFO.shortName} 安裝到 Android` }),
    ).toHaveAttribute('src', '/pwa-install/android-install-guide.png');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: `立即安裝 ${APP_INFO.shortName}` }));
      await event.userChoice;
    });

    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('hides the poster but keeps the guide content when the image fails to load (offline)', () => {
    mockNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      'iPhone',
    );

    render(<PwaInstallGuide />);
    showGuide();

    const title = `把 ${APP_INFO.shortName} 加到 iPhone 主畫面`;
    const poster = screen.getByRole('img', { name: title });

    act(() => {
      fireEvent.error(poster);
    });

    // 圖區隱藏，文字導引保留（離線誠實原則：不呈現破圖）。
    expect(screen.queryByRole('img', { name: title })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: title })).toBeInTheDocument();
    expect(screen.getByText('加入主畫面')).toBeInTheDocument();
  });

  it('closes when the Escape key is pressed', () => {
    mockNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      'iPhone',
    );

    render(<PwaInstallGuide />);
    showGuide();

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not intercept beforeinstallprompt on desktop Chrome', () => {
    const preventDefault = vi.fn();
    mockNavigator(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'MacIntel',
      0,
    );

    render(<PwaInstallGuide />);

    const event = new Event('beforeinstallprompt') as Event & { preventDefault: () => void };
    event.preventDefault = preventDefault;
    window.dispatchEvent(event);

    showGuide();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('stays hidden when the PWA is already standalone', () => {
    mockNavigator(
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
      'Linux armv8l',
    );
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);

    render(<PwaInstallGuide />);
    showGuide();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
