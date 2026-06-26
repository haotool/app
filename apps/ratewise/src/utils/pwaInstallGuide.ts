export type PwaInstallPlatform = 'ios' | 'android' | 'desktop' | 'unknown';

export type InAppBrowserKind =
  | 'threads'
  | 'instagram'
  | 'facebook'
  | 'messenger'
  | 'line'
  | 'tiktok'
  | 'x'
  | 'unknown';

export interface PwaInstallEnvironmentInput {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  isStandalone?: boolean;
  navigatorStandalone?: boolean;
}

export interface PwaInstallEnvironment {
  platform: PwaInstallPlatform;
  inAppBrowser: InAppBrowserKind | null;
  isInstalled: boolean;
  isSupportedMobile: boolean;
  shouldShowGuide: boolean;
}

// Messenger 須先於 facebook：其 UA 含 FBAN/FB_IAB，否則會被 facebook 規則搶先命中。
const IN_APP_BROWSER_PATTERNS: [InAppBrowserKind, RegExp][] = [
  ['threads', /\bThreads\b/i],
  ['messenger', /MessengerForiOS|FB_IAB\/MESSENGER|FB_IAB\/Orca|Orca-Android/i],
  ['instagram', /\bInstagram\b/i],
  ['facebook', /\b(FBAN|FBAV|FBIOS|FB_IAB|FB4A)\b/i],
  ['line', /\bLine\//i],
  ['tiktok', /\b(TikTok|BytedanceWebview|musical_ly[\d._]*)/i],
  ['x', /\b(Twitter|X-WebView)\b/i],
];

function detectInAppBrowser(userAgent: string): InAppBrowserKind | null {
  for (const [kind, pattern] of IN_APP_BROWSER_PATTERNS) {
    if (pattern.test(userAgent)) {
      return kind;
    }
  }

  return null;
}

function detectPlatform({
  userAgent,
  platform,
  maxTouchPoints,
}: PwaInstallEnvironmentInput): PwaInstallPlatform {
  const normalizedPlatform = platform ?? '';
  const isIpadOSDesktopMode =
    normalizedPlatform === 'MacIntel' && typeof maxTouchPoints === 'number' && maxTouchPoints > 1;

  if (/\b(iPad|iPhone|iPod)\b/i.test(userAgent) || isIpadOSDesktopMode) {
    return 'ios';
  }

  if (/\bAndroid\b/i.test(userAgent)) {
    return 'android';
  }

  if (/\b(Macintosh|Windows|Linux x86_64|CrOS)\b/i.test(userAgent)) {
    return 'desktop';
  }

  return 'unknown';
}

export function getPwaInstallEnvironment(input: PwaInstallEnvironmentInput): PwaInstallEnvironment {
  const platform = detectPlatform(input);
  const inAppBrowser = detectInAppBrowser(input.userAgent);
  const isInstalled = (input.isStandalone ?? false) || (input.navigatorStandalone ?? false);
  const isSupportedMobile = platform === 'ios' || platform === 'android';

  return {
    platform,
    inAppBrowser,
    isInstalled,
    isSupportedMobile,
    shouldShowGuide: !isInstalled && (isSupportedMobile || inAppBrowser !== null),
  };
}

export function readPwaInstallEnvironmentFromBrowser(): PwaInstallEnvironment {
  const displayModeStandalone =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const standaloneNavigator =
    typeof navigator !== 'undefined' &&
    'standalone' in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return getPwaInstallEnvironment({
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
    platform: typeof navigator === 'undefined' ? undefined : navigator.platform,
    maxTouchPoints: typeof navigator === 'undefined' ? undefined : navigator.maxTouchPoints,
    isStandalone: displayModeStandalone,
    navigatorStandalone: standaloneNavigator,
  });
}
