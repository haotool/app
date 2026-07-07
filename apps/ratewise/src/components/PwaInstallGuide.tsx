import React from 'react';
import { ArrowUpRight, Compass, Download, ExternalLink, MoreHorizontal, X } from 'lucide-react';
import { APP_INFO } from '../config/app-info';
import {
  notificationTokens,
  notificationMobilePositionStyle,
  zIndexTokens,
} from '../config/design-tokens';
import {
  type PwaInstallEnvironment,
  readPwaInstallEnvironmentFromBrowser,
} from '../utils/pwaInstallGuide';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSED_KEY = 'ratewise:pwa-install-guide-dismissed:v1';
// 首次互動後再延遲顯示：對齊 Chrome install promotion 指引（互動後才推薦安裝），
// 亦避免指引成為 LCP 元素拖垮行動端分數（LCP 於首次輸入後凍結）。
// 不含 scroll：程式化捲動（scroll restoration／anchor）會在 LCP 未凍結時誤觸 gate；
// 真實捲動必先觸發 touchstart／wheel／pointerdown 之一，招回損失趨近零。
const SHOW_DELAY_MS = 1800;
const ENGAGEMENT_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const;

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

/**
 * 內建瀏覽器專屬的右上角動態指引。
 * 以彈跳箭頭與擴散光環引導使用者注意宿主 App 右上角的 ... 選單。
 * 純視覺提示（pointer-events-none + aria-hidden），不攔截點擊。
 */
function InAppBrowserCornerPointer() {
  return (
    <div
      data-testid="inapp-corner-pointer"
      className={`pointer-events-none fixed right-3 top-[calc(env(safe-area-inset-top,0px)+0.5rem)] ${zIndexTokens.toast} flex animate-point-up-right items-center gap-1.5`}
      aria-hidden="true"
    >
      <span className="rounded-full bg-[rgb(var(--color-text))]/85 px-2.5 py-1 text-2xs font-bold text-white shadow-card backdrop-blur">
        右上角 ⋯ 開啟選單
      </span>
      <span className="relative inline-flex h-8 w-8 items-center justify-center">
        <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-strong text-white shadow-card">
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </span>
      </span>
    </div>
  );
}

export function PwaInstallGuide() {
  if (typeof window === 'undefined') return null;

  return <PwaInstallGuideClient />;
}

function PwaInstallGuideClient() {
  const [environment, setEnvironment] = React.useState<PwaInstallEnvironment | null>(null);
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  // pwa-install/** 未納入 precache（708KB 超過體積門檻）；離線載圖失敗時隱藏圖區，避免大面積破圖。
  const [posterFailed, setPosterFailed] = React.useState(false);

  React.useEffect(() => {
    const currentEnvironment = readPwaInstallEnvironmentFromBrowser();
    setEnvironment(currentEnvironment);

    if (!currentEnvironment.shouldShowGuide || hasDismissedGuide()) {
      return;
    }

    // 等待首次互動再起算顯示計時：未互動的過客不會被安裝指引打斷，
    // 且 LCP 於首次輸入後凍結，指引海報不再成為 LCP 元素。
    let timer: number | null = null;

    const removeEngagementListeners = () => {
      for (const eventName of ENGAGEMENT_EVENTS) {
        window.removeEventListener(eventName, startTimer);
      }
    };

    function startTimer() {
      removeEngagementListeners();
      timer = window.setTimeout(() => setIsVisible(true), SHOW_DELAY_MS);
    }

    // 內建瀏覽器豁免互動 gate：「請改用外部瀏覽器」屬功能性逃逸引導（非行銷推廣），
    // 且 webview 不在 Lighthouse 量測面內——維持載入後直接起算顯示。
    if (currentEnvironment.inAppBrowser) {
      startTimer();
    } else {
      for (const eventName of ENGAGEMENT_EVENTS) {
        window.addEventListener(eventName, startTimer, { once: true, passive: true });
      }
    }

    return () => {
      removeEngagementListeners();
      if (timer != null) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  React.useEffect(() => {
    const currentEnvironment = readPwaInstallEnvironmentFromBrowser();
    if (!currentEnvironment.shouldShowGuide || currentEnvironment.platform !== 'android') {
      return;
    }

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

  React.useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        rememberDismissedGuide();
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

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

  const isInAppBrowser = Boolean(environment.inAppBrowser);

  return (
    <>
      {isInAppBrowser ? <InAppBrowserCornerPointer /> : null}
      <aside
        className={`${notificationTokens.position} pointer-events-none -translate-x-1/2`}
        style={notificationMobilePositionStyle as React.CSSProperties}
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

          {posterFailed ? null : (
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
                onError={() => setPosterFailed(true)}
              />
            </picture>
          )}

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
                  className="mt-1 text-xs leading-5 text-text-muted"
                >
                  {guide.description}
                </p>
              </div>
            </div>

            <ol className="grid gap-2 text-xs font-semibold text-[rgb(var(--color-text-secondary))]">
              {guide.steps.map((step, index) => {
                // 內建瀏覽器流程：第一步（點右上角 ...）為關鍵動作，給予最強動效強調。
                const isPrimaryStep = isInAppBrowser && index === 0;
                const StepIcon = isInAppBrowser
                  ? index === 0
                    ? MoreHorizontal
                    : index === 1
                      ? Compass
                      : null
                  : null;

                return (
                  <li
                    key={step}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                      isPrimaryStep
                        ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
                        : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))]'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        isPrimaryStep
                          ? 'bg-primary-strong text-white'
                          : 'bg-primary/10 text-primary-on-surface'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">{step}</span>
                    {StepIcon ? (
                      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
                        <StepIcon
                          className="relative h-4 w-4 text-primary-on-surface"
                          aria-hidden="true"
                        />
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>

            {canUseNativeInstall ? (
              <button
                type="button"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-primary-strong px-4 text-sm font-bold text-white shadow-card transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => void install()}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                立即安裝 {APP_INFO.shortName}
              </button>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}

export default PwaInstallGuide;
