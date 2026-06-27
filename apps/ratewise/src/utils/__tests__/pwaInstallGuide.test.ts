import { describe, expect, it } from 'vitest';
import { getPwaInstallEnvironment } from '../pwaInstallGuide';

describe('pwaInstallGuide environment detection', () => {
  it('detects iOS Safari as install-guide eligible', () => {
    const environment = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });

    expect(environment).toMatchObject({
      platform: 'ios',
      inAppBrowser: null,
      isInstalled: false,
      shouldShowGuide: true,
    });
  });

  it('detects iPadOS desktop mode as iOS', () => {
    const environment = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    });

    expect(environment.platform).toBe('ios');
    expect(environment.shouldShowGuide).toBe(true);
  });

  it('detects Android as install-guide eligible', () => {
    const environment = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
    });

    expect(environment.platform).toBe('android');
    expect(environment.shouldShowGuide).toBe(true);
  });

  it('detects Threads in-app browser and still shows external-browser guide', () => {
    const environment = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Threads 337.0 Instagram 337.0',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });

    expect(environment.inAppBrowser).toBe('threads');
    expect(environment.shouldShowGuide).toBe(true);
  });

  it.each([
    {
      label: 'musical_ly version suffix',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 musical_ly_37.0.0 JsSdk/2.0 NetType/WIFI',
      expected: 'tiktok' as const,
    },
    {
      label: 'trill iOS version suffix',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 trill_41.5.0 JsSdk/2.0 NetType/WIFI',
      expected: 'tiktok' as const,
    },
    {
      label: 'TikTok token with version',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 TikTok 26.1.0 JsSdk/2.0',
      expected: 'tiktok' as const,
    },
    {
      label: 'BytedanceWebview with musical_ly version',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 BytedanceWebview/x musical_ly_35.1.0',
      expected: 'tiktok' as const,
    },
    {
      label: 'musical_lyric false positive guard',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 musical_lyric JsSdk/2.0',
      expected: null,
    },
    {
      label: 'plain iOS Safari',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      expected: null,
    },
  ])('detects TikTok in-app browser: $label', ({ userAgent, expected }) => {
    const environment = getPwaInstallEnvironment({
      userAgent,
      platform: 'iPhone',
      maxTouchPoints: 5,
    });

    expect(environment.inAppBrowser).toBe(expected);
    if (expected === 'tiktok') {
      expect(environment.shouldShowGuide).toBe(true);
    }
  });

  it('classifies Messenger in-app browser as messenger, not facebook', () => {
    const iosMessenger = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 [FBAN/MessengerForiOS;FBAV/451.0.0;FBBV/1]',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });
    const androidMessenger = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/142.0.0.0 Mobile Safari/537.36 [FB_IAB/MESSENGER;FBAV/451.0.0;]',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
    });

    expect(iosMessenger.inAppBrowser).toBe('messenger');
    expect(androidMessenger.inAppBrowser).toBe('messenger');
  });

  it('does not show guide when already launched standalone', () => {
    const environment = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
      isStandalone: true,
    });

    expect(environment.isInstalled).toBe(true);
    expect(environment.shouldShowGuide).toBe(false);
  });
});
