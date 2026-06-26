import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_INFO } from '../../config/app-info';
import {
  notifyConversionSuccess,
  resetConversionSuccessSignalForTests,
} from '../../utils/conversionSuccessSignal';
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

function showGuideAfterConversion() {
  act(() => {
    notifyConversionSuccess();
  });
}

describe('PwaInstallGuide', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    localStorage.clear();
    resetConversionSuccessSignalForTests();
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    resetConversionSuccessSignalForTests();
  });

  it('does not auto-show within 3 seconds on cold load', () => {
    mockNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      'iPhone',
    );

    render(<PwaInstallGuide />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the clearer iPhone Safari install flow after conversion success', () => {
    mockNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      'iPhone',
    );

    render(<PwaInstallGuide />);
    showGuideAfterConversion();

    const title = `把 ${APP_INFO.shortName} 加到 iPhone 主畫面`;

    expect(screen.getByRole('dialog', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: title })).toHaveClass('-translate-x-1/2');
    expect(screen.getByText('右下方 ...')).toBeInTheDocument();
    expect(screen.getByText('分享')).toBeInTheDocument();
    expect(screen.getByText('檢視較多')).toBeInTheDocument();
    expect(screen.getByText('加入主畫面')).toBeInTheDocument();
    expect(screen.queryByTestId('inapp-corner-pointer')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: title })).toHaveAttribute(
      'src',
      '/pwa-install/ios-install-guide.png',
    );
  });

  it('renders external-browser guidance inside Threads in-app browser', () => {
    mockNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Threads 337.0 Instagram 337.0',
      'iPhone',
    );

    render(<PwaInstallGuide />);
    showGuideAfterConversion();

    expect(screen.getByRole('dialog', { name: '請先用外部瀏覽器開啟' })).toBeInTheDocument();
    expect(screen.getByText('右上方 ...')).toBeInTheDocument();
    expect(screen.getByText('在瀏覽器開啟')).toBeInTheDocument();
    expect(screen.getByText(`回到 ${APP_INFO.shortName} 安裝`)).toBeInTheDocument();
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

    showGuideAfterConversion();

    expect(
      screen.getByRole('img', { name: `把 ${APP_INFO.shortName} 安裝到 Android` }),
    ).toHaveAttribute('src', '/pwa-install/android-install-guide.png');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: `立即安裝 ${APP_INFO.shortName}` }));
      await event.userChoice;
    });

    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('closes when the Escape key is pressed', () => {
    mockNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      'iPhone',
    );

    render(<PwaInstallGuide />);
    showGuideAfterConversion();

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

    showGuideAfterConversion();

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
    showGuideAfterConversion();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
