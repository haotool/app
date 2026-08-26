// PWA 安裝偵測與指引（GAME_DESIGN §90）：偵測矩陣移植 RateWise pwaInstallGuide
// （platform／in-app browser／standalone），以純 TS＋DOM overlay 落地於 PWA 外殼層
// （與 pwa.ts 同層，不進 Phaser Scene）。純偵測函式供 vitest node 環境驗證。

import {
  showShellCard,
  whenShellIdle,
  type ShellCardButton,
  type ShellCardOptions,
} from './shellCards';
import { PWA_INSTALL_ILLUSTRATION_URL } from './onboardingAssets';

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
// Threads 2024+ 內建瀏覽器常以 Threads 或內部代號 Barcelona 出現在 UA；只接受
// token 邊界，避免把一般頁面字串誤當成 Threads。LINE 則要求正式 Line/<version>
// token（Android 另允許 /IAB 後綴）；平台識別集中在這張表，文案與 UI 不得另寫第二份 UA 判斷。
const IN_APP_BROWSER_PATTERNS: readonly [InAppBrowserKind, RegExp][] = [
  ['threads', /(?:^|[\s;(])(?:Threads(?:App)?|Barcelona)(?:[/\s;)]|$)/i],
  ['messenger', /MessengerForiOS|FB_IAB\/MESSENGER|FB_IAB\/Orca|Orca-Android/i],
  ['instagram', /\bInstagram\b/i],
  ['facebook', /\b(FBAN|FBAV|FBIOS|FB_IAB|FB4A)\b/i],
  ['line', /(?:^|[\s;(])Line\/[\d.]+(?:\/IAB)?(?:[\s;)]|$)/i],
  ['tiktok', /\b(TikTok|BytedanceWebview|musical_ly_[\d.]+|trill_[\d.]+)/i],
  ['x', /\b(Twitter|X-WebView)\b/i],
];

export function detectInAppBrowser(userAgent: string): InAppBrowserKind | null {
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

// 指引文案（繁中、禁 emoji）：依環境分支——內建瀏覽器先外開、iOS 分享加入主畫面、
// Android 選單安裝（有 beforeinstallprompt 時另給原生安裝鈕）。LINE／Threads
// 必須分開描述，因為兩個 App 的入口位置與使用者看到的選單都不同。
export type InstallGuideVariant = 'pwa-install' | 'embedded-browser';

export interface InstallGuideCopy {
  variant: InstallGuideVariant;
  title: string;
  description: string;
  steps: string[];
}

export function getInstallGuideCopy(environment: PwaInstallEnvironment): InstallGuideCopy {
  if (environment.inAppBrowser === 'line') {
    return {
      variant: 'embedded-browser',
      title: 'LINE 內建瀏覽器',
      description: '改用 Safari 或 Chrome，橫向遊玩與雙指操作會更順。',
      steps: ['點右下角「…」', '點「在瀏覽器中開啟」', '回到瀏覽器，再開始遊戲'],
    };
  }
  if (environment.inAppBrowser === 'threads') {
    return {
      variant: 'embedded-browser',
      title: 'Threads 內建瀏覽器',
      description: '改用 Safari 或 Chrome，橫向遊玩與雙指操作會更順。',
      steps: [
        '開啟 Threads 內建瀏覽器的「…」選單',
        '點「在瀏覽器中開啟」',
        '回到瀏覽器，再開始遊戲',
      ],
    };
  }
  if (environment.inAppBrowser) {
    return {
      variant: 'embedded-browser',
      title: '請用外部瀏覽器開啟',
      description: '目前的 App 內建瀏覽器可能限制全螢幕與多指操作，建議改用 Safari 或 Chrome。',
      steps: ['開啟目前 App 的「…」選單', '點「在瀏覽器中開啟」', '回到瀏覽器，再開始遊戲'],
    };
  }
  if (environment.platform === 'android') {
    return {
      variant: 'pwa-install',
      title: '把星噗噗裝進手機',
      description: '安裝後全螢幕遊玩、離線也能玩，從主畫面一點即開。',
      steps: ['點瀏覽器右上角選單', '選「安裝應用程式」', '完成後從主畫面開啟'],
    };
  }
  return {
    variant: 'pwa-install',
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
export function initInstallGuide(
  onEmbeddedBrowserGuideClosed?: (confirmedInSession?: boolean) => void,
): void {
  const environment = readPwaInstallEnvironmentFromBrowser();
  if (!environment.shouldShowGuide || hasDismissedInstallGuide()) return;

  let closeCard: (() => void) | null = null;
  let confirmedInSession = false;

  const confirmGuide = (): void => {
    // localStorage 可能因私密瀏覽或權限策略拒絕寫入；本次明確操作仍算完成，
    // 避免卡片在同一工作階段反覆重排。重新載入後因無法持久化，會再次提供指引。
    confirmedInSession = true;
    rememberDismissedInstallGuide();
  };

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

  const scheduleGuide = (): void => {
    if (hasDismissedInstallGuide()) return;

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
                confirmGuide();
                close();
              }
            })();
          },
        });
      }
      buttons.push({
        label: '知道了',
        onPress: (close) => {
          confirmGuide();
          close();
        },
      });
      const cardOptions: ShellCardOptions = {
        variant: copy.variant,
        title: copy.title,
        description: copy.description,
        steps: copy.steps,
        buttons,
      };
      // 內建瀏覽器只需要外開步驟；不顯示「加入主畫面」插圖，避免把安裝動作
      // 誤認成 LINE／Threads 的外開入口，也避開大手勢圖在小視窗造成額外遮擋。
      if (copy.variant === 'pwa-install') {
        cardOptions.illustration = {
          src: PWA_INSTALL_ILLUSTRATION_URL,
          alt: '噗噗示範在手機瀏覽器加入主畫面',
        };
      }
      closeCard = showShellCard(cardOptions, () => {
        closeCard = null;
        if (environment.inAppBrowser === null) return;
        if (confirmedInSession || hasDismissedInstallGuide()) {
          // 外開卡完成「知道了」後，讓方向引導在同一個工作階段接續。
          onEmbeddedBrowserGuideClosed?.(true);
          return;
        }
        // 開始遊戲自動收卡或 Escape 關卡都不是明確略過；回到 Title 後重新排程
        // 外開提示，避免 one-shot 的 whenShellIdle 讓 LINE／Threads 永久失去指引。
        scheduleGuide();
      });
    }, SHOW_DELAY_MS);
  };

  scheduleGuide();
}
