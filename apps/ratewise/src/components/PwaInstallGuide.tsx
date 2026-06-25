import React from 'react';
import { Compass, Download, ExternalLink, MoreHorizontal, X } from 'lucide-react';
import { APP_INFO } from '../config/app-info';
import { notificationTokens } from '../config/design-tokens';
import {
  type PwaInstallEnvironment,
  readPwaInstallEnvironmentFromBrowser,
} from '../utils/pwaInstallGuide';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSED_KEY = 'ratewise:pwa-install-guide-dismissed:v1';
const SHOW_DELAY_MS = 1800;

function getAssetPath(fileName: string) {
  const basePath = import.meta.env.BASE_URL || '/';
  return `${basePath}pwa-install/${fileName}`;
}

function hasDismissedGuide() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberDismissedGuide() {
  try {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
  } catch {
    // Storage may be blocked in some in-app browsers; closing still works for the current render.
  }
}

function getGuideCopy(environment: PwaInstallEnvironment) {
  const appName = APP_INFO.shortName;

  if (environment.inAppBrowser) {
    return {
      title: '請先用外部瀏覽器開啟',
      description: `Threads、Instagram 等內建瀏覽器無法穩定安裝 PWA。請點右上方 ...，選擇在瀏覽器開啟後再安裝 ${appName}。`,
      steps: ['右上方 ...', '在瀏覽器開啟', `回到 ${appName} 安裝`],
      posterPlatform: environment.platform === 'android' ? 'android' : 'ios',
    } as const;
  }

  if (environment.platform === 'android') {
    return {
      title: `把 ${appName} 安裝到 Android`,
      description: '使用瀏覽器選單安裝後，就能像一般 App 一樣從主畫面快速開啟。',
      steps: ['點選右上方 ⋮', '選擇安裝應用程式', '完成後從主畫面開啟'],
      posterPlatform: 'android',
    } as const;
  }

  return {
    title: `把 ${appName} 加到 iPhone 主畫面`,
    description: '在 Safari 點右下方 ...，再點分享、檢視較多，選擇加入主畫面。',
    steps: ['右下方 ...', '分享', '檢視較多', '加入主畫面'],
    posterPlatform: 'ios',
  } as const;
}

export function PwaInstallGuide() {
  if (typeof window === 'undefined') return null;

  return <PwaInstallGuideClient />;
}

function PwaInstallGuideClient() {
  const [environment, setEnvironment] = React.useState<PwaInstallEnvironment | null>(null);
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const currentEnvironment = readPwaInstallEnvironmentFromBrowser();
    setEnvironment(currentEnvironment);

    if (!currentEnvironment.shouldShowGuide || hasDismissedGuide()) {
      return;
    }

    const timer = window.setTimeout(() => setIsVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      rememberDismissedGuide();
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!environment?.shouldShowGuide || !isVisible) {
    return null;
  }

  const guide = getGuideCopy(environment);
  const posterPrefix =
    guide.posterPlatform === 'android' ? 'android-install-guide' : 'ios-install-guide';
  const canUseNativeInstall = environment.platform === 'android' && deferredPrompt !== null;

  const close = () => {
    rememberDismissedGuide();
    setIsVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      rememberDismissedGuide();
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <aside
      className={`${notificationTokens.position} pointer-events-none -translate-x-1/2`}
      style={
        {
          '--notification-mobile-top-offset': notificationTokens.mobileTopOffset,
        } as React.CSSProperties
      }
      role="dialog"
      aria-modal="false"
      aria-labelledby="pwa-install-guide-title"
      aria-describedby="pwa-install-guide-description"
    >
      <div
        className={`pointer-events-auto relative overflow-hidden ${notificationTokens.borderRadius} ${notificationTokens.shadow} border border-brand-border/60 bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))]`}
      >
        <div
          className={`absolute -right-4 -top-4 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.topRight} ${notificationTokens.decoration.blur}`}
          aria-hidden="true"
        />
        <div
          className={`absolute -bottom-4 -left-4 ${notificationTokens.decoration.size} rounded-full ${notificationTokens.decoration.bottomLeft} ${notificationTokens.decoration.blur}`}
          aria-hidden="true"
        />

        <button
          type="button"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-[rgb(var(--color-text))] shadow-sm backdrop-blur transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="關閉 PWA 安裝提示"
          onClick={close}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <picture>
          <source srcSet={getAssetPath(`${posterPrefix}.avif`)} type="image/avif" />
          <source srcSet={getAssetPath(`${posterPrefix}.webp`)} type="image/webp" />
          <img
            src={getAssetPath(`${posterPrefix}.png`)}
            alt={guide.title}
            width={640}
            height={1349}
            className="block max-h-[45vh] w-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div className="relative space-y-3 px-4 pb-4 pt-3">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-icon-from to-brand-icon-to text-white shadow-card">
              {environment.inAppBrowser ? (
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Download className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2 id="pwa-install-guide-title" className="text-sm font-black leading-5">
                {guide.title}
              </h2>
              <p
                id="pwa-install-guide-description"
                className="mt-1 text-xs leading-5 text-[rgb(var(--color-text-muted))]"
              >
                {guide.description}
              </p>
            </div>
          </div>

          <ol className="grid gap-2 text-xs font-semibold text-[rgb(var(--color-text-secondary))]">
            {guide.steps.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-2 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-3 py-2"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">{step}</span>
                {index === 0 && environment.inAppBrowser ? (
                  <MoreHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : null}
                {index === 1 && environment.inAppBrowser ? (
                  <Compass className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>

          {canUseNativeInstall ? (
            <button
              type="button"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-white shadow-card transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={() => void install()}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              立即安裝 {APP_INFO.shortName}
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export default PwaInstallGuide;
