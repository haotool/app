/**
 * Sentry initialization with lazy loading
 *
 * Lazy loads Sentry SDK to reduce initial bundle size.
 * Initialize only in production or when VITE_SENTRY_DSN is explicitly set.
 *
 * @see https://web.dev/articles/optimize-lcp
 */
import { logger } from './logger';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PROD = import.meta.env.MODE === 'production';
let sentryInitPromise: Promise<void> | null = null;
let didLogMissingDsn = false;

async function initializeSentryOnce(): Promise<void> {
  try {
    // Lazy load Sentry SDK to reduce initial bundle size
    const Sentry = await import('@sentry/react');

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      enabled: IS_PROD || !!SENTRY_DSN, // Enable if prod or DSN explicitly set

      // Performance monitoring
      tracesSampleRate: IS_PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev

      // Error filtering
      beforeSend(event, hint) {
        // Don't send errors in dev unless explicitly testing
        if (!IS_PROD && !import.meta.env.VITE_SENTRY_DEBUG) {
          return null;
        }

        // Filter out expected/handled errors
        const error = hint.originalException;
        if (error instanceof Error) {
          // Skip network errors that are already logged
          if (error.message.includes('Failed to fetch')) {
            return null;
          }
        }

        return event;
      },

      // Integration options
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],

      // Session Replay (only small % in prod to save quota)
      replaysSessionSampleRate: IS_PROD ? 0.01 : 0.1,
      replaysOnErrorSampleRate: IS_PROD ? 0.5 : 1.0,
    });

    logger.info('Sentry initialized', {
      environment: import.meta.env.MODE,
      tracesSampleRate: IS_PROD ? 0.1 : 1.0,
    });
  } catch (error) {
    sentryInitPromise = null;
    logger.error('Failed to initialize Sentry', error as Error);
  }
}

export async function initSentry(): Promise<void> {
  // Only initialize if DSN is provided (production or explicit dev testing)
  if (!SENTRY_DSN) {
    if (!didLogMissingDsn) {
      didLogMissingDsn = true;
      logger.info('Sentry: No DSN configured, skipping initialization');
    }
    return;
  }

  sentryInitPromise ??= initializeSentryOnce();
  await sentryInitPromise;
}

/**
 * Capture exception manually (use sparingly, ErrorBoundary handles most)
 */
export async function captureException(error: Error, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) return;

  const Sentry = await import('@sentry/react');
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/** Add breadcrumb for debugging */
export async function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  if (!SENTRY_DSN) return;

  const Sentry = await import('@sentry/react');
  Sentry.addBreadcrumb({
    message,
    level: 'info',
    data,
  });
}

/** 結構化訊息事件（非 Error，例如 PWA 診斷的可觀性事件） */
export async function captureMessage(
  message: string,
  options?: {
    level?: 'info' | 'warning' | 'error';
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  },
): Promise<void> {
  if (!SENTRY_DSN) return;

  const Sentry = await import('@sentry/react');
  Sentry.captureMessage(message, {
    level: options?.level ?? 'info',
    tags: options?.tags,
    extra: options?.extra,
  });
}
