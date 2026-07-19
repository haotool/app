// PWA 安裝偵測與指引（GAME_DESIGN §93）：偵測矩陣移植 RateWise pwaInstallGuide
// （platform／in-app browser／standalone），以純 TS＋DOM overlay 落地於 PWA 外殼層
// （與 pwa.ts 同層，不進 Phaser Scene）。純偵測函式供 vitest node 環境驗證。

import { showShellCard, whenShellIdle, type ShellCardButton } from './shellCards';

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

// Messenger 須先於 facebook：其 UA 含 FBAN/FB_IAB，否則被 facebook 規則搶先命中。
// Threads 2024+ 內建瀏覽器 UA 使用內部代號 Barcelona（非 Threads 字串）。
const IN_APP_BROWSER_PATTERNS: [InAppBrowserKind, RegExp][] = [
  ['threads', /\b(Threads|Barcelona)\b/i],
  ['messenger', /MessengerForiOS|FB_IAB\/MESSENGER|FB_IAB\/Orca|Orca-Android/i],
  ['instagram', /\bInstagram\b/i],
  ['facebook', /\b(FBAN|FBAV|FBIOS|FB_IAB|FB4A)\b/i],
  ['line', /\bLine\//i],
  ['tiktok', /\b(TikTok|BytedanceWebview|musical_ly_[\d.]+|trill_[\d.]+)/i],
  ['x', /\b(Twitter|X-WebView)\b/i],
];

function detectInAppBrowser(userAgent: string): InAppBrowserKind | null {
  for (const [kind, pattern] of IN_APP_BROWSER_PATTERNS) {
    if (pattern.test(userAgent)) return kind;
  }
  return null;
}

function detectPlatform({
  userAgent,
  platform,
  maxTouchPoints,
}: PwaInstallEnvironmentInput): PwaInstallPlatform {
  // iPadOS 桌面模式 UA 偽裝 MacIntel，以 maxTouchPoints 辨識。
  const isIpadOsDesktopMode =
    (platform ?? '') === 'MacIntel' && typeof maxTouchPoints === 'number' && maxTouchPoints > 1;
  if (/\b(iPad|iPhone|iPod)\b/i.test(userAgent) || isIpadOsDesktopMode) return 'ios';
  if (/\bAndroid\b/i.test(userAgent)) return 'android';
  if (/\b(Macintosh|Windows|Linux x86_64|CrOS)\b/i.test(userAgent)) return 'desktop';
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
    ...(typeof navigator !== 'undefined' && navigator.platform !== ''
      ? { platform: navigator.platform }
      : {}),
    ...(typeof navigator !== 'undefined' ? { maxTouchPoints: navigator.maxTouchPoints } : {}),
    isStandalone: displayModeStandalone,
    navigatorStandalone: standaloneNavigator,
  });
}

// 指引文案（繁中、禁 emoji）：依環境分支——in-app 引導外開、iOS 分享加入主畫面、
// Android 選單安裝（有 beforeinstallprompt 時另給原生安裝鈕）。
export interface InstallGuideCopy {
  title: string;
  description: string;
  steps: string[];
}

export function getInstallGuideCopy(environment: PwaInstallEnvironment): InstallGuideCopy {
  if (environment.inAppBrowser) {
    return {
      title: '請用外部瀏覽器開啟',
      description:
        'Threads、LINE 等內建瀏覽器無法安裝遊戲。請點右上角選單，選「以瀏覽器開啟」後再安裝。',
      steps: ['點右上角選單', '以瀏覽器（Safari／Chrome）開啟', '回到本頁安裝星噗噗'],
    };
  }
  if (environment.platform === 'android') {
    return {
      title: '把星噗噗裝進手機',
      description: '安裝後全螢幕遊玩、離線也能玩，從主畫面一點即開。',
      steps: ['點瀏覽器右上角選單', '選「安裝應用程式」', '完成後從主畫面開啟'],
    };
  }
  return {
    title: '把星噗噗加到主畫面',
    description: '加入後全螢幕遊玩、離線也能玩，從主畫面一點即開。',
    steps: ['點 Safari 的分享按鈕', '往下找「加入主畫面」', '點右上角「加入」'],
  };
}

// 忽略記憶（localStorage，不進 save schema）：關閉即永久不再主動打擾。
export const INSTALL_DISMISSED_KEY = 'sp-install-dismissed';

export function hasDismissedInstallGuide(): boolean {
  try {
    return localStorage.getItem(INSTALL_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function rememberDismissedInstallGuide(): void {
  try {
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
  } catch {
    /* noop */
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const SHOW_DELAY_MS = 2500;

// 掛載安裝指引（殼內卡片，隨旋轉殼轉向）：已安裝／已忽略／不支援平台不打擾；
// 首次到站延遲 2.5 秒且僅在殼層安靜時刻顯示（遊戲進行中／配置中／暫停選單開啟時
// 延後，杜絕戰鬥彈窗——審查 B1），關閉即記憶永不再主動出現。
export function initInstallGuide(): void {
  const environment = readPwaInstallEnvironmentFromBrowser();
  if (!environment.shouldShowGuide || hasDismissedInstallGuide()) return;

  let closeCard: (() => void) | null = null;

  // beforeinstallprompt 於 load 早期發射：先攔截保存，卡片建立時再取用。
  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    rememberDismissedInstallGuide();
    closeCard?.();
    closeCard = null;
  });

  whenShellIdle(() => {
    const copy = getInstallGuideCopy(environment);
    const buttons: ShellCardButton[] = [];
    // Android 原生安裝：beforeinstallprompt 可用時給一鍵安裝，成功即收卡。
    if (deferredPrompt && environment.platform === 'android' && !environment.inAppBrowser) {
      const prompt = deferredPrompt;
      buttons.push({
        label: '立即安裝',
        primary: true,
        onPress: (close) => {
          void (async () => {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            if (choice.outcome === 'accepted') {
              rememberDismissedInstallGuide();
              close();
            }
          })();
        },
      });
    }
    buttons.push({
      label: '知道了',
      onPress: (close) => {
        rememberDismissedInstallGuide();
        close();
      },
    });
    closeCard = showShellCard({
      title: copy.title,
      description: copy.description,
      steps: copy.steps,
      buttons,
    });
  }, SHOW_DELAY_MS);
}
