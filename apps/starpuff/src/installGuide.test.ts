import { describe, expect, it } from 'vitest';
import { getInstallGuideCopy, getPwaInstallEnvironment } from './installGuide';

// 偵測矩陣仿 RateWise pwaInstallGuide 測試（§90）：平台分支、in-app browser、standalone。
describe('getPwaInstallEnvironment（§90 PWA 安裝偵測矩陣）', () => {
  it('iOS Safari：需手動加入主畫面，顯示指引', () => {
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

  it('iPadOS 桌面模式（MacIntel＋multi-touch）判為 iOS', () => {
    const environment = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    });
    expect(environment.platform).toBe('ios');
    expect(environment.shouldShowGuide).toBe(true);
  });

  it('Android Chrome：beforeinstallprompt 平台，顯示指引', () => {
    const environment = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
    });
    expect(environment.platform).toBe('android');
    expect(environment.shouldShowGuide).toBe(true);
  });

  it('桌面瀏覽器：不主動打擾（shouldShowGuide=false）', () => {
    const environment = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    });
    expect(environment.platform).toBe('desktop');
    expect(environment.isSupportedMobile).toBe(false);
    expect(environment.shouldShowGuide).toBe(false);
  });

  it.each([
    {
      label: '舊版 Threads token',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Threads 337.0 Instagram 337.0',
    },
    {
      label: 'Barcelona iOS token（2025+ 正式版）',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22H352 Barcelona 431.0.0.25.69 (iPhone13,3; iOS 18_7_8; en_US; en; scale=3.00; 1170x2532; IABMV/1; 979167741)',
    },
    {
      label: 'Barcelona Android token',
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; SM-S921B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/136.0.7103.125 Mobile Safari/537.36 Barcelona 382.0.0.51.85 Android (34/14; 480dpi; 1080x2109; samsung)',
    },
  ])('Threads 內建瀏覽器：$label', ({ userAgent }) => {
    const environment = getPwaInstallEnvironment({
      userAgent,
      platform: userAgent.includes('Android') ? 'Linux armv8l' : 'iPhone',
      maxTouchPoints: 5,
    });
    expect(environment.inAppBrowser).toBe('threads');
    expect(environment.shouldShowGuide).toBe(true);
  });

  it.each([
    {
      label: 'musical_ly 版本尾碼',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 musical_ly_37.0.0 JsSdk/2.0 NetType/WIFI',
      expected: 'tiktok' as const,
    },
    {
      label: 'trill iOS 版本尾碼',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 trill_41.5.0 JsSdk/2.0 NetType/WIFI',
      expected: 'tiktok' as const,
    },
    {
      label: 'musical_lyric 假陽性防護',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 musical_lyric JsSdk/2.0',
      expected: null,
    },
    {
      label: '一般 iOS Safari',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      expected: null,
    },
  ])('TikTok 內建瀏覽器：$label', ({ userAgent, expected }) => {
    const environment = getPwaInstallEnvironment({
      userAgent,
      platform: 'iPhone',
      maxTouchPoints: 5,
    });
    expect(environment.inAppBrowser).toBe(expected);
  });

  it('Messenger 判為 messenger 而非 facebook（規則順序）', () => {
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

  it('LINE 內建瀏覽器命中 line', () => {
    const environment = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari Line/14.0.0',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });
    expect(environment.inAppBrowser).toBe('line');
    expect(environment.shouldShowGuide).toBe(true);
  });

  it('display-mode standalone（已安裝）不再打擾', () => {
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

  it('iOS navigator.standalone（已加入主畫面）不再打擾', () => {
    const environment = getPwaInstallEnvironment({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      platform: 'iPhone',
      maxTouchPoints: 5,
      navigatorStandalone: true,
    });
    expect(environment.isInstalled).toBe(true);
    expect(environment.shouldShowGuide).toBe(false);
  });
});

describe('getInstallGuideCopy（§90 分平台文案）', () => {
  const base = { maxTouchPoints: 5 };

  it('in-app browser 優先引導外開', () => {
    const copy = getInstallGuideCopy(
      getPwaInstallEnvironment({
        ...base,
        userAgent: 'Mozilla/5.0 (iPhone) AppleWebKit Mobile Barcelona 431.0',
        platform: 'iPhone',
      }),
    );
    expect(copy.title).toContain('外部瀏覽器');
    expect(copy.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('iOS 給分享加入主畫面步驟', () => {
    const copy = getInstallGuideCopy(
      getPwaInstallEnvironment({
        ...base,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) Safari/604.1',
        platform: 'iPhone',
      }),
    );
    expect(copy.steps.join('')).toContain('加入主畫面');
  });

  it('Android 給選單安裝步驟', () => {
    const copy = getInstallGuideCopy(
      getPwaInstallEnvironment({
        ...base,
        userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/142.0.0.0 Mobile',
        platform: 'Linux armv8l',
      }),
    );
    expect(copy.steps.join('')).toContain('安裝應用程式');
  });
});
